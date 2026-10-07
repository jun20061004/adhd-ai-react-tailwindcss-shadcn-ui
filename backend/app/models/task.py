from datetime import datetime,timezone
from sqlmodel import SQLModel, Field
from typing import Optional
import uuid


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    title: str = Field(max_length=500)
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TaskStep(SQLModel, table=True):
    __tablename__ = "task_steps"

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    task_id: str = Field(foreign_key="tasks.id", nullable=False)
    description: str
    estimated_minutes: int = Field(default=5)
    completed: bool = Field(default=False)
