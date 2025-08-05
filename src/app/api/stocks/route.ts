import { NextResponse } from 'next/server';

// Stock data interface
interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

// Popular S&P 500 stocks to track
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'HD', name: 'Home Depot Inc.' },
  { symbol: 'DIS', name: 'Walt Disney Co.' },
  // Additional S&P 500 stocks
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'INTC', name: 'Intel Corp.' },
  { symbol: 'CMCSA', name: 'Comcast Corp.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'ABT', name: 'Abbott Laboratories' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corp.' },
  { symbol: 'ACN', name: 'Accenture plc' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.' },
  { symbol: 'KO', name: 'Coca-Cola Co.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.' },
  { symbol: 'LLY', name: 'Eli Lilly and Co.' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.' },
  { symbol: 'CVX', name: 'Chevron Corp.' },
  { symbol: 'MDT', name: 'Medtronic plc' },
  { symbol: 'QCOM', name: 'Qualcomm Inc.' },
  { symbol: 'BA', name: 'Boeing Co.' },
  { symbol: 'NEE', name: 'NextEra Energy Inc.' },
  { symbol: 'IBM', name: 'International Business Machines Corp.' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.' },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.' },
  { symbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'CAT', name: 'Caterpillar Inc.' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.' },
  { symbol: 'SPGI', name: 'S&P Global Inc.' },
  { symbol: 'BLK', name: 'BlackRock Inc.' },
  { symbol: 'AXP', name: 'American Express Co.' },
  { symbol: 'DE', name: 'Deere & Co.' }
];

// Enhanced fallback data with more realistic stock prices
const FALLBACK_STOCKS: StockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 191.45, change: 2.51, changePercent: 1.33, volume: 45000000 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.55, change: -1.23, changePercent: -0.29, volume: 28000000 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 139.69, change: 1.87, changePercent: 1.36, volume: 22000000 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.31, change: 0.94, changePercent: 0.61, volume: 35000000 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.98, change: -3.45, changePercent: -1.37, volume: 41000000 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 504.20, change: 8.12, changePercent: 1.64, volume: 18000000 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 15.67, changePercent: 1.82, volume: 52000000 },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', price: 432.15, change: -2.33, changePercent: -0.54, volume: 3200000 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 578.92, change: 4.21, changePercent: 0.73, volume: 2800000 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 162.44, change: -0.85, changePercent: -0.52, volume: 6100000 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 179.83, change: 2.15, changePercent: 1.21, volume: 12500000 },
  { symbol: 'V', name: 'Visa Inc.', price: 267.91, change: 1.44, changePercent: 0.54, volume: 4200000 },
  { symbol: 'PG', name: 'Procter & Gamble Co.', price: 157.22, change: -1.12, changePercent: -0.71, volume: 5800000 },
  { symbol: 'HD', name: 'Home Depot Inc.', price: 341.78, change: 3.33, changePercent: 0.98, volume: 3900000 },
  { symbol: 'DIS', name: 'Walt Disney Co.', price: 95.41, change: -0.67, changePercent: -0.70, volume: 8700000 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 489.33, change: 7.24, changePercent: 1.50, volume: 4100000 },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 521.79, change: -2.45, changePercent: -0.47, volume: 2100000 },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', price: 58.67, change: 1.23, changePercent: 2.14, volume: 14500000 },
  { symbol: 'INTC', name: 'Intel Corp.', price: 23.45, change: -0.34, changePercent: -1.43, volume: 47000000 },
  { symbol: 'CMCSA', name: 'Comcast Corp.', price: 39.87, change: 0.56, changePercent: 1.42, volume: 18900000 },
  { symbol: 'CRM', name: 'Salesforce Inc.', price: 274.12, change: 4.67, changePercent: 1.73, volume: 5200000 },
  { symbol: 'ABT', name: 'Abbott Laboratories', price: 113.45, change: 1.23, changePercent: 1.10, volume: 4600000 },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', price: 142.76, change: 3.45, changePercent: 2.48, volume: 34000000 },
  { symbol: 'ORCL', name: 'Oracle Corp.', price: 178.90, change: -1.23, changePercent: -0.68, volume: 31000000 },
  { symbol: 'ACN', name: 'Accenture plc', price: 372.45, change: 2.67, changePercent: 0.72, volume: 1800000 },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', price: 567.89, change: 3.45, changePercent: 0.61, volume: 1200000 },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', price: 101.23, change: -0.45, changePercent: -0.44, volume: 8900000 },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', price: 42.67, change: 0.23, changePercent: 0.54, volume: 16700000 },
  { symbol: 'KO', name: 'Coca-Cola Co.', price: 63.45, change: 0.67, changePercent: 1.07, volume: 12400000 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 166.78, change: 1.23, changePercent: 0.74, volume: 7800000 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1342.56, change: 12.34, changePercent: 0.93, volume: 1900000 },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', price: 178.34, change: -1.23, changePercent: -0.68, volume: 5200000 },
  { symbol: 'LLY', name: 'Eli Lilly and Co.', price: 789.45, change: 8.67, changePercent: 1.11, volume: 2100000 },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 98.76, change: 0.45, changePercent: 0.46, volume: 8900000 },
  { symbol: 'CVX', name: 'Chevron Corp.', price: 156.78, change: 1.23, changePercent: 0.79, volume: 6700000 },
  { symbol: 'MDT', name: 'Medtronic plc', price: 89.45, change: -0.67, changePercent: -0.74, volume: 5200000 },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', price: 145.67, change: 2.34, changePercent: 1.63, volume: 7800000 },
  { symbol: 'BA', name: 'Boeing Co.', price: 234.56, change: -3.45, changePercent: -1.45, volume: 8900000 },
  { symbol: 'NEE', name: 'NextEra Energy Inc.', price: 67.89, change: 0.45, changePercent: 0.67, volume: 3400000 },
  { symbol: 'IBM', name: 'International Business Machines Corp.', price: 178.90, change: 1.23, changePercent: 0.69, volume: 4200000 },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', price: 789.45, change: 5.67, changePercent: 0.72, volume: 1200000 },
  { symbol: 'UPS', name: 'United Parcel Service Inc.', price: 156.78, change: -1.23, changePercent: -0.78, volume: 3400000 },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.', price: 234.56, change: 2.34, changePercent: 1.01, volume: 2800000 },
  { symbol: 'T', name: 'AT&T Inc.', price: 23.45, change: 0.12, changePercent: 0.51, volume: 23400000 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', price: 345.67, change: 3.45, changePercent: 1.01, volume: 2100000 },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', price: 456.78, change: 3.45, changePercent: 0.76, volume: 2100000 },
  { symbol: 'SPGI', name: 'S&P Global Inc.', price: 445.67, change: 2.34, changePercent: 0.53, volume: 1600000 },
  { symbol: 'BLK', name: 'BlackRock Inc.', price: 823.45, change: 5.67, changePercent: 0.69, volume: 520000 },
  { symbol: 'AXP', name: 'American Express Co.', price: 234.56, change: 1.89, changePercent: 0.81, volume: 2800000 },
  { symbol: 'DE', name: 'Deere & Co.', price: 398.45, change: 3.45, changePercent: 0.87, volume: 1900000 }
];

