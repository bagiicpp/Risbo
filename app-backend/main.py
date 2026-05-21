import asyncio
import io
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import httpx
from auth import (
    create_access_token,
    get_current_user_email,
    get_optional_user_email,
    get_password_hash,
    verify_password,
)
from bson import ObjectId
from bson.errors import InvalidId
from bson.objectid import ObjectId
from docx import Document
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from models import ChatRequest, Conversation, Message, Token, UserCreate, UserInDB
from motor.motor_asyncio import AsyncIOMotorClient
from utils import extract_text_from_file

load_dotenv()

# Global database client
db_client = None
db = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB on startup
    global db_client, db
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/rizzbo")
    db_client = AsyncIOMotorClient(mongodb_uri)
    db = db_client.get_database()
    print("✅ Connected to MongoDB")

    yield

    # Clean up on shutdown
    db_client.close()
    print("❌ Disconnected from MongoDB")


app = FastAPI(title="RizzBo App Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],  # <--- ADD THIS LINE
)


@app.get("/ping")
async def ping():
    return {"status": "ok", "service": "app-backend"}


@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    hashed_pwd = get_password_hash(user.password)

    user_doc = {
        "email": user.email,
        "name": user.name.strip(),
        "hashed_password": hashed_pwd,
        "plan": "Free plan",
        "created_at": datetime.now(timezone.utc),
    }

    await db.users.insert_one(user_doc)

    return {"message": "User successfully created"}


@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):

    user_doc = await db.users.find_one({"email": form_data.username})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token_payload = {
        "sub": user_doc["email"],
        "name": user_doc.get("name", "User"),
        "plan": user_doc.get("plan", "Free plan"),
    }

    access_token = create_access_token(data=token_payload)
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/upload/{conversation_id}")
async def upload_document(
    conversation_id: str,
    file: UploadFile = File(...),
    email: Optional[str] = Depends(get_optional_user_email),
):
    if not email:
        raise HTTPException(
            status_code=401, detail="Must be logged in to upload documents"
        )

    # Find User
    user = await db.users.find_one({"email": email})
    user_id = str(user["_id"]) if user else None

    # 1. Extract the text
    content = await file.read()
    extracted_text = await extract_text_from_file(content, file.filename)
    extracted_text = extracted_text[:15000]

    # 2. Prepare the Hidden Context Message (for the AI)
    sys_msg = {
        "role": "system",
        "content": f"[USER UPLOADED DOCUMENT: {file.filename}]\n\n{extracted_text}",
        "timestamp": datetime.now(timezone.utc),
    }

    # 3. Prepare the Visible Receipt Message (for the UI)
    ui_msg = {
        "role": "assistant",
        "content": f"📄 **Document Processed:** `{file.filename}`\n\nI have added this to my context. You can now ask me questions about it.",
        "timestamp": datetime.now(timezone.utc),
    }

    is_valid_id = ObjectId.is_valid(conversation_id)

    if not is_valid_id:
        new_db_id = ObjectId()
        new_conv = {
            "_id": new_db_id,
            "user_id": user_id,
            "title": f"{file.filename[:20]}",
            "messages": [sys_msg, ui_msg],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        await db.conversations.insert_one(new_conv)

        return {
            "message": "Document processed and chat created",
            "filename": file.filename,
            "conversation_id": str(new_db_id),
        }
    else:
        result = await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$push": {"messages": {"$each": [sys_msg, ui_msg]}},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {
            "message": "Document processed",
            "filename": file.filename,
            "conversation_id": conversation_id,
        }


