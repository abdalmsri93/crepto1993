/**
 * 🎯 خدمة التداول الذكي - نظام النسب المتصاعدة
 * 
 * الميزات:
 * - نسب ربح متصاعدة (5% → 10% → 15% ... → 100% → 5%)
 * - حد أقصى للمحفظة (50 عملة)
 * - دورات من 3 عملات
 * - التحقق من الرصيد قبل الشراء
 */

// مفاتيح التخزين
const SMART_TRADING_KEY = 'smart_trading_settings';
const SMART_TRADING_STATE_KEY = 'smart_trading_state';

// الإعدادات الافتراضية
export interface SmartTradingSettings {
  enabled: boolean;
  coinsPerCycle: number;      // عدد العملات لكل دورة (افتراضي: 3)
  maxPortfolioCoins: number;  // الحد الأقصى للمحفظة (افتراضي: 50)
  buyAmount: number;          // مبلغ الشراء لكل عملة (افتراضي: $5)
  startProfitPercent: number; // نسبة البداية (افتراضي: 5%)
  profitIncrement: number;    // زيادة النسبة (افتراضي: 5%)
  maxProfitPercent: number;   // أقصى نسبة (افتراضي: 100%)
}

// حالة النظام
export interface SmartTradingState {
  currentCycle: number;           // رقم الدورة الحالية
  currentProfitPercent: number;   // النسبة الحالية
  soldInCurrentCycle: number;     // عدد المباعة في الدورة الحالية
  totalCyclesCompleted: number;   // إجمالي الدورات المكتملة
  totalProfit: number;            // إجمالي الربح
  lastUpdated: string;            // آخر تحديث
  pendingCoins: string[];         // العملات قيد الانتظار
}

// الإعدادات الافتراضية
const DEFAULT_SETTINGS: SmartTradingSettings = {
  enabled: true,             // ✅ مفعل تلقائياً
  coinsPerCycle: 1,          // ← عملة واحدة = زيادة النسبة
  maxPortfolioCoins: 50,
  buyAmount: 5,
  startProfitPercent: 3,     // ← نسبة البداية 3%
  profitIncrement: 2,        // ← زيادة +2% كل دورة
  maxProfitPercent: 15,      // ← أقصى نسبة 15%
};

// الحالة الافتراضية
const DEFAULT_STATE: SmartTradingState = {
  currentCycle: 1,
  currentProfitPercent: 3,   // ← تبدأ من 3%
  soldInCurrentCycle: 0,
  totalCyclesCompleted: 0,
  totalProfit: 0,
  lastUpdated: new Date().toISOString(),
  pendingCoins: [],
};

// ================= دوال الإعدادات =================

export const getSmartTradingSettings = (): SmartTradingSettings => {
  try {
    const stored = localStorage.getItem(SMART_TRADING_KEY);
    if (stored) {
      const savedSettings = JSON.parse(stored);
      // 🔄 إجبار تحديث النسب للنظام الجديد (3% → 15%)
      const updated = { 
        ...DEFAULT_SETTINGS, 
        ...savedSettings,
        // إجبار النسب الجديدة
        startProfitPercent: DEFAULT_SETTINGS.startProfitPercent,
        profitIncrement: DEFAULT_SETTINGS.profitIncrement,
        maxProfitPercent: DEFAULT_SETTINGS.maxProfitPercent,
      };
      return updated;
    }
  } catch (error) {
    console.error('خطأ في قراءة إعدادات التداول الذكي:', error);
  }
  return DEFAULT_SETTINGS;
};

export const saveSmartTradingSettings = (settings: Partial<SmartTradingSettings>): void => {
  try {
    const current = getSmartTradingSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SMART_TRADING_KEY, JSON.stringify(updated));
    console.log('⚙️ تم حفظ إعدادات التداول الذكي:', updated);
  } catch (error) {
    console.error('خطأ في حفظ إعدادات التداول الذكي:', error);
  }
};

// ================= دوال الحالة =================

export const getSmartTradingState = (): SmartTradingState => {
  try {
    const stored = localStorage.getItem(SMART_TRADING_STATE_KEY);
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('خطأ في قراءة حالة التداول الذكي:', error);
  }
  return DEFAULT_STATE;
};

