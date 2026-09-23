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
- `OPENAI_API_KEY`: secret API key; leave empty to use the fallback.
- `OPENAI_MODEL`: model used for structured analysis, default `gpt-4o-mini`.
- `OPENAI_TIMEOUT_SECONDS`: provider timeout before the fallback is returned.

The `.env` file may contain secrets and must not be committed. Keep
`OPENAI_API_KEY` on the backend only; never put it in frontend configuration.

## Frontend setup

Start the backend on port `8000`, then run in a separate terminal:

```bash
cd frontend
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200). The development server proxies
`/api/**` to `http://127.0.0.1:8000`. The frontend uses all seven `/api/v1`
endpoints below for server status, city data, validation, calculation, AI analysis,
scenario saving, and the results history at `/results`.

For deployment, set `apiBaseUrl` in `frontend/public/config.js` (or in the built
`dist/frontend/browser/config.js`) to the backend URL including `/api/v1`.
The default `/api/v1` assumes a reverse proxy on the same origin.
For a separate backend origin, also configure backend `CORS_ORIGINS`.
No frontend rebuild is needed when editing the deployed `config.js`.

See [frontend/README.md](frontend/README.md) for configuration and verification commands.

## Backend API

```text
GET  /api/v1/health
GET  /api/v1/dataset
POST /api/v1/scenarios/validate
POST /api/v1/scenarios/calculate
POST /api/v1/scenarios/analyze
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
frontend API base URL with the `/api/v1` suffix in `config.js`, and set
`CORS_ORIGINS` to the deployed frontend origin.
