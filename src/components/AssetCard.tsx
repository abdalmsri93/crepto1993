import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ExternalLink } from "lucide-react";

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
                  e.currentTarget.src = "https://via.placeholder.com/32/FFD700/000000?text=" + asset;
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
          <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 ${isPositive ? 'bg-crypto-green/10 text-crypto-green' : 'bg-red-500/10 text-red-500'}`}>
            <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'} transition-transform duration-300`} />
            <span className="font-orbitron">{isPositive ? '+' : ''}{percentage.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="space-y-3">
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
          <div className="flex justify-between items-end bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-3 rounded-lg border border-primary/20">
            <span className="text-muted-foreground/80 text-sm font-medium">القيمة الإجمالية</span>
            <span className="font-orbitron text-crypto-gold text-lg font-black transition-all duration-300 group-hover:scale-125 origin-right inline-block">
              ${parseFloat(usdValue).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
