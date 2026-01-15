/**
 * 🛡️ خدمة التحقق من العملات - للحماية من العملات المشبوهة
 * تتحقق من وجود العملة على CoinGecko وصحتها
 */

// ⏱️ Cache للتحقق السريع (تجنب طلبات كثيرة)
const verificationCache = new Map<string, { verified: boolean; timestamp: number; data?: CoinInfo }>();
const CACHE_DURATION = 60 * 60 * 1000; // ساعة واحدة

// 🔐 معلومات العملة من CoinGecko
export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number | null;
  marketCap: number;
  totalVolume: number;
  ath: number; // All Time High
  athDate: string;
  launchDate?: string;
  categories: string[];
  description?: string;
  trustScore?: number;
}

// ✅ قائمة بيضاء - عملات موثوقة 100% (Top 200 من CoinGecko + عملات معروفة)
export const WHITELIST_COINS: string[] = [
  // Top 10
  'BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOGE', 'TRX', 'AVAX', 'LINK',
  // Top 11-30
  'DOT', 'MATIC', 'SHIB', 'LTC', 'BCH', 'ATOM', 'UNI', 'XLM', 'ETC', 'ICP',
  'FIL', 'APT', 'NEAR', 'VET', 'HBAR', 'OP', 'ARB', 'IMX', 'MKR', 'GRT',
  // Top 31-60
  'ALGO', 'QNT', 'AAVE', 'EOS', 'SAND', 'MANA', 'AXS', 'THETA', 'XTZ', 'EGLD',
  'FLOW', 'SNX', 'CHZ', 'KCS', 'CRV', 'KAVA', 'FTM', 'NEO', 'XMR', 'ZEC',
  'DASH', 'COMP', 'BAT', 'ENJ', 'LRC', '1INCH', 'ANKR', 'CELO', 'ZIL', 'IOTA',
  // Top 61-100
  'ROSE', 'DYDX', 'YFI', 'KSM', 'RUNE', 'WAVES', 'ICX', 'SUSHI', 'HOT', 'GMT',
  'GALA', 'APE', 'JASMY', 'BLUR', 'MASK', 'LDO', 'RPL', 'SSV', 'SUI', 'SEI',
  'TIA', 'PYTH', 'JTO', 'WIF', 'BONK', 'PEPE', 'FLOKI', 'MEME', 'INJ', 'FET',
  // Top 101-200
  'AGIX', 'OCEAN', 'RNDR', 'AR', 'STX', 'MINA', 'GMX', 'CFX', 'SXP', 'SKL',
  'ONT', 'AUDIO', 'REN', 'BAND', 'STORJ', 'NKN', 'OGN', 'CVC', 'CTSI', 'ARPA',
  'ACH', 'DENT', 'WIN', 'SLP', 'TLM', 'ALICE', 'YGG', 'HIGH', 'MAGIC', 'LQTY',
  'RDNT', 'PENDLE', 'HOOK', 'EDU', 'ID', 'ARKM', 'CYBER', 'WLD', 'ORDI', 'BAKE',
  // عملات أخرى شائعة
  'CAKE', 'LUNA2', 'LUNC2', 'STG', 'LEVER', 'BEL', 'FRONT', 'CVX', 'ALCX', 'PERP'
];

// 🚫 قائمة سوداء موسعة - عملات خطيرة أو مشبوهة
export const EXTENDED_BLACKLIST: string[] = [
  // انهيارات كبيرة
  'LUNA', 'LUNC', 'UST', 'USTC', 'FTT', 'SRM',
  // Stablecoins (لا نحتاج الاستثمار فيها)
  'BUSD', 'TUSD', 'PAX', 'USDP', 'GUSD', 'DAI', 'USDC', 'FDUSD', 'FRAX', 'LUSD',
  // Wrapped tokens (ليست أصلية)
  'WBTC', 'WETH', 'STETH', 'RETH', 'WBNB', 'WMATIC',
  // عملات برموز مشبوهة (حرف واحد أو رقم)
  'A', 'B', 'C', 'X', 'Y', 'Z', '1', '2', '3',
  // عملات تم إيقافها أو لها مشاكل
  'DREP', 'MBL', 'TORN', 'MDX', 'BIFI', 'TROY', 'DOCK', 'HARD', 'CVP',
  // عملات ضخ وتفريغ معروفة
  'SQUID', 'TITAN', 'IRON', 'SAFEMOON', 'BABYDOGE',
];

