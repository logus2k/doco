#!/bin/bash
set -e

echo "[$(date +%H:%M:%S)] Updating Document Converter (doco)..."

./stop.sh

docker ps -aq --filter "name=doco" | xargs -r docker rm -f

docker image inspect logus2k/doco:latest >/dev/null 2>&1 && docker rmi -f logus2k/doco:latest || true

docker compose -f docker-compose-cpu.yml build

echo "[$(date +%H:%M:%S)] Update complete. Run ./start.sh"