async def generate_title_background(
    conversation_id: str, first_prompt: str, ai_backend_url: str
):
    system_instruction = (
        "You are a precise title generator. Create a concise, professional title (3-5 words) "
        "summarizing the user request. Do not include quotes, punctuation, markdown formatting, "
        "or filler text. Return ONLY the raw title string."
    )

    title_prompt = f"{system_instruction}\n\nUser Request: {first_prompt}"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{ai_backend_url}/chat", json={"prompt": title_prompt}
            )
            response.raise_for_status()

            raw_title = ""
            for line in response.text.splitlines():
                if line.startswith("data: "):
                    try:
                        clean_chunk = json.loads(line.replace("data: ", ""))
                        raw_title += clean_chunk
                    except json.JSONDecodeError:
                        pass

            refined_title = raw_title.strip().replace('"', "").replace("'", "")[:40]

            if refined_title:
                await db.conversations.update_one(
                    {"_id": ObjectId(conversation_id)},
                    {
                        "$set": {
                            "title": refined_title,
                            "updated_at": datetime.utcnow(),
                        }
                    },
                )
    except httpx.TimeoutException:
        print(f"⚠️ Background title generation timed out for {conversation_id}.")
    except Exception as e:
        print(f"⚠️ Background title generation failed for {conversation_id}: {repr(e)}")


# Assuming your router and dependencies are imported appropriately
# router = APIRouter()

from datetime import datetime, timezone  # Make sure timezone is imported at the top!


async def extract_metrics_background(
    user_id: str, conversation_id: str, prompt: str, ai_backend_url: str
):
    # UPGRADED PROMPT
    extraction_prompt = (
        "You are an expert sports data extraction AI. Read the user message and extract important data into a strict JSON array.\n"
        "Categories to look for:\n"
        "1. 'body_stats': weight, height, body fat % (e.g., metric_name: 'weight').\n"
        "2. 'pr': personal records. Use metric_name for the exercise (e.g., 'deadlift_1rm'). Add {'sport': 'powerlifting'} to meta_data if known.\n"
        "3. 'goal': user's goals. value is the goal text. Add {'deadline': 'YYYY-MM-DD'} to meta_data if mentioned.\n"
        "4. 'training_data': frequency, duration, intensity (e.g., metric_name: 'session_duration').\n"
        "5. 'diet': calorie intake, macros (e.g., metric_name: 'daily_calories').\n\n"
        "Output ONLY valid JSON. If no metrics are found, output an empty array []. Example:\n"
        "[\n"
        '  {"category": "body_stats", "metric_name": "weight", "value": 82, "unit": "kg"},\n'
        '  {"category": "pr", "metric_name": "deadlift", "value": 150, "unit": "kg", "meta_data": {"sport": "gym"}},\n'
        '  {"category": "goal", "metric_name": "current_goal", "value": "Lose 5kg", "unit": "", "meta_data": {"deadline": "2026-12-01"}}\n'
        "]\n\n"
        f"User message: {prompt}"
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{ai_backend_url}/chat", json={"prompt": extraction_prompt}
            )
            response.raise_for_status()

            raw_json = ""
            for line in response.text.splitlines():
                if line.startswith("data: "):
                    try:
                        clean_chunk = json.loads(line.replace("data: ", ""))
                        raw_json += clean_chunk
                    except json.JSONDecodeError:
                        pass

            # BULLETPROOF JSON EXTRACTION: Find the first '[' and last ']'
            start_idx = raw_json.find("[")
            end_idx = raw_json.rfind("]")

            if start_idx != -1 and end_idx != -1:
                clean_json_string = raw_json[start_idx : end_idx + 1]

                if clean_json_string != "[]":
                    metrics = json.loads(clean_json_string)
                    for metric in metrics:
                        metric["user_id"] = user_id
                        metric["source_chat_id"] = conversation_id
                        metric["date"] = datetime.now(
                            timezone.utc
                        )  # Updated to timezone-aware UTC
                        if "meta_data" not in metric:
                            metric["meta_data"] = {}

                        await db.metrics.insert_one(metric)
                        print(
                            f"✅ Extracted: {metric['metric_name']} ({metric['value']})"
                        )
            else:
                print("No JSON array found in the AI response.")

    except Exception as e:
        print(f"⚠️ Background metric extraction failed: {repr(e)}")


