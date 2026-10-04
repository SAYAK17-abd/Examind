# EXAMIND — AI Evaluation Service (MEM2 Module)

Production-grade, asynchronous-ready AI evaluation service built with **Python 3.11+** and **FastAPI**. It integrates directly with the primary EXAMIND Spring Boot backend to deliver intelligent, multi-signal, and explainable assessment of student answers.

---

## 🏗️ Architecture

```text
Spring Boot Backend (Port 8080)
         │  REST (JSON)
         ▼
FastAPI AI Service (Port 8000)
   ├── /health & /ready (Diagnostics & Probes)
   ├── POST /api/v1/evaluate (Multi-signal Explainable Evaluation)
   ├── POST /api/v1/similarity/check (Pairwise Semantic Overlap)
   ├── POST /api/v1/insights/student (Personalized Student Mastery Analytics)
   └── POST /evaluate (Legacy backward-compatible alias)
```

---

## 🚀 Key Features

1. **Multi-Signal Evaluation**: Rather than basic string matching, combines semantic similarity, concept coverage, correctness, and completeness.
2. **Rubric-Based Scoring**: Evaluates answers against individual rubric criteria with discrete marks and justifications.
3. **Calibrated Confidence**: Computes confidence based on signal variance, answer depth, and rubric presence; automatically flags low-confidence evaluations (`< 0.60`) for Human-in-the-Loop teacher review.
4. **Replaceable AI Providers**: Abstract `AIProvider` pattern supports `MockAIProvider`, Gemini, OpenAI, or local open-source LLMs without modifying business logic.
5. **Academic Integrity Protection**: Semantic overlap analysis without automated or accusatory plagiarism labels.

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Deployment environment (`development` / `production`) |
| `PORT` | `8000` | Port on which the FastAPI service listens |
| `AI_SERVICE_API_KEY` | `""` | Optional shared secret for `X-AI-Service-Key` header |
| `LLM_PROVIDER` | `mock` | Active provider: `mock`, `gemini`, `openai` |
| `LLM_MODEL` | `gemini-1.5-flash` | LLM model identifier |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model for semantic search |
| `CONFIDENCE_REVIEW_THRESHOLD` | `0.60` | Threshold below which `requiresHumanReview = true` |
| `CONFIDENCE_AUTO_THRESHOLD` | `0.85` | Threshold for fully autonomous approval |

---

## 🧪 Running Locally & Testing

### 1. Run Unit & Integration Tests
```bash
cd ai-service
python -m pytest tests/ -v
```

### 2. Start the Service Locally
```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🐳 Docker Deployment

Build and run via Docker:
```bash
docker build -t examind-ai-service .
docker run -p 8000:8000 --env-file .env.example examind-ai-service
```
Or via root `docker-compose.yml`:
```bash
docker-compose up -d --build examind-ai-service
```

