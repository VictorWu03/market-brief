import { NextRequest, NextResponse } from 'next/server';
import { serverDataService } from '@/lib/server-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const stats = serverDataService.getCacheStats();
        const cachedData = serverDataService.getCachedData();
        
        return NextResponse.json({
          status: 'running',
          cache: {
            stockCount: stats.stockCount,
            newsCount: stats.newsCount,
            lastUpdated: stats.lastUpdated,
            nextUpdateAt: stats.nextUpdateAt,
            hasSentiment: stats.hasSentiment
          },
          data: {
            stocks: cachedData.stocks.length > 0 ? cachedData.stocks.slice(0, 3) : [], // Sample data
            news: cachedData.news.length > 0 ? cachedData.news.slice(0, 2) : [], // Sample data
            overallSentiment: cachedData.overallSentiment
          }
        });

      case 'start':
        serverDataService.startPeriodicUpdates();
        return NextResponse.json({ 
          message: 'Data service started successfully',
          status: 'started'
        });

      case 'stop':
        serverDataService.stopPeriodicUpdates();
        return NextResponse.json({ 
          message: 'Data service stopped successfully',
          status: 'stopped'
        });

      default:
        return NextResponse.json({
          message: 'Data Service Admin API',
          availableActions: ['status', 'start', 'stop'],
          usage: {
            status: '/api/admin/data-service?action=status',
            start: '/api/admin/data-service?action=start',
            stop: '/api/admin/data-service?action=stop',
            updateStocks: 'POST /api/admin/data-service { "action": "update-stocks" }',
            updateNews: 'POST /api/admin/data-service { "action": "update-news" }',
            updateAll: 'POST /api/admin/data-service { "action": "update-all" }'
          }
        });
    }
  } catch (error) {
    console.error('Error in data service admin API:', error);
    return NextResponse.json(
      { error: 'Failed to execute admin action' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update-stocks':
        console.log('🔄 Manual stock update triggered');
        await serverDataService.updateStocks();
        const stockStats = serverDataService.getCacheStats();
        return NextResponse.json({ 
          message: 'Stock data updated successfully',
          stockCount: stockStats.stockCount,
          lastUpdated: stockStats.lastUpdated
        });

      case 'update-news':
        console.log('🔄 Manual news update triggered');
        await serverDataService.updateNews();
        const newsStats = serverDataService.getCacheStats();
        return NextResponse.json({ 
          message: 'News data updated successfully',
          newsCount: newsStats.newsCount,
          lastUpdated: newsStats.lastUpdated,
          hasSentiment: newsStats.hasSentiment
        });

      case 'update-all':
        console.log('🔄 Manual full update triggered');
        await serverDataService.updateAll();
        const allStats = serverDataService.getCacheStats();
        return NextResponse.json({ 
          message: 'All data updated successfully',
          stockCount: allStats.stockCount,
          newsCount: allStats.newsCount,
          lastUpdated: allStats.lastUpdated,
          hasSentiment: allStats.hasSentiment
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: update-stocks, update-news, or update-all' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in data service admin POST:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute admin action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 