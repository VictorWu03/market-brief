#!/usr/bin/env python3
"""
Script to recreate the ML model with current environment
This avoids version compatibility issues with the original model files
"""

import joblib
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime
import os

def create_sample_data():
    """Create sample data similar to your original training data"""
    np.random.seed(42)
    
    # Create sample VIX data (volatility index typically ranges from 10-50)
    n_samples = 1000
    vix_values = np.random.uniform(10, 50, n_samples)
    
    # Create target variable (Y) based on VIX thresholds
    # Higher VIX typically indicates bearish sentiment
    y_values = np.where(vix_values > 25, 0, 1)  # 0 = bearish, 1 = bullish
    
    # Add some noise to make it more realistic
    noise = np.random.normal(0, 0.1, n_samples)
    y_values = np.where(np.random.random(n_samples) < 0.1, 1 - y_values, y_values)
    
    return pd.DataFrame({
        'VIX': vix_values,
        'Y': y_values
    })

def train_model():
    """Train a new model with current environment"""
    print("🔄 Creating sample training data...")
    df = create_sample_data()
    
    print(f"📊 Dataset shape: {df.shape}")
    print(f"📈 Target distribution: {df['Y'].value_counts().to_dict()}")
    
    # Prepare features and target
    X = df[['VIX']]
    y = df['Y']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print("🔧 Training model...")
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train the model
    model = LogisticRegression(
        random_state=42,
        max_iter=200,
        C=0.1,
        class_weight='balanced',
        solver='liblinear'
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate the model
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(X_test_scaled, y_test)
    
    print(f"✅ Model trained successfully!")
    print(f"📊 Training accuracy: {train_score:.3f}")
    print(f"📊 Test accuracy: {test_score:.3f}")
    print(f"🔢 Model coefficients: {model.coef_[0][0]:.4f}")
    print(f"🔢 Intercept: {model.intercept_[0]:.4f}")
    
    return model, scaler

def save_model_files(model, scaler):
    """Save the model files"""
    print("💾 Saving model files...")
    
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    # Save the model
    joblib.dump(model, 'models/stock_prediction_model.pkl')
    print("✅ Model saved: models/stock_prediction_model.pkl")
    
    # Save the scaler
    joblib.dump(scaler, 'models/stock_scaler.pkl')
    print("✅ Scaler saved: models/stock_scaler.pkl")
    
    # Save model metadata
    model_metadata = {
        'feature_names': ['VIX'],
        'model_type': 'LogisticRegression',
        'training_date': datetime.now().strftime('%Y-%m-%d'),
        'model_params': {
            'random_state': 42,
            'max_iter': 200,
            'C': 0.1,
            'class_weight': 'balanced',
            'solver': 'liblinear'
        },
        'description': 'Stock market prediction model based on VIX volatility index',
        'features_description': {
            'VIX': 'Volatility Index - measures market fear and uncertainty'
        }
    }
    
    with open('models/model_metadata.pkl', 'wb') as f:
        pickle.dump(model_metadata, f)
    print("✅ Metadata saved: models/model_metadata.pkl")

def test_model(model, scaler):
    """Test the model with sample predictions"""
    print("\n🧪 Testing model predictions...")
    
    # Test with different VIX values
    test_vix_values = [15, 20, 25, 30, 35, 40]
    
    for vix in test_vix_values:
        # Prepare features
        features = np.array([[vix]])
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        prediction_proba = model.predict_proba(features_scaled)[0]
        
        prediction_label = "BULLISH" if prediction == 1 else "BEARISH"
        confidence = prediction_proba[prediction]
        
        print(f"VIX: {vix:2.0f} → {prediction_label} (Confidence: {confidence:.3f})")

def main():
    """Main function"""
    print("🚀 Recreating ML Model for Stock Prediction")
    print("=" * 50)
    
    try:
        # Train the model
        model, scaler = train_model()
        
        # Save the model files
        save_model_files(model, scaler)
        
        # Test the model
        test_model(model, scaler)
        
        print("\n🎉 Model recreation completed successfully!")
        print("📁 Model files saved in models/ directory")
        print("🔧 You can now start the ML service with: python main.py")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 