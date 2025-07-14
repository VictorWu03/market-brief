import { NextRequest, NextResponse } from 'next/server';
import { generateStockRecommendations, generateFinancialAnalysis } from '@/lib/gemini';

// Rate limiting for analysis API
const analysisRequestCounts = new Map<string, { count: number; resetTime: number }>();
const ANALYSIS_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const ANALYSIS_RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 analysis requests per 5 minutes per IP

function checkAnalysisRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `analysis_${ip}`;
  
  if (!analysisRequestCounts.has(key)) {
    analysisRequestCounts.set(key, { count: 1, resetTime: now + ANALYSIS_RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: ANALYSIS_RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + ANALYSIS_RATE_LIMIT_WINDOW };
  }
  
  const record = analysisRequestCounts.get(key)!;
  
  // Reset if window expired
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + ANALYSIS_RATE_LIMIT_WINDOW;
    analysisRequestCounts.set(key, record);
    return { allowed: true, remaining: ANALYSIS_RATE_LIMIT_MAX_REQUESTS - 1, resetTime: record.resetTime };
  }
  
  // Check if over limit
  if (record.count >= ANALYSIS_RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // Increment count
  record.count++;
  analysisRequestCounts.set(key, record);
  return { allowed: true, remaining: ANALYSIS_RATE_LIMIT_MAX_REQUESTS - record.count, resetTime: record.resetTime };
}

// Use our internal cached endpoints instead of direct external API calls
async function getStocksFromInternalAPI(): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stocks`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    // Handle both old and new response formats
    return Array.isArray(data) ? data : (data.stocks || []);
  } catch (error) {
    console.error('Error fetching stocks from internal API:', error);
    // Return fallback data
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 191.45, change: 2.51, changePercent: 1.33, volume: 45000000 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.55, change: -1.23, changePercent: -0.29, volume: 28000000 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 139.69, change: 1.87, changePercent: 1.36, volume: 22000000 }
    ];
  }
}

async function getNewsFromInternalAPI(): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/news`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching news from internal API:', error);
    // Return fallback data
    return [
      {
        id: '1',
        title: 'Tech Stocks Rally on AI Optimism',
        summary: 'Major technology companies see gains as artificial intelligence sector continues to grow.',
        source: 'Financial News',
        publishedAt: new Date().toISOString(),
        sentiment: 'positive'
      }
    ];
  }
}

// Cache for analysis to avoid hitting Gemini limits
const analysisCache = new Map<string, { timestamp: number; data: any }>();
const ANALYSIS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCacheKey(query: string, type: string): string {
  return `${type}_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

export async function POST(request: NextRequest) {
  try {
    // Extract IP address for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Apply rate limiting
    const rateLimitResult = checkAnalysisRateLimit(ip);
    
    if (!rateLimitResult.allowed) {
      const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60); // minutes
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: `Too many analysis requests. Please wait ${waitTime} minutes before trying again.`,
          retryAfter: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': ANALYSIS_RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': (rateLimitResult.resetTime - Date.now()).toString()
          }
        }
      );
    }

    const body = await request.json();
    const { query, type = 'recommendation' } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': ANALYSIS_RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    // Check cache first to avoid hitting Gemini limits
    const cacheKey = getCacheKey(query, type);
    const now = Date.now();
    const cached = analysisCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < ANALYSIS_CACHE_DURATION) {
      console.log(`🔄 Returning cached analysis for: ${query}`);
      return NextResponse.json({
        ...cached.data,
        meta: {
          cached: true,
          cachedAt: new Date(cached.timestamp).toISOString()
        }
      }, {
        headers: {
          'X-RateLimit-Limit': ANALYSIS_RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      });
    }

    // Temporarily disable user-triggered Gemini analysis to preserve daily quota
    // Only allow automated sentiment analysis every 30 minutes
    return NextResponse.json({
      recommendations: [],
      analysis: `AI-powered analysis is temporarily limited to preserve API quota for essential features.

Current query: "${query}"

**Market Insights Available:**
• Real-time stock data for 500+ S&P 500 companies
• Live financial news with automated sentiment analysis (updated every 30 minutes)
• Interactive stock charts and performance metrics

**Manual Analysis Tips:**
• Check the "Sentiment" tab for AI-generated market sentiment
• Review top performing stocks in the "Overview" tab  
• Use stock search to find specific companies (e.g., "AAPL", "MSFT")

AI analysis will be re-enabled once we optimize API usage. Thank you for your understanding!`
    }, {
      headers: {
        'X-RateLimit-Limit': ANALYSIS_RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    });

    /* TEMPORARILY DISABLED - Uncomment to re-enable user-triggered analysis
    
    // Stock recommendation analysis - use our cached internal APIs
    console.log('🔍 Getting data from internal cached APIs...');
    
    // Get stock data from our cached API
    const stockData = await getStocksFromInternalAPI();
    console.log(`📊 Retrieved ${stockData.length} stocks from internal API`);

    // Get news data from our cached API
    const newsData = await getNewsFromInternalAPI();
    console.log(`📰 Retrieved ${newsData.length} news articles from internal API`);

    try {
      // Generate recommendations using cached data
      const recommendations = await generateStockRecommendations(
        query,
        stockData,
        newsData
      );

      // Cache the result
      analysisCache.set(cacheKey, { timestamp: now, data: recommendations });

      return NextResponse.json(recommendations);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      
      // Handle quota exceeded specifically
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        const quotaResult = {
          recommendations: [],
          analysis: `Daily API quota exceeded (50 requests/day limit reached). Analysis will be available tomorrow. 

For immediate analysis, consider upgrading to a paid Gemini API plan at https://ai.google.dev/pricing

Current query: "${query}" - This would typically provide stock recommendations based on current market data and news sentiment.`
        };
        
        // Cache the quota message for a shorter time
        analysisCache.set(cacheKey, { timestamp: now, data: quotaResult });
        
        return NextResponse.json(quotaResult);
      }
      
      // Handle other API errors
      return NextResponse.json({
        recommendations: [],
        analysis: `Unable to generate recommendations: ${error.message || 'Unknown error'}. Please try again later.`
      });
    }
    
    END DISABLED SECTION */

  } catch (error) {
    console.error('Error in analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
} 