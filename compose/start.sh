#!/bin/bash
set -e

# Ensure network exists
if ! docker network inspect doco_network >/dev/null 2>&1; then
	echo "Creating doco_network..."
	docker network create doco_network
fi

echo "Starting Document Converter (doco)..."
docker compose -f docker-compose-cpu.yml up -d

echo "Containers started successfully."
