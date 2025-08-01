'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockData } from '@/lib/financial-data';
import { mlPredictionService, type StockPrediction } from '@/lib/ml-prediction';
import { formatCurrency, formatPercentage, formatLargeNumber, getChangeColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Brain, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface StockCardProps {
  stock: StockData;
  onClick?: () => void;
  showPrediction?: boolean;
}

export function StockCard({ stock, onClick, showPrediction = false }: StockCardProps) {
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceChangeAnimation, setPriceChangeAnimation] = useState<'up' | 'down' | null>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  const changeColor = getChangeColor(stock.change);
  const isPositive = stock.change > 0;

  // Generate a mock VIX value based on stock volatility
  const getMockVixValue = () => {
    const volatility = Math.abs(stock.changePercent);
    // Higher volatility = higher VIX (fear index)
    return Math.max(10, Math.min(50, 20 + (volatility * 2)));
  };

  const getPredictionIcon = (label: string) => {
    return label === 'BULLISH' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getConfidenceIcon = (confidence: string) => {
    if (confidence.includes('Very High')) return <CheckCircle className="h-3 w-3 text-green-600" />;
    if (confidence.includes('High')) return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (confidence.includes('Moderate')) return <Activity className="h-3 w-3 text-yellow-500" />;
    if (confidence.includes('Low')) return <AlertTriangle className="h-3 w-3 text-orange-500" />;
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  const handlePrediction = async () => {
    if (!showPrediction) return;
    
    setIsLoadingPrediction(true);
    setPredictionError(null);
    
    try {
      const vixValue = getMockVixValue();
      const result = await mlPredictionService.predictSingle(vixValue);
      
      if (result) {
        setPrediction(result);
      } else {
        setPredictionError('Failed to get prediction');
      }
    } catch (error) {
      setPredictionError('Prediction service unavailable');
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  // Handle price change animations
  useEffect(() => {
    if (previousPrice !== null && previousPrice !== stock.price) {
      const direction = stock.price > previousPrice ? 'up' : 'down';
      setPriceChangeAnimation(direction);
      
      // Clear animation after 1 second
      setTimeout(() => {
        setPriceChangeAnimation(null);
      }, 1000);
    }
    setPreviousPrice(stock.price);
  }, [stock.price, previousPrice]);

  useEffect(() => {
    if (showPrediction && !prediction && !isLoadingPrediction) {
      handlePrediction();
    }
  }, [showPrediction]);

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer bg-blue-100"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div>
            <div className="font-bold">{stock.symbol}</div>
            <div className="text-sm text-gray-600 font-normal truncate">
              {stock.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span 
              ref={priceRef}
              className={`text-2xl font-bold transition-all duration-300 ${
                priceChangeAnimation === 'up' ? 'text-green-600 scale-105' : 
                priceChangeAnimation === 'down' ? 'text-red-600 scale-105' : ''
              }`}
            >
              {formatCurrency(stock.price)}
            </span>
            <div className={`text-right ${changeColor} transition-all duration-300`}>
              <div className="font-semibold">
                {formatPercentage(stock.changePercent)}
              </div>
              <div className="text-sm">
                {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            {stock.marketCap && (
              <div>
                <span className="font-medium">Market Cap:</span>
                <div>{formatLargeNumber(stock.marketCap)}</div>
              </div>
            )}
            {stock.peRatio && (
              <div>
                <span className="font-medium">P/E Ratio:</span>
                <div>{stock.peRatio.toFixed(2)}</div>
              </div>
            )}
            {stock.dividendYield && (
              <div>
                <span className="font-medium">Dividend Yield:</span>
                <div>{formatPercentage(stock.dividendYield * 100)}</div>
              </div>
            )}
            <div>
              <span className="font-medium">Volume:</span>
              <div>{stock.volume.toLocaleString()}</div>
            </div>
          </div>

          {/* AI Prediction Section */}
          {showPrediction && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">AI Prediction</span>
                </div>
                {isLoadingPrediction && (
                  <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                )}
              </div>
              
              {predictionError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {predictionError}
                </div>
              )}
              
              {prediction && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {getPredictionIcon(prediction.prediction_label.toUpperCase())}
                      <Badge 
                        variant={prediction.prediction_label === 'bullish' ? 'default' : 'secondary'}
                        className={prediction.prediction_label === 'bullish' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {prediction.prediction_label.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {(prediction.probability_bullish * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      {getConfidenceIcon(mlPredictionService.getConfidenceLevel(prediction.probability_bullish))}
                      <span>Confidence: {mlPredictionService.getConfidenceLevel(prediction.probability_bullish)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 