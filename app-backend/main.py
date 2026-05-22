import asyncio
import io
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import httpx
import yake
from auth import (
    create_access_token,
    get_current_coach_email,
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
from langdetect import detect
from models import (
    ChatRequest,
    Conversation,
    Message,
    RosterLink,
    Token,
    UserCreate,
    UserInDB,
)
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
    expose_headers=["X-Conversation-Id"],
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
        "role": user.role,
        "plan": "Free plan",
        "created_at": datetime.now(timezone.utc),
    }

    await db.users.insert_one(user_doc)
    return {"message": "User successfully created"}


@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_doc = await db.users.find_one({"email": form_data.username})
    if not user_doc or not verify_password(
        form_data.password, user_doc["hashed_password"]
    ):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token_payload = {
        "sub": user_doc["email"],
        "name": user_doc.get("name", "User"),
        "role": user_doc.get("role", "athlete"),
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


async def generate_smart_title(first_prompt: str, ai_backend_url: str) -> str:
    """Generates a smart title using the AI and strictly enforces Sentence case."""
    system_instruction = (
        "You are a precise title generator. Create a concise, professional title (3-5 words) "
        "summarizing the user request. Do not include quotes, punctuation, or filler text."
    )
    title_prompt = f"{system_instruction}\n\nUser Request: {first_prompt}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ai_backend_url}/chat", json={"prompt": title_prompt, "stream": False}
            )
            response.raise_for_status()

            raw_title = ""
            for line in response.text.splitlines():
                if line.startswith("data: "):
                    try:
                        raw_title += json.loads(line.replace("data: ", ""))
                    except json.JSONDecodeError:
                        pass

            if not raw_title:
                raw_title = response.json().get("response", response.text)

            # Enforce strict Sentence case (Only the very first letter is uppercase)
            refined_title = raw_title.strip().replace('"', "").replace("'", "")[:40]
            return refined_title.capitalize()

    except Exception:
        # Failsafe if the AI title generator times out
        fallback = " ".join(first_prompt.split()[:4])
        return fallback.capitalize()


