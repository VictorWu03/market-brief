# Render Deployment Guide - Fixed Version

## 🚀 Quick Deploy to Render

### Step 1: Go to Render
1. Visit [Render.com](https://render.com)
2. Sign up or login
3. Click "New +" → "Web Service"

### Step 2: Connect Repository
- **Repository**: `https://github.com/VictorWu03/market-brief.git`
- **Branch**: `main`

### Step 3: Configure Service
- **Name**: `finance-ml-service`
- **Root Directory**: `ml-service`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 4: Environment Variables (Optional)
- No environment variables needed for basic deployment

### Step 5: Deploy
- Click "Create Web Service"
- Wait for build to complete (should take 2-3 minutes)

## ✅ What's Fixed

### Previous Issues:
- ❌ pandas 2.1.3 compilation errors
- ❌ numpy 1.26.0 compatibility issues
- ❌ scikit-learn 1.6.1 build failures

### Current Fixes:
- ✅ pandas 1.5.3 (stable version)
- ✅ numpy 1.23.5 (compatible version)
- ✅ scikit-learn 1.2.2 (stable version)
- ✅ Model recreated with compatible versions

## 🔧 Testing After Deployment

Once deployed, test your service:

```bash
# Test health endpoint
curl https://your-service-name.onrender.com/health

# Test model info
curl https://your-service-name.onrender.com/model-info

# Test prediction
curl -X POST "https://your-service-name.onrender.com/predict-single?vix_value=30.0"
```

## 📝 Next Steps

1. **Copy the Render URL** (e.g., `https://finance-ml-service.onrender.com`)
2. **Update frontend**: Edit `src/lib/ml-prediction.ts` with your Render URL
3. **Redeploy frontend**: `vercel --prod`

## 🎯 Expected Results

- ✅ Build should complete successfully
- ✅ Service should be accessible via HTTPS
- ✅ ML predictions should work
- ✅ No compilation errors

## 🆘 Troubleshooting

If you still get build errors:
1. Check that you're using the `ml-service` root directory
2. Ensure the build command is exactly: `pip install -r requirements.txt`
3. Make sure the start command is exactly: `uvicorn main:app --host 0.0.0.0 --port $PORT` 