import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ExternalLink, Calendar, Tag, Loader2, Plus, DollarSign, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { useCoinMetadata } from "@/hooks/useCoinMetadata";
import { getAutoSellSettings, sellAsset, hasCredentials } from "@/services/binanceTrading";
import { addSellRecord } from "@/services/tradeHistory";
import { useToast } from "@/hooks/use-toast";
import { 
  getSmartTradingSettings, 
  registerSell, 
  getCurrentProfitPercent,
  getCoinTargetProfit
} from "@/services/smartTradingService";
import { getCoinInvestment, removeCoinInvestment, isCoinSold, isDustCoin, DUST_THRESHOLD } from "@/services/investmentBackupService";

interface AssetCardProps {
  asset: string;
  total: string;
  usdValue: string;
  priceChangePercent?: string;
  currentPrice?: string;
}

const COIN_LOGOS: Record<string, string> = {
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  BNB: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
  ADA: "https://cryptologos.cc/logos/cardano-ada-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
  DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
};

// دالة لإنشاء رابط Binance للعملة
const getBinanceUrl = (asset: string): string => {
  // معالجة الأصول الخاصة (مثل BUSD، USDT)
  const symbolMap: Record<string, string> = {
    USDT: "USDT",
    USDC: "USDC",
    BUSD: "BUSD",
  };
  
  const symbol = symbolMap[asset] || asset;
  return `https://www.binance.com/en/trade/${symbol}_USDT`;
};

