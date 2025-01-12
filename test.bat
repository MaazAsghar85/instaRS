@echo off

cd /d "%~dp0"

rem Start server in a new terminal window
start "" cmd /k "npx ts-node tests/example.spec.ts"

rem Start client in a new terminal window
TITLE Client
start "" cmd /k "client.exe"