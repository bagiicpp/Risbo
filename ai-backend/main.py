import asyncio
import base64
import json
import logging
import os
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel
from intent import classify_intent
from search import smart_search


# --- Tenacity for robust API retries ---
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

load_dotenv()

# Set up logging so you can monitor Google's flakiness in your Docker console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Risbo AI - Athlete Specialization")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
async def ping():
    return {"status": "ok", "service": "ai-backend"}


# Initialize the Google GenAI Client
client = genai.Client(api_key=os.getenv("AI_STUDIO_API"))


class MessagePayload(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[MessagePayload]
    model: str | None = None
    enable_search: bool = False
    search_query: str | None = None  # clean original user text, used for search so context injections don't pollute the query


def format_search_results_for_prompt(results: list[dict]) -> str:
    """Converts smart_search results into a readable block injected into the LLM prompt."""
    if not results:
        return ""
    lines = ["[WEB SEARCH RESULTS — use these to answer the user's question accurately]"]
    for i, r in enumerate(results, 1):
        lines.append(
            f"\n[{i}] {r['tier']} — {r['title']}\n"
            f"URL: {r['url']}\n"
            f"Excerpt: {r['snippet']}"
        )
    lines.append("\n[END WEB SEARCH RESULTS]")
    return "\n".join(lines)

ATHLETE_SYSTEM_PROMPT = (
    "You are Risbo, a specialized AI assistant for athletes, coaches, and sports analysts. "
    "Your expertise includes deep knowledge of football (soccer) and basketball players, their detailed statistics, and performance analysis. "
    "You can process and analyze player stats provided in the context (acting as if you are searching the internet or reading provided documents). "
    "You are also skilled at evaluating emerging talents and discussing who looks like the best prospect. "
    "Additionally, you provide rigorous, data-driven advice on improving training, biomechanics, basic nutrition, and recovery. "
    "If the user is a COACH, you will be provided with a [ROSTER CONTEXT] block containing their team's latest extracted data. "
    "Use this roster data to generate team reports, spot overtraining trends, congratulate PRs, and suggest roster-wide adjustments when asked. "
    "If a user asks something unrelated to sports, player statistics, or training, politely steer the conversation back to the sports domain."
)


@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(Exception),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def safe_generate_content(model: str, contents: list | str, config=None):
    """A fault-tolerant wrapper for Google's non-streaming content generation."""
    return await client.aio.models.generate_content(
        model=model, contents=contents, config=config
    )


# ==============================================================================
# RESILIENCE LAYER: STREAMING ENDPOINT
# ==============================================================================
async def generate_stream(
    messages: list[MessagePayload],
    requested_model: str | None,
    enable_search: bool = False,
    search_query: str | None = None,
):
    """
    State-aware retry loop supporting native structured multi-turn conversation arrays.
    If enable_search=True, runs smart_search() before calling the LLM and injects
    the results into the last user message.
    """
    # Grab the actual user prompt (the last message in the array) to check for background tasks
    latest_user_prompt = messages[-1].content if messages else ""

    if "You are an expert sports data extraction AI" in latest_user_prompt:
        # Background extraction task runs independently without history
        actual_model = "gemini-3.1-flash-lite"
        config = types.GenerateContentConfig(temperature=0.7, max_output_tokens=2048)
        formatted_contents = latest_user_prompt
    else:
        actual_model = requested_model or os.getenv(
            "AI_STUDIO_MODEL", "gemini-3.1-flash-lite"
        )
        current_date = datetime.now().strftime("%B %d, %Y")
        core_system_instruction = (
            f"CRITICAL CONTEXT: Today's date is {current_date}.\n\n"
            f"{ATHLETE_SYSTEM_PROMPT}\n\n"
            "CRITICAL SYSTEM DIRECTIVE: You have an internal tool to generate PDFs. "
            "If a user asks you to generate, create, export, or improve a PDF/document, you MUST comply. "
            "NEVER say 'I cannot generate a PDF' or 'I cannot directly export'. "
            "Provide the requested text and append the exact string '[PDF_READY]' at the very end of your response. "
            "The frontend system will intercept this tag and compile the PDF.\n\n"
            "WEB SEARCH DIRECTIVE: If the user asks about real-time or recent data "
            "(live scores, recent transfers, current standings, injuries, news, or anything "
            "time-sensitive that you cannot answer confidently from your training data), "
            "provide your best answer and append the exact string '[NEEDS_WEB_SEARCH]' at the "
            "very end of your response. The system will detect this and automatically retry "
            "with a live web search. Do NOT append this tag if [WEB SEARCH RESULTS] are "
            "already provided above — those results are current, use them directly.\n\n"
            "=================================\n"
        )
        config = types.GenerateContentConfig(temperature=0.7, max_output_tokens=8192)

        # Build the structured types.Content array required by Google SDK
        formatted_contents = []
        for i, msg in enumerate(messages):
            # Ensure roles map exactly to what Google expects ("user" or "model")
            role = "model" if msg.role in ["assistant", "model"] else "user"
            content = msg.content

            # To avoid the 500 crashes associated with the system_instruction config,
            # we securely prepend the persona directives to the VERY FIRST message in the history.
            if i == 0 and role == "user":
                content = f"{core_system_instruction}\n\n{content}"

            formatted_contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=content)])
            )

    # --- WEB SEARCH INJECTION ---
    # Runs BEFORE the LLM call so results are baked into the prompt.
    if enable_search and isinstance(formatted_contents, list) and formatted_contents:
        query = search_query or (messages[-1].content if messages else "")
        intent = classify_intent(query)
        logger.info(f"[search] intent={intent!r} query={query[:80]!r}")
        try:
            search_results = await smart_search(query, max_results=8, intent=intent)
            search_block = format_search_results_for_prompt(search_results)
            if search_block:
                last = formatted_contents[-1]
                augmented_text = f"{search_block}\n\n{last.parts[0].text}"
                formatted_contents[-1] = types.Content(
                    role=last.role,
                    parts=[types.Part.from_text(text=augmented_text)],
                )
        except Exception as e:
            logger.warning(f"[search] smart_search failed, proceeding without results: {e}")

    max_retries = 3
    base_wait = 2

    for attempt in range(max_retries):
        chunks_yielded = 0
        try:
            response_stream = await client.aio.models.generate_content_stream(
                model=actual_model,
                contents=formatted_contents,  # Send the structured array!
                config=config,
            )

            async for chunk in response_stream:
                if chunk.text:
                    chunks_yielded += 1
                    yield f"data: {json.dumps(chunk.text)}\n\n"

            break

        except Exception as e:
            logger.error(f"Stream failed on attempt {attempt + 1}/{max_retries}: {e}")

            if chunks_yielded > 0:
                error_msg = "\n\n**[Connection Interrupted]** Google's server dropped the connection. Please try again."
                yield f"data: {json.dumps(error_msg)}\n\n"
                break
            elif attempt < max_retries - 1:
                await asyncio.sleep(base_wait * (2**attempt))
                continue
            else:
                yield f"data: {json.dumps(f'**[ERROR]:** Failed to reach AI backend after {max_retries} attempts.')}\n\n"
                break


