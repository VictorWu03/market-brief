import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalData } from '@/lib/financial-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') as '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max' || '1y';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const historicalData = await getHistoricalData(symbol, period);
    
    if (historicalData.length === 0) {
      return NextResponse.json(
        { error: 'No historical data found for this symbol' },
        { status: 404 }
      );
    }

    return NextResponse.json(historicalData);

  } catch (error) {
    console.error('Error in historical data API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
} 