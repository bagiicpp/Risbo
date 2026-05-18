import asyncio
import io
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime
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
)


@app.get("/ping")
async def ping():
    return {"status": "ok", "service": "app-backend"}


@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and save
    hashed_password = get_password_hash(user.password)
    new_user = UserInDB(email=user.email, hashed_password=hashed_password)

    await db.users.insert_one(new_user.model_dump())
    return {"message": "User registered successfully"}


@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user
    user_doc = await db.users.find_one(
        {"email": form_data.username}
    )  # OAuth2 form uses 'username'
    if not user_doc:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # Verify password
    if not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # Create JWT
    access_token = create_access_token(data={"sub": user_doc["email"]})
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

    # 1. Read the file into memory
    content = await file.read()

    # 2. Extract the text
    extracted_text = await extract_text_from_file(content, file.filename)

    # Optional: Cap the length to avoid exceeding the AI's token limit
    extracted_text = extracted_text[:15000]

    # 3. Save as a hidden system message inside the conversation
    sys_msg = Message(
        role="system",
        content=f"[USER UPLOADED DOCUMENT: {file.filename}]\n\n{extracted_text}",
    )

    result = await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"messages": sys_msg.model_dump()}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"message": "Document processed", "filename": file.filename}


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

    # 2. Check if the incoming conversation ID is a valid MongoDB ObjectId hex string
    # If the frontend sent an optimistic ID like 'optimistic_1234', this evaluates to False
    is_valid_id = (
        ObjectId.is_valid(request.conversation_id) if request.conversation_id else False
    )

    # Force "is_new_conversation" tracking if no ID was provided OR if the provided ID is a fake optimistic one
    is_new_conversation = not request.conversation_id or not is_valid_id

    # Establish the ID context safely
    if is_new_conversation:
        # Generate a real, structurally flawless MongoDB ObjectId immediately
        db_assigned_id = ObjectId()
        current_conv_id = str(db_assigned_id)
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

        # Pull history only if it's an existing conversation and we have a valid ID sequence
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
                        f"=================================\n"
                        f"{history}\n"
                        f"=================================\n\n"
                        f"[SYSTEM INSTRUCTION]: The history above contains previous turns and text automatically "
                        f"extracted from user-uploaded documents (labeled as SYSTEM or USER). If the user asks about a "
                        f"file, document, or past context, DO NOT state that you cannot access it. The content is fully "
                        f"available in the history block provided above. Read it carefully to formulate your answer.\n\n"
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

        # 4. Save to MongoDB if the user context is authenticated
        if user_id:
            ai_msg = {
                "role": "assistant",
                "content": ai_content,
                "timestamp": datetime.utcnow(),
            }

            if not is_new_conversation:
                await db.conversations.update_one(
                    {"_id": db_assigned_id},
                    {
                        "$push": {"messages": {"$each": [user_msg, ai_msg]}},
                        "$set": {"updated_at": datetime.utcnow()},
                    },
                )
            else:
                # Store the provisional conversation document using our verified safe ObjectId
                provisional_title = request.prompt[:30] + "..."
                new_conv = {
                    "_id": db_assigned_id,
                    "user_id": user_id,
                    "title": provisional_title,
                    "messages": [user_msg, ai_msg],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
                await db.conversations.insert_one(new_conv)

                # Pass the structurally sound clean string representation to your background task
                background_tasks.add_task(
                    generate_title_background,
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
            detail="User not found. Please log in again."
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
