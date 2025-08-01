import { NextResponse } from 'next/server';
import { NewsArticle, getFinancialNews } from '@/lib/news-scraper';

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

// Enhanced fallback news data with more variety
const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Tech Stocks Rally on AI Optimism',
    summary: 'Major technology companies see gains as artificial intelligence sector continues to grow with new breakthroughs in machine learning.',
    url: 'https://example.com/tech-rally',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    sentiment: {
      sentiment: 'positive',
      confidence: 0.8,
      summary: 'Positive market sentiment on AI growth'
    }
  },
  {
    id: '2',
    title: 'Federal Reserve Signals Potential Rate Changes',
    summary: 'The Federal Reserve hints at monetary policy adjustments in response to current economic indicators and inflation trends.',
    url: 'https://example.com/fed-signals',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    sentiment: {
      sentiment: 'neutral',
      confidence: 0.6,
      summary: 'Cautious market sentiment on monetary policy'
    }
  },
  {
    id: '3',
    title: 'Energy Sector Faces Headwinds',
    summary: 'Oil and gas companies report challenges amid changing global energy policies and renewable energy transition.',
    url: 'https://example.com/energy-headwinds',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    sentiment: {
      sentiment: 'negative',
      confidence: 0.7,
      summary: 'Negative sentiment on traditional energy outlook'
    }
  },
  {
    id: '4',
    title: 'Healthcare Innovation Drives Investment',
    summary: 'Pharmaceutical and biotech companies attract significant venture capital as breakthrough treatments show promise.',
    url: 'https://example.com/healthcare-investment',
    source: 'Wall Street Journal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    sentiment: {
      sentiment: 'positive',
      confidence: 0.9,
      summary: 'Strong positive sentiment on healthcare innovation'
    }
  },
  {
    id: '5',
    title: 'Consumer Spending Patterns Shift',
    summary: 'Retail data reveals changing consumer preferences as economic uncertainty influences purchasing decisions.',
    url: 'https://example.com/consumer-spending',
    source: 'CNBC',
    publishedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    sentiment: {
      sentiment: 'neutral',
      confidence: 0.5,
      summary: 'Mixed market sentiment on consumer trends'
    }
  },
  {
    id: '6',
    title: 'Cryptocurrency Market Volatility Continues',
    summary: 'Digital assets experience significant price swings as regulatory discussions and institutional adoption create uncertainty.',
    url: 'https://example.com/crypto-volatility',
    source: 'MarketWatch',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    sentiment: {
      sentiment: 'negative',
      confidence: 0.6,
      summary: 'Volatile sentiment in cryptocurrency markets'
    }
  },
  {
    id: '7',
    title: 'Green Technology Investments Surge',
    summary: 'Renewable energy and sustainable technology companies see record investment levels as ESG focus intensifies.',
    url: 'https://example.com/green-tech-surge',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    sentiment: {
      sentiment: 'positive',
      confidence: 0.85,
      summary: 'Very positive sentiment on green technology'
    }
  },
  {
    id: '8',
    title: 'Global Supply Chain Disruptions Persist',
    summary: 'Manufacturing and logistics companies continue to face challenges from ongoing supply chain bottlenecks.',
    url: 'https://example.com/supply-chain',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    sentiment: {
      sentiment: 'negative',
      confidence: 0.7,
      summary: 'Negative sentiment on supply chain issues'
    }
  },
  {
    id: '9',
    title: 'Banking Sector Shows Resilience',
    summary: 'Major financial institutions report stronger-than-expected earnings despite economic headwinds and regulatory changes.',
    url: 'https://example.com/banking-resilience',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    sentiment: {
      sentiment: 'positive',
      confidence: 0.75,
      summary: 'Positive sentiment on banking sector strength'
    }
  },
  {
    id: '10',
    title: 'Market Volatility Expected to Continue',
    summary: 'Financial analysts predict ongoing market uncertainty as geopolitical tensions and economic indicators create mixed signals.',
    url: 'https://example.com/market-volatility',
    source: 'Wall Street Journal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    sentiment: {
      sentiment: 'neutral',
      confidence: 0.6,
      summary: 'Cautious sentiment on market outlook'
    }
  }
];

// Cache for API responses - extended for outage resilience
let cachedData: { articles: NewsArticle[]; sentiment: SentimentData; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for outage resilience

// Sentiment analysis timing - only run every 30 minutes to preserve quota
let lastSentimentUpdate = 0;
const SENTIMENT_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutes

async function fetchNewsFromAPI(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ NEWS_API_KEY not configured, using enhanced fallback news');
    return FALLBACK_NEWS;
  }

  try {
    // Search for financial/market news
    const query = encodeURIComponent('stock market OR finance OR economy OR trading');
    const url = `https://newsapi.org/v2/everything?q=${query}&domains=reuters.com,bloomberg.com,marketwatch.com,cnbc.com,wsj.com&language=en&sortBy=publishedAt&pageSize=15&apiKey=${apiKey}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FinanceRAG/1.0' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      console.warn('⚠️ NewsAPI error:', data.message);
      return FALLBACK_NEWS;
    }

    const articles: NewsArticle[] = data.articles
      .filter((article: any) => 
        article.title && 
        article.description && 
        article.url && 
        !article.title.includes('[Removed]')
      )
      .slice(0, 10) // Limit to 10 articles
      .map((article: any, index: number) => ({
        id: `news_${Date.now()}_${index}`,
        title: article.title,
        summary: article.description,
        url: article.url,
        source: article.source?.name || 'Unknown Source',
        publishedAt: article.publishedAt
      }));

    if (articles.length === 0) {
      console.warn('⚠️ No valid articles found, using fallback');
      return FALLBACK_NEWS;
    }

    console.log(`✅ Successfully fetched ${articles.length} news articles`);
    return articles;

  } catch (error) {
    console.error('❌ Error fetching news:', error);
    return FALLBACK_NEWS;
  }
}

// Rate limiting storage (in production, use Redis or database)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 20; // Max 20 requests per 10 minutes per IP

// Simple rate limiting function
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = ip;
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  const record = requestCounts.get(key)!;
  
  // Reset if window expired
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW;
    requestCounts.set(key, record);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: record.resetTime };
  }
  
  // Check if over limit
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // Increment count
  record.count++;
  requestCounts.set(key, record);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetTime: record.resetTime };
}

export async function GET(request: Request) {
  try {
    console.log('📰 News API called');
    
    // Extract IP address for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(ip);
    
    if (!rateLimitResult.allowed) {
      const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60); // minutes
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: `Too many requests. Please wait ${waitTime} minutes before trying again.`,
          retryAfter: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': (rateLimitResult.resetTime - Date.now()).toString()
          }
        }
      );
    }
    
    // Check cache first - return cached data if within 24 hours
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log('📰 Returning cached news data');
      
      const response = {
        articles: cachedData.articles,
        overallSentiment: cachedData.sentiment,
        meta: {
          total: cachedData.articles.length,
          withSentiment: cachedData.articles.filter((a: any) => a.sentiment).length,
          lastUpdated: new Date(cachedData.timestamp).toISOString(),
          source: 'cache'
        }
      };

      return NextResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${Math.floor((CACHE_DURATION - (now - cachedData.timestamp)) / 1000)}`,
          'X-Data-Source': 'cache',
          'X-News-Count': cachedData.articles.length.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      });
    }

    // Check if we should skip sentiment analysis (not enough time has passed)
    const shouldUpdateSentiment = (now - lastSentimentUpdate) >= SENTIMENT_UPDATE_INTERVAL;
    const minutesSinceLastUpdate = Math.round((now - lastSentimentUpdate) / (60 * 1000));
    const minutesUntilNextUpdate = Math.round((SENTIMENT_UPDATE_INTERVAL - (now - lastSentimentUpdate)) / (60 * 1000));
    
    console.log(`🔍 SENTIMENT TIMING CHECK:`);
    console.log(`   ⏰ Last Update: ${minutesSinceLastUpdate} minutes ago`);
    console.log(`   📋 Update Interval: ${SENTIMENT_UPDATE_INTERVAL / (60 * 1000)} minutes`);
    console.log(`   🎯 Should Update: ${shouldUpdateSentiment ? 'YES - Time to run analysis!' : `NO - Wait ${minutesUntilNextUpdate} more minutes`}`);
    console.log(`   🤖 API Key Available: ${process.env.GOOGLE_AI_API_KEY ? 'YES' : 'NO'}`);
    
    if (!shouldUpdateSentiment && cachedData) {
      console.log(`⏰ SENTIMENT SKIP: Using cached sentiment analysis`);
      console.log(`   📊 Reason: Only ${minutesSinceLastUpdate} minutes since last update (need 30+)`);
      console.log(`   ⌛ Next Update: In ${minutesUntilNextUpdate} minutes`);
      
      // Return cached data without new sentiment analysis
      const response = {
        articles: cachedData.articles,
        overallSentiment: cachedData.sentiment,
        meta: {
          total: cachedData.articles.length,
          withSentiment: cachedData.articles.filter((a: any) => a.sentiment).length,
          lastUpdated: new Date(cachedData.timestamp).toISOString(),
          source: 'cached-sentiment'
        }
      };

      return NextResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${Math.floor(SENTIMENT_UPDATE_INTERVAL / 1000)}`,
          'X-Data-Source': 'cached-sentiment',
          'X-News-Count': cachedData.articles.length.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      });
    }

    // Fetch fresh data using free Yahoo Finance scraping
    console.log('📰 Fetching news using Yahoo Finance scraping...');
    const articles = await getFinancialNews();
    
    // Analyze sentiment using bulk analysis - only every 30 minutes to preserve quota
    let sentiment = null;
    let articlesWithSentiment = articles;
    
    try {
      if (process.env.GOOGLE_AI_API_KEY && shouldUpdateSentiment) {
        console.log('🚀 SENTIMENT ANALYSIS TRIGGERED:');
        console.log(`   ✅ Time Check: ${minutesSinceLastUpdate} min since last update (threshold: 30 min)`);
        console.log(`   📰 Articles to Analyze: ${articles.length}`);
        console.log(`   🤖 Model: gemini-1.5-flash (bulk sentiment analysis)`);
        console.log(`   💰 Quota Impact: This will use ~1 API request from your daily quota`);
        
        const { analyzeBulkSentiment, calculateOverallSentiment } = await import('@/lib/gemini');
        const sentimentResults = await analyzeBulkSentiment(articles);
        
        // Combine articles with sentiment results
        articlesWithSentiment = articles.map((article, index) => ({
          ...article,
          sentiment: sentimentResults[index]
        }));
        
        // Calculate overall market sentiment
        sentiment = calculateOverallSentiment(articlesWithSentiment);
        
        // Update last sentiment update timestamp
        lastSentimentUpdate = now;
        console.log('✅ SENTIMENT ANALYSIS COMPLETE:');
        console.log(`   📊 Overall Sentiment: ${sentiment.overallSentiment} (confidence: ${(sentiment.confidence * 100).toFixed(1)}%)`);
        console.log(`   📈 Breakdown: +${sentiment.breakdown.positive} -${sentiment.breakdown.negative} =${sentiment.breakdown.neutral}`);
        console.log(`   ⏰ Next Analysis: In 30 minutes`);
      } else if (cachedData?.sentiment) {
        // Use previous sentiment data if within 30-minute window
        console.log('📋 SENTIMENT REUSE: Using cached sentiment from previous analysis');
        console.log(`   📊 Sentiment Age: ${minutesSinceLastUpdate} minutes old`);
        console.log(`   🎯 Reason: ${!process.env.GOOGLE_AI_API_KEY ? 'No API key configured' : 'Within 30-minute cache window'}`);
        sentiment = cachedData.sentiment;
        // Apply cached sentiment to new articles if available
        if (cachedData && cachedData.articles.length > 0) {
          articlesWithSentiment = articles.map((article, index) => ({
            ...article,
            sentiment: cachedData!.articles[index]?.sentiment || undefined
          }));
        }
      } else {
        console.log('⚠️ SENTIMENT UNAVAILABLE: No cached sentiment and conditions not met for new analysis');
        console.log(`   📊 API Key: ${process.env.GOOGLE_AI_API_KEY ? 'Available' : 'Missing'}`);
        console.log(`   ⏰ Time Since Last: ${minutesSinceLastUpdate} min (need 30+ min)`);
        console.log(`   💾 Cached Data: ${cachedData ? 'Available but no sentiment' : 'None'}`);
      }
    } catch (error) {
      console.error('❌ SENTIMENT ERROR: Analysis failed');
      console.error(`   📊 Articles: ${articles.length}`);
      console.error(`   ⚠️  Error:`, error);
      // Try to use cached sentiment if available
      if (cachedData?.sentiment) {
        sentiment = cachedData.sentiment;
        console.log('🔄 FALLBACK: Using cached sentiment due to error');
      }
    }
    
    // If no sentiment was calculated, provide a fallback
    if (!sentiment) {
      sentiment = {
        overallSentiment: 'neutral' as const,
        confidence: 0.5,
        summary: 'Sentiment analysis not available',
        breakdown: { positive: 0, negative: 0, neutral: articles.length }
      };
    }
    
    // Update cache
    cachedData = {
      articles: articlesWithSentiment,
      sentiment,
      timestamp: now
    };

    const response = {
      articles: articlesWithSentiment,
      overallSentiment: sentiment,
      meta: {
        total: articlesWithSentiment.length,
        withSentiment: articlesWithSentiment.filter((a: any) => a.sentiment).length,
        lastUpdated: new Date().toISOString(),
        source: 'yahoo-scraping'
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`,
        'X-Data-Source': 'yahoo-scraping',
        'X-News-Count': articlesWithSentiment.length.toString(),
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error in news API:', error);
    
    // Return fallback data even on error
    const fallbackSentiment: SentimentData = {
      overallSentiment: 'neutral',
      confidence: 0.5,
      summary: 'Error occurred during sentiment analysis',
      breakdown: { positive: 0, negative: 0, neutral: FALLBACK_NEWS.length }
    };
    
    return NextResponse.json({
      articles: FALLBACK_NEWS,
      overallSentiment: fallbackSentiment,
      meta: {
        total: FALLBACK_NEWS.length,
        withSentiment: FALLBACK_NEWS.filter(a => a.sentiment).length,
        lastUpdated: new Date().toISOString(),
        source: 'fallback'
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'fallback',
        'X-News-Count': FALLBACK_NEWS.length.toString(),
        'X-Error': error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
} 