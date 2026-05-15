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

# Initialize the Google GenAI Client
client = genai.Client(api_key=os.getenv("AI_STUDIO_API"))


class ChatRequest(BaseModel):
    prompt: str


ATHLETE_SYSTEM_PROMPT = (
    "You are Risbo, a specialized AI assistant for athletes, coaches, and sports scientists. "
    "Your expertise includes biomechanics, nutrition timing, hypertrophy, and recovery. "
    "Provide rigorous, data-driven advice. If a user asks something unrelated to fitness or sports, "
    "politely steer the conversation back to the athletic domain."
)


async def generate_stream(user_prompt: str):
    try:
        response_stream = await client.aio.models.generate_content_stream(
            model=os.getenv("AI_STUDIO_MODEL", "gemma-4-26b-a4b-it"),
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=ATHLETE_SYSTEM_PROMPT,
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

    return StreamingResponse(
        generate_stream(request.prompt), media_type="text/event-stream"
    )
