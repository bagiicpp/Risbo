import asyncio
import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from ollama import AsyncClient  # <-- Switch to Ollama's async client
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

# Initialize the Ollama AsyncClient using the host URL from .env
ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
client = AsyncClient(host=ollama_host)


class ChatRequest(BaseModel):
    prompt: str


ATHLETE_SYSTEM_PROMPT = (
    "You are Risbo, a specialized AI assistant for athletes, coaches, and sports scientists. "
    "Your expertise includes biomechanics, nutrition timing, hypertrophy, and recovery. "
    "Provide rigorous, data-driven advice. If a user asks something unrelated to fitness or sports, "
    "politely steer the conversation back to the athletic domain."
)


async def generate_stream(user_prompt: str):
    model_name = os.getenv("AI_STUDIO_MODEL", "gemma3:4b")
    try:
        # Build structured message role-history to supply system prompt instructions
        messages = [
            {"role": "system", "content": ATHLETE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

        # Call Ollama asynchronously with streaming enabled
        response_stream = await client.chat(
            model=model_name,
            messages=messages,
            stream=True,
            options={
                "temperature": 0.7,
                "num_ctx": 8192,  # <-- Sets Ollama's context memory to its 8k limit
            },
        )

        async for chunk in response_stream:
            # Safely navigate chunk dictionaries or objects for text content
            content = chunk.get("message", {}).get("content", "")
            if content:
                yield f"data: {json.dumps(content)}\n\n"

    except Exception as e:
        print(f"Ollama Streaming Error: {e}")
        yield f"data: {json.dumps(f'**[ERROR]:** {str(e)}')}\n\n"


@app.post("/chat")
async def chat_with_gemma(request: ChatRequest):
    if not os.getenv("AI_API"):
        raise HTTPException(
            status_code=500, detail="AI_API designation missing in .env"
        )

    return StreamingResponse(
        generate_stream(request.prompt), media_type="text/event-stream"
    )
