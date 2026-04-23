# PRISM

Real-time microservice observability platform with ML-powered anomaly detection and OpenTelemetry integration.

**Tech Stack:** Node.js 20+ | Express.js | React 19 + TypeScript | PostgreSQL 16 | PyTorch | Docker

---

## 🚀 Quick Start

### Development
```bash
# Backend
cd backend && npm install && npm run prisma:generate && npm run prisma:push
npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# ML Service (new terminal)
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python main.py
```

Backend: `http://localhost:3001`  
Frontend: `http://localhost:5173`  
ML Service: `http://localhost:8000`

### Docker
```bash
docker compose build
docker compose up -d
```

**Services:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (admin/admin)
- OTEL Collector: `:4317` (gRPC), `:4318` (HTTP)
- PostgreSQL: `:5432`

---

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/metrics` | GET | Prometheus metrics |
| `/api/v1/telemetry` | POST | Ingest telemetry |
| `/api/v1/telemetry` | GET | Query telemetry |
| `/api/v1/predictions` | GET | List predictions |
| `/api/v1/services` | GET | List services |
| `/v1/traces` | POST | OTEL traces |
| `/v1/metrics` | POST | OTEL metrics |
| `/v1/logs` | POST | OTEL logs |

---

## 📤 Integrate Your Microservice

### Node.js
```bash
npm install @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/auto @opentelemetry/exporter-trace-otlp-http
```

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
});
sdk.start();
```

### Python
```bash
pip install opentelemetry-api opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-http
```

```python
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor

exporter = OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces")
trace_provider = TracerProvider()
trace_provider.add_span_processor(BatchSpanProcessor(exporter))
```

### Java
```gradle
implementation 'io.opentelemetry:opentelemetry-exporter-otlp:1.32.0'
```

---

## 🧪 Testing

```bash
cd backend && npm test
npm test -- --coverage
npm run test:e2e
```

---

## 📊 Key Metrics

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| CPU | <50% | 50-70% | >90% |
| Memory | <60% | 60-75% | >95% |
| Latency | <50ms | 50-200ms | >500ms |
| Error Rate | <1% | 1-5% | >15% |

---

## 🔧 Configuration

### Backend `.env`
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/prism_db
ML_SERVICE_URL=http://localhost:8000
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend `.env.local`
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup & integration
- **[SYSTEM_WALKTHROUGH.md](SYSTEM_WALKTHROUGH.md)** - Complete data flow
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Commands cheatsheet

---

## 📦 Stack

**Backend:** Express.js | PostgreSQL + Prisma | Winston | Prometheus  
**Frontend:** React 19 | Vite | TypeScript | Zustand  
**ML:** Python 3.11 | FastAPI | PyTorch 2.5+  
**DevOps:** Docker Compose | OTEL Collector | Kubernetes-ready  

---

## 🧹 Cleanup

```bash
# Stop services
docker compose down

# Reset database
docker compose down -v

# View logs
docker compose logs -f backend
```

---

## 📄 License

MIT
- Error Rate & Latency Dashboard

## 🔐 Security Features

- **Helmet**: HTTP security headers
- **CORS**: Configurable origin validation
- **Rate Limiting**: Token bucket algorithm
- **Input Validation**: express-validator + Prisma
- **Error Handling**: Secure error responses (no stack traces in production)
- **Logging**: Correlation IDs for audit trails
- **Dependencies**: Regular security updates via Dependabot

### Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Always use HTTPS in production
3. **Authentication**: Implement JWT/OAuth for API (coming soon)
4. **Database**: Use connection pooling and parameterized queries
5. **Secrets**: Use managed secrets in production (AWS Secrets Manager, etc.)

## 🏥 Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Frontend (from browser)
http://localhost:3000

# Metrics
curl http://localhost:3001/metrics
```

## 📈 Scaling & Deployment

### Kubernetes Deployment

```bash
# Build and push images
docker build -t your-registry/prism-backend backend/
docker build -t your-registry/prism-frontend frontend/
docker push your-registry/prism-backend
docker push your-registry/prism-frontend

# Deploy with Helm or kubectl
kubectl apply -f k8s/
```

### Performance Optimization

- Database query optimization and indexing
- Redis caching for frequently accessed data
- Frontend code splitting and lazy loading
- Gzip compression enabled
- CDN integration for static assets

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL
psql -h localhost -U postgres -d prism_db

# Reset migrations
cd backend
npx prisma migrate reset
npx prisma db push
```

### Port Already in Use
```bash
# Backend
lsof -i :3001  # Find process, kill with: kill -9 <PID>

# Frontend
lsof -i :3000
```

### Correlation ID Tracking
All requests include `x-correlation-id` header for debugging:
```bash
curl -v http://localhost:3001/api/v1/dashboard/summary | grep correlation
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Architecture Decision Records](./docs/ADR/)
- [Contributing Guide](./CONTRIBUTING.md)

## 🚦 CI/CD Pipeline

GitHub Actions workflow runs on every push:

1. **Unit Tests**: Backend with Jest, frontend with Vite
2. **Code Quality**: ESLint, TypeScript strict mode
3. **Security**: Trivy vulnerability scanning, npm audit
4. **Docker Build**: Multi-stage builds for optimization
5. **Deployment**: Automated deployment on merge to main

View pipeline status: `.github/workflows/ci-cd.yml`

## 📝 Logging & Debugging

### Log Levels
- `error`: Application errors
- `warn`: Warnings and degraded states
- `info`: General information
- `debug`: Detailed debugging info

### View Logs
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Local logs
tail -f backend/logs/combined-*.log
tail -f backend/logs/error-*.log
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m "feat: description"`
4. Push to branch: `git push origin feature/name`
5. Open pull request


