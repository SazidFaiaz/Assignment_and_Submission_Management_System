@echo off
REM MERN Stack Application Startup Script for Windows
REM This script starts both backend and frontend servers

echo.
echo ========================================
echo   MERN Stack - Assignment Management
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js v18 or higher from https://nodejs.org
    pause
    exit /b 1
)

echo OK - Node.js is installed
node --version
echo.

REM Start Backend
echo.
echo Starting Backend Server...
cd backend

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo .env file created. Update MongoDB URI if needed.
)

echo.
echo Backend is starting on port 5000...
echo.
start "MERN Backend" cmd /k npm run dev

REM Give backend time to start
timeout /t 3 /nobreak

REM Start Frontend
cd ..
echo.
echo Starting Frontend Server...

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

if not exist ".env.local" (
    echo Creating .env.local file...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ) > .env.local
    echo .env.local file created.
)

echo.
echo Frontend is starting on port 3000...
echo.
start "MERN Frontend" cmd /k npm run dev

echo.
echo ========================================
echo      Servers are Starting...
echo ========================================
echo.
echo FRONTEND:  http://localhost:3000
echo BACKEND:   http://localhost:5000
echo API:       http://localhost:5000/api
echo.
echo Default Login Credentials:
echo   Admin:    admin@example.com / Admin@123456
echo   Teacher:  teacher@example.com / Teacher@123456
echo   Student:  student1@example.com / Student@123456
echo.
echo Close these windows to stop the servers.
echo.
pause
