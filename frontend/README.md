# EXAMIND — Frontend Architecture & Guide (MEM4)

EXAMIND is an AI-powered examination, assessment intelligence, and OCR grading platform.
This repository contains the production-grade React + TypeScript single-page application built for Students, Teachers, and Administrators.

---

## 🚀 Tech Stack

- **Core**: React 18, TypeScript, Vite
- **Routing**: React Router v6 (Protected & Role-based route guards)
- **Styling**: Tailwind CSS, Tailwind Merge, CLSX
- **Data & APIs**: Axios with automated token refresh queue & retry interceptor, TanStack Query
- **Charts & Data Viz**: Recharts (Line, Bar, Radar distributions)
- **Forms & Validation**: React Hook Form, Zod
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library, JSDOM, Jest-DOM

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── api/                     # Axios instance, interceptors, refresh queue, error handling
│   │   └── client.ts
│   ├── auth/                    # AuthContext, AuthProvider, session lifecycle
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── common/              # Button, Input, Textarea, Select, Badge, Card, Modal,
│   │   │                        # ConfirmDialog, LoadingSpinner, Skeleton, EmptyState, Toast
│   │   ├── exam/                # ExamTimer, QuestionPalette, AutosaveIndicator, OcrUploader
│   │   └── layout/              # AppNavbar, AppSidebar, Breadcrumb
│   ├── layouts/                 # StudentLayout, TeacherLayout, AdminLayout, AuthLayout
│   ├── pages/
│   │   ├── auth/                # LoginPage, RegisterPage
│   │   ├── student/             # StudentDashboard, ExamList, ExamInstructions,
│   │   │                        # ExamInterface, StudentResultsList, ResultDetails, StudentInsights
│   │   ├── teacher/             # TeacherDashboard, ExamManagement, ExamForm, QuestionManagement,
│   │   │                        # SubmissionMonitoring, EvaluationReview, TeacherAnalytics
│   │   └── admin/               # AdminDashboard (User management, status toggle)
│   ├── hooks/                   # useAuth, useToast
│   ├── routes/                  # AppRoutes, ProtectedRoute, RoleRoute
│   ├── services/                # authService, studentService, teacherService, adminService,
│   │                            # notificationService, userService
│   ├── test/                    # Vitest setup and unit/component test suites
│   ├── types/                   # TypeScript interfaces matching Spring Boot contracts
│   ├── utils/                   # cn, date, format, grade utilities
│   ├── App.tsx                  # Root Providers (QueryClient, Auth, Toast, Router)
│   ├── main.tsx                 # Entrypoint
│   └── index.css                # Tailwind base styles and custom scrollbar
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔑 Roles & Access Control

The application implements client-side and server-validated role-based routing:

| Role | Default Landing | Capabilities |
|---|---|---|
| **STUDENT** (`ROLE_STUDENT`) | `/student` | Browse exams, review rules, live timed exam room with autosave & OCR answer sheet upload, review AI score breakdowns & concept feedback, personalized learning insights. |
| **TEACHER** (`ROLE_TEACHER`) | `/teacher` | Create/edit/delete/publish exams, author questions (MCQ, Short, Descriptive, Coding) & multi-criterion rubrics, monitor real-time submissions & AI confidence, audit/override AI evaluations with transparent reasons, view class grade distributions and cross-submission similarity checks. |
| **ADMIN** (`ROLE_ADMIN`) | `/admin` | Institution-wide user directory, role visibility, instant Activate / Block account controls, platform service health. |

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- pnpm 9+ or npm 10+
- Running Spring Boot Backend (`http://localhost:8080`)
- Running AI Service (`http://localhost:8000`)

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Development Server
```bash
pnpm dev
```
The application will launch on `http://localhost:5173`. Requests to `/api/*` are automatically proxied to `http://localhost:8080`.

### 5. Running Tests
```bash
pnpm test
```

### 6. Production Build
```bash
pnpm build
```
Generates production-optimized minified bundles in `dist/`.

---

## 🧪 Demo Credentials

For rapid verification during evaluation:

- **Student**: `student@examind.edu` / `Password123!`
- **Teacher**: `teacher@examind.edu` / `Password123!`
- **Admin**: `admin@examind.edu` / `Password123!`
*(Quick-fill buttons are provided on the login page)*

---

## 🔒 Security & Backend Contracts

1. **JWT Lifecycle**: Tokens stored securely in browser storage. Request interceptor injects `Authorization: Bearer <token>`.
2. **Seamless Refresh Queue**: 401 response interceptor traps token expiry, calls `POST /api/auth/refresh`, and transparently replays queued requests.
3. **Server-Synchronized Exam Timing**: Countdown timer calculates delta against backend `dueAt` timestamp rather than trusting local browser clocks.
4. **Audit Trail Transparency**: When a teacher overrides an AI evaluation score, both `AI Score` and `Teacher Final Score` are shown alongside the required audit explanation.
