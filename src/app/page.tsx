'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { StockCard } from '@/components/StockCard';
import { NewsCard } from '@/components/NewsCard';
import { AnalysisResults } from '@/components/AnalysisResults';
import { SentimentChart } from '@/components/SentimentChart';
import { StockChart } from '@/components/StockChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StockData } from '@/lib/financial-data';
import { NewsArticle } from '@/lib/news-scraper';
import { TrendingUp, Newspaper, RefreshCw, Clock, CheckCircle, BarChart3, PieChart, Activity } from 'lucide-react';

// Server-side data service now handles all API calls and caching

// Simple loading state hook replacement
function useLoadingState(delay: number = 500) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      setShowLoading(true);
    }, delay);
  }, [delay]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setShowLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading
  };
}

// Simple debounced callback hook replacement
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

interface AnalysisResult {
  recommendations?: Array<{
    symbol: string;
    reason: string;
    confidence: number;
    action: 'buy' | 'sell' | 'hold';
  }>;
  analysis?: string;
}

export default function Home() {
  // Temporarily revert to simple stock loading while we fix progressive loading
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [overallSentiment, setOverallSentiment] = useState<{
    overallSentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
    breakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [sentimentUpdateTime, setSentimentUpdateTime] = useState<string>('');
  
  // Search results state (separate from main stocks)
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Pagination state for Top Performing Stocks
  const [topStocksDisplayCount, setTopStocksDisplayCount] = useState(6);
  
  // Enhanced loading states
  const stocksLoading = useLoadingState(300);
  const newsLoading = useLoadingState(300);
  const analysisLoading = useLoadingState(500);

  // Cache status for UI
  const [cacheInfo] = useState<{ memorySize: number; expirationTimes: Record<string, string> }>({
    memorySize: 0,
    expirationTimes: {}
  });

  // Stock loading function with support for 500+ stocks and lazy loading
  const loadPopularStocks = useCallback(async (forceRefresh = false, limit?: number) => {
    console.log('🔄 Loading stocks from Yahoo Finance...', { forceRefresh, limit });

    stocksLoading.startLoading();
    
    try {
      // Build URL with optional limit parameter
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());
      if (forceRefresh) params.set('_t', Date.now().toString()); // Cache busting
      
      const url = `/api/stocks${params.toString() ? '?' + params.toString() : ''}`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url, {
        cache: forceRefresh ? 'no-cache' : 'default'
      });
      
      // Check if response is OK and contains JSON
      if (!response.ok) {
        const text = await response.text();
        console.error(`API error ${response.status}:`, text);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Expected JSON, got ${contentType || 'unknown content type'}`);
      }
      
      const result = await response.json();
      
      // Handle new pagination response format
      let stocksData: StockData[];
      if (result.stocks && Array.isArray(result.stocks)) {
        stocksData = result.stocks;
        console.log('📊 Received paginated stocks:', stocksData.length, 'of', result.pagination?.total || 'unknown');
      } else if (Array.isArray(result)) {
        // Backward compatibility with old format
        stocksData = result;
        console.log('📊 Received stocks (legacy format):', stocksData.length);
      } else {
        console.error('Invalid response format:', result);
        throw new Error('API response format not recognized');
      }
      
      console.log('✅ Setting stocks state:', stocksData.length);
      setStocks(stocksData);
    } catch (error) {
      console.error('❌ Error loading stocks:', error);
    } finally {
      stocksLoading.stopLoading();
    }
  }, [stocksLoading]);

  const loadNews = useCallback(async (forceRefresh = false) => {
    console.log('🔄 Loading news from server cache...', { forceRefresh });

    newsLoading.startLoading();
    
    try {
      const response = await fetch(`/api/news?sentiment=true`, {
        cache: forceRefresh ? 'no-cache' : 'default'
      });
      const data = await response.json();
      
      // Handle API response structure
      if (data.articles) {
        setNews(data.articles);
        setOverallSentiment(data.overallSentiment);
      } else {
        // Fallback for old response structure
        setNews(data);
        setOverallSentiment(null);
      }
      
      setSentimentUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      newsLoading.stopLoading();
    }
  }, [newsLoading]);

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback(
    async (query: string) => {
      setLastQuery(query);
      analysisLoading.startLoading();
      
      try {
        // Determine if this is a stock search or analysis request
        const isStockSearch = /^[A-Z]{1,5}$/i.test(query.trim());
        
        if (isStockSearch) {
          // Search for specific stock
          const response = await fetch(`/api/stocks?search=${encodeURIComponent(query)}`);
          if (!response.ok) {
            throw new Error(`Stock search failed: ${response.status}`);
          }
          const data = await response.json();
          // Use search results instead of replacing main stocks
          setSearchResults(data);
          setIsSearchMode(true);
          setAnalysisResult(null);
        } else {
          // Generate AI analysis
          const response = await fetch('/api/analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, type: 'recommendation' }),
          });
          if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status}`);
          }
          const data = await response.json();
          setAnalysisResult(data);
          // Clear search mode when doing analysis
          setIsSearchMode(false);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error processing search:', error);
        // Show user-friendly error in the UI
        setAnalysisResult({
          analysis: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
        });
        setIsSearchMode(false);
        setSearchResults([]);
      } finally {
        analysisLoading.stopLoading();
      }
    },
    800 // 800ms debounce delay
  );

  // Wrapped search handler
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      // Clear search when query is empty
      setIsSearchMode(false);
      setSearchResults([]);
      setLastQuery('');
      return;
    }
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Get the stocks to display (search results or progressive loading results)
  const displayStocks = isSearchMode ? searchResults : stocks;

  // Load initial data only once on mount
  useEffect(() => {
    console.log('🚀 Component mounted - loading initial data');
    // Start with 100 stocks for good initial load, can load more on demand
    loadPopularStocks(false, 100);
    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Memoized computed values
  const marketStats = useMemo(() => {
    if (stocks.length === 0) return null;
    
    return {
      totalStocks: stocks.length,
      gainers: stocks.filter(s => s.change > 0).length,
      lastUpdated: new Date().toLocaleTimeString()
    };
  }, [stocks]);

  // Force refresh function (bypasses browser cache)
  const forceRefresh = useCallback(() => {
    // Reload data with cache bypass
    loadPopularStocks(true);
    loadNews(true);
  }, [loadPopularStocks, loadNews]);

  // Load more stocks functionality - can fetch up to 500 stocks
  const loadMoreStocks = useCallback(async () => {
    const maxStocksToLoad = 500; // Can now load up to 500 S&P 500 stocks
    
    if (stocks.length >= maxStocksToLoad) {
      console.log(`Already at maximum stocks limit: ${stocks.length}/${maxStocksToLoad}`);
      return;
    }

    stocksLoading.startLoading();
    
    try {
      // Calculate next batch size - load 100 more each time
      const nextLimit = Math.min(stocks.length + 100, maxStocksToLoad);
      console.log(`Loading more stocks: current ${stocks.length} → target ${nextLimit}`);
      
      // Load with increased limit
      await loadPopularStocks(false, nextLimit);
      
    } catch (error) {
      console.error('Error loading more stocks:', error);
    } finally {
      stocksLoading.stopLoading();
    }
  }, [stocks.length, stocksLoading, loadPopularStocks]);

  // Show more top performing stocks
  const showMoreTopStocks = useCallback(() => {
    setTopStocksDisplayCount(prev => Math.min(prev + 6, stocks.length));
  }, [stocks.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Financial Market Intelligence
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI-powered financial analysis with real-time market data, sentiment insights, and intelligent stock recommendations
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar onSearch={handleSearch} isLoading={analysisLoading.showLoading} />
          </div>

          {/* Cache Status */}
          <div className="mt-4 flex justify-center items-center space-x-4 text-sm text-gray-600">
            <Badge variant="outline" className="text-xs">
              📦 {cacheInfo.memorySize} cached items
            </Badge>
            
            {/* Stock Loading Status */}
            {stocksLoading.showLoading && (
              <Badge variant="outline" className="text-xs text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                Loading stocks...
              </Badge>
            )}
            
            {!stocksLoading.showLoading && stocks.length > 0 && (
              <Badge variant="outline" className="text-xs text-green-600">
                ✅ {stocks.length} stocks loaded
                {stocks.length === 20 && ' (fallback)'}
                {stocks.length > 20 && ' (S&P 500)'}
              </Badge>
            )}
            
            {isSearchMode && searchResults.length > 0 && (
              <Badge variant="outline" className="text-xs text-purple-600">
                🔍 {searchResults.length} search results
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadPopularStocks(true)}
              className="text-xs"
              disabled={stocksLoading.isLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${stocksLoading.isLoading ? 'animate-spin' : ''}`} />
              Refresh Stocks ({stocksLoading.isLoading ? 'Loading...' : `${stocks.length} loaded`})
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={forceRefresh}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Force Refresh
            </Button>
          </div>
        </div>

        {/* AI Analysis Results */}
        {analysisResult && (
          <div className="mb-8">
            <AnalysisResults 
              recommendations={analysisResult.recommendations}
              analysis={analysisResult.analysis}
              query={lastQuery}
            />
          </div>
        )}

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="stocks" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Stocks</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center space-x-2">
              <Newspaper className="h-4 w-4" />
              <span>News</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Market Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Market Snapshot</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stocksLoading.showLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ) : marketStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{marketStats.totalStocks}</div>
                          <div className="text-sm text-gray-600">Tracked Stocks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {marketStats.gainers}
                          </div>
                          <div className="text-sm text-gray-600">Gainers</div>
                        </div>
                      </div>
                      <div className="text-center pt-4 border-t">
                        <div className="text-lg text-gray-600">Last Updated</div>
                        <div className="text-sm text-gray-500">{marketStats.lastUpdated}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Loading market data...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sentiment Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Sentiment Overview</span>
                    {sentimentUpdateTime && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        Updated: {sentimentUpdateTime}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overallSentiment ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <Badge 
                          variant={overallSentiment.overallSentiment === 'positive' ? 'default' : 
                                 overallSentiment.overallSentiment === 'negative' ? 'destructive' : 'secondary'}
                          className="text-lg px-3 py-1 capitalize"
                        >
                          {overallSentiment.overallSentiment}
                        </Badge>
                        <div className="mt-2 text-xl font-bold">
                          {(overallSentiment.confidence * 100).toFixed(1)}% Confidence
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="text-green-600">
                          ↗ {overallSentiment.breakdown.positive}
                        </div>
                        <div className="text-red-600">
                          ↘ {overallSentiment.breakdown.negative}
                        </div>
                        <div className="text-gray-600">
                          → {overallSentiment.breakdown.neutral}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Load news with sentiment analysis to view market sentiment</p>
                      <Button 
                        onClick={() => loadNews()} 
                        className="mt-2" 
                        size="sm"
                        disabled={newsLoading.isLoading}
                      >
                        {newsLoading.isLoading ? 'Loading...' : 'Load Sentiment Data'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Stocks Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Performing Stocks</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {topStocksDisplayCount} of {displayStocks.length} stocks
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayStocks
                    .sort((a, b) => b.changePercent - a.changePercent)
                    .slice(0, topStocksDisplayCount)
                    .map((stock) => (
                      <StockCard key={stock.symbol} stock={stock} />
                    ))}
                </div>
                
                {/* Load More Button */}
                {topStocksDisplayCount < displayStocks.length && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={showMoreTopStocks}
                      className="flex items-center space-x-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Show More Top Stocks ({displayStocks.length - topStocksDisplayCount} remaining)</span>
                    </Button>
                  </div>
                )}
                
                {/* Load More Stocks from API */}
                {stocks.length < 500 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreStocks}
                      disabled={stocksLoading.isLoading}
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${stocksLoading.isLoading ? 'animate-spin' : ''}`} />
                      <span>
                        {stocksLoading.isLoading 
                          ? 'Loading more...' 
                          : `Load More Stocks (${stocks.length}/500 S&P 500)`
                        }
                      </span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Stock Analysis</h2>
                <Button
                  variant="outline"
                  onClick={() => loadPopularStocks(true)}
                  disabled={stocksLoading.isLoading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${stocksLoading.isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </Button>
              </div>
              
              {stocksLoading.showLoading ? (
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-32"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <StockChart stocks={displayStocks} />
              )}
            </div>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Market Sentiment Analysis</h2>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Rate Limited (10min)
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => loadNews(true)}
                    disabled={newsLoading.isLoading}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${newsLoading.isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {overallSentiment ? (
                <SentimentChart data={overallSentiment} articles={news} />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Sentiment Data</h3>
                    <p className="text-gray-600 mb-4">
                      Load news with sentiment analysis to view detailed market sentiment insights
                    </p>
                    <Button onClick={() => loadNews()} disabled={newsLoading.isLoading}>
                      {newsLoading.isLoading ? 'Loading...' : 'Analyze Market Sentiment'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Newspaper className="h-5 w-5" />
                    <span>Financial News & Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {sentimentUpdateTime && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Updated: {sentimentUpdateTime}</span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Rate Limited (10min)
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadNews(true)}
                      disabled={newsLoading.isLoading}
                      className="flex items-center space-x-1"
                    >
                      <RefreshCw className={`h-4 w-4 ${newsLoading.isLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </CardTitle>
                <div className="text-sm text-gray-600 mt-2">
                  Sentiment analysis updates every 10 minutes to respect AI API limits and reduce costs. 
                  Recent requests may show cached results based on article content.
                </div>
              </CardHeader>
              <CardContent>
                {newsLoading.showLoading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-24"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {news.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                    {news.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No news articles available</h3>
                        <p className="mb-4">Try refreshing to load the latest financial news</p>
                        <Button onClick={() => loadNews()} disabled={newsLoading.isLoading}>
                          {newsLoading.isLoading ? 'Loading...' : 'Load News'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600 border-t pt-8">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <Badge variant="outline">Google Gemini AI</Badge>
            <Badge variant="outline">Yahoo Finance API</Badge>
            <Badge variant="outline">Real-time Data</Badge>
            <Badge variant="outline">Smart Caching</Badge>
          </div>
          <p className="text-sm">
            This platform provides educational financial analysis and should not be considered as investment advice.
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Data refreshed in real-time • Sentiment analysis rate-limited to 1 request per minute • Responses cached for performance
          </p>
        </footer>
      </main>
    </div>
  );
}
