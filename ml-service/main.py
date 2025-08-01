from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pickle
import numpy as np
import pandas as pd
from typing import List, Dict, Any
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock Prediction ML Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://market-brief-o37dpzab3-victor-wus-projects-6704a109.vercel.app",
        "https://market-brief-*.vercel.app",
        "https://*.vercel.app"
    ],  # Allow Vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for loaded models
model = None
scaler = None
model_metadata = None

class StockData(BaseModel):
    vix: float
    timestamp: str = None

class PredictionRequest(BaseModel):
    stock_data: List[StockData]

class PredictionResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    confidence_scores: List[float]
    model_info: Dict[str, Any]
    timestamp: str

def load_models():
    """Load the trained model and scaler"""
    global model, scaler, model_metadata
    
    try:
        # Load the trained model
        model = joblib.load('models/stock_prediction_model.pkl')
        logger.info("✅ Model loaded successfully")
        
        # Load the scaler
        scaler = joblib.load('models/stock_scaler.pkl')
        logger.info("✅ Scaler loaded successfully")
        
        # Load model metadata
        with open('models/model_metadata.pkl', 'rb') as f:
            model_metadata = pickle.load(f)
        logger.info("✅ Model metadata loaded successfully")
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        raise HTTPException(status_code=500, detail="Failed to load ML models")

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    load_models()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if model_metadata is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_type": model_metadata.get('model_type', 'Unknown'),
        "feature_names": model_metadata.get('feature_names', []),
        "training_date": model_metadata.get('training_date', 'Unknown'),
        "model_params": model_metadata.get('model_params', {}),
        "features_required": len(model_metadata.get('feature_names', [])),
        "prediction_type": "classification",  # Your model predicts 0/1
        "description": "Stock market prediction model based on VIX volatility index"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_stock_movement(request: PredictionRequest):
    """Predict stock movement based on VIX data"""
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="ML models not loaded")
    
    try:
        predictions = []
        confidence_scores = []
        
        for stock_data in request.stock_data:
            # Extract VIX value
            vix_value = stock_data.vix
            
            # Prepare features (currently only VIX)
            features = np.array([[vix_value]])
            
            # Scale the features
            features_scaled = scaler.transform(features)
            
            # Make prediction
            prediction = model.predict(features_scaled)[0]
            prediction_proba = model.predict_proba(features_scaled)[0]
            
            # Get confidence score (probability of the predicted class)
            confidence = prediction_proba[prediction]
            
            # Determine prediction label
            prediction_label = "bullish" if prediction == 1 else "bearish"
            
            predictions.append({
                "prediction": int(prediction),
                "prediction_label": prediction_label,
                "probability_bullish": float(prediction_proba[1]),
                "probability_bearish": float(prediction_proba[0]),
                "vix_value": float(vix_value),
                "timestamp": stock_data.timestamp or datetime.now().isoformat()
            })
            
            confidence_scores.append(float(confidence))
        
        return PredictionResponse(
            predictions=predictions,
            confidence_scores=confidence_scores,
            model_info={
                "model_type": model_metadata.get('model_type', 'Unknown'),
                "features_used": model_metadata.get('feature_names', []),
                "prediction_count": len(predictions)
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-single")
async def predict_single(vix_value: float):
    """Simple endpoint for single VIX prediction"""
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="ML models not loaded")
    
    try:
        # Prepare features
        features = np.array([[vix_value]])
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        prediction_proba = model.predict_proba(features_scaled)[0]
        confidence = prediction_proba[prediction]
        
        prediction_label = "bullish" if prediction == 1 else "bearish"
        
        return {
            "prediction": int(prediction),
            "prediction_label": prediction_label,
            "confidence": float(confidence),
            "probability_bullish": float(prediction_proba[1]),
            "probability_bearish": float(prediction_proba[0]),
            "vix_value": vix_value,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Single prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 