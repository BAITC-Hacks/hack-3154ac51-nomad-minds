"""API contract tests for the deterministic backend endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.api import app


client = TestClient(app)

REFERENCE_DECISIONS = [
    {"measureId": "M7", "districtId": "nura"},
    {"measureId": "M8", "districtId": "nura"},
    {"measureId": "M10", "districtId": "nura"},
    {"measureId": "M12"},
    {"measureId": "M5", "districtId": "saryarka"},
]


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_dataset_contract():
    response = client.get("/api/v1/dataset")
    assert response.status_code == 200
    body = response.json()
    assert body["datasetVersion"] == "1.0.0"
    assert body["budget"] == 100
    assert body["baselineScore"] == pytest.approx(52.55768)
    assert len(body["districts"]) == 5
    assert len(body["measures"]) == 14
    assert body["rules"]["requiredDecisionCount"] == 5


def test_partial_validation():
    response = client.post(
        "/api/v1/scenarios/validate",
        json={"decisions": REFERENCE_DECISIONS[:2]},
    )
    assert response.status_code == 200
    assert response.json() == {
        "valid": True,
        "complete": False,
        "validationErrors": [],
        "budget": {"total": 100, "spent": 44, "remaining": 56},
    }


def test_invalid_partial_scenario_returns_business_errors():
    response = client.post(
        "/api/v1/scenarios/validate",
        json={"decisions": [
            {"measureId": "M7", "districtId": "nura"},
            {"measureId": "M7", "districtId": "esil"},
        ]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is False
    assert body["validationErrors"]


def test_reference_calculation():
    response = client.post(
        "/api/v1/scenarios/calculate",
        json={"decisions": REFERENCE_DECISIONS},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["budget"] == {"total": 100, "spent": 95, "remaining": 5}
    assert body["baselineScore"] == pytest.approx(52.55768)
    assert body["score"] == pytest.approx(56.54307)
    assert body["scoreDelta"] == pytest.approx(3.98539)
    assert body["criticalCount"] == 0
    assert len(body["contributions"]) == 5
    assert body["appliedSynergies"] == [{
        "measures": ["M10", "M12"],
        "districtId": "nura",
        "indicator": "B1",
        "bonus": 2,
    }]


def test_incomplete_calculation_is_rejected_by_business_validation():
    response = client.post(
        "/api/v1/scenarios/calculate",
        json={"decisions": REFERENCE_DECISIONS[:2]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is False
    assert body["validationErrors"]
    assert "score" not in body


@pytest.mark.parametrize("payload", [
    {},
    {"decisions": "wrong"},
    {"decisions": [{"measureId": 7}]},
    {"decisions": [{"measureId": "M12", "unexpected": True}]},
])
def test_malformed_request_returns_422(payload):
    response = client.post("/api/v1/scenarios/calculate", json=payload)
    assert response.status_code == 422
