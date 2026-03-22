import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, WifiOff, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioHeaderProps {
  totalValue: string;
  lastUpdate: string;
  onRefresh: () => void;
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'testing' | 'unknown';
  onTestConnection: () => void;
  totalDayPnL?: string;
  dayPnLPercent?: string;
}

export const PortfolioHeader = ({
  totalValue,
  lastUpdate,
  onRefresh,
  isLoading,
  connectionStatus,
  onTestConnection,
  totalDayPnL = '0',
  dayPnLPercent = '0',
}: PortfolioHeaderProps) => {
  const [tick, setTick] = useState(0);
  const [displayValue, setDisplayValue] = useState(totalValue);

  // Animate value change
  useEffect(() => {
    setDisplayValue(totalValue);
    setTick(t => t + 1);
  }, [totalValue]);

  const numValue = parseFloat(totalValue) || 0;
  const numPnL = parseFloat(totalDayPnL) || 0;
  const numPnLPercent = parseFloat(dayPnLPercent) || 0;
  const isPnLPositive = numPnL >= 0;

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'LIVE', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/25' };
      case 'disconnected':
        return { icon: <XCircle className="w-3.5 h-3.5" />, label: 'OFFLINE', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/25' };
      case 'testing':
        return { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'SYNCING', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/25' };
      default:
        return { icon: <WifiOff className="w-3.5 h-3.5" />, label: 'UNKNOWN', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20' };
    }
  };

  const status = getStatusConfig();
  const updateTime = new Date(lastUpdate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="relative mb-8 animate-fade-in">
      {/* Ambient background glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/5 via-transparent to-emerald-500/5 rounded-3xl blur-2xl pointer-events-none" />

      {/* Main header card */}
      <div className="relative terminal-card rounded-2xl overflow-hidden corner-tl corner-br">

        {/* Top status bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            {/* Terminal dots */}
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <span className="font-mono text-[10px] text-white/25 tracking-widest uppercase">
              BINANCE_PORTFOLIO_TERMINAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <span className="live-dot" />
            )}
            <span className={cn("font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border", status.bg, status.color)}>
              {status.icon}
            </span>
            <span className={cn("font-mono text-[10px] tracking-wider uppercase", status.color)}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">

            {/* Left: Title + Balance */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-lg blur-lg" />
                  <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/25 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white/90 leading-none">
                    محفظة Binance
                  </h1>
                  <p className="text-[11px] font-mono text-white/30 mt-0.5 tracking-widest uppercase">
                    Portfolio Dashboard
                  </p>
                </div>
              </div>

              {/* Balance display */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
                  TOTAL BALANCE
                </p>
                <div className="flex items-end gap-3" key={tick}>
                  <span className="stat-number text-5xl md:text-6xl font-bold text-white animate-scale-in leading-none">
                    {numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-lg font-mono text-cyan-400/80 mb-1.5">USDT</span>
                </div>
                <p className="font-mono text-sm text-white/30">
                  ≈ ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>

              {/* PnL row */}
              {(numPnL !== 0 || numPnLPercent !== 0) && (
                <div className="mt-4 flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm",
                    isPnLPositive
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {isPnLPositive
                      ? <TrendingUp className="w-3.5 h-3.5" />
                      : <TrendingDown className="w-3.5 h-3.5" />
                    }
                    <span className="stat-number">
                      {isPnLPositive ? '+' : ''}{numPnL.toFixed(2)} USDT
                    </span>
                    <span className="text-xs opacity-70">
                      ({isPnLPositive ? '+' : ''}{numPnLPercent.toFixed(2)}%)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">24H P&L</span>
                </div>
              )}
            </div>

            {/* Right: Actions + Stats */}
            <div className="flex flex-col gap-3">
              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={onTestConnection}
                  variant="outline"
                  size="sm"
                  disabled={connectionStatus === 'testing'}
                  className="w-full gap-2 bg-white/3 hover:bg-cyan-500/10 border-white/10 hover:border-cyan-500/30 text-white/60 hover:text-cyan-400 transition-all duration-200 font-mono text-xs tracking-wide"
                >
                  {connectionStatus === 'testing'
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : status.icon
                  }
                  اختبار الاتصال
                </Button>
                <Button
                  onClick={onRefresh}
                  disabled={isLoading}
                  size="sm"
                  className="w-full gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/25 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 transition-all duration-200 font-mono text-xs tracking-wide"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                  {isLoading ? 'جاري...' : 'تحديث'}
                </Button>
              </div>

              {/* Last update */}
              <div className="separator-glow" />
              <div className="text-center">
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">LAST UPDATE</p>
                <p className="font-mono text-[11px] text-white/40 mt-0.5">{updateTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom progress shimmer (loading) */}
        {isLoading && (
          <div className="h-0.5 w-full">
            <div className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    </div>
  );
};
