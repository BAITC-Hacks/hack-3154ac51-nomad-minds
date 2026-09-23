# Akim for 5 Hours — Nomad Minds

Hackathon simulator for selecting five city measures under a budget of 100 and
calculating a deterministic Astana Quality of Life Score.

## Backend setup

Requirements: Python 3.11 or newer.

```powershell
python -m pip install -r backend\requirements.txt
Copy-Item .env.example .env
python -m pytest backend\tests -q
python backend\api.py
```

Open the API documentation at <http://127.0.0.1:8000/docs> and the health check
at <http://127.0.0.1:8000/api/v1/health>.

The backend loads the fixed districts, measures, and rules from
`backend/app/data`. Scenario snapshots are stored in `backend/app.db`, which is
created automatically and excluded from Git.

## Runtime settings

Copy `.env.example` to `.env` and change values when needed:

- `HOST`: bind address; use `0.0.0.0` for Brev.
- `PORT`: HTTP port, default `8000`.
- `CORS_ORIGINS`: comma-separated frontend origins.
- `DATABASE_PATH`: SQLite path for saved scenarios.

The `.env` file can contain secrets later and must not be committed.

## Backend API

```text
GET  /api/v1/health
GET  /api/v1/dataset
POST /api/v1/scenarios/validate
POST /api/v1/scenarios/calculate
POST /api/v1/scenarios
GET  /api/v1/scenarios
```

Example calculation body:

```json
{
  "decisions": [
    {"measureId": "M7", "districtId": "nura"},
    {"measureId": "M8", "districtId": "nura"},
    {"measureId": "M10", "districtId": "nura"},
    {"measureId": "M12"},
    {"measureId": "M5", "districtId": "saryarka"}
  ]
}
```

## NVIDIA Brev

After cloning the repository on the Brev instance:

```bash
python -m pip install -r backend/requirements.txt
cp .env.example .env
python -m pytest backend/tests -q
python backend/api.py
```

Expose port `8000` in the Brev web console. Use the generated tunnel URL as the
frontend API base URL, and set `CORS_ORIGINS` to the deployed frontend origin.
