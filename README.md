# 🌡️ Heat-CDD — Cool Block Commander

**A prototype urban heat-risk dashboard for Mumbai and Mysuru.** Explore ward-level heat vulnerability, compare priority areas, and plan cooling interventions within a configurable budget.

## What it does

- **Two cities:** Explore 24 Mumbai wards and 15 Mysuru zones.
- **Interactive map:** View ward-level heat-risk estimates and select areas to inspect.
- **Risk prioritization:** Compare simplified WBGT-like estimates, vulnerability indicators, and the Heat Mortality Risk Index (HMRI).
- **Budget planning:** Generate a ranked intervention plan using a configurable budget and intervention costs.
- **Progress tracking:** Register officers, sign in, and record completed actions in a SQLite database.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | HTML, JavaScript, Tailwind CSS, Leaflet |
| Backend | Python, FastAPI, Pandas, NumPy |
| Storage | SQLite and CSV ward profiles |
| Deployment | Vercel (frontend) · Render (backend Docker service) |

## How it works

1. Select Mumbai or Mysuru and set the planning budget and heatwave scenario.
2. The FastAPI backend scores and ranks wards using their profile and previously recorded interventions.
3. The dashboard displays the risk estimates, budget allocation, and suggested actions.
4. Mark actions as completed to update the saved intervention state and advance the planning day.

> **Please note:** This is a demonstration prototype. The current optimizer uses simplified heuristic calculations and sample ward-profile data. The scores and simulated intervention reductions are not validated public-health predictions, and the metric values shown in the UI should not be treated as independently verified model performance. Do not use this project as the sole basis for real emergency, health, or budget decisions.


Activate the environment:



## Deploy

The repository is configured for a separate Vercel frontend and Render backend.

### 1. Backend — Render

Create a **Web Service** from this GitHub repository with:

| Setting | Value |
|---|---|
| Branch | `main` |
| Runtime | Docker |
| Root Directory | Leave blank (repository root) |
| Dockerfile Path | `backend/Dockerfile` |
| Docker Build Context | `.` |
| Docker Command | Leave blank; use the Dockerfile command |
| Port environment variable | `PORT=8000` |

The backend is expected at **https://heat-cdd-backend.onrender.com**.

### 2. Frontend — Vercel

Import `r-samarth/heat-CDD` into Vercel and set:

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Other |
| Build Command | None |
| Output Directory | `.` |

The `frontend/vercel.json` file proxies `/api/*` and `/optimize` requests to the Render backend. Deploy the backend first and make sure it is live before testing the frontend.

**Deployment note:** The SQLite database is stored inside the backend directory. Render's default filesystem may not preserve it across restarts or redeployments; use a persistent disk for data that must survive.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/cities` | List supported cities |
| `POST` | `/optimize` | Calculate ward scores and budget recommendations |
| `POST` | `/api/register` | Register an officer |
| `POST` | `/api/login` | Officer login |
| `POST` | `/api/verify-budget-password` | Verify budget authorization |
| `POST` | `/api/commit-actions` | Save completed interventions |

Full request and response schemas are available at `/docs`.

## Project structure

```text
heat-CDD/
├── backend/
│   ├── main.py
│   ├── Dockerfile
│   ├── generate_db.py
│   └── data/
├── frontend/
│   ├── index.html
│   └── vercel.json
└── requirements.txt
```

## Important

- Use sample credentials and demo data only. Authentication is prototype-level and is not suitable for production without security improvements.
- The frontend uses external map/geometry and CDN resources, so an internet connection is required.
- Review and validate all input data, assumptions, and intervention costs before any real-world use.

## Contributing

Suggestions, bug reports, and pull requests are welcome.

- [Report an issue](https://github.com/r-samarth/heat-CDD/issues)
- [View the source code](https://github.com/r-samarth/heat-CDD)
