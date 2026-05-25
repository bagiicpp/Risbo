from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Annotated
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=50)
    # The pattern ensures only 'athlete' or 'coach' are accepted
    role: str = Field(
        default="athlete",
        pattern="^(athlete|coach)$",
        description="Either 'athlete' or 'coach'",
    )


class UserInDB(BaseModel):
    email: EmailStr
    hashed_password: str
    role: str = "athlete"


class RosterLink(BaseModel):
    coach_id: str
    athlete_id: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Conversation(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    title: str
    messages: list[Message] = []
    context_summary: str = ""  # <--- NEW FIELD FOR PHASE 2
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Conversation(BaseModel):
    # Optional user_id allows for guest sessions
    user_id: Optional[str] = None
    title: str = "New Chat"
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatRequest(BaseModel):
    prompt: str
    conversation_id: Optional[str] = None
    model: Optional[str] = None


class ConversationRename(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)


class Metric(BaseModel):
    user_id: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    category: str
    metric_name: str
    value: Any
    unit: Optional[str] = ""
    meta_data: Optional[Dict] = {}
    source_chat_id: Optional[str] = None


class PantryItem(BaseModel):
    user_id: str
    item_name: str
    quantity: Optional[str] = None
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    target_weight: Optional[float] = None
    activity_multiplier: Optional[float] = None


class PreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    measurement_system: Optional[str] = None
    dietary_preference: Optional[str] = None
    workout_reminders: Optional[bool] = None

class Recipe(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    title: str
    prep_time_minutes: int
    macros: Dict[str, float]
    ingredients: List[str]
    instructions: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
