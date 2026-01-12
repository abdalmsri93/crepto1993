/**
 * 🔒 خدمة النسخ الاحتياطي لبيانات الاستثمار
 * 
 * تحفظ نسخة احتياطية من:
 * - مبلغ الاستثمار لكل عملة
 * - نسبة الربح المستهدفة لكل عملة
 * - تاريخ الشراء
 * - سجل العملات المباعة (لمنع استرجاع بياناتها)
 * 
 * الهدف: استرجاع البيانات المفقودة تلقائياً + منع مشاكل الغبار
 */

const BACKUP_KEY = 'investment_backup_data';
const SOLD_COINS_KEY = 'sold_coins_registry';

// الحد الأدنى للقيمة (أقل من هذا يعتبر غبار)
export const DUST_THRESHOLD = 1; // $1

export interface CoinInvestmentData {
  symbol: string;
  investment: number;        // مبلغ الاستثمار
  targetProfit: number;      // نسبة الربح المستهدفة
  purchaseDate: string;      // تاريخ الشراء
  lastUpdated: string;       // آخر تحديث
}

export interface InvestmentBackup {
  coins: Record<string, CoinInvestmentData>;
  lastBackup: string;
}

export interface SoldCoinRecord {
  symbol: string;
  soldDate: string;
  soldAmount: number;
  profit: number;
}

/**
 * 📋 جلب قائمة العملات المباعة
 */
