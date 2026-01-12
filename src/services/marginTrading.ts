// 📊 خدمة التداول بالرافعة المالية (Margin Trading)
// Isolated Margin - الخسارة محدودة لكل صفقة

export interface MarginSettings {
  enabled: boolean;
  leverage: number; // 2, 3, 5, 10
}

// جلب إعدادات الرافعة المالية
export const getMarginSettings = (): MarginSettings => {
  const enabled = localStorage.getItem('margin_enabled') === 'true';
  const leverage = parseInt(localStorage.getItem('margin_leverage') || '3');
  return { enabled, leverage };
};

// حفظ إعدادات الرافعة المالية
export const saveMarginSettings = (settings: MarginSettings): void => {
  localStorage.setItem('margin_enabled', settings.enabled.toString());
  localStorage.setItem('margin_leverage', settings.leverage.toString());
};

// التحقق من دعم العملة للـ Margin
export const checkMarginPairSupport = async (symbol: string): Promise<boolean> => {
  try {
    // قائمة العملات المدعومة للـ Margin في Binance
    const supportedPairs = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
      'DOGEUSDT', 'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT',
      'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'ETCUSDT',
      'XLMUSDT', 'TRXUSDT', 'NEARUSDT', 'APTUSDT', 'AAVEUSDT',
      'FILUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'GALAUSDT',
      'FTMUSDT', 'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'HBARUSDT',
      // أضف المزيد حسب الحاجة
    ];
    
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '') + 'USDT';
    return supportedPairs.includes(normalizedSymbol);
  } catch (error) {
    console.error('Error checking margin support:', error);
    return false;
  }
};

// شراء بالرافعة المالية (Isolated Margin)
export const buyWithMargin = async (
  symbol: string,
  usdtAmount: number,
  leverage: number
): Promise<{ success: boolean; orderId?: string; error?: string; effectiveAmount?: number }> => {
  try {
    const credentials = localStorage.getItem('binance_credentials');
    if (!credentials) {
      return { success: false, error: 'مفاتيح API غير موجودة' };
    }

    const { apiKey, secretKey } = JSON.parse(credentials);
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '') + 'USDT';

    console.log(`⚡ شراء برافعة ${leverage}x: ${normalizedSymbol} بمبلغ $${usdtAmount}`);
    console.log(`💰 القوة الشرائية الفعلية: $${usdtAmount * leverage}`);

    // 1️⃣ تحويل USDT من Spot إلى Isolated Margin
    const transferResponse = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/margin-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        secretKey,
        asset: 'USDT',
        symbol: normalizedSymbol,
        amount: usdtAmount,
        type: 'MAIN_TO_MARGIN', // من Spot إلى Margin
      }),
    });

    if (!transferResponse.ok) {
      const error = await transferResponse.json();
      console.error('❌ فشل التحويل:', error);
      return { success: false, error: `فشل التحويل: ${error.error || error.message}` };
    }

    // 2️⃣ اقتراض المبلغ الإضافي (الرافعة)
    const borrowAmount = usdtAmount * (leverage - 1); // المبلغ المقترض
    if (borrowAmount > 0) {
      const borrowResponse = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/margin-borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          secretKey,
          asset: 'USDT',
          symbol: normalizedSymbol,
          amount: borrowAmount,
          isIsolated: true,
        }),
      });

      if (!borrowResponse.ok) {
        const error = await borrowResponse.json();
        console.error('❌ فشل الاقتراض:', error);
        // إرجاع الأموال إلى Spot
        await transferBackToSpot(apiKey, secretKey, normalizedSymbol, usdtAmount);
        return { success: false, error: `فشل الاقتراض: ${error.error || error.message}` };
      }
    }

    // 3️⃣ تنفيذ أمر الشراء
    const effectiveAmount = usdtAmount * leverage;
    const orderResponse = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/margin-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        secretKey,
        symbol: normalizedSymbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: effectiveAmount,
        isIsolated: true,
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      console.error('❌ فشل الشراء:', error);
      return { success: false, error: `فشل الشراء: ${error.error || error.message}` };
    }

    const orderData = await orderResponse.json();
    console.log(`✅ تم الشراء برافعة ${leverage}x:`, orderData);

    return { 
      success: true, 
      orderId: orderData.orderId,
      effectiveAmount,
    };

  } catch (error: any) {
    console.error('❌ خطأ في الشراء بالرافعة:', error);
    return { success: false, error: error.message || 'خطأ غير متوقع' };
  }
};

// دالة مساعدة لإرجاع الأموال إلى Spot في حالة الفشل
const transferBackToSpot = async (
  apiKey: string,
  secretKey: string,
  symbol: string,
  amount: number
): Promise<void> => {
  try {
    await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/margin-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        secretKey,
        asset: 'USDT',
        symbol,
        amount,
        type: 'MARGIN_TO_MAIN',
      }),
    });
  } catch (error) {
    console.error('Failed to transfer back to spot:', error);
  }
};

// بيع وسداد القرض
export const sellAndRepayMargin = async (
  symbol: string,
  quantity: number
): Promise<{ success: boolean; profit?: number; error?: string }> => {
  try {
    const credentials = localStorage.getItem('binance_credentials');
    if (!credentials) {
      return { success: false, error: 'مفاتيح API غير موجودة' };
    }

    const { apiKey, secretKey } = JSON.parse(credentials);
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '') + 'USDT';

    console.log(`📤 بيع Margin: ${normalizedSymbol} - كمية: ${quantity}`);

    // 1️⃣ تنفيذ أمر البيع
    const orderResponse = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/margin-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        secretKey,
        symbol: normalizedSymbol,
        side: 'SELL',
        type: 'MARKET',
        quantity,
        isIsolated: true,
        sideEffectType: 'AUTO_REPAY', // سداد تلقائي للقرض
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      return { success: false, error: `فشل البيع: ${error.error || error.message}` };
    }

    const orderData = await orderResponse.json();
    console.log('✅ تم البيع وسداد القرض:', orderData);

    // 2️⃣ تحويل الأرباح إلى Spot
    // (يتم تلقائياً مع AUTO_REPAY)

    return { 
      success: true,
      profit: parseFloat(orderData.cummulativeQuoteQty || '0'),
    };

  } catch (error: any) {
    console.error('❌ خطأ في البيع:', error);
    return { success: false, error: error.message || 'خطأ غير متوقع' };
  }
};

// التحقق من حالة الصفقة (للتصفية التلقائية)
export const checkMarginStatus = async (symbol: string): Promise<{
  marginLevel: number;
  liquidationPrice: number;
  unrealizedPnL: number;
}> => {
  try {
    const credentials = localStorage.getItem('binance_credentials');
    if (!credentials) {
      throw new Error('مفاتيح API غير موجودة');
    }

    const { apiKey, secretKey } = JSON.parse(credentials);
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '') + 'USDT';

    const response = await fetch('https://dpxuacnrncwyopehwxsj.supabase.co/functions/v1/margin-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        secretKey,
        symbol: normalizedSymbol,
        isIsolated: true,
      }),
    });

    if (!response.ok) {
      throw new Error('فشل جلب حالة Margin');
    }

    const data = await response.json();
    
    return {
      marginLevel: parseFloat(data.marginLevel || '999'),
      liquidationPrice: parseFloat(data.liquidatePrice || '0'),
      unrealizedPnL: parseFloat(data.unrealizedPnL || '0'),
    };

  } catch (error: any) {
    console.error('Error checking margin status:', error);
    return {
      marginLevel: 999,
      liquidationPrice: 0,
      unrealizedPnL: 0,
    };
  }
};
