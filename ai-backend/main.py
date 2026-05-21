import asyncio
import json
import os

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
    "If a user asks something unrelated to sports, player statistics, or training, politely steer the conversation back to the sports domain."
)

async def generate_stream(user_prompt: str, requested_model: str | None):
    try:
        # 1. SMART ROUTING: Determine the model and persona
        if "You are an expert sports data extraction AI" in user_prompt:
            combined_prompt = user_prompt
            # Always force a fast/cheap model for invisible background tasks!
            actual_model = "gemini-2.5-flash" 
        else:
            combined_prompt = f"{ATHLETE_SYSTEM_PROMPT}\n\n{user_prompt}"
            # Use the requested model, or fallback to the .env default
            actual_model = requested_model or os.getenv("AI_STUDIO_MODEL", "gemini-2.5-flash")

        # 2. GENERATE CONTENT
        response_stream = await client.aio.models.generate_content_stream(
            model=actual_model,
            contents=combined_prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            ),
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