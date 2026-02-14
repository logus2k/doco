#!/bin/bash
set -e

echo "[$(date +%H:%M:%S)] Stopping Document Converter (doco)..."

docker compose -f docker-compose-cpu.yml down >/dev/null 2>&1 || true

echo "[$(date +%H:%M:%S)] Containers stopped."
