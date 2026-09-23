"""Tests for SQLite scenario persistence and its API routes."""

import sqlite3

import pytest
from fastapi.testclient import TestClient

import backend.api as api_module
from backend.api import app
from backend.scenario_repository import list_scenarios, save_scenario
from backend.scoring import calculate_scenario


REFERENCE_DECISIONS = [
    {"measureId": "M7", "districtId": "nura"},
    {"measureId": "M8", "districtId": "nura"},
    {"measureId": "M10", "districtId": "nura"},
    {"measureId": "M12"},
    {"measureId": "M5", "districtId": "saryarka"},
]


def test_repository_creates_database_and_round_trips_snapshot(tmp_path):
    path = tmp_path / "scenarios.db"
    result = calculate_scenario(REFERENCE_DECISIONS)
    saved = save_scenario("Reference", REFERENCE_DECISIONS, result, path)

    assert path.exists()
    assert saved["name"] == "Reference"
    assert saved["datasetVersion"] == "1.0.0"
    assert saved["decisions"] == REFERENCE_DECISIONS
    assert saved["result"] == result
    assert list_scenarios(path) == [saved]


def test_repository_keeps_multiple_named_snapshots(tmp_path):
    path = tmp_path / "scenarios.db"
    result = calculate_scenario(REFERENCE_DECISIONS)
    first = save_scenario("First", REFERENCE_DECISIONS, result, path)
    second = save_scenario("Second", REFERENCE_DECISIONS, result, path)
    saved = list_scenarios(path)

    assert {item["id"] for item in saved} == {first["id"], second["id"]}
    assert {item["name"] for item in saved} == {"First", "Second"}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(api_module, "SCENARIO_DB_PATH", tmp_path / "api.db")
    return TestClient(app)


def test_api_saves_and_lists_calculated_scenario(client):
    response = client.post(
        "/api/v1/scenarios",
        json={"name": "Demo", "decisions": REFERENCE_DECISIONS},
    )
    assert response.status_code == 201
    saved = response.json()
    assert saved["name"] == "Demo"
    assert saved["result"]["score"] == pytest.approx(56.54307)

    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    assert response.json() == [saved]


def test_api_rejects_invalid_scenario_without_saving(client):
    response = client.post(
        "/api/v1/scenarios",
        json={"name": "Invalid", "decisions": REFERENCE_DECISIONS[:2]},
    )
    assert response.status_code == 400
    assert response.json()["detail"]
    assert client.get("/api/v1/scenarios").json() == []


def test_api_rejects_blank_name(client):
    response = client.post(
        "/api/v1/scenarios",
        json={"name": "   ", "decisions": REFERENCE_DECISIONS},
    )
    assert response.status_code == 422


def test_database_does_not_store_personal_fields(tmp_path):
    path = tmp_path / "scenarios.db"
    result = calculate_scenario(REFERENCE_DECISIONS)
    save_scenario("Demo", REFERENCE_DECISIONS, result, path)
    with sqlite3.connect(path) as connection:
        columns = {
            row[1] for row in connection.execute("PRAGMA table_info(scenarios)")
        }
    assert columns == {
        "id", "name", "dataset_version", "decisions_json",
        "result_json", "created_at",
    }
