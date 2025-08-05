#!/bin/bash

# Upgrade pip to latest version
python -m pip install --upgrade pip

# Install setuptools and wheel first
pip install setuptools==68.2.2 wheel==0.41.6

# Install the rest of the requirements
pip install -r requirements.txt

echo "Build completed successfully!" 