import axios from 'axios';
import { parse } from 'node-html-parser';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    summary: string;
  };
}

export async function scrapeYahooFinanceNews(symbol?: string): Promise<NewsArticle[]> {
  try {
    const url = symbol 
      ? `https://finance.yahoo.com/quote/${symbol}/news`
      : 'https://finance.yahoo.com/news';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const root = parse(response.data);
    const articles: NewsArticle[] = [];

    // Updated selectors for modern Yahoo Finance structure
    const newsSelectors = [
      'article h3 a',                     // Main article headlines
      '[data-module="StreamVideoTitleCard"] a',  // Video content
      '[data-module="Stream"] h3 a',      // Stream content
      '.js-stream-content h3 a',          // Stream articles
      '.story-title a',                   // Story titles
      '.StretchedBox a',                  // Article boxes
      'h3[class*="Mb"] a',               // Headlines with margin bottom
      'a[data-ylk*="elm:hdln"]',         // Yahoo tracking headlines
      '.rapidnofollow[href*="/news/"]',   // News links
      'a[href*="/news/"][class*="Fw"]'    // Styled news links
    ];

    for (const selector of newsSelectors) {
      const elements = root.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        let title = '';
        let href = '';
        
        if (element.tagName === 'A') {
          // Direct link element
          title = element.text?.trim() || '';
          href = element.getAttribute('href') || '';
        } else {
          // Find link within element
          const linkElement = element.querySelector('a');
          if (linkElement) {
            title = linkElement.text?.trim() || '';
            href = linkElement.getAttribute('href') || '';
          }
        }
        
        // Clean up title and validate
        title = title.replace(/\s+/g, ' ').trim();
        
        if (title && href && title.length > 15 && title.length < 200) {
          // Build full URL
          let fullUrl = '';
          if (href.startsWith('http')) {
            fullUrl = href;
          } else if (href.startsWith('/')) {
            fullUrl = `https://finance.yahoo.com${href}`;
                     } else {
             return; // Skip invalid URLs
           }
          
          // Avoid duplicates
          const isDuplicate = articles.some(article => 
            article.title.toLowerCase() === title.toLowerCase() ||
            article.url === fullUrl
          );
          
          if (!isDuplicate) {
            articles.push({
              id: `yahoo-${symbol || 'general'}-${index}-${Date.now()}`,
              title,
              summary: title, // Yahoo Finance usually shows headline as summary
              url: fullUrl,
              source: 'Yahoo Finance',
              publishedAt: new Date().toISOString()
            });
          }
        }
      });
      
      if (articles.length >= 15) break; // Get more articles to filter better ones
    }

    // Sort by title length (longer titles tend to be more descriptive)
    return articles
      .sort((a, b) => b.title.length - a.title.length)
      .slice(0, 10);
      
  } catch (error) {
    console.error('Error scraping Yahoo Finance news:', error);
    return [];
  }
}

export async function scrapeBloombergNews(): Promise<NewsArticle[]> {
  try {
    const response = await axios.get('https://www.bloomberg.com/markets', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const root = parse(response.data);
    const articles: NewsArticle[] = [];

    // Bloomberg article selectors
    const selectors = [
      '[data-module="Story"]',
      '.story-package-module__story',
      '.story-list-story',
      'h3 a'
    ];

    for (const selector of selectors) {
      const elements = root.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        const linkElement = element.querySelector('a') || element;
        const title = linkElement.text?.trim();
        const href = linkElement.getAttribute('href');
        
        if (title && href && title.length > 10) {
          const fullUrl = href.startsWith('http') ? href : `https://www.bloomberg.com${href}`;
          
          articles.push({
            id: `bloomberg-${index}-${Date.now()}`,
            title,
            summary: title,
            url: fullUrl,
            source: 'Bloomberg',
            publishedAt: new Date().toISOString()
          });
        }
      });
      
      if (articles.length >= 10) break;
    }

    return articles.slice(0, 10);
  } catch (error) {
    console.error('Error scraping Bloomberg news:', error);
    return [];
  }
}

