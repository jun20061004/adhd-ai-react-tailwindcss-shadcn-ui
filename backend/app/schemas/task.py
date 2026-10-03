from datetime import datetime
from pydantic import BaseModel, Field


class CreateTaskRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class StepResponse(BaseModel):
    id: str
    description: str
    # 引入Field并添加ge(大于等于)与le(小于等于)限制
    estimated_minutes: int = Field(default=5,ge=1, le=15, description="微步耗时，必须在1-15分钟内")
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
