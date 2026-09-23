"""SQLite storage for named, reproducible scenario snapshots."""

import json
import sqlite3
from pathlib import Path
from typing import Any
from uuid import uuid4


DATABASE_PATH = Path(__file__).resolve().parent / "app.db"


def _connect(db_path: Path | None = None) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path or DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database(db_path: Path | None = None) -> None:
    with _connect(db_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS scenarios (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                dataset_version TEXT NOT NULL,
                decisions_json TEXT NOT NULL,
                result_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def save_scenario(
    name: str,
    decisions: list[dict[str, Any]],
    result: dict[str, Any],
    db_path: Path | None = None,
) -> dict[str, Any]:
    initialize_database(db_path)
    scenario_id = str(uuid4())
    with _connect(db_path) as connection:
        connection.execute(
            """
            INSERT INTO scenarios (
                id, name, dataset_version, decisions_json, result_json
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                scenario_id,
                name,
                result["datasetVersion"],
                json.dumps(decisions, ensure_ascii=True, separators=(",", ":")),
                json.dumps(result, ensure_ascii=True, separators=(",", ":")),
            ),
        )
    return get_scenario(scenario_id, db_path)


def get_scenario(scenario_id: str, db_path: Path | None = None) -> dict[str, Any]:
    initialize_database(db_path)
    with _connect(db_path) as connection:
        row = connection.execute(
            "SELECT * FROM scenarios WHERE id = ?", (scenario_id,)
        ).fetchone()
    if row is None:
        raise KeyError(scenario_id)
    return _deserialize(row)


def list_scenarios(db_path: Path | None = None) -> list[dict[str, Any]]:
    initialize_database(db_path)
    with _connect(db_path) as connection:
        rows = connection.execute(
            "SELECT * FROM scenarios ORDER BY created_at DESC, id DESC"
        ).fetchall()
    return [_deserialize(row) for row in rows]


def _deserialize(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "datasetVersion": row["dataset_version"],
        "decisions": json.loads(row["decisions_json"]),
        "result": json.loads(row["result_json"]),
        "createdAt": row["created_at"],
    }
