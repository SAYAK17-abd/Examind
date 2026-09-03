# EXAMIND — AI-Powered Examination & Evaluation Platform Backend

**EXAMIND** is an enterprise-grade, production-ready backend built with **Java 25** and **Spring Boot 3.3.5**. It powers an AI-assisted online examination, automated evaluation, teacher-in-the-loop review, anti-plagiarism similarity analysis, and comprehensive performance analytics platform.

---

## Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Client / Frontend      │
                          │  (React / Mobile / Web)  │
                          └─────────────┬────────────┘
                                        │ REST / JSON (JWT Bearer)
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                        EXAMIND Spring Boot 3                           │
    │                                                                        │
    │  [RateLimitingFilter] ──► [JwtAuthenticationFilter] ──► [SecurityCtx]  │
    │                                                                        │
    │  ┌─────────────────────── REST Controllers ─────────────────────────┐  │
    │  │  AuthController  │  UserController  │  AdminUserController        │  │
    │  │  TeacherExamCtrl │  StudentExamCtrl │  TeacherQuestionCtrl        │  │
    │  │  TeacherRubric   │  SubmissionCtrl  │  FileUploadController       │  │
    │  │  TeacherEvalCtrl │  ResultCtrl      │  TeacherAnalyticsCtrl       │  │
    │  │  SimilarityCtrl  │  NotificationCtrl│                             │  │
    │  └──────────────────────────────────┬───────────────────────────────┘  │
    │                                     │                                  │
    │  ┌──────────────────────── Service Layer ────────────────────────────┐  │
    │  │  AuthService     │  ExamService     │  QuestionService            │  │
    │  │  RubricService   │  SubmissionServ  │  AnswerService              │  │
    │  │  FileStorageServ │  EvaluationServ  │  ResultService              │  │
    │  │  AnalyticsServ   │  SimilarityServ  │  NotificationService        │  │
    │  │  AuditService    │                                                │  │
    │  └──────────────┬───────────────────┬────────────────────────────────┘  │
    │                 │                   │                                  │
    │                 │ Event Publisher   │ REST Call                        │
    │                 ▼                   ▼                                  │
    │     [AsyncEvaluationProcessor] ──► [AiServiceClient]                   │
    │     (Thread Pool: examind-eval)         │                              │
    │                                         │                              │
    │  ┌───────────────────────── JPA Repositories ────────────────────────┐  │
    │  │ 14 Repositories: User, Role, RefreshToken, Exam, Question, Rubric,│  │
    │  │ Submission, Answer, Evaluation, Version, Result, Similarity, etc. │  │
    │  └──────────────────────────────────┬────────────────────────────────┘  │
    └─────────────────────────────────────┼──────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
      ┌───────────────────────────┐               ┌───────────────────────────┐
      │     PostgreSQL / H2       │               │ Python FastAPI AI Service │
      │      Database Layer       │               │ (Mock / LLM Integration)  │
      └───────────────────────────┘               └───────────────────────────┘
