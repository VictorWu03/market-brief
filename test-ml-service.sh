#!/bin/bash

echo "🧪 ML Service Test Script"
echo "========================"
echo ""

# Get the service URL from user input
read -p "Enter your Render ML service URL (e.g., https://finance-ml-service.onrender.com): " SERVICE_URL

echo ""
echo "🔍 Testing ML Service at: $SERVICE_URL"
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
curl -s "$SERVICE_URL/health" | jq '.' 2>/dev/null || curl -s "$SERVICE_URL/health"

echo ""
echo "2️⃣ Testing model info..."
curl -s "$SERVICE_URL/model-info" | jq '.' 2>/dev/null || curl -s "$SERVICE_URL/model-info"

echo ""
echo "3️⃣ Testing single prediction..."
curl -s -X POST "$SERVICE_URL/predict-single?vix_value=30.0" | jq '.' 2>/dev/null || curl -s -X POST "$SERVICE_URL/predict-single?vix_value=30.0"

echo ""
echo "✅ Test completed!"
echo ""
echo "📝 Next steps:"
echo "1. If all tests pass, update src/lib/ml-prediction.ts with: $SERVICE_URL"
echo "2. Redeploy frontend: vercel --prod" 