// MarketWatch RSS fetcher - reliable financial news source
export async function getMarketWatchRSS(): Promise<NewsArticle[]> {
  try {
    const rssUrls = [
      'https://feeds.marketwatch.com/marketwatch/topstories/',
      'https://feeds.marketwatch.com/marketwatch/marketpulse/'
    ];

    const allArticles: NewsArticle[] = [];

    for (const rssUrl of rssUrls) {
      try {
        const response = await axios.get(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)'
          },
          timeout: 10000
        });

        const root = parse(response.data);
        const items = root.querySelectorAll('item');

        items.forEach((item) => {
          const title = item.querySelector('title')?.text?.trim();
          const description = item.querySelector('description')?.text?.trim();
          const link = item.querySelector('link')?.text?.trim();
          const pubDate = item.querySelector('pubDate')?.text?.trim();

          if (title && title.length >= 15 && title.length <= 250) {
            const article: NewsArticle = {
              id: `marketwatch-${Buffer.from(title).toString('base64').slice(0, 10)}`,
              title: title,
              summary: description || title,
              url: link || 'https://marketwatch.com',
              source: 'MarketWatch',
              publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
            };

            // Check for duplicates
            if (!allArticles.some(existing => 
              existing.title.toLowerCase().trim() === title.toLowerCase().trim()
            )) {
              allArticles.push(article);
            }
          }
        });
      } catch (error) {
        console.error(`Error fetching RSS from ${rssUrl}:`, error);
      }
    }

    return allArticles.slice(0, 15); // Return up to 15 articles from RSS
  } catch (error) {
    console.error('Error fetching MarketWatch RSS:', error);
    return [];
  }
}

// Improved Yahoo Finance news fetcher with better selectors
export async function getYahooFinanceImproved(): Promise<NewsArticle[]> {
  try {
    const response = await axios.get('https://finance.yahoo.com/news', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000,
      maxContentLength: 50 * 1024 * 1024, // 50MB limit
      maxBodyLength: 50 * 1024 * 1024
    });

    const root = parse(response.data);
    const articles: NewsArticle[] = [];

    // Updated selectors for Yahoo Finance 2024 structure
    const betterSelectors = [
      // Main story links
      'h3 a[href*="/news/"]',
      'h2 a[href*="/news/"]', 
      'a[data-testid="headline-link"]',
      'a[data-testid="stream-item-title"]',
      // Article containers
      'article h3 a',
      'article h2 a',
      // Stream content
      '[data-module="Stream"] a[href*="/news/"]',
      '[data-module="FinanceStrm"] a[href*="/news/"]',
      // Title-bearing links
      'a[title][href*="/news/"]',
      'a[href*="finance.yahoo.com/news"]'
    ];

    for (const selector of betterSelectors) {
      const elements = root.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        let title = '';
        let href = '';
        
        // Get title from various sources
        title = element.text?.trim() || 
                element.getAttribute('title')?.trim() || 
                element.getAttribute('aria-label')?.trim() || '';
        
        href = element.getAttribute('href') || '';
        
        // Clean and validate title
        title = title.replace(/\s+/g, ' ').trim();
        
        if (title && href && title.length >= 20 && title.length <= 200) {
          // Build full URL
          let fullUrl = '';
          if (href.startsWith('http')) {
            fullUrl = href;
          } else if (href.startsWith('/')) {
            fullUrl = `https://finance.yahoo.com${href}`;
          } else {
            return; // Skip invalid URLs
          }
          
          // Avoid duplicates
          const isDuplicate = articles.some(article => 
            article.title.toLowerCase() === title.toLowerCase() ||
            article.url === fullUrl
          );
          
          if (!isDuplicate) {
            articles.push({
              id: `yahoo-improved-${index}-${Date.now()}`,
              title,
              summary: title, // Yahoo typically shows headline as summary
              url: fullUrl,
              source: 'Yahoo Finance',
              publishedAt: new Date().toISOString()
            });
          }
        }
      });
      
      if (articles.length >= 20) break; // Stop when we have enough
    }

    return articles.slice(0, 15);
      
  } catch (error) {
    console.error('Error scraping improved Yahoo Finance news:', error);
    return [];
  }
}

