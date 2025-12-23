import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// إعدادات Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const binanceEncryptionKey = Deno.env.get("BINANCE_ENCRYPTION_KEY");
const binanceEncryptionIv = Deno.env.get("BINANCE_ENCRYPTION_IV");

// Binance API
const BINANCE_API_BASE = "https://api.binance.com/api/v3";

interface TradeRequest {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  quantity: number;
  price?: number;
  timeInForce?: "GTC" | "IOC" | "FOK";
}

/**
 * فك تشفير المفتاح
 */
function decryptKey(encrypted: string): string {
  const iv = new TextEncoder().encode(binanceEncryptionIv || "");
  const key = new TextEncoder().encode(binanceEncryptionKey || "");

  const encryptedBuffer = new Uint8Array(
    encrypted.match(/[\da-f]{2}/gi)!.map((x) => parseInt(x, 16))
  );

  // ملاحظة: هذا مثال مبسط، استخدم مكتبة تشفير حقيقية في الإنتاج
  return atob(encrypted);
}

/**
 * التوقيع على الطلب
 */
function signRequest(secret: string, params: Record<string, any>): string {
  const queryString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const messageBytes = encoder.encode(queryString);

  const cryptoKey = crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return crypto
    .subtle
    .sign("HMAC", await cryptoKey, messageBytes)
    .then((signature: ArrayBuffer) =>
      Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
}

/**
 * الدالة الرئيسية للتداول
 */
Deno.serve(async (req: Request) => {
  try {
    // التحقق من الطريقة
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // الحصول على Authorization header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    // إنشاء عميل Supabase
    const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

    // التحقق من المستخدم
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response("Invalid token", { status: 401 });
    }

    // قراءة بيانات الطلب
    const tradeRequest: TradeRequest = await req.json();

    // التحقق من معاملات الطلب
    if (!tradeRequest.symbol || !tradeRequest.side || !tradeRequest.quantity) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // جلب المفاتيح المشفرة
    const { data: keys, error: keysError } = await supabase
      .from("encrypted_binance_keys")
      .select("encrypted_api_key, encrypted_secret_key")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (keysError || !keys) {
      return new Response("No API keys configured", { status: 400 });
    }

    // فك التشفير (ملاحظة: هذا كود مبسط)
    const apiKey = decryptKey(keys.encrypted_api_key);
    const secretKey = decryptKey(keys.encrypted_secret_key);

    // بناء معاملات الطلب
    const timestamp = Date.now();
    const params: Record<string, any> = {
      symbol: tradeRequest.symbol,
      side: tradeRequest.side,
      type: tradeRequest.type,
      quantity: tradeRequest.quantity,
      timestamp,
    };

    if (tradeRequest.type === "LIMIT" && tradeRequest.price) {
      params.price = tradeRequest.price;
      params.timeInForce = tradeRequest.timeInForce || "GTC";
    }

    // التوقيع
    const signature = await signRequest(secretKey, params);
    params.signature = signature;

    // بناء query string
    const queryString = Object.keys(params)
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join("&");

    // إرسال الطلب إلى Binance
    const binanceResponse = await fetch(
      `${BINANCE_API_BASE}/order?${queryString}`,
      {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const responseData = await binanceResponse.json();

    if (!binanceResponse.ok) {
      // تسجيل الخطأ
      await supabase.from("trade_errors").insert({
        user_id: user.id,
        error_code: responseData.code,
        error_message: responseData.msg,
        trade_params: tradeRequest,
        binance_response: responseData,
      });

      return new Response(
        JSON.stringify({
          error: responseData.msg,
          code: responseData.code,
        }),
        { status: 400 }
      );
    }

    // حفظ الصفقة الناجحة
    const { error: insertError } = await supabase
      .from("trade_history")
      .insert({
        user_id: user.id,
        symbol: tradeRequest.symbol,
        side: tradeRequest.side,
        quantity: tradeRequest.quantity,
        price: responseData.cummulativeQuoteQty / responseData.executedQty,
        total: responseData.cummulativeQuoteQty,
        fee: responseData.fills?.reduce((sum: number, fill: any) => sum + fill.commission, 0) || 0,
        fee_asset: responseData.fills?.[0]?.commissionAsset,
        status: "completed",
        binance_order_id: responseData.orderId,
        execution_time: new Date(responseData.transactTime).toISOString(),
      });

    if (insertError) {
      console.error("Error saving trade:", insertError);
    }

    // تحديث آخر استخدام للمفاتيح
    await supabase
      .from("encrypted_binance_keys")
      .update({ last_used: new Date().toISOString() })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: responseData.orderId,
        symbol: responseData.symbol,
        side: responseData.side,
        quantity: responseData.origQty,
        executedQty: responseData.executedQty,
        price: responseData.cummulativeQuoteQty / responseData.executedQty,
        total: responseData.cummulativeQuoteQty,
        status: responseData.status,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Trade error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
