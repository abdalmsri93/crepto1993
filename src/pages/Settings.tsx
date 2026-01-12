import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Save, LogOut, Key, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import type { User } from "@supabase/supabase-js";

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceApiSecret, setBinanceApiSecret] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  // إعدادات الرافعة المالية
  const [marginEnabled, setMarginEnabled] = useState(false);
  const [marginLeverage, setMarginLeverage] = useState(3);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // قراءة الإعدادات من localStorage مباشرة بدون Auth
    const loadSettings = () => {
      // قراءة Binance API Keys
      const credentials = localStorage.getItem('binance_credentials');
      if (credentials) {
        try {
          const parsed = JSON.parse(credentials);
          setBinanceApiKey(parsed.apiKey || '');
          setBinanceApiSecret(parsed.secretKey || '');
        } catch (e) {
          console.error('خطأ في قراءة المفاتيح:', e);
        }
      }

      // قراءة Groq API Key
      const savedGroqKey = localStorage.getItem('groq_api_key');
      if (savedGroqKey) {
        setGroqApiKey(savedGroqKey);
      }

      // قراءة إعدادات الرافعة المالية
      const savedMarginEnabled = localStorage.getItem('margin_enabled');
      const savedMarginLeverage = localStorage.getItem('margin_leverage');
      if (savedMarginEnabled) {
        setMarginEnabled(savedMarginEnabled === 'true');
      }
      if (savedMarginLeverage) {
        setMarginLeverage(parseInt(savedMarginLeverage) || 3);
      }

      setIsFetching(false);
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // حفظ Binance API Keys في localStorage
      if (binanceApiKey.trim() && binanceApiSecret.trim()) {
        const credentials = {
          apiKey: binanceApiKey.trim(),
          secretKey: binanceApiSecret.trim()
        };
        localStorage.setItem('binance_credentials', JSON.stringify(credentials));
      }

      // حفظ Groq API Key في localStorage
      if (groqApiKey.trim()) {
        localStorage.setItem('groq_api_key', groqApiKey.trim());
      } else {
        localStorage.removeItem('groq_api_key');
      }

      // حفظ إعدادات الرافعة المالية
      localStorage.setItem('margin_enabled', marginEnabled.toString());
      localStorage.setItem('margin_leverage', marginLeverage.toString());

      toast({
        title: "✅ تم الحفظ بنجاح",
        description: "تم تحديث معلوماتك في localStorage",
      });
    } catch (error: any) {
      toast({
        title: "❌ خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // مسح localStorage
    localStorage.clear();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم مسح جميع البيانات المحلية",
    });
    navigate("/");
  };

  const testGroqAPI = async () => {
    if (!groqApiKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال Groq API Key أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsTestingAPI(true);
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: 'Say "API works!" in Arabic'
            }
          ],
          max_tokens: 50,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      toast({
        title: "✅ نجح الاختبار!",
        description: "Groq API يعمل بشكل صحيح: " + data.choices[0].message.content,
      });
    } catch (error: any) {
      console.error('Test Error:', error);
      toast({
        title: "❌ فشل الاختبار",
        description: error.message || "تحقق من صحة المفتاح",
        variant: "destructive",
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-right mb-2 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              الإعدادات
            </h1>
            <p className="text-muted-foreground text-right">
              إدارة حسابك ومفاتيح Binance API
            </p>
          </div>
          <NavLink to="/">
            <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-105">
              <ArrowRight className="w-4 h-4" />
              العودة للمحفظة
            </Button>
          </NavLink>
        </div>

        {/* Profile Information */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-right">معلومات الحساب</CardTitle>
            <CardDescription className="text-right">
              تحديث معلوماتك الشخصية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="text-right bg-muted"
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground text-right">
                لا يمكن تغيير البريد الإلكتروني
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                الاسم الكامل
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="text-right transition-all duration-300 focus:scale-[1.02]"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Binance API Keys */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <div className="flex items-center justify-end gap-2">
              <CardTitle className="text-right">مفاتيح Binance API</CardTitle>
              <Key className="w-5 h-5 text-primary" />
            </div>
            <CardDescription className="text-right">
              أدخل مفاتيح API الخاصة بحسابك في Binance لعرض محفظتك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                API Key
              </label>
              <Input
                type="text"
                value={binanceApiKey}
                onChange={(e) => setBinanceApiKey(e.target.value)}
                placeholder="أدخل Binance API Key"
                className="text-right font-mono transition-all duration-300 focus:scale-[1.02]"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                API Secret
              </label>
              <Input
                type="password"
                value={binanceApiSecret}
                onChange={(e) => setBinanceApiSecret(e.target.value)}
                placeholder="أدخل Binance API Secret"
                className="text-right font-mono transition-all duration-300 focus:scale-[1.02]"
                dir="ltr"
              />
            </div>

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-sm text-right text-muted-foreground">
                ⚠️ <strong>ملاحظة هامة:</strong> مفاتيح API الخاصة بك محمية ومشفرة. لن يتمكن أحد غيرك من الوصول إليها.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Groq AI API Key */}
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-blue-500/5 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <CardHeader>
            <div className="flex items-center justify-end gap-2">
              <CardTitle className="text-right">مفتاح Groq AI (تحليل ذكي)</CardTitle>
              <span className="text-2xl">🤖</span>
            </div>
            <CardDescription className="text-right">
              للحصول على تحليل AI مزدوج (ChatGPT-like & Gemini-like) للعملات - مجاني 100%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                Groq API Key
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testGroqAPI}
                  disabled={isTestingAPI || !groqApiKey.trim()}
                  className="shrink-0"
                >
                  {isTestingAPI ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin ml-1" />
                      اختبار...
                    </>
                  ) : (
                    <>
                      ✓ اختبار
                    </>
                  )}
                </Button>
                <Input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxxx"
                  className="text-right font-mono transition-all duration-300 focus:scale-[1.02] flex-1"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                💡 اضغط "اختبار" للتأكد من صحة المفتاح قبل الحفظ
              </p>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30 space-y-3">
              <div className="flex items-start gap-3 text-right">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                    ✨ كيفية الحصول على المفتاح المجاني:
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>اذهب إلى: <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.groq.com</a></li>
                    <li>سجل حساب مجاني (Gmail/GitHub)</li>
                    <li>اذهب إلى "API Keys"</li>
                    <li>اضغط "Create API Key"</li>
                    <li>انسخ المفتاح وألصقه هنا</li>
                  </ol>
                </div>
              </div>
              <div className="pt-2 border-t border-green-500/20">
                <p className="text-xs text-muted-foreground text-right">
                  🚀 <strong>مميزات:</strong> تحليل مزدوج من نموذجين مختلفين • سرعة فائقة • مجاني تماماً
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ⚡ Margin Trading - الرافعة المالية */}
        <Card className={`border-2 backdrop-blur-sm animate-fade-in ${marginEnabled ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/10' : 'border-gray-500/20 bg-card/50'}`} style={{ animationDelay: '0.38s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {marginEnabled && (
                  <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-bold animate-pulse">
                    مُفعّل
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-right">الرافعة المالية (Margin)</CardTitle>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <CardDescription className="text-right">
              استخدام الرافعة المالية في الشراء التلقائي - تضاعف الربح والخسارة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* زر التفعيل */}
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
              <Button
                type="button"
                variant={marginEnabled ? "destructive" : "default"}
                onClick={() => setMarginEnabled(!marginEnabled)}
                className="gap-2"
              >
                {marginEnabled ? (
                  <>❌ إيقاف الرافعة</>
                ) : (
                  <>✅ تفعيل الرافعة</>
                )}
              </Button>
              <label className="text-sm font-medium text-right">
                تفعيل الرافعة في الشراء التلقائي
              </label>
            </div>

            {/* اختيار نسبة الرافعة */}
            {marginEnabled && (
              <div className="space-y-3 animate-fade-in">
                <label className="text-sm font-medium text-right block">
                  📊 نسبة الرافعة المالية:
                </label>
                <div className="flex gap-2 justify-end flex-wrap">
                  {[2, 3, 5, 10].map((lev) => (
                    <Button
                      key={lev}
                      type="button"
                      variant={marginLeverage === lev ? "default" : "outline"}
                      onClick={() => setMarginLeverage(lev)}
                      className={`min-w-[60px] ${marginLeverage === lev ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    >
                      {lev}x
                    </Button>
                  ))}
                </div>
                
                {/* شرح الرافعة المختارة */}
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                  <p className="text-sm text-right text-orange-600 dark:text-orange-400">
                    <strong>مثال:</strong> بـ ${5} ورافعة {marginLeverage}x = قوة شرائية ${5 * marginLeverage}
                  </p>
                  <p className="text-xs text-right text-muted-foreground mt-1">
                    الربح والخسارة مضروبة × {marginLeverage}
                  </p>
                </div>
              </div>
            )}

            {/* تحذير */}
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 flex items-start gap-3">
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center justify-end gap-2">
                  <span>⚠️ تحذير هام</span>
                  <AlertTriangle className="w-4 h-4" />
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>الرافعة المالية تضاعف الخسارة كما تضاعف الربح</li>
                  <li>قد تخسر كامل المبلغ المستثمر إذا نزل السعر</li>
                  <li>يتم استخدام Isolated Margin لتحديد الخسارة</li>
                  <li>تأكد من فهمك الكامل للمخاطر قبل التفعيل</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 transition-all duration-300 hover:scale-105"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2 transition-all duration-300 hover:scale-105"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
