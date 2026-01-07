/**
 * صفحة إعدادات التداول - Binance API Keys
 * إعداد مفاتيح API والشراء التلقائي
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowRight, 
  Key, 
  Shield, 
  DollarSign, 
  Settings, 
  CheckCircle2, 
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  TestTube,
  Wallet,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {
  saveCredentials,
  getCredentials,
  hasCredentials,
  clearCredentials,
  validateCredentials,
  getAutoBuySettings,
  saveAutoBuySettings,
  getUSDTBalance,
  AutoBuySettings,
} from '@/services/binanceTrading';

const TradingSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // API Keys State
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isKeysConfigured, setIsKeysConfigured] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [keysValid, setKeysValid] = useState<boolean | null>(null);

  // Auto-Buy Settings State
  const [autoBuyEnabled, setAutoBuyEnabled] = useState(false);
  const [autoBuyAmount, setAutoBuyAmount] = useState('10');
  const [testnetMode, setTestnetMode] = useState(false);

  // Balance State
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const credentials = getCredentials();
    const configured = !!credentials;
    setIsKeysConfigured(configured);
    
    if (configured) {
      setKeysValid(true);
      // لا نملأ الحقول، نتركها فارغة مع placeholder
      setApiKey('');
      setSecretKey('');
    }

    const settings = getAutoBuySettings();
    setAutoBuyEnabled(settings.enabled);
    setAutoBuyAmount(String(settings.amount));
    setTestnetMode(settings.testnetMode);
  }, []);

  // Fetch balance when keys are configured
  useEffect(() => {
    if (isKeysConfigured && keysValid) {
      fetchBalance();
    }
  }, [isKeysConfigured, keysValid]);

  const fetchBalance = async () => {
    console.log('🔄 [TradingSettings] بدء جلب الرصيد...');
    setIsLoadingBalance(true);
    try {
      const balance = await getUSDTBalance();
      console.log('✅ [TradingSettings] تم جلب الرصيد:', balance);
      setUsdtBalance(balance);
    } catch (error) {
      console.error('❌ [TradingSettings] فشل جلب الرصيد:', error);
      toast({
        title: '❌ خطأ',
        description: `فشل جلب الرصيد: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!apiKey || !secretKey) {
      toast({
        title: '⚠️ خطأ',
        description: 'يرجى إدخال مفاتيح API كاملة',
        variant: 'destructive',
      });
      return;
    }

    console.log('💾 [handleSaveKeys] حفظ المفاتيح...');
    setIsValidating(true);

    // حفظ المفاتيح
    saveCredentials(apiKey.trim(), secretKey.trim());
    console.log('✅ [handleSaveKeys] تم حفظ المفاتيح في localStorage');
    
    // التحقق من الحفظ
    const saved = getCredentials();
    console.log('🔍 [handleSaveKeys] التحقق من الحفظ:', saved ? 'موجودة ✅' : 'فشل ❌');
    
    setIsKeysConfigured(true);

    // التحقق من صلاحية المفاتيح
    console.log('🔍 [handleSaveKeys] التحقق من صلاحية المفاتيح...');
    const validation = await validateCredentials();
    console.log('📊 [handleSaveKeys] نتيجة التحقق:', validation);

    if (validation.valid) {
      setKeysValid(true);
      
      toast({
        title: '✅ تم الحفظ بنجاح',
        description: 'مفاتيح API صالحة ومحفوظة',
      });

      console.log('💰 [handleSaveKeys] جلب الرصيد...');
      // جلب الرصيد
      await fetchBalance();
    } else {
      setKeysValid(false);
      
      toast({
        title: '⚠️ تحذير',
        description: validation.error || 'فشل التحقق من المفاتيح، لكن تم حفظها. تأكد من صحة المفاتيح.',
        variant: 'destructive',
      });
    }

    setIsValidating(false);
  };

  const handleClearKeys = () => {
    clearCredentials();
    setApiKey('');
    setSecretKey('');
    setIsKeysConfigured(false);
    setKeysValid(null);
    setUsdtBalance(null);
    
    toast({
      title: '🗑️ تم الحذف',
      description: 'تم حذف مفاتيح API',
    });
  };

  const handleSaveAutoBuySettings = () => {
    const amount = parseFloat(autoBuyAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: '⚠️ خطأ',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive',
      });
      return;
    }

    saveAutoBuySettings({
      enabled: autoBuyEnabled,
      amount: amount,
      testnetMode: testnetMode,
    });

    toast({
      title: '✅ تم الحفظ',
      description: autoBuyEnabled 
        ? `الشراء التلقائي مفعّل بمبلغ $${amount} لكل عملة`
        : 'الشراء التلقائي معطّل',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-right mb-2 bg-gradient-to-l from-primary via-accent to-primary bg-clip-text text-transparent flex items-center gap-3">
              <Settings className="w-8 h-8" />
              إعدادات التداول
            </h1>
            <p className="text-muted-foreground text-right">
              ربط حسابك في Binance وتفعيل الشراء التلقائي
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            العودة
          </Button>
        </div>

        {/* API Keys Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Key className="w-5 h-5 text-crypto-gold" />
              مفاتيح Binance API
            </CardTitle>
            <CardDescription className="text-right">
              أدخل مفاتيح API من حسابك في Binance للتداول
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              {isKeysConfigured && keysValid ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-500 font-medium">مفاتيح API مُعدّة وصالحة</span>
                </>
              ) : isKeysConfigured && keysValid === false ? (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-medium">مفاتيح API غير صالحة</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">لم يتم إعداد مفاتيح API</span>
                </>
              )}
            </div>

            {/* Balance Display */}
            {isKeysConfigured && keysValid && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Wallet className="w-5 h-5 text-green-500" />
                <span className="text-green-500 font-medium">
                  رصيد USDT: {isLoadingBalance ? (
                    <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                  ) : (
                    `$${usdtBalance?.toFixed(2) || '0.00'}`
                  )}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchBalance}
                  disabled={isLoadingBalance}
                >
                  🔄
                </Button>
              </div>
            )}

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-right block">API Key</Label>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="أدخل API Key من Binance"
                className="font-mono text-sm"
                dir="ltr"
              />
            </div>

            {/* Secret Key Input */}
            <div className="space-y-2">
              <Label htmlFor="secretKey" className="text-right block">Secret Key</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="أدخل Secret Key من Binance"
                  className="font-mono text-sm pr-10"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleSaveKeys} 
                disabled={isValidating}
                className="flex-1 bg-gradient-to-r from-crypto-gold to-orange-500"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    حفظ والتحقق
                  </>
                )}
              </Button>
              
              {isKeysConfigured && (
                <Button 
                  variant="destructive" 
                  onClick={handleClearKeys}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف
                </Button>
              )}
            </div>

            {/* Security Note */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <strong>ملاحظة أمنية:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>المفاتيح مشفرة ومخزنة محلياً فقط</li>
                <li>استخدم مفاتيح API بصلاحيات التداول فقط</li>
                <li>فعّل IP Whitelist في Binance للأمان</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Buy Settings Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <DollarSign className="w-5 h-5 text-green-500" />
              إعدادات الشراء التلقائي
            </CardTitle>
            <CardDescription className="text-right">
              عند تفعيل هذه الميزة، سيتم شراء العملة تلقائياً عند إضافتها للمفضلات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-Buy Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Switch
                  id="autoBuy"
                  checked={autoBuyEnabled}
                  onCheckedChange={setAutoBuyEnabled}
                  disabled={!isKeysConfigured}
                />
                <Label htmlFor="autoBuy" className="cursor-pointer">
                  تفعيل الشراء التلقائي
                </Label>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                autoBuyEnabled 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {autoBuyEnabled ? 'مفعّل' : 'معطّل'}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-right block">
                المبلغ لكل عملة (USDT)
              </Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={autoBuyAmount}
                  onChange={(e) => setAutoBuyAmount(e.target.value)}
                  className="pr-8"
                  placeholder="10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                المبلغ الذي سيُشترى به كل عملة تُضاف للمفضلات (حسب قواعد Binance لكل عملة)
              </p>
            </div>

            {/* Testnet Mode */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Switch
                  id="testnet"
                  checked={testnetMode}
                  onCheckedChange={setTestnetMode}
                />
                <Label htmlFor="testnet" className="cursor-pointer flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-yellow-500" />
                  وضع الاختبار (Testnet)
                </Label>
              </div>
              <span className="text-xs text-yellow-500">
                للتجربة بدون أموال حقيقية
              </span>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSaveAutoBuySettings}
              className="w-full"
              disabled={!isKeysConfigured}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              حفظ إعدادات الشراء التلقائي
            </Button>

            {!isKeysConfigured && (
              <p className="text-center text-sm text-yellow-500">
                ⚠️ يجب إعداد مفاتيح API أولاً
              </p>
            )}
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-right">🔄 كيف يعمل الشراء التلقائي؟</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <span>تبحث عن عملات جديدة في صفحة "استكشاف العملات"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <span>الذكاء الاصطناعي يحلل العملات ويوصي بالشراء</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <span>عند إضافة عملة للمفضلات (يدوياً أو تلقائياً)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-500/20 text-green-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✓</span>
                <span className="text-green-500 font-medium">يتم شراء العملة تلقائياً بالمبلغ المحدد!</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/favorites')}
            className="flex-1"
          >
            📋 المفضلات
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/trade-history')}
            className="flex-1"
          >
            📊 سجل الصفقات
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradingSettings;
