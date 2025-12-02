import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enriching data for coin: ${symbol}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // استخدام Lovable AI للحصول على معلومات شاملة عن العملة
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `أنت خبير في تحليل العملات الرقمية من منظور شرعي وتقني. قدم معلومات دقيقة وموثوقة فقط.
عند تحليل العملة، ركز على:
1. وصف المشروع ومجاله
2. التوافق الشرعي (هل توجد فتاوى أو تصنيفات معتمدة؟)
3. تقييم المخاطر الفعلية
4. إمكانيات النمو بناءً على الاستخدام الفعلي

إذا لم تكن متأكداً من معلومة، اذكر ذلك بوضوح.`
          },
          {
            role: 'user',
            content: `قدم تحليلاً مختصراً (200 كلمة كحد أقصى) للعملة الرقمية ${symbol} يشمل:
1. اسم المشروع الكامل
2. وصف المشروع في جملتين
3. التوافق الشرعي (مع ذكر المصدر إن وُجد)
4. مستوى المخاطر (منخفض/متوسط/عالي)
5. توصية (شراء/احتفاظ/تجنب)

تنسيق الإجابة:
PROJECT_NAME: [الاسم]
DESCRIPTION: [الوصف]
SHARIA: [حالة التوافق والمصدر]
RISK: [منخفض/متوسط/عالي]
RECOMMENDATION: [شراء/احتفاظ/تجنب]`
          }
        ],
        temperature: 0.3, // تقليل الإبداع لزيادة الدقة
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يلزم إضافة رصيد لاستخدام Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    console.log('AI Response received:', aiContent);

    // استخراج المعلومات من الرد
    const projectName = aiContent.match(/PROJECT_NAME:\s*(.+)/)?.[1]?.trim() || symbol;
    const description = aiContent.match(/DESCRIPTION:\s*(.+)/)?.[1]?.trim() || 'لا توجد معلومات كافية';
    const sharia = aiContent.match(/SHARIA:\s*(.+)/)?.[1]?.trim() || 'غير محدد - يُنصح بالبحث اليدوي';
    const risk = aiContent.match(/RISK:\s*(.+)/)?.[1]?.trim() || 'متوسط';
    const recommendation = aiContent.match(/RECOMMENDATION:\s*(.+)/)?.[1]?.trim() || 'احتفاظ';

    const enrichedData = {
      symbol,
      name: projectName,
      description,
      sharia_compliant: sharia.includes('متوافق') || sharia.includes('Halal'),
      sharia_notes: sharia,
      risk_level: risk,
      recommendation,
      source: 'AI-generated',
      timestamp: new Date().toISOString()
    };

    console.log('Enriched data generated:', enrichedData);

    return new Response(JSON.stringify(enrichedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-coin function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
