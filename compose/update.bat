@echo off
setlocal

echo [%TIME%] Updating Document Converter (doco)...

:: Stop containers
call stop.bat || exit /b 1

:: Remove containers (if any)
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=doco" 2^>nul') do (
	docker rm -f %%i
)

:: Remove image (if exists)
docker image inspect logus2k/doco:latest >nul 2>&1 && (
	docker rmi -f logus2k/doco:latest
)

:: Rebuild image
docker compose -f docker-compose-cpu.yml build || exit /b 1

echo [%TIME%] Update complete. Run start.bat
