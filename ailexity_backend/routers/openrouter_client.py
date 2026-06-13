"""
OpenRouter LLM client for the AI assistant.
"""

import os
import logging
import httpx

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterError(Exception):
    pass


def is_configured() -> bool:
    return bool(os.getenv("OPENROUTER_API_KEY"))


async def chat_completion(system_prompt: str, history: list, user_message: str) -> str:
    """
    Call OpenRouter's chat completions API.

    Args:
        system_prompt: System prompt providing business/data context.
        history: List of {"role": "user"|"assistant", "content": str} prior turns.
        user_message: The latest user message.

    Returns:
        The assistant's reply text.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise OpenRouterError("OPENROUTER_API_KEY is not configured")

    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ailexity.in",
        "X-Title": "Ailexity POS AI Assistant",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 600,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=payload)

    if response.status_code != 200:
        logger.error(f"OpenRouter error {response.status_code}: {response.text}")
        raise OpenRouterError(f"OpenRouter request failed with status {response.status_code}")

    data = response.json()
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as e:
        logger.error(f"Unexpected OpenRouter response format: {data}")
        raise OpenRouterError(f"Unexpected OpenRouter response format: {e}")
