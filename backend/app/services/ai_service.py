import json
import uuid
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.task import StepResponse

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


async def decompose_task(title: str) -> list[StepResponse]:
    client = _create_client()

    # 全局作用:依据全局配置文件中的ai_provider字段决定具体的模型调用策略，实现Ollama与云端API的无缝切换。
    provider = settings.ai_provider.lower()
    model = settings.ollama_model if provider == "ollama" else settings.XiaoEn_model

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
    # -----------------------
    steps = []
    for item in steps_data:
        steps.append(
            StepResponse(
                id=uuid.uuid4().hex,
                description=item.get("description", "Unknown step"),
                estimated_minutes=item.get("estimated_minutes", 5),
                completed=False,
            )
        )

    return steps


def _create_client() -> AsyncOpenAI:
    provider = settings.ai_provider.lower()
    if provider == "ollama":
        return AsyncOpenAI(
            base_url=settings.ollama_base_url,
            api_key=settings.ollama_api_key,
        )
    return AsyncOpenAI(
        base_url=settings.siliconflow_base_url,
        api_key=settings.siliconflow_api_key,
    )
