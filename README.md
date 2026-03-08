# Civic Nest Hackathon

Civic Nest is a role-based civic operations platform for reporting, triage, and city response.

## What it does

- **Resident flow:** submit civic issues and receive response guidance.
- **Worker flow:** manage incident queue, assign teams, update statuses, and use map views.
- **Admin flow:** review hotspot insights, trends, and escalations.
- **Backend intelligence pipeline:** intent → context/data → insight → recommendations → response.
- **Operational persistence:** incidents, traces, escalations, quality/provenance history, and rate-limit records.

## Repo structure

- `frontend/` — React app (resident/worker/admin interfaces)
- `apps/api/` — FastAPI backend routes and middleware
- `agents/` — supervisor and domain agent pipeline
- `shared/` — schemas, RBAC, events, adapters, observability
- `db/` — local SQLite artifacts (runtime)

## Local Quick Start (Teammates)

### 1) Clone

```bash
git clone https://github.com/mara-241/Civic-Nest-Hackathon.git
cd Civic-Nest-Hackathon
```

### 2) Start backend (FastAPI)

```bash
cd civic-nest-hackathon
PYTHONPATH=. python3 -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
```

Backend docs: `http://localhost:8000/docs`

### 3) Start frontend (new terminal)

```bash
cd frontend
npm install
npm start
```

Frontend: `http://localhost:3000`

### 4) Frontend environment

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_AUTH_TOKEN=
REACT_APP_ENABLE_MOCK_FALLBACK=0
```

## Team enhancement workflow

1. Create branch: `git checkout -b feat/<name>`
2. Implement changes in relevant module(s)
3. Validate:
   - Frontend: `npm run build`
   - Backend: `PYTHONPATH=. python3 -m pytest -q`
4. Commit + push branch
5. Open PR with scope, screenshots (if UI), and test evidence
