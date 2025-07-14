import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export { model };

// Enhanced caching for sentiment analysis with content-based keys
const sentimentCache = new Map<string, { timestamp: number; data: any }>();
const SENTIMENT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (extended to reduce API calls)

// Cleanup old cache entries to prevent memory leaks
function cleanupSentimentCache() {
  const now = Date.now();
  for (const [key, value] of sentimentCache.entries()) {
    if (now - value.timestamp > SENTIMENT_CACHE_DURATION) {
      sentimentCache.delete(key);
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

export async function generateFinancialAnalysis(prompt: string): Promise<string> {
  if (!model) {
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
      summary: 'API key not configured'
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
  if (!model) {
    return articles.map(() => ({
      sentiment: 'neutral' as const,
      confidence: 0,
      summary: 'API key not configured'
    }));
  }

  // Check content-based cache
  const contentKey = generateContentHash(articles);
  const now = Date.now();
  const cached = sentimentCache.get(contentKey);
  
  if (cached && (now - cached.timestamp) < SENTIMENT_CACHE_DURATION) {
    console.log(`Using cached sentiment analysis for key: ${contentKey} (${Math.round((now - cached.timestamp) / 1000)}s old)`);
    return cached.data;
  }

  // Combine all articles into a single context
  const combinedText = articles.map((article, index) => 
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response and parse JSON
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const sentimentResults = JSON.parse(cleanedText);
    
    // Ensure we have the right number of results
    const results = Array.isArray(sentimentResults) ? sentimentResults : [];
    const paddedResults = articles.map((_, index) => 
      results[index] || {
        sentiment: 'neutral' as const,
        confidence: 0,
        summary: 'Unable to analyze sentiment'
      }
    );

    // Cache the results with content-based key
    sentimentCache.set(contentKey, {
      timestamp: now,
      data: paddedResults
    });
    
    console.log(`Cached new sentiment analysis for key: ${contentKey}`);

    return paddedResults;
  } catch (error) {
    console.error('Error analyzing bulk sentiment:', error);
    return articles.map(() => ({
      sentiment: 'neutral' as const,
      confidence: 0,
      summary: 'Unable to analyze sentiment'
    }));
  }
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
      analysis: 'Google AI API key not configured'
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