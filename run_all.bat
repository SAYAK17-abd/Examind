@echo off
title EXAMIND — Full Stack Launcher
echo ===============================================================================
echo Starting EXAMIND Full Platform (AI Service + Backend + Frontend)
echo ===============================================================================

echo [1/3] Starting Python FastAPI AI Service on port 8000...
start "EXAMIND - Python AI Service (Port 8000)" cmd /k "cd /d "%~dp0ai-service" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Starting Spring Boot Backend on port 8080...
start "EXAMIND - Spring Boot Backend (Port 8080)" cmd /k "cd /d "%~dp0" && mvnw.cmd spring-boot:run"

echo [3/3] Starting React Frontend on port 5173...
start "EXAMIND - React Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && pnpm dev"

echo.
echo ===============================================================================
echo All 3 services have been launched in separate windows!
echo - Frontend UI:          http://localhost:5173
echo - Backend API:          http://localhost:8080
echo - Swagger Documentation: http://localhost:8080/swagger-ui.html
echo - H2 Database Console:  http://localhost:8080/h2-console
echo - AI Service Docs:      http://localhost:8000/docs
echo ===============================================================================
pause