// 🔍 أنماط الأسماء المشبوهة (Regex)
const SUSPICIOUS_PATTERNS = [
  /^[A-Z]$/,           // حرف واحد فقط
  /^[0-9]+$/,          // أرقام فقط
  /^[A-Z][0-9]+$/,     // حرف ورقم
  /SAFE/i,             // Safe* tokens غالباً scam
  /BABY/i,             // Baby* tokens غالباً scam
  /MOON/i,             // Moon* tokens غالباً scam
  /ELON/i,             // Elon* tokens غالباً scam
  /INU$/i,             // *INU tokens (تقليد SHIB)
  /^TEST/i,            // Test tokens
  /^FAKE/i,            // Fake tokens
];

/**
 * 🔍 التحقق السريع من العملة (بدون API)
 */
export function quickVerifyCoin(symbol: string): { safe: boolean; reason?: string } {
  const upperSymbol = symbol.toUpperCase();
  
  // ✅ القائمة البيضاء - مقبولة دائماً
  if (WHITELIST_COINS.includes(upperSymbol)) {
    return { safe: true };
  }
  
  // 🚫 القائمة السوداء - مرفوضة دائماً
  if (EXTENDED_BLACKLIST.includes(upperSymbol)) {
    return { safe: false, reason: `🚫 في القائمة السوداء` };
  }
  
  // 🔍 فحص الأنماط المشبوهة
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(upperSymbol)) {
      return { safe: false, reason: `⚠️ نمط اسم مشبوه` };
    }
  }
  
  // 📏 فحص طول الاسم
  if (upperSymbol.length < 2) {
    return { safe: false, reason: `⚠️ اسم قصير جداً (< 2 أحرف)` };
  }
  
  if (upperSymbol.length > 10) {
    return { safe: false, reason: `⚠️ اسم طويل جداً (> 10 أحرف)` };
  }
  
  // ✅ مبدئياً آمن (يحتاج تحقق إضافي من CoinGecko)
  return { safe: true };
}

/**
 * 🌐 التحقق من العملة عبر CoinGecko API
 */
