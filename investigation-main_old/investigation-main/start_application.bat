@echo off
echo Starting Police Investigation System...

REM Start the unified backend server in a new window
echo Starting unified backend server...
start "Unified Agent Server" cmd /c "cd Agents\Agent & python unified_server.py"

REM Wait for the backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

REM Start the frontend in a new window
echo Starting frontend...
start "Police Investigation Frontend" cmd /c "npm run dev"

REM Open the browser to the application
echo Opening browser to application...
timeout /t 10 /nobreak > nul
start http://localhost:3000/crime

echo.
echo Application started successfully!
echo.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo.
echo Press any key to exit this window...
pause > nul
