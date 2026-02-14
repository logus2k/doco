@echo off
setlocal

echo [%TIME%] Document Converter (doco) - FULL REMOVE

:: Stop containers
call stop.bat || (
	echo [%TIME%] ERROR: Failed to stop containers.
	exit /b 1
)

:: Remove doco containers (if any)
echo [%TIME%] Removing doco containers...
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=doco" 2^>nul') do (
	echo [%TIME%] Removing container %%i...
	docker rm -f %%i
)

:: Remove image
echo [%TIME%] Removing images...
for /f "tokens=*" %%i in ('docker images -q logus2k/doco 2^>nul') do (
	docker rmi -f %%i
	echo [%TIME%] Image %%i removed.
)

:: Clean dangling layers
docker image prune -f >nul

echo [%TIME%] Remove complete.
