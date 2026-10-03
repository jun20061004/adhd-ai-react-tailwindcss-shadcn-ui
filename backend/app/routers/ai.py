# from fastapi import APIRouter, Depends, HTTPException, Session
# from sqlmodel import Session as SQLSession
from fastapi import APIRouter, HTTPException,Body
from app.schemas.task import StepResponse
from app.services import ai_service
from app.core.database import get_session

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

@router.post("/decompose", response_model=list[StepResponse])
async def decompose(
# 使用Body(..., embed=True)强制FastAPI去解析HTTP请求体中的JSON，而不是从URL查询参数中找title
    title: str = Body(...,embed=True),
) -> list[StepResponse]:
    try:
        return await ai_service.decompose_task(title)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI decomposition failed: {exc}",
        )
