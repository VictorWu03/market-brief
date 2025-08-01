'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  BarChart3,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';
import { 
  mlPredictionService, 
  type StockPrediction, 
  type ModelInfo 
} from '@/lib/ml-prediction';

interface PredictionHistory {
  timestamp: string;
  vixValue: number;
  prediction: StockPrediction;
}

interface PredictionDashboardProps {
  className?: string;
}

export default function PredictionDashboard({ className }: PredictionDashboardProps) {
  const [vixValue, setVixValue] = useState<string>('');
  const [currentPrediction, setCurrentPrediction] = useState<StockPrediction | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceHealth, setServiceHealth] = useState<boolean | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        setCurrentPrediction(result);
        
        // Add to history
        const historyEntry: PredictionHistory = {
          timestamp: new Date().toISOString(),
          vixValue: Number(vixValue),
          prediction: result
        };
        setPredictionHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
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

  const getVixInterpretation = (vix: number) => {
    if (vix < 15) return { level: 'Low Fear', color: 'text-green-600', description: 'Market complacency, potential for volatility spike' };
    if (vix < 20) return { level: 'Normal', color: 'text-blue-600', description: 'Typical market conditions' };
    if (vix < 30) return { level: 'Moderate Fear', color: 'text-yellow-600', description: 'Increased market uncertainty' };
    if (vix < 40) return { level: 'High Fear', color: 'text-orange-600', description: 'Significant market stress' };
    return { level: 'Extreme Fear', color: 'text-red-600', description: 'Market panic, potential buying opportunity' };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Service Status */}
      {serviceHealth === false && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ML service is not available. Please ensure the Python service is running on port 8000.
          </AlertDescription>
        </Alert>
      )}

      {/* Model Information */}
      {modelInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Model Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Model Type:</span>
                  <Badge variant="outline">{modelInfo.model_type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Features:</span>
                  <span className="text-sm text-gray-600">{modelInfo.feature_names.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Trained:</span>
                  <span className="text-sm text-gray-600">{modelInfo.training_date}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">Description:</div>
                  {modelInfo.description}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* VIX Interpretation */}
          {vixValue && !isNaN(Number(vixValue)) && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4" />
                <span className="font-medium">VIX Interpretation:</span>
              </div>
              {(() => {
                const interpretation = getVixInterpretation(Number(vixValue));
                return (
                  <div className="text-sm">
                    <span className={`font-medium ${interpretation.color}`}>
                      {interpretation.level}
                    </span>
                    <div className="text-gray-600 mt-1">
                      {interpretation.description}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Current Prediction Results */}
      {currentPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Prediction Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPredictionIcon(formatPrediction(currentPrediction).label)}
                    <span className="font-semibold text-lg">
                      {formatPrediction(currentPrediction).label}
                    </span>
                  </div>
                  <Badge 
                    variant={formatPrediction(currentPrediction).label === 'BULLISH' ? 'default' : 'secondary'}
                    className={formatPrediction(currentPrediction).label === 'BULLISH' ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {formatPrediction(currentPrediction).probability}
                  </Badge>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence</span>
                    <div className="flex items-center gap-1">
                      {getConfidenceIcon(formatPrediction(currentPrediction).confidence)}
                      <span>{formatPrediction(currentPrediction).confidence}</span>
                    </div>
                  </div>
                  <Progress 
                    value={currentPrediction.probability_bullish * 100} 
                    className="h-2"
                  />
                </div>

                {/* Recommendation */}
                <div className="mt-3 p-3 bg-background rounded border">
                  <div className="text-sm font-medium mb-1">AI Recommendation</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrediction(currentPrediction).recommendation}
                  </div>
                </div>
              </div>

              {/* Detailed Probabilities */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Bullish Probability</span>
                    <span className="font-medium text-green-600">
                      {(currentPrediction.probability_bullish * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={currentPrediction.probability_bullish * 100} 
                    className="h-2 bg-red-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Bearish Probability</span>
                    <span className="font-medium text-red-600">
                      {(currentPrediction.probability_bearish * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={currentPrediction.probability_bearish * 100} 
                    className="h-2 bg-green-100"
                  />
                </div>
              </div>

              {/* VIX Context */}
              <div className="text-xs text-muted-foreground text-center">
                VIX Value: {currentPrediction.vix_value} | 
                Prediction Time: {new Date(currentPrediction.timestamp).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction History */}
      {predictionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prediction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictionHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <div className="font-medium">VIX: {entry.vixValue}</div>
                      <div className="text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPredictionIcon(entry.prediction.prediction_label.toUpperCase())}
                      <Badge 
                        variant={entry.prediction.prediction_label === 'bullish' ? 'default' : 'secondary'}
                        className={entry.prediction.prediction_label === 'bullish' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {entry.prediction.prediction_label.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {(entry.prediction.probability_bullish * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">About VIX & Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-2">
            <div>• VIX (Volatility Index) measures market fear and uncertainty</div>
            <div>• Higher VIX typically indicates bearish market sentiment</div>
            <div>• Model trained on historical VIX and market movement data</div>
            <div>• Predictions are for educational purposes only</div>
            <div>• Confidence levels indicate model certainty in predictions</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 