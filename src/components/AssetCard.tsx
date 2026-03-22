import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ExternalLink, Calendar, Tag, Loader2, Plus, DollarSign, Wallet, ChevronDown, ChevronUp, Target } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

const getBinanceUrl = (asset: string): string => {
  const symbolMap: Record<string, string> = { USDT: "USDT", USDC: "USDC", BUSD: "BUSD" };
  const symbol = symbolMap[asset] || asset;
  return `https://www.binance.com/en/trade/${symbol}_USDT`;
};

export const AssetCard = ({ asset, total, usdValue, priceChangePercent, currentPrice }: AssetCardProps) => {
  const percentage = priceChangePercent ? parseFloat(priceChangePercent) : 0;
  const isPositive = percentage >= 0;
  const logoUrl = COIN_LOGOS[asset] || "https://cryptologos.cc/logos/generic-crypto-logo.png";
  const { toast } = useToast();

  const { launchDate, category, loading, error } = useCoinMetadata(asset);

  const [boostAmount, setBoostAmount] = useState<string>("");
  const [totalBoost, setTotalBoost] = useState<number>(0);
  const [savedInvestment, setSavedInvestment] = useState<number>(0);
  const [savedTargetProfit, setSavedTargetProfit] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const autoSellTriggeredRef = useRef<boolean>(false);
  const [checkCounter, setCheckCounter] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => { setCheckCounter(prev => prev + 1); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentValue = parseFloat(usdValue);
  const isSoldOrDust = isCoinSold(asset) || isDustCoin(currentValue);

  useEffect(() => {
    if (isSoldOrDust) { setSavedInvestment(0); setSavedTargetProfit(0); setTotalBoost(0); return; }
    const savedBoost = localStorage.getItem(`boost_${asset}`);
    if (savedBoost) setTotalBoost(parseFloat(savedBoost));
    if (asset !== 'USDT') {
      const coinData = getCoinInvestment(asset);
      if (coinData) { setSavedInvestment(coinData.investment); setSavedTargetProfit(coinData.targetProfit); }
      else { setSavedInvestment(0); setSavedTargetProfit(getCoinTargetProfit(asset)); }
    }
  }, [asset, isSoldOrDust]);

  useEffect(() => {
    if (isSoldOrDust || asset === 'USDT' || !savedInvestment || savedInvestment === 0) return;
    if (autoSellTriggeredRef.current) return;
    const autoSellSettings = getAutoSellSettings();
    if (!autoSellSettings.enabled) return;
    const actualProfitPercent = savedInvestment > 0 ? ((currentValue - savedInvestment) / savedInvestment) * 100 : 0;
    const targetPercent = savedTargetProfit > 0 ? savedTargetProfit : autoSellSettings.profitPercent;
    if (actualProfitPercent >= targetPercent) { autoSellTriggeredRef.current = true; handleAutoSell(); }
  }, [asset, usdValue, savedInvestment, savedTargetProfit, isSoldOrDust, checkCounter]);

  const handleAutoSell = async () => {
    if (isSelling || !hasCredentials()) return;
    setIsSelling(true);
    try {
      await sellAsset(asset, parseFloat(total));
      toast({ title: `تم بيع ${asset} تلقائياً!`, description: "تم تنفيذ البيع بنجاح" });
    } catch (error: any) {
      toast({ title: "فشل البيع", description: error.message, variant: "destructive" });
      autoSellTriggeredRef.current = false;
    } finally {
      setIsSelling(false);
    }
  };

  const handleAddBoost = (e: React.MouseEvent) => {
    e.stopPropagation();
    const amount = parseFloat(boostAmount);
    if (amount > 0) {
      const newTotal = totalBoost + amount;
      setTotalBoost(newTotal);
      localStorage.setItem(`boost_${asset}`, newTotal.toString());
      setBoostAmount("");
    }
  };

  const handleResetBoost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTotalBoost(0);
    localStorage.removeItem(`boost_${asset}`);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const handleAssetClick = () => {
    window.open(getBinanceUrl(asset), "_blank");
  };

  // Profit calculation
  const profitValue = savedInvestment > 0 ? currentValue - savedInvestment : 0;
  const profitPercent = savedInvestment > 0 ? ((currentValue - savedInvestment) / savedInvestment) * 100 : 0;
  const targetProfit = getCoinTargetProfit(asset);
  const progressToTarget = targetProfit > 0 ? Math.min((profitPercent / targetProfit) * 100, 100) : 0;

  return (
    <div
      className={cn(
        "asset-card rounded-xl cursor-pointer group animate-fade-in",
        isPositive ? "asset-card-positive" : "asset-card-negative",
        isSoldOrDust && "opacity-50"
      )}
      onClick={handleAssetClick}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Coin logo */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300",
                isPositive ? "bg-emerald-400/30" : "bg-red-400/20"
              )} />
              <div className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                <img
                  src={logoUrl}
                  alt={asset}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-icon text-xs font-bold font-mono text-cyan-400';
                      fallback.textContent = asset.slice(0, 3);
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
            </div>

            {/* Coin name */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-base text-white/90 group-hover:text-cyan-400 transition-colors duration-200">
                  {asset}
                </span>
                <ExternalLink className="w-3 h-3 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {category && (
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{category}</span>
              )}
            </div>
          </div>

          {/* Right side: % change + collapse */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded border font-mono text-xs",
              isPositive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{percentage.toFixed(2)}%</span>
            </div>
            <button
              onClick={handleToggleCollapse}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-cyan-400 transition-all"
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Value row */}
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">قيمة المحفظة</span>
          <span className="stat-number text-lg font-bold text-white/90">
            ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Sold/Dust badge */}
        {isSoldOrDust && asset !== 'USDT' && (
          <div className={cn(
            "flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-mono mb-2",
            isCoinSold(asset)
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          )}>
            <span>{isCoinSold(asset) ? '✓ مباعة' : `غبار < $${DUST_THRESHOLD}`}</span>
            <span className="stat-number">${currentValue.toFixed(2)}</span>
          </div>
        )}

        {/* Investment summary (always visible if set) */}
        {!isSoldOrDust && savedInvestment > 0 && asset !== 'USDT' && (
          <div className="space-y-2 mb-2">
            {/* Profit/Loss row */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">ربح/خسارة</span>
              <div className={cn(
                "flex items-center gap-1 font-mono text-sm",
                profitValue >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                <span className="stat-number">{profitValue >= 0 ? '+' : ''}{profitValue.toFixed(2)}</span>
                <span className="text-[10px] opacity-60">({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Progress to target */}
            {targetProfit > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-white/25">للهدف {targetProfit}%</span>
                  <span className="text-[10px] font-mono text-cyan-400/60">{progressToTarget.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      progressToTarget >= 100
                        ? "bg-emerald-400"
                        : progressToTarget >= 50
                        ? "bg-cyan-400"
                        : "bg-white/20"
                    )}
                    style={{ width: `${progressToTarget}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investment + Total row (compact, always visible) */}
        {!isSoldOrDust && asset !== 'USDT' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/3 rounded-lg border border-white/5 px-2.5 py-2">
              <p className="text-[9px] font-mono text-white/25 uppercase mb-0.5">استثمار</p>
              <p className="stat-number text-sm font-bold text-blue-400/80">${savedInvestment.toLocaleString()}</p>
            </div>
            <div className="bg-white/3 rounded-lg border border-white/5 px-2.5 py-2">
              <p className="text-[9px] font-mono text-white/25 uppercase mb-0.5">هدف</p>
              <p className="stat-number text-sm font-bold text-cyan-400/80">
                {savedInvestment > 0
                  ? `$${((savedInvestment + totalBoost) * (1 + targetProfit / 100)).toFixed(0)}`
                  : '--'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expandable details */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out border-t border-white/5",
        isCollapsed ? "max-h-0 border-transparent" : "max-h-[600px]"
      )}>
        <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>

          {/* Price + Amount */}
          <div className="grid grid-cols-2 gap-2">
            {currentPrice && (
              <div className="bg-white/3 rounded-lg border border-white/5 px-2.5 py-2">
                <p className="text-[9px] font-mono text-white/25 uppercase mb-0.5">السعر</p>
                <p className="stat-number text-xs font-bold text-neon-gold">
                  ${parseFloat(currentPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </p>
              </div>
            )}
            <div className="bg-white/3 rounded-lg border border-white/5 px-2.5 py-2">
              <p className="text-[9px] font-mono text-white/25 uppercase mb-0.5">الكمية</p>
              <p className="stat-number text-xs font-bold text-white/60">{parseFloat(total).toFixed(6)}</p>
            </div>
          </div>

          {/* Coin metadata */}
          {loading ? (
            <div className="flex items-center gap-2 text-white/30">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs font-mono">جاري التحميل...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {category && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/30 text-xs font-mono">
                    <Tag className="w-3 h-3" />
                    الفئة
                  </div>
                  <span className="text-xs font-mono text-cyan-400/70 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/15">
                    {category}
                  </span>
                </div>
              )}
              {launchDate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/30 text-xs font-mono">
                    <Calendar className="w-3 h-3" />
                    الإصدار
                  </div>
                  <span className="text-xs font-mono text-emerald-400/70">{launchDate}</span>
                </div>
              )}
            </div>
          )}

          {/* Investment section */}
          <div className="separator-glow" />
          <div className="bg-blue-500/5 rounded-lg border border-blue-500/15 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-400/70 text-xs font-mono">
                <Wallet className="w-3.5 h-3.5" />
                مبلغ الاستثمار
              </div>
              <span className="stat-number text-sm font-bold text-blue-400">${savedInvestment.toLocaleString()}</span>
            </div>
            {savedInvestment === 0 && (
              <p className="text-[10px] font-mono text-white/20 mt-1">يتم تحديده تلقائياً عند الشراء</p>
            )}
          </div>

          {/* Target profit */}
          {asset !== 'USDT' && (
            <div className="bg-cyan-500/5 rounded-lg border border-cyan-500/15 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-400/70 text-xs font-mono">
                  <Target className="w-3.5 h-3.5" />
                  الهدف ({targetProfit}%)
                </div>
                <span className="stat-number text-sm font-bold text-cyan-400">
                  {savedInvestment > 0
                    ? `$${((savedInvestment + totalBoost) * (1 + targetProfit / 100)).toFixed(2)}`
                    : '--'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Boost section */}
          <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/15 px-3 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-emerald-400/70 text-xs font-mono">
                <DollarSign className="w-3.5 h-3.5" />
                إجمالي التعزيزات
              </div>
              <div className="flex items-center gap-2">
                <span className="stat-number text-sm font-bold text-emerald-400">${totalBoost.toLocaleString()}</span>
                {totalBoost > 0 && (
                  <button
                    onClick={handleResetBoost}
                    className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors font-mono"
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
                placeholder="المبلغ..."
                className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-black/30 border border-white/10 focus:border-emerald-500/40 focus:outline-none text-right text-white/70 placeholder:text-white/20"
              />
              <Button
                size="sm"
                onClick={handleAddBoost}
                disabled={!boostAmount || parseFloat(boostAmount) <= 0}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono px-3"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="bg-purple-500/5 rounded-lg border border-purple-500/15 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-purple-400/70 text-xs font-mono">
                <DollarSign className="w-3.5 h-3.5" />
                المجموع الكلي
              </div>
              <span className="stat-number text-base font-bold text-purple-400">
                ${(savedInvestment + totalBoost).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
