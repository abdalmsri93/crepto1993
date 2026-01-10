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
  
  // 💵 حالة مبلغ الاستثمار الأصلي
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [savedInvestment, setSavedInvestment] = useState<number>(0);
  
  // 📂 حالة طي/توسيع البطاقة (مطوية بشكل افتراضي دائماً)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  
  // 🔄 حالة البيع التلقائي
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const autoSellTriggeredRef = useRef<boolean>(false);
  const [checkCounter, setCheckCounter] = useState<number>(0); // لإجبار الفحص الدوري
  
  // تحميل مبلغ التعزيز المحفوظ عند التحميل
  useEffect(() => {
    const savedBoost = localStorage.getItem(`boost_${asset}`);
    if (savedBoost) {
      setTotalBoost(parseFloat(savedBoost));
    }
    
    // تحميل مبلغ الاستثمار المحفوظ
    const savedInv = localStorage.getItem(`investment_${asset}`);
    if (savedInv) {
      setSavedInvestment(parseFloat(savedInv));
    } else {
      // 💰 للعملات القديمة: إذا كانت قيمتها > $3 ولا يوجد استثمار محفوظ
      // نجلب المبلغ من إعدادات الشراء التلقائي
      const currentValue = parseFloat(usdValue);
      if (currentValue > 3 && asset !== 'USDT') {
        const autoBuyAmount = localStorage.getItem('binance_auto_buy_amount');
        const defaultInvestment = autoBuyAmount ? parseFloat(autoBuyAmount) : 5;
        setSavedInvestment(defaultInvestment);
        localStorage.setItem(`investment_${asset}`, defaultInvestment.toString());
        console.log(`💰 تم تعيين استثمار $${defaultInvestment} للعملة ${asset}`);
      }
    }
  }, [asset, usdValue]);
  
  // ⏰ فحص دوري كل 30 ثانية لضمان عمل البيع التلقائي
  useEffect(() => {
    const interval = setInterval(() => {
      setCheckCounter(prev => prev + 1);
    }, 30000); // كل 30 ثانية
    
    return () => clearInterval(interval);
  }, []);
  
  // 🔄 البيع التلقائي عند وصول الربح للنسبة المطلوبة
  useEffect(() => {
    if (asset === 'USDT' || savedInvestment <= 0 || autoSellTriggeredRef.current || isSelling) return;
    
    const autoSellSettings = getAutoSellSettings();
    const smartTradingSettings = getSmartTradingSettings();
    
    if (!autoSellSettings.enabled || !hasCredentials()) return;
    
    const currentValue = parseFloat(usdValue);
    const profitPercent = ((currentValue - savedInvestment) / savedInvestment) * 100;
    
    // 🎯 استخدام نسبة التداول الذكي إذا كان مفعّلاً، وإلا استخدام النسبة الثابتة
    // getCoinTargetProfit تجلب النسبة المحفوظة وقت الشراء لهذه العملة
    const targetProfitPercent = smartTradingSettings.enabled 
      ? getCoinTargetProfit(asset) 
      : autoSellSettings.profitPercent;
    
    // طباعة حالة الفحص للتتبع
    console.log(`🔍 فحص ${asset}: القيمة $${currentValue.toFixed(2)} | الاستثمار $${savedInvestment} | الربح ${profitPercent.toFixed(2)}% | المطلوب ${targetProfitPercent}%${smartTradingSettings.enabled ? ' (ذكي)' : ''}`);
    
    // التحقق من وصول الربح للنسبة المطلوبة
    if (profitPercent >= targetProfitPercent) {
      console.log(`🎯 ${asset} وصل للربح ${profitPercent.toFixed(2)}% (المطلوب: ${targetProfitPercent}%)`);
      
      // منع التكرار
      autoSellTriggeredRef.current = true;
      setIsSelling(true);
      
      // تنفيذ البيع
      sellAsset(asset).then(result => {
        setIsSelling(false);
        const soldAmount = parseFloat(result.executedQty || '0');
        const soldTotal = parseFloat(result.cummulativeQuoteQty || '0');
        const profit = soldTotal - savedInvestment;
        
        if (result.success) {
          toast({
            title: `✅ تم بيع ${asset} بنجاح!`,
            description: `تم تحويل ${result.executedQty} إلى ${result.cummulativeQuoteQty} USDT (ربح: $${profit.toFixed(2)})`,
          });
          
          // 📜 حفظ في سجل العمليات
          addSellRecord(
            asset,
            soldAmount,
            soldTotal / soldAmount, // السعر
            soldTotal,
            profit,
            profitPercent,
            true
          );
          
          // 🎯 تسجيل البيع في نظام التداول الذكي
          if (smartTradingSettings.enabled) {
            const sellResult = registerSell(asset, profit);
            
            toast({
              title: `💰 تم البيع بنجاح!`,
              description: `النسبة الجديدة للشراء التالي: ${sellResult.newProfitPercent}%`,
            });
            
            // 🔄 تفعيل البحث التلقائي لبدء دورة جديدة
            // إرسال حدث مخصص لتفعيل البحث
            window.dispatchEvent(new CustomEvent('smart-trading-cycle-complete', {
              detail: { newProfitPercent: sellResult.newProfitPercent }
            }));
          }
          
          // مسح مبلغ الاستثمار بعد البيع
          localStorage.removeItem(`investment_${asset}`);
          setSavedInvestment(0);
        } else {
          toast({
            title: `❌ فشل بيع ${asset}`,
            description: result.error,
            variant: "destructive",
          });
          
          // 📜 حفظ العملية الفاشلة في السجل
          addSellRecord(
            asset,
            0,
            0,
            0,
            0,
            0,
            false,
            result.error
          );
          
          autoSellTriggeredRef.current = false; // السماح بإعادة المحاولة
        }
      });
    }
  }, [asset, usdValue, savedInvestment, isSelling, toast, checkCounter]);
  
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
  
  // 💵 حفظ مبلغ الاستثمار الأصلي
  const handleSaveInvestment = (e: React.MouseEvent) => {
    e.stopPropagation();
    const amount = parseFloat(investmentAmount);
    if (amount > 0) {
      setSavedInvestment(amount);
      localStorage.setItem(`investment_${asset}`, amount.toString());
      setInvestmentAmount("");
    }
  };
  
  // إعادة تعيين مبلغ الاستثمار
  const handleResetInvestment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedInvestment(0);
    localStorage.removeItem(`investment_${asset}`);
  };
  
  // 📂 تبديل حالة الطي/التوسيع
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
              <p className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">عملة رقمية</p>
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
          {(savedInvestment > 0 || totalBoost > 0) && (
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
              
              {/* 💵 قسم مبلغ الاستثمار الأصلي */}
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
                    <Wallet className="w-4 h-4" />
                    مبلغ الاستثمار
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron text-blue-400 font-bold text-lg">
                      ${savedInvestment.toLocaleString()}
                    </span>
                    {savedInvestment > 0 && (
                      <button
                        onClick={handleResetInvestment}
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
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="أدخل المبلغ..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-background/50 border border-blue-500/30 focus:border-blue-500 focus:outline-none text-right"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveInvestment}
                    disabled={!investmentAmount || parseFloat(investmentAmount) <= 0}
                    className="bg-blue-500 hover:bg-blue-600 text-white gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    حفظ
                  </Button>
                </div>
              </div>
              
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
