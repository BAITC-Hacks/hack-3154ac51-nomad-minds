"""Pydantic request models shared by the FastAPI endpoints."""

from pydantic import BaseModel, ConfigDict


class Decision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    measureId: str
    districtId: str | None = None


class ScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decisions: list[Decision]
