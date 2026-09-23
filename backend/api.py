"""FastAPI application for the city scenario simulator."""

import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Support both `python backend/api.py` and `uvicorn backend.api:app`.
if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.ai_adapter import analyze_result
from backend.dataset_repository import load_all_datasets
from backend.scenario_repository import list_scenarios, save_scenario
from backend.schemas import AnalyzeScenarioRequest, SaveScenarioRequest, ScenarioRequest
from backend.scoring import calculate_baseline, calculate_scenario, validate_decisions
from backend.settings import settings


app = FastAPI(title="Akim for 5 Hours API", version="1.0.0")
SCENARIO_DB_PATH = settings.database_path
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _decision_dicts(request: ScenarioRequest) -> list[dict[str, Any]]:
    return [decision.model_dump(exclude_none=True) for decision in request.decisions]


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "Akim for 5 Hours API",
        "health": "/api/v1/health",
        "dataset": "/api/v1/dataset",
        "documentation": "/docs",
    }


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    configured = bool(
        settings.openai_api_key
        and settings.openai_api_key.get_secret_value().strip()
    )
    return {"status": "ok", "aiProvider": "openai" if configured else "fallback"}


@app.get("/api/v1/dataset")
def get_dataset() -> dict[str, Any]:
    data = load_all_datasets()
    baseline = calculate_baseline(data)
    return {
        "datasetVersion": data["rules"]["datasetVersion"],
        "budget": data["rules"]["budget"],
        "baselineScore": baseline["score"],
        "districts": data["districts"]["districts"],
        "measures": data["measures"]["measures"],
        "rules": data["rules"],
    }


@app.post("/api/v1/scenarios/validate")
def validate_scenario(request: ScenarioRequest) -> dict[str, Any]:
    decisions = _decision_dicts(request)
    data = load_all_datasets()
    errors = validate_decisions(decisions, data, allow_partial=True)
    measures = {item["id"]: item for item in data["measures"]["measures"]}
    spent = sum(
        measures[item["measureId"]]["cost"]
        for item in decisions
        if item["measureId"] in measures
    )
    total = data["rules"]["budget"]
    return {
        "valid": not errors,
        "complete": len(decisions) == data["rules"]["requiredDecisionCount"] and not errors,
        "validationErrors": errors,
        "budget": {"total": total, "spent": spent, "remaining": total - spent},
    }


@app.post("/api/v1/scenarios/calculate")
def calculate(request: ScenarioRequest) -> dict[str, Any]:
    return calculate_scenario(_decision_dicts(request))


@app.post("/api/v1/scenarios/analyze")
def analyze(request: AnalyzeScenarioRequest) -> dict[str, Any]:
    try:
        return analyze_result(request.result)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/api/v1/scenarios", status_code=201)
def create_scenario(request: SaveScenarioRequest) -> dict[str, Any]:
    decisions = _decision_dicts(request)
    result = calculate_scenario(decisions)
    if not result["valid"]:
        raise HTTPException(status_code=400, detail=result["validationErrors"])
    return save_scenario(request.name, decisions, result, SCENARIO_DB_PATH)


@app.get("/api/v1/scenarios")
def get_scenarios() -> list[dict[str, Any]]:
    return list_scenarios(SCENARIO_DB_PATH)


# Temporary compatibility routes for the first local prototype.
@app.get("/health", include_in_schema=False)
def legacy_health() -> dict[str, str]:
    return health()


@app.get("/districts", include_in_schema=False)
def legacy_districts() -> dict[str, Any]:
    return {"districts": load_all_datasets()["districts"]["districts"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.host, port=settings.port)
