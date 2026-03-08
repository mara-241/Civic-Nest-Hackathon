# Civic Nest Frontend

This frontend provides role-based interfaces for city issue reporting and operations.

## What it does

- Lets **residents** report civic issues and view guidance.
- Lets **public workers** triage incident queues, assign teams, and update statuses.
- Lets **city admins** view insights, hotspot trends, and escalations.
- Connects to backend APIs for incident query, insights, queue, hotspots, status updates, and escalations.
- Displays map-based incident and hotspot views for operational decisions.

## Local Quick Start (Teammates)

### 1) Clone and open project

```bash
git clone https://github.com/mara-241/Civic-Nest-Hackathon.git
cd Civic-Nest-Hackathon/frontend
```

### 2) Install and run

```bash
npm install
npm start
```

Open: `http://localhost:3000`

### 3) Point to backend

Create `.env` in `frontend/` (or copy from `.env.example`) and set:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_AUTH_TOKEN=
REACT_APP_ENABLE_MOCK_FALLBACK=0
```

> Use your backend host/port if not running locally.

### 4) Key directories (for enhancements)

- `src/pages/`
  - `landing/` → entry/home flow
  - `resident/` → resident portal
  - `worker/` → worker console workflows
  - `admin/` → admin dashboard/insights
- `src/components/`
  - shared UI components and map components
- `src/services/api.js`
  - all API integration logic (query, insight, queue, hotspots, status updates, escalations)
- `src/mockData/`
  - local sample data helpers
- `public/`
  - static assets and base HTML

### 5) Common teammate workflow

1. Create a feature branch:
   ```bash
   git checkout -b feat/<short-name>
   ```
2. Implement changes in the relevant `src/pages` + `src/components` files.
3. If adding/changing API calls, update `src/services/api.js`.
4. Run checks:
   ```bash
   npm run build
   ```
5. Commit and push:
   ```bash
   git add .
   git commit -m "feat: <what changed>"
   git push origin feat/<short-name>
   ```

### 6) Notes before submitting work

- Keep role flows separate (resident vs worker vs admin).
- Confirm worker actions still behave correctly after UI changes.
- Avoid enabling mock fallback in production-targeted testing.
