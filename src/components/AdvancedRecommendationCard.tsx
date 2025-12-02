import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target, Gauge } from "lucide-react";

interface AdvancedRecommendationProps {
  symbol: string;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  riskScore: number;
  volatilityScore: number;
  volumeScore: number;
  adoptionScore: number;
  overallScore: number;
  confidence: number;
  recommendation: "تعزيز" | "احتفاظ" | "تقليص" | "إيقاف";
  strength: "قوية جداً" | "قوية" | "معتدلة" | "ضعيفة";
  buySignals: string[];
  sellSignals: string[];
  riskFactors: string[];
  timing: string;
  priceTargets: {
    short_term: string;
    medium_term: string;
    long_term: string;
  };
}

export const AdvancedRecommendationCard: React.FC<AdvancedRecommendationProps> = ({
  symbol,
  technicalScore,
  fundamentalScore,
  sentimentScore,
  riskScore,
  volatilityScore,
  volumeScore,
  adoptionScore,
  overallScore,
  confidence,
  recommendation,
  strength,
  buySignals,
  sellSignals,
  riskFactors,
  timing,
  priceTargets,
}) => {
  // تحديد الألوان بناءً على التوصية
  const getRecommendationColor = () => {
    switch (recommendation) {
      case "تعزيز":
        return "bg-green-500/10 border-green-500/30";
      case "احتفاظ":
        return "bg-blue-500/10 border-blue-500/30";
      case "تقليص":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "إيقاف":
        return "bg-red-500/10 border-red-500/30";
    }
  };

  const getRecommendationBadgeColor = () => {
    switch (recommendation) {
      case "تعزيز":
        return "bg-green-500 text-white";
      case "احتفاظ":
        return "bg-blue-500 text-white";
      case "تقليص":
        return "bg-yellow-500 text-white";
      case "إيقاف":
        return "bg-red-500 text-white";
    }
  };

  const getRecommendationIcon = () => {
    switch (recommendation) {
      case "تعزيز":
        return <TrendingUp className="w-5 h-5" />;
      case "احتفاظ":
        return <Gauge className="w-5 h-5" />;
      case "تقليص":
        return <TrendingDown className="w-5 h-5" />;
      case "إيقاف":
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <Card className={`${getRecommendationColor()} border-2 transition-all hover:shadow-lg`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-primary">{symbol}</div>
            <Badge className={getRecommendationBadgeColor()}>
              {getRecommendationIcon()}
              <span className="ml-2">{recommendation}</span>
            </Badge>
            <Badge variant="outline">{strength}</Badge>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallScore}</div>
            <div className="text-xs text-muted-foreground">درجة إجمالية</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">درجة الثقة</span>
            <span className="text-sm font-bold">{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* شبكة المؤشرات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScoreBox label="المؤشرات الفنية" score={technicalScore} />
          <ScoreBox label="الأساسيات" score={fundamentalScore} />
          <ScoreBox label="المعنويات" score={sentimentScore} />
          <ScoreBox label="الاعتماد" score={adoptionScore} />
          <ScoreBox label="حجم التداول" score={volumeScore} />
          <ScoreBox label="التقلب" score={volatilityScore} isReverse />
          <ScoreBox label="السيولة" score={100 - riskScore} />
          <ScoreBox label="الثقة" score={confidence} />
        </div>

        {/* إشارات الشراء */}
        {buySignals.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              إشارات الشراء
            </h4>
            <ul className="space-y-1">
              {buySignals.map((signal, idx) => (
                <li key={idx} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  ✓ {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* إشارات البيع */}
        {sellSignals.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              إشارات البيع
            </h4>
            <ul className="space-y-1">
              {sellSignals.map((signal, idx) => (
                <li key={idx} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  ✗ {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* عوامل الخطر */}
        {riskFactors.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="font-semibold mb-2">عوامل الخطر:</div>
              <ul className="space-y-1">
                {riskFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm">⚠️ {factor}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* التوقيت والأهداف */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="font-semibold text-primary mb-2 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              التوقيت المثالي
            </div>
            <div className="text-sm">{timing}</div>
          </div>

          <div className="bg-blue-500/10 p-4 rounded-lg">
            <div className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              أهداف السعر
            </div>
            <div className="space-y-1 text-xs">
              <div>📈 قصير المدى: {priceTargets.short_term}</div>
              <div>📊 متوسط المدى: {priceTargets.medium_term}</div>
              <div>📅 طويل المدى: {priceTargets.long_term}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// مكون فرعي لعرض درجة واحدة
interface ScoreBoxProps {
  label: string;
  score: number;
  isReverse?: boolean;
}

const ScoreBox: React.FC<ScoreBoxProps> = ({ label, score, isReverse = false }) => {
  const displayScore = isReverse ? 100 - score : score;
  const getColor = () => {
    if (displayScore >= 75) return "text-green-600 bg-green-50";
    if (displayScore >= 50) return "text-blue-600 bg-blue-50";
    if (displayScore >= 25) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className={`p-3 rounded-lg ${getColor()} text-center`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold">{Math.round(displayScore)}</div>
      <Progress value={displayScore} className="h-1 mt-2" />
    </div>
  );
};
