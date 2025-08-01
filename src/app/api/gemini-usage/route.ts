import { NextRequest, NextResponse } from 'next/server';
import { getUsageStats, logUsageStats } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  try {
    // Get current usage statistics
    const stats = getUsageStats();
    
    // Also log to server console for debugging
    console.log('\n🔍 GEMINI USAGE CHECK REQUESTED:');
    logUsageStats();
    
    return NextResponse.json({
      usage: stats,
      caching: {
        articleCache: {
          size: stats.cacheStats.articleCacheSize,
          description: 'Individual articles with cached sentiment (24hr duration)'
        },
        bulkCache: {
          size: stats.cacheStats.bulkCacheSize,
          description: 'Bulk analysis results (60min duration)'
        },
        hitRate: stats.cacheStats.cacheHitRate,
        effectiveness: stats.cacheStats.articleCacheSize > 0 
          ? 'Cache is working - previous sentiment analyses are preserved'
          : 'No cached sentiments yet - run sentiment analysis to build cache'
      },
      status: 'success',
      timestamp: new Date().toISOString(),
      recommendations: {
        dailyQuotaStatus: stats.todaysCalls >= 45 ? 'critical' : stats.todaysCalls >= 30 ? 'warning' : 'good',
        message: stats.todaysCalls >= 45 
          ? '🚨 Very close to daily limit! Consider enabling LOCAL_TESTING_DISABLE_GEMINI in gemini.ts'
          : stats.todaysCalls >= 30 
          ? '⚠️ Approaching daily limit. Monitor usage carefully.'
          : '✅ Usage is within safe limits',
        cacheAdvice: stats.cacheStats.articleCacheSize > 20
          ? '💾 Great cache coverage! Most articles should use cached sentiment.'
          : stats.cacheStats.articleCacheSize > 0
          ? '💾 Building cache coverage. More articles will be cached over time.'
          : '💾 No cache yet. First sentiment analysis will start building cache.'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error getting Gemini usage stats:', error);
    return NextResponse.json({
      error: 'Unable to retrieve usage statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 