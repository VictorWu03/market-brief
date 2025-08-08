#!/bin/bash

# Render deployment build script
set -e

echo "Starting build process..."

# Upgrade pip first
pip install --upgrade pip setuptools wheel

# Install dependencies with timeout and retry
echo "Installing dependencies..."
pip install --no-cache-dir --timeout 1000 -r requirements-render.txt

echo "Build completed successfully!"