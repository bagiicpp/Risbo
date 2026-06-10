import asyncio
import base64
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from football_data import get_football_context
from google import genai
from google.genai import types
from pydantic import BaseModel
from football_data import get_football_context
from typing import Union
from intent import classify_intent
from pydantic import BaseModel
from search import bilingual_search
try:
    from wiki_search import WikiSearcher, build_wiki_context
except Exception as _wiki_import_err:
    import logging as _logging
    _logging.getLogger(__name__).error("[wiki] import failed, wiki search disabled: %s", _wiki_import_err)
    WikiSearcher = None  # type: ignore[assignment,misc]
    def build_wiki_context(*_a, **_kw):  # type: ignore[misc]
        return None

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

# Built once at startup (BM25 index over the curated wiki) and reused for every request.
wiki_searcher: WikiSearcher | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global wiki_searcher
    try:
        wiki_searcher = WikiSearcher()
    except Exception as e:
        # Never let a wiki indexing failure take the whole AI backend down —
        # the LLM can still answer from its own knowledge / web search.
        logger.error(f"[WikiSearcher] failed to build index: {e}")
        wiki_searcher = None
    yield


app = FastAPI(title="Risbo AI - Athlete Specialization", lifespan=lifespan)

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
    content: Union[str, list]


class ChatRequest(BaseModel):
    messages: list[MessagePayload]
    model: str | None = None
    enable_search: bool = False
    search_query: str | None = (
        None  # clean original user text, used for search so context injections don't pollute the query
    )
    user_profile: dict | None = (
        None  # onboarding profile, personalizes the system prompt
    )


def format_search_results_for_prompt(results: list[dict]) -> str:
    """
    Converts smart_search results into a readable block injected into the LLM prompt.
    Uses full article content when available (news extractions), otherwise falls back
    to the search snippet.
    """
    if not results:
        return ""
    lines = [
        "[WEB SEARCH RESULTS — use these to answer the user's question accurately]"
    ]
    for i, r in enumerate(results, 1):
        body = r.get("content") or r.get("snippet", "")
        label = "Article" if r.get("content") else "Snippet"
        lines.append(
            f"\n[{i}] {r['tier']} — {r['title']}\nURL: {r['url']}\n{label}: {body}"
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


_ROLE_GUIDANCE = {
    "coach": "The user is a COACH — prioritize team management, roster analysis, "
    "training load monitoring, and periodization.",
    "athlete": "The user is an ATHLETE — prioritize personal training, recovery, "
    "and individual performance improvement.",
    "scout": "The user is a SCOUT — prioritize player profiling, transfer values, "
    "and prospect evaluation.",
    "analyst": "The user is an ANALYST — prioritize advanced stats, data-driven "
    "metrics, and structured data the user can export.",
}

_FOCUS_GUIDANCE = {
    "tactics": "tactical analysis",
    "player_analysis": "individual player analysis",
    "training": "training methodology",
    "scouting": "scouting and prospect evaluation",
    "nutrition": "nutrition and recovery",
}


def build_system_prompt(profile: dict | None) -> str:
    """
    Extends ATHLETE_SYSTEM_PROMPT with personalization from the onboarding profile.
    Handles the nested MongoDB architecture defensively.
    """
    if not profile:
        return ATHLETE_SYSTEM_PROMPT

    lines: list[str] = []

    # Defensive check: Extract nested sport_profile dict
    sport_profile = (
        profile.get("sport_profile")
        if isinstance(profile.get("sport_profile"), dict)
        else profile
    )

    # 1. Parse Role (Root level)
    role = (profile.get("role") or "").lower()
    if role in _ROLE_GUIDANCE:
        lines.append(_ROLE_GUIDANCE[role])

    # 2. Parse Sports (Nested level)
    sports = [s for s in (sport_profile.get("sport") or []) if s]
    if sports:
        pretty = " and ".join(s.capitalize() for s in sports)
        lines.append(
            f"Prioritize {pretty} in your answers and reference the most relevant "
            f"data sources for {'these sports' if len(sports) > 1 else 'this sport'}."
        )

    # 3. Parse Team and League (Nested level)
    team = (sport_profile.get("team") or "").strip()
    league = (sport_profile.get("league") or "").strip()
    if team or league:
        env = " / ".join(p for p in (team, league) if p)
        lines.append(
            f"The user follows or works with: {env}. Reference this environment "
            "when it's relevant to the question."
        )

    # 4. Parse Focus Options (Nested level)
    focus = [
        _FOCUS_GUIDANCE[f]
        for f in (sport_profile.get("focus") or [])
        if f in _FOCUS_GUIDANCE
    ]
    if focus:
        lines.append(f"Put extra emphasis on: {', '.join(focus)}.")

    # 5. Parse Preferences (Root level)
    prefs = profile.get("preferences", {})
    if prefs.get("measurement_system"):
        lines.append(
            f"Use the {prefs['measurement_system']} system for all measurements and stats."
        )
    if prefs.get("dietary_preference") and prefs["dietary_preference"] != "none":
        lines.append(
            f"The user's dietary preference is: {prefs['dietary_preference']}."
        )

    if not lines:
        return ATHLETE_SYSTEM_PROMPT

    return (
        f"{ATHLETE_SYSTEM_PROMPT}\n\n"
        "[USER PROFILE — personalize your responses accordingly]\n"
        + "\n".join(f"- {l}" for l in lines)
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
async def _make_search_query(raw_prompt: str, intent: str = "general") -> str:
    """
    Translates and reformulates any-language user prompt into an optimised
    English web search query using a fast Gemini call (temp=0, ≤50 tokens).
    For stats intent, adds a hint to return full standings/table pages.
    Falls back to the original prompt if the call fails.
    """
    stats_hint = (
        " The query must target pages with FULL standings tables listing ALL positions, "
        "not just top teams. Prefer sites like fbref, worldfootball, soccerway, soccerstats."
        if intent == "stats"
        else ""
    )
    prompt = (
        "Convert this user question into a concise English web search query. "
        f"Output ONLY the query string, no explanation, no quotes.{stats_hint}\n\n"
        f"Question: {raw_prompt}"
    )
    try:
        resp = await safe_generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0, max_output_tokens=50),
        )
        return resp.text.strip()
    except Exception:
        return raw_prompt


