# from fastapi import APIRouter, Depends, HTTPException, Session
# from sqlmodel import Session as SQLSession
from fastapi import APIRouter, HTTPException
from app.schemas.task import StepResponse
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])

from app.core.database import get_session
from app.schemas.task import StepResponse
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/decompose", response_model=list[StepResponse])
async def decompose(
    title: str,
) -> list[StepResponse]:
    try:
        return await ai_service.decompose_task(title)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI decomposition failed: {exc}",
        )