async def extract_metrics_background(
    user_id: str, conversation_id: str, prompt: str, ai_backend_url: str
):
    # UPGRADED PROMPT: Added Recovery, Sleep, RPE, and Injury tracking for Coaches
    extraction_prompt = (
        "You are an expert sports data extraction AI. Read the user message and extract important data into a strict JSON array.\n"
        "Categories to look for:\n"
        "1. 'body_stats': weight, height, body fat % (e.g., metric_name: 'weight').\n"
        "2. 'pr': personal records. Use metric_name for the exercise (e.g., 'deadlift_1rm'). Add {'sport': 'powerlifting'} to meta_data if known.\n"
        "3. 'goal': user's goals. value is the goal text. Add {'deadline': 'YYYY-MM-DD'} to meta_data if mentioned.\n"
        "4. 'training_data': frequency, duration, intensity, RPE (Rate of Perceived Exertion) (e.g., metric_name: 'session_duration', 'rpe').\n"
        "5. 'diet': calorie intake, macros, hydration (e.g., metric_name: 'daily_calories').\n"
        "6. 'recovery': sleep duration, sleep quality, soreness, fatigue levels (e.g., metric_name: 'sleep_hours', 'soreness_level').\n"
        "7. 'health': injuries, pain levels, resting heart rate, HRV (e.g., metric_name: 'knee_pain').\n\n"
        "Output ONLY valid JSON. If no metrics are found, output an empty array []. Example:\n"
        "[\n"
        '  {"category": "body_stats", "metric_name": "weight", "value": 82, "unit": "kg"},\n'
        '  {"category": "recovery", "metric_name": "sleep_hours", "value": 6, "unit": "hours", "meta_data": {"quality": "poor"}},\n'
        '  {"category": "training_data", "metric_name": "rpe", "value": 8, "unit": "", "meta_data": {"exercise": "sprints"}}\n'
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
    # 1. Identify User and Role
    user_id = None
    role = "athlete"
    if email:
        user = await db.users.find_one({"email": email})
        if user:
            user_id = str(user["_id"])
            role = user.get("role", "athlete")

    is_valid_id = (
        ObjectId.is_valid(request.conversation_id) if request.conversation_id else False
    )
    is_new_conversation = not request.conversation_id or not is_valid_id

    if is_new_conversation:
        db_assigned_id = ObjectId()
        current_conv_id = str(db_assigned_id)
        if user_id:
            shell_conv = {
                "_id": db_assigned_id,
                "user_id": user_id,
                "title": request.prompt[:30] + "...",
                "messages": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            await db.conversations.insert_one(shell_conv)
    else:
        current_conv_id = request.conversation_id
        db_assigned_id = ObjectId(current_conv_id)

    async def generate():
        user_msg = {
            "role": "user",
            "content": request.prompt,
            "timestamp": datetime.now(timezone.utc),
        }
        ai_content = ""
        full_prompt = request.prompt

        # MOVED UP: We need this URL immediately for the concurrent title task
        ai_backend_url = os.getenv("AI_BACKEND_URL", "http://127.0.0.1:8000")

        # NEW: Start the smart title generation concurrently
        title_task = None
        if is_new_conversation:
            title_task = asyncio.create_task(
                generate_smart_title(request.prompt, ai_backend_url)
            )

        # --- PHASE 3: TEAM-AWARE AI CONTEXT INJECTION ---
        roster_context = ""
        if role == "coach" and user_id:
            links = await db.roster_links.find({"coach_id": user_id}).to_list(
                length=100
            )
            if links:
                athlete_ids = [link["athlete_id"] for link in links]

                pipeline = [
                    {
                        "$match": {
                            "user_id": {"$in": athlete_ids},
                            "metric_name": {
                                "$exists": True,
                                "$ne": None,
                            },
                        }
                    },
                    {"$sort": {"date": -1}},
                    {
                        "$group": {
                            "_id": {
                                "user_id": "$user_id",
                                "metric_name": "$metric_name",
                            },
                            "latest_value": {"$first": "$value"},
                            "unit": {"$first": "$unit"},
                        }
                    },
                ]
                metrics_cursor = db.metrics.aggregate(pipeline)
                team_metrics = await metrics_cursor.to_list(length=500)

                valid_athlete_obj_ids = [
                    ObjectId(aid) for aid in athlete_ids if ObjectId.is_valid(aid)
                ]

                athletes = await db.users.find(
                    {"_id": {"$in": valid_athlete_obj_ids}}, {"name": 1}
                ).to_list(length=100)

                athlete_map = {
                    str(a["_id"]): a.get("name", "Unknown") for a in athletes
                }

                formatted_stats = {}
                for m in team_metrics:
                    group_id = m.get("_id", {})
                    uid = group_id.get("user_id")
                    metric = group_id.get("metric_name")

                    if not uid or not metric:
                        continue

                    a_name = athlete_map.get(uid, "Unknown")
                    if a_name not in formatted_stats:
                        formatted_stats[a_name] = []

                    metric_str = (
                        f"{metric}: {m.get('latest_value', '')}{m.get('unit', '')}"
                    )
                    formatted_stats[a_name].append(metric_str)

                if formatted_stats:
                    roster_context = "\n[ROSTER CONTEXT - LATEST TEAM DATA]:\n"
                    for a_name, stats in formatted_stats.items():
                        roster_context += f"- {a_name}: {', '.join(stats)}\n"
                    roster_context += "[END ROSTER CONTEXT]\n\n"

        if not is_new_conversation:
            try:
                conv = await db.conversations.find_one({"_id": db_assigned_id})
                if conv and "messages" in conv:
                    history_chunks = []
                    for m in conv["messages"][-8:]:
                        m_role = m.get("role", "user").upper()
                        content = m.get("content", "")
                        if len(content) > 3000:
                            content = content[:3000] + "... [Content truncated] ..."
                        history_chunks.append(f"{m_role}: {content}")

                    history = "\n\n".join(history_chunks)
                    full_prompt = (
                        f"CONTEXT & CONVERSATION HISTORY:\n"
                        f"=================================\n{history}\n=================================\n\n"
                        f"{roster_context}"
                        f"[SYSTEM INSTRUCTION]: Read the history carefully. \n\n"
                        f"USER PROMPT: {request.prompt}"
                    )
            except Exception:
                pass
        else:
            full_prompt = f"{roster_context}USER PROMPT: {request.prompt}"

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                req_data = {"prompt": full_prompt}
                async with client.stream(
                    "POST",
                    f"{ai_backend_url}/chat",
                    json={"prompt": request.prompt, "model": request.model},
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
                yield f"data: {json.dumps(word)}\n\n"
                await asyncio.sleep(0.1)

        # 4. Save the finalized messages to MongoDB
        if user_id:
            ai_msg = {
                "role": "assistant",
                "content": ai_content,
                "timestamp": datetime.utcnow(),
            }

            await db.conversations.update_one(
                {"_id": db_assigned_id},
                {
                    "$push": {"messages": {"$each": [user_msg, ai_msg]}},
                    "$set": {"updated_at": datetime.utcnow()},
                },
            )

            # NEW: Await the title task and inject it into the stream
            if title_task:
                try:
                    generated_title = await title_task

                    # Save the new title to the database
                    await db.conversations.update_one(
                        {"_id": db_assigned_id}, {"$set": {"title": generated_title}}
                    )

                    # Send the hidden title payload to the React frontend
                    special_chunk = json.dumps(
                        {"_type": "title_update", "title": generated_title}
                    )
                    yield f"data: {special_chunk}\n\n"
                except Exception as e:
                    print(f"⚠️ Title injection failed: {repr(e)}")

            # Keep the background extraction task
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


@app.post("/roster/invite")
async def invite_athlete(
    payload: dict, coach_email: str = Depends(get_current_coach_email)
):
    athlete_email = payload.get("email")
    if not athlete_email:
        raise HTTPException(status_code=400, detail="Athlete email is required")

    coach = await db.users.find_one({"email": coach_email})
    athlete = await db.users.find_one({"email": athlete_email, "role": "athlete"})

    if not athlete:
        raise HTTPException(
            status_code=404,
            detail="Athlete not found, or user is not registered as an athlete.",
        )

    # Check if they are already linked
    existing_link = await db.roster_links.find_one(
        {"coach_id": str(coach["_id"]), "athlete_id": str(athlete["_id"])}
    )

    if existing_link:
        raise HTTPException(
            status_code=400, detail="Athlete is already in your roster."
        )

    # Create the link (For MVP, we will auto-accept it as 'active')
    new_link = RosterLink(
        coach_id=str(coach["_id"]), athlete_id=str(athlete["_id"]), status="active"
    )

    await db.roster_links.insert_one(new_link.model_dump())
    return {"message": "Athlete successfully added to roster"}


@app.get("/roster/athletes")
async def get_roster(coach_email: str = Depends(get_current_coach_email)):
    coach = await db.users.find_one({"email": coach_email})

    # 1. Find all links belonging to this coach
    cursor = db.roster_links.find({"coach_id": str(coach["_id"])})
    links = await cursor.to_list(length=100)

    if not links:
        return []

    # 2. Extract athlete IDs
    from bson.objectid import ObjectId

    athlete_ids = [ObjectId(link["athlete_id"]) for link in links]

    # 3. Fetch the athlete's profiles (Excluding passwords!)
    athletes_cursor = db.users.find(
        {"_id": {"$in": athlete_ids}}, {"hashed_password": 0}
    )
    athletes = await athletes_cursor.to_list(length=100)

    # 4. Format for the frontend
    roster = []
    for a in athletes:
        status = next(
            (l["status"] for l in links if l["athlete_id"] == str(a["_id"])), "unknown"
        )
        roster.append(
            {
                "id": str(a["_id"]),
                "name": a.get("name", "Unknown Athlete"),
                "email": a.get("email"),
                "status": status,
            }
        )

    return roster


@app.get("/coach/metrics/summary")
async def get_coach_metrics_summary(
    coach_email: str = Depends(get_current_coach_email),
):
    coach = await db.users.find_one({"email": coach_email})
    if not coach:
        raise HTTPException(
            status_code=401, detail="Coach account no longer exists in database."
        )

    links_cursor = db.roster_links.find({"coach_id": str(coach["_id"])})
    links = await links_cursor.to_list(length=100)

    if not links:
        return []

    athlete_ids = [link["athlete_id"] for link in links]

    pipeline = [
        {
            "$match": {
                "user_id": {"$in": athlete_ids},
                "metric_name": {
                    "$exists": True,
                    "$ne": None,
                },
            }
        },
        {"$sort": {"date": -1}},
        {
            "$group": {
                "_id": {"user_id": "$user_id", "metric_name": "$metric_name"},
                "latest_value": {"$first": "$value"},
                "unit": {"$first": "$unit"},
                "category": {"$first": "$category"},
                "meta_data": {"$first": "$meta_data"},
                "date": {"$first": "$date"},
            }
        },
    ]

    cursor = db.metrics.aggregate(pipeline)
    results = await cursor.to_list(length=500)

    valid_athlete_object_ids = []
    for aid in athlete_ids:
        if ObjectId.is_valid(aid):
            valid_athlete_object_ids.append(ObjectId(aid))

    athletes_cursor = db.users.find(
        {"_id": {"$in": valid_athlete_object_ids}}, {"name": 1}
    )
    athletes = await athletes_cursor.to_list(length=100)
    athlete_map = {str(a["_id"]): a.get("name", "Unknown Athlete") for a in athletes}

    summary_by_athlete = {}
    for r in results:
        group_id = r.get("_id", {})
        uid = group_id.get("user_id")
        metric = group_id.get("metric_name")

        if not uid or not metric:
            continue

        if uid not in summary_by_athlete:
            summary_by_athlete[uid] = {
                "athlete_id": uid,
                "name": athlete_map.get(uid, "Unknown Athlete"),
                "metrics": {},
            }

        raw_date = r.get("date")
        if isinstance(raw_date, datetime):
            safe_date_str = raw_date.isoformat()
        elif isinstance(raw_date, str):
            safe_date_str = raw_date
        else:
            safe_date_str = datetime.now(timezone.utc).isoformat()

        summary_by_athlete[uid]["metrics"][metric] = {
            "value": r.get("latest_value"),
            "unit": r.get("unit", ""),
            "category": r.get("category", "general"),
            "meta_data": r.get("meta_data", {}),
            "date": safe_date_str,
        }

    return list(summary_by_athlete.values())


@app.get("/coach/metrics/{athlete_id}")
async def get_coach_athlete_metrics(
    athlete_id: str,
    metric_name: str,
    coach_email: str = Depends(get_current_coach_email),
):
    coach = await db.users.find_one({"email": coach_email})

    # SECURITY FIRST: Verify the coach actually has this athlete on their roster
    link = await db.roster_links.find_one(
        {"coach_id": str(coach["_id"]), "athlete_id": athlete_id}
    )

    if not link:
        raise HTTPException(
            status_code=403, detail="Access denied. This athlete is not on your roster."
        )

    # Fetch time-series data for the chart
    cursor = db.metrics.find(
        {"user_id": athlete_id, "metric_name": metric_name}, {"_id": 0}
    ).sort("date", 1)

    metrics = await cursor.to_list(length=100)

    for m in metrics:
        if isinstance(m.get("date"), datetime):
            m["date"] = m["date"].isoformat()

    return metrics
