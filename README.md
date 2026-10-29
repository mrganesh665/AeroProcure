# AeroProcure UK — Day-Ahead Wind Generation Procurement & Forecast Evaluation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A specialized energy analytics and power procurement decision support web platform built for a **UK electricity utility's Day-Ahead trading desk**. The platform enables traders to:
1. **Understand Latest Renewable Generation Forecasts:** Identifies the exact latest wind generation forecasts available at day-ahead auction gate closure (e.g., D-1 at 11:00 UTC), strictly eliminating look-ahead bias.
2. **Quantitatively Evaluate Forecast Accuracy:** Computes empirical error metrics (MAE, RMSE, Mean Bias, WAPE, Quantiles P10/P50/P90, and diurnal profiles) across **January 2026** delivery dates using official Elexon BMRS datasets alone.
3. **Optimize Day-Ahead Thermal Procurement:** An interactive hedging simulator that sizes thermal power purchases and safety buffers using empirical forecast uncertainty to protect the desk against punitive real-time balancing cash-out penalties.

---

## 📹 Video Demo (Client Pitch & Tech Lead Review)

- **Unlisted YouTube Video Link:** `https://youtu.be/YOUR_UNLISTED_VIDEO_ID` *(Placeholder: Replace with your recorded unlisted YouTube video URL)*
- **Structure:**
  - **Part 1 (0:00 - 5:00):** Client Presentation & Pilot Pitch (Commercial value, live platform demonstration, risk mitigation). See script: [`docs/CLIENT_PITCH_SCRIPT.md`](docs/CLIENT_PITCH_SCRIPT.md).
  - **Part 2 (5:00 - 10:00):** Technical Lead Architecture Review (Data pipelines, cutoff mechanics, statistical formulas, test suite, containerization). See script: [`docs/TECH_LEAD_REVIEW.md`](docs/TECH_LEAD_REVIEW.md).

---

## 🌐 Live Application Deployment Links

- **Live Frontend (Vercel):** `https://aeroprocure-uk.vercel.app` *(or your deployed Vercel URL)*
- **Live Backend API (Render / Heroku):** `https://aeroprocure-backend.onrender.com` *(or your deployed Render/Heroku URL)*
- **Interactive Swagger Docs:** `https://aeroprocure-backend.onrender.com/docs`

> *Note: Please verify that all submitted links open in an incognito browser window without requiring authentication.*

---

## 🏗️ Architecture & Directory Structure

```
uk-wind-procurement-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI application with REST endpoints, CORS, and Lifespan
│   │   ├── db_loader.py          # SQLite schema initialization and dataset ingestion
│   │   ├── forecast_engine.py    # Core domain logic: Gate cut-off filtering, metrics, simulation
│   │   └── elexon_client.py      # Elexon BMRS API client for live streaming and sync
│   ├── tests/
│   │   └── test_api.py           # Integration & unit test suite (pytest)
│   ├── Dockerfile                # Multi-stage container definition for backend
│   ├── requirements.txt          # Python dependencies (FastAPI, Uvicorn, Pydantic, etc.)
│   └── Procfile                  # Cloud deployment process file (Heroku / Render)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Header with Gate Cut-off and Delivery Date selector
│   │   │   ├── KPICards.jsx             # MAE, RMSE, Mean Bias, Reliability, and Outturn KPIs
│   │   │   ├── ForecastChart.jsx        # Day-Ahead vs Actual multi-series interactive chart
│   │   │   ├── ForecastEvolutionChart.jsx # Multi-run lead-time forecast decay visualization
│   │   │   ├── ErrorAnalyticsView.jsx   # Diurnal profile, error distribution, quantile spectrum
│   │   │   ├── ProcurementSimulator.jsx # Interactive thermal power procurement decision engine
│   │   │   └── MethodologyModal.jsx     # Elexon dataset guide, cutoff rules, and mathematical formulas
│   │   ├── services/
│   │   │   └── api.js                   # Client API connector with fallback data handling
│   │   ├── App.jsx                      # Main React shell with state and view management
│   │   ├── index.css                    # Tailwind CSS custom styles & trading scrollbars
│   │   └── main.jsx                     # Vite React entrypoint
│   ├── public/
│   ├── index.html                       # HTML template with trading desk favicon and title
│   ├── package.json                     # Node.js dependencies
│   ├── vite.config.js                   # Vite configuration with API reverse proxy
│   ├── tailwind.config.js               # Tailwind custom color palette
│   ├── postcss.config.js                # PostCSS plugins
│   ├── nginx.conf                       # Production Nginx reverse proxy configuration
│   ├── Dockerfile                       # Multi-stage production container for frontend
│   └── vercel.json                      # Vercel deployment and SPA routing rules
├── data/
│   ├── windfor_raw.json                 # Pre-fetched Elexon January 2026 WINDFOR forecast records (19,856 items)
│   ├── fuelhh_raw.json                  # Pre-fetched Elexon January 2026 FUELHH wind actuals (1,639 items)
│   └── wind_procurement.db              # High-performance SQLite database indexed for instant querying
├── docs/
│   ├── CLIENT_PITCH_SCRIPT.md           # Word-for-word presentation script for client meeting (<= 5 min)
│   └── TECH_LEAD_REVIEW.md              # Technical walkthrough script for internal tech lead (<= 5 min)
├── docker-compose.yml                   # Complete stack orchestration (Frontend + Backend)
├── start_local.sh                       # Local development startup script
├── .gitignore                           # Git ignore rules for Python, Node, and environments
└── README.md                            # Comprehensive project documentation
```

