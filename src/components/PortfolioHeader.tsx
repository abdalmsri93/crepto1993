import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, WifiOff } from "lucide-react";
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
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <WifiOff className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'متصل';
      case 'disconnected':
        return 'غير متصل';
      case 'testing':
        return 'جاري الاختبار...';
      default:
        return 'غير معروف';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'disconnected':
        return 'text-red-500';
      case 'testing':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden animate-fade-in border-2 border-primary/30">
      <div className="absolute inset-0 gradient-crypto opacity-20 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full filter blur-3xl -mr-48 -mt-48"></div>
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full filter blur-lg opacity-70"></div>
              <h1 className="relative text-4xl font-orbitron font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                محفظة Binance
              </h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 border-2 border-primary/30 transition-all duration-300 hover:scale-105 hover:border-primary/60 hover:bg-background">
              {getStatusIcon()}
              <span className={cn("text-sm font-semibold transition-all duration-300", getStatusColor())}>
                {getStatusText()}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onTestConnection}
              variant="outline"
              size="sm"
              disabled={connectionStatus === 'testing'}
              className="gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/50 transition-all duration-300 hover:scale-110 font-semibold"
            >
              {connectionStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              اختبار الاتصال
            </Button>
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/50 transition-all duration-300 hover:scale-110 font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
              تحديث
            </Button>
          </div>
        </div>
        
        <div className="space-y-4 bg-background/30 rounded-xl p-6 border border-primary/20">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">الرصيد المقدّر</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-orbitron font-black text-transparent bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text transition-all duration-300 hover:scale-110 inline-block">
                {parseFloat(totalValue).toLocaleString('en-US', { maximumFractionDigits: 8 })}
              </span>
              <span className="text-base text-emerald-400 font-semibold">USDT</span>
            </div>
            <p className="text-sm text-muted-foreground/70">
              ≈ ${parseFloat(totalValue).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground/60 pt-2">
            📅 {new Date(lastUpdate).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};
