@echo off

echo Cleaning up build artifacts...

REM Delete Next.js build directory
rd /s /q .next

REM Delete Python cache files
del /f /q Agents\Agent\__pycache__\*
rd /s /q Agents\Agent\__pycache__

REM Delete log files
del /f /q Agents\Agent\unified_agent_server.log
del /f /q Agents\Agent\murder_agent.log
del /f /q Agents\Agent\murder_agent_backend.log
del /f /q Agents\Agent\financial_fraud_agent.log
del /f /q Agents\Agent\theft_agent.log
del /f /q Agents\Agent\api_key_manager.log
del /f /q unified_agent_server.log
del /f /q murder_agent.log
del /f /q murder_agent_backend.log

echo Cleanup complete!
