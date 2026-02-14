@echo off
setlocal

:: Create the network if it doesn't exist
docker network inspect doco_network >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Creating doco_network...
    docker network create doco_network
)

echo Starting Document Converter (doco)...
docker compose -f docker-compose-cpu.yml up -d

echo Containers started successfully.
