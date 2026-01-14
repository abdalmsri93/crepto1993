import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface CoinProfitInfo {
  coin: string;
  targetProfit: string | null;
  investment: string | null;
  lastBuyPrice: string | null;
  balance: string | null;
  hasProfit: boolean;
  hasInvestment: boolean;
}

interface SmartTradingState {
  currentCycle: number;
  currentProfitPercent: number;
  soldInCurrentCycle: number;
  totalCyclesCompleted: number;
  totalProfit: number;
  lastUpdated: string;
  pendingCoins: string[];
}

export default function ProfitCheck() {
  const [coins, setCoins] = useState<CoinProfitInfo[]>([]);
  const [smartTradingState, setSmartTradingState] = useState<SmartTradingState | null>(null);
  const [loading, setLoading] = useState(true);

  const checkProfitAssignments = () => {
    setLoading(true);
    
    // Get all coins from localStorage
    const allKeys = Object.keys(localStorage);
    const coinKeys = allKeys.filter(key => 
      key.startsWith('balance_') && !key.includes('USDT')
    );
    
    const coinsData: CoinProfitInfo[] = coinKeys.map(key => {
      const coin = key.replace('balance_', '');
      const targetProfit = localStorage.getItem(`coin_target_profit_${coin}`);
      const investment = localStorage.getItem(`investment_${coin}`);
      const lastBuyPrice = localStorage.getItem(`last_buy_price_${coin}`);
      const balance = localStorage.getItem(`balance_${coin}`);
      
      return {
        coin,
        targetProfit,
        investment,
        lastBuyPrice,
        balance,
        hasProfit: targetProfit !== null,
        hasInvestment: investment !== null && lastBuyPrice !== null
      };
    });
    
    // Sort by coin name
    coinsData.sort((a, b) => a.coin.localeCompare(b.coin));
    
    setCoins(coinsData);
    
    // Get Smart Trading state
    const stateStr = localStorage.getItem('smart_trading_state');
    if (stateStr) {
      try {
        setSmartTradingState(JSON.parse(stateStr));
      } catch (e) {
        setSmartTradingState(null);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    checkProfitAssignments();
  }, []);

  const getStatusIcon = (hasProfit: boolean, hasInvestment: boolean) => {
    if (hasProfit && hasInvestment) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (hasInvestment && !hasProfit) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const totalCoins = coins.length;
  const coinsWithProfit = coins.filter(c => c.hasProfit).length;
  const coinsWithInvestment = coins.filter(c => c.hasInvestment).length;

  return (
    <div className="container mx-auto p-4 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">فحص نسب الربح للعملات</h1>
        <Button onClick={checkProfitAssignments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalCoins}</div>
              <div className="text-sm text-gray-600 mt-1">إجمالي العملات</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{coinsWithProfit}</div>
              <div className="text-sm text-gray-600 mt-1">عملات بنسبة ربح</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{coinsWithInvestment}</div>
              <div className="text-sm text-gray-600 mt-1">عملات ببيانات استثمار</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Trading State */}
      {smartTradingState && (
        <Card>
          <CardHeader>
            <CardTitle>حالة Smart Trading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">الدورة الحالية</div>
                <div className="text-2xl font-bold">{smartTradingState.currentCycle}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">نسبة الربح الحالية</div>
                <div className="text-2xl font-bold text-green-600">{smartTradingState.currentProfitPercent}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">مباعة في الدورة</div>
                <div className="text-2xl font-bold">{smartTradingState.soldInCurrentCycle}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">دورات مكتملة</div>
                <div className="text-2xl font-bold">{smartTradingState.totalCyclesCompleted}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">إجمالي الربح</div>
                <div className="text-2xl font-bold text-green-600">${smartTradingState.totalProfit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">عملات معلقة</div>
                <div className="text-2xl font-bold">{smartTradingState.pendingCoins.length}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              آخر تحديث: {new Date(smartTradingState.lastUpdated).toLocaleString('ar-EG')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coins List */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العملات ({coins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coins.map((coin) => (
              <div 
                key={coin.coin}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(coin.hasProfit, coin.hasInvestment)}
                  <div>
                    <div className="font-bold text-lg">{coin.coin}</div>
                    <div className="text-sm text-gray-600">
                      {coin.balance ? `الكمية: ${parseFloat(coin.balance).toFixed(4)}` : 'لا توجد كمية'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div>
                    <div className="text-xs text-gray-500">نسبة الربح</div>
                    <div className={`font-bold ${coin.hasProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {coin.targetProfit ? `${coin.targetProfit}%` : '❌ غير محدد'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500">الاستثمار</div>
                    <div className={`font-bold ${coin.investment ? 'text-blue-600' : 'text-gray-400'}`}>
                      {coin.investment ? `$${parseFloat(coin.investment).toFixed(2)}` : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500">سعر الشراء</div>
                    <div className={`font-bold ${coin.lastBuyPrice ? 'text-purple-600' : 'text-gray-400'}`}>
                      {coin.lastBuyPrice ? `$${parseFloat(coin.lastBuyPrice).toFixed(6)}` : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500">الحالة</div>
                    <div className="font-bold">
                      {coin.hasProfit && coin.hasInvestment ? (
                        <span className="text-green-600">✅ كامل</span>
                      ) : coin.hasInvestment ? (
                        <span className="text-yellow-600">⚠️ ينقص الربح</span>
                      ) : (
                        <span className="text-red-600">❌ بلا بيانات</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {coins.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد عملات في المحفظة
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <div className="font-bold mb-3">دليل الحالات:</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>✅ كامل: العملة لديها نسبة ربح وبيانات استثمار</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>⚠️ ينقص الربح: العملة لديها بيانات استثمار لكن بدون نسبة ربح</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>❌ بلا بيانات: العملة بدون بيانات استثمار أو نسبة ربح</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
