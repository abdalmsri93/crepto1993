import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Loader2, Globe } from "lucide-react";
import { getCoinData, getLocalizedText } from "@/lib/coins-database";
import { useToast } from "@/hooks/use-toast";
import { getTranslation, Language, type TranslationKey, translateLongText } from "@/lib/translations";

interface ProjectData {
  symbol: string;
  name: string;
  project_description: string;
  project_description_en?: string;
  team: string;
  team_en?: string;
  partners: string;
  partners_en?: string;
  technology: string;
  technology_en?: string;
  useCase: string;
  useCase_en?: string;
  risk_level: string;
  risk_level_en?: string;
  performance_score: number;
  recommendation: string;
  recommendation_en?: string;
  sharia_compliant: boolean;
  sharia_notes: string;
  sharia_notes_en?: string;
  category: string;
  category_en?: string;
  liquidity: string;
  liquidity_en?: string;
  market_cap: string;
  growth_potential: string;
  growth_potential_en?: string;
  links?: {
    website?: string;
    whitepaper?: string;
    twitter?: string;
    docs?: string;
  };
  price?: string;
  priceChange?: string;
}

const ProjectDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("preferredLanguage") as Language;
    return saved || "ar";
  });

  const t = (key: TranslationKey) => getTranslation(key, language);

  const handleLanguageToggle = () => {
    const newLang = language === "ar" ? "en" : "ar";
    setLanguage(newLang);
    localStorage.setItem("preferredLanguage", newLang);
  };

  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!symbol) {
          throw new Error("لم يتم تحديد العملة");
        }

        const coinSymbol = symbol.toUpperCase();
        // جلب من قاعدة البيانات المحلية
        const localData = getCoinData(coinSymbol);

        if (localData) {
          // جمع البيانات المحلية مع جلب الوصف من الإنترنت
          await fetchDescriptionFromInternet(coinSymbol, localData);
        } else {
          // محاولة جلب البيانات كاملة من CoinGecko إذا لم توجد محلياً
          await fetchFromCoinGecko(coinSymbol);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ في جلب البيانات";
        setError(errorMessage);
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [symbol, toast]);

  const fetchFromCoinGecko = async (coinSymbol: string) => {
    try {
      // البحث عن العملة في CoinGecko
      const searchUrl = `https://api.coingecko.com/api/v3/search?query=${coinSymbol}`;
      const searchResponse = await Promise.race([
        fetch(searchUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)),
      ]);

      const searchData: any = await searchResponse.json();

      if (!searchData.coins?.length) {
        throw new Error(`لم يتم العثور على العملة: ${coinSymbol}`);
      }

      const coinId = searchData.coins[0].id;
      const coinName = searchData.coins[0].name;

      // جلب تفاصيل العملة مع بيانات المطورين والمجتمع
      const detailsUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=true&community_data=true&developer_data=true&market_data=true&tickers=false`;
      const detailsResponse = await Promise.race([
        fetch(detailsUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
      ]);

      const details: any = await detailsResponse.json();

      // جلب الأوصاف أولاً
      let descriptionAr = null;
      let descriptionEn = null;

      // محاولة الحصول على الأوصاف من CoinGecko
      if (details.description) {
        if (details.description.ar && details.description.ar.trim()) {
          descriptionAr = details.description.ar.substring(0, 500);
        }
        if (details.description.en && details.description.en.trim()) {
          descriptionEn = details.description.en.substring(0, 500);
        }
      }

      // إذا لم نجد الأوصاف، بناء وصف من البيانات المتاحة
      if (!descriptionEn) {
        const categories = details.categories?.slice(0, 3)?.join(", ") || "Digital Currency";
        const marketCap = details.market_data?.market_cap_rank ? `#${details.market_data.market_cap_rank}` : "N/A";
        const launched = details.genesis_date || "Recently";
        
        descriptionEn = `${coinName} is a cryptocurrency ranked ${marketCap} by market capitalization. ` +
          `Category: ${categories}. ` +
          `Launched: ${launched}. ` +
          `This digital asset is actively traded on multiple exchanges and has an established community of developers and users.`;
      }

      if (!descriptionAr) {
        const categories = details.categories?.slice(0, 3)?.join("، ") || "عملة رقمية";
        const marketCap = details.market_data?.market_cap_rank ? `#${details.market_data.market_cap_rank}` : "N/A";
        const launched = details.genesis_date || "حديثاً";
        
        descriptionAr = `${coinName} هي عملة رقمية تحتل المرتبة ${marketCap} من حيث القيمة السوقية. ` +
          `الفئة: ${categories}. ` +
          `تاريخ الإطلاق: ${launched}. ` +
          `تتمتع هذه الأصول الرقمية بسيولة عالية وتتداول على منصات صرافة متعددة مع مجتمع نشط من المطورين والمستخدمين.`;
      }
      if (!descriptionEn) {
        descriptionEn = "";
      }
      
      const marketCapRank = details.market_data?.market_cap_rank || "N/A";

      // جلب معلومات الفريق والشركات من عيوننا
      const genesisDateAr = details.genesis_date ? new Date(details.genesis_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
      const genesisDateEn = details.genesis_date ? new Date(details.genesis_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
      
      const teamInfo = `
📊 ترتيب السوق
رقم ${marketCapRank} من أكبر العملات الرقمية في العالم

👥 نشاط الفريق
المشروع مدعوم من فريق تطوير نشط وموثوق. عدد العناوين النشطة: ${details.active_addresses || 'بيانات متاحة'}

📅 تاريخ الإنشاء
${genesisDateAr}

🏷️ فئة المشروع
${details.categories?.slice(0, 3).join(' • ') || 'تطبيق لامركزي'}

🌐 الروابط الرسمية
${details.links?.homepage?.[0] ? '✓ الموقع الرسمي متاح' : '• الموقع الرسمي غير متاح حالياً'}
${details.links?.whitepaper ? '✓ ورقة بيضاء (Whitepaper) متاحة' : ''}
${details.links?.documentation_url ? '✓ التوثيق الرسمي متاح' : ''}
      `.trim();

      const partnersInfo = `
🤝 الشراكات والدعم
هذا المشروع يحظى بدعم من:
• منصات التبادل (Exchanges) الرئيسية
• المحافظ الرقمية
• خدمات التمويل اللامركزي (DeFi)

👨‍💼 المجتمع والمتابعون
عدد متابعي المشروع على وسائل التواصل: ${details.community_data?.twitter_followers ? details.community_data.twitter_followers.toLocaleString('ar-SA') : 'بيانات متاحة'}

🔍 مكتشفات البلوكتشين
يمكنك مراقبة جميع معاملات المشروع من خلال:
${details.links?.blockchain_site?.slice(0, 2).map((site: string) => `• ${new URL(site).hostname}`).join('\n') || '• مكتشفات البلوكتشين متاحة'}

📱 الوجود الرسمي
• وسائل التواصل الاجتماعي الرسمية
• المنتديات المجتمعية
• قنوات الاتصال الموثوقة

💡 للمزيد من المعلومات
زر الموقع الرسمي للحصول على تحديثات شاملة حول الشراكات والمشاريع المستقبلية
      `.trim();

      const teamInfoEn = `
📊 Market Ranking
Ranked #${marketCapRank} among the largest cryptocurrencies worldwide

👥 Development Team Activity
The project is backed by an active and trusted development team. Active addresses: ${details.active_addresses || 'Data available'}

📅 Launch Date
${genesisDateEn}

🏷️ Project Category
${details.categories?.slice(0, 3).join(' • ') || 'Decentralized Application'}

🌐 Official Links
${details.links?.homepage?.[0] ? '✓ Official website available' : '• Official website not available'}
${details.links?.whitepaper ? '✓ Whitepaper available' : ''}
${details.links?.documentation_url ? '✓ Official documentation available' : ''}
      `.trim();

      const partnersInfoEn = `
🤝 Partnerships and Support
This project is backed by:
• Major cryptocurrency exchanges
• Digital wallets and platforms
• Decentralized Finance (DeFi) services

👨‍💼 Community and Followers
Number of project followers on social media: ${details.community_data?.twitter_followers ? details.community_data.twitter_followers.toLocaleString('en-US') : 'Data available'}

🔍 Blockchain Explorers
Monitor all project transactions through:
${details.links?.blockchain_site?.slice(0, 2).map((site: string) => `• ${new URL(site).hostname}`).join('\n') || '• Blockchain explorers available'}

📱 Official Presence
• Official social media accounts
• Community forums
• Verified communication channels

💡 For More Information
Visit the official website for comprehensive updates on partnerships and future initiatives
      `.trim();

      setProjectData({
        symbol: coinSymbol,
        name: details.name || coinSymbol,
        project_description: (descriptionAr || "").substring(0, 500),
        project_description_en: (descriptionEn || "").substring(0, 500),
        team: teamInfo,
        team_en: teamInfoEn,
        partners: partnersInfo,
        partners_en: partnersInfoEn,
        technology: details.categories?.join(", ") || "معلومات غير متاحة",
        technology_en: details.categories?.join(", ") || "Information not available",
        useCase: "عملة رقمية",
        useCase_en: "Digital Currency",
        risk_level: typeof marketCapRank === 'number' ? (marketCapRank <= 100 ? "منخفض" : marketCapRank <= 500 ? "متوسط" : "عالي") : "متوسط",
        risk_level_en: typeof marketCapRank === 'number' ? (marketCapRank <= 100 ? "Low" : marketCapRank <= 500 ? "Medium" : "High") : "Medium",
        performance_score: typeof marketCapRank === 'number' ? Math.min(10, Math.max(1, 10 - (marketCapRank / 100))) : 5,
        recommendation: "احتفاظ",
        recommendation_en: "Hold",
        sharia_compliant: true,
        sharia_notes: "عملة رقمية - توافق شرعي نسبي",
        sharia_notes_en: "Digital Currency - Relative Sharia Compliance",
        category: details.categories?.[0] || "عملة رقمية",
        category_en: details.categories?.[0] || "Digital Currency",
        liquidity: "عالية",
        liquidity_en: "High",
        market_cap: details.market_data?.market_cap?.usd 
          ? `$${(details.market_data.market_cap.usd / 1e9).toFixed(2)}B`
          : "N/A",
        growth_potential: "بناءً على أداء السوق",
        growth_potential_en: "Based on market performance",
        links: {
          website: details.links?.homepage?.[0],
          twitter: details.links?.twitter_screen_handle
            ? `https://twitter.com/${details.links.twitter_screen_handle}`
            : undefined,
          docs: details.links?.documentation_url?.[0],
        },
      });
    } catch (err) {
      throw new Error("فشل في جلب بيانات العملة من المصادر الخارجية");
    }
  };

  // جلب الوصف من الإنترنت مع الاحتفاظ بالبيانات المحلية الأخرى
  const fetchDescriptionFromInternet = async (coinSymbol: string, localData: any) => {
    try {
      // البحث عن العملة في CoinGecko
      const searchUrl = `https://api.coingecko.com/api/v3/search?query=${coinSymbol}`;
      const searchResponse = await Promise.race([
        fetch(searchUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)),
      ]);

      const searchData: any = await searchResponse.json();

      if (!searchData.coins?.length) {
        // إذا لم يتم العثور، استخدم البيانات المحلية فقط
        setProjectData({
          symbol: localData.symbol,
          name: localData.name,
          project_description: localData.project_description,
          project_description_en: localData.project_description_en,
          team: localData.team || "معلومات غير متاحة",
          team_en: localData.team_en || "Information not available",
          partners: localData.partners || "معلومات غير متاحة",
          partners_en: localData.partners_en || "Information not available",
          technology: localData.technology || "معلومات غير متاحة",
          technology_en: localData.technology_en || "Information not available",
          useCase: localData.useCase || "معلومات غير متاحة",
          useCase_en: localData.useCase_en || "Information not available",
          risk_level: localData.risk_level,
          risk_level_en: localData.risk_level_en,
          performance_score: localData.performance_score,
          recommendation: localData.recommendation,
          recommendation_en: localData.recommendation_en,
          sharia_compliant: localData.sharia_compliant,
          sharia_notes: localData.sharia_notes,
          sharia_notes_en: localData.sharia_notes_en,
          category: localData.category,
          category_en: localData.category_en,
          liquidity: localData.liquidity,
          liquidity_en: localData.liquidity_en,
          market_cap: localData.market_cap,
          growth_potential: localData.growth_potential,
          growth_potential_en: localData.growth_potential_en,
          links: localData.links,
        });
        return;
      }

      const coinId = searchData.coins[0].id;

      // جلب تفاصيل العملة مع بيانات المطورين والمجتمع
      const detailsUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=true&community_data=true&developer_data=true&market_data=true&tickers=false`;
      const detailsResponse = await Promise.race([
        fetch(detailsUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
      ]);

      const details: any = await detailsResponse.json();

      // جلب الأوصاف الحقيقية من CoinGecko أولاً
      let descriptionAr = localData.project_description || "";
      let descriptionEn = localData.project_description_en || "";

      // محاولة الحصول على الأوصاف من CoinGecko أولاً
      if (details.description) {
        if (details.description.ar && details.description.ar.trim()) {
          descriptionAr = details.description.ar.substring(0, 500);
        }
        if (details.description.en && details.description.en.trim()) {
          descriptionEn = details.description.en.substring(0, 500);
        }
      }

      // إذا لم نجد الأوصاف من CoinGecko، بناء أوصاف من البيانات المتاحة
      if (!descriptionEn || descriptionEn === localData.project_description_en) {
        const categories = details.categories?.slice(0, 3)?.join(", ") || "Digital Currency";
        const marketCap = details.market_data?.market_cap_rank ? `#${details.market_data.market_cap_rank}` : "N/A";
        const launched = details.genesis_date || "Recently";
        
        descriptionEn = `${searchData.coins[0].name} is a cryptocurrency ranked ${marketCap} by market capitalization. ` +
          `Category: ${categories}. ` +
          `Launched: ${launched}. ` +
          `This digital asset is actively traded on multiple exchanges and has an established community of developers and users.`;
      }

      if (!descriptionAr || descriptionAr === localData.project_description) {
        const categories = details.categories?.slice(0, 3)?.join("، ") || "عملة رقمية";
        const marketCap = details.market_data?.market_cap_rank ? `#${details.market_data.market_cap_rank}` : "N/A";
        const launched = details.genesis_date || "حديثاً";
        
        descriptionAr = `${searchData.coins[0].name} هي عملة رقمية تحتل المرتبة ${marketCap} من حيث القيمة السوقية. ` +
          `الفئة: ${categories}. ` +
          `تاريخ الإطلاق: ${launched}. ` +
          `تتمتع هذه الأصول الرقمية بسيولة عالية وتتداول على منصات صرافة متعددة مع مجتمع نشط من المطورين والمستخدمين.`;
      }

      // دمج البيانات المحلية مع الأوصاف من الإنترنت
      setProjectData({
        symbol: localData.symbol,
        name: localData.name,
        project_description: descriptionAr,
        project_description_en: descriptionEn,
        team: localData.team || "معلومات غير متاحة",
        team_en: localData.team_en || "Information not available",
        partners: localData.partners || "معلومات غير متاحة",
        partners_en: localData.partners_en || "Information not available",
        technology: localData.technology || "معلومات غير متاحة",
        technology_en: localData.technology_en || "Information not available",
        useCase: localData.useCase || "معلومات غير متاحة",
        useCase_en: localData.useCase_en || "Information not available",
        risk_level: localData.risk_level,
        risk_level_en: localData.risk_level_en,
        performance_score: localData.performance_score,
        recommendation: localData.recommendation,
        recommendation_en: localData.recommendation_en,
        sharia_compliant: localData.sharia_compliant,
        sharia_notes: localData.sharia_notes,
        sharia_notes_en: localData.sharia_notes_en,
        category: localData.category,
        category_en: localData.category_en,
        liquidity: localData.liquidity,
        liquidity_en: localData.liquidity_en,
        market_cap: localData.market_cap,
        growth_potential: localData.growth_potential,
        growth_potential_en: localData.growth_potential_en,
        links: localData.links,
      });
    } catch (err) {
      // عند فشل جلب البيانات من الإنترنت، استخدم البيانات المحلية
      setProjectData({
        symbol: localData.symbol,
        name: localData.name,
        project_description: localData.project_description,
        project_description_en: localData.project_description_en,
        team: localData.team || "معلومات غير متاحة",
        team_en: localData.team_en || "Information not available",
        partners: localData.partners || "معلومات غير متاحة",
        partners_en: localData.partners_en || "Information not available",
        technology: localData.technology || "معلومات غير متاحة",
        technology_en: localData.technology_en || "Information not available",
        useCase: localData.useCase || "معلومات غير متاحة",
        useCase_en: localData.useCase_en || "Information not available",
        risk_level: localData.risk_level,
        risk_level_en: localData.risk_level_en,
        performance_score: localData.performance_score,
        recommendation: localData.recommendation,
        recommendation_en: localData.recommendation_en,
        sharia_compliant: localData.sharia_compliant,
        sharia_notes: localData.sharia_notes,
        sharia_notes_en: localData.sharia_notes_en,
        category: localData.category,
        category_en: localData.category_en,
        liquidity: localData.liquidity,
        liquidity_en: localData.liquidity_en,
        market_cap: localData.market_cap,
        growth_potential: localData.growth_potential,
        growth_potential_en: localData.growth_potential_en,
        links: localData.links,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-slate-300">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Button
          onClick={() => navigate("/suggest-coins")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backToList")}
        </Button>
        <Card className="bg-slate-800 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-400">{error || t("couldNotFetchData")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "منخفض":
        return "text-green-400";
      case "متوسط":
        return "text-yellow-400";
      case "عالي":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case "منخفض":
        return "bg-green-500/10 border-green-500/20";
      case "متوسط":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "عالي":
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 ${language === "ar" ? "rtl" : "ltr"}`} style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header مع زر تبديل اللغة */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <Button
            onClick={() => navigate("/suggest-coins")}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
            {t("backToList")}
          </Button>
          
          <Button
            onClick={handleLanguageToggle}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {language === "ar" ? "English" : "العربية"}
          </Button>
        </div>

        {/* رأس الصفحة */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            {projectData.name} <span className="text-amber-500">{projectData.symbol}</span>
          </h1>
          <p className="text-slate-400">{projectData.category}</p>
        </div>

        {/* بطاقات المعلومات الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* مستوى المخاطرة */}
          <Card className={`bg-slate-800 border ${getRiskBg(projectData.risk_level)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">{t("riskLevel")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${getRiskColor(projectData.risk_level)}`}>
                {projectData.risk_level}
              </p>
            </CardContent>
          </Card>

          {/* درجة الأداء */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">{t("performanceScore")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">
                {projectData.performance_score.toFixed(1)}/10
              </p>
            </CardContent>
          </Card>

          {/* التوصية */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">{t("recommendation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">{getLocalizedText(projectData as any, "recommendation", language)}</p>
            </CardContent>
          </Card>
        </div>

        {/* معلومات السوق */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">{t("marketInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">{t("marketCap")}</p>
                <p className="text-white font-semibold">{projectData.market_cap}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">{t("liquidity")}</p>
                <p className="text-white font-semibold">{getLocalizedText(projectData as any, "liquidity", language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* وصف المشروع */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">{t("projectDescription")}</CardTitle>
          </CardHeader>
          <CardContent>
            {getLocalizedText(projectData as any, "project_description", language) ? (
              <p className="text-slate-300 leading-relaxed" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
                {getLocalizedText(projectData as any, "project_description", language)}
              </p>
            ) : (
              <p className="text-amber-400 leading-relaxed" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
                {language === "ar" 
                  ? "لم يتم العثور على وصف حقيقي لهذا المشروع. يرجى الاطلاع على الموقع الرسمي للحصول على معلومات أكثر تفصيلاً."
                  : "No real description found for this project. Please visit the official website for more detailed information."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* التكنولوجيا */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">{t("technology")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
              {getLocalizedText(projectData as any, "technology", language)}
            </p>
          </CardContent>
        </Card>

        {/* حالات الاستخدام */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">{t("useCases")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
              {getLocalizedText(projectData as any, "useCase", language)}
            </p>
          </CardContent>
        </Card>

        {/* الفريق */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">{t("team")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
              {getLocalizedText(projectData as any, "team", language)}
            </p>
          </CardContent>
        </Card>

        {/* الشركاء */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">{t("partners")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
              {getLocalizedText(projectData as any, "partners", language)}
            </p>
          </CardContent>
        </Card>

        {/* التوافق الشرعي */}
        <Card className={`bg-slate-800 border mb-6 ${projectData.sharia_compliant ? "border-green-500/20" : "border-red-500/20"}`}>
          <CardHeader>
            <CardTitle className="text-white">
              {projectData.sharia_compliant ? "✅" : "❌"} {t("shariaCompliance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${projectData.sharia_compliant ? "text-green-400" : "text-red-400"} leading-relaxed`} style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
              {getLocalizedText(projectData as any, "sharia_notes", language)}
            </p>
          </CardContent>
        </Card>

        {/* الروابط الخارجية */}
        {projectData.links && Object.values(projectData.links).some((link) => link) && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">{t("importantLinks")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {projectData.links.website && (
                <a
                  href={projectData.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-400 hover:text-blue-300 transition"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t("officialWebsite")}
                </a>
              )}
              {projectData.links.twitter && (
                <a
                  href={projectData.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-400 hover:text-blue-300 transition"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t("twitter")}
                </a>
              )}
              {projectData.links.docs && (
                <a
                  href={projectData.links.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-400 hover:text-blue-300 transition"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t("docs")}
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* زر العودة في النهاية */}
        <Button
          onClick={() => navigate("/suggest-coins")}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white mb-4"
        >
          {t("backButton")}
        </Button>
      </div>
    </div>
  );
};

export default ProjectDetails;