```

---

## Key Features

1. **Robust Authentication & RBAC**:
   - Stateless JWT authentication using JJWT 0.12.6 with HS256 HMAC keys.
   - Refresh token rotation with revoke and expiry management.
   - Granular role-based security (`ROLE_STUDENT`, `ROLE_TEACHER`, `ROLE_ADMIN`).
   - Brute-force rate limiting filter on authentication endpoints.
2. **Strict Exam Lifecycle Management**:
   - Draft $\to$ Published $\to$ Ongoing $\to$ Completed $\to$ Archived.
   - Strict window validation: `duration <= (end - start)` and `start < end`.
   - Resource ownership: Teachers can only edit/manage exams they created.
3. **Questions & Rubric Engine**:
   - Supports `MCQ`, `SHORT_ANSWER`, `DESCRIPTIVE`, and `CODING`.
   - Criteria-based evaluation rubrics with weighting and maximum marks constraints.
   - Student answer redaction: Reference answers are strictly hidden from student views.
4. **Student Examination Flow**:
   - Single active attempt recovery and deadline calculation: `min(startTime + duration, examEndTime)`.
   - Incremental answer auto-save with student ownership verification.
   - Exam submission locking and time violation enforcement.
5. **Secure File Upload System**:
   - Strict 10MB limit, whitelist of extensions (`pdf`, `jpg`, `jpeg`, `png`) and MIME types.
   - Magic byte header inspection (`%PDF`, PNG, JPEG) preventing disguised executable uploads.
   - UUID filename sanitization and path-traversal prevention.
6. **Asynchronous AI Evaluation & Human-in-the-Loop**:
   - Decoupled event-driven evaluation using `@Async("evaluationTaskExecutor")`.
   - Semantic alignment, concept coverage, and confidence scoring.
   - Confidence thresholding: Scores $\ge 0.80$ marked `AUTO_EVALUATED`, $< 0.80$ marked `REVIEW_REQUIRED`.
   - Teacher score override with mandatory reason logging and full audit version history (`EvaluationVersion`).
7. **Results & Analytics Dashboard**:
   - Automated grade calculation (`A+`, `A`, `B`, `C`, `D`, `F`) and pass/fail detection.
   - Cohort performance metrics: average, highest, lowest, median marks, pass percentage, grade distribution.
   - Question-level difficulty and success rate analysis.
8. **Academic Integrity & Similarity Detection**:
   - Pairwise n-gram tokenization and Jaccard similarity comparison across descriptive answers.
   - Automatic flagging of `HIGH_SIMILARITY` (> 80%) for teacher review.
9. **In-App Notification Center**:
   - Notification delivery for exam publishing, evaluation completion, and grading updates.
   - Unread badges and batch read markers.
10. **Enterprise Audit Logging**:
    - Centralized audit trail recording actor ID, client IP address, entity ID, action, and timestamp without sensitive secret leakage.

---

## Tech Stack

| Component | Technology |
|---|---|
| Language | Java 25 |
| Framework | Spring Boot 3.3.5 |
| Web Layer | Spring MVC + Jackson |
| Security | Spring Security 6 + JJWT 0.12.6 + BCrypt (strength 12) |
| Database Layer | Spring Data JPA + Hibernate 6 |
| Production DB | PostgreSQL 16 |
| Development DB | In-Memory H2 (`jdbc:h2:mem:examind_dev`) |
| API Docs | Springdoc OpenAPI 2.6.0 (Swagger 3) |
| Testing | JUnit 5 + Spring Boot Test + MockMvc |
| Build Tool | Maven Wrapper (`mvnw`) |
| Containerization | Docker (Multi-stage build) + Docker Compose |

---

## Quickstart Guide

### Option 1: Local Development (Zero-Config In-Memory H2)

Prerequisites: JDK 25+ installed.

```bash
# Clone and enter project directory
cd "d:/CODES/project.all/New folder"

# Build and run all automated integration tests
./mvnw clean test

# Run the backend locally with the 'dev' profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

- Server will start at: `http://localhost:8080`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON Spec: `http://localhost:8080/v3/api-docs`
- H2 Web Console: `http://localhost:8080/h2-console` (`JDBC URL: jdbc:h2:mem:examind_dev`, `User: SA`, `Password: `)

Default Admin Account (Auto-seeded):
- **Email:** `admin@examind.ai`
- **Password:** `Admin@Examind2026!`

---

### Option 2: Production Multi-Container Stack (Docker Compose)

Prerequisites: Docker and Docker Compose installed.

```bash
# Launch PostgreSQL, AI Mock Service, and Spring Boot Backend
docker-compose up --build -d
```

Containers launched:
1. `examind-postgres`: PostgreSQL 16 on port `5432` with healthcheck.
2. `examind-ai-service`: Python FastAPI service on port `8000` for AI evaluation and OCR.
3. `examind-backend`: Spring Boot 3 application on port `8080`.

---

## API Reference Summary

### Authentication (`/api/auth`)
| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register student or teacher account |
| `POST` | `/api/auth/login` | Public | Authenticate user and return JWT access + refresh tokens |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for new access token |
| `POST` | `/api/auth/logout` | Authenticated | Revoke refresh token and invalidate session |

### User Profile & Administration (`/api/users`, `/api/admin`)
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Authenticated | Retrieve profile details of authenticated user |
| `PUT` | `/api/users/me` | Authenticated | Update full name and bio |
| `GET` | `/api/admin/users` | Admin | List all registered users (paginated, filter by role/status) |
| `PATCH` | `/api/admin/users/{id}/status` | Admin | Update user status (`ACTIVE`, `BLOCKED`, `PENDING`) |

