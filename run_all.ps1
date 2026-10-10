Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Starting EXAMIND Full Platform (AI Service + Backend + Frontend)" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "[1/3] Starting Python FastAPI AI Service on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ai-service'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[2/3] Starting Spring Boot Backend on port 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; .\mvnw.cmd spring-boot:run"

Write-Host "[3/3] Starting React Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; pnpm dev"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "All 3 services have been launched in separate PowerShell windows!" -ForegroundColor Green
Write-Host "- Frontend UI:          http://localhost:5173" -ForegroundColor White
Write-Host "- Backend API:          http://localhost:8080" -ForegroundColor White
Write-Host "- Swagger UI:           http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "- H2 Console:           http://localhost:8080/h2-console" -ForegroundColor White
Write-Host "- AI Service Docs:      http://localhost:8000/docs" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
