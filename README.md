# Finance RAG Analyzer

A comprehensive financial analysis web application that leverages large language models (LLMs) to perform retrieval-augmented generation (RAG) over financial datasets. The app generates financial reports, scrapes websites, extracts sentiments from news articles, and identifies ideal stocks based on natural language user queries.

## Features

- **AI-Powered Analysis**: Uses Google Gemini AI for intelligent financial analysis and stock recommendations
- **Real-time Stock Data**: Live stock quotes and historical data from Yahoo Finance
- **News Sentiment Analysis**: Scrapes and analyzes financial news from Yahoo Finance and Bloomberg
- **Natural Language Queries**: Ask questions like "Which tech stocks should I buy?" and get AI-powered recommendations
- **Interactive Dashboard**: Beautiful, responsive UI with stock cards, news feeds, and analysis results
- **Stock Search**: Search for specific stocks by symbol or company name

## Tech Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom UI components
- **Backend**: Next.js API routes
- **AI**: Google Gemini Pro API
- **Data Sources**: 
  - Yahoo Finance (real-time stock data)
  - Bloomberg & Yahoo Finance (news scraping)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

1. Node.js 18+ and npm
2. Google AI Studio API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd finance-rag-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the project root:
   ```bash
   # Google Gemini AI Configuration
   GOOGLE_AI_API_KEY=your_google_gemini_api_key_here
   
   # Application Configuration
   NEXT_PUBLIC_APP_NAME=Finance RAG Analyzer
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Get Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env.local` file

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment on Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add GOOGLE_AI_API_KEY
   ```
   Enter your Google Gemini API key when prompted.

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `GOOGLE_AI_API_KEY`: Your Google Gemini API key

3. **Deploy**
   Vercel will automatically build and deploy your application.

## Usage

### Stock Analysis
1. **View Popular Stocks**: The dashboard displays popular stocks with real-time data
2. **Search Stocks**: Enter a stock symbol (e.g., "AAPL") to get detailed information
3. **Refresh Data**: Use the refresh buttons to get the latest stock and news data

### AI Analysis
1. **Ask Questions**: Use natural language queries like:
   - "Which tech stocks should I buy?"
   - "What are the best dividend stocks?"
   - "Should I invest in renewable energy stocks?"
   - "Analyze the current market sentiment"

2. **Get Recommendations**: The AI will provide:
   - Stock recommendations with buy/sell/hold actions
   - Confidence scores for each recommendation
   - Detailed reasoning for each suggestion

### News & Sentiment
1. **Financial News**: View the latest financial news from Yahoo Finance and Bloomberg
2. **Sentiment Analysis**: Each news article is analyzed for sentiment (positive, negative, neutral)
3. **AI Summaries**: Get AI-generated summaries of news articles

## API Endpoints

- `GET /api/stocks` - Get popular stocks or search by symbol
- `GET /api/stocks/historical` - Get historical stock data
- `GET /api/news` - Get financial news with optional sentiment analysis
- `POST /api/analysis` - Generate AI-powered financial analysis and recommendations

## Project Structure

```
finance-rag-app/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Global styles
│   │   └── page.tsx      # Main application page
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── StockCard.tsx
│   │   ├── NewsCard.tsx
│   │   └── ...
│   └── lib/             # Utility functions
│       ├── gemini.ts    # Google Gemini AI integration
│       ├── financial-data.ts # Stock data utilities
│       ├── news-scraper.ts   # News scraping utilities
│       └── utils.ts     # Common utilities
├── public/              # Static assets
├── vercel.json         # Vercel configuration
└── package.json        # Dependencies and scripts
```

## Free Tier Limits

- **Google Gemini**: 15 requests/minute, 1 million tokens/day
- **Yahoo Finance**: Rate-limited but generous for personal use
- **Vercel**: 100GB bandwidth/month, serverless functions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Create a Pull Request

## License

This project is for educational purposes only. Not financial advice.

## Support

If you encounter any issues:
1. Check that your Google Gemini API key is correctly set
2. Ensure you're within the API rate limits
3. Check the browser console for any errors
4. Review the server logs in Vercel dashboard

## Disclaimer

This application is for educational and informational purposes only. It should not be considered as financial advice. Always do your own research and consult with financial professionals before making investment decisions.