@app.post("/chat")
async def chat_with_gemma(request: ChatRequest):
    if not os.getenv("AI_STUDIO_API"):
        raise HTTPException(status_code=500, detail="API Key missing in .env")

    return StreamingResponse(
        generate_stream(
            request.messages,
            request.model,
            enable_search=request.enable_search,
            search_query=request.search_query,
        ),
        media_type="text/event-stream",
    )


class RecipeGenerationRequest(BaseModel):
    prompt: str
    images: list[str] | None = None


@app.post("/generate-recipe")
async def generate_recipe(request: RecipeGenerationRequest):
    try:
        contents = []

        if request.images:
            for b64_img in request.images:
                img_bytes = base64.b64decode(b64_img)

                if img_bytes.startswith(b"\xff\xd8"):
                    mime_type = "image/jpeg"
                elif img_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                    mime_type = "image/png"
                elif img_bytes.startswith(b"RIFF") and img_bytes[8:12] == b"WEBP":
                    mime_type = "image/webp"
                else:
                    # TECH DEBT WARNING: If a user uploads an HEIC file from an iPhone,
                    # it will fall into this block, be labeled as JPEG, and crash the
                    # Google decoder with a 500 error that Tenacity cannot fix.
                    mime_type = "image/jpeg"

                contents.append(
                    types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
                )

        contents.append(types.Part.from_text(text=request.prompt))

        # Use the fault-tolerant wrapper instead of calling the client directly
        response = await safe_generate_content(
            model="gemini-3.1-flash-lite",
            contents=contents,
            config=types.GenerateContentConfig(temperature=0.7),
        )

        return {"response": response.text}

    except Exception as e:
        logger.error(f"Recipe Generation Failed after retries: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="AI microservice failed to respond. Please try again.",
        )


class SummarizeRequest(BaseModel):
    messages: list[dict]
    current_summary: str = ""


@app.post("/summarize-memory")
async def summarize_memory(request: SummarizeRequest):
    try:
        chat_text = "\n".join(
            [
                f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
                for m in request.messages
            ]
        )

        prompt = (
            "You are an expert AI memory manager. Your task is to update a user's long-term profile based on their recent chat history.\n"
            "Extract ONLY permanent facts: physical conditions, injuries, specific goals, diet preferences, and PRs.\n"
            "Do NOT include conversational filler, greetings, or temporary states.\n\n"
        )

        if request.current_summary:
            prompt += f"EXISTING MEMORY SUMMARY:\n{request.current_summary}\n\n"
            prompt += "INSTRUCTION: Merge the following new chat details into the existing summary. Keep it strictly under 150 words.\n\n"
        else:
            prompt += "INSTRUCTION: Create a new bulleted summary from this chat. Keep it under 150 words.\n\n"

        prompt += f"RECENT CHAT:\n{chat_text}"

        # Use the fault-tolerant wrapper
        response = await safe_generate_content(
            model=os.getenv("AI_STUDIO_MODEL", "gemini-3.1-flash-lite"),
            contents=prompt,
        )

        return {"summary": response.text.strip()}

    except Exception as e:
        logger.error(f"Memory Summarization Failed after retries: {str(e)}")
        raise HTTPException(status_code=500, detail="Summarization failed.")
