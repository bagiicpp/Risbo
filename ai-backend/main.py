from fastapi import FastAPI

app = FastAPI(title="RizzBo AI Backend")


@app.get("/ping")
async def ping():
    return {"status": "ok", "service": "ai-backend"}