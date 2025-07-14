'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewsArticle } from '@/lib/news-scraper';
import { formatDateTime, getSentimentColor } from '@/lib/utils';
import { ExternalLink, Calendar, Building } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight">
          {article.title}
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Building className="h-4 w-4" />
            <span>{article.source}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDateTime(article.publishedAt)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-gray-700 line-clamp-3">
            {article.summary}
          </p>
          
          <div className="flex items-center justify-between">
            {article.sentiment && (
              <div 
                className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(article.sentiment.sentiment)}`}
              >
                {article.sentiment.sentiment.charAt(0).toUpperCase() + article.sentiment.sentiment.slice(1)}
                {article.sentiment.confidence > 0 && (
                  <span className="ml-1">
                    ({Math.round(article.sentiment.confidence * 100)}%)
                  </span>
                )}
              </div>
            )}
            
            {article.url !== '#' && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <span>Read more</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          
          {article.sentiment?.summary && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <span className="font-medium">AI Summary: </span>
              {article.sentiment.summary}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 