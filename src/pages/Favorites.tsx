import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowRight, Trophy } from "lucide-react";
import { useFavorites, getRankBadge, calculateFavoriteScore } from "@/hooks/useFavorites";

const Favorites = () => {
  const navigate = useNavigate();
  const { sortedFavorites, removeFavorite, count } = useFavorites();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* الرأس */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold font-orbitron">
            ❤️ مفضلاتي
          </h1>
          <p className="text-muted-foreground">
            {count} عملة محفوظة (مرتبة من الأفضل للأسوأ)
          </p>
        </div>

        {/* إذا كانت المفضلات فارغة */}
        {count === 0 ? (
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
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
            <h2 className="text-2xl font-bold font-orbitron flex items-center gap-2">
              <Trophy className="w-6 h-6 text-crypto-gold" />
              العملات المحفوظة ({count})
            </h2>
            
            {/* شرح نظام الترتيب */}
            <Card className="border-crypto-gold/30 bg-crypto-gold/5">
              <CardContent className="p-3 text-sm text-right">
                <p className="font-semibold mb-1">🏆 نظام الترتيب:</p>
                <p className="text-muted-foreground text-xs">
                  النمو (25%) + السيولة (20%) + المخاطرة (20%) + الأداء (15%) + العمر (10%) + حلال (10%)
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedFavorites.map((coin, index) => {
                const rank = index + 1;
                const score = coin._score || calculateFavoriteScore(coin);
                return (
                <Card
                  key={index}
                  className={`border-primary/20 hover:border-crypto-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-crypto-gold/20 ${rank <= 3 ? 'ring-2 ring-crypto-gold/30' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="text-right space-y-3">
                      {/* الاسم والرمز */}
                      <div>
                        <div className="font-bold text-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getRankBadge(rank)}</span>
                            {coin.symbol}
                            {coin.isHalal && (
                              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                                ✅ حلال
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-crypto-gold/20 text-crypto-gold px-2 py-1 rounded font-bold">
                              {score} نقطة
                            </span>
                            <button
                              onClick={() => removeFavorite(coin.symbol)}
                              className="text-red-500 hover:text-red-600 transition"
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {coin.category}
                        </div>
                      </div>

                      {/* البيانات */}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>💰 السعر:</span>
                          <span className="font-semibold">{coin.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>📈 النمو:</span>
                          <span
                            className={`font-semibold ${
                              coin.growth.includes("+")
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {coin.growth}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>💧 السيولة:</span>
                          <span className="font-semibold">{coin.liquidity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⚠️ المخاطرة:</span>
                          <span className="font-semibold">{coin.riskLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⚡ الأداء:</span>
                          <span className="font-semibold">{coin.valueScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>📅 الإدراج:</span>
                          <span className="font-semibold text-crypto-gold">
                            {coin.listingDate || 'غير محدد'}
                          </span>
                        </div>
                      </div>

                      {/* الأزرار */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => {
                            const prompt = `اسم العملة: ${coin.symbol}
السعر: ${coin.price}
النمو (24 ساعة): ${coin.growth}
السيولة: ${coin.liquidity}
درجة الأداء: ${coin.valueScore}
تاريخ الإدراج: ${coin.listingDate || 'غير محدد'}

أرجو تحليل شامل لهذه العملة الجديدة يتضمن:
1. شرح المشروع والفكرة
2. هل آمنة للاستثمار؟
3. الإيجابيات والسلبيات
4. التوصية النهائية
5. الأهداف السعرية

**⚠️ تحليل الحلال (مهم جداً):**
6. هل هذه العملة حلال من الناحية الشرعية الإسلامية؟
7. هل المشروع خالي من الربا والغرر؟
8. هل هناك استخدام للمقامرة أو الأنشطة المحرمة؟
9. هل المشروع يقدم قيمة حقيقية أم أنه مجرد مضاربة؟
10. تقييم شرعي نهائي: هل يمكن الاستثمار فيها أم لا؟`;

                            const encodedPrompt = encodeURIComponent(prompt);
                            window.open(
                              `https://chatgpt.com/?q=${encodedPrompt}`,
                              "_blank"
                            );
                          }}
                        >
                          <span className="ml-1">🤖</span>
                          ChatGPT
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            if (coin.links?.website) {
                              window.open(coin.links.website, "_blank");
                            }
                          }}
                        >
                          <span className="ml-1">📊</span>
                          Binance
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          </div>
        )}

        {/* زر العودة */}
        {count > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => navigate("/suggest-coins")}
              className="border-primary/20 hover:border-crypto-gold/50"
            >
              <span className="ml-2">🔍</span>
              العودة للبحث عن عملات جديدة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
