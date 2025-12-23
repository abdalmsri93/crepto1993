import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  totalValue: string;
  totalDayPnL?: string;
  dayPnLPercent?: string;
  assetsCount: number;
  lastUpdate: string;
}

export const DashboardStats = ({
  totalValue,
  totalDayPnL = "0",
  dayPnLPercent = "0",
  assetsCount,
  lastUpdate,
}: DashboardStatsProps) => {
  const isPnLPositive = parseFloat(totalDayPnL) >= 0;
  const pnlPercent = parseFloat(dayPnLPercent);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* إجمالي قيمة المحفظة */}
      <Card className="glass-card animate-fade-in animate-delay-100 border-primary/20 hover:border-primary/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي القيمة
            </CardTitle>
            <DollarSign className="w-4 h-4 text-crypto-gold" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-orbitron font-bold text-crypto-gold">
            ${parseFloat(totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1">
            USDT: {parseFloat(totalValue).toFixed(8)}
          </p>
        </CardContent>
      </Card>

      {/* الربح/الخسارة اليومية */}
      <Card className={cn(
        "glass-card animate-fade-in animate-delay-200 transition-all duration-300",
        isPnLPositive 
          ? "border-crypto-green/30 hover:border-crypto-green/50" 
          : "border-crypto-red/30 hover:border-crypto-red/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              P&L اليومي
            </CardTitle>
            {isPnLPositive ? (
              <TrendingUp className="w-4 h-4 text-crypto-green" />
            ) : (
              <TrendingDown className="w-4 h-4 text-crypto-red" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-orbitron font-bold",
            isPnLPositive ? "text-crypto-green" : "text-crypto-red"
          )}>
            {isPnLPositive ? '+' : ''}{parseFloat(totalDayPnL).toFixed(2)} USDT
          </div>
          <p className={cn(
            "text-xs mt-1",
            isPnLPositive ? "text-crypto-green/70" : "text-crypto-red/70"
          )}>
            {isPnLPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      {/* عدد الأصول */}
      <Card className="glass-card animate-fade-in animate-delay-300 border-crypto-blue/20 hover:border-crypto-blue/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              عدد الأصول
            </CardTitle>
            <Activity className="w-4 h-4 text-crypto-blue" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-orbitron font-bold text-crypto-blue">
            {assetsCount}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1">
            عملة مختلفة
          </p>
        </CardContent>
      </Card>

      {/* آخر تحديث */}
      <Card className="glass-card animate-fade-in animate-delay-300 border-primary/20 hover:border-primary/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            آخر تحديث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-mono text-foreground">
            {new Date(lastUpdate).toLocaleTimeString('ar-SA', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {new Date(lastUpdate).toLocaleDateString('ar-SA')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
