import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Heart, ArrowRight, Trophy, Star, Trash2, ShoppingCart, DollarSign, Settings, CheckCircle2, XCircle, Loader2, AlertTriangle, Zap, TrendingUp, History, Brain, Target, Repeat } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { CoinLaunchDate } from "@/components/CoinLaunchDate";
import { CoinProject } from "@/components/CoinProject";
import { CoinCategory } from "@/components/CoinCategory";
import { getCoinLaunchDateISO } from "@/hooks/useCoinMetadata";
import { hasCredentials, getAutoSellSettings, saveAutoSellSettings } from "@/services/binanceTrading";
import { useToast } from "@/hooks/use-toast";
import { 
  getSmartTradingSettings, 
  saveSmartTradingSettings, 
  getSmartTradingSummary,
  resetSmartTradingState,
  syncPortfolioWithSmartTrading,
  getPendingCoins,
  getCoinTargetProfit
} from "@/services/smartTradingService";
import { getCoinInvestment } from "@/services/investmentBackupService";

const Favorites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    favorites, 
    removeFavorite, 
    count, 
    isLoading,
    // 🛒 الشراء التلقائي
    autoBuySettings,
    updateAutoBuySettings,
    isAutoBuying,
    lastAutoBuyResult,
    isAutoBuyReady,
  } = useFavorites();
  
  // حالة إعدادات الشراء التلقائي
  const [showAutoBuySettings, setShowAutoBuySettings] = useState(false);
  const [tempAmount, setTempAmount] = useState(String(autoBuySettings.amount));
  const hasApiKeys = hasCredentials();
  
  // 📈 حالة إعدادات البيع التلقائي
  const [autoSellSettings, setAutoSellSettings] = useState(getAutoSellSettings);
  const [tempProfitPercent, setTempProfitPercent] = useState(String(autoSellSettings.profitPercent));

  // 🎯 حالة التداول الذكي
  const [smartTradingSettings, setSmartTradingSettings] = useState(getSmartTradingSettings);
  const [smartTradingSummary, setSmartTradingSummary] = useState(getSmartTradingSummary);
  const [showSmartSettings, setShowSmartSettings] = useState(false);

  // تحديث ملخص التداول الذكي كل 10 ثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setSmartTradingSummary(getSmartTradingSummary());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // عرض إشعار عند نتيجة الشراء التلقائي
  useEffect(() => {
    if (lastAutoBuyResult) {
      if (lastAutoBuyResult.success) {
        toast({
          title: "✅ تم الشراء بنجاح!",
          description: `تم شراء ${lastAutoBuyResult.executedQty} من ${lastAutoBuyResult.symbol} بسعر ${lastAutoBuyResult.avgPrice}`,
        });
      } else {
        toast({
          title: "❌ فشل الشراء",
          description: lastAutoBuyResult.error || "حدث خطأ أثناء الشراء",
          variant: "destructive",
        });
      }
    }
  }, [lastAutoBuyResult, toast]);

  // ترتيب المفضلات حسب تاريخ الإطلاق (الأحدث أولاً)
  const sortedFavoritesByLaunchDate = useMemo(() => {
    return [...favorites].sort((a, b) => {
      const dateA = getCoinLaunchDateISO(a.symbol);
      const dateB = getCoinLaunchDateISO(b.symbol);
      
      // العملات بدون تاريخ تأتي في النهاية
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      // ترتيب تنازلي (الأحدث أولاً)
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [favorites]);

  // حفظ مبلغ الشراء
  const handleSaveAmount = () => {
    const amount = parseFloat(tempAmount);
    if (amount >= 5) {
      updateAutoBuySettings({ amount });
      toast({
        title: "✅ تم الحفظ",
        description: `مبلغ الشراء التلقائي: $${amount}`,
      });
    } else {
      toast({
        title: "⚠️ خطأ",
        description: "الحد الأدنى للشراء هو $5",
        variant: "destructive",
      });
    }
  };

  // تفعيل/إيقاف الشراء التلقائي
  const handleToggleAutoBuy = (enabled: boolean) => {
    if (enabled && !hasApiKeys) {
      toast({
        title: "⚠️ مطلوب إعداد API",
        description: "يجب إعداد مفاتيح Binance API أولاً",
        variant: "destructive",
      });
      navigate('/trading-settings');
      return;
    }

    updateAutoBuySettings({ enabled });

    if (enabled) {
      toast({
        title: "🛒 تم التفعيل",
        description: `سيتم شراء $${autoBuySettings.amount} تلقائياً عند إضافة عملة جديدة`,
      });
    } else {
      toast({
        title: "⏸️ تم الإيقاف",
        description: "تم إيقاف الشراء التلقائي",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crypto-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* الرأس */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-orbitron flex items-center justify-center gap-3">
            <Star className="w-8 h-8 text-crypto-gold fill-crypto-gold" />
            مفضلاتي
          </h1>
          <p className="text-muted-foreground">
            {count} عملة محفوظة
          </p>
        </div>

        {/* 📜 زر سجل العمليات */}
        <Card className="border-2 border-blue-500/30 bg-blue-500/5 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-semibold">سجل العمليات</p>
                <p className="text-xs text-muted-foreground">عرض جميع عمليات الشراء والبيع</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/trade-history')}
              className="bg-blue-500 hover:bg-blue-600 gap-2"
            >
              <History className="w-4 h-4" />
              فتح السجل
            </Button>
          </CardContent>
        </Card>

        {/* 🛒 بطاقة الشراء التلقائي */}
        <Card className="border-2 border-green-500/50 bg-green-500/5 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5 text-green-500" />
                الشراء التلقائي
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  مفعل
                </span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAutoBuySettings(!showAutoBuySettings)}
                className="gap-1"
              >
                <Settings className="w-4 h-4" />
                إعدادات
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* الحالة */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-green-500">جاهز للشراء عند إضافة عملة جديدة</span>
              </div>
              <div className="flex items-center gap-1 text-crypto-gold font-bold">
                <DollarSign className="w-4 h-4" />
                {autoBuySettings.amount} USDT
              </div>
            </div>

            {/* حالة API */}
            {!hasApiKeys && (
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">مفاتيح API غير مُعدة</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/trading-settings')}
                  className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                >
                  إعداد الآن
                </Button>
              </div>
            )}

            {/* إشعار الشراء */}
            {isAutoBuying && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-pulse">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-blue-500">جاري تنفيذ الشراء...</span>
              </div>
            )}

            {/* نتيجة آخر شراء */}
            {lastAutoBuyResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                lastAutoBuyResult.success 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {lastAutoBuyResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">
                      تم شراء {lastAutoBuyResult.executedQty} من {lastAutoBuyResult.symbol}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">
                      فشل: {lastAutoBuyResult.error}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* إعدادات المبلغ */}
            {showAutoBuySettings && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-primary/10">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-crypto-gold" />
                  مبلغ الشراء لكل عملة
                </h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="5"
                    step="1"
                    value={tempAmount}
                    onChange={(e) => setTempAmount(e.target.value)}
                    className="flex-1"
                    placeholder="المبلغ بـ USDT"
                  />
                  <Button onClick={handleSaveAmount} className="bg-crypto-gold hover:bg-crypto-gold/90">
                    حفظ
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  الحد الأدنى: $5 • عند إضافة أي عملة للمفضلة سيتم شراؤها تلقائياً بهذا المبلغ
                </p>
                
                {/* أزرار المبالغ السريعة */}
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 20, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant={parseFloat(tempAmount) === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTempAmount(String(amount))}
                      className={parseFloat(tempAmount) === amount ? "bg-crypto-gold" : ""}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 📈 بطاقة البيع التلقائي عند الربح */}
        <Card className="border-2 border-purple-500/50 bg-purple-500/5 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              البيع التلقائي عند الربح
              <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                مفعل
              </span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-purple-500">البيع يتم تلقائياً حسب النسب المتصاعدة</span>
              </div>
              <div className="flex items-center gap-1 text-purple-400 font-bold">
                <Target className="w-4 h-4" />
                {smartTradingSummary.currentProfitPercent}%
              </div>
            </div>

            {/* عرض النسبة الحالية من النظام الذكي */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-purple-500/20">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                نسبة الربح للعملة القادمة (تلقائي)
              </h4>
              
              {/* النسبة الحالية الكبيرة */}
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-purple-400">
                  {smartTradingSummary.currentProfitPercent}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  النسبة المستهدفة للعملة القادمة
                </p>
              </div>
              
              {/* شريط التقدم المرئي */}
              <div className="flex items-center justify-between gap-1 text-xs">
                {[3, 5, 7, 9, 11, 13, 15].map((percent) => (
                  <div
                    key={percent}
                    className={`flex-1 text-center py-2 rounded transition-all ${
                      smartTradingSummary.currentProfitPercent === percent
                        ? 'bg-purple-500 text-white font-bold scale-110'
                        : smartTradingSummary.currentProfitPercent > percent
                        ? 'bg-purple-500/30 text-purple-300'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {percent}%
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                🔄 النسبة تزداد +2% مع كل عملة جديدة، وترجع لـ 3% بعد 15%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 🎯 بطاقة التداول الذكي */}
        <Card className="border-2 border-orange-500/50 bg-orange-500/5 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-orange-500" />
                التداول الذكي
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  مفعل
                </span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSmartSettings(!showSmartSettings)}
                className="gap-1"
              >
                <Settings className="w-4 h-4" />
                إعدادات
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* ملخص الحالة الحالية */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">الدورة الحالية</p>
                  <p className="text-xl font-bold text-orange-500">#{smartTradingSummary.currentCycle}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">نسبة الربح</p>
                  <p className="text-xl font-bold text-green-500">{smartTradingSummary.currentProfitPercent}%</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">المباعة/المطلوب</p>
                  <p className="text-xl font-bold text-blue-500">{smartTradingSummary.soldInCycle}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                  <p className="text-xl font-bold text-purple-500">{smartTradingSummary.pendingCoins}</p>
                </div>
              </div>

            {/* شرح النظام */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4 text-orange-500" />
              <span>النسب تتصاعد: 5% → 10% → 15% ... → 100% → 5%</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat className="w-4 h-4 text-orange-500" />
              <span>بعد كل عملية بيع تزداد النسبة 5% • الحد الأقصى: {smartTradingSettings.maxPortfolioCoins} عملة</span>
            </div>

            {/* إعدادات التداول الذكي */}
            {showSmartSettings && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 border border-primary/10">
                <h4 className="font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-orange-500" />
                  إعدادات التداول الذكي
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">الحد الأقصى للمحفظة</label>
                    <Input
                      type="number"
                      min="10"
                      max="100"
                      value={smartTradingSettings.maxPortfolioCoins}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 50;
                        saveSmartTradingSettings({ maxPortfolioCoins: value });
                        setSmartTradingSettings(prev => ({ ...prev, maxPortfolioCoins: value }));
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">زيادة النسبة بعد كل بيع</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={smartTradingSettings.profitIncrement}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 5;
                        saveSmartTradingSettings({ profitIncrement: value });
                        setSmartTradingSettings(prev => ({ ...prev, profitIncrement: value }));
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const result = syncPortfolioWithSmartTrading();
                      setSmartTradingSummary(getSmartTradingSummary());
                      toast({
                        title: result.synced.length > 0 ? "🔄 تم المزامنة" : "ℹ️ لا توجد عملات",
                        description: result.message,
                      });
                    }}
                    className="text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                  >
                    🔄 مزامنة العملات
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetSmartTradingState();
                      setSmartTradingSummary(getSmartTradingSummary());
                      toast({
                        title: "🔄 تم إعادة التعيين",
                        description: "تم إعادة تعيين الدورة والنسبة إلى البداية",
                      });
                    }}
                    className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                  >
                    إعادة تعيين الدورات
                  </Button>
                </div>

                {/* عرض العملات المعلقة */}
                {getPendingCoins().length > 0 && (
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <p className="text-xs text-purple-400">
                      العملات قيد الانتظار: {getPendingCoins().join(', ')}
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  💡 بعد كل عملية بيع تزداد النسبة {smartTradingSettings.profitIncrement}%، وعند 100% ترجع لـ 5%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* إذا كانت المفضلات فارغة */}
        {count === 0 ? (
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4 text-lg">
                لم تضف أي عملات إلى المفضلات بعد
              </p>
              <Button
                onClick={() => navigate("/suggest-coins")}
                className="bg-gradient-to-r from-crypto-gold to-orange-500 hover:shadow-lg hover:shadow-crypto-gold/20"
              >
                <span className="ml-2">🔍</span>
                ابدأ البحث عن عملات
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-orbitron flex items-center gap-2">
                <Trophy className="w-6 h-6 text-crypto-gold" />
                العملات المحفوظة ({count})
                <span className="text-sm font-normal text-muted-foreground mr-2">
                  • مرتبة بتاريخ الإطلاق (الأحدث أولاً)
                </span>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/suggest-coins")}
                className="gap-2 border-primary/20 hover:border-crypto-gold"
              >
                <span>➕</span>
                إضافة عملات
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedFavoritesByLaunchDate.map((coin, index) => (
                <Card
                  key={coin.symbol}
                  className="border-primary/20 hover:border-crypto-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-crypto-gold/20 overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="text-right space-y-3">
                      {/* الرمز والعدد */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFavorite(coin.symbol)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1 rounded transition"
                            title="حذف من المفضلة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {/* رقم الترتيب */}
                          <div className="bg-gradient-to-r from-crypto-gold to-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <div className="text-right">
                            <div className="font-bold text-lg text-crypto-gold">
                              {coin.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {coin.name}
                            </div>
                          </div>
                          
                          {/* 🎯 نسبة البيع والهدف */}
                          {(() => {
                            // إزالة USDT من نهاية الرمز
                            const cleanSymbol = coin.symbol.replace(/USDT$/i, '');
                            const investmentData = getCoinInvestment(cleanSymbol);
                            const investment = investmentData?.investment || 0;
                            const targetPercent = getCoinTargetProfit(cleanSymbol);
                            const targetValue = investment > 0 ? investment * (1 + targetPercent / 100) : 0;
                            
                            return investment > 0 ? (
                              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30 px-3 py-2 min-w-[90px]">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] text-green-400">🎯 نسبة البيع</span>
                                  <span className="text-green-400 font-bold text-sm">{targetPercent}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-emerald-400">💰 الهدف</span>
                                  <span className="text-emerald-400 font-bold text-sm">${targetValue.toFixed(2)}</span>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      {/* السعر */}
                      {coin.price && (
                        <div className="flex justify-between items-end text-sm">
                          <span className="text-muted-foreground/80">💰 السعر:</span>
                          <span className="font-semibold text-crypto-gold">
                            ${coin.price}
                          </span>
                        </div>
                      )}

                      {/* النمو */}
                      {coin.priceChange !== undefined && (
                        <div className="flex justify-between items-end text-sm">
                          <span className="text-muted-foreground/80">📈 تغير 24س:</span>
                          <span
                            className={`font-semibold ${
                              coin.priceChange >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {coin.priceChange > 0 ? "+" : ""}
                            {coin.priceChange?.toFixed(2)}%
                          </span>
                        </div>
                      )}

                      {/* تاريخ إصدار العملة */}
                      <CoinLaunchDate symbol={coin.symbol} />

                      {/* فئة العملة */}
                      <CoinCategory symbol={coin.symbol} />

                      {/* وصف مشروع العملة */}
                      <CoinProject symbol={coin.symbol} />

                      {/* تاريخ الإضافة */}
                      {coin.addedAt && (
                        <div className="text-xs text-muted-foreground/60 border-t border-primary/20 pt-2">
                          أضيفت في:{" "}
                          {new Date(coin.addedAt).toLocaleDateString("ar-SA")}
                        </div>
                      )}

                      {/* أزرار الإجراءات */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8"
                          onClick={() => {
                            // إزالة USDT من نهاية الرمز إذا كان موجوداً
                            const baseSymbol = coin.symbol.replace(/USDT$/i, '');
                            window.open(
                              `https://www.binance.com/en/trade/${baseSymbol}_USDT`,
                              "_blank"
                            );
                          }}
                        >
                          📊 Binance
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs h-8 bg-gradient-to-r from-primary/50 to-secondary/50"
                          onClick={() => navigate(`/project/${coin.symbol}`)}
                        >
                          📋 تفاصيل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* زر العودة */}
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="border-primary/20 hover:border-crypto-gold/50"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمحفظة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Favorites;
