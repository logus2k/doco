#!/bin/bash
set -e

echo "[$(date +%H:%M:%S)] Document Converter (doco) - FULL REMOVE"

./stop.sh

# Remove containers
docker ps -aq --filter "name=doco" | xargs -r docker rm -f

# Remove image
docker rmi -f $(docker images -q logus2k/doco) 2>/dev/null || true

docker image prune -f >/dev/null

echo "[$(date +%H:%M:%S)] Remove complete."