### Teacher Exam Management (`/api/teacher/exams`)
| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/api/teacher/exams` | Teacher/Admin | Create a new exam in `DRAFT` status |
| `GET` | `/api/teacher/exams` | Teacher/Admin | List exams created by authenticated teacher |
| `GET` | `/api/teacher/exams/{id}` | Teacher/Admin | Get detailed exam data with questions |
| `PUT` | `/api/teacher/exams/{id}` | Teacher/Admin | Update exam details |
| `POST` | `/api/teacher/exams/{id}/publish` | Teacher/Admin | Publish exam to make it accessible to students |
| `POST` | `/api/teacher/exams/{id}/unpublish` | Teacher/Admin | Revert published exam to draft |
| `DELETE` | `/api/teacher/exams/{id}` | Teacher/Admin | Delete draft exam |

### Question & Rubric Management (`/api/teacher/exams/{examId}/questions`)
| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/api/teacher/exams/{examId}/questions` | Teacher/Admin | Add question with optional grading rubric |
| `GET` | `/api/teacher/exams/{examId}/questions` | Teacher/Admin | List all questions for an exam |
| `PUT` | `/api/teacher/exams/{examId}/questions/{id}` | Teacher/Admin | Update question details and rubric |
| `DELETE` | `/api/teacher/exams/{examId}/questions/{id}` | Teacher/Admin | Delete question |

### Student Examination Flow (`/api/student`)
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/student/exams` | Student/Admin | Browse published and available exams |
| `GET` | `/api/student/exams/{id}` | Student/Admin | View exam details before starting |
| `POST` | `/api/student/exams/{id}/start` | Student/Admin | Start exam attempt or resume active submission |
| `POST` | `/api/student/submissions/{id}/answers` | Student/Admin | Save or update student answer |
| `POST` | `/api/student/submissions/{id}/submit` | Student/Admin | Submit exam and queue async evaluation |
| `POST` | `/api/submissions/{id}/files` | Student/Admin | Upload scanned answer sheet (`.pdf`, `.jpg`, `.png`) |

### Evaluation & Human-in-the-Loop (`/api/teacher/evaluations`)
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/teacher/evaluations/{id}` | Teacher/Admin | View AI evaluation feedback, score, and confidence |
| `POST` | `/api/teacher/evaluations/{id}/approve` | Teacher/Admin | Accept AI evaluation |
| `POST` | `/api/teacher/evaluations/{id}/override` | Teacher/Admin | Override score and feedback with mandatory audit reason |
| `GET` | `/api/teacher/evaluations/{id}/history` | Teacher/Admin | Inspect full version history of an evaluation |

### Results & Analytics (`/api/student/results`, `/api/teacher`)
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/student/results` | Student/Admin | View own published exam results and feedback |
| `GET` | `/api/student/results/{id}` | Student/Admin | View single result breakdown |
| `GET` | `/api/teacher/exams/{id}/results` | Teacher/Admin | View cohort results for an exam |
| `GET` | `/api/teacher/exams/{id}/analytics` | Teacher/Admin | Get exam score statistics, distributions, and AI stats |
| `GET` | `/api/teacher/exams/{id}/question-analysis` | Teacher/Admin | Question success rates and difficulty analysis |
| `GET` | `/api/teacher/students/{id}/performance` | Teacher/Admin | Cumulative student academic performance |

### Academic Integrity & Similarity (`/api/teacher/exams/{id}`)
| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/api/teacher/exams/{id}/similarity-check` | Teacher/Admin | Execute pairwise answer similarity scan |
| `GET` | `/api/teacher/exams/{id}/similarity-reports` | Teacher/Admin | Retrieve flagged correlated answer pairs |

### Notifications (`/api/notifications`)
| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | List user notifications |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get unread count badge |
| `PATCH` | `/api/notifications/{id}/read` | Authenticated | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## Verification & Automated Testing

The application includes an integration test suite validating:
1. `AuthControllerIntegrationTest`: User registration, duplicate email rejection, login authentication, JWT issuance, profile access, and token refreshment.
2. `ExamAndSubmissionIntegrationTest`: Full exam lifecycle (Teacher creates exam $\to$ creates question with rubric $\to$ publishes exam $\to$ student discovers exam $\to$ student starts submission $\to$ student saves answer $\to$ student submits $\to$ async AI evaluation $\to$ result calculation $\to$ teacher override with version audit $\to$ analytics verification).
3. `SecurityAndOwnershipTest`: Unauthenticated request rejection (401), cross-role authorization boundary enforcement (403), and admin route protection.

To run the complete test suite:
```bash
./mvnw clean test
```
Result: **7 passed, 0 failures, 0 errors**.
