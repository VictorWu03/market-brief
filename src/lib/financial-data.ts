import yahooFinance from 'yahoo-finance2';

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  name: string;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Interface for S&P 500 constituent data
interface SP500Constituent {
  Symbol: string;
  Name: string;
  Sector?: string;
}

// Cache for S&P 500 symbols to avoid frequent API calls
let sp500SymbolsCache: string[] = [];
let sp500CacheTimestamp: number = 0;
const SP500_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback popular stocks in case S&P 500 fetch fails
const FALLBACK_POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'NVDA', 'META', 'NFLX', 'AMD', 'BABA',
  'ORCL', 'CRM', 'V', 'JPM', 'UNH',
  'JNJ', 'WMT', 'PG', 'HD', 'DIS',
  'ADBE', 'PYPL', 'INTC', 'CMCSA', 'ABT',
  'TMO', 'MRK', 'VZ', 'KO', 'AVGO',
  'TXN', 'LLY', 'XOM', 'CVX', 'MDT',
  'QCOM', 'BA', 'NEE', 'IBM', 'COST',
  'UPS', 'LOW', 'T', 'CAT', 'GS',
  'SPGI', 'BLK', 'AXP', 'DE', 'MA',
  'UNP', 'RTX', 'HON', 'LMT', 'SBUX',
  'GILD', 'AMGN', 'ADI', 'ISRG', 'REGN',
  'VRTX', 'KLAC', 'PANW', 'CDNS', 'MU',
  'SNPS', 'MCHP', 'ABMD', 'CPRT', 'IDXX',
  'BIIB', 'ALGN', 'DXCM', 'WDAY', 'FTNT',
  'CTAS', 'FAST', 'PAYX', 'ROST', 'ODFL',
  'BRO', 'POOL', 'CHD', 'HSIC', 'WAT',
  'TROW', 'NDSN', 'SIVB', 'ZBRA', 'CTSH',
  'VRSN', 'ANSS', 'MTCH', 'WLTW', 'TFX',
  'BR', 'CBOE', 'CE', 'CNC', 'CTLT',
  'DRE', 'EVRG', 'EXR', 'FRT', 'HOLX',
  'INCY', 'IPG', 'JKHY', 'KEY', 'LNT',
  'MKTX', 'MPWR', 'NTRS', 'PFG', 'PKI',
  'PRU', 'RMD', 'ROL', 'SBNY', 'SJM',
  'SWKS', 'TEL', 'TMUS', 'UAL', 'VNO',
  'WRB', 'XEL', 'ZION', 'AAL', 'ALK',
  'ALLE', 'AOS', 'BEN', 'BF.B', 'CINF',
  'CLX', 'CMA', 'COO', 'CPB', 'DOV',
  'DTE', 'DUK', 'ETR', 'EXC', 'FITB',
  'FLT', 'FRC', 'GPC', 'HAS', 'HBAN',
  'HRL', 'HSY', 'HWM', 'IEX', 'IRM',
  'JNPR', 'K', 'KIM', 'KSU', 'LEG',
  'LH', 'LIN', 'LNC', 'LUV', 'MAS',
  'MCD', 'MCO', 'MET', 'MGM', 'MKC',
  'MMC', 'MNST', 'MOS', 'MPC', 'MSI',
  'MTB', 'NDAQ', 'NOC', 'NRG', 'NTAP',
  'NUE', 'NWL', 'O', 'OMC', 'ORLY',
  'PCAR', 'PEG', 'PEP', 'PFE', 'PNC',
  'PNR', 'PPG', 'PPL', 'PRGO', 'PSA',
  'PVH', 'PWR', 'RCL', 'RF', 'RHI',
  'RJF', 'RL', 'ROK', 'RSG', 'SJM',
  'SLB', 'SNA', 'SO', 'SPG', 'STT',
  'STX', 'SWK', 'SYF', 'SYK', 'TAP',
  'TDG', 'TGT', 'TJX', 'TMO', 'TRV',
  'TSCO', 'TTWO', 'TXT', 'UAL', 'UDR',
  'UHS', 'UNM', 'VFC', 'VTR', 'WAB',
  'WEC', 'WY', 'XRAY', 'XYL', 'YUM'
];

