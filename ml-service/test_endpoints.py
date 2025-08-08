#!/usr/bin/env python3
"""
Test script to verify ML service endpoints work correctly
"""
import requests
import json

def test_ml_service(base_url="https://finance-ml-service.onrender.com"):
    """Test the ML service endpoints"""
    
    print(f"🧪 Testing ML service at: {base_url}")
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ❌ Health check failed: {e}")
    
    # Test 2: Root endpoint
    print("\n2. Testing root endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ❌ Root endpoint failed: {e}")
    
    # Test 3: GET predict-single endpoint
    print("\n3. Testing GET predict-single endpoint...")
    try:
        test_vix = 26.7776
        response = requests.get(f"{base_url}/predict-single", params={"vix_value": test_vix})
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Prediction: {response.json()}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ GET predict-single failed: {e}")
    
    # Test 4: POST predict-single endpoint
    print("\n4. Testing POST predict-single endpoint...")
    try:
        test_vix = 26.7776
        response = requests.post(f"{base_url}/predict-single", json={"vix_value": test_vix})
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Prediction: {response.json()}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ POST predict-single failed: {e}")

if __name__ == "__main__":
    test_ml_service()