// مكتبة التشفير الآمنة للمفاتيح
import crypto from 'crypto';

// مفتاح التشفير (يجب حفظه في متغيرات البيئة)
const ENCRYPTION_KEY = process.env.BINANCE_ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.BINANCE_ENCRYPTION_IV;

if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
  throw new Error('Missing encryption environment variables');
}

/**
 * تشفير النص باستخدام AES-256-CBC
 * @param plaintext - النص المراد تشفيره
 * @returns النص المشفر مع IV
 */
export const encryptKey = (plaintext: string): string => {
  try {
    const iv = Buffer.from(ENCRYPTION_IV, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt key');
  }
};

/**
 * فك تشفير النص
 * @param encrypted - النص المشفر
 * @returns النص الأصلي
 */
export const decryptKey = (encrypted: string): string => {
  try {
    const iv = Buffer.from(ENCRYPTION_IV, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt key');
  }
};

/**
 * حساب hash للمفتاح (للتحقق بدون الحاجة لفك التشفير)
 * @param key - المفتاح الأصلي
 * @returns Hash من المفتاح
 */
export const hashKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * التوقيع على الطلب (Binance Signature)
 * @param secretKey - مفتاح السر
 * @param params - معاملات الطلب
 * @returns التوقيع
 */
export const signRequest = (secretKey: string, params: Record<string, any>): string => {
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');
};

/**
 * توليد رقم عشوائي
 * @returns رقم عشوائي
 */
export const generateNonce = (): number => {
  return Date.now();
};

export default {
  encryptKey,
  decryptKey,
  hashKey,
  signRequest,
  generateNonce,
};
