import React from "react";
import { Calendar, Loader2 } from "lucide-react";
import { useCoinMetadata } from "@/hooks/useCoinMetadata";

interface CoinLaunchDateProps {
  symbol: string;
  showIcon?: boolean;
  className?: string;
}

export const CoinLaunchDate = ({ symbol, showIcon = true, className = "" }: CoinLaunchDateProps) => {
  // إزالة USDT من نهاية الرمز
  const cleanSymbol = symbol.replace(/USDT$/i, '');
  const { launchDate, loading } = useCoinMetadata(cleanSymbol);

  if (loading) {
    return (
      <div className={`flex justify-between items-center text-sm ${className}`}>
        <span className="text-muted-foreground/80 flex items-center gap-1">
          {showIcon && <Calendar className="w-3.5 h-3.5" />}
          📅 تاريخ الإصدار:
        </span>
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`flex justify-between items-center text-sm ${className}`}>
      <span className="text-muted-foreground/80 flex items-center gap-1">
        {showIcon && <Calendar className="w-3.5 h-3.5" />}
        📅 تاريخ الإصدار:
      </span>
      <span className={`font-semibold ${launchDate ? 'text-crypto-green' : 'text-muted-foreground/60'}`}>
        {launchDate || 'غير متوفر'}
      </span>
    </div>
  );
};
