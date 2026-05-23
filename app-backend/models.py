from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


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
