import axios from 'axios';

// Types for ML predictions
export interface StockPrediction {
  prediction: number; // 0 = bearish, 1 = bullish
  prediction_label: 'bullish' | 'bearish';
  probability_bullish: number;
  probability_bearish: number;
  vix_value: number;
  timestamp: string;
}

export interface BatchPredictionRequest {
  stock_data: Array<{
    vix: number;
    timestamp?: string;
  }>;
}

export interface BatchPredictionResponse {
  predictions: StockPrediction[];
  confidence_scores: number[];
  model_info: {
    model_type: string;
    features_used: string[];
    prediction_count: number;
  };
  timestamp: string;
}

export interface ModelInfo {
  model_type: string;
  feature_names: string[];
  training_date: string;
  model_params: Record<string, any>;
  features_required: number;
  prediction_type: string;
  description: string;
}

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://your-new-render-url.onrender.com'; // Update this with your deployed URL

// ML Service API client
class MLPredictionService {
  private baseURL: string;

  constructor(baseURL: string = ML_SERVICE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Check if the ML service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('ML service health check failed:', error);
      return false;
    }
  }

  /**
   * Get information about the loaded model
   */
  async getModelInfo(): Promise<ModelInfo | null> {
    try {
      const response = await axios.get(`${this.baseURL}/model-info`);
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }

  /**
   * Make a single prediction based on VIX value
   */
  async predictSingle(vixValue: number): Promise<StockPrediction | null> {
    try {
      const response = await axios.post(`${this.baseURL}/predict-single?vix_value=${vixValue}`);
      return response.data;
    } catch (error) {
      console.error('Single prediction failed:', error);
      return null;
    }
  }

  /**
   * Make batch predictions for multiple VIX values
   */
  async predictBatch(vixValues: number[]): Promise<BatchPredictionResponse | null> {
    try {
      const request: BatchPredictionRequest = {
        stock_data: vixValues.map(vix => ({ vix }))
      };

      const response = await axios.post(`${this.baseURL}/predict`, request);
      return response.data;
    } catch (error) {
      console.error('Batch prediction failed:', error);
      return null;
    }
  }

  /**
   * Make predictions with timestamps
   */
  async predictWithTimestamps(
    data: Array<{ vix: number; timestamp: string }>
  ): Promise<BatchPredictionResponse | null> {
    try {
      const request: BatchPredictionRequest = {
        stock_data: data
      };

      const response = await axios.post(`${this.baseURL}/predict`, request);
      return response.data;
    } catch (error) {
      console.error('Timestamp prediction failed:', error);
      return null;
    }
  }

  /**
   * Get prediction confidence level description
   */
  getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Moderate';
    if (confidence >= 0.6) return 'Low';
    return 'Very Low';
  }

  /**
   * Get prediction color for UI
   */
  getPredictionColor(prediction: 'bullish' | 'bearish', confidence: number): string {
    const baseColor = prediction === 'bullish' ? 'green' : 'red';
    const intensity = Math.floor(confidence * 5) + 1;
    return `${baseColor}-${intensity}00`;
  }

  /**
   * Format prediction for display
   */
  formatPrediction(prediction: StockPrediction): {
    label: string;
    confidence: string;
    color: string;
    probability: string;
    recommendation: string;
  } {
    const confidenceLevel = this.getConfidenceLevel(prediction.probability_bullish);
    const color = this.getPredictionColor(prediction.prediction_label, prediction.probability_bullish);
    const probability = (prediction.probability_bullish * 100).toFixed(1);
    
    let recommendation = '';
    if (prediction.prediction_label === 'bullish') {
      if (prediction.probability_bullish > 0.8) {
        recommendation = 'Strong buy signal - market likely to rise';
      } else if (prediction.probability_bullish > 0.6) {
        recommendation = 'Moderate buy signal - cautious optimism';
      } else {
        recommendation = 'Weak buy signal - monitor closely';
      }
    } else {
      if (prediction.probability_bearish > 0.8) {
        recommendation = 'Strong sell signal - market likely to fall';
      } else if (prediction.probability_bearish > 0.6) {
        recommendation = 'Moderate sell signal - exercise caution';
      } else {
        recommendation = 'Weak sell signal - monitor closely';
      }
    }

    return {
      label: prediction.prediction_label.toUpperCase(),
      confidence: `${confidenceLevel} (${probability}%)`,
      color,
      probability: `${probability}%`,
      recommendation
    };
  }
}

// Export singleton instance
export const mlPredictionService = new MLPredictionService(); 