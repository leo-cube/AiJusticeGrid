@echo off
echo Cleaning up build artifacts...

REM Delete Next.js build directory
rd /s /q .next

REM Delete Python cache files
del /f /q Agents\Agent\__pycache__\*
rd /s /q Agents\Agent\__pycache__

REM Delete log files
del /f /q Agents\Agent\unified_agent_server.log

echo Cleanup complete!