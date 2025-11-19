@echo off
echo ========================================
echo AI Exam Prep Tool - Test Setup
echo ========================================
echo.

REM Check if we're in the backend directory
if not exist "package.json" (
    echo ERROR: Please run this script from the backend directory!
    echo.
    pause
    exit /b 1
)

echo Step 1: Installing test dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Setting up test environment file...
echo.

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo You need to create .env with your GROQ_API_KEY first.
    echo.
    pause
    exit /b 1
)

REM Check if .env.test already exists
if exist ".env.test" (
    echo .env.test already exists.
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto skipenvtest
)

REM Copy .env to .env.test
copy .env .env.test
echo Created .env.test from .env

:skipenvtest

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now run tests:
echo   - npm test              (all tests)
echo   - npm run test:unit     (unit tests only)
echo   - npm run test:coverage (with coverage)
echo.
echo IMPORTANT: Make sure your GROQ_API_KEY is set in .env.test
echo.
pause
