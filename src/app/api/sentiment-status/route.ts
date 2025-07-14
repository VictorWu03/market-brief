import { NextResponse } from 'next/server';

// This needs to match the cache variables in gemini.ts
// We'll import them or recreate the logic here
const SENTIMENT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (extended to reduce API calls)

// Since we can't directly import the cache variables from gemini.ts due to module boundaries,
// we'll create a simple status check
export async function GET() {
  try {
    // This is a simple way to check if we're likely to use cached results
    // In a production app, you might want to use a shared cache like Redis
    const response = {
      rateLimitActive: true,
      cacheDurationMs: SENTIMENT_CACHE_DURATION,
      cacheDurationMinutes: SENTIMENT_CACHE_DURATION / (60 * 1000),
      message: "Sentiment analysis is rate-limited to once every 10 minutes with content-based caching to avoid overwhelming the AI API and reduce costs",
      nextUpdateEstimate: "Updates occur when new sentiment analysis is requested after the cache expires"
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in sentiment status API:', error);
    return NextResponse.json(
      { error: 'Failed to get sentiment status' },
      { status: 500 }
    );
  }
} 