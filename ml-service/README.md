# Stock Prediction ML Service

This is a FastAPI-based microservice that serves the trained machine learning model for stock price predictions.

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Create Models Directory

```bash
mkdir models
```

### 3. Add Your Trained Models

Place the following files in the `models/` directory:
- `stock_prediction_model.pkl` - Your trained model
- `stock_scaler.pkl` - The fitted scaler
- `model_metadata.pkl` - Model metadata

### 4. Run the Service

```bash
python main.py
```

The service will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

### Model Information
```
GET /model-info
```

### Single Prediction
```
POST /predict-single
Body: {"vix_value": 25.5}
```

### Batch Predictions
```
POST /predict
Body: {
  "stock_data": [
    {"vix": 25.5, "timestamp": "2024-01-01T10:00:00Z"},
    {"vix": 30.2, "timestamp": "2024-01-01T11:00:00Z"}
  ]
}
```

## Integration with Next.js App

The service is designed to work with your Next.js application. Update the CORS origins in `main.py` to match your frontend URL.

## Model Requirements

Your model should:
- Accept VIX values as input
- Output binary predictions (0 = bearish, 1 = bullish)
- Be compatible with scikit-learn's joblib format 