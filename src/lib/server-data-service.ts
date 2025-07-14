import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { StockData } from './financial-data';
import { NewsArticle } from './news-scraper';

// Types for our cached data
interface CachedData {
  stocks: StockData[];
  news: NewsArticle[];
  overallSentiment: any;
  lastUpdated: string;
  nextUpdateAt: string;
}

interface DataServiceConfig {
  stockUpdateInterval: number; // minutes
  newsUpdateInterval: number;  // minutes
  maxRetries: number;
  timeoutMs: number;
}

class ServerDataService {
  private config: DataServiceConfig;
  private cacheFilePath: string;
  private updateIntervals: NodeJS.Timeout[] = [];
  private isUpdating = false;

  constructor(config: Partial<DataServiceConfig> = {}) {
    this.config = {
      stockUpdateInterval: 30,  // 30 minutes
      newsUpdateInterval: 15,   // 15 minutes
      maxRetries: 3,
      timeoutMs: 25000,        // 25 seconds
      ...config
    };
    
    // Store cache in a data directory
    this.cacheFilePath = join(process.cwd(), 'data', 'cache.json');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    const dataDir = join(process.cwd(), 'data');
    try {
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  // Get cached data or return default
  public getCachedData(): CachedData {
    try {
      if (existsSync(this.cacheFilePath)) {
        const data = readFileSync(this.cacheFilePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }

    // Return default data if cache doesn't exist or is corrupted
    return {
      stocks: [],
      news: [],
      overallSentiment: null,
      lastUpdated: new Date().toISOString(),
      nextUpdateAt: new Date(Date.now() + this.config.stockUpdateInterval * 60000).toISOString()
    };
  }

  // Save data to cache
  private saveCachedData(data: CachedData) {
    try {
      writeFileSync(this.cacheFilePath, JSON.stringify(data, null, 2));
      console.log('✅ Cache updated successfully');
    } catch (error) {
      console.error('❌ Error saving cache:', error);
    }
  }

  // Fetch stocks with timeout and retry logic
  private async fetchStocksWithRetry(): Promise<StockData[]> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`📊 Fetching stocks (attempt ${attempt}/${this.config.maxRetries})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
        
        // Use our existing function but with better error handling
        const { getPopularStocks } = await import('./financial-data');
        const stocks = await getPopularStocks();
        
        clearTimeout(timeoutId);
        
        if (Array.isArray(stocks) && stocks.length > 0) {
          console.log(`✅ Successfully fetched ${stocks.length} stocks`);
          return stocks;
        } else {
          throw new Error('Invalid stock data received');
        }
        
      } catch (error) {
        console.error(`❌ Stock fetch attempt ${attempt} failed:`, error);
        if (attempt === this.config.maxRetries) {
          // Return fallback data on final failure
          return this.getFallbackStocks();
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
    return [];
  }

  // Fetch news with timeout and retry logic  
  private async fetchNewsWithRetry(): Promise<{ news: NewsArticle[], sentiment: any }> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`📰 Fetching news (attempt ${attempt}/${this.config.maxRetries})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
        
        // Import news functions
        const { getNewsWithFallback } = await import('./news-scraper');
        const news = await getNewsWithFallback();
        
        clearTimeout(timeoutId);
        
        if (Array.isArray(news)) {
          console.log(`✅ Successfully fetched ${news.length} news articles`);
          
          // Try to get sentiment analysis
          let sentiment = null;
          try {
            const { analyzeBulkSentiment, calculateOverallSentiment } = await import('./gemini');
            const sentimentResults = await analyzeBulkSentiment(news);
            
            // Combine news with sentiment results
            const newsWithSentiment = news.map((article, index) => ({
              ...article,
              sentiment: sentimentResults[index]
            }));
            
            // Calculate overall market sentiment
            sentiment = calculateOverallSentiment(newsWithSentiment);
            
            return { news: newsWithSentiment, sentiment };
          } catch (sentimentError) {
            console.log('⚠️ Sentiment analysis skipped (rate limited or error):', sentimentError);
          }
          
          return { news, sentiment };
        } else {
          throw new Error('Invalid news data received');
        }
        
      } catch (error) {
        console.error(`❌ News fetch attempt ${attempt} failed:`, error);
        if (attempt === this.config.maxRetries) {
          // Return empty data on final failure
          return { news: [], sentiment: null };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
    return { news: [], sentiment: null };
  }

  // Fallback stocks for when API fails
  private getFallbackStocks(): StockData[] {
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 150.00, change: 1.50, changePercent: 1.01, volume: 50000000 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.00, change: -15.25, changePercent: -0.54, volume: 25000000 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 380.00, change: 5.75, changePercent: 1.54, volume: 30000000 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3200.00, change: 25.50, changePercent: 0.80, volume: 20000000 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 850.00, change: -12.25, changePercent: -1.42, volume: 35000000 }
    ];
  }

  // Update stocks data
  public async updateStocks(): Promise<void> {
    if (this.isUpdating) {
      console.log('⏳ Update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;
    try {
      const cachedData = this.getCachedData();
      const stocks = await this.fetchStocksWithRetry();
      
      const updatedData: CachedData = {
        ...cachedData,
        stocks,
        lastUpdated: new Date().toISOString(),
        nextUpdateAt: new Date(Date.now() + this.config.stockUpdateInterval * 60000).toISOString()
      };
      
      this.saveCachedData(updatedData);
    } finally {
      this.isUpdating = false;
    }
  }

  // Update news data
  public async updateNews(): Promise<void> {
    if (this.isUpdating) {
      console.log('⏳ Update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;
    try {
      const cachedData = this.getCachedData();
      const { news, sentiment } = await this.fetchNewsWithRetry();
      
      const updatedData: CachedData = {
        ...cachedData,
        news,
        overallSentiment: sentiment,
        lastUpdated: new Date().toISOString(),
        nextUpdateAt: new Date(Date.now() + this.config.newsUpdateInterval * 60000).toISOString()
      };
      
      this.saveCachedData(updatedData);
    } finally {
      this.isUpdating = false;
    }
  }

  // Update all data
  public async updateAll(): Promise<void> {
    console.log('🔄 Starting full data update...');
    await Promise.all([
      this.updateStocks(),
      this.updateNews()
    ]);
    console.log('✅ Full data update completed');
  }

  // Start periodic updates
  public startPeriodicUpdates(): void {
    console.log('🚀 Starting periodic data updates...');
    console.log(`📊 Stocks: every ${this.config.stockUpdateInterval} minutes`);
    console.log(`📰 News: every ${this.config.newsUpdateInterval} minutes`);

    // Initial update
    this.updateAll();

    // Schedule periodic updates
    const stockInterval = setInterval(() => {
      this.updateStocks();
    }, this.config.stockUpdateInterval * 60000);

    const newsInterval = setInterval(() => {
      this.updateNews();
    }, this.config.newsUpdateInterval * 60000);

    this.updateIntervals.push(stockInterval, newsInterval);
  }

  // Stop periodic updates
  public stopPeriodicUpdates(): void {
    console.log('🛑 Stopping periodic updates...');
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals = [];
  }

  // Get cache stats
  public getCacheStats() {
    const data = this.getCachedData();
    return {
      stockCount: data.stocks.length,
      newsCount: data.news.length,
      lastUpdated: data.lastUpdated,
      nextUpdateAt: data.nextUpdateAt,
      hasSentiment: !!data.overallSentiment
    };
  }
}

// Export singleton instance
export const serverDataService = new ServerDataService({
  stockUpdateInterval: 30,  // 30 minutes - much less frequent
  newsUpdateInterval: 15,   // 15 minutes
  maxRetries: 3,
  timeoutMs: 25000
});

// Auto-start in production, manual start in development
if (process.env.NODE_ENV === 'production') {
  serverDataService.startPeriodicUpdates();
}

export default ServerDataService; 