import json
import logging
import re
import uuid

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.task import StepResponse

logger = logging.getLogger(__name__)

DECOMPOSE_SYSTEM_PROMPT = """你是一个专为ADHD人群设计的任务拆解助手。

给定一个任务描述，请将其拆分为 3 到 8 个微小、具体、可立即执行的步骤。每个步骤耗时 1 到 15 分钟。

规则：
- 每个步骤必须以动词开头，具体且可执行。
- 步骤必须按从易到难、符合逻辑的时间顺序排列。
- 每个步骤必须预估耗时（1-15分钟）。
- 最终的拆解结果必须是一个包含 json 对象的数组。

输出格式示例：
```json
[
  {"description": "换上适合跳舞的运动服和鞋子", "estimated_minutes": 5},
  {"description": "打开音响或手机播放热身音乐", "estimated_minutes": 2}
]
```"""

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
            {"role": "user",
             "content": f"请仔细拆解这个任务：【{title}】\n你可以先进行思考，但最终请务必给出包含步骤的 JSON 数组结果。"}
        ],
        temperature=0.6,  # R1 模型推荐 0.6 左右的温度，让它有空间发散思考
        max_tokens=2048,  # 给足 Token，避免它还没思考完就被强行掐断
    )

    raw_content = response.choices[0].message.content or "[]"
    print("\n" + "=" * 50)
    print(f"【AI原始输出】:\n{raw_content}")
    print("=" * 50 + "\n")


    # 尝试使用正则提取真正的JSON数组部分，剔除可能存在的Markdown标记或聊天废话
    match = re.search(r"\[.*\]", raw_content, re.DOTALL)
    if match:
        clean_content = match.group(0)
    else:
        clean_content = raw_content

    try:
        steps_data = json.loads(clean_content)
    except json.JSONDecodeError:
        # 即使清洗后依然解析失败，赋予空列表使后续能够抛出一致的业务级错误，而不是500内部服务器崩溃
        steps_data = []

    # 兼容部分模型可能会自作主张返回带有根节点字典的JSON(如 {"steps": [...]})
    if isinstance(steps_data, dict):
        for key in steps_data.keys():
            if isinstance(steps_data[key], list):
                steps_data = steps_data[key]
                break

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