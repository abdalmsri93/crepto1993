import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface CoinEnrichmentProps {
  symbol: string;
}

interface EnrichedData {
  name: string;
  description: string;
  sharia_compliant: boolean;
  sharia_notes: string;
  risk_level: string;
  recommendation: string;
  source: string;
}

export const CoinEnrichment = ({ symbol }: CoinEnrichmentProps) => {
  const [loading, setLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);

  const handleEnrich = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-coin', {
        body: { symbol }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.');
        } else if (error.message.includes('402')) {
          toast.error('يلزم إضافة رصيد لاستخدام الذكاء الاصطناعي.');
        } else {
          toast.error('حدث خطأ أثناء تحليل العملة');
        }
        console.error('Error enriching coin:', error);
        return;
      }

      setEnrichedData(data);
      toast.success('تم الحصول على تحليل محسّن للعملة');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleEnrich}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            جاري التحليل...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            تحليل محسّن بالذكاء الاصطناعي
          </>
        )}
      </Button>

      {enrichedData && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-primary mb-1">
                ✨ {enrichedData.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {enrichedData.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">التوافق الشرعي:</span>
                <p className={enrichedData.sharia_compliant ? "text-green-600" : "text-amber-600"}>
                  {enrichedData.sharia_notes}
                </p>
              </div>
              <div>
                <span className="font-medium">المخاطر:</span>
                <p>{enrichedData.risk_level}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium">التوصية:</span>
                <p className="font-semibold text-primary">{enrichedData.recommendation}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              🤖 تم التحليل بواسطة الذكاء الاصطناعي - {new Date().toLocaleString('ar-SA')}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