export async function verifyCoinOnCoinGecko(symbol: string): Promise<{ 
  verified: boolean; 
  info?: CoinInfo; 
  reason?: string 
}> {
  const upperSymbol = symbol.toUpperCase();
  
  // 🔍 التحقق السريع أولاً
  const quickCheck = quickVerifyCoin(upperSymbol);
  if (!quickCheck.safe) {
    return { verified: false, reason: quickCheck.reason };
  }
  
  // ✅ إذا في القائمة البيضاء، نقبل مباشرة بدون API
  if (WHITELIST_COINS.includes(upperSymbol)) {
    return { 
      verified: true, 
      info: {
        id: upperSymbol.toLowerCase(),
        symbol: upperSymbol,
        name: upperSymbol,
        marketCapRank: null,
        marketCap: 0,
        totalVolume: 0,
        ath: 0,
        athDate: '',
        categories: ['Verified'],
      },
      reason: '✅ عملة موثوقة (قائمة بيضاء)'
    };
  }
  
  // 🔍 التحقق من الكاش
  const cached = verificationCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 كاش: ${upperSymbol} → ${cached.verified ? '✅' : '❌'}`);
    return { verified: cached.verified, info: cached.data };
  }
  
  try {
    // 🌐 البحث في CoinGecko
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${upperSymbol.toLowerCase()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`⚠️ CoinGecko API error: ${response.status}`);
      // في حالة فشل API، نقبل العملات غير المشبوهة
      return { verified: true, reason: '⚠️ فشل التحقق من CoinGecko (تم القبول المؤقت)' };
    }
    
    const data = await response.json();
    const coins = data.coins || [];
    
    // 🔍 البحث عن تطابق دقيق للرمز
    const exactMatch = coins.find((c: any) => 
      c.symbol?.toUpperCase() === upperSymbol
    );
    
    if (exactMatch) {
      const coinInfo: CoinInfo = {
        id: exactMatch.id,
        symbol: exactMatch.symbol?.toUpperCase() || upperSymbol,
        name: exactMatch.name || upperSymbol,
        marketCapRank: exactMatch.market_cap_rank || null,
        marketCap: 0,
        totalVolume: 0,
        ath: 0,
        athDate: '',
        categories: [],
      };
      
      // ✅ تم العثور على العملة
      verificationCache.set(upperSymbol, {
        verified: true,
        timestamp: Date.now(),
        data: coinInfo
      });
      
      console.log(`✅ CoinGecko: ${upperSymbol} موجودة (${coinInfo.name}, Rank: ${coinInfo.marketCapRank || 'N/A'})`);
      return { verified: true, info: coinInfo, reason: '✅ موجودة على CoinGecko' };
    }
    
    // ❌ العملة غير موجودة على CoinGecko
    verificationCache.set(upperSymbol, {
      verified: false,
      timestamp: Date.now()
    });
    
    console.log(`❌ CoinGecko: ${upperSymbol} غير موجودة`);
    return { 
      verified: false, 
      reason: `❌ غير موجودة على CoinGecko - قد تكون مشبوهة!`
    };
    
  } catch (error: any) {
    console.warn(`⚠️ خطأ في التحقق من ${upperSymbol}:`, error.message);
    // في حالة الخطأ، نكون حذرين ونرفض إذا كانت العملة غير معروفة
    if (!WHITELIST_COINS.includes(upperSymbol)) {
      return { verified: false, reason: `⚠️ فشل التحقق - محذوف للأمان` };
    }
    return { verified: true };
  }
}

/**
 * 🔍 التحقق من قائمة عملات (Batch)
 */
export async function verifyMultipleCoins(symbols: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  for (const symbol of symbols) {
    // التحقق السريع أولاً
    const quick = quickVerifyCoin(symbol);
    if (!quick.safe) {
      results.set(symbol, false);
      continue;
    }
    
    // القائمة البيضاء
    if (WHITELIST_COINS.includes(symbol.toUpperCase())) {
      results.set(symbol, true);
      continue;
    }
    
    // التحقق من CoinGecko (مع تأخير لتجنب rate limiting)
    const result = await verifyCoinOnCoinGecko(symbol);
    results.set(symbol, result.verified);
    
    // تأخير 200ms بين الطلبات
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

/**
 * 🛡️ فلتر العملات الآمنة
 */
export function filterSafeCoins<T extends { symbol?: string }>(coins: T[]): T[] {
  return coins.filter(coin => {
    const symbol = coin.symbol?.toUpperCase() || '';
    const check = quickVerifyCoin(symbol);
    
    if (!check.safe) {
      console.log(`🛡️ مستبعد (${check.reason}): ${symbol}`);
      return false;
    }
    
    return true;
  });
}

/**
 * 📊 إحصائيات التحقق
 */
export function getVerificationStats(): {
  cacheSize: number;
  verified: number;
  rejected: number;
  whitelistSize: number;
  blacklistSize: number;
} {
  let verified = 0;
  let rejected = 0;
  
  verificationCache.forEach((value) => {
    if (value.verified) verified++;
    else rejected++;
  });
  
  return {
    cacheSize: verificationCache.size,
    verified,
    rejected,
    whitelistSize: WHITELIST_COINS.length,
    blacklistSize: EXTENDED_BLACKLIST.length,
  };
}

/**
 * 🧹 مسح الكاش
 */
export function clearVerificationCache(): void {
  verificationCache.clear();
  console.log('🧹 تم مسح كاش التحقق');
}

export default {
  quickVerifyCoin,
  verifyCoinOnCoinGecko,
  verifyMultipleCoins,
  filterSafeCoins,
  getVerificationStats,
  clearVerificationCache,
  WHITELIST_COINS,
  EXTENDED_BLACKLIST,
};
