# PRISM

Real-time observability + ML anomaly detection with one-command startup.

## Architecture (High Level)

- Data Sources: application telemetry and OpenTelemetry signals (metrics, logs, traces)
- Ingestion: Backend API and OTEL endpoints receive telemetry
- Processing: backend pipeline normalizes data and extracts model features
- ML Inference: Python FastAPI service receives features and returns risk/failure prediction
- Storage: PostgreSQL stores telemetry and prediction records
- Realtime Delivery: backend broadcasts updates to UI via WebSocket
- Visualization: React dashboard shows health, trends, predictions, and failures

## Data Collection

Data can be collected in two ways:

- Direct telemetry API: `/api/v1/telemetry`
- OTEL collector path: OTEL SDK -> Collector (`:4317`/`:4318`) -> backend `/v1/traces|metrics|logs`

For local validation, use the bundled generator script (shown below) to continuously push test telemetry.

## Data Flow (End to End)

1. Service emits telemetry event
2. Backend receives and validates payload
3. Telemetry is persisted in PostgreSQL
4. Pipeline preprocesses and extracts feature vector
5. Backend calls ML service `/predict`
6. ML service returns prediction result (status, scores, top/risky services)
7. Prediction is stored in PostgreSQL
8. Backend emits realtime update to dashboard

## Model Input and Prediction

- Model receives processed telemetry-derived features from backend
- Sequence/window behavior is supported in ML service (warm-up before stable predictions)
- During warm-up, prediction status may be `warming_up`
- After enough windows, model returns prediction output used by backend to mark failures
- Failures are shown in UI and stored in `predictions` table

## Prerequisites

- Docker Desktop running
- Docker Compose v2

## 1) Start Everything (one command)

Run from repo root:

```bash
docker compose up -d --build
```

This starts and wires:
- PostgreSQL
- Redis
- ML service (FastAPI)
- Backend (Express + Prisma auto schema sync)
- Frontend (React)
- OTEL Collector
- Prometheus
- Grafana

## 2) Verify Services

```bash
docker compose ps
```

Expected: all services in Up/healthy state.

## 3) Open UI

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/health
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3002

## 4) Send Realtime Test Data

Run from repo root:

```bash
cd backend
node scripts/testDirectTelemetry.js 180 15000 payment mixed
```

Arguments:
- 180: duration in seconds
- 15000: one event every 15 seconds (safe vs rate limit)
- payment: fixed service name
- mixed: normal mixed traffic

For 6-window model behavior test (failure wave after warm-up):

```bash
node scripts/testDirectTelemetry.js 480 15000 payment window-failure
```

## 5) Confirm Results

```bash
cd ..
docker compose exec database psql -U postgres -d prism_db -c "SELECT COUNT(*) AS telemetry_count FROM telemetry;"
docker compose exec database psql -U postgres -d prism_db -c "SELECT COUNT(*) AS prediction_count FROM predictions;"
docker compose exec database psql -U postgres -d prism_db -c "SELECT COUNT(*) AS failure_count FROM predictions WHERE failure = true;"
```

Then check UI at http://localhost:3000 for live updates.

## Stop / Reset

```bash
docker compose down
docker compose down -v
```
