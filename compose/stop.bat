@echo off
setlocal

echo [%TIME%] Stopping Document Converter (doco)...

docker compose -f docker-compose-cpu.yml down >nul 2>&1

echo [%TIME%] Containers stopped.
