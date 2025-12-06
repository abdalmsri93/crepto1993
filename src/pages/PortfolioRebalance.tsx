import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Copy, CheckCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";

interface PortfolioAsset {
  symbol: string;
  free: number;
  locked: number;
  total: number;
  currentPrice: number;
  value: number;
  percentage: number;
  newPercentage?: number;
  suggestedAmount?: number;
}

interface RebalanceResult {
  current: PortfolioAsset[];
  rebalanced: PortfolioAsset[];
  method: string;
  totalValue: number;
  newInvestment: number;
}

const PortfolioRebalance = () => {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [newInvestmentAmount, setNewInvestmentAmount] = useState<string>("");
  const [rebalanceMethod, setRebalanceMethod] = useState<string>("balance");
  const [result, setResult] = useState<RebalanceResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        navigate("/auth");
        return;
      }
      setSession(currentSession);
      fetchPortfolio(currentSession);
    };

    checkAuth();
  }, [navigate]);

  const fetchPortfolio = async (currentSession: any) => {
    try {
      setIsLoading(true);
      
      // جلب أرصدة المحفظة
      const { data, error } = await supabase.functions.invoke('binance-portfolio', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (error) throw error;

      if (data?.balances) {
        // جلب أسعار العملات من Binance
        const tickersResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const tickers: any[] = await tickersResponse.json();
        const priceMap: { [key: string]: number } = {};
        
        tickers.forEach((ticker: any) => {
          const symbol = ticker.symbol.replace('USDT', '');
          priceMap[symbol] = parseFloat(ticker.lastPrice);
        });

        // معالجة الأرصدة
        const assets = data.balances
          .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .map((b: any) => {
            const free = parseFloat(b.free);
            const locked = parseFloat(b.locked);
            const total = free + locked;
            const price = priceMap[b.asset] || 0;
            const value = total * price;
            
            return {
              symbol: b.asset,
              free,
              locked,
              total,
              currentPrice: price,
              value,
              percentage: 0
            };
          })
          .sort((a: any, b: any) => b.value - a.value);

        // حساب النسب المئوية
        const totalValue = assets.reduce((sum: number, a: any) => sum + a.value, 0);
        assets.forEach((a: any) => {
          a.percentage = totalValue > 0 ? (a.value / totalValue) * 100 : 0;
        });

        setPortfolio(assets);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات المحفظة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRebalance = () => {
    if (portfolio.length === 0) {
      toast({
        title: "تحذير",
        description: "المحفظة فارغة",
        variant: "destructive",
      });
      return;
    }

    const newAmount = parseFloat(newInvestmentAmount) || 0;
    if (newAmount <= 0) {
      toast({
        title: "تحذير",
        description: "أدخل مبلغاً صحيحاً",
        variant: "destructive",
      });
      return;
    }

    const currentTotalValue = portfolio.reduce((sum, a) => sum + a.value, 0);
    let rebalanced: PortfolioAsset[] = [];

    if (rebalanceMethod === "balance") {
      // توازن المحفظة: توزيع المبلغ حسب النسب الحالية
      rebalanced = portfolio.map(asset => ({
        ...asset,
        suggestedAmount: (newAmount * asset.percentage) / 100,
        newPercentage: asset.percentage
      }));
    } else if (rebalanceMethod === "growth") {
      // نمو المحفظة: الحفاظ على نفس النسب وإضافة المبلغ
      rebalanced = portfolio.map(asset => ({
        ...asset,
        suggestedAmount: (newAmount * asset.percentage) / 100,
        newPercentage: asset.percentage
      }));
    } else if (rebalanceMethod === "equal") {
      // توزيع متساوي: تقسيم المبلغ على عدد العملات
      const equalAmount = newAmount / portfolio.length;
      const equalPercentage = 100 / portfolio.length;
      rebalanced = portfolio.map(asset => ({
        ...asset,
        suggestedAmount: equalAmount,
        newPercentage: equalPercentage
      }));
    }

    setResult({
      current: portfolio,
      rebalanced,
      method: rebalanceMethod,
      totalValue: currentTotalValue,
      newInvestment: newAmount
    });

    toast({
      title: "✅ تم حساب إعادة التوازن",
      description: `تم اقتراح توزيع $${newAmount.toFixed(2)}`
    });
  };

  const copyToClipboard = () => {
    if (!result) return;

    const text = result.rebalanced
      .map(a => `${a.symbol}: $${a.suggestedAmount?.toFixed(2)} (${a.newPercentage?.toFixed(1)}%)`)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p>جاري تحميل محفظتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-right mb-2 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              📊 موازنة المحفظة
            </h1>
            <p className="text-muted-foreground text-right">
              حلل محفظتك واحصل على توصيات لإعادة توازن استثماراتك
            </p>
          </div>
          <NavLink to="/">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
          </NavLink>
        </div>

        {/* عرض المحفظة الحالية */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-right">💼 محفظتك الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio.length === 0 ? (
              <p className="text-center text-muted-foreground">لا توجد أرصدة في محفظتك</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">العملة</th>
                      <th className="p-2">الرصيد</th>
                      <th className="p-2">السعر الحالي</th>
                      <th className="p-2">القيمة الإجمالية</th>
                      <th className="p-2">النسبة %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map(asset => (
                      <tr key={asset.symbol} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-semibold">{asset.symbol}</td>
                        <td className="p-2">{asset.total.toFixed(4)}</td>
                        <td className="p-2">${asset.currentPrice.toFixed(2)}</td>
                        <td className="p-2 font-semibold">${asset.value.toFixed(2)}</td>
                        <td className="p-2">{asset.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 font-semibold">
                      <td className="p-2" colSpan={3}>إجمالي القيمة</td>
                      <td className="p-2">${portfolio.reduce((sum, a) => sum + a.value, 0).toFixed(2)}</td>
                      <td className="p-2">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* خيارات إعادة التوازن */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-right">⚙️ إعادة التوازن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* طريقة التوازن */}
              <div>
                <label className="text-sm font-semibold block mb-3 text-right">🎯 اختر طريقة التوازن:</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: "balance", label: "📊 توازن النسب", desc: "توزيع حسب نسبة كل عملة" },
                    { value: "growth", label: "📈 نمو متوازن", desc: "الحفاظ على النسب الحالية" },
                    { value: "equal", label: "⚖️ توزيع متساوي", desc: "تقسيم متساوي بين جميع العملات" }
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setRebalanceMethod(method.value)}
                      className={`p-4 rounded-lg border-2 transition text-right ${
                        rebalanceMethod === method.value
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold">{method.label}</div>
                      <div className="text-xs opacity-70">{method.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* إدخال المبلغ */}
              <div>
                <label className="text-sm font-semibold block mb-3 text-right">💵 المبلغ الإضافي للاستثمار:</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={newInvestmentAmount}
                    onChange={(e) => setNewInvestmentAmount(e.target.value)}
                    placeholder="أدخل المبلغ بالدولار"
                    className="flex-1 px-3 py-2 rounded border bg-background"
                  />
                  <Button
                    onClick={calculateRebalance}
                    className="gap-2"
                  >
                    احسب التوازن
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* النتائج */}
        {result && (
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-right">✅ نتائج إعادة التوازن</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      نسخ
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded">
                  <p className="text-sm text-right mb-2">
                    <span className="font-semibold">قيمة محفظتك الحالية:</span> ${result.totalValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-right">
                    <span className="font-semibold">المبلغ المقترح إضافته:</span> ${result.newInvestment.toFixed(2)}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2">العملة</th>
                        <th className="p-2">المبلغ المقترح</th>
                        <th className="p-2">النسبة الجديدة</th>
                        <th className="p-2">التغيير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rebalanced.map(asset => {
                        const change = (asset.newPercentage || 0) - asset.percentage;
                        return (
                          <tr key={asset.symbol} className="border-b hover:bg-muted/30">
                            <td className="p-2 font-semibold">{asset.symbol}</td>
                            <td className="p-2 font-semibold">${asset.suggestedAmount?.toFixed(2)}</td>
                            <td className="p-2">{asset.newPercentage?.toFixed(1)}%</td>
                            <td className={`p-2 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded text-right">
                  <p className="text-sm">
                    <span className="font-semibold">💡 نصيحة:</span> راجع هذه التوصيات شهرياً للحفاظ على التوازن الأمثل لمحفظتك
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PortfolioRebalance;
