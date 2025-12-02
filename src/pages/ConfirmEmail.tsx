import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // تحقق من وجود رمز التأكيد في URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const email = searchParams.get('email');

        if (!token) {
          setStatus('error');
          setMessage('رابط التأكيد غير صحيح أو انتهت صلاحيته');
          return;
        }

        // تأكيد البريد الإلكتروني
        const { error } = await supabase.auth.verifyOtp({
          email: email || '',
          token: token,
          type: (type as 'email_change' | 'signup') || 'signup',
        });

        if (error) {
          setStatus('error');
          setMessage(error.message || 'فشل تأكيد البريد الإلكتروني');
          console.error('Verification error:', error);
          return;
        }

        setStatus('success');
        setMessage('تم تأكيد بريدك الإلكتروني بنجاح! ✅');

        // إعادة التوجيه بعد ثانيتين
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } catch (error) {
        console.error('Error during email confirmation:', error);
        setStatus('error');
        setMessage('حدث خطأ أثناء تأكيد البريد الإلكتروني');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm animate-scale-in">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <Loader2 className="w-12 h-12 animate-spin text-crypto-gold mx-auto mb-4" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-12 h-12 text-crypto-green mx-auto mb-4" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          )}

          <CardTitle className="text-2xl text-right">
            {status === 'loading' && 'جاري التحقق...'}
            {status === 'success' && 'تم التأكيد بنجاح'}
            {status === 'error' && 'فشل التأكيد'}
          </CardTitle>
          <CardDescription className="text-right mt-4">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="bg-crypto-green/10 border border-crypto-green/30 rounded-lg p-4 text-sm text-right">
              <p>سيتم توجيهك إلى صفحة تسجيل الدخول في لحظات...</p>
            </div>
          )}

          {status === 'error' && (
            <Button
              onClick={() => navigate('/auth')}
              className="w-full transition-all duration-300 hover:scale-105"
            >
              العودة إلى تسجيل الدخول
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
