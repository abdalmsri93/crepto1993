/**
 * 🤖 مكون واجهة البحث التلقائي
 * يعرض حالة البحث، الإحصائيات، والسجلات
 */

import React, { useEffect, useState } from 'react';
import { useAutoSearch, AutoSearchLog } from '@/hooks/useAutoSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Clock, 
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  DollarSign,
  Search
} from 'lucide-react';

interface AutoSearchPanelProps {
  usdtBalance?: number;
  onClose?: () => void;
}

export function AutoSearchPanel({ usdtBalance: propBalance, onClose }: AutoSearchPanelProps) {
  const {
    status,
    settings,
    startAutoSearch,
    stopAutoSearch,
    runManualSearch,
    setSearchInterval,
    clearLogs,
    resetStats,
    isRunning,
    isSearching,
    calculatePriceRange,
    getUSDTBalance
  } = useAutoSearch();

  const [currentBalance, setCurrentBalance] = useState(propBalance || 0);
  const [countdown, setCountdown] = useState<string>('--:--');
  const [customMinutes, setCustomMinutes] = useState<string>('');

  // خيارات الوقت المتاحة
  const timeOptions = [
    { label: '1 د', value: 1 },
    { label: '3 د', value: 3 },
    { label: '5 د', value: 5 },
    { label: '10 د', value: 10 },
    { label: '15 د', value: 15 },
    { label: '30 د', value: 30 },
  ];

  // الوقت الحالي بالدقائق
  const currentIntervalMinutes = Math.round(settings.interval / 60000);

  // تحديث الرصيد
  useEffect(() => {
    if (propBalance !== undefined) {
      setCurrentBalance(propBalance);
    } else {
      const balance = getUSDTBalance();
      setCurrentBalance(balance);
    }
  }, [propBalance, getUSDTBalance]);

  // العد التنازلي للبحث التالي
  useEffect(() => {
    if (!status.nextSearch || !isRunning) {
      setCountdown('--:--');
      return;
    }

    const updateCountdown = () => {
      const next = new Date(status.nextSearch!).getTime();
      const now = Date.now();
      const diff = Math.max(0, next - now);
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      setCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status.nextSearch, isRunning]);

  // حساب نطاق السعر
  const priceRange = calculatePriceRange(currentBalance);
  const canSearch = currentBalance >= 1;

  // أيقونة نوع السجل
  const getLogIcon = (type: AutoSearchLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card className="w-full bg-card/95 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            البحث التلقائي الذكي
          </CardTitle>
          <Badge variant={isRunning ? "default" : "secondary"} className="animate-pulse">
            {isRunning ? '🟢 يعمل' : '🔴 متوقف'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* معلومات الرصيد ونطاق السعر */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              رصيد USDT
            </div>
            <div className="text-xl font-bold text-primary">
              ${currentBalance.toFixed(2)}
            </div>
            {!canSearch && (
              <div className="text-xs text-red-500 mt-1">
                ⚠️ الحد الأدنى $1
              </div>
            )}
          </div>

          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Search className="w-4 h-4" />
              نطاق السعر
            </div>
            <div className="text-xl font-bold">
              {canSearch ? (
                <span className="text-green-500">${priceRange.max}</span>
              ) : (
                <span className="text-red-500">—</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              عملات بسعر أقل من
            </div>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{status.searchCount}</div>
            <div className="text-xs text-muted-foreground">دورات</div>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{status.addedCount}</div>
            <div className="text-xs text-muted-foreground">مضاف</div>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">{status.skippedCount}</div>
            <div className="text-xs text-muted-foreground">تخطي</div>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{countdown}</div>
            <div className="text-xs text-muted-foreground">التالي</div>
          </div>
        </div>

        {/* ⏱️ اختيار فترة البحث */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="w-4 h-4" />
            فترة البحث التلقائي
            <Badge variant="outline" className="mr-auto">
              {currentIntervalMinutes} دقيقة
            </Badge>
          </div>
          
          {/* أزرار الوقت السريعة */}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {timeOptions.map((option) => (
              <Button
                key={option.value}
                variant={currentIntervalMinutes === option.value ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setSearchInterval(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* إدخال مخصص */}
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="60"
              placeholder="مخصص..."
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="flex-1 h-8 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-8"
              disabled={!customMinutes || parseInt(customMinutes) < 1}
              onClick={() => {
                const mins = parseInt(customMinutes);
                if (mins >= 1) {
                  setSearchInterval(mins);
                  setCustomMinutes('');
                }
              }}
            >
              تطبيق
            </Button>
          </div>
        </div>

        {/* العملة الحالية */}
        {isSearching && status.currentCoin && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm">جاري تحليل:</span>
            <Badge variant="outline" className="font-mono">
              {status.currentCoin}
            </Badge>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button 
              onClick={startAutoSearch} 
              className="flex-1"
              disabled={!canSearch}
            >
              <Play className="w-4 h-4 ml-2" />
              تشغيل
            </Button>
          ) : (
            <Button 
              onClick={stopAutoSearch} 
              variant="destructive"
              className="flex-1"
            >
              <Pause className="w-4 h-4 ml-2" />
              إيقاف
            </Button>
          )}
          
          <Button 
            onClick={runManualSearch} 
            variant="outline"
            disabled={isSearching || !canSearch}
          >
            <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            onClick={resetStats} 
            variant="ghost"
            size="icon"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* خطأ */}
        {status.error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{status.error}</span>
          </div>
        )}

        {/* السجلات */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              سجل النشاط
            </span>
            <Button 
              onClick={clearLogs} 
              variant="ghost" 
              size="sm"
              className="h-6 text-xs"
            >
              مسح
            </Button>
          </div>
          
          <ScrollArea className="h-48 w-full rounded-lg border border-border/50 bg-background/30">
            <div className="p-2 space-y-1">
              {status.logs.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  لا توجد سجلات بعد
                </div>
              ) : (
                status.logs.map((log, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-background/50"
                  >
                    {getLogIcon(log.type)}
                    <span className="text-muted-foreground shrink-0">
                      {log.timestamp}
                    </span>
                    <span className="flex-1">{log.message}</span>
                    {log.coin && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {log.coin}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* معلومات */}
        <div className="text-xs text-muted-foreground bg-background/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>يبحث كل 5 دقائق عن 5 عملات</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3" />
            <span>يضيف للمفضلات إذا ChatGPT + Gemini نصحا بالشراء</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            <span>يطبق 30+ فلتر ذكي تلقائياً</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AutoSearchPanel;
