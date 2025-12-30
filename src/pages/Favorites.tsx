import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ArrowRight, Trophy, Star, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { CoinLaunchDate } from "@/components/CoinLaunchDate";
import { CoinProject } from "@/components/CoinProject";
import { CoinCategory } from "@/components/CoinCategory";
import { getCoinLaunchDateISO } from "@/hooks/useCoinMetadata";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, removeFavorite, count, isLoading } = useFavorites();

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
                        <div>
                          <div className="font-bold text-lg text-crypto-gold">
                            {coin.symbol}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {coin.name}
                          </div>
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
