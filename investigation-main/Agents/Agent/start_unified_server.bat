@echo off
echo Starting unified agent server...

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    REM Try with py command (Python launcher)
    where py >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo Python is not installed or not in PATH. Please install Python and try again.
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

REM Install required packages
echo Installing required packages...
%PYTHON_CMD% -m pip install -r requirements.txt

REM Start the unified server
echo Starting unified agent server...
%PYTHON_CMD% unified_server.py

echo Server started successfully!
echo Unified Agent Server: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server...
