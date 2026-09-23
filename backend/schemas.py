"""Pydantic request models shared by the FastAPI endpoints."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Decision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    measureId: str
    districtId: str | None = None


class ScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decisions: list[Decision]


class SaveScenarioRequest(ScenarioRequest):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Scenario name must not be blank.")
        return value


class AnalyzeScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    result: dict[str, Any]
