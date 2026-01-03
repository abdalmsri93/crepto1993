import React from "react";
import { Sparkles, Zap } from "lucide-react";
import { useAutoSearch } from "@/contexts/AutoSearchContext";

// 📦 رقم الإصدار الحالي
export const APP_VERSION = "4.2";

export const VersionBadge = () => {
  const { isRunning, isSearching, status } = useAutoSearch();
  
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {/* مؤشر البحث التلقائي */}
      {isRunning && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-full shadow-lg animate-pulse cursor-default">
          <Zap className={`w-4 h-4 text-green-500 ${isSearching ? 'animate-spin' : ''}`} />
          <span className="text-xs font-semibold text-green-500">
            {isSearching ? 'يبحث...' : `بحث تلقائي (${status.searchCount})`}
          </span>
        </div>
      )}
      
      {/* رقم الإصدار */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/30 rounded-full shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105 cursor-default">
        <Sparkles className="w-4 h-4 text-crypto-gold animate-pulse" />
        <span className="text-xs font-semibold text-foreground/80">
          v{APP_VERSION}
        </span>
      </div>
    </div>
  );
};