// Cache for API responses
let cachedData: { stocks: StockData[]; timestamp: number; cacheKey?: string } | null = null;
const CACHE_DURATION = parseInt(process.env.STOCK_CACHE_DURATION_SECONDS || '300') * 1000; // 5 minutes default

async function fetchAllStocks(limit?: number): Promise<StockData[]> {
  const enableRealApis = process.env.ENABLE_REAL_APIS !== 'false';
  
  if (!enableRealApis) {
    console.log('📊 Using fallback stock data (real APIs disabled)');
    return FALLBACK_STOCKS;
  }

  console.log('📊 Fetching real stock data from Yahoo Finance...');
  
  try {
    // Import Yahoo Finance functions with proper error handling
    let financialDataModule;
    try {
      financialDataModule = await import('@/lib/financial-data');
    } catch (importError) {
      console.error('❌ Failed to import financial-data module:', importError);
      return FALLBACK_STOCKS;
    }
    
    const { getPopularStocks, getAllSP500Stocks, configureStockFetching } = financialDataModule;
    
    // Configure fetching based on limit
    if (limit && configureStockFetching) {
      configureStockFetching({ 
        limit: Math.min(limit, 500), // Cap at 500 for safety
        batchSize: 10, // Smaller batches for reliability
        batchDelay: 100 // Short delay between batches
      });
    }
    
    // Use appropriate function based on requested limit
    let stocks: any[];
    if (!limit || limit <= 100) {
      stocks = await getPopularStocks();
    } else {
      // For larger requests, use S&P 500 function
      stocks = await getAllSP500Stocks();
    }
    
    console.log(`✅ Successfully fetched ${stocks.length} stocks from Yahoo Finance`);
    return stocks;
    
  } catch (error) {
    console.error('❌ Error fetching stocks from Yahoo Finance:', error);
    console.log('📊 Falling back to static data');
    return FALLBACK_STOCKS;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const updateOnly = searchParams.get('update_only') === 'true';
    
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const offset = offsetParam ? parseInt(offsetParam) : 0;
    
    console.log('📊 Stocks API called', { searchQuery, limit, offset });
    
    // Handle search requests
    if (searchQuery) {
      console.log(`🔍 Searching for "${searchQuery}"`);
      
      try {
        // Import search function from financial-data
        const { getStockQuote } = await import('@/lib/financial-data');
        
        // Try to get specific stock quote
        const stockQuote = await getStockQuote(searchQuery.toUpperCase());
        
        if (stockQuote) {
          console.log(`✅ Found specific stock: ${searchQuery}`);
          return NextResponse.json([stockQuote], {
            headers: {
              'Content-Type': 'application/json',
              'X-Data-Source': 'yahoo-search',
              'X-Stock-Count': '1',
              'X-Search-Query': searchQuery
            }
          });
        } else {
          // Fallback to searching in cached data
          const searchTerm = searchQuery.toUpperCase();
          const searchResults = FALLBACK_STOCKS.filter(stock => 
            stock.symbol.includes(searchTerm) || 
            stock.name.toUpperCase().includes(searchTerm)
          );
          
          console.log(`🔍 Fallback search returned ${searchResults.length} results`);
          
          return NextResponse.json(searchResults, {
            headers: {
              'Content-Type': 'application/json',
              'X-Data-Source': 'fallback-search',
              'X-Stock-Count': searchResults.length.toString(),
              'X-Search-Query': searchQuery
            }
          });
        }
      } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json([], {
          headers: {
            'Content-Type': 'application/json',
            'X-Data-Source': 'error',
            'X-Stock-Count': '0',
            'X-Search-Query': searchQuery
          }
        });
      }
    }
    
    // Check cache first
    const cacheKey = `stocks-${limit}-${offset}`;
    const now = Date.now();
    
    if (cachedData && 
        cachedData.cacheKey === cacheKey && 
        (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log('📊 Returning cached stock data');
      return NextResponse.json(cachedData.stocks.slice(offset, offset + (limit || cachedData.stocks.length)), {
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Source': 'cache',
          'X-Stock-Count': cachedData.stocks.length.toString(),
          'X-Cache-Age': Math.floor((now - cachedData.timestamp) / 1000).toString()
        }
      });
    }
    
    // Fetch fresh data
    console.log('📊 Fetching fresh stock data...');
    const stocks = await fetchAllStocks(limit);
    
    // Update cache
    cachedData = {
      stocks,
      timestamp: now,
      cacheKey
    };
    
    // Apply pagination
    const paginatedStocks = stocks.slice(offset, offset + (limit || stocks.length));
    
    console.log(`✅ Returning ${paginatedStocks.length} stocks (${stocks.length} total)`);
    
    return NextResponse.json(paginatedStocks, {
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'yahoo-fresh',
        'X-Stock-Count': stocks.length.toString(),
        'X-Cache-Age': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ Stocks API error:', error);
    
    // Get limit from URL params for error response
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 50;
    
    // Return fallback data on error
    return NextResponse.json(FALLBACK_STOCKS.slice(0, limit), {
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'fallback-error',
        'X-Stock-Count': FALLBACK_STOCKS.length.toString(),
        'X-Error': error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
} 