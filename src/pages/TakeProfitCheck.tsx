import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, RefreshCw, TrendingUp, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoinStatus {
  symbol: string;
  hasOrder: boolean;
  targetPercent: number | null;
  orderDetails: any;
}

export default function TakeProfitCheck() {
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<CoinStatus[]>([]);
  const { toast } = useToast();

  const checkTakeProfitStatus = () => {
    setChecking(true);
    
    try {
      const portfolioData = localStorage.getItem('binance_portfolio_assets');
      if (!portfolioData) {
        toast({
          title: "⚠️ تحذير",
          description: "لم يتم العثور على عملات في المحفظة",
          variant: "destructive"
        });
        setChecking(false);
        return;
      }

      const portfolioAssets: string[] = JSON.parse(portfolioData);
      const coins = portfolioAssets.filter(coin => 
        !['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'].includes(coin)
      );

      const ordersData = localStorage.getItem('take_profit_orders');
      const orders = ordersData ? JSON.parse(ordersData) : [];

      const statuses: CoinStatus[] = coins.map(coin => {
        const targetPercentKey = `coin_target_profit_${coin}`;
        const targetPercent = localStorage.getItem(targetPercentKey);
        const order = orders.find((o: any) => o.symbol === coin);
        
        return {
          symbol: coin,
          hasOrder: !!order,
          targetPercent: targetPercent ? parseFloat(targetPercent) : null,
          orderDetails: order || null
        };
      });

      setResults(statuses);

      const withOrders = statuses.filter(s => s.hasOrder).length;
      const withoutOrders = statuses.length - withOrders;

      toast({
        title: "✅ اكتمل الفحص",
        description: `العملات مع Take Profit: ${withOrders} | بدون Take Profit: ${withoutOrders}`,
      });

    } catch (error) {
      console.error('خطأ في الفحص:', error);
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء فحص أوامر Take Profit",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const createAllOrders = async () => {
    setCreating(true);
    
    try {
      const { createTakeProfitOrder } = await import('@/services/takeProfitService');
      const { getCoinTargetProfit } = await import('@/services/smartTradingService');
      
      // قراءة العملات من المحفظة
      const portfolioAssetsString = localStorage.getItem('binance_portfolio_assets');
      if (!portfolioAssetsString) {
        toast({
          title: "⚠️ خطأ",
          description: "لم يتم العثور على عملات في المحفظة. جرب تحديث المحفظة من الصفحة الرئيسية",
          variant: "destructive"
        });
        setCreating(false);
        return;
      }

      const portfolioAssets: string[] = JSON.parse(portfolioAssetsString);
      if (portfolioAssets.length === 0) {
        toast({
          title: "⚠️ خطأ",
          description: "المحفظة فارغة",
          variant: "destructive"
        });
        setCreating(false);
        return;
      }

      // فلترة العملات المستقرة
      const coins = portfolioAssets.filter(coin => 
        !['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'].includes(coin)
      );

      let created = 0;
      let failed = 0;
      let skipped = 0;

      // الحصول على أسعار العملات من CoinGecko
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron,usd-coin,arweave,celo,stacks&vs_currencies=usd');
      const prices = await response.json();
      
      // map العملات إلى أسماء CoinGecko
      const coinGeckoMap: Record<string, string> = {
        'TRX': 'tron',
        'USD1': 'usd-coin',
        'AT': 'arweave',
        'CELO': 'celo',
        'STX': 'stacks'
      };

      for (const coin of coins) {
        try {
          const targetPercent = getCoinTargetProfit(coin);
          
          // الحصول على السعر من CoinGecko
          const geckoId = coinGeckoMap[coin];
          const currentPrice = geckoId && prices[geckoId] ? prices[geckoId].usd : 0;
          
          if (!currentPrice || currentPrice <= 0) {
            console.log(`تخطي ${coin}: لا يوجد سعر`);
            skipped++;
            continue;
          }

          // حساب الكمية من localStorage (من المحفظة)
          const balanceKey = `balance_${coin}`;
          const quantity = parseFloat(localStorage.getItem(balanceKey) || '0');
          
          if (quantity <= 0) {
            console.log(`تخطي ${coin}: لا توجد كمية`);
            skipped++;
            continue;
          }

          const targetPrice = currentPrice * (1 + targetPercent / 100);

          console.log(`إنشاء أمر ${coin}: الكمية=${quantity}, السعر الحالي=${currentPrice}, السعر المستهدف=${targetPrice}`);
          
          await createTakeProfitOrder(coin, quantity, targetPrice);
          created++;
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`فشل إنشاء أمر ${coin}:`, error);
          failed++;
        }
      }

      toast({
        title: created > 0 ? "✅ تم بنجاح" : "⚠️ تحذير",
        description: `تم إنشاء ${created} أمر | فشل ${failed} | تم تخطي ${skipped}`,
      });

      setTimeout(() => checkTakeProfitStatus(), 1000);

    } catch (error) {
      console.error('خطأ في إنشاء الأوامر:', error);
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء إنشاء أوامر Take Profit",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const coinsWithOrders = results.filter(r => r.hasOrder).length;
  const coinsWithoutOrders = results.length - coinsWithOrders;

  return (
    <div className="container mx-auto p-4 space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            فحص أوامر Take Profit
          </CardTitle>
          <CardDescription>
            تحقق من حالة أوامر جني الأرباح لجميع العملات في المحفظة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={checkTakeProfitStatus} 
              disabled={checking || creating}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {checking ? (
                <>
                  <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                  جاري الفحص...
                </>
              ) : (
                <>
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                  فحص الحالة
                </>
              )}
            </Button>

            <Button 
              onClick={createAllOrders} 
              disabled={checking || creating}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {creating ? (
                <>
                  <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Plus className="ml-2 h-4 w-4" />
                  إنشاء الأوامر
                </>
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700">{coinsWithOrders}</p>
                      <p className="text-sm text-green-600">عملات محمية</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">{coinsWithoutOrders}</p>
                      <p className="text-sm text-red-600">عملات غير محمية</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل العملات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.map((coin) => (
                      <div 
                        key={coin.symbol}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          coin.hasOrder 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {coin.hasOrder ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-bold">{coin.symbol}</p>
                            {coin.targetPercent && (
                              <p className="text-sm text-gray-600">
                                نسبة الهدف: {coin.targetPercent}%
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-left">
                          {coin.hasOrder ? (
                            <span className="text-sm font-medium text-green-700">
                              ✅ محمي
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-red-700">
                              ⚠️ غير محمي
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
