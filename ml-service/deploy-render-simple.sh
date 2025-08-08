#!/bin/bash

# Simple Render deployment script
set -e

echo "=== Starting Render deployment ==="

# Set Python unbuffered output
export PYTHONUNBUFFERED=1

# Upgrade pip with more explicit flags
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install build dependencies first
echo "Installing build dependencies..."
python -m pip install --no-cache-dir wheel setuptools

# Install requirements with retries
echo "Installing requirements..."
for i in {1..3}; do
    echo "Installation attempt $i"
    if python -m pip install --no-cache-dir -r requirements-render.txt; then
        echo "Dependencies installed successfully!"
        break
    else
        echo "Installation failed, retrying..."
        sleep 5
    fi
done

echo "=== Deployment complete ==="