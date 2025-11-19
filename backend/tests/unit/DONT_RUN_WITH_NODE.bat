@echo off
echo.
echo ================================================================
echo   ERROR: You are trying to run tests incorrectly!
echo ================================================================
echo.
echo You ran: node groqService.test.js
echo.
echo This WILL NOT WORK because:
echo   - Tests use Jest framework
echo   - Jest provides: describe, test, expect
echo   - Node.js doesn't have these functions
echo.
echo ================================================================
echo   CORRECT WAY TO RUN TESTS:
echo ================================================================
echo.
echo 1. Go to backend folder:
echo    cd E:\College Work\Sem-5\DBMS\project\backend
echo.
echo 2. Copy environment file (first time only):
echo    copy .env .env.test
echo.
echo 3. Install dependencies (first time only):
echo    npm install
echo.
echo 4. Run tests:
echo    npm test
echo.
echo ================================================================
echo.
echo Quick setup (run these commands):
echo.
echo cd E:\College Work\Sem-5\DBMS\project\backend
echo copy .env .env.test
echo npm install
echo npm test
echo.
echo ================================================================
echo.
pause
