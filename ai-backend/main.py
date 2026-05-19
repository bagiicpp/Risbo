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


ATHLETE_SYSTEM_PROMPT = (
    "You are Risbo, a specialized AI assistant for athletes, coaches, and sports analysts. "
    "Your expertise includes deep knowledge of football (soccer) and basketball players, their detailed statistics, and performance analysis. "
    "You can process and analyze player stats provided in the context (acting as if you are searching the internet or reading provided documents). "
    "You are also skilled at evaluating emerging talents and discussing who looks like the best prospect. "
    "Additionally, you provide rigorous, data-driven advice on improving training, biomechanics, basic nutrition, and recovery. "
    "If a user asks something unrelated to sports, player statistics, or training, politely steer the conversation back to the sports domain."
)


async def generate_stream(user_prompt: str):
    try:
        # Spajamo sistemski prompt direktno sa korisničkim promptom.
        # Ovo sprečava 500 Internal Error jer Gemma modeli često ne podržavaju system_instruction parametar.
        combined_prompt = f"{ATHLETE_SYSTEM_PROMPT}\n\n{user_prompt}"

        # Request a stream from the model
        stream = client.models.generate_content_stream(
            model=os.getenv("AI_STUDIO_MODEL", "gemma-4-26b-a4b-it"),
            contents=combined_prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )

        for chunk in stream:
            if chunk.text:
                # SSE standard: data must be prefixed with 'data: ' and end with '\n\n'
                yield f"data: {json.dumps(chunk.text)}\n\n"
                # Small sleep to ensure smooth event loop handling
                await asyncio.sleep(0.01)

    except Exception as e:
        print(f"Streaming Error: {e}")
        yield f"data: {json.dumps(f'**[ERROR]:** {str(e)}')}\n\n"


@app.post("/chat")
async def chat_with_gemma(request: ChatRequest):
    # Verify the API key exists before starting the stream
    if not os.getenv("AI_STUDIO_API"):
        raise HTTPException(
            status_code=500, detail="API Key missing in .env"
        )

    return StreamingResponse(
        generate_stream(request.prompt), media_type="text/event-stream"
    )
