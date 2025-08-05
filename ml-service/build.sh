#!/bin/bash

echo "Starting build process..."

# Upgrade pip
python -m pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt

# Verify uvicorn is installed
python -c "import uvicorn; print('uvicorn version:', uvicorn.__version__)"

echo "Build completed successfully!" 