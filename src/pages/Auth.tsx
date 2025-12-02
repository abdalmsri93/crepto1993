import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Mail } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
  fullName: z.string().trim().optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate input
      const validation = authSchema.safeParse({ 
        email, 
        password, 
        fullName: isLogin ? undefined : fullName 
      });
      
      if (!validation.success) {
        toast({
          title: "خطأ في البيانات",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
          }
          throw error;
        }

        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك مرة أخرى",
        });
        navigate("/");
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm-email`,
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("هذا البريد الإلكتروني مسجل بالفعل");
          }
          throw error;
        }

        toast({
          title: "تم إنشاء الحساب بنجاح ✅",
          description: "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني وتأكيد حسابك.",
        });
        setEmailSent(true);
        setIsLogin(true);
        setPassword("");
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-4 animate-fade-in">
      {emailSent ? (
        <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm animate-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="w-16 h-16 text-crypto-gold animate-bounce" />
            </div>
            <CardTitle className="text-2xl text-right">
              تحقق من بريدك الإلكتروني ✉️
            </CardTitle>
            <CardDescription className="text-right mt-4">
              تم إرسال رسالة تأكيد إلى <span className="font-semibold text-primary">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-right space-y-2">
              <p className="font-semibold">📌 خطوات التفعيل:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>افتح بريدك الإلكتروني</li>
                <li>ابحث عن رسالة من Supabase</li>
                <li>انقر على رابط التأكيد</li>
                <li>عُد إلى هنا لتسجيل الدخول</li>
              </ol>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                لم تستقبل الرسالة؟ تحقق من مجلد البريد العشوائي أو أعد المحاولة
              </p>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setPassword("");
                  setFullName("");
                }}
                className="w-full transition-all duration-300 hover:scale-105"
              >
                العودة للتسجيل
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm animate-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <TrendingUp className="w-10 h-10 text-primary transition-transform duration-300 hover:scale-110" />
            <h1 className="text-3xl font-bold bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent">
              محفظة العملات
            </h1>
          </div>
          <CardTitle className="text-2xl text-right">
            {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </CardTitle>
          <CardDescription className="text-right">
            {isLogin 
              ? "أدخل بياناتك لتسجيل الدخول إلى حسابك" 
              : "أنشئ حساباً جديداً لبدء تتبع محفظتك"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">
                  الاسم الكامل
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  required={!isLogin}
                  className="text-right transition-all duration-300 focus:scale-[1.02]"
                  dir="rtl"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="text-right transition-all duration-300 focus:scale-[1.02]"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                كلمة المرور
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-right transition-all duration-300 focus:scale-[1.02]"
                dir="rtl"
              />
            </div>

            <Button
              type="submit"
              className="w-full transition-all duration-300 hover:scale-105"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري المعالجة...
                </>
              ) : (
                isLogin ? "تسجيل الدخول" : "إنشاء حساب"
              )}
            </Button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword("");
                }}
                className="text-sm text-primary hover:underline transition-all duration-300 hover:scale-105 inline-block"
              >
                {isLogin 
                  ? "ليس لديك حساب؟ إنشاء حساب جديد" 
                  : "لديك حساب بالفعل؟ تسجيل الدخول"}
              </button>
            </div>
          </form>
        </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Auth;
