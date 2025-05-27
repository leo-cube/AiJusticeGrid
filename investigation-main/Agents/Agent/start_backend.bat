@echo off
echo Starting Murder Agent Backend Server...
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Checking Python installation...
python --version
echo.
echo Checking required files...
if exist "unified_server.py" (
    echo ✓ unified_server.py found
) else (
    echo ✗ unified_server.py not found
    pause
    exit /b 1
)

if exist ".env" (
    echo ✓ .env file found
) else (
    echo ✗ .env file not found
    pause
    exit /b 1
)

echo.
echo Starting server...
python unified_server.py
pause
