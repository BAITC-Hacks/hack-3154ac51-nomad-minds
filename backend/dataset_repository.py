"""Load the immutable simulation datasets from JSON files."""

import json
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parent / "app" / "data"


def _load_json(filename: str) -> dict[str, Any]:
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(f"Dataset root must be an object: {path}")
    return data


def load_districts() -> dict[str, Any]:
    """Return the districts dataset."""
    return _load_json("districts.json")


def load_measures() -> dict[str, Any]:
    """Return the measures dataset."""
    return _load_json("measures.json")


def load_rules() -> dict[str, Any]:
    """Return the simulation rules dataset."""
    return _load_json("rules.json")


def load_all_datasets() -> dict[str, dict[str, Any]]:
    """Load all datasets used by the backend."""
    return {
        "districts": load_districts(),
        "measures": load_measures(),
        "rules": load_rules(),
    }
