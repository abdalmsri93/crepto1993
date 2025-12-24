import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Save, LogOut, Key, BookOpen } from "lucide-react";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setBinanceApiKey(profile.binance_api_key || "");
        setBinanceApiSecret(profile.binance_api_secret || "");
      }

      // Load Groq API Key from localStorage
      const savedGroqKey = localStorage.getItem('groq_api_key');
      if (savedGroqKey) {
        setGroqApiKey(savedGroqKey);
      }

      setIsFetching(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          binance_api_key: binanceApiKey.trim(),
          binance_api_secret: binanceApiSecret.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Save Groq API Key to localStorage
      if (groqApiKey.trim()) {
        localStorage.setItem('groq_api_key', groqApiKey.trim());
      } else {
        localStorage.removeItem('groq_api_key');
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث معلوماتك",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
              <Input
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxx"
                className="text-right font-mono transition-all duration-300 focus:scale-[1.02]"
                dir="ltr"
              />
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
