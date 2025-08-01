import { GoogleGenerativeAI } from '@google/generative-ai';

// **TEMPORARY: Set to true to disable all Gemini API calls during local testing**
const LOCAL_TESTING_DISABLE_GEMINI = true; // Change to false to re-enable

const apiKey = process.env.GOOGLE_AI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

// Only initialize if not in local testing mode and API key exists
if (apiKey && !LOCAL_TESTING_DISABLE_GEMINI) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export { model };

// **NEW: Usage tracking for monitoring API calls**
interface UsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastCallTime: number;
  quotaErrors: number;
  rateLimitErrors: number;
  estimatedTokensUsed: number;
  todaysCalls: number;
  lastResetDate: string;
}

// eslint-disable-next-line prefer-const
let usageStats: UsageStats = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  lastCallTime: 0,
  quotaErrors: 0,
  rateLimitErrors: 0,
  estimatedTokensUsed: 0,
  todaysCalls: 0,
  lastResetDate: new Date().toDateString()
};

// Reset daily counters if it's a new day (Pacific Time - when Gemini quotas reset)
function checkDailyReset() {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const todayPacific = pacificTime.toDateString();
  
  if (usageStats.lastResetDate !== todayPacific) {
    console.log(`📅 Daily reset detected (Pacific Time): ${todayPacific}`);
    usageStats.todaysCalls = 0;
    usageStats.lastResetDate = todayPacific;
  }
}

// Track API call before making request
function trackApiCall() {
  checkDailyReset();
  usageStats.totalCalls++;
  usageStats.todaysCalls++;
  usageStats.lastCallTime = Date.now();
}

// Track API call result
function trackApiResult(success: boolean, error?: any, estimatedTokens: number = 0) {
  if (success) {
    usageStats.successfulCalls++;
    usageStats.estimatedTokensUsed += estimatedTokens;
  } else {
    usageStats.failedCalls++;
    
    // Track specific error types
    if (error?.message?.includes('quota') || error?.status === 429) {
      usageStats.quotaErrors++;
    } else if (error?.message?.includes('rate limit') || error?.message?.includes('Too Many Requests')) {
      usageStats.rateLimitErrors++;
    }
  }
}

// Get current usage statistics
export function getUsageStats(): UsageStats & { 
  dailyQuotaUsed: string;
  quotaRemaining: string;
  nextResetTime: string;
  cacheStats: {
    bulkCacheSize: number;
    articleCacheSize: number;
    totalCachedArticles: number;
    cacheHitRate: string;
  };
} {
  checkDailyReset();
  
  const dailyQuotaLimit = 50; // Free tier limit
  const quotaUsedPercent = (usageStats.todaysCalls / dailyQuotaLimit * 100).toFixed(1);
  const quotaRemaining = Math.max(0, dailyQuotaLimit - usageStats.todaysCalls);
  
  // Calculate next reset time (midnight Pacific)
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  const tomorrow = new Date(pacificTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  // Calculate cache statistics
  const bulkCacheSize = sentimentCache.size;
  const articleCacheSize = individualArticleCache.size;
  const cacheHitRate = usageStats.totalCalls > 0 
    ? ((usageStats.successfulCalls / usageStats.totalCalls) * 100).toFixed(1)
    : '0.0';
  
  return {
    ...usageStats,
    dailyQuotaUsed: `${usageStats.todaysCalls}/${dailyQuotaLimit} (${quotaUsedPercent}%)`,
    quotaRemaining: `${quotaRemaining} requests remaining`,
    nextResetTime: tomorrow.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    cacheStats: {
      bulkCacheSize,
      articleCacheSize,
      totalCachedArticles: articleCacheSize,
      cacheHitRate: `${cacheHitRate}%`
    }
  };
}

// Print usage stats to console
export function logUsageStats() {
  const stats = getUsageStats();
  console.log(`\n📊 GEMINI API USAGE STATS:`);
  console.log(`   📅 Today's Calls: ${stats.dailyQuotaUsed}`);
  console.log(`   📈 Total Calls: ${stats.totalCalls} (${stats.successfulCalls} success, ${stats.failedCalls} failed)`);
  console.log(`   ⚠️  Quota Errors: ${stats.quotaErrors}`);
  console.log(`   🚫 Rate Limit Errors: ${stats.rateLimitErrors}`);
  console.log(`   🔄 Next Reset: ${stats.nextResetTime}`);
  console.log(`   💾 Cache Stats: ${stats.cacheStats.articleCacheSize} articles cached, Hit Rate: ${stats.cacheStats.cacheHitRate}`);
  console.log(`   📊 Status: ${LOCAL_TESTING_DISABLE_GEMINI ? '🚫 DISABLED for testing' : '✅ ACTIVE'}`);
  console.log(`   🔑 API Key: ${apiKey ? '✅ Configured' : '❌ Missing'}\n`);
}

// **TESTING UTILITIES: Cache management for debugging**
export function clearAllCaches() {
  const beforeArticles = individualArticleCache.size;
  const beforeBulk = sentimentCache.size;
  
  individualArticleCache.clear();
  sentimentCache.clear();
  
  console.log(`🧹 CACHE CLEARED:`);
  console.log(`   📰 Article Cache: ${beforeArticles} → 0`);
  console.log(`   📦 Bulk Cache: ${beforeBulk} → 0`);
  console.log(`   ✅ All sentiment caches cleared for testing`);
}

export function getCacheInfo() {
  return {
    articleCache: {
      size: individualArticleCache.size,
      entries: Array.from(individualArticleCache.entries()).map(([key, value]) => ({
        key: key.substring(0, 20) + '...',
        age: Math.round((Date.now() - value.timestamp) / 1000),
        sentiment: value.sentiment.sentiment,
        confidence: value.sentiment.confidence
      }))
    },
    bulkCache: {
      size: sentimentCache.size,
      entries: Array.from(sentimentCache.entries()).map(([key, value]) => ({
        key: key.substring(0, 20) + '...',
        age: Math.round((Date.now() - value.timestamp) / 1000),
        dataLength: value.data.length
      }))
    }
  };
}

export function logCacheDetails() {
  const info = getCacheInfo();
  console.log(`\n💾 DETAILED CACHE INFORMATION:`);
  console.log(`   📰 Article Cache (${info.articleCache.size} entries):`);
  info.articleCache.entries.forEach((entry, i) => {
    console.log(`     ${i + 1}. ${entry.key} | ${entry.sentiment} (${(entry.confidence * 100).toFixed(1)}%) | ${entry.age}s old`);
  });
  console.log(`   📦 Bulk Cache (${info.bulkCache.size} entries):`);
  info.bulkCache.entries.forEach((entry, i) => {
    console.log(`     ${i + 1}. ${entry.key} | ${entry.dataLength} results | ${entry.age}s old`);
  });
  console.log(``);
}

// Enhanced caching for sentiment analysis with article-level persistence
const sentimentCache = new Map<string, { timestamp: number; data: any }>();
const individualArticleCache = new Map<string, { 
  timestamp: number; 
  sentiment: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
  }
}>();
const SENTIMENT_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (extended to reduce API calls)
const ARTICLE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for individual articles

// Cleanup old cache entries to prevent memory leaks
function cleanupSentimentCache() {
  const now = Date.now();
  for (const [key, value] of sentimentCache.entries()) {
    if (now - value.timestamp > SENTIMENT_CACHE_DURATION) {
      sentimentCache.delete(key);
    }
  }
  
  // Cleanup individual article cache
  for (const [key, value] of individualArticleCache.entries()) {
    if (now - value.timestamp > ARTICLE_CACHE_DURATION) {
      individualArticleCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupSentimentCache, 5 * 60 * 1000);

// Generate cache key based on article content to avoid re-analyzing same articles
function generateContentHash(articles: Array<{ title: string; summary: string }>): string {
  const content = articles.map(a => `${a.title}|${a.summary}`).join('||');
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `sentiment_${hash}`;
}

// Generate cache key for individual article
function generateArticleHash(article: { title: string; summary: string }): string {
  const content = `${article.title}|${article.summary}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `article_${hash}`;
}

// Check for cached individual article sentiments
function getCachedArticleSentiments(articles: Array<{ id: string; title: string; summary: string }>): {
  cachedResults: Array<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
  } | null>;
  uncachedArticles: Array<{ index: number; article: { id: string; title: string; summary: string } }>;
  cacheStats: { hits: number; misses: number; };
} {
  const now = Date.now();
  const cachedResults: Array<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
  } | null> = [];
  const uncachedArticles: Array<{ index: number; article: { id: string; title: string; summary: string } }> = [];
  let hits = 0;
  let misses = 0;

  articles.forEach((article, index) => {
    const articleKey = generateArticleHash(article);
    const cached = individualArticleCache.get(articleKey);
    
    if (cached && (now - cached.timestamp) < ARTICLE_CACHE_DURATION) {
      cachedResults[index] = cached.sentiment;
      hits++;
    } else {
      cachedResults[index] = null;
      uncachedArticles.push({ index, article });
      misses++;
    }
  });

  return { cachedResults, uncachedArticles, cacheStats: { hits, misses } };
}

// Store individual article sentiments in cache
function cacheArticleSentiments(
  articles: Array<{ id: string; title: string; summary: string }>,
  sentiments: Array<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
  }>
) {
  const now = Date.now();
  
  articles.forEach((article, index) => {
    const articleKey = generateArticleHash(article);
    const sentiment = sentiments[index];
    
    if (sentiment) {
      individualArticleCache.set(articleKey, {
        timestamp: now,
        sentiment
      });
    }
  });
}

export async function generateFinancialAnalysis(prompt: string): Promise<string> {
  if (!model) {
    if (LOCAL_TESTING_DISABLE_GEMINI) {
      return 'Gemini API disabled for local testing. Set LOCAL_TESTING_DISABLE_GEMINI to false to re-enable.';
    }
    throw new Error('Google AI API key not configured');
  }
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate financial analysis');
  }
}

export async function analyzeSentiment(newsText: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
}> {
  if (!model) {
    return {
      sentiment: 'neutral',
      confidence: 0,
      summary: LOCAL_TESTING_DISABLE_GEMINI 
        ? 'Gemini API disabled for local testing - using neutral sentiment' 
        : 'API key not configured'
    };
  }
  const prompt = `
    You are an expert financial analyst and portfolio manager. Analyze the sentiment of the following financial news text and provide a detailed, concise, and polished analysis:
    1. Overall market sentiment (positive, negative, or neutral)
    2. Confidence score (0-1) based on clarity of sentiment indicators
    3. Brief summary highlighting key market-moving information
    4. Consider impact on stock prices, investor confidence, and market trends
    
    Text: ${newsText}
    
    Please respond in JSON format:
    {
      "sentiment": "positive|negative|neutral",
      "confidence": 0.85,
      "summary": "Brief summary focusing on market impact and key financial insights"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response and parse JSON
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      sentiment: 'neutral',
      confidence: 0,
      summary: 'Unable to analyze sentiment'
    };
  }
}

export async function analyzeBulkSentiment(articles: Array<{
  id: string;
  title: string;
  summary: string;
}>): Promise<Array<{
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
}>> {
  // Step 1: Check for cached individual article sentiments
  const { cachedResults, uncachedArticles, cacheStats } = getCachedArticleSentiments(articles);
  
  console.log(`🔍 ARTICLE CACHE CHECK:`);
  console.log(`   📰 Total Articles: ${articles.length}`);
  console.log(`   ✅ Cache Hits: ${cacheStats.hits} articles (${((cacheStats.hits / articles.length) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Cache Misses: ${cacheStats.misses} articles`);
  console.log(`   🎯 Need Analysis: ${uncachedArticles.length > 0 ? 'YES' : 'NO'}`);

  // Step 2: If we have complete cached results, return them (even if Gemini is disabled)
  if (cacheStats.misses === 0) {
    console.log(`💾 COMPLETE CACHE: All articles have cached sentiment`);
    console.log(`   📊 Returning: ${cacheStats.hits} cached sentiment analyses`);
    console.log(`   ⚡ Performance: No API calls needed`);
    return cachedResults.map(result => result!) // Safe to use ! since misses === 0
  }

  // Step 3: Handle partial or no cache when Gemini is disabled
  if (!model || LOCAL_TESTING_DISABLE_GEMINI) {
    console.log(`🚫 GEMINI DISABLED: Limited to cached results only`);
    console.log(`   💾 Available: ${cacheStats.hits} cached sentiments`);
    console.log(`   ❌ Missing: ${cacheStats.misses} articles (will show neutral)`);
    console.log(`   🔧 To analyze missing articles: Set LOCAL_TESTING_DISABLE_GEMINI = false`);
    
    // Return combination of cached results and neutral fallbacks
    return cachedResults.map((cached) => 
      cached || {
        sentiment: 'neutral' as const,
        confidence: 0,
        summary: LOCAL_TESTING_DISABLE_GEMINI 
          ? 'Gemini API disabled - enable to analyze this article'
          : 'API key not configured'
      }
    );
  }

  // Step 4: Gemini is enabled - analyze only uncached articles
  if (uncachedArticles.length > 0) {
    console.log(`🤖 PARTIAL ANALYSIS: Analyzing ${uncachedArticles.length} uncached articles`);
    console.log(`   ✅ Using Cache: ${cacheStats.hits} articles`);
    console.log(`   🔍 Analyzing: ${uncachedArticles.length} articles`);
    console.log(`   ⚡ Model: gemini-1.5-flash`);

    // Check bulk content cache first (for the uncached articles only)
    const uncachedArticleList = uncachedArticles.map(item => item.article);
    const contentKey = generateContentHash(uncachedArticleList);
    const now = Date.now();
    const bulkCached = sentimentCache.get(contentKey);
    
    let newSentiments: Array<{
      sentiment: 'positive' | 'negative' | 'neutral';
      confidence: number;
      summary: string;
    }> = [];

    if (bulkCached && (now - bulkCached.timestamp) < SENTIMENT_CACHE_DURATION) {
      console.log(`🎯 BULK CACHE HIT: Found cached analysis for uncached article group`);
      console.log(`   📊 Cache Key: ${contentKey}`);
      console.log(`   ⏰ Cache Age: ${Math.round((now - bulkCached.timestamp) / 1000)}s`);
      newSentiments = bulkCached.data;
    } else {
      // Need to run API analysis for uncached articles
      const combinedText = uncachedArticleList.map((article, index) => 
        `Article ${index + 1}: "${article.title}" - ${article.summary}`
      ).join('\n\n');

      const prompt = `
        You are an expert financial analyst and portfolio manager. Analyze the sentiment of the following financial news articles and provide a detailed, concise, and polished analysis:
        1. Individual sentiment analysis for each article (positive, negative, or neutral)
        2. Confidence score (0-1) for each article based on clarity of sentiment indicators
        3. Brief summary for each article highlighting key market-moving information
        4. Consider impact on stock prices, investor confidence, and market trends and provide a recommendation for the stock market.
        
        Articles:
        ${combinedText}
        
        Please respond in JSON format as an array:
        [
          {
            "sentiment": "positive|negative|neutral",
            "confidence": 0.85,
            "summary": "Brief summary focusing on market impact and key financial insights"
          },
          // ... one object for each article in the same order
        ]
      `;

      try {
        console.log(`🤖 API CALL: Making Gemini API request for ${uncachedArticleList.length} articles`);
        console.log(`   📊 Cache Key: ${contentKey} (new)`);
        console.log(`   📝 Prompt Length: ${prompt.length} characters`);
        
        // Track the API call
        trackApiCall();
        const startTime = Date.now();
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const apiDuration = Date.now() - startTime;
        
        // Estimate tokens used (rough calculation: ~4 chars per token)
        const estimatedTokens = Math.round((prompt.length + text.length) / 4);
        
        console.log(`✅ API SUCCESS: Gemini responded in ${apiDuration}ms`);
        console.log(`   📤 Response Length: ${text.length} characters`);
        console.log(`   🔢 Estimated Tokens: ${estimatedTokens}`);
        
        // Track successful API call
        trackApiResult(true, null, estimatedTokens);
        
        // Clean the response and parse JSON
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const sentimentResults = JSON.parse(cleanedText);
        
        // Ensure we have the right number of results
        const results = Array.isArray(sentimentResults) ? sentimentResults : [];
        newSentiments = uncachedArticleList.map((_, index) => 
          results[index] || {
            sentiment: 'neutral' as const,
            confidence: 0,
            summary: 'Unable to analyze sentiment'
          }
        );

        // Cache the bulk results
        sentimentCache.set(contentKey, {
          timestamp: now,
          data: newSentiments
        });
        
        console.log(`💾 BULK CACHE STORED: New analysis cached for article group`);
        console.log(`   📊 Cache Key: ${contentKey}`);
        console.log(`   ⏰ Cache Duration: ${SENTIMENT_CACHE_DURATION / 60000} min`);
        
        // Log current usage stats after successful API call
        logUsageStats();

      } catch (error) {
        console.error(`❌ API ERROR: Gemini sentiment analysis failed`);
        console.error(`   📊 Cache Key: ${contentKey}`);
        console.error(`   📰 Articles: ${uncachedArticleList.length} articles`);
        console.error(`   ⚠️  Error:`, error);
        
        // Track failed API call
        trackApiResult(false, error);
        logUsageStats();
        
        // Fallback to neutral for failed articles
        newSentiments = uncachedArticleList.map(() => ({
          sentiment: 'neutral' as const,
          confidence: 0,
          summary: 'Unable to analyze sentiment due to API error'
        }));
      }
    }

    // Step 5: Cache the new individual article sentiments
    if (newSentiments.length > 0) {
      console.log(`💾 INDIVIDUAL CACHE: Storing ${newSentiments.length} new article sentiments`);
      cacheArticleSentiments(uncachedArticleList, newSentiments);
    }

    // Step 6: Combine cached and new results in correct order
    const finalResults: Array<{
      sentiment: 'positive' | 'negative' | 'neutral';
      confidence: number;
      summary: string;
    }> = [];

    let newSentimentIndex = 0;
    for (let i = 0; i < articles.length; i++) {
      if (cachedResults[i]) {
        // Use cached result
        finalResults[i] = cachedResults[i]!;
      } else {
        // Use new sentiment result
        finalResults[i] = newSentiments[newSentimentIndex];
        newSentimentIndex++;
      }
    }

    console.log(`✅ SENTIMENT ANALYSIS COMPLETE:`);
    console.log(`   📊 Total Results: ${finalResults.length}`);
    console.log(`   💾 From Cache: ${cacheStats.hits}`);
    console.log(`   🆕 Newly Analyzed: ${newSentiments.length}`);
    console.log(`   📈 Cache Coverage: ${((cacheStats.hits / articles.length) * 100).toFixed(1)}%`);

    return finalResults;
  }

  // Step 7: Fallback - should never reach here, but just in case
  console.log(`⚠️ FALLBACK: Unexpected state - returning neutral sentiments`);
  return articles.map(() => ({
    sentiment: 'neutral' as const,
    confidence: 0,
    summary: 'Unexpected error in sentiment analysis'
  }));
}

export function calculateOverallSentiment(articles: Array<{
  sentiment?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
  };
}>): {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  summary: string;
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
} {
  const validSentiments = articles
    .map(a => a.sentiment)
    .filter(Boolean) as Array<{
      sentiment: 'positive' | 'negative' | 'neutral';
      confidence: number;
      summary: string;
    }>;

  if (validSentiments.length === 0) {
    return {
      overallSentiment: 'neutral',
      confidence: 0,
      summary: 'No sentiment data available',
      breakdown: { positive: 0, negative: 0, neutral: 0 }
    };
  }

  // Count sentiments
  const breakdown = validSentiments.reduce((acc, sentiment) => {
    acc[sentiment.sentiment]++;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  // Calculate weighted scores based on confidence
  const weightedScores = validSentiments.reduce((acc, sentiment) => {
    const weight = sentiment.confidence;
    if (sentiment.sentiment === 'positive') acc.positive += weight;
    else if (sentiment.sentiment === 'negative') acc.negative += weight;
    else acc.neutral += weight;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  // Determine overall sentiment
  const totalWeight = Object.values(weightedScores).reduce((sum, val) => sum + val, 0);
  const avgConfidence = validSentiments.reduce((sum, s) => sum + s.confidence, 0) / validSentiments.length;

  let overallSentiment: 'positive' | 'negative' | 'neutral';
  let confidence: number;

  if (weightedScores.positive > weightedScores.negative && weightedScores.positive > weightedScores.neutral) {
    overallSentiment = 'positive';
    confidence = Math.min(0.95, (weightedScores.positive / totalWeight) * avgConfidence);
  } else if (weightedScores.negative > weightedScores.positive && weightedScores.negative > weightedScores.neutral) {
    overallSentiment = 'negative';
    confidence = Math.min(0.95, (weightedScores.negative / totalWeight) * avgConfidence);
  } else {
    overallSentiment = 'neutral';
    confidence = Math.min(0.95, Math.max(weightedScores.neutral / totalWeight, 0.3) * avgConfidence);
  }

  // Generate summary
  const dominantSentiment = Object.entries(breakdown)
    .sort(([,a], [,b]) => b - a)[0][0];
  
  const summary = `Market sentiment appears ${overallSentiment} based on ${validSentiments.length} articles. ` +
    `Breakdown: ${breakdown.positive} positive, ${breakdown.negative} negative, ${breakdown.neutral} neutral. ` +
    `${dominantSentiment === 'positive' ? 'Bullish indicators dominate.' : 
      dominantSentiment === 'negative' ? 'Bearish concerns present.' : 'Mixed signals in the market.'}`;

  return {
    overallSentiment,
    confidence,
    summary,
    breakdown
  };
}

export async function generateStockRecommendations(
  query: string,
  stockData: unknown[],
  newsData: unknown[]
): Promise<{
  recommendations: Array<{
    symbol: string;
    reason: string;
    confidence: number;
    action: 'buy' | 'sell' | 'hold';
  }>;
  analysis: string;
}> {
  if (!model) {
    return {
      recommendations: [],
      analysis: LOCAL_TESTING_DISABLE_GEMINI 
        ? 'Gemini API disabled for local testing. Stock recommendations unavailable while testing locally. Set LOCAL_TESTING_DISABLE_GEMINI to false to re-enable AI analysis.'
        : 'Google AI API key not configured'
    };
  }
  const prompt = `
    You are a professional financial analyst. Based on the user query: "${query}"
    
    Stock Data: ${JSON.stringify(stockData.slice(0, 10))}
    Recent News: ${JSON.stringify(newsData.slice(0, 5))}
    
    Analyze the data and provide investment recommendations considering:
    - Current stock performance and trends
    - Market capitalization and valuation metrics
    - Recent news sentiment and market conditions
    - Risk factors and potential catalysts
    
    Provide stock recommendations in JSON format:
    {
      "recommendations": [
        {
          "symbol": "AAPL",
          "reason": "Strong fundamentals, positive earnings growth, and favorable market position",
          "confidence": 0.85,
          "action": "buy"
        }
      ],
      "analysis": "Comprehensive market analysis with reasoning for recommendations"
    }
    
    Note: Always include risk warnings and remind users this is for educational purposes only.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw Gemini response:', text.substring(0, 200) + '...');
    
    // Enhanced text cleaning for better JSON parsing
    let cleanedText = text
      .replace(/```json|```/g, '')  // Remove code block markers
      .replace(/^[^{]*/, '')        // Remove everything before first {
      .replace(/[^}]*$/, '}')       // Remove everything after last }
      .trim();
    
    // If no valid JSON structure found, try to extract from the response
    if (!cleanedText.startsWith('{')) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      } else {
        // Fallback: create structured response from text
        return {
          recommendations: [],
          analysis: text.replace(/```json|```/g, '').trim()
        };
      }
    }
    
    console.log('Cleaned text for parsing:', cleanedText.substring(0, 200) + '...');
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate the response structure
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      parsed.recommendations = [];
    }
    if (!parsed.analysis) {
      parsed.analysis = text.replace(/```json|```/g, '').trim();
    }
    
    return parsed;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    console.error('Failed text:', error instanceof Error ? error.message : String(error));
    return {
      recommendations: [],
      analysis: 'Unable to generate recommendations at this time. Please try again.'
    };
  }
} 