import logging
from fastapi import APIRouter, Body,Depends, HTTPException
from sqlmodel import Session as SQLSession

from app.core.database import get_session
from app.schemas.task import (
    CreateTaskRequest,
    TaskListResponse,
    TaskResponse,
    UpdateTaskRequest,
)
from app.services import ai_service, task_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])

@router.post("", response_model=TaskResponse)
async def create_task(
    request: CreateTaskRequest,
    session: SQLSession = Depends(get_session),
) -> TaskResponse:
    try:
        steps = await ai_service.decompose_task(request.title)
    except Exception:
        logger.exception("AI拆解接口调用失败")
        raise HTTPException(
            status_code=502,
            detail="任务拆解服务暂时不可用，请稍后再试",
        )

    return task_service.create_task_with_steps(
        session=session,
        title=request.title,
        steps=steps,
    )


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    session: SQLSession = Depends(get_session),
) -> TaskListResponse:
    return TaskListResponse(tasks=task_service.list_tasks(session))


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    request: UpdateTaskRequest,
    session: SQLSession = Depends(get_session),
) -> TaskResponse:
    updated = task_service.update_task_status(session, task_id, request.status)
    if updated is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


# 修复：补齐 {task_id} 路径参数，与前端 /api/v1/tasks/{taskId}/steps/{stepId} 完全对齐
@router.patch("/{task_id}/steps/{step_id}", response_model=TaskResponse)
async def update_step(
    task_id: str,
    step_id: str,
    completed: bool = Body(..., embed=True),
    session: SQLSession = Depends(get_session),
) -> TaskResponse:
    # 注意：如果 task_service.toggle_step 需要 task_id 进行双重校验，请一并传入
    updated = task_service.toggle_step(
        session=session,
        step_id=step_id,
        completed=completed,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Micro step not found")
    return updated

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    session: SQLSession = Depends(get_session),
) -> dict:
    deleted = task_service.delete_task(session, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "message": "Task deleted"}
