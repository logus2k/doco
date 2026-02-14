#!/bin/bash
set -e

echo "[$(date +%H:%M:%S)] Document Converter (doco) - FULL CLEAN REBUILD"

./stop.sh

# Remove containers
docker ps -aq --filter "name=doco" | xargs -r docker rm -f

# Remove image
docker image inspect logus2k/doco:latest >/dev/null 2>&1 && docker rmi -f logus2k/doco:latest || true

docker image prune -f >/dev/null

# Rebuild image (no cache)
docker compose -f docker-compose-cpu.yml build --no-cache

echo "[$(date +%H:%M:%S)] Rebuild complete. Run ./start.sh"