export async function getStockQuote(symbol: string): Promise<StockData | null> {
  try {
    // Add additional validation for symbol
    if (!symbol || symbol.trim() === '') {
      console.error('Invalid symbol provided:', symbol);
      return null;
    }
    
    const quote = await yahooFinance.quote(symbol);
    
    // Add null checks to prevent "Cannot read properties of null" errors
    if (!quote) {
      console.error(`Null quote received for ${symbol}`);
      return null;
    }
    
    // Add safe property access with fallbacks
    const safeQuote = quote as any;
    
    return {
      symbol: safeQuote.symbol || symbol,
      price: safeQuote.regularMarketPrice || 0,
      change: safeQuote.regularMarketChange || 0,
      changePercent: safeQuote.regularMarketChangePercent || 0,
      volume: safeQuote.regularMarketVolume || 0,
      marketCap: safeQuote.marketCap,
      peRatio: safeQuote.trailingPE,
      dividendYield: safeQuote.dividendYield,
      fiftyTwoWeekHigh: safeQuote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: safeQuote.fiftyTwoWeekLow,
      name: safeQuote.longName || safeQuote.shortName || symbol
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

export async function getMultipleStockQuotes(symbols: string[]): Promise<StockData[]> {
  // Filter out invalid symbols first
  const validSymbols = symbols.filter(symbol => symbol && symbol.trim() !== '');
  
  if (validSymbols.length === 0) {
    console.warn('No valid symbols provided to getMultipleStockQuotes');
    return [];
  }
  
  const quotes = await Promise.all(
    validSymbols.map(symbol => getStockQuote(symbol))
  );
  
  return quotes.filter((quote): quote is StockData => quote !== null);
}

export async function getHistoricalData(
  symbol: string,
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max' = '1y'
): Promise<HistoricalData[]> {
  try {
    const endDate = new Date();
    const startDate = getStartDate(period);
    
    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    return historical.map((item: any) => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      volume: item.volume || 0
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '5d':
      return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    case '1mo':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3mo':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6mo':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case '2y':
      return new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    case '5y':
      return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    case '10y':
      return new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1);
    case 'max':
      return new Date(1970, 0, 1);
    default:
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
}

export async function searchStocks(query: string): Promise<StockData[]> {
  try {
    const searchResults = await yahooFinance.search(query);
    const symbols = (searchResults as any).quotes
      ?.filter((quote: any) => quote.typeDisp === 'Equity')
      ?.slice(0, 10)
      ?.map((quote: any) => quote.symbol) || [];
    
    return await getMultipleStockQuotes(symbols);
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}

/**
 * Fetch current S&P 500 constituent symbols from public API
 */
export async function fetchSP500Symbols(): Promise<string[]> {
  try {
    // Check cache first
    const now = Date.now();
    if (sp500SymbolsCache.length > 0 && now - sp500CacheTimestamp < SP500_CACHE_DURATION) {
      console.log('Using cached S&P 500 symbols');
      return sp500SymbolsCache;
    }

    console.log('Fetching fresh S&P 500 symbols...');
    
    // Use a comprehensive S&P 500 list instead of unreliable external API
    const SP500_SYMBOLS = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B', 'UNH', 'JNJ',
      'JPM', 'V', 'PG', 'HD', 'DIS', 'NFLX', 'ADBE', 'PYPL', 'INTC', 'CMCSA',
      'CRM', 'ABT', 'AMD', 'ORCL', 'ACN', 'TMO', 'MRK', 'VZ', 'KO', 'WMT',
      'AVGO', 'TXN', 'LLY', 'XOM', 'CVX', 'MDT', 'QCOM', 'BA', 'NEE', 'IBM',
      'COST', 'UPS', 'LOW', 'T', 'CAT', 'GS', 'SPGI', 'BLK', 'AXP', 'DE',
      'MA', 'UNP', 'RTX', 'HON', 'LMT', 'SBUX', 'GILD', 'AMGN', 'ADI', 'ISRG',
      'REGN', 'VRTX', 'KLAC', 'PANW', 'CDNS', 'MU', 'SNPS', 'MCHP', 'ABMD', 'CPRT',
      'IDXX', 'BIIB', 'ALGN', 'DXCM', 'WDAY', 'FTNT', 'CTAS', 'FAST', 'PAYX', 'ROST',
      'ODFL', 'BRO', 'POOL', 'CHD', 'HSIC', 'WAT', 'TROW', 'NDSN', 'SIVB', 'ZBRA',
      'CTSH', 'VRSN', 'ANSS', 'MTCH', 'WLTW', 'TFX', 'BR', 'CBOE', 'CE', 'CNC',
      'CTLT', 'DRE', 'EVRG', 'EXR', 'FRT', 'HOLX', 'INCY', 'IPG', 'JKHY', 'KEY',
      'LNT', 'MKTX', 'MPWR', 'NTRS', 'PFG', 'PKI', 'PRU', 'RMD', 'ROL', 'SBNY',
      'SJM', 'SWKS', 'TEL', 'TMUS', 'UAL', 'VNO', 'WRB', 'XEL', 'ZION', 'AAL',
      'ALK', 'ALLE', 'AOS', 'BEN', 'BF.B', 'CINF', 'CLX', 'CMA', 'COO', 'CPB',
      'DOV', 'DTE', 'DUK', 'ETR', 'EXC', 'FITB', 'FLT', 'FRC', 'GPC', 'HAS',
      'HBAN', 'HRL', 'HSY', 'HWM', 'IEX', 'IRM', 'JNPR', 'K', 'KIM', 'KSU',
      'LEG', 'LH', 'LIN', 'LNC', 'LUV', 'MAS', 'MCD', 'MCO', 'MET', 'MGM',
      'MKC', 'MMC', 'MNST', 'MOS', 'MPC', 'MSI', 'MTB', 'NDAQ', 'NOC', 'NRG',
      'NTAP', 'NUE', 'NWL', 'O', 'OMC', 'ORLY', 'PCAR', 'PEG', 'PEP', 'PFE',
      'PNC', 'PNR', 'PPG', 'PPL', 'PRGO', 'PSA', 'PVH', 'PWR', 'RCL', 'RF',
      'RHI', 'RJF', 'RL', 'ROK', 'RSG', 'SJM', 'SLB', 'SNA', 'SO', 'SPG',
      'STT', 'STX', 'SWK', 'SYF', 'SYK', 'TAP', 'TDG', 'TGT', 'TJX', 'TMO',
      'TRV', 'TSCO', 'TTWO', 'TXT', 'UAL', 'UDR', 'UHS', 'UNM', 'VFC', 'VTR',
      'WAB', 'WEC', 'WY', 'XRAY', 'XYL', 'YUM', 'AAL', 'ALK', 'ALLE', 'AOS',
      'BEN', 'BF.B', 'CINF', 'CLX', 'CMA', 'COO', 'CPB', 'DOV', 'DTE', 'DUK',
      'ETR', 'EXC', 'FITB', 'FLT', 'FRC', 'GPC', 'HAS', 'HBAN', 'HRL', 'HSY',
      'HWM', 'IEX', 'IRM', 'JNPR', 'K', 'KIM', 'KSU', 'LEG', 'LH', 'LIN',
      'LNC', 'LUV', 'MAS', 'MCD', 'MCO', 'MET', 'MGM', 'MKC', 'MMC', 'MNST',
      'MOS', 'MPC', 'MSI', 'MTB', 'NDAQ', 'NOC', 'NRG', 'NTAP', 'NUE', 'NWL',
      'O', 'OMC', 'ORLY', 'PCAR', 'PEG', 'PEP', 'PFE', 'PNC', 'PNR', 'PPG',
      'PPL', 'PRGO', 'PSA', 'PVH', 'PWR', 'RCL', 'RF', 'RHI', 'RJF', 'RL',
      'ROK', 'RSG', 'SJM', 'SLB', 'SNA', 'SO', 'SPG', 'STT', 'STX', 'SWK',
      'SYF', 'SYK', 'TAP', 'TDG', 'TGT', 'TJX', 'TMO', 'TRV', 'TSCO', 'TTWO',
      'TXT', 'UAL', 'UDR', 'UHS', 'UNM', 'VFC', 'VTR', 'WAB', 'WEC', 'WY',
      'XRAY', 'XYL', 'YUM', 'AAL', 'ALK', 'ALLE', 'AOS', 'BEN', 'BF.B', 'CINF',
      'CLX', 'CMA', 'COO', 'CPB', 'DOV', 'DTE', 'DUK', 'ETR', 'EXC', 'FITB',
      'FLT', 'FRC', 'GPC', 'HAS', 'HBAN', 'HRL', 'HSY', 'HWM', 'IEX', 'IRM',
      'JNPR', 'K', 'KIM', 'KSU', 'LEG', 'LH', 'LIN', 'LNC', 'LUV', 'MAS',
      'MCD', 'MCO', 'MET', 'MGM', 'MKC', 'MMC', 'MNST', 'MOS', 'MPC', 'MSI',
      'MTB', 'NDAQ', 'NOC', 'NRG', 'NTAP', 'NUE', 'NWL', 'O', 'OMC', 'ORLY',
      'PCAR', 'PEG', 'PEP', 'PFE', 'PNC', 'PNR', 'PPG', 'PPL', 'PRGO', 'PSA',
      'PVH', 'PWR', 'RCL', 'RF', 'RHI', 'RJF', 'RL', 'ROK', 'RSG', 'SJM',
      'SLB', 'SNA', 'SO', 'SPG', 'STT', 'STX', 'SWK', 'SYF', 'SYK', 'TAP',
      'TDG', 'TGT', 'TJX', 'TMO', 'TRV', 'TSCO', 'TTWO', 'TXT', 'UAL', 'UDR',
      'UHS', 'UNM', 'VFC', 'VTR', 'WAB', 'WEC', 'WY', 'XRAY', 'XYL', 'YUM'
    ];
    
    // Update cache
    sp500SymbolsCache = SP500_SYMBOLS;
    sp500CacheTimestamp = now;
    
    console.log(`Using comprehensive S&P 500 symbols list: ${SP500_SYMBOLS.length} symbols`);
    return SP500_SYMBOLS;
    
  } catch (error) {
    console.error('Error fetching S&P 500 symbols:', error);
    console.log('Falling back to cached symbols or default list');
    
    // Return cached symbols if available, otherwise fallback list
    return sp500SymbolsCache.length > 0 ? sp500SymbolsCache : FALLBACK_POPULAR_STOCKS;
  }
}

// Configuration for stock fetching
let stockConfig = {
  limit: 100, // Number of S&P 500 stocks to fetch (default: 100)
  batchSize: 20, // Batch size for API calls
  batchDelay: 100 // Delay between batches (ms)
};

/**
 * Configure stock fetching behavior
 */
export function configureStockFetching(options: {
  limit?: number;
  batchSize?: number;
  batchDelay?: number;
}) {
  stockConfig = { ...stockConfig, ...options };
  console.log('Stock fetching configured:', stockConfig);
}

/**
 * Get quotes for all S&P 500 stocks (with smart batching for performance)
 */
export async function getPopularStocks(): Promise<StockData[]> {
  // Add timeout wrapper to prevent API gateway timeouts
  const timeout = 25000; // 25 seconds (well under typical 30s API gateway limit)
  
  try {
    // Wrap in Promise.race for timeout handling
    const result = await Promise.race([
      fetchStocksWithTimeout(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stock fetching timeout')), timeout)
      )
    ]);
    
    return result as StockData[];
    
  } catch (error) {
    console.error('Error in getPopularStocks:', error);
    
    // Always fallback to smaller reliable list
    console.log('Falling back to popular stocks list');
    return await getMultipleStockQuotes(FALLBACK_POPULAR_STOCKS);
  }
}

// Helper function for stock fetching with internal error handling
async function fetchStocksWithTimeout(): Promise<StockData[]> {
  try {
    const symbols = await fetchSP500Symbols();
    
    // Use configured limit but cap it to prevent timeouts - increased from 50 to 300
    const safeLimit = Math.min(stockConfig.limit, 300); // Cap at 300 stocks for better coverage
    const limitedSymbols = symbols.slice(0, safeLimit);
    
    console.log(`Fetching quotes for ${limitedSymbols.length} S&P 500 stocks...`);
    
    // Batch requests in smaller chunks
    const batches: string[][] = [];
    const safeBatchSize = Math.min(stockConfig.batchSize, 10); // Smaller batches for reliability
    
    for (let i = 0; i < limitedSymbols.length; i += safeBatchSize) {
      batches.push(limitedSymbols.slice(i, i + safeBatchSize));
    }
    
    const allQuotes: StockData[] = [];
    
    // Process batches with timeout per batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        console.log(`Fetching batch ${i + 1}/${batches.length}: ${batch.length} stocks`);
        
        // Add per-batch timeout
        const batchTimeout = 5000; // 5 seconds per batch
        const batchResult = await Promise.race([
          getMultipleStockQuotes(batch),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Batch timeout')), batchTimeout)
          )
        ]);
        
        allQuotes.push(...(batchResult as StockData[]));
        
        // Shorter delay between batches
        if (stockConfig.batchDelay > 0 && i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.min(stockConfig.batchDelay, 100)));
        }
        
      } catch (error) {
        console.error(`Error fetching batch ${i + 1}:`, error);
        // Continue with other batches even if one fails
      }
    }
    
    console.log(`Successfully fetched ${allQuotes.length} stock quotes`);
    
    // If we got some stocks, return them; otherwise throw to trigger fallback
    if (allQuotes.length > 0) {
      return allQuotes;
    } else {
      throw new Error('No stocks fetched successfully');
    }
    
  } catch (error) {
    console.error('Error in fetchStocksWithTimeout:', error);
    throw error; // Re-throw to trigger fallback
  }
}