export const saveSmartTradingState = (state: Partial<SmartTradingState>): void => {
  try {
    const current = getSmartTradingState();
    const updated = { 
      ...current, 
      ...state, 
      lastUpdated: new Date().toISOString() 
    };
    localStorage.setItem(SMART_TRADING_STATE_KEY, JSON.stringify(updated));
    console.log('📊 تم حفظ حالة التداول الذكي:', updated);
  } catch (error) {
    console.error('خطأ في حفظ حالة التداول الذكي:', error);
  }
};

export const resetSmartTradingState = (): void => {
  localStorage.setItem(SMART_TRADING_STATE_KEY, JSON.stringify(DEFAULT_STATE));
  console.log('🔄 تم إعادة تعيين حالة التداول الذكي');
};

// ================= دوال المنطق الرئيسية =================

/**
 * التحقق من أن الرصيد كافي للشراء
 */
export const checkSufficientBalance = (usdtBalance: number): { 
  sufficient: boolean; 
  required: number; 
  available: number;
  message: string;
} => {
  const settings = getSmartTradingSettings();
  const required = settings.coinsPerCycle * settings.buyAmount;
  const sufficient = usdtBalance >= required;
  
  return {
    sufficient,
    required,
    available: usdtBalance,
    message: sufficient 
      ? `✅ الرصيد كافي: $${usdtBalance.toFixed(2)} (مطلوب: $${required})`
      : `⚠️ الرصيد غير كافي! متوفر: $${usdtBalance.toFixed(2)} - مطلوب: $${required}`,
  };
};

/**
 * التحقق من أن المحفظة غير ممتلئة
 */
export const checkPortfolioCapacity = (currentCoins: number): {
  hasCapacity: boolean;
  current: number;
  max: number;
  message: string;
} => {
  const settings = getSmartTradingSettings();
  const hasCapacity = currentCoins < settings.maxPortfolioCoins;
  
  return {
    hasCapacity,
    current: currentCoins,
    max: settings.maxPortfolioCoins,
    message: hasCapacity 
      ? `✅ المحفظة متاحة: ${currentCoins}/${settings.maxPortfolioCoins}`
      : `⚠️ المحفظة ممتلئة! ${currentCoins}/${settings.maxPortfolioCoins}`,
  };
};

/**
 * التحقق من إمكانية بدء دورة جديدة
 */
export const canStartNewCycle = (usdtBalance: number, portfolioCoins: number): {
  canStart: boolean;
  reasons: string[];
} => {
  const settings = getSmartTradingSettings();
  const state = getSmartTradingState();
  const reasons: string[] = [];
  
  // 1. التحقق من الرصيد
  const balanceCheck = checkSufficientBalance(usdtBalance);
  if (!balanceCheck.sufficient) {
    reasons.push(balanceCheck.message);
  }
  
  // 2. التحقق من المحفظة
  const capacityCheck = checkPortfolioCapacity(portfolioCoins);
  if (!capacityCheck.hasCapacity) {
    reasons.push(capacityCheck.message);
  }
  
  // 3. التحقق من أن الدورة الحالية مكتملة
  if (state.pendingCoins.length >= settings.coinsPerCycle) {
    reasons.push(`⏳ يوجد ${state.pendingCoins.length} عملات قيد الانتظار`);
  }
  
  return {
    canStart: reasons.length === 0,
    reasons,
  };
};

/**
 * الحصول على نسبة الربح الحالية
 */
export const getCurrentProfitPercent = (): number => {
  const state = getSmartTradingState();
  return state.currentProfitPercent;
};

/**
 * حفظ نسبة البيع لعملة معينة
 */
export const saveCoinTargetProfit = (coinSymbol: string, profitPercent: number): void => {
  localStorage.setItem(`coin_target_profit_${coinSymbol}`, profitPercent.toString());
  console.log(`🎯 تم حفظ نسبة البيع ${profitPercent}% لـ ${coinSymbol}`);
};

/**
 * جلب نسبة البيع لعملة معينة
 */
