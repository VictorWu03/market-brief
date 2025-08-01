'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Brain,
  Zap
} from 'lucide-react';
import { 
  mlPredictionService, 
  type StockPrediction, 
  type ModelInfo 
} from '@/lib/ml-prediction';

interface MLPredictionCardProps {
  className?: string;
}

export default function MLPredictionCard({ className }: MLPredictionCardProps) {
  const [vixValue, setVixValue] = useState<string>('');
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceHealth, setServiceHealth] = useState<boolean | null>(null);

  // Check service health on mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    const health = await mlPredictionService.checkHealth();
    setServiceHealth(health);
    
    if (health) {
      const info = await mlPredictionService.getModelInfo();
      setModelInfo(info);
    }
  };

  const handlePrediction = async () => {
    if (!vixValue || isNaN(Number(vixValue))) {
      setError('Please enter a valid VIX value');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mlPredictionService.predictSingle(Number(vixValue));
      if (result) {
        setPrediction(result);
      } else {
        setError('Failed to get prediction from ML service');
      }
    } catch (err) {
      setError('Error making prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrediction = (pred: StockPrediction) => {
    return mlPredictionService.formatPrediction(pred);
  };

  const getPredictionIcon = (label: string) => {
    return label === 'BULLISH' ? (
      <TrendingUp className="h-5 w-5 text-green-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-600" />
    );
  };

  const getConfidenceIcon = (confidence: string) => {
    if (confidence.includes('Very High')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence.includes('High')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence.includes('Moderate')) return <Activity className="h-4 w-4 text-yellow-500" />;
    if (confidence.includes('Low')) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Stock Prediction
        </CardTitle>
        <CardDescription>
          Machine learning model predicts market direction based on VIX volatility index
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Status */}
        {serviceHealth === false && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ML service is not available. Please ensure the Python service is running on port 8000.
            </AlertDescription>
          </Alert>
        )}

        {/* Model Info */}
        {modelInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Model: {modelInfo.model_type}</span>
              <Badge variant="outline">{modelInfo.prediction_type}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Features: {modelInfo.feature_names.join(', ')} | 
              Trained: {modelInfo.training_date}
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-2">
          <Label htmlFor="vix-input">VIX Volatility Index</Label>
          <div className="flex gap-2">
            <Input
              id="vix-input"
              type="number"
              placeholder="Enter VIX value (e.g., 25.5)"
              value={vixValue}
              onChange={(e) => setVixValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePrediction()}
              step="0.1"
              min="0"
            />
            <Button 
              onClick={handlePrediction} 
              disabled={isLoading || serviceHealth === false}
            >
              {isLoading ? 'Analyzing...' : 'Predict'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Prediction Results */}
        {prediction && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getPredictionIcon(formatPrediction(prediction).label)}
                  <span className="font-semibold text-lg">
                    {formatPrediction(prediction).label}
                  </span>
                </div>
                <Badge 
                  variant={formatPrediction(prediction).label === 'BULLISH' ? 'default' : 'secondary'}
                  className={formatPrediction(prediction).label === 'BULLISH' ? 'bg-green-600' : 'bg-red-600'}
                >
                  {formatPrediction(prediction).probability}
                </Badge>
              </div>

              {/* Confidence Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Confidence</span>
                  <div className="flex items-center gap-1">
                    {getConfidenceIcon(formatPrediction(prediction).confidence)}
                    <span>{formatPrediction(prediction).confidence}</span>
                  </div>
                </div>
                <Progress 
                  value={prediction.probability_bullish * 100} 
                  className="h-2"
                />
              </div>

              {/* Recommendation */}
              <div className="mt-3 p-3 bg-background rounded border">
                <div className="text-sm font-medium mb-1">AI Recommendation</div>
                <div className="text-sm text-muted-foreground">
                  {formatPrediction(prediction).recommendation}
                </div>
              </div>
            </div>

            {/* Detailed Probabilities */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Bullish Probability</span>
                  <span className="font-medium text-green-600">
                    {(prediction.probability_bullish * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={prediction.probability_bullish * 100} 
                  className="h-2 bg-red-100"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Bearish Probability</span>
                  <span className="font-medium text-red-600">
                    {(prediction.probability_bearish * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={prediction.probability_bearish * 100} 
                  className="h-2 bg-green-100"
                />
              </div>
            </div>

            {/* VIX Context */}
            <div className="text-xs text-muted-foreground text-center">
              VIX Value: {prediction.vix_value} | 
              Prediction Time: {new Date(prediction.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• VIX (Volatility Index) measures market fear and uncertainty</div>
          <div>• Higher VIX typically indicates bearish market sentiment</div>
          <div>• Model trained on historical VIX and market movement data</div>
          <div>• Predictions are for educational purposes only</div>
        </div>
      </CardContent>
    </Card>
  );
} 