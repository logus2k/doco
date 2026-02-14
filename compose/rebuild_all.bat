@echo off
setlocal

echo [%TIME%] Document Converter (doco) - FULL CLEAN REBUILD

:: Stop containers
call stop.bat || (
	echo [%TIME%] ERROR: Failed to stop containers.
	exit /b 1
)

:: Remove doco containers (if any)
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=doco" 2^>nul') do (
	echo [%TIME%] Removing container %%i...
	docker rm -f %%i
)

:: Remove image (if exists)
docker image inspect logus2k/doco:latest >nul 2>&1 && (
	echo [%TIME%] Removing image logus2k/doco:latest...
	docker rmi -f logus2k/doco:latest
)

docker image prune -f >nul

:: Rebuild image (no cache)
echo [%TIME%] Building image logus2k/doco:latest...
docker compose -f docker-compose-cpu.yml build --no-cache || exit /b 1

echo [%TIME%] Rebuild complete. Run start.bat