export const getCoinTargetProfit = (coinSymbol: string): number => {
  const saved = localStorage.getItem(`coin_target_profit_${coinSymbol}`);
  if (saved) {
    return parseFloat(saved);
  }
  // إذا لم تكن محفوظة، نرجع النسبة الافتراضية
  const settings = getSmartTradingSettings();
  return settings.startProfitPercent;
};

/**
 * حذف نسبة البيع لعملة (بعد البيع)
 */
export const removeCoinTargetProfit = (coinSymbol: string): void => {
  localStorage.removeItem(`coin_target_profit_${coinSymbol}`);
};

/**
 * تعيين نسب البيع للعملات الموجودة تلقائياً
 * تُعيد تعيين النسب دائماً حسب الترتيب (3%, 5%, 7%...)
 */
export const assignProfitPercentsToExistingCoins = (coins: string[]): void => {
  const settings = getSmartTradingSettings();
  let currentPercent = settings.startProfitPercent; // 3%
  
  // 🔄 مسح النسب القديمة أولاً لضمان التحديث
  for (const coin of coins) {
    localStorage.removeItem(`coin_target_profit_${coin}`);
  }
  
  for (const coin of coins) {
    // تعيين النسبة الجديدة (3% → 5% → 7% ...)
    saveCoinTargetProfit(coin, currentPercent);
    console.log(`🎯 تعيين ${coin}: ${currentPercent}%`);
    
    // زيادة النسبة للعملة التالية (+2%)
    currentPercent += settings.profitIncrement;
    if (currentPercent > settings.maxProfitPercent) {
      currentPercent = settings.startProfitPercent;
    }
  }
  
  // تحديث النسبة الحالية في الحالة للعملة القادمة
  saveSmartTradingState({ currentProfitPercent: currentPercent });
  console.log(`📈 النسبة القادمة: ${currentPercent}%`);
};

/**
 * تسجيل عملية شراء جديدة مع حفظ نسبة البيع
 */
export const registerBuy = (coinSymbol: string): void => {
  const settings = getSmartTradingSettings();
  const state = getSmartTradingState();
  const pendingCoins = [...state.pendingCoins];
  
  if (!pendingCoins.includes(coinSymbol)) {
    pendingCoins.push(coinSymbol);
    
    // 🎯 حفظ النسبة الحالية لهذه العملة
    const currentPercent = state.currentProfitPercent;
    saveCoinTargetProfit(coinSymbol, currentPercent);
    
    console.log(`🛒 تم تسجيل شراء ${coinSymbol} بنسبة بيع ${currentPercent}% - العملات المعلقة: ${pendingCoins.length}`);
    
    // ✅ زيادة النسبة للعملة القادمة (+2%)
    let newProfitPercent = currentPercent + settings.profitIncrement;
    
    // إذا تجاوزت الحد الأقصى، ترجع للبداية
    if (newProfitPercent > settings.maxProfitPercent) {
      newProfitPercent = settings.startProfitPercent;
      console.log(`🔄 النسبة وصلت ${settings.maxProfitPercent}% - ترجع لـ ${settings.startProfitPercent}%`);
    }
    
    console.log(`📈 النسبة القادمة للشراء التالي: ${newProfitPercent}%`);
    
    // ✅ تحديث الحالة مع النسبة الجديدة
    saveSmartTradingState({ 
      pendingCoins,
      currentProfitPercent: newProfitPercent
    });
  }
};

/**
 * تسجيل عملية بيع وتحديث الدورة
 */
