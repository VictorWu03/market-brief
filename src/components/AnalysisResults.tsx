'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface Recommendation {
  symbol: string;
  reason: string;
  confidence: number;
  action: 'buy' | 'sell' | 'hold';
}

interface AnalysisResultsProps {
  recommendations?: Recommendation[];
  analysis?: string;
  query: string;
}

export function AnalysisResults({ recommendations, analysis, query }: AnalysisResultsProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
        return 'bg-green-100 text-green-800';
      case 'sell':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Your Query:</h3>
        <p className="text-blue-800">{query}</p>
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span>AI Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {analysis.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{rec.symbol}</span>
                      {getActionIcon(rec.action)}
                      <Badge className={getActionColor(rec.action)}>
                        {rec.action.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Confidence: {Math.round(rec.confidence * 100)}%
                    </div>
                  </div>
                  <p className="text-gray-700">{rec.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 