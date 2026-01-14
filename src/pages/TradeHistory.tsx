import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTradeHistory, getTradeStats, clearTradeHistory, clearAllTradingData, TradeRecord } from "@/services/tradeHistory";
import { useToast } from "@/hooks/use-toast";
import { getCoinInvestment, isCoinSold } from "@/services/investmentBackupService";
import { getCoinTargetProfit } from "@/services/smartTradingService";

const TradeHistory = () => {
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getTradeStats> | null>(null);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadHistory = () => {
    setHistory(getTradeHistory());
    setStats(getTradeStats());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = () => {
    if (confirm('هل أنت متأكد من حذف كل السجلات؟')) {
      clearTradeHistory();
      loadHistory();
      toast({
        title: "🗑️ تم المسح",
        description: "تم حذف جميع سجلات العمليات",
      });
    }
  };

  const handleFullReset = () => {
    if (confirm('⚠️ تحذير: سيتم مسح جميع بيانات التداول!\n\nهذا يشمل:\n- سجل العمليات\n- بيانات الاستثمار\n- سجل العملات المباعة\n\nهل أنت متأكد؟')) {
      clearAllTradingData();
      loadHistory();
      toast({
        title: "🔄 تم إعادة الضبط",
        description: "تم مسح جميع بيانات التداول - ابدأ من جديد!",
      });
      // إعادة تحميل الصفحة لتحديث كل شيء
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const filteredHistory = history.filter(record => {
    if (filter === 'all') return true;
    
    // فلتر الشراء: فقط العملات المشتراة ولم تُبع
    if (filter === 'buy') {
      return record.type === 'buy' && !isCoinSold(record.asset);
    }
    
    // فلتر البيع: كل عمليات البيع
    return record.type === filter;
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* الرأس */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold font-orbitron flex items-center gap-3">
            <History className="w-7 h-7 text-crypto-gold" />
            سجل العمليات
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadHistory} title="تحديث">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleClearHistory} className="text-red-500 hover:text-red-600" title="مسح السجل">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* زر إعادة الضبط الكاملة */}
        <div className="flex justify-center">
          <Button 
            variant="destructive" 
            onClick={handleFullReset}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            🔄 إعادة ضبط كاملة (مسح كل البيانات)
          </Button>
        </div>

        {/* الإحصائيات */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats.totalTrades}</p>
                <p className="text-xs text-muted-foreground">إجمالي العمليات</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-green-500/20">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-500">{stats.successfulBuys}</p>
                <p className="text-xs text-muted-foreground">عمليات شراء</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-purple-500/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-purple-500">{stats.successfulSells}</p>
                <p className="text-xs text-muted-foreground">عمليات بيع</p>
              </CardContent>
            </Card>
            
            <Card className={`bg-card/50 backdrop-blur ${stats.totalProfit >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
              <CardContent className="p-4 text-center">
                <DollarSign className={`w-6 h-6 mx-auto mb-2 ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}$
                </p>
                <p className="text-xs text-muted-foreground">إجمالي الربح</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* فلتر */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-crypto-gold' : ''}
          >
            الكل ({history.length})
          </Button>
          <Button
            variant={filter === 'buy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('buy')}
            className={filter === 'buy' ? 'bg-green-500' : ''}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            شراء ({history.filter(r => r.type === 'buy').length})
          </Button>
          <Button
            variant={filter === 'sell' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('sell')}
            className={filter === 'sell' ? 'bg-purple-500' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            بيع ({history.filter(r => r.type === 'sell').length})
          </Button>
        </div>

        {/* قائمة العمليات */}
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">العمليات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد عمليات مسجلة</p>
                <p className="text-sm mt-2">ستظهر هنا عمليات الشراء والبيع التلقائية</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border ${
                      record.status === 'failed' 
                        ? 'bg-red-500/5 border-red-500/30' 
                        : record.type === 'buy'
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-purple-500/5 border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* أيقونة النوع */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.status === 'failed'
                            ? 'bg-red-500/20'
                            : record.type === 'buy'
                              ? 'bg-green-500/20'
                              : 'bg-purple-500/20'
                        }`}>
                          {record.status === 'failed' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : record.type === 'buy' ? (
                            <ShoppingCart className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                          )}
                        </div>
                        
                        {/* تفاصيل العملية */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{record.asset}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              record.status === 'failed'
                                ? 'bg-red-500/20 text-red-500'
                                : record.type === 'buy'
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-purple-500/20 text-purple-500'
                            }`}>
                              {record.status === 'failed' ? 'فشل' : record.type === 'buy' ? 'شراء' : 'بيع'}
                            </span>
                            {record.status === 'success' && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(record.timestamp)}
                          </p>
                          {record.error && (
                            <p className="text-xs text-red-500 mt-1">{record.error}</p>
                          )}
                        </div>
                        
                        {/* 🎯 نسبة البيع والهدف */}
                        {(() => {
                          // إزالة USDT من نهاية الرمز
                          const cleanSymbol = record.asset.replace(/USDT$/i, '');
                          const investmentData = getCoinInvestment(cleanSymbol);
                          const investment = investmentData?.investment || 0;
                          const targetPercent = getCoinTargetProfit(cleanSymbol);
                          const targetValue = investment > 0 ? investment * (1 + targetPercent / 100) : 0;
                          
                          return investment > 0 ? (
                            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30 px-3 py-2 min-w-[90px]">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] text-green-400">🎯 نسبة البيع</span>
                                <span className="text-green-400 font-bold text-sm">{targetPercent}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-emerald-400">💰 الهدف</span>
                                <span className="text-emerald-400 font-bold text-sm">${targetValue.toFixed(2)}</span>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      
                      {/* المبلغ والربح */}
                      <div className="text-left">
                        <p className="font-mono font-bold">
                          {record.amount.toFixed(6)} {record.asset}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${record.total.toFixed(2)}
                        </p>
                        {record.type === 'sell' && record.profit !== undefined && (
                          <p className={`text-sm font-bold ${record.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {record.profit >= 0 ? '+' : ''}{record.profit.toFixed(2)}$ ({record.profitPercent?.toFixed(1)}%)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradeHistory;
