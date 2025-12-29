import { useState } from 'react';
import { Briefcase, Loader2, Languages } from 'lucide-react';
import { useCoinMetadata } from '@/hooks/useCoinMetadata';

interface CoinProjectProps {
  symbol: string;
  className?: string;
}

/**
 * ترجمة النص من الإنجليزية للعربية باستخدام MyMemory API
 */
const translateToArabic = async (text: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
    return text; // إرجاع النص الأصلي إذا فشلت الترجمة
  } catch (error) {
    console.warn('Translation error:', error);
    return text;
  }
};

/**
 * مكون لعرض وصف مشروع العملة مع زر ترجمة
 */
export const CoinProject = ({ symbol, className = '' }: CoinProjectProps) => {
  // إزالة USDT من نهاية الرمز إذا وجد
  const cleanSymbol = symbol.replace(/USDT$|BUSD$|BTC$/i, '');
  const { description, loading, error } = useCoinMetadata(cleanSymbol);
  
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  // دالة الترجمة عند الضغط على الزر
  const handleTranslate = async () => {
    if (!description || isTranslated || isTranslating) return;
    
    setIsTranslating(true);
    try {
      const translated = await translateToArabic(description);
      setTranslatedText(translated);
      setIsTranslated(true);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  // النص الذي سيُعرض (مترجم أو أصلي)
  const displayText = isTranslated ? translatedText : description;

  // إذا كان هناك وصف للمشروع
  if (description) {
    return (
      <div className={`flex items-start gap-2 text-xs ${className}`}>
        <Briefcase className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-blue-300">المشروع: </span>
          <span className={`${isTranslated ? 'text-green-300' : 'text-slate-300'}`}>
            {displayText}
          </span>
        </div>
        
        {/* زر الترجمة */}
        {!isTranslated ? (
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50 flex-shrink-0"
            title="ترجمة للعربية"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>جاري...</span>
              </>
            ) : (
              <>
                <Languages className="w-3 h-3" />
                <span>ترجمة</span>
              </>
            )}
          </button>
        ) : (
          <span className="text-green-500 text-xs flex-shrink-0">✅</span>
        )}
      </div>
    );
  }

  // إذا لم يتوفر الوصف
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">المشروع:</span>
      <span className="text-muted-foreground/70">غير متوفر</span>
    </div>
  );
};

export default CoinProject;
