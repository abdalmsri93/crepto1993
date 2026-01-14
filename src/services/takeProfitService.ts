// 🎯 خدمة إدارة أوامر Take Profit - للبيع التلقائي بنسبة دقيقة

interface TakeProfitOrder {
  symbol: string;
  orderId: number;
  targetPrice: number;
  targetPercent: number;
  quantity: number;
  timestamp: number;
}

const STORAGE_KEY = 'take_profit_orders';

// 🔐 الحصول على مفاتيح API
const getApiKeys = () => {
  const apiKey = localStorage.getItem('binance_api_key') || '';
  const apiSecret = localStorage.getItem('binance_api_secret') || '';
  return { apiKey, apiSecret };
};

// 🔒 توقيع الطلب باستخدام Web Crypto API
const signRequest = async (queryString: string, apiSecret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(queryString);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// 💾 حفظ أمر Take Profit في localStorage
export const saveTakeProfitOrder = (order: TakeProfitOrder) => {
  const orders = getTakeProfitOrders();
  orders[order.symbol] = order;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  console.log(`✅ تم حفظ أمر Take Profit لـ ${order.symbol}: السعر ${order.targetPrice}, النسبة ${order.targetPercent}%`);
};

// 📖 جلب جميع أوامر Take Profit
export const getTakeProfitOrders = (): Record<string, TakeProfitOrder> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

// 📖 جلب أمر Take Profit لعملة محددة
export const getTakeProfitOrder = (symbol: string): TakeProfitOrder | null => {
  const orders = getTakeProfitOrders();
  return orders[symbol] || null;
};

// 🗑️ حذف أمر Take Profit بعد التنفيذ
export const deleteTakeProfitOrder = (symbol: string) => {
  const orders = getTakeProfitOrders();
  delete orders[symbol];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  console.log(`🗑️ تم حذف أمر Take Profit لـ ${symbol}`);
};

// 🎯 إنشاء أمر Take Profit (LIMIT SELL) على بايننس
export const createTakeProfitOrder = async (
  symbol: string,
  quantity: number,
  buyPrice: number,
  targetPercent: number
): Promise<{ success: boolean; orderId?: number; error?: string }> => {
  try {
    const { apiKey, apiSecret } = getApiKeys();
    
    if (!apiKey || !apiSecret) {
      return { success: false, error: 'مفاتيح API غير موجودة' };
    }

    // 🎯 حساب السعر المستهدف
    const targetPrice = buyPrice * (1 + targetPercent / 100);
    
    // 🔧 تنسيق السعر والكمية حسب متطلبات بايننس
    const formattedPrice = targetPrice.toFixed(8);
    const formattedQuantity = quantity.toFixed(8);

    console.log(`🎯 إنشاء أمر Take Profit لـ ${symbol}:`);
    console.log(`   - سعر الشراء: $${buyPrice}`);
    console.log(`   - النسبة المستهدفة: ${targetPercent}%`);
    console.log(`   - السعر المستهدف: $${formattedPrice}`);
    console.log(`   - الكمية: ${formattedQuantity}`);

    // 📝 معلمات الأمر
    const timestamp = Date.now();
    const params = new URLSearchParams({
      symbol: symbol.replace('/', ''),
      side: 'SELL',
      type: 'LIMIT',
      timeInForce: 'GTC', // Good Till Cancel - يبقى حتى التنفيذ أو الإلغاء
      quantity: formattedQuantity,
      price: formattedPrice,
      timestamp: timestamp.toString(),
    });

    // 🔐 توقيع الطلب
    const signature = await signRequest(params.toString(), apiSecret);
    params.append('signature', signature);

    // 📤 إرسال الطلب لبايننس
    const response = await fetch(
      `https://api.binance.com/api/v3/order?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.orderId) {
      // ✅ حفظ معلومات الأمر
      saveTakeProfitOrder({
        symbol,
        orderId: data.orderId,
        targetPrice: parseFloat(formattedPrice),
        targetPercent,
        quantity: parseFloat(formattedQuantity),
        timestamp,
      });

      console.log(`✅ تم إنشاء أمر Take Profit بنجاح!`);
      console.log(`   Order ID: ${data.orderId}`);
      
      return { success: true, orderId: data.orderId };
    } else {
      console.error('❌ فشل إنشاء أمر Take Profit:', data);
      return { success: false, error: data.msg || 'فشل إنشاء الأمر' };
    }
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء أمر Take Profit:', error);
    return { success: false, error: error.message };
  }
};

// 🔍 فحص حالة أمر Take Profit
export const checkOrderStatus = async (
  symbol: string,
  orderId: number
): Promise<{ status: string; filled: boolean }> => {
  try {
    const { apiKey, apiSecret } = getApiKeys();
    
    if (!apiKey || !apiSecret) {
      return { status: 'ERROR', filled: false };
    }

    const timestamp = Date.now();
    const params = new URLSearchParams({
      symbol: symbol.replace('/', ''),
      orderId: orderId.toString(),
      timestamp: timestamp.toString(),
    });

    const signature = signRequest(params.toString(), apiSecret);
    params.append('signature', signature);

    const response = await fetch(
      `https://api.binance.com/api/v3/order?${params.toString()}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      // NEW: جديد، FILLED: تم التنفيذ، CANCELED: ملغى
      const isFilled = data.status === 'FILLED';
      
      if (isFilled) {
        console.log(`✅ تم تنفيذ أمر Take Profit لـ ${symbol}!`);
      }
      
      return { status: data.status, filled: isFilled };
    } else {
      console.error('❌ فشل فحص حالة الأمر:', data);
      return { status: 'ERROR', filled: false };
    }
  } catch (error) {
    console.error('❌ خطأ في فحص حالة الأمر:', error);
    return { status: 'ERROR', filled: false };
  }
};

// 🔄 فحص جميع أوامر Take Profit وتحديث حالتها
export const checkAllTakeProfitOrders = async (): Promise<string[]> => {
  const orders = getTakeProfitOrders();
  const filledOrders: string[] = [];

  for (const symbol in orders) {
    const order = orders[symbol];
    const { filled } = await checkOrderStatus(symbol, order.orderId);
    
    if (filled) {
      filledOrders.push(symbol);
    }
  }

  return filledOrders;
};

// ❌ إلغاء أمر Take Profit (للبيع اليدوي)
export const cancelTakeProfitOrder = async (
  symbol: string,
  orderId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { apiKey, apiSecret } = getApiKeys();
    
    if (!apiKey || !apiSecret) {
      return { success: false, error: 'مفاتيح API غير موجودة' };
    }

    const timestamp = Date.now();
    const params = new URLSearchParams({
      symbol: symbol.replace('/', ''),
      orderId: orderId.toString(),
      timestamp: timestamp.toString(),
    });

    const signature = await signRequest(params.toString(), apiSecret);
    params.append('signature', signature);

    const response = await fetch(
      `https://api.binance.com/api/v3/order?${params.toString()}`,
      {
        method: 'DELETE',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      deleteTakeProfitOrder(symbol);
      console.log(`✅ تم إلغاء أمر Take Profit لـ ${symbol}`);
      return { success: true };
    } else {
      console.error('❌ فشل إلغاء الأمر:', data);
      return { success: false, error: data.msg || 'فشل إلغاء الأمر' };
    }
  } catch (error: any) {
    console.error('❌ خطأ في إلغاء الأمر:', error);
    return { success: false, error: error.message };
  }
};
