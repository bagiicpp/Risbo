import ollama
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    prompt: str


@app.post("/test-chat")
async def test_chat(request: ChatRequest):
    # This calls your local Ollama instance
    response = ollama.chat(
        model="llama3.1",
        messages=[
            {
                "role": "user",
                "content": request.prompt,
            },
        ],
    )
    return {"response": response["message"]["content"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
