@echo off
echo Starting all agent servers...

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH. Please install Python and try again.
    exit /b 1
)

REM Check if pip is installed
where pip >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo pip is not installed or not in PATH. Please install pip and try again.
    exit /b 1
)

REM Install required packages
echo Installing required packages...
pip install -r requirements.txt

REM Start the Murder Agent server
start "Murder Agent" cmd /k "python server.py murder"

REM Start the Theft Agent server
start "Theft Agent" cmd /k "python server.py theft"

REM Start the Financial Fraud Agent server
start "Financial Fraud Agent" cmd /k "python server.py financial-fraud"

echo All agent servers started successfully!
echo Murder Agent: http://localhost:5000
echo Theft Agent: http://localhost:5001
echo Financial Fraud Agent: http://localhost:5002
echo.
echo Press any key to exit...
pause >nul
