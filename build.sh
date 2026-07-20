#!/usr/bin/env bash
# Render build script
# Installs Python deps + builds React frontend

set -e  # exit on any error

echo "=== Installing Python dependencies ==="
pip install -r backend/requirements.txt

echo "=== Installing Node dependencies ==="
cd frontend
npm install

echo "=== Building React frontend ==="
npm run build

echo "=== Build complete ==="
echo "frontend/dist contents:"
ls -la dist/
