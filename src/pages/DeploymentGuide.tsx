import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DeploymentGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          رجوع
        </Button>

        <Card className="glass-card border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              دليل نشر التطبيق من GitHub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                هذا الدليل يشرح كيفية نشر التطبيق على منصات مثل Vercel أو Netlify بعد رفعه على GitHub.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                المتطلبات الأساسية
              </h3>
              <ul className="space-y-2 mr-8 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  حساب على منصة نشر (Vercel أو Netlify)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  حساب Supabase فعّال
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  مفتاح OpenAI API مع تفعيل الفوترة
                </li>
              </ul>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="vercel" className="border border-primary/20 rounded-lg px-4 mb-3">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold">النشر على Vercel</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. ربط المشروع</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      اذهب إلى vercel.com واضغط "New Project"، ثم اختر المستودع من GitHub
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">2. إضافة متغيرات البيئة</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      في إعدادات المشروع، أضف المتغيرات التالية:
                    </p>
                    <div className="bg-muted/50 rounded p-3 text-xs font-mono overflow-x-auto" dir="ltr">
                      <div>VITE_SUPABASE_URL=https://ftgvxvwvbtfkbgkuccwx.supabase.co</div>
                      <div className="break-all">VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                      <div>VITE_SUPABASE_PROJECT_ID=ftgvxvwvbtfkbgkuccwx</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. إعداد Supabase Secrets</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      في لوحة Supabase، اذهب إلى Settings → Edge Functions → Secrets
                    </p>
                    <p className="text-sm text-muted-foreground">
                      أضف سر باسم <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> مع قيمة مفتاح OpenAI
                    </p>
                  </div>

                  <Button 
                    className="w-full gap-2"
                    onClick={() => window.open('https://vercel.com', '_blank')}
                  >
                    فتح Vercel
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="netlify" className="border border-primary/20 rounded-lg px-4 mb-3">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold">النشر على Netlify</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. إنشاء موقع جديد</h4>
                    <p className="text-sm text-muted-foreground">
                      اذهب إلى netlify.com واضغط "Add new site" → "Import an existing project"
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. إضافة متغيرات البيئة</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      في Site settings → Environment variables، أضف نفس المتغيرات السابقة
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. إعادة النشر</h4>
                    <p className="text-sm text-muted-foreground">
                      بعد إضافة المتغيرات، اذهب إلى Deploys واضغط "Trigger deploy"
                    </p>
                  </div>

                  <Button 
                    className="w-full gap-2"
                    onClick={() => window.open('https://netlify.com', '_blank')}
                  >
                    فتح Netlify
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="troubleshooting" className="border border-primary/20 rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    حل المشاكل الشائعة
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">صفحة بيضاء أو خطأ 404</h4>
                    <p className="text-sm text-muted-foreground">
                      تأكد من إضافة جميع متغيرات البيئة ثم أعد نشر الموقع
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Failed to fetch portfolio</h4>
                    <p className="text-sm text-muted-foreground">
                      تحقق من صحة VITE_SUPABASE_URL والمفاتيح الأخرى
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">نفد رصيد التحليل الذكي</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      تأكد من:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mr-6">
                      <li>• إضافة OPENAI_API_KEY في Supabase Secrets</li>
                      <li>• تفعيل الفوترة في حساب OpenAI</li>
                      <li>• وجود رصيد كافٍ في الحساب</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">💡</span>
                ملاحظة مهمة
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Edge Functions موجودة في Supabase وتعمل بشكل منفصل عن الكود الأمامي. 
                لا تحتاج لنشرها مرة أخرى إلا إذا قمت بتعديلها.
              </p>
            </div>

            <Button 
              className="w-full gap-2"
              variant="outline"
              onClick={() => window.open('/DEPLOYMENT.md', '_blank')}
            >
              عرض الدليل الكامل
              <ExternalLink className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeploymentGuide;