export const registerSell = (coinSymbol: string, profit: number): {
  cycleCompleted: boolean;
  newProfitPercent: number;
} => {
  const settings = getSmartTradingSettings();
  const state = getSmartTradingState();
  
  // إزالة العملة من المعلقة
  const pendingCoins = state.pendingCoins.filter(c => c !== coinSymbol);
  
  // حذف نسبة البيع المحفوظة لهذه العملة
  removeCoinTargetProfit(coinSymbol);
  
  // 💰 زيادة إجمالي الربح
  const totalProfit = state.totalProfit + profit;
  
  const newCycle = state.currentCycle + 1;
  const totalCyclesCompleted = state.totalCyclesCompleted + 1;
  
  console.log(`🎉 تم بيع ${coinSymbol}! الربح: $${profit.toFixed(2)}`);
  
  // ✅ حفظ الحالة الجديدة - النسبة لا تتغير في البيع
  saveSmartTradingState({
    pendingCoins,
    soldInCurrentCycle: 0,
    currentCycle: newCycle,
    totalCyclesCompleted,
    totalProfit,
  });
  
  console.log(`💰 إجمالي الربح: $${totalProfit.toFixed(2)} | النسبة الحالية للشراء القادم: ${state.currentProfitPercent}% | الدورة: #${newCycle}`);
  
  return {
    cycleCompleted: true,
    newProfitPercent: state.currentProfitPercent, // النسبة الحالية لم تتغير
  };
};

/**
 * الحصول على عدد العملات المتبقية لاكتمال الدورة
 */
export const getRemainingForCycle = (): {
  sold: number;
  total: number;
  remaining: number;
} => {
  const settings = getSmartTradingSettings();
  const state = getSmartTradingState();
  
  return {
    sold: state.soldInCurrentCycle,
    total: settings.coinsPerCycle,
    remaining: settings.coinsPerCycle - state.soldInCurrentCycle,
  };
};

/**
 * الحصول على ملخص الحالة
 */
export const getSmartTradingSummary = (): {
  enabled: boolean;
  currentCycle: number;
  currentProfitPercent: number;
  soldInCycle: string;
  pendingCoins: number;
  totalCycles: number;
  totalProfit: number;
  nextProfitPercent: number;
} => {
  const settings = getSmartTradingSettings();
  const state = getSmartTradingState();
  
  let nextProfitPercent = state.currentProfitPercent + settings.profitIncrement;
  if (nextProfitPercent > settings.maxProfitPercent) {
    nextProfitPercent = settings.startProfitPercent;
  }
  
  return {
    enabled: settings.enabled,
    currentCycle: state.currentCycle,
    currentProfitPercent: state.currentProfitPercent,
    soldInCycle: `${state.soldInCurrentCycle}/${settings.coinsPerCycle}`,
    pendingCoins: state.pendingCoins.length,
    totalCycles: state.totalCyclesCompleted,
    totalProfit: state.totalProfit,
    nextProfitPercent,
  };
};

/**
 * مزامنة العملات الموجودة في المحفظة مع نظام التداول الذكي
 * يضيف العملات التي لها استثمار محفوظ إلى قائمة الانتظار
 */
export const syncPortfolioWithSmartTrading = (): {
  synced: string[];
  message: string;
} => {
  const settings = getSmartTradingSettings();
  const state = getSmartTradingState();
  const synced: string[] = [];
  
  // جلب كل العملات من localStorage التي لها استثمار محفوظ
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('investment_')) {
      const symbol = key.replace('investment_', '');
      const investment = parseFloat(localStorage.getItem(key) || '0');
      
      // إذا كان لها استثمار ولم تكن مسجلة
      if (investment > 0 && !state.pendingCoins.includes(symbol)) {
        synced.push(symbol);
      }
    }
  }
  
  // إضافة العملات المتزامنة (حتى الحد الأقصى للدورة)
  const maxToSync = Math.min(synced.length, settings.coinsPerCycle - state.pendingCoins.length);
  const toAdd = synced.slice(0, maxToSync);
  
  if (toAdd.length > 0) {
    const newPendingCoins = [...state.pendingCoins, ...toAdd];
    saveSmartTradingState({ pendingCoins: newPendingCoins });
    console.log(`🔄 تم مزامنة ${toAdd.length} عملة:`, toAdd);
  }
  
  return {
    synced: toAdd,
    message: toAdd.length > 0 
      ? `تم مزامنة ${toAdd.length} عملة: ${toAdd.join(', ')}`
      : 'لا توجد عملات جديدة للمزامنة',
  };
};

/**
 * الحصول على قائمة العملات المعلقة
 */
export const getPendingCoins = (): string[] => {
  const state = getSmartTradingState();
  return state.pendingCoins;
};
