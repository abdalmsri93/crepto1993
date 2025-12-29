import { Tag, Loader2 } from 'lucide-react';
import { useCoinMetadata } from '@/hooks/useCoinMetadata';

interface CoinCategoryProps {
  symbol: string;
  className?: string;
}

// ألوان مختلفة حسب نوع الفئة
const getCategoryStyle = (category: string): string => {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('layer 1') || lowerCategory.includes('l1')) {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
  if (lowerCategory.includes('layer 2') || lowerCategory.includes('l2') || lowerCategory.includes('scaling')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (lowerCategory.includes('defi') || lowerCategory.includes('lending') || lowerCategory.includes('amm')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (lowerCategory.includes('meme')) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  if (lowerCategory.includes('gaming') || lowerCategory.includes('metaverse') || lowerCategory.includes('nft')) {
    return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
  }
  if (lowerCategory.includes('ai') || lowerCategory.includes('data')) {
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  }
  if (lowerCategory.includes('stable')) {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
  if (lowerCategory.includes('oracle')) {
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  }
  if (lowerCategory.includes('exchange')) {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
  if (lowerCategory.includes('privacy')) {
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
  if (lowerCategory.includes('storage')) {
    return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  }
  
  // افتراضي
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

/**
 * مكون لعرض فئة العملة
 */
export const CoinCategory = ({ symbol, className = '' }: CoinCategoryProps) => {
  // إزالة USDT من نهاية الرمز إذا وجد
  const cleanSymbol = symbol.replace(/USDT$|BUSD$|BTC$/i, '');
  const { category, loading } = useCoinMetadata(cleanSymbol);

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  // إذا كان هناك فئة للعملة
  if (category) {
    const categoryStyle = getCategoryStyle(category);
    
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <Tag className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-violet-300">الفئة:</span>
        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${categoryStyle}`}>
          {category}
        </span>
      </div>
    );
  }

  // إذا لم تتوفر الفئة
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">الفئة:</span>
      <span className="text-muted-foreground/70">غير متوفر</span>
    </div>
  );
};

export default CoinCategory;
