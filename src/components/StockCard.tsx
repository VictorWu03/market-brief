'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockData } from '@/lib/financial-data';
import { formatCurrency, formatPercentage, formatLargeNumber, getChangeColor } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockCardProps {
  stock: StockData;
  onClick?: () => void;
}

export function StockCard({ stock, onClick }: StockCardProps) {
  const changeColor = getChangeColor(stock.change);
  const isPositive = stock.change > 0;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer bg-blue-100" 
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div>
            <div className="font-bold">{stock.symbol}</div>
            <div className="text-sm text-gray-600 font-normal truncate">
              {stock.name}
            </div>
          </div>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">
              {formatCurrency(stock.price)}
            </span>
            <div className={`text-right ${changeColor}`}>
              <div className="font-semibold">
                {formatPercentage(stock.changePercent)}
              </div>
              <div className="text-sm">
                {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            {stock.marketCap && (
              <div>
                <span className="font-medium">Market Cap:</span>
                <div>{formatLargeNumber(stock.marketCap)}</div>
              </div>
            )}
            {stock.peRatio && (
              <div>
                <span className="font-medium">P/E Ratio:</span>
                <div>{stock.peRatio.toFixed(2)}</div>
              </div>
            )}
            {stock.dividendYield && (
              <div>
                <span className="font-medium">Dividend Yield:</span>
                <div>{formatPercentage(stock.dividendYield * 100)}</div>
              </div>
            )}
            <div>
              <span className="font-medium">Volume:</span>
              <div>{stock.volume.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 