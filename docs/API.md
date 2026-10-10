# EXAMIND — REST API Specification

All backend endpoints are prefixed with `/api`. OpenAPI / Swagger 3.0 documentation is available at `/swagger-ui/index.html` and `/v3/api-docs`.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "teacher@examind.test",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ROLE_TEACHER"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "48f3b2a1...",
    "expiresInMs": 86400000,
    "user": {
      "id": 1,
      "email": "teacher@examind.test",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ROLE_TEACHER"
    }
  },
  "message": "User registered successfully"
}
```

### 1.2 Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "teacher@examind.test",
  "password": "Password123!"
}
```
- **Response** (`200 OK`): Same structure as Register response.

### 1.3 Refresh Token
- **Method**: `POST`
- **URL**: `/api/auth/refresh`
- **Access**: Public
- **Request Body**:
```json
{
  "refreshToken": "48f3b2a1..."
}
```
- **Response** (`200 OK`): Returns new access token and rotated refresh token.

### 1.4 Logout
- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Access**: Public
- **Request Body**:
```json
{
  "refreshToken": "48f3b2a1..."
}
```
- **Response** (`200 OK`): Revokes refresh token in database and clears session.

---

## 2. Student Endpoints (`/api/student`)

All student endpoints require `Authorization: Bearer <JWT>` with role `ROLE_STUDENT`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/student/exams` | Lists published exams available for the student |
| `GET` | `/api/student/exams/{id}` | Retrieves exam instructions and details before starting |
| `POST` | `/api/student/exams/{id}/start` | Starts an exam attempt; creates a submission record |
| `POST` | `/api/student/submissions/{id}/answers` | Autosaves or updates an answer for a specific question |
| `POST` | `/api/student/submissions/{id}/submit` | Finalizes the exam submission and initiates AI evaluation |
| `GET` | `/api/student/submissions/{id}` | Retrieves submission answers and progress |
| `GET` | `/api/student/results` | Lists published exam results with grade, score, and pass/fail |
| `GET` | `/api/student/results/{id}` | Retrieves detailed question-wise evaluation, strengths, and feedback |
| `GET` | `/api/student/performance` | Retrieves student aggregate metrics (exams taken, average %, grade) |
| `GET` | `/api/student/insights` | Retrieves topic mastery, strong/weak areas, and revision advice |

---

## 3. Teacher Endpoints (`/api/teacher`)

All teacher endpoints require `Authorization: Bearer <JWT>` with role `ROLE_TEACHER`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/teacher/exams` | Lists exams created by the authenticated teacher |
| `POST` | `/api/teacher/exams` | Creates a new exam in `DRAFT` status |
| `GET` | `/api/teacher/exams/{id}` | Retrieves detailed exam information |
| `PUT` | `/api/teacher/exams/{id}` | Updates exam title, duration, schedule, or passing criteria |
| `DELETE` | `/api/teacher/exams/{id}` | Deletes a draft exam |
| `POST` | `/api/teacher/exams/{id}/publish` | Publishes an exam for student participation |
| `POST` | `/api/teacher/exams/{id}/questions` | Adds a question with optional rubric and expected concepts |
| `PUT` | `/api/teacher/questions/{id}` | Updates an existing question or rubric |
| `DELETE` | `/api/teacher/questions/{id}` | Deletes a question from an exam |
| `GET` | `/api/teacher/exams/{id}/submissions` | Lists all student submissions with status and AI score |
| `GET` | `/api/teacher/submissions/{id}` | Inspects a student submission and question evaluations |
| `GET` | `/api/teacher/evaluations/{id}` | Inspects AI evaluation breakdown and confidence |
| `POST` | `/api/teacher/evaluations/{id}/approve` | Approves an AI evaluation without score changes |
| `POST` | `/api/teacher/evaluations/{id}/override` | Overrides AI score/feedback with mandatory reason |
| `GET` | `/api/teacher/evaluations/{id}/history` | Retrieves version history audit for an evaluation |
| `GET` | `/api/teacher/exams/{id}/analytics` | Retrieves aggregate exam analytics, score distribution, pass rate |
| `GET` | `/api/teacher/exams/{id}/questions/analysis` | Retrieves question-level difficulty and missed-rate metrics |
| `GET` | `/api/teacher/exams/{id}/similarity` | Retrieves cross-student answer similarity reports |
| `POST` | `/api/teacher/exams/{id}/similarity/check` | Triggers a similarity scan across all submitted answers |

---

## 4. File Management Endpoints (`/api/submissions` & `/api/files`)

### 4.1 Upload Answer Sheet File
- **Method**: `POST`
- **URL**: `/api/submissions/{submissionId}/files`
- **Headers**: `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
- **Constraints**: Allowed formats (`pdf`, `jpg`, `jpeg`, `png`), Max size `10MB`, verified magic bytes.
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "fileName": "sub_1_e4a3b2c1.pdf",
    "originalFileName": "scan.pdf",
    "fileUrl": "/api/files/sub_1_e4a3b2c1.pdf",
    "contentType": "application/pdf",
    "sizeBytes": 1048576
  }
}
```

### 4.2 Download / View File
- **Method**: `GET`
- **URL**: `/api/files/{fileName}`
- **Security**: Strict path-traversal prevention. Serves inline document or image.

---

## 5. AI Service Endpoints (`:8000`)

### 5.1 Evaluate Answer
- **Method**: `POST`
- **URL**: `/api/v1/evaluate` (Alias: `/evaluate`)
- **Request Body**:
```json
{
  "evaluationId": "eval-101",
  "question": "What is polymorphism in Java?",
  "studentAnswer": "Polymorphism is when a class has multiple methods with the same name or inherits a method.",
  "referenceAnswer": "Polymorphism allows objects to take multiple forms through method overriding and overloading.",
  "maxMarks": 10.0,
  "expectedConcepts": ["overriding", "overloading", "multiple forms"]
}
```
- **Response** (`200 OK`):
```json
{
  "evaluationId": "eval-101",
  "score": 7.5,
  "maxMarks": 10.0,
  "confidence": 0.88,
  "feedback": "Good understanding of core principles. Consider detailing runtime polymorphism.",
  "detectedConcepts": ["overriding", "overloading"],
  "missingConcepts": ["multiple forms"],
  "strengths": ["Clear explanation of method signatures"],
  "weaknesses": ["Omitted discussion of dynamic dispatch"],
  "requiresHumanReview": false
}
```

### 5.2 OCR Document Extraction
- **Method**: `POST`
- **URL**: `/api/v1/ocr/extract` (Alias: `/ocr/extract`)
- **Headers**: `Content-Type: multipart/form-data`
- **Response** (`200 OK`):
```json
{
  "filename": "answersheet.png",
  "extractedText": "Encapsulation binds together code and data into a single unit...",
  "confidence": 0.92,
  "provider": "tesseract"
}
```