export const AssetCard = ({ asset, total, usdValue, priceChangePercent, currentPrice }: AssetCardProps) => {
  const percentage = priceChangePercent ? parseFloat(priceChangePercent) : 0;
  const isPositive = percentage >= 0;
  const logoUrl = COIN_LOGOS[asset] || "https://cryptologos.cc/logos/generic-crypto-logo.png";
  const { toast } = useToast();
  
  // جلب بيانات العملة من الـ APIs
  const { launchDate, category, loading, error } = useCoinMetadata(asset);
  
  // 💰 حالة مبلغ التعزيز التراكمي
  const [boostAmount, setBoostAmount] = useState<string>("");
  const [totalBoost, setTotalBoost] = useState<number>(0);
  
  // 💵 حالة مبلغ الاستثمار الأصلي (للقراءة فقط - يتم جلبه تلقائياً)
  const [savedInvestment, setSavedInvestment] = useState<number>(0);
  
  // 🎯 نسبة الربح المستهدفة (للقراءة فقط)
  const [savedTargetProfit, setSavedTargetProfit] = useState<number>(0);
  
  // 📂 حالة طي/توسيع البطاقة (مطوية بشكل افتراضي دائماً)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  
  // 🔄 حالة البيع التلقائي
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const autoSellTriggeredRef = useRef<boolean>(false);
  const [checkCounter, setCheckCounter] = useState<number>(0); // لإجبار الفحص الدوري
  
  // ⏰ فحص دوري كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      setCheckCounter(prev => prev + 1);
    }, 30000); // 30 ثانية
    
    return () => clearInterval(interval);
  }, []);
  
  // 🔍 التحقق إذا كانت العملة مباعة أو غبار
  const currentValue = parseFloat(usdValue);
  const isSoldOrDust = isCoinSold(asset) || isDustCoin(currentValue);
  
  // 🔄 تحميل البيانات من النسخة الاحتياطية عند التحميل
  useEffect(() => {
    // ❌ لا نحمل بيانات العملات المباعة أو الغبار
    if (isSoldOrDust) {
      setSavedInvestment(0);
      setSavedTargetProfit(0);
      setTotalBoost(0);
      return;
    }
    
    // تحميل مبلغ التعزيز
    const savedBoost = localStorage.getItem(`boost_${asset}`);
    if (savedBoost) {
      setTotalBoost(parseFloat(savedBoost));
    }
    
    // 🔒 تحميل بيانات الاستثمار من النسخة الاحتياطية (أو localStorage)
    if (asset !== 'USDT') {
      const coinData = getCoinInvestment(asset);
      if (coinData) {
        setSavedInvestment(coinData.investment);
        setSavedTargetProfit(coinData.targetProfit);
        console.log(`✅ تم تحميل بيانات ${asset}: $${coinData.investment}, ${coinData.targetProfit}%`);
      } else {
        // للعملات الجديدة بدون بيانات
        setSavedInvestment(0);
        setSavedTargetProfit(getCoinTargetProfit(asset));
      }
    }
  }, [asset, isSoldOrDust]);
  
  // 🎯 البيع التلقائي عند الوصول لنسبة الربح المستهدفة
  useEffect(() => {
    // تخطي العملات المباعة أو الغبار أو USDT
    if (isSoldOrDust || asset === 'USDT' || !savedInvestment || savedInvestment === 0) {
      return;
    }
    
    // تخطي إذا تم التشغيل مسبقاً
    if (autoSellTriggeredRef.current) {
      return;
    }
    
    // التحقق من تفعيل البيع التلقائي
    const autoSellSettings = getAutoSellSettings();
    if (!autoSellSettings.enabled) {
      return;
    }
    
    // حساب نسبة الربح الفعلية
    const currentValue = parseFloat(usdValue);
    const actualProfitPercent = savedInvestment > 0 
      ? ((currentValue - savedInvestment) / savedInvestment) * 100 
      : 0;
    
    // استخدام نسبة الربح المخصصة من Smart Trading
    const targetPercent = savedTargetProfit > 0 ? savedTargetProfit : autoSellSettings.profitPercent;
    
    console.log(`📊 ${asset}: الربح ${actualProfitPercent.toFixed(2)}% / المستهدف ${targetPercent}%`);
    
    // البيع عند الوصول للنسبة المستهدفة
    if (actualProfitPercent >= targetPercent) {
      console.log(`🎯 ${asset} وصل ${actualProfitPercent.toFixed(2)}% - بدء البيع التلقائي!`);
      autoSellTriggeredRef.current = true;
      handleAutoSell();
    }
  }, [asset, usdValue, savedInvestment, savedTargetProfit, isSoldOrDust, checkCounter]);
  
  // وظيفة البيع التلقائي
  const handleAutoSell = async () => {
    if (isSelling || !hasCredentials()) return;
    
    setIsSelling(true);
    try {
      console.log(`💰 بيع تلقائي: ${asset}`);
      await sellAsset(asset, parseFloat(balance));
      toast.success(`تم بيع ${asset} تلقائياً بنجاح! 🎉`);
    } catch (error: any) {
      console.error('خطأ في البيع التلقائي:', error);
      toast.error(`فشل البيع التلقائي: ${error.message}`);
      autoSellTriggeredRef.current = false; // إعادة المحاولة
    } finally {
      setIsSelling(false);
    }
  };
  
  // إضافة مبلغ تعزيز جديد
  const handleAddBoost = (e: React.MouseEvent) => {
    e.stopPropagation(); // منع فتح رابط Binance
    const amount = parseFloat(boostAmount);
    if (amount > 0) {
      const newTotal = totalBoost + amount;
      setTotalBoost(newTotal);
      localStorage.setItem(`boost_${asset}`, newTotal.toString());
      setBoostAmount("");
    }
  };
  
  // إعادة تعيين مبلغ التعزيز
  const handleResetBoost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTotalBoost(0);
    localStorage.removeItem(`boost_${asset}`);
  };
  
  //  تبديل حالة الطي/التوسيع
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };
  
  const handleAssetClick = () => {
    const binanceUrl = getBinanceUrl(asset);
    window.open(binanceUrl, "_blank");
  };
  
  return (
    <Card className="glass-card hover:bg-card/80 transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:shadow-primary/30 border-primary/40 animate-fade-in cursor-pointer group relative overflow-hidden" onClick={handleAssetClick}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-crypto-gold/20 to-crypto-green/20 rounded-full filter blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center transition-all duration-300 hover:scale-125 group hover:shadow-lg hover:shadow-primary/50 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-crypto-gold/30 to-crypto-green/30 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
              <img 
                src={logoUrl} 
                alt={asset}
                className="w-8 h-8 relative z-10 group-hover:drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                onError={(e) => {
                  // إخفاء الصورة عند الخطأ وإظهار الحرف الأول بدلاً منها
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-icon w-8 h-8 rounded-full bg-gradient-to-r from-crypto-gold to-crypto-green flex items-center justify-center text-black font-bold text-sm';
                    fallback.textContent = asset.charAt(0);
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-bold text-lg group-hover:text-crypto-gold transition-colors">{asset}</h3>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                عملة رقمية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 ${isPositive ? 'bg-crypto-green/10 text-crypto-green' : 'bg-red-500/10 text-red-500'}`}>
              <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'} transition-transform duration-300`} />
              <span className="font-orbitron">{isPositive ? '+' : ''}{percentage.toFixed(2)}%</span>
            </div>
            {/* زر الطي/التوسيع */}
            <button
              onClick={handleToggleCollapse}
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-300 hover:scale-110"
              title={isCollapsed ? "توسيع" : "طي"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* القيمة الإجمالية - تظهر دائماً */}
          <div className="flex justify-between items-end bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-3 rounded-lg border border-primary/20">
            <span className="text-muted-foreground/80 text-sm font-medium">القيمة الإجمالية</span>
            <span className="font-orbitron text-crypto-gold text-lg font-black transition-all duration-300 group-hover:scale-125 origin-right inline-block">
              ${parseFloat(usdValue).toLocaleString()}
            </span>
          </div>
          
          {/* 💎 قسم المجموع الكلي - يظهر دائماً */}
          {isSoldOrDust && asset !== 'USDT' ? (
            <div className="p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
                  {isCoinSold(asset) ? '✅ عملة مباعة' : '🧹 غبار'}
                </div>
                <span className="font-orbitron text-amber-400 font-bold text-lg">
                  ${currentValue.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1 text-right">
                {isCoinSold(asset) ? 'تم البيع بنجاح سابقاً' : `قيمة أقل من $${DUST_THRESHOLD}`}
              </p>
            </div>
          ) : (savedInvestment > 0 || totalBoost > 0) ? (
            <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-purple-400 text-sm font-semibold">
                  <DollarSign className="w-4 h-4" />
                  المجموع الكلي
                </div>
                <span className="font-orbitron text-purple-400 font-bold text-xl">
                  ${(savedInvestment + totalBoost).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1 text-right">
                الاستثمار + التعزيزات
              </p>
            </div>
          ) : asset !== 'USDT' && (
            <div className="p-3 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-lg border border-gray-500/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm font-semibold">
                  <DollarSign className="w-4 h-4" />
                  المجموع الكلي
                </div>
                <span className="font-orbitron text-gray-400 font-bold text-xl">
                  $0
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1 text-right">
                لم يتم تحديد استثمار
              </p>
            </div>
          )}
          
          {/* 🎯 قسم نسبة البيع والهدف - لا يظهر للعملات المباعة/الغبار */}
          {!isSoldOrDust && savedInvestment > 0 && asset !== 'USDT' ? (
            <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
                  🎯 نسبة البيع
                </div>
                <span className="font-orbitron text-green-400 font-bold text-lg">
                  {getCoinTargetProfit(asset)}%
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                  💰 الهدف
                </div>
                <span className="font-orbitron text-emerald-400 font-bold text-lg">
                  ${((savedInvestment + totalBoost) * (1 + getCoinTargetProfit(asset) / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          ) : !isSoldOrDust && asset !== 'USDT' && (
            <div className="p-3 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-lg border border-gray-500/30">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm font-semibold">
                  🎯 نسبة البيع
                </div>
                <span className="font-orbitron text-gray-400 font-bold text-lg">
                  --
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm font-semibold">
                  💰 الهدف
                </div>
                <span className="font-orbitron text-gray-400 font-bold text-lg">
                  --
                </span>
              </div>
            </div>
          )}
          
          {/* التفاصيل القابلة للطي */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            <div className="space-y-3 pt-2">
              {currentPrice && (
                <div className="flex justify-between items-end pb-3 border-b border-primary/20 hover:border-primary/40 transition-colors">
                  <span className="text-muted-foreground/80 text-sm font-medium">السعر الحالي</span>
                  <span className="font-orbitron text-crypto-gold font-bold group-hover:scale-110 transition-transform origin-right inline-block">
                    ${parseFloat(currentPrice).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </span>
                </div>
              )}
              
              {/* 🎯 نسبة البيع المستهدفة */}
              {asset !== 'USDT' && !isSoldOrDust && (
                <div className="flex justify-between items-end pb-3 border-b border-green-500/30 hover:border-green-500/50 transition-colors bg-green-500/5 px-3 py-2.5 rounded-lg">
                  <span className="text-green-400/90 text-sm font-medium flex items-center gap-1.5">
                    🎯 نسبة البيع
                  </span>
                  <span className="font-orbitron text-green-400 font-bold text-lg group-hover:scale-110 transition-transform origin-right inline-block">
                    {savedTargetProfit > 0 ? `${savedTargetProfit}%` : `${getCoinTargetProfit(asset)}%`}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-end hover:bg-primary/5 px-2 py-2 rounded transition-colors">
                <span className="text-muted-foreground/80 text-sm font-medium">الكمية</span>
                <span className="font-orbitron text-foreground font-semibold">
                  {parseFloat(total).toFixed(8)}
                </span>
              </div>
              
              {/* الفئة وتاريخ الإصدار */}
              {loading ? (
                <div className="flex justify-center items-center py-3 px-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
                  <span className="text-xs text-muted-foreground">جاري التحميل...</span>
                </div>
              ) : !launchDate && !category ? (
                <div className="flex justify-between items-end hover:bg-primary/5 px-2 py-2 rounded transition-colors">
                  <span className="text-muted-foreground/80 text-sm font-medium">معلومات</span>
                  <span className="text-xs text-amber-500 font-semibold">
                    غير متوفر
                  </span>
                </div>
              ) : (
                <>
                  {category && (
                    <div className="flex justify-between items-end hover:bg-primary/5 px-2 py-2 rounded transition-colors">
                      <div className="flex items-center gap-1.5 text-muted-foreground/80 text-sm font-medium">
                        <Tag className="w-3.5 h-3.5" />
                        الفئة
                      </div>
                      <span className="bg-gradient-to-r from-primary/20 to-secondary/20 px-2.5 py-1 rounded-full text-xs font-semibold text-primary">
                        {category}
                      </span>
                    </div>
                  )}
                  
                  {launchDate && (
                    <div className="flex justify-between items-end hover:bg-primary/5 px-2 py-2 rounded transition-colors">
                      <div className="flex items-center gap-1.5 text-muted-foreground/80 text-sm font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        تاريخ الإصدار
                      </div>
                      <span className="font-orbitron text-crypto-green text-sm font-semibold">
                        {launchDate}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {/* 💵 قسم مبلغ الاستثمار الأصلي - للقراءة فقط */}
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/30">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
                    <Wallet className="w-4 h-4" />
                    مبلغ الاستثمار
                  </div>
                  <span className="font-orbitron text-blue-400 font-bold text-lg">
                    ${savedInvestment.toLocaleString()}
                  </span>
                </div>
                {savedInvestment === 0 && (
                  <p className="text-xs text-muted-foreground/60 mt-1 text-right">
                    🔒 يتم تحديده تلقائياً عند الشراء
                  </p>
                )}
              </div>
              
              {/* 🎯 قسم نسبة الربح - للقراءة فقط */}
              {asset !== 'USDT' && (
                <div className="mt-3 p-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-lg border border-orange-500/30">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-orange-400 text-sm font-semibold">
                      🎯 نسبة الربح المستهدفة
                    </div>
                    <span className="font-orbitron text-orange-400 font-bold text-lg">
                      {savedTargetProfit > 0 ? `${savedTargetProfit}%` : '--'}
                    </span>
                  </div>
                  {savedTargetProfit === 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-1 text-right">
                      🔒 يتم تحديدها تلقائياً عند الشراء
                    </p>
                  )}
                </div>
              )}
              
              {/* 💰 قسم مبلغ التعزيز */}
              <div className="mt-3 p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-500/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                    <DollarSign className="w-4 h-4" />
                    إجمالي التعزيزات
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron text-emerald-400 font-bold text-lg">
                      ${totalBoost.toLocaleString()}
                    </span>
                    {totalBoost > 0 && (
                      <button
                        onClick={handleResetBoost}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        title="إعادة تعيين"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={boostAmount}
                    onChange={(e) => setBoostAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="أدخل المبلغ..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-background/50 border border-emerald-500/30 focus:border-emerald-500 focus:outline-none text-right"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddBoost}
                    disabled={!boostAmount || parseFloat(boostAmount) <= 0}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة
                  </Button>
                </div>
              </div>
              
              {/* 💎 قسم المجموع الكلي - داخل القسم القابل للطي */}
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-purple-400 text-sm font-semibold">
                    <DollarSign className="w-4 h-4" />
                    المجموع الكلي
                  </div>
                  <span className="font-orbitron text-purple-400 font-bold text-xl">
                    ${(savedInvestment + totalBoost).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-1 text-right">
                  الاستثمار + التعزيزات
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
