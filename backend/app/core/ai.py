from openai import AsyncOpenAI
from app.core.config import settings


def get_ai_client() -> AsyncOpenAI:
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
