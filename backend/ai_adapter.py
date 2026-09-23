"""OpenAI scenario explanation with a small deterministic fallback."""

import json
from typing import Any

from pydantic import BaseModel, ConfigDict

from .settings import Settings, settings


class AiExplanation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str
    strengths: list[str]
    risks: list[str]
    tradeoffs: list[str]
    recommendations: list[str]


def fallback_explanation(result: dict[str, Any]) -> AiExplanation:
    """Return a usable explanation without an API key or network."""
    if not result.get("valid") or "score" not in result:
        raise ValueError("Only a valid calculated scenario can be analyzed.")

    direction_deltas = result.get("directionDeltas", {})
    ranked = sorted(direction_deltas.items(), key=lambda item: item[1], reverse=True)
    strengths = [
        f"{direction}: change {delta:+.2f}."
        for direction, delta in ranked[:3]
        if delta > 0
    ] or ["No positive direction changes were recorded."]

    weakest = result.get("weakestDistrict", "unknown")
    risks = [f"The weakest district after the scenario is {weakest}."]
    if result.get("criticalCount", 0):
        risks.append(f"Critical indicators remaining: {result['criticalCount']}.")

    return AiExplanation(
        summary=(
            f"Score changes from {result['baselineScore']:.2f} to "
            f"{result['score']:.2f} ({result['scoreDelta']:+.2f})."
        ),
        strengths=strengths,
        risks=risks,
        tradeoffs=[
            f"Budget spent: {result['budget']['spent']} of {result['budget']['total']}.",
        ],
        recommendations=[],
    )


def analyze_result(
    result: dict[str, Any],
    config: Settings | None = None,
    client: Any = None,
) -> dict[str, Any]:
    """Analyze a calculated result and fall back if OpenAI is unavailable."""
    fallback = fallback_explanation(result)
    config = config or settings
    api_key = config.openai_api_key.get_secret_value().strip() if config.openai_api_key else ""
    if not api_key:
        return {
            **fallback.model_dump(),
            "source": "fallback",
            "model": None,
        }

    try:
        if client is None:
            from openai import OpenAI

            client = OpenAI(api_key=api_key, timeout=config.openai_timeout_seconds)
        response = client.responses.parse(
            model=config.openai_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "Ты аналитик городских сценариев. Отвечай кратко по-русски. "
                        "Не пересчитывай и не изменяй переданные числа. Не придумывай "
                        "новые показатели, районы или меры. Объясни сильные стороны, "
                        "риски, компромиссы и дай до трех рекомендаций."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(result, ensure_ascii=False),
                },
            ],
            text_format=AiExplanation,
        )
        if response.output_parsed is None:
            raise RuntimeError("OpenAI returned no structured output.")
        return {
            **response.output_parsed.model_dump(),
            "source": "openai",
            "model": config.openai_model,
        }
    except Exception:
        return {
            **fallback.model_dump(),
            "source": "fallback",
            "model": config.openai_model,
        }
