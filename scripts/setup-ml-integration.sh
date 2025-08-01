#!/bin/bash

echo "🚀 Setting up ML Model Integration for Finance RAG App"
echo "======================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

echo "✅ Python and pip are available"

# Navigate to ml-service directory
cd ml-service

# Create models directory if it doesn't exist
mkdir -p models

echo "📁 Created models directory"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if model files exist
echo "🔍 Checking for model files..."
if [ ! -f "models/stock_prediction_model.pkl" ]; then
    echo "⚠️  Warning: stock_prediction_model.pkl not found in models/ directory"
    echo "   Please export your trained model from Google Colab and place it in models/"
fi

if [ ! -f "models/stock_scaler.pkl" ]; then
    echo "⚠️  Warning: stock_scaler.pkl not found in models/ directory"
    echo "   Please export your fitted scaler from Google Colab and place it in models/"
fi

if [ ! -f "models/model_metadata.pkl" ]; then
    echo "⚠️  Warning: model_metadata.pkl not found in models/ directory"
    echo "   Please export your model metadata from Google Colab and place it in models/"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Export your trained model from Google Colab using the provided code"
echo "2. Place the exported .pkl files in the ml-service/models/ directory"
echo "3. Start the ML service: cd ml-service && python main.py"
echo "4. Start your Next.js app: npm run dev"
echo "5. The ML prediction component will be available in your app"
echo ""
echo "📚 For detailed instructions, see ml-service/README.md"
echo "🐳 For Docker deployment, use: docker-compose up -d" 