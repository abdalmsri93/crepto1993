// ترجمات الواجهة
export const translations = {
  ar: {
    // Headers and Navigation
    backToList: "العودة للقائمة",
    projectDetails: "تفاصيل المشروع",
    
    // Market Info
    marketInfo: "📊 معلومات السوق",
    marketCap: "القيمة السوقية",
    liquidity: "السيولة",
    
    // Risk and Performance
    riskLevel: "مستوى المخاطرة",
    performanceScore: "درجة الأداء",
    recommendation: "التوصية",
    
    // Project Details
    projectDescription: "📝 وصف المشروع",
    technology: "🛠️ التكنولوجيا",
    useCases: "💡 حالات الاستخدام",
    team: "👥 الفريق",
    partners: "🤝 الشركاء",
    shariaCompliance: "✅ التوافق الشرعي",
    importantLinks: "🔗 روابط مهمة",
    
    // Risk Levels
    veryLow: "🟢 منخفض جداً",
    low: "🟢 منخفض",
    medium: "🟡 متوسط",
    high: "🔴 عالي",
    
    // Links
    officialWebsite: "الموقع الرسمي",
    twitter: "تويتر",
    docs: "الوثائق",
    whitepaper: "الوثيقة البيضاء",
    
    // Loading and Errors
    loading: "جاري جلب معلومات المشروع...",
    error: "خطأ",
    couldNotFetchData: "لم يتم العثور على البيانات",
    checkInternet: "تحقق من اتصالك بالإنترنت",
    
    // Buttons
    viewMore: "عرض المزيد",
    viewOnBinance: "عرض في Binance",
    projectInfo: "معلومات المشروع",
    backButton: "العودة",
    
    // Ratings
    excellent: "ممتاز",
    veryGood: "جيد جداً",
    good: "جيد",
    average: "متوسط",
    poor: "ضعيف",
  },
  en: {
    // Headers and Navigation
    backToList: "Back to List",
    projectDetails: "Project Details",
    
    // Market Info
    marketInfo: "📊 Market Information",
    marketCap: "Market Cap",
    liquidity: "Liquidity",
    
    // Risk and Performance
    riskLevel: "Risk Level",
    performanceScore: "Performance Score",
    recommendation: "Recommendation",
    
    // Project Details
    projectDescription: "📝 Project Description",
    technology: "🛠️ Technology",
    useCases: "💡 Use Cases",
    team: "👥 Team",
    partners: "🤝 Partners",
    shariaCompliance: "✅ Sharia Compliance",
    importantLinks: "🔗 Important Links",
    
    // Risk Levels
    veryLow: "🟢 Very Low",
    low: "🟢 Low",
    medium: "🟡 Medium",
    high: "🔴 High",
    
    // Links
    officialWebsite: "Official Website",
    twitter: "Twitter",
    docs: "Documentation",
    whitepaper: "Whitepaper",
    
    // Loading and Errors
    loading: "Loading project information...",
    error: "Error",
    couldNotFetchData: "Could not fetch data",
    checkInternet: "Check your internet connection",
    
    // Buttons
    viewMore: "View More",
    viewOnBinance: "View on Binance",
    projectInfo: "Project Info",
    backButton: "Back",
    
    // Ratings
    excellent: "Excellent",
    veryGood: "Very Good",
    good: "Good",
    average: "Average",
    poor: "Poor",
  },
};

export type Language = 'ar' | 'en';
export type TranslationKey = keyof typeof translations.ar;

export function getTranslation(key: TranslationKey, language: Language = 'ar'): string {
  return translations[language][key] || translations.ar[key];
}

// دالة ترجمة تلقائية بسيطة للنصوص الطويلة من APIs
export function translateLongText(text: string, language: Language = 'ar'): string {
  if (!text || language === 'en') return text;
  
  // قاموس كلمات شائعة للترجمة السريعة
  // مرتب من الأطول للأقصر لتجنب المشاكل
  const commonTranslations: Record<string, string> = {
    // تعبيرات طويلة
    'leveraged yield farming': 'الزراعة العائدة برافعة مالية',
    'yield farming protocol': 'بروتوكول الزراعة العائدة',
    'deposit vaults': 'خزائن الإيداع',
    'smart contract': 'عقد ذكي',
    'fair launch': 'إطلاق عادل',
    'pre-sale': 'بيع مسبقة',
    'pre-mine': 'التعدين المسبق',
    'farming position': 'موضع الزراعة',
    'lending protocol': 'بروتوكول الإقراض',
    'trading pair': 'زوج التداول',
    'liquidity pool': 'مجمع السيولة',
    'staking reward': 'مكافأة الرهن',
    'governance token': 'رمز الحوكمة',
    'bridge contract': 'عقد الجسر',
    'cross-chain': 'عبر السلاسل',
    
    // كلمات متوسطة
    'Leveraged': 'برافعة مالية',
    'leveraged': 'برافعة مالية',
    'yield farming': 'الزراعة العائدة',
    'yield': 'العائد',
    'protocol': 'بروتوكول',
    'decentralized': 'لامركزي',
    'blockchain': 'سلسلة الكتل',
    'borrowing': 'الاقتراض',
    'lending': 'الإقراض',
    'farming': 'الزراعة',
    'mining': 'التعدين',
    'staking': 'الرهن',
    'liquidity': 'السيولة',
    'governance': 'الحوكمة',
    'inflation': 'التضخم',
    'deflation': 'الانكماش',
    'tokenomics': 'اقتصاديات الرمز',
    'whitepaper': 'الورقة البيضاء',
    'roadmap': 'خريطة الطريق',
    'community': 'المجتمع',
    'ecosystem': 'النظام البيئي',
    'network': 'الشبكة',
    'security': 'الأمان',
    'audit': 'التدقيق',
    'verified': 'موثوق',
    'launch': 'إطلاق',
    'integration': 'التكامل',
    'compatible': 'متوافق',
    'innovative': 'مبتكر',
    'transparent': 'شفاف',
    'community-driven': 'يقودها المجتمع',
    
    // كلمات قصيرة
    'token': 'رمز',
    'coin': 'عملة',
    'deposit': 'إيداع',
    'borrow': 'اقتراض',
    'lend': 'إقراض',
    'stake': 'رهن',
    'farm': 'زراعة',
    'mine': 'تعدين',
    'trade': 'تداول',
    'swap': 'تبديل',
    'bridge': 'جسر',
    'chain': 'سلسلة',
    'pool': 'مجمع',
    'vault': 'خزنة',
    'smart': 'ذكي',
    'first': 'الأول',
    'allow': 'السماح',
    'open': 'فتح',
    'position': 'موضع',
    'from': 'من',
    'user': 'مستخدم',
    'investor': 'مستثمر',
    'founder': 'مؤسس',
    'team': 'فريق',
    'partner': 'شريك',
    'no': 'بدون',
    'our': 'لدينا',
    'by': 'بواسطة',
    'will': 'سوف',
    'can': 'يمكن',
    'new': 'جديد',
    'high': 'عالي',
    'low': 'منخفض',
    'fast': 'سريع',
    'safe': 'آمن',
    'easy': 'سهل',
    'powerful': 'قوي',
    'advanced': 'متقدم',
    'simple': 'بسيط',
    'best': 'الأفضل',
    'leading': 'الرائدة',
  };
  
  let translated = text;
  
  // ترجمة الكلمات - من الأطول للأقصر لتجنب المشاكل
  const sortedKeys = Object.keys(commonTranslations).sort((a, b) => b.length - a.length);
  
  sortedKeys.forEach((en) => {
    // استخدام حدود الكلمات لتجنب الترجمة الجزئية
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, commonTranslations[en]);
  });
  
  return translated;
}
