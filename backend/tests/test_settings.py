"""Deployment setting tests."""

from pathlib import Path

from backend.settings import Settings


def test_default_deployment_settings(monkeypatch):
    for key in ("HOST", "PORT", "CORS_ORIGINS", "DATABASE_PATH"):
        monkeypatch.delenv(key, raising=False)
    settings = Settings(_env_file=None)
    assert settings.host == "0.0.0.0"
    assert settings.port == 8000
    assert settings.cors_origin_list == [
        "http://localhost:4200", "http://127.0.0.1:4200"
    ]
    assert settings.database_path == Path("backend/app.db")


def test_environment_overrides(monkeypatch):
    monkeypatch.setenv("HOST", "127.0.0.1")
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("CORS_ORIGINS", "https://one.example, https://two.example")
    monkeypatch.setenv("DATABASE_PATH", "data/scenarios.db")
    settings = Settings(_env_file=None)
    assert settings.host == "127.0.0.1"
    assert settings.port == 9000
    assert settings.cors_origin_list == ["https://one.example", "https://two.example"]
    assert settings.database_path == Path("data/scenarios.db")