export const getSoldCoins = (): Record<string, SoldCoinRecord> => {
  try {
    const saved = localStorage.getItem(SOLD_COINS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('❌ خطأ في قراءة سجل العملات المباعة:', error);
  }
  return {};
};

/**
 * 📝 تسجيل عملة كمباعة
 */
export const markCoinAsSold = (symbol: string, soldAmount: number, profit: number): void => {
  const soldCoins = getSoldCoins();
  soldCoins[symbol] = {
    symbol,
    soldDate: new Date().toISOString(),
    soldAmount,
    profit
  };
  localStorage.setItem(SOLD_COINS_KEY, JSON.stringify(soldCoins));
  console.log(`📋 تم تسجيل ${symbol} كعملة مباعة`);
};

/**
 * ✅ التحقق إذا كانت العملة مباعة
 */
export const isCoinSold = (symbol: string): boolean => {
  const soldCoins = getSoldCoins();
  return !!soldCoins[symbol];
};

/**
 * 🗑️ إزالة عملة من قائمة المباعة (عند إعادة شرائها)
 */
export const unmarkCoinAsSold = (symbol: string): void => {
  const soldCoins = getSoldCoins();
  if (soldCoins[symbol]) {
    delete soldCoins[symbol];
    localStorage.setItem(SOLD_COINS_KEY, JSON.stringify(soldCoins));
    console.log(`🔄 تم إزالة ${symbol} من قائمة المباعة`);
  }
};

/**
 * جلب النسخة الاحتياطية
 */
export const getBackup = (): InvestmentBackup => {
  try {
    const saved = localStorage.getItem(BACKUP_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('❌ خطأ في قراءة النسخة الاحتياطية:', error);
  }
  return { coins: {}, lastBackup: new Date().toISOString() };
};

/**
 * حفظ النسخة الاحتياطية
 */
const saveBackup = (backup: InvestmentBackup): void => {
  try {
    backup.lastBackup = new Date().toISOString();
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    console.log('✅ تم حفظ النسخة الاحتياطية');
  } catch (error) {
    console.error('❌ خطأ في حفظ النسخة الاحتياطية:', error);
  }
};

/**
 * 💾 حفظ بيانات استثمار عملة (نسخة احتياطية + localStorage)
 */
export const backupCoinInvestment = (
  symbol: string, 
  investment: number, 
  targetProfit: number
): void => {
  // إزالة من قائمة المباعة (لأنها أُعيد شراؤها)
  unmarkCoinAsSold(symbol);
  
  // 1. حفظ في localStorage العادي
  localStorage.setItem(`investment_${symbol}`, investment.toString());
  localStorage.setItem(`coin_target_profit_${symbol}`, targetProfit.toString());
  
  // 2. حفظ في النسخة الاحتياطية
  const backup = getBackup();
  backup.coins[symbol] = {
    symbol,
    investment,
    targetProfit,
    purchaseDate: backup.coins[symbol]?.purchaseDate || new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  saveBackup(backup);
  
  console.log(`💾 تم حفظ بيانات ${symbol}: استثمار $${investment}, ربح ${targetProfit}%`);
};

/**
 * 🔍 استرجاع بيانات عملة (من localStorage أو النسخة الاحتياطية)
 * ⚠️ لا يسترجع بيانات العملات المباعة
 */
export const getCoinInvestment = (symbol: string): CoinInvestmentData | null => {
  // ❌ إذا كانت العملة مباعة، لا نرجع بياناتها
  if (isCoinSold(symbol)) {
    console.log(`⏭️ تخطي ${symbol} - عملة مباعة`);
    return null;
  }
  
  // 1. محاولة الجلب من localStorage
  const investment = localStorage.getItem(`investment_${symbol}`);
  const targetProfit = localStorage.getItem(`coin_target_profit_${symbol}`);
  
  if (investment && parseFloat(investment) > 0) {
    return {
      symbol,
      investment: parseFloat(investment),
      targetProfit: targetProfit ? parseFloat(targetProfit) : 5,
      purchaseDate: '',
      lastUpdated: ''
    };
  }
  
  // 2. محاولة الاسترجاع من النسخة الاحتياطية
  const backup = getBackup();
  if (backup.coins[symbol]) {
    console.log(`🔄 استرجاع بيانات ${symbol} من النسخة الاحتياطية`);
    
    // إعادة حفظها في localStorage
    const data = backup.coins[symbol];
    localStorage.setItem(`investment_${symbol}`, data.investment.toString());
    localStorage.setItem(`coin_target_profit_${symbol}`, data.targetProfit.toString());
    
    return data;
  }
  
  return null;
};

/**
 * 🗑️ حذف بيانات عملة بعد البيع الناجح فقط
 */
export const removeCoinInvestment = (symbol: string, sellSuccess: boolean, soldAmount?: number, profit?: number): void => {
  if (!sellSuccess) {
    console.log(`⚠️ لم يتم حذف بيانات ${symbol} - البيع لم ينجح`);
    return;
  }
  
  // 📋 تسجيل العملة كمباعة
  markCoinAsSold(symbol, soldAmount || 0, profit || 0);
  
  // حذف من localStorage
  localStorage.removeItem(`investment_${symbol}`);
  localStorage.removeItem(`coin_target_profit_${symbol}`);
  localStorage.removeItem(`boost_${symbol}`);
  
  // حذف من النسخة الاحتياطية
  const backup = getBackup();
  if (backup.coins[symbol]) {
    delete backup.coins[symbol];
    saveBackup(backup);
  }
  
  console.log(`🗑️ تم حذف بيانات ${symbol} بعد البيع الناجح`);
};

/**
 * 🔄 مزامنة جميع البيانات (استرجاع المفقودة)
 * ⚠️ لا يسترجع بيانات العملات المباعة
 */
export const syncAllInvestments = (): void => {
  const backup = getBackup();
  const soldCoins = getSoldCoins();
  let restored = 0;
  
  for (const symbol of Object.keys(backup.coins)) {
    // ❌ تخطي العملات المباعة
    if (soldCoins[symbol]) {
      console.log(`⏭️ تخطي ${symbol} - عملة مباعة`);
      continue;
    }
    
    const localInvestment = localStorage.getItem(`investment_${symbol}`);
    
    // إذا كانت البيانات مفقودة في localStorage
    if (!localInvestment || parseFloat(localInvestment) <= 0) {
      const data = backup.coins[symbol];
      localStorage.setItem(`investment_${symbol}`, data.investment.toString());
      localStorage.setItem(`coin_target_profit_${symbol}`, data.targetProfit.toString());
      restored++;
      console.log(`🔄 تم استرجاع بيانات ${symbol}`);
    }
  }
  
  if (restored > 0) {
    console.log(`✅ تم استرجاع بيانات ${restored} عملة من النسخة الاحتياطية`);
  }
};

/**
 * 📋 جلب قائمة جميع العملات المحفوظة
 */
export const getAllBackedUpCoins = (): CoinInvestmentData[] => {
  const backup = getBackup();
  return Object.values(backup.coins);
};

/**
 * 🔧 إصلاح بيانات عملة محددة (للاستخدام اليدوي في حالات الطوارئ)
 * ⚠️ لا يعمل للعملات المباعة
 */
export const repairCoinData = (
  symbol: string, 
  investment: number, 
  targetProfit: number
): boolean => {
  // ❌ لا نصلح بيانات عملة مباعة
  if (isCoinSold(symbol)) {
    console.log(`❌ لا يمكن إصلاح ${symbol} - عملة مباعة`);
    return false;
  }
  
  backupCoinInvestment(symbol, investment, targetProfit);
  console.log(`🔧 تم إصلاح بيانات ${symbol} يدوياً`);
  return true;
};

/**
 * 🔍 التحقق إذا كانت العملة غبار (قيمة منخفضة جداً)
 */
export const isDustCoin = (usdValue: number): boolean => {
  return usdValue < DUST_THRESHOLD;
};

/**
 * 🧹 تنظيف بيانات FET المباعة (لمرة واحدة)
 */
export const cleanupSoldFET = (): void => {
  // تسجيل FET كعملة مباعة إذا لم تكن مسجلة
  if (!isCoinSold('FET')) {
    markCoinAsSold('FET', 5.13, 0.13);
    // حذف بياناتها
    localStorage.removeItem('investment_FET');
    localStorage.removeItem('coin_target_profit_FET');
    localStorage.removeItem('boost_FET');
    
    const backup = getBackup();
    if (backup.coins['FET']) {
      delete backup.coins['FET'];
      saveBackup(backup);
    }
    console.log('🧹 تم تنظيف بيانات FET المباعة');
  }
};

// 🚀 تنظيف FET عند التحميل
cleanupSoldFET();
