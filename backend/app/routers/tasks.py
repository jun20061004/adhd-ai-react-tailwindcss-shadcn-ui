# from fastapi import APIRouter, Depends, HTTPException, Session
# from sqlmodel import Session as SQLSession
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as SQLSession


from app.core.database import get_session
from app.schemas.task import (
    CreateTaskRequest,
    TaskListResponse,
    TaskResponse,
    UpdateTaskRequest,
)
from app.services import ai_service, task_service

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse)
async def create_task(
    request: CreateTaskRequest,
    session: SQLSession = Depends(get_session),
) -> TaskResponse:
    try:
        steps = await ai_service.decompose_task(request.title)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI decomposition failed: {exc}",
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


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    session: SQLSession = Depends(get_session),
) -> dict:
    deleted = task_service.delete_task(session, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "message": "Task deleted"}
