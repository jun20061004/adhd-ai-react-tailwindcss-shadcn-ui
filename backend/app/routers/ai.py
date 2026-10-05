import logging

# from fastapi import APIRouter, Depends, HTTPException, Session
# from sqlmodel import Session as SQLSession
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session as SQLSession

from app.core.database import get_session
from app.schemas.task import TaskResponse
from app.services import ai_service, task_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/decompose", response_model=TaskResponse)
async def decompose(
    # 使用Body(..., embed=True)强制FastAPI去解析HTTP请求体中的JSON，而不是从URL查询参数中找title
    title: str = Body(..., embed=True),
    # 依赖注入：get_session 通过 yield 交由 FastAPI 依赖图管理连接的开启与关闭，保证请求级数据隔离
    session: SQLSession = Depends(get_session),
) -> TaskResponse:
    try:
        steps = await ai_service.decompose_task(title)
        # 拆解完成后立即落库：由 task_service 负责持久化，
        # 返回携带数据库生成的任务ID与微步ID的完整契约，避免拆解结果随请求结束而丢失
        return task_service.create_task_with_steps(session, title, steps)
    except Exception:
        # 脱敏处理：完整异常仅写入服务端日志，不向前端暴露网络拓扑、文件路径或密钥片段
        logger.exception("AI拆解接口调用失败")
        raise HTTPException(
            status_code=502,
            detail="任务拆解服务暂时不可用，请稍后再试",
        )