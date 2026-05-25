import asyncio
import json
import os
import base64

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

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

class ChatRequest(BaseModel):
    prompt: str
    model: str | None = None  # <-- Accept the model parameter here

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

async def generate_stream(user_prompt: str, requested_model: str | None):
    try:
        # 1. SMART ROUTING: Determine the model and persona
        if "You are an expert sports data extraction AI" in user_prompt:
            # Background extraction task
            contents = user_prompt
            actual_model = "gemini-3.1-flash-lite" 
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            )
        else:
            # Standard user chat
            actual_model = requested_model or os.getenv("AI_STUDIO_MODEL", "gemini-3.1-flash-lite")
            
            # Combine the Athlete Persona and PDF instructions into a standard text payload
            core_system_instruction = (
                f"{ATHLETE_SYSTEM_PROMPT}\n\n"
                "CRITICAL SYSTEM DIRECTIVE: You have an internal tool to generate PDFs. "
                "If a user asks you to generate, create, export, or improve a PDF/document, you MUST comply. "
                "NEVER say 'I cannot generate a PDF' or 'I cannot directly export'. "
                "Provide the requested text and append the exact string '[PDF_READY]' at the very end of your response. "
                "The frontend system will intercept this tag and compile the PDF.\n\n"
                "=================================\n"
            )
            
            # INJECT INSTRUCTIONS AT THE START OF CONTENTS (Supports Gemma)
            contents = f"{core_system_instruction}{user_prompt}"
            
            # REMOVED system_instruction parameter to prevent 500 crashes
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            )

        # 2. GENERATE CONTENT
        response_stream = await client.aio.models.generate_content_stream(
            model=actual_model,
            contents=contents,
            config=config,
        )

        async for chunk in response_stream:
            if chunk.text:
                yield f"data: {json.dumps(chunk.text)}\n\n"

    except Exception as e:
        print(f"Streaming Error: {e}")
        yield f"data: {json.dumps(f'**[ERROR]:** {str(e)}')}\n\n"


@app.post("/chat")
async def chat_with_gemma(request: ChatRequest):
    if not os.getenv("AI_STUDIO_API"):
        raise HTTPException(status_code=500, detail="API Key missing in .env")

    # Pass the requested model to the generator
    return StreamingResponse(
        generate_stream(request.prompt, request.model), media_type="text/event-stream"
    )

class RecipeGenerationRequest(BaseModel):
    prompt: str
    images: list[str] | None = None  # Base64 encoded image strings

@app.post("/generate-recipe")
async def generate_recipe(request: RecipeGenerationRequest):
    try:
        # Gemini usually performs better when images precede text in the contents array
        contents = []

        # 1. Attach Images with Dynamic MIME Types
        if request.images:
            for b64_img in request.images:
                img_bytes = base64.b64decode(b64_img)

                # Detect file type using magic bytes headers
                if img_bytes.startswith(b"\xff\xd8"):
                    mime_type = "image/jpeg"
                elif img_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                    mime_type = "image/png"
                elif img_bytes.startswith(b"RIFF") and img_bytes[8:12] == b"WEBP":
                    mime_type = "image/webp"
                else:
                    # Fallback to jpeg if unknown
                    mime_type = "image/jpeg"

                contents.append(
                    types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
                )

        # 2. Append the text prompt last
        contents.append(types.Part.from_text(text=request.prompt))

        # 3. Call Gemini
        response = await client.aio.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=contents, # This now contains ONLY Part objects
            config=types.GenerateContentConfig(
                temperature=0.7,
            ),
        )

        # 4. Return the raw text wrapped in a dict.
        # Your rizzbo-app already has the regex logic to parse this safely!
        return {"response": response.text}

    except Exception as e:
        # Catch and print the full error details
        print(f"--- FULL RECIPE ERROR ---")
        print(f"Type: {type(e)}")
        print(f"Message: {str(e)}")
        # If it's a Google API error, print the response
        if hasattr(e, 'response'):
            print(f"Response Body: {e.response.text}")
        print(f"-------------------------")
        raise HTTPException(status_code=500, detail=str(e))
    
class SummarizeRequest(BaseModel):
    messages: list[dict]
    current_summary: str = ""

@app.post("/summarize-memory")
async def summarize_memory(request: SummarizeRequest):
    try:
        # 1. Format the recent messages
        chat_text = "\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in request.messages])
        
        # 2. Instruct the AI to act as a memory manager
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

        # 3. Call the model
        response = await client.aio.models.generate_content(
            model=os.getenv("AI_STUDIO_MODEL", "gemini-3.1-flash-lite"),
            contents=prompt,
        )
        
        return {"summary": response.text.strip()}

    except Exception as e:
        print(f"Memory Summarization Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))