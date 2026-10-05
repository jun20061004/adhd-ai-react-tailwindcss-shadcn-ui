import json
import logging
import uuid

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.task import StepResponse

logger = logging.getLogger(__name__)

DECOMPOSE_SYSTEM_PROMPT = """You are an ADHD-friendly task decomposition assistant.

Given a single task description, break it down into 3-8 micro-steps that each take 1-15 minutes.

Rules:
- Each step MUST start with an action verb
- Each step MUST be concrete and immediately actionable
- Steps MUST be ordered from easiest to hardest
- Each step MUST have an estimated duration in minutes (1-15)
- Return ONLY valid JSON array, no markdown formatting

Output format:
[
  {"description": "Open the document and read the first paragraph", "estimated_minutes": 3},
  {"description": "Write a bullet point summary of each section", "estimated_minutes": 10}
]"""

# 模块级单例：进程内仅构造一次 AsyncOpenAI，使其内部持有的 httpx 连接池被所有请求复用，
# 避免每次拆解都重建 TCP 连接与 TLS 握手，从而降低高延迟接口的首包时间。
_client: AsyncOpenAI | None = None

# 微步耗时的合法区间，与 schemas.task.StepResponse 中的 ge=1, le=15 约束保持一致
MIN_STEP_MINUTES = 1
MAX_STEP_MINUTES = 15


async def decompose_task(title: str) -> list[StepResponse]:
    client = _get_client()

    # 全局作用:依据全局配置文件中的ai_provider字段决定具体的模型调用策略，实现Ollama与云端API的无缝切换。
    provider = settings.ai_provider.lower()
    # 配置项名与 core/config.py 的 Settings 字段严格对应：ollama_model / siliconflow_model
    model = settings.ollama_model if provider == "ollama" else settings.xiaoen_model

    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": DECOMPOSE_SYSTEM_PROMPT},
            # 将引导语移至user角色的content中，拼接用户的实际输入
            {"role": "user", "content": f"Task to decompose: {title}"},
        ],
        temperature=0.7,
        max_tokens=1024,
    )

    raw_content = response.choices[0].message.content or "[]"
    steps_data = json.loads(raw_content)

    if not isinstance(steps_data, list) or not steps_data:
        # 模型未能给出可用拆解，属于上游契约违约，交由路由层转换为对用户友好的提示
        raise ValueError("模型未返回任何有效的微步骤")

    steps: list[StepResponse] = []
    for item in steps_data:
        description = str(item.get("description") or "Unknown step").strip()
        # 模型输出为概率性结果，耗时可能越界；在写入数据库前钳制到合法区间，
        # 使 StepResponse 的 ge=1, le=15 约束不会被模型的不确定输出触发
        estimated_minutes = _clamp_minutes(item.get("estimated_minutes"))
        steps.append(
            StepResponse(
                id=uuid.uuid4().hex,
                description=description,
                estimated_minutes=estimated_minutes,
                completed=False,
            )
        )

    return steps


def _get_client() -> AsyncOpenAI:
    # 惰性单例的读取入口：global 声明用于在函数作用域内访问并赋值模块级变量
    global _client
    if _client is None:
        _client = _create_client()
    return _client


def _create_client() -> AsyncOpenAI:
    # 全局作用:依据全局配置文件中的ai_provider字段决定具体的模型调用策略，实现Ollama与云端API的无缝切换。
    provider = settings.ai_provider.lower()
    if provider == "ollama":
        return AsyncOpenAI(
            base_url=settings.ollama_base_url,
            api_key=settings.ollama_api_key,
        )
    return AsyncOpenAI(
        base_url=settings.xiaoen_base_url,
        api_key=settings.xiaoen_api_key,
    )


def _clamp_minutes(raw_value: object) -> int:
    # 模型可能返回字符串、浮点数或缺失值，此处统一归一化为 int 并限制在合法区间内
    try:
        minutes = int(raw_value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 5
    return max(MIN_STEP_MINUTES, min(MAX_STEP_MINUTES, minutes))