"""Tests for OpenAI analysis and its offline fallback."""

from types import SimpleNamespace

from pydantic import SecretStr

from backend.ai_adapter import AiExplanation, analyze_result
from backend.scoring import calculate_scenario
from backend.settings import Settings


DECISIONS = [
    {"measureId": "M7", "districtId": "nura"},
    {"measureId": "M8", "districtId": "nura"},
    {"measureId": "M10", "districtId": "nura"},
    {"measureId": "M12"},
    {"measureId": "M5", "districtId": "saryarka"},
]


def result():
    return calculate_scenario(DECISIONS)


def test_missing_key_returns_fallback():
    config = Settings(_env_file=None, openai_api_key=None)
    analysis = analyze_result(result(), config)
    assert analysis["source"] == "fallback"
    assert analysis["model"] is None
    assert "56.54" in analysis["summary"]


def test_structured_openai_response_is_returned():
    expected = AiExplanation(
        summary="Итог улучшился.",
        strengths=["Социальная сфера улучшилась."],
        risks=["Нура остается слабейшим районом."],
        tradeoffs=["Потрачено 95 единиц."],
        recommendations=["Сравните альтернативный сценарий."],
    )
    fake_client = SimpleNamespace(
        responses=SimpleNamespace(
            parse=lambda **kwargs: SimpleNamespace(output_parsed=expected)
        )
    )
    config = Settings(
        _env_file=None,
        openai_api_key=SecretStr("test-key"),
        openai_model="test-model",
    )
    analysis = analyze_result(result(), config, fake_client)
    assert analysis == {
        **expected.model_dump(),
        "source": "openai",
        "model": "test-model",
    }


def test_provider_error_returns_fallback():
    def fail(**kwargs):
        raise RuntimeError("offline")

    fake_client = SimpleNamespace(responses=SimpleNamespace(parse=fail))
    config = Settings(_env_file=None, openai_api_key=SecretStr("test-key"))
    assert analyze_result(result(), config, fake_client)["source"] == "fallback"
