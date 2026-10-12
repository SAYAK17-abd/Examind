# EXAMIND — Production Deployment Guide

## 1. Prerequisites

- **Docker Engine**: Version 24.0+ and **Docker Compose**: Version 2.20+
- **JDK (for non-container build)**: Java 21 LTS
- **Python (for non-container AI service)**: Python 3.11 with `pip`
- **Node.js (for non-container frontend)**: Node 20+ with `pnpm`

---

## 2. Docker Compose Deployment (Recommended)

### Step 1: Clone Repository & Configure Environment
```bash
git clone <repository_url> EXAMIND
cd EXAMIND
cp .env.example .env
```
Edit `.env` and configure strong production passwords:
- `POSTGRES_PASSWORD`: Use a strong, random password (min 16 chars).
- `JWT_SECRET`: Generate a cryptographically secure 256-bit+ HMAC-SHA256 secret.
- `CORS_ALLOWED_ORIGINS`: Set your production domains.

### Step 2: Build & Start All Services
```bash
docker compose up -d --build
```

### Step 3: Verify Container Health
```bash
docker compose ps
```
All containers should report `healthy` or `running`:
- `examind-postgres`: PostgreSQL 16 on port `5432`
- `examind-ai-service`: FastAPI AI Engine on port `8000`
- `examind-backend`: Spring Boot Backend on port `8080`
- `examind-frontend`: Nginx / React Frontend on ports `5173` and `3000`

### Step 4: Healthcheck Verification
```bash
# Check Spring Boot Actuator
curl -f http://localhost:8080/actuator/health

# Check AI Service Health
curl -f http://localhost:8000/health

# Check Frontend Nginx
curl -I http://localhost:5173
```

---

## 3. Local Development Startup (Without Docker)

### 3.1 PostgreSQL Database
Ensure a local PostgreSQL instance is running on port `5432` with database `examind`, user `examind_user`, and password `examind_password`.

*(Alternatively, run the Spring Boot backend using the default `dev` profile, which automatically spins up an in-memory H2 database).*

### 3.2 AI Service
```bash
cd ai-service
python -m venv venv
# Linux / macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3.3 Backend (Spring Boot)
```bash
# In the root repository directory:
./mvnw clean spring-boot:run
```
*(On Windows: `.\mvnw.cmd clean spring-boot:run`)*

### 3.4 Frontend (React / Vite)
```bash
cd frontend
pnpm install
pnpm run dev
```
Access the application at `http://localhost:5173`.

---

## 4. Production Hardening Checklist

1. **Database Flyway**: Flyway migrations run automatically on startup (`FLYWAY_ENABLED=true`). Verify `flyway_schema_history` table exists in PostgreSQL.
2. **Reverse Proxy & SSL**: Terminate TLS at the load balancer or external Nginx / Cloudflare gateway with HTTP/2 and modern cipher suites.
3. **Storage Persistence**: Ensure the `postgres_data` and `file_uploads` Docker volumes are backed by redundant persistent storage (e.g. AWS EBS or GCP Persistent Disk).
4. **Log Forwarding**: Forward Docker standard output logs (`X-Request-ID` enriched) to a centralized logging system (Datadog, Grafana Loki, or AWS CloudWatch).