async def generate_stream(
    messages: list[MessagePayload],
    requested_model: str | None,
    enable_search: bool = False,
    search_query: str | None = None,
    user_profile: dict | None = None,
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
        personalized_prompt = build_system_prompt(user_profile)
        core_system_instruction = (
            f"CRITICAL CONTEXT: Today's date is {current_date}.\n\n"
            f"{personalized_prompt}\n\n"
            "CRITICAL SYSTEM DIRECTIVE: You have an internal tool to generate PDFs. "
            "If a user asks you to generate, create, export, or improve a PDF/document, you MUST comply. "
            "NEVER say 'I cannot generate a PDF' or 'I cannot directly export'. "
            "Provide the requested text and append the exact string '[PDF_READY]' at the very end of your response. "
            "The frontend system will intercept this tag and compile the PDF.\n\n"
            "WEB SEARCH DIRECTIVE: ONLY append '[NEEDS_WEB_SEARCH]' if the user asks about "
            "events from the LAST 30 DAYS specifically — live scores today, transfers this week, "
            "injuries announced recently, current standings of an ongoing season. "
            "For general player stats, career info, historical data, training advice, tactical "
            "analysis, or anything you can answer confidently from training data — answer directly "
            "WITHOUT this tag. "
            "If a [WEB SEARCH RESULTS] block exists anywhere in this conversation — NEVER append "
            "this tag, use those results directly. "
            "IMPORTANT: Always provide a substantive answer first; never output ONLY the tag alone.\n\n"
            "STRICTLY FORBIDDEN: Do not output '🌐 Searching the web...' or similar status markers in your final response.\n\n"
            "KNOWLEDGE DIRECTIVE: A [RISBO KNOWLEDGE BASE] block may be injected with curated "
            "sports reference — treat it as primary grounding and supplement it with your own "
            "expertise. When neither the knowledge base nor web results fully cover the question, "
            "answer confidently from your own expert sports knowledge. You are a sports expert: "
            "NEVER reply that you lack information, don't know, or cannot help on a sports topic — "
            "always give a substantive, useful answer.\n\n"
            "=================================\n"
        )
        config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=8192,
            system_instruction=core_system_instruction,
        )

        # Build the structured types.Content array required by Google SDK
        formatted_contents = []
        for msg in messages:
            role = "model" if msg.role in ["assistant", "model"] else "user"

            if isinstance(msg.content, list):
                # Multipart message — may contain image + text blocks
                parts = []
                for block in msg.content:
                    if block.get("type") == "image":
                        src = block["source"]
                        img_bytes = base64.b64decode(src["data"])
                        parts.append(types.Part.from_bytes(data=img_bytes, mime_type=src["media_type"]))
                    elif block.get("type") == "text":
                        parts.append(types.Part.from_text(text=block["text"]))
                formatted_contents.append(types.Content(role=role, parts=parts))
            else:
                formatted_contents.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=msg.content)])
                )

    # Track which data sources were actually used this turn (sent to client for debugging).
    football_ctx = None
    wiki_ctx = None
    search_block = ""

    # --- FOOTBALL DATA INJECTION (always active) ---
    # detect_league_code() is an instant string lookup — no HTTP cost unless a
    # supported league is found. Runs regardless of enable_search so users get
    # live standings/results without needing to toggle web search.
    if isinstance(formatted_contents, list) and formatted_contents:
        last_content = messages[-1].content
        raw = search_query or (last_content if isinstance(last_content, str) else "")
        intent = classify_intent(raw)
        # Single English reformulation, reused by football, wiki and web below
        # (one Gemini call per turn — keeps token usage down).
        query = await _make_search_query(raw, intent=intent)
        try:
            football_ctx = await get_football_context(query)
        except Exception as e:
            logger.warning(f"[football-data] failed: {e}")

        if football_ctx:
            last = formatted_contents[-1]
            prefix = (
                f"{football_ctx}\n\n"
                "[SYSTEM: Structured football data injected above. "
                "Use it to answer accurately. DO NOT output [NEEDS_WEB_SEARCH].]\n\n"
            )
            formatted_contents[-1] = types.Content(
                role=last.role,
                parts=[types.Part.from_text(text=prefix + last.parts[0].text)],
            )
            logger.info("[football-data] injected structured data")

        # --- WIKI KNOWLEDGE BASE INJECTION (curated local RAG, always active) ---
        # Local BM25 over wiki/chunks. Reuses the English `query` above — no extra
        # LLM call. Skipped when football-data already injected live structured data.
        if not football_ctx and wiki_searcher:
            try:
                wiki_ctx = build_wiki_context(wiki_searcher, query, user_profile)
            except Exception as e:
                wiki_ctx = None
                logger.warning(f"[wiki] search failed: {e}")
            if wiki_ctx:
                last = formatted_contents[-1]
                prefix = (
                    f"{wiki_ctx}\n\n"
                    "[SYSTEM: The knowledge base above is curated Risbo reference. "
                    "Use it as primary grounding, but SUPPLEMENT freely with your own "
                    "expert knowledge. ALWAYS give a confident, substantive answer. "
                    "NEVER say you lack information or cannot help.]\n\n"
                )
                formatted_contents[-1] = types.Content(
                    role=last.role,
                    parts=[types.Part.from_text(text=prefix + last.parts[0].text)],
                )
                logger.info("[wiki] injected curated context")

    # --- WEB SEARCH INJECTION ---
    # Runs BEFORE the LLM call so results are baked into the prompt.
    # Skipped if football-data already handled the query.
    if enable_search and isinstance(formatted_contents, list) and formatted_contents:
        # Reuse raw/intent/query computed above — no second Gemini call.
        logger.info(f"[search] intent={intent!r} query={query[:80]!r}")
        search_block = ""

        # Only run web search if football-data didn't already inject data
        if not football_ctx:
            try:
                # Original language first, then English, best of both combined.
                search_results = await bilingual_search(
                    raw, query, max_results=8, intent=intent
                )
                search_block = format_search_results_for_prompt(search_results)
            except Exception as e:
                logger.warning(
                    f"[search] bilingual_search failed, proceeding without results: {e}"
                )

        last = formatted_contents[-1]
        if search_block:
            prefix = (
                f"{search_block}\n\n"
                "[SYSTEM: Web search has already been performed for this turn. "
                "DO NOT output [NEEDS_WEB_SEARCH]. Answer using the results above, "
                "even if incomplete — acknowledge any gaps explicitly.]\n\n"
            )
        else:
            prefix = (
                "[SYSTEM: Web search was attempted but returned no results. "
                "Answer from your training data as best you can. "
                "DO NOT output [NEEDS_WEB_SEARCH].]\n\n"
            )
        formatted_contents[-1] = types.Content(
            role=last.role,
            parts=[types.Part.from_text(text=prefix + last.parts[0].text)],
        )

    # Emit source metadata so the browser console can show what grounded this turn.
    used_sources = []
    if football_ctx:
        used_sources.append("football")
    if wiki_ctx:
        used_sources.append("wiki")
    if search_block:
        used_sources.append("web")
    yield f"data: {json.dumps({'__sources': used_sources}, ensure_ascii=False)}\n\n"

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
                    yield f"data: {json.dumps(chunk.text, ensure_ascii=False)}\n\n"

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
            user_profile=request.user_profile,
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