/**
 * Get quotes for ALL S&P 500 stocks (may take longer)
 * Use this if you want all ~500 stocks regardless of performance
 */
export async function getAllSP500Stocks(): Promise<StockData[]> {
  try {
    const symbols = await fetchSP500Symbols();
    
    console.log(`Fetching quotes for ALL ${symbols.length} S&P 500 stocks...`);
    console.log('This may take a while...');
    
    // Use smaller batches for the full list to be more conservative
    const CONSERVATIVE_BATCH_SIZE = 10;
    const CONSERVATIVE_DELAY = 200;
    
    const batches: string[][] = [];
    
    for (let i = 0; i < symbols.length; i += CONSERVATIVE_BATCH_SIZE) {
      batches.push(symbols.slice(i, i + CONSERVATIVE_BATCH_SIZE));
    }
    
    const allQuotes: StockData[] = [];
    
    // Process batches with progress logging
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} stocks)...`);
        const batchQuotes = await getMultipleStockQuotes(batch);
        allQuotes.push(...batchQuotes);
        
        // Conservative delay between batches
        if (i < batches.length - 1) { // Don't delay after the last batch
          await new Promise(resolve => setTimeout(resolve, CONSERVATIVE_DELAY));
        }
      } catch (error) {
        console.error(`Error fetching batch ${i + 1}:`, error);
        // Continue with other batches even if one fails
      }
    }
    
    console.log(`Successfully fetched ${allQuotes.length} out of ${symbols.length} S&P 500 stock quotes`);
    return allQuotes;
    
  } catch (error) {
    console.error('Error in getAllSP500Stocks:', error);
    
    // Fallback to popular stocks function
    console.log('Falling back to popular stocks');
    return await getPopularStocks();
  }
}

// Legacy export for backward compatibility
export const POPULAR_STOCKS = FALLBACK_POPULAR_STOCKS; 

// Types for progressive loading
export interface ProgressiveLoadingState {
  stocks: StockData[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  totalExpected: number;
  currentCount: number;
  hasMore: boolean;
  error?: string;
}

export type ProgressCallback = (state: ProgressiveLoadingState) => void;

// Configuration for progressive loading
let progressiveConfig = {
  initialBatch: 50,    // Load first 50 stocks immediately
  subsequentBatch: 25, // Then load 25 at a time
  maxStocks: 500,      // Maximum total stocks to load
  batchDelay: 500      // Delay between batches (ms)
};

/**
 * Configure progressive loading behavior
 */
export function configureProgressiveLoading(options: {
  initialBatch?: number;
  subsequentBatch?: number;
  maxStocks?: number;
  batchDelay?: number;
}) {
  progressiveConfig = { ...progressiveConfig, ...options };
  console.log('Progressive loading configured:', progressiveConfig);
}

/**
 * Load S&P 500 stocks progressively with real-time updates
 * This loads the first batch immediately, then continues loading more in the background
 */
export async function loadStocksProgressively(
  onProgress: ProgressCallback,
  options: {
    initialOnly?: boolean; // If true, only load the initial batch
    targetCount?: number;  // Override the total number of stocks to load
  } = {}
): Promise<StockData[]> {
  try {
    // Get S&P 500 symbols
    const allSymbols = await fetchSP500Symbols();
    const targetCount = options.targetCount || Math.min(progressiveConfig.maxStocks, allSymbols.length);
    const symbolsToFetch = allSymbols.slice(0, targetCount);
    
    console.log(`Starting progressive loading of ${targetCount} stocks...`);
    
    // Initial state
    let currentState: ProgressiveLoadingState = {
      stocks: [],
      isInitialLoading: true,
      isLoadingMore: false,
      totalExpected: targetCount,
      currentCount: 0,
      hasMore: true
    };
    
    onProgress(currentState);
    
    // Load initial batch first (priority stocks)
    const initialBatchSize = Math.min(progressiveConfig.initialBatch, symbolsToFetch.length);
    const initialSymbols = symbolsToFetch.slice(0, initialBatchSize);
    
    console.log(`Loading initial batch: ${initialBatchSize} stocks`);
    
    try {
      const initialStocks = await getMultipleStockQuotes(initialSymbols);
      
      currentState = {
        ...currentState,
        stocks: initialStocks,
        isInitialLoading: false,
        currentCount: initialStocks.length,
        hasMore: initialStocks.length < targetCount
      };
      
      onProgress(currentState);
      
      // If only initial batch requested, return early
      if (options.initialOnly || initialStocks.length >= targetCount) {
        currentState.hasMore = false;
        onProgress(currentState);
        return initialStocks;
      }
      
    } catch (error) {
      console.error('Error loading initial batch:', error);
      currentState = {
        ...currentState,
        isInitialLoading: false,
        error: 'Failed to load initial stocks'
      };
      onProgress(currentState);
      throw error;
    }
    
    // Continue loading remaining stocks in background
    const remainingSymbols = symbolsToFetch.slice(initialBatchSize);
    // eslint-disable-next-line prefer-const
    let allStocks = [...currentState.stocks];
    
    if (remainingSymbols.length > 0) {
      currentState.isLoadingMore = true;
      onProgress(currentState);
      
      // Process remaining stocks in batches
      const batches: string[][] = [];
      for (let i = 0; i < remainingSymbols.length; i += progressiveConfig.subsequentBatch) {
        batches.push(remainingSymbols.slice(i, i + progressiveConfig.subsequentBatch));
      }
      
      console.log(`Loading ${batches.length} additional batches...`);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          console.log(`Loading batch ${i + 1}/${batches.length}: ${batch.length} stocks`);
          
          const batchStocks = await getMultipleStockQuotes(batch);
          allStocks.push(...batchStocks);
          
          currentState = {
            ...currentState,
            stocks: [...allStocks], // Create new array reference for React updates
            currentCount: allStocks.length,
            hasMore: i < batches.length - 1
          };
          
          onProgress(currentState);
          
          // Delay between batches (except for the last one)
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, progressiveConfig.batchDelay));
          }
          
        } catch (error) {
          console.error(`Error loading batch ${i + 1}:`, error);
          // Continue with next batch even if one fails
        }
      }
      
      currentState.isLoadingMore = false;
      currentState.hasMore = false;
      onProgress(currentState);
    }
    
    console.log(`Progressive loading complete: ${allStocks.length} stocks loaded`);
    return allStocks;
    
  } catch (error) {
    console.error('Error in progressive loading:', error);
    
    const errorState: ProgressiveLoadingState = {
      stocks: [],
      isInitialLoading: false,
      isLoadingMore: false,
      totalExpected: 0,
      currentCount: 0,
      hasMore: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    onProgress(errorState);
    throw error;
  }
}

/**
 * Quick load - gets the first batch of stocks immediately
 * Use this for fast initial page load, then call loadStocksProgressively for more
 */
export async function getInitialStocks(): Promise<StockData[]> {
  try {
    const symbols = await fetchSP500Symbols();
    const initialSymbols = symbols.slice(0, progressiveConfig.initialBatch);
    
    console.log(`Quick loading ${initialSymbols.length} initial stocks...`);
    return await getMultipleStockQuotes(initialSymbols);
    
  } catch (error) {
    console.error('Error loading initial stocks:', error);
    // Fallback to popular stocks
    return await getMultipleStockQuotes(FALLBACK_POPULAR_STOCKS.slice(0, 20));
  }
} 