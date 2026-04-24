#!/bin/bash
set -euo pipefail

cd /opt/indigen

echo "[1/6] Pulling latest..."
git pull --ff-only

echo "[2/6] Ensuring .env exists..."
if [ ! -f .env ]; then
  if [ ! -f .env.example ]; then echo ".env.example missing"; exit 1; fi
  cp .env.example .env
  echo "WARNING: .env created from example — edit it with real secrets before anything works"
fi

echo "[3/6] Docker build..."
docker compose build --pull

echo "[4/6] Starting infrastructure..."
docker compose up -d --remove-orphans postgres redis
sleep 5

echo "[5/6] Running migrations..."
docker compose run --rm migrate || echo "Migration had warnings — continuing"

echo "[6/6] Starting app services..."
docker compose up -d server scraper scraper_worker admin

echo "Done."
docker compose ps
