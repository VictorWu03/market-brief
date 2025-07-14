import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Activity, MoreHorizontal } from 'lucide-react';
import { StockData } from '@/lib/financial-data';

interface StockChartProps {
  stocks: StockData[];
}

export function StockChart({ stocks }: StockChartProps) {
  // Pagination state
  const [displayedRows, setDisplayedRows] = useState(20);
  const [displayedChartStocks, setDisplayedChartStocks] = useState(12);
  
  // Calculate market overview stats
  const marketStats = {
    totalStocks: stocks.length,
    gainers: stocks.filter(s => s.change > 0).length,
    losers: stocks.filter(s => s.change < 0).length,
    avgChange: stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length,
    topGainer: stocks.reduce((max, stock) => 
      stock.changePercent > max.changePercent ? stock : max, stocks[0]),
    topLoser: stocks.reduce((min, stock) => 
      stock.changePercent < min.changePercent ? stock : min, stocks[0])
  };

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-gray-600">Total Stocks</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{marketStats.totalStocks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-gray-600">Gainers</div>
            </div>
            <div className="text-2xl font-bold text-green-600">{marketStats.gainers}</div>
            <div className="text-xs text-gray-500">
              Top: {marketStats.topGainer?.symbol} (+{marketStats.topGainer?.changePercent.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div className="text-sm font-medium text-gray-600">Losers</div>
            </div>
            <div className="text-2xl font-bold text-red-600">{marketStats.losers}</div>
            <div className="text-xs text-gray-500">
              Top: {marketStats.topLoser?.symbol} ({marketStats.topLoser?.changePercent.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-medium text-gray-600">Avg Change</div>
            </div>
            <div className={`text-2xl font-bold ${marketStats.avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Performance Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Prices Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Stock Prices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stocks.slice(0, displayedChartStocks).map((stock) => {
                const maxPrice = Math.max(...stocks.map(s => s.price));
                const barWidth = (stock.price / maxPrice) * 100;
                
                return (
                  <div key={stock.symbol} className="flex items-center space-x-3">
                    <div className="text-sm font-medium w-16">{stock.symbol}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded h-4 relative">
                          <div 
                            className="bg-blue-500 h-4 rounded"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                            {formatPrice(stock.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Load More for Price Chart */}
            {displayedChartStocks < stocks.length && (
              <div className="text-center pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisplayedChartStocks(prev => Math.min(prev + 4, stocks.length))}
                  className="text-xs"
                >
                  <MoreHorizontal className="h-3 w-3 mr-1" />
                  Show More ({stocks.length - displayedChartStocks} remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Change Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Performance Change (%)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stocks.slice(0, displayedChartStocks).map((stock) => {
                const maxChange = Math.max(...stocks.map(s => Math.abs(s.changePercent)));
                const barWidth = Math.abs(stock.changePercent / maxChange) * 100;
                const isPositive = stock.changePercent >= 0;
                
                return (
                  <div key={stock.symbol} className="flex items-center space-x-3">
                    <div className="text-sm font-medium w-16">{stock.symbol}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded h-4 relative">
                          <div 
                            className={`h-4 rounded ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${barWidth}%` }}
                          ></div>
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Load More for Performance Chart */}
            {displayedChartStocks < stocks.length && (
              <div className="text-center pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisplayedChartStocks(prev => Math.min(prev + 4, stocks.length))}
                  className="text-xs"
                >
                  <MoreHorizontal className="h-3 w-3 mr-1" />
                  Show More ({stocks.length - displayedChartStocks} remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Top Performers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-medium">Symbol</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">Change</th>
                  <th className="text-right p-3 font-medium">Change %</th>
                  <th className="text-right p-3 font-medium">Volume</th>
                  <th className="text-center p-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {stocks
                  .sort((a, b) => b.changePercent - a.changePercent)
                  .slice(0, displayedRows)
                  .map((stock, index) => (
                    <tr key={stock.symbol} className={`border-b border-gray-100 hover:bg-gray-50 ${index < 3 ? 'bg-blue-50' : ''}`}>
                      <td className="p-3 font-medium flex items-center space-x-2">
                        {index < 3 && (
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        )}
                        <span>{stock.symbol}</span>
                      </td>
                      <td className="p-3 text-right font-medium">{formatPrice(stock.price)}</td>
                      <td className={`p-3 text-right font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right text-gray-600">
                        {stock.volume ? formatVolume(stock.volume) : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        {stock.changePercent >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Load More Button for Table */}
          {displayedRows < stocks.length && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setDisplayedRows(prev => Math.min(prev + 10, stocks.length))}
                className="flex items-center space-x-2"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>Show More Rows ({stocks.length - displayedRows} remaining)</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Pagination Controls */}
      {(displayedChartStocks < stocks.length || displayedRows < stocks.length) && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <div className="text-sm text-gray-600">
                Showing charts: {Math.min(displayedChartStocks, stocks.length)} of {stocks.length} | 
                Table rows: {Math.min(displayedRows, stocks.length)} of {stocks.length}
              </div>
              <div className="flex space-x-2">
                {displayedChartStocks < stocks.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisplayedChartStocks(stocks.length)}
                    className="text-xs"
                  >
                    Show All Charts
                  </Button>
                )}
                {displayedRows < stocks.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisplayedRows(stocks.length)}
                    className="text-xs"
                  >
                    Show All Rows
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 