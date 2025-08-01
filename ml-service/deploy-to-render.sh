#!/bin/bash

echo "🚀 ML Service Deployment to Render"
echo "=================================="

echo "📋 Prerequisites:"
echo "1. Make sure you have a GitHub repository with this code"
echo "2. Go to https://render.com and create an account"
echo "3. Create a new Web Service"
echo "4. Connect your GitHub repository"
echo ""
echo "⚙️  Configuration:"
echo "Build Command: pip install -r requirements.txt"
echo "Start Command: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo "Root Directory: ml-service (if deploying from main repo)"
echo ""
echo "🔗 After deployment, update src/lib/ml-prediction.ts with your new URL"
echo ""
echo "✅ Ready to deploy!"