@app.post("/chat")
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    email: Optional[str] = Depends(get_optional_user_email),
):
    # 1. Identify User
    user_id = None
    if email:
        user = await db.users.find_one({"email": email})
        if user:
            user_id = str(user["_id"])

    is_valid_id = (
        ObjectId.is_valid(request.conversation_id) if request.conversation_id else False
    )
    is_new_conversation = not request.conversation_id or not is_valid_id

    # Establish the ID context safely
    if is_new_conversation:
        db_assigned_id = ObjectId()
        current_conv_id = str(db_assigned_id)

        # FIX: CREATE THE SHELL DOCUMENT IMMEDIATELY
        # This guarantees the React frontend will never hit a 404.
        if user_id:
            shell_conv = {
                "_id": db_assigned_id,
                "user_id": user_id,
                "title": request.prompt[:30] + "...",
                "messages": [],  # Leave empty; local React state handles the UI during streaming
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            await db.conversations.insert_one(shell_conv)
    else:
        current_conv_id = request.conversation_id
        db_assigned_id = ObjectId(current_conv_id)

    async def generate():
        user_msg = {
            "role": "user",
            "content": request.prompt,
            "timestamp": datetime.utcnow(),
        }
        ai_content = ""
        full_prompt = request.prompt

        # Pull history if appending to an existing conversation
        if not is_new_conversation:
            try:
                conv = await db.conversations.find_one({"_id": db_assigned_id})
                if conv and "messages" in conv:
                    history_chunks = []
                    for m in conv["messages"][-8:]:
                        role = m.get("role", "user").upper()
                        content = m.get("content", "")
                        if len(content) > 3000:
                            content = (
                                content[:3000]
                                + "... [Content truncated for length] ..."
                            )
                        history_chunks.append(f"{role}: {content}")

                    history = "\n\n".join(history_chunks)
                    full_prompt = (
                        f"CONTEXT & CONVERSATION HISTORY:\n"
                        f"=================================\n{history}\n=================================\n\n"
                        f"[SYSTEM INSTRUCTION]: Read the history carefully. \n\n"
                        f"USER PROMPT: {request.prompt}"
                    )
            except InvalidId:
                pass

        ai_backend_url = os.getenv("AI_BACKEND_URL", "http://127.0.0.1:8000")

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                req_data = {"prompt": full_prompt}
                async with client.stream(
                    "POST", f"{ai_backend_url}/chat", json=req_data
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                clean_text = json.loads(line.replace("data: ", ""))
                                ai_content += clean_text
                            except json.JSONDecodeError:
                                pass
                        yield line + "\n"
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            print(f"❌ AI Backend connection failure: {e}")
            mock_words = ["I", " couldn't", " reach", " the", " AI..."]
            for word in mock_words:
                ai_content += word
                yield f"data: {word}\n\n"
                await asyncio.sleep(0.1)

        # 4. Save the finalized messages to MongoDB
        if user_id:
            ai_msg = {
                "role": "assistant",
                "content": ai_content,
                "timestamp": datetime.utcnow(),
            }

            # FIX: Because the shell document already exists, we ALWAYS use update_one to push messages
            await db.conversations.update_one(
                {"_id": db_assigned_id},
                {
                    "$push": {"messages": {"$each": [user_msg, ai_msg]}},
                    "$set": {"updated_at": datetime.utcnow()},
                },
            )

            # Trigger background tasks ONLY if it was a new conversation
            if is_new_conversation:
                background_tasks.add_task(
                    generate_title_background,
                    current_conv_id,
                    request.prompt,
                    ai_backend_url,
                )
                background_tasks.add_task(
                    extract_metrics_background,
                    user_id,
                    current_conv_id,
                    request.prompt,
                    ai_backend_url,
                )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"X-Conversation-Id": current_conv_id},
    )


@app.get("/conversations")
async def get_all_conversations(email: str = Depends(get_current_user_email)):
    # 1. Find the user
    user = await db.users.find_one({"email": email})

    # SAFEGUARD: Check if the user actually exists before trying to access user["_id"]
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please log in again.",
        )

    # 2. Fetch their conversations (excluding the heavy messages array to save bandwidth)
    cursor = db.conversations.find({"user_id": str(user["_id"])}, {"messages": 0}).sort(
        "updated_at", -1
    )
    conversations = await cursor.to_list(length=100)

    # 3. Convert MongoDB ObjectIds to strings for JSON
    for conv in conversations:
        conv["_id"] = str(conv["_id"])

    return conversations


@app.get("/conversations/{conversation_id}")
async def get_single_conversation(
    conversation_id: str, email: str = Depends(get_current_user_email)
):
    user = await db.users.find_one({"email": email})
    conv = await db.conversations.find_one(
        {"_id": ObjectId(conversation_id), "user_id": str(user["_id"])}
    )

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv["_id"] = str(conv["_id"])
    return conv


@app.get("/search")
async def search_conversations(q: str, email: str = Depends(get_current_user_email)):
    user = await db.users.find_one({"email": email})

    # Search for the keyword inside the messages content using regex (case-insensitive)
    query = {
        "user_id": str(user["_id"]),
        "messages.content": {"$regex": q, "$options": "i"},
    }

    cursor = db.conversations.find(query, {"messages": 0}).sort("updated_at", -1)
    results = await cursor.to_list(length=50)

    for res in results:
        res["_id"] = str(res["_id"])

    return results


@app.get("/export/{conversation_id}")
async def export_conversation(
    conversation_id: str, email: str = Depends(get_current_user_email)
):
    user = await db.users.find_one({"email": email})
    conv = await db.conversations.find_one(
        {"_id": ObjectId(conversation_id), "user_id": str(user["_id"])}
    )

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Create a new Word document
    document = Document()
    document.add_heading(conv.get("title", "RizzBo Chat Export"), 0)

    for msg in conv.get("messages", []):
        # We skip system messages so the user doesn't see raw RAG context/document injections
        if msg["role"] == "system":
            continue

        role_name = "You" if msg["role"] == "user" else "RizzBo"

        p = document.add_paragraph()
        runner = p.add_run(f"{role_name}: ")
        runner.bold = True
        p.add_run(msg["content"])

    # Save the document to a memory stream instead of the hard drive
    file_stream = io.BytesIO()
    document.save(file_stream)
    file_stream.seek(0)

    # Stream it back to the user as an attachment
    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=RizzBo_Chat.docx"},
    )


@app.get("/profile/summary")
async def get_profile_summary(email: str = Depends(get_current_user_email)):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    pipeline = [
        {"$match": {"user_id": str(user["_id"])}},
        {"$sort": {"date": -1}},
        {
            "$group": {
                "_id": "$metric_name",
                "latest_value": {"$first": "$value"},
                "unit": {"$first": "$unit"},
                "category": {"$first": "$category"},
                "meta_data": {"$first": "$meta_data"},
                "date": {"$first": "$date"},
            }
        },
    ]

    cursor = db.metrics.aggregate(pipeline)
    results = await cursor.to_list(length=100)

    summary = {}
    for r in results:
        summary[r["_id"]] = {
            "value": r["latest_value"],
            "unit": r.get("unit", ""),
            "category": r.get("category", "general"),
            "meta_data": r.get("meta_data", {}),
            "date": r["date"].isoformat(),
        }
    return summary


@app.get("/profile/metrics/{metric_name}")
async def get_profile_metrics(
    metric_name: str, email: str = Depends(get_current_user_email)
):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Sort ascending so the frontend charts render chronologically
    cursor = db.metrics.find(
        {"user_id": str(user["_id"]), "metric_name": metric_name}, {"_id": 0}
    ).sort("date", 1)

    metrics = await cursor.to_list(length=100)
    # Convert dates to ISO strings for JSON serialization
    for m in metrics:
        if isinstance(m.get("date"), datetime):
            m["date"] = m["date"].isoformat()

    return metrics