export async function getFinancialNews(symbol?: string): Promise<NewsArticle[]> {
  try {
    console.log('Fetching financial news from multiple sources...');
    
    const [yahooNews, marketWatchRSS, bloombergNews] = await Promise.allSettled([
      getYahooFinanceImproved(),
      getMarketWatchRSS(),
      scrapeBloombergNews()
    ]);

    const allNews: NewsArticle[] = [];
    
    // Add Yahoo scraping results (improved version)
    if (yahooNews.status === 'fulfilled' && yahooNews.value.length > 0) {
      console.log(`Got ${yahooNews.value.length} articles from Yahoo Finance (improved)`);
      allNews.push(...yahooNews.value);
    }
    
    // Add MarketWatch RSS results
    if (marketWatchRSS.status === 'fulfilled' && marketWatchRSS.value.length > 0) {
      console.log(`Got ${marketWatchRSS.value.length} articles from MarketWatch RSS`);
      allNews.push(...marketWatchRSS.value);
    }
    
    // Add Bloomberg results
    if (bloombergNews.status === 'fulfilled' && bloombergNews.value.length > 0) {
      console.log(`Got ${bloombergNews.value.length} articles from Bloomberg`);
      allNews.push(...bloombergNews.value);
    }

    // Remove duplicates based on title similarity
    const uniqueNews = allNews.filter((article, index, arr) => {
      return arr.findIndex(a => 
        a.title.toLowerCase().trim() === article.title.toLowerCase().trim()
      ) === index;
    });

    console.log(`Total unique articles: ${uniqueNews.length}`);
    return uniqueNews.slice(0, 25); // Return up to 25 articles
  } catch (error) {
    console.error('Error fetching financial news:', error);
    return [];
  }
}

// Enhanced fallback news data with more articles
export const SAMPLE_NEWS: NewsArticle[] = [
  {
    id: 'sample-1',
    title: 'Stock Market Reaches New Heights Amid Economic Recovery',
    summary: 'Major indices hit record levels as investor confidence grows following positive economic indicators and strong corporate earnings reports.',
    url: '#',
    source: 'Financial News',
    publishedAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    title: 'Tech Stocks Lead Market Rally on AI Advancement',
    summary: 'Technology companies surge as artificial intelligence breakthroughs drive investor enthusiasm and revenue growth expectations.',
    url: '#',
    source: 'Tech Finance',
    publishedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'sample-3',
    title: 'Federal Reserve Signals Cautious Approach to Interest Rates',
    summary: 'Central bank officials indicate measured strategy for monetary policy adjustments amid ongoing inflation concerns.',
    url: '#',
    source: 'Economic Times',
    publishedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'sample-4',
    title: 'Energy Sector Gains Momentum on Rising Oil Prices',
    summary: 'Oil and gas companies see significant gains as crude prices climb due to geopolitical tensions and supply constraints.',
    url: '#',
    source: 'Energy Report',
    publishedAt: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: 'sample-5',
    title: 'Banking Stocks Rise on Strong Quarterly Earnings',
    summary: 'Major financial institutions report better-than-expected profits driven by loan growth and improved credit conditions.',
    url: '#',
    source: 'Banking Weekly',
    publishedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'sample-6',
    title: 'Retail Giants Report Mixed Results Amid Consumer Spending Shifts',
    summary: 'Large retailers show varying performance as consumer behavior continues to evolve in the post-pandemic economy.',
    url: '#',
    source: 'Retail Insights',
    publishedAt: new Date(Date.now() - 18000000).toISOString()
  },
  {
    id: 'sample-7',
    title: 'Cryptocurrency Market Shows Signs of Institutional Adoption',
    summary: 'Digital assets gain credibility as more traditional financial institutions announce crypto investment strategies.',
    url: '#',
    source: 'Crypto Finance',
    publishedAt: new Date(Date.now() - 21600000).toISOString()
  },
  {
    id: 'sample-8',
    title: 'Healthcare Stocks Advance on Breakthrough Drug Approvals',
    summary: 'Pharmaceutical companies see stock price increases following FDA approvals for new treatments and therapies.',
    url: '#',
    source: 'Healthcare Today',
    publishedAt: new Date(Date.now() - 25200000).toISOString()
  }
];

export async function getNewsWithFallback(symbol?: string): Promise<NewsArticle[]> {
  const news = await getFinancialNews(symbol);
  
  if (news.length > 0) {
    console.log(`Returning ${news.length} real articles`);
    return news;
  } else {
    console.log('Using fallback sample data');
    return SAMPLE_NEWS;
  }
} 