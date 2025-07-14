import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentData {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface SentimentChartProps {
  data: SentimentData;
  articles: Array<{
    sentiment?: {
      sentiment: 'positive' | 'negative' | 'neutral';
      confidence: number;
      summary: string;
    };
  }>;
}

export function SentimentChart({ data, articles }: SentimentChartProps) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'negative': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const confidenceData = articles
    .map((article, index) => ({
      article: `Article ${index + 1}`,
      confidence: article.sentiment ? article.sentiment.confidence * 100 : 0,
      sentiment: article.sentiment?.sentiment || 'neutral'
    }))
    .filter(item => item.confidence > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Sentiment Summary */}
      <Card className={`lg:col-span-1 ${getSentimentColor(data.overallSentiment)} border-2`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            {getSentimentIcon(data.overallSentiment)}
            <span>Market Sentiment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Badge 
                variant={data.overallSentiment === 'positive' ? 'default' : 
                       data.overallSentiment === 'negative' ? 'destructive' : 'secondary'}
                className="text-lg px-3 py-1 capitalize font-semibold"
              >
                {data.overallSentiment}
              </Badge>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {(data.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Confidence Level</div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Distribution */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-32 h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={`${(data.breakdown.positive / (data.breakdown.positive + data.breakdown.negative + data.breakdown.neutral)) * 251.2} 251.2`}
                    strokeDashoffset="-62.8"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold">{data.breakdown.positive + data.breakdown.negative + data.breakdown.neutral}</div>
                    <div className="text-xs text-gray-600">Articles</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Positive</span>
                </div>
                <span className="text-sm font-medium">{data.breakdown.positive}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Negative</span>
                </div>
                <span className="text-sm font-medium">{data.breakdown.negative}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span className="text-sm">Neutral</span>
                </div>
                <span className="text-sm font-medium">{data.breakdown.neutral}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Levels */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Article Confidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {confidenceData.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="text-xs text-gray-600 w-16">{item.article}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.sentiment === 'positive' ? 'bg-green-500' : 
                          item.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${item.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 w-8">{item.confidence.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 