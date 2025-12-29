import React from "react";
import { Sparkles } from "lucide-react";

// 📦 رقم الإصدار الحالي
export const APP_VERSION = "3.4";

export const VersionBadge = () => {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/30 rounded-full shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105 cursor-default">
        <Sparkles className="w-4 h-4 text-crypto-gold animate-pulse" />
        <span className="text-xs font-semibold text-foreground/80">
          v{APP_VERSION}
        </span>
      </div>
    </div>
  );
};
