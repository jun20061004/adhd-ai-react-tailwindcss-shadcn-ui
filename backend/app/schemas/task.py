from datetime import datetime
from pydantic import BaseModel, Field


class CreateTaskRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class StepResponse(BaseModel):
    id: str
    description: str
    estimated_minutes: int
    completed: bool = False


class TaskResponse(BaseModel):
    id: str
    title: str
    status: str
    steps: list[StepResponse]
    created_at: datetime
    updated_at: datetime


class UpdateTaskRequest(BaseModel):
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed)$")


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
