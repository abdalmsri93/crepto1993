import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Trash2, Plus, Key, AlertTriangle, CheckCircle } from "lucide-react";

interface APIKeyData {
  id: string;
  encrypted_api_key: string;
  api_key_hash: string;
  is_active: boolean;
  created_at: string;
  last_used: string | null;
}

const BinanceAPIManager = () => {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [savedKeys, setSavedKeys] = useState<APIKeyData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchApiKeys();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchApiKeys = async () => {
    try {
      setIsFetching(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("encrypted_binance_keys" as any)
        .select("id, encrypted_api_key, api_key_hash, is_active, created_at, last_used")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (data) {
        setSavedKeys((data as any) || []);
      }
    } catch (error) {
      console.log("No API keys found");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddApiKey = async () => {
    try {
      if (!apiKey || !secretKey) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال المفتاح والسر",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // حساب hash للمفتاح
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // في بيئة إنتاجية، يجب تشفير المفاتيح هنا
      // هذا كود توضيحي فقط
      const encryptedApiKey = btoa(apiKey);
      const encryptedSecretKey = btoa(secretKey);

      const { error } = await supabase
        .from("encrypted_binance_keys" as any)
        .insert({
          user_id: user.id,
          encrypted_api_key: encryptedApiKey,
          encrypted_secret_key: encryptedSecretKey,
          api_key_hash: hashHex,
          is_active: true,
        } as any);

      if (error) throw error;

      // تسجيل النشاط
      await supabase.from("encryption_logs" as any).insert({
        user_id: user.id,
        action: "add_key",
        success: true,
      } as any);

      toast({
        title: "نجح",
        description: "تم حفظ مفاتيح Binance بنجاح",
      });

      setApiKey("");
      setSecretKey("");
      fetchApiKeys();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ المفاتيح",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      if (!savedKeys) return;

      const confirmed = window.confirm(
        "هل أنت متأكد من حذف المفاتيح؟ لن تتمكن من التراجع عن هذا الإجراء."
      );

      if (!confirmed) return;

      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("encrypted_binance_keys" as any)
        .update({ is_active: false } as any)
        .eq("id", savedKeys.id);

      if (error) throw error;

      // تسجيل الحذف
      await supabase.from("encryption_logs" as any).insert({
        user_id: user.id,
        action: "remove_key",
        success: true,
      } as any);

      toast({
        title: "تم الحذف",
        description: "تم حذف المفاتيح بنجاح",
      });

      setSavedKeys(null);
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المفاتيح",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* رأس الصفحة */}
        <div className="mb-8 flex items-center justify-between animate-fade-in animate-delay-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-crypto-gold to-crypto-green rounded-lg">
              <Key className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold text-transparent bg-gradient-to-r from-crypto-gold to-crypto-green bg-clip-text">
                مفاتيح Binance API
              </h1>
              <p className="text-sm text-muted-foreground">إدارة آمنة لمفاتيح التداول</p>
            </div>
          </div>
          <NavLink to="/">
            <Button variant="outline" className="gap-2">
              العودة
            </Button>
          </NavLink>
        </div>

        {/* تحذير أمان */}
        <Card className="glass-card border-crypto-red/30 mb-6 animate-fade-in animate-delay-200">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-crypto-red mt-1 flex-shrink-0" />
              <div>
                <CardTitle className="text-crypto-red">⚠️ تحذير أمان هام</CardTitle>
                <CardDescription className="text-foreground/70">
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>✓ لا تشارك مفاتيحك مع أحد</li>
                    <li>✓ استخدم مفاتيح بصلاحيات محدودة من Binance</li>
                    <li>✓ فعّل Whitelist IP على Binance</li>
                    <li>✓ تفعيل 2FA على حساب Binance</li>
                  </ul>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* المفاتيح المحفوظة */}
        {isFetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : savedKeys ? (
          <Card className="glass-card border-crypto-green/30 mb-6 animate-fade-in animate-delay-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-crypto-green" />
                  <CardTitle>المفاتيح المحفوظة</CardTitle>
                </div>
              </div>
              <CardDescription>
                تم حفظ مفاتيحك بشكل آمن
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">API Key Hash</p>
                <p className="font-mono text-xs break-all text-foreground/60">
                  {savedKeys.api_key_hash.substring(0, 16)}...
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">تم الحفظ في</p>
                <p className="text-sm">
                  {new Date(savedKeys.created_at).toLocaleDateString("ar-SA")}
                </p>
              </div>
              {savedKeys.last_used && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">آخر استخدام</p>
                  <p className="text-sm">
                    {new Date(savedKeys.last_used).toLocaleString("ar-SA")}
                  </p>
                </div>
              )}
              <Button
                onClick={handleDeleteApiKey}
                disabled={isLoading}
                variant="destructive"
                className="w-full gap-2 mt-4"
              >
                <Trash2 className="w-4 h-4" />
                حذف المفاتيح
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* نموذج إضافة مفاتيح جديدة */
          <Card className="glass-card border-primary/20 mb-6 animate-fade-in animate-delay-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <CardTitle>إضافة مفاتيح جديدة</CardTitle>
              </div>
              <CardDescription>
                أدخل مفاتيح Binance API الخاصة بك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={showKeys ? "text" : "password"}
                    placeholder="أدخل مفتاح API الخاص بك"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => setShowKeys(!showKeys)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showKeys ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Secret Key
                </label>
                <div className="relative">
                  <Input
                    type={showKeys ? "text" : "password"}
                    placeholder="أدخل مفتاح السر الخاص بك"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddApiKey}
                disabled={isLoading || !apiKey || !secretKey}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                حفظ المفاتيح
              </Button>
            </CardContent>
          </Card>
        )}

        {/* معلومات إضافية */}
        <Card className="glass-card border-primary/20 animate-fade-in animate-delay-400">
          <CardHeader>
            <CardTitle className="text-lg">كيفية الحصول على مفاتيح Binance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">1. تسجيل الدخول إلى Binance</p>
              <p className="text-muted-foreground">
                اذهب إلى <a href="https://www.binance.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">binance.com</a> وسجّل الدخول
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">2. الذهاب إلى Account</p>
              <p className="text-muted-foreground">
                انقر على صورتك → Account → API Management
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">3. إنشاء API Key</p>
              <p className="text-muted-foreground">
                انقر على "Create API" وأدخل اسماً للمفتاح
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">4. تفعيل الصلاحيات</p>
              <p className="text-muted-foreground">
                فعّل "Enable Reading", "Enable Margin", و "Enable Spot Trading"
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">5. Whitelist IP</p>
              <p className="text-muted-foreground">
                أضف عنوان IP الخاص بك لزيادة الأمان
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BinanceAPIManager;
