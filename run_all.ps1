# Office Cafeteria Management System - Startup Script
# Run this script to spin up the five microservices and the Vite frontend.

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Starting Office Cafeteria Management System Microservices " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$root = Get-Location

# Helper function to open a command in a new PowerShell window
function Launch-Service($serviceName, $directoryPath, $runCommand) {
    Write-Host "Launching $serviceName..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "title $serviceName; cd '$directoryPath'; $runCommand"
}

# 1. API Gateway (Port 8080)
Launch-Service "API Gateway [8080]" "$root\backend\api-gateway" "mvn spring-boot:run"

# 2. Authentication Service (Port 8085)
Launch-Service "Auth Service [8085]" "$root\backend\auth-service" "mvn spring-boot:run"

# 3. Menu Catalog Service (Port 8082)
Launch-Service "Menu Service [8082]" "$root\backend\menu-service" "mvn spring-boot:run"

# 4. Order Service (Port 8083)
Launch-Service "Order Service [8083]" "$root\backend\order-service" "mvn spring-boot:run"

# 5. Report Service (Port 8084)
Launch-Service "Report Service [8084]" "$root\backend\report-service" "mvn spring-boot:run"

# 6. Payment Service (Port 8086)
Launch-Service "Payment Service [8086]" "$root\backend\payment-service" "mvn spring-boot:run"

# 7. React Vite Frontend (Port 5173)
Launch-Service "React Client [5173]" "$root\frontend" "npm run dev"

Write-Host "`nAll components launched in separate console windows." -ForegroundColor Green
Write-Host "Enjoy your food ordering app! Access it at http://localhost:5173" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