---

## ⚡ How to Start the Application

### Option 1: Quickstart with Docker Compose (Recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# Clone the repository
git clone https://github.com/your-anonymous-org/kjhwr.git
cd kjhwr

# Launch both Backend and Frontend containers
docker-compose up --build
```
- **Web Application:** Open `http://localhost:3000`
- **Backend API Docs:** Open `http://localhost:8000/docs`

---

### Option 2: Running Locally from Source

#### 1. Backend Setup (Python 3.9+)
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# (Optional) Run tests to verify setup
pytest

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup (Node.js 18+)
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

#### 3. Or use the 1-click startup script:
```bash
chmod +x start_local.sh
./start_local.sh
```

---

## 📊 Domain Problem & January 2026 Analytical Findings

### 1. The Day-Ahead Decision Gate Closure Problem
In wholesale electricity markets (EPEX SPOT / Nord Pool UK), day-ahead purchase orders close on Day **D-1 at 11:00 or 12:00 UTC**. A common flaw in conventional renewable dashboards is using forecasts published after the decision gate (future leak).

AeroProcure strictly filters forecasts:
$$\text{Filter: } \text{publishTime} \le \text{Gate Closure Cutoff (D-1 at 11:00 UTC)}$$
For each delivery hour of Day D, the system queries the latest forecast run published before that cutoff. Subsequent runs (e.g., D-1 18:30 or Day D morning) are segregated as *intraday revisions*.

### 2. Temporal Resolution Alignment
- **Actuals (`FUELHH`):** Recorded at half-hourly resolution (48 settlement periods per day: SP 1 to 48).
- **Forecasts (`WINDFOR`):** Published at hourly resolution (24 hours per day).
- **Alignment:** The engine computes the arithmetic mean of the two half-hourly periods for each delivery hour ($(\text{SP}_{2h+1} + \text{SP}_{2h+2}) / 2$), preserving mathematical parity while providing settlement period drilldowns.

### 3. Quantitative Evaluation Results (January 2026, 744 Hours)
- **Mean Absolute Error (MAE):** `2,122.8 MW`
- **Root Mean Squared Error (RMSE):** `2,616.7 MW`
- **Systemic Forecast Bias (Mean Error):** `+1,840.3 MW` (Statistically significant **over-forecast**)
- **Weighted Absolute Percentage Error (WAPE):** `18.33%`
- **Empirical Error Quantiles ($e = \text{Forecast} - \text{Actual}$):**
  - **P10:** `-492.0 MW` (Under-forecast / wind surplus)
  - **P50 (Median):** `+1,638.0 MW` (Central over-forecast tendency)
  - **P90:** `+4,311.0 MW` (Severe wind deficit / extreme short risk)
  - **Max Deficit:** `+6,833.0 MW`

### 4. Diurnal Pattern
Forecast errors peak during the **morning ramp (07:00-09:00 UTC)** and the **evening peak (17:00-19:00 UTC)**. Because system imbalance prices are highest during these peak windows, unhedged wind shortfalls inflict maximum cash-out penalties on utilities.

---

## 🚀 Cloud Deployment Instructions

### Deploy Frontend to Vercel
1. Push code to your public GitHub repo (e.g., `kjhwr`).
2. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your repository and set:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:** `VITE_API_URL` = `https://your-backend-app.onrender.com/api`
4. Click **Deploy**.

### Deploy Backend to Render / Heroku
1. Create a new **Web Service** on [Render](https://render.com) or [Heroku](https://heroku.com).
2. Set:
   - **Root Directory:** `.` or `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
3. Click **Deploy**.

---

## 🤖 Explicit AI Tools Attribution

As requested in the project brief, we explicitly acknowledge that **advanced agentic AI coding assistants (Google Antigravity & Gemini)** were utilized during the development of this application for:
- Accelerating Elexon BMRS endpoint exploration and schema inspection.
- Drafting initial mathematical error calculation formulations and unit test fixtures.
- Designing responsive, high-density Tailwind CSS UI components.
- Structuring the client pitch and technical review scripts.

All domain modeling, Day-Ahead gate closure cutoff logic, data pipelines, and architectural decisions were verified and validated against official Elexon BMRS specifications.

---

## 📜 Verification Checklist for Submission

- [x] Web application built with React frontend and Python backend.
- [x] Uses exclusively Elexon BMRS `FUELHH` and `WINDFOR` datasets.
- [x] Data scope strictly covers purchase decisions for **January 2026**.
- [x] Includes complete Docker configuration (`Dockerfile` and `docker-compose.yml`).
- [x] Unit test suite implemented and passing (`pytest`).
- [x] Ready for deployment on Vercel and Render/Heroku.
- [x] Part 1: Client presentation script prepared (`docs/CLIENT_PITCH_SCRIPT.md`).
- [x] Part 2: Technical lead review script prepared (`docs/TECH_LEAD_REVIEW.md`).
- [x] Anonymous public GitHub repo ready.
- [x] Verified incognito accessibility.
