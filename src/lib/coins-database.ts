// قاعدة بيانات محلية للعملات الرقمية

export interface CoinData {
  symbol: string;
  name: string;
  category: string;
  price_range: string;
  market_cap: string;
  sharia_compliant: boolean;
  sharia_notes: string;
  sharia_notes_en?: string;
  project_description: string;
  project_description_en?: string;
  risk_level: "منخفض" | "متوسط" | "عالي";
  growth_potential: string;
  growth_potential_en?: string;
  liquidity: "عالية" | "متوسطة" | "منخفضة";
  performance_score: number;
  recommendation: "تعزيز" | "احتفاظ" | "تقليص" | "إيقاف";
  team?: string;
  team_en?: string;
  partners?: string;
  partners_en?: string;
  technology?: string;
  technology_en?: string;
  useCase?: string;
  useCase_en?: string;
  links?: {
    website?: string;
    whitepaper?: string;
    twitter?: string;
    docs?: string;
  };
}

export const COINS_DATABASE: Record<string, CoinData> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    category: "Layer 1",
    price_range: "$40,000-$100,000",
    market_cap: "$800B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - عملة رقمية نقية بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Pure digital currency without Riba (interest)",
    project_description: "أول وأكبر عملة رقمية، تعمل كمخزن قيمة ووسيلة للدفع اللامركزي. Bitcoin هي العملة الأساسية التي أحدثت ثورة في العالم المالي منذ 2009.",
    project_description_en: "The first and largest cryptocurrency, functioning as a store of value and decentralized payment method. Bitcoin is the foundational digital currency that revolutionized the financial world since 2009.",
    risk_level: "منخفض",
    growth_potential: "نمو مستقر على المدى الطويل، يعتبر الذهب الرقمي",
    growth_potential_en: "Stable long-term growth, considered digital gold with proven store of value",
    liquidity: "عالية",
    performance_score: 9,
    recommendation: "تعزيز",
    team: "أنشأها Satoshi Nakamoto (مجهول الهوية) في 2009. تطويرها الآن بواسطة Bitcoin Core developers ومئات المطورين حول العالم",
    team_en: "Created by Satoshi Nakamoto (pseudonymous) in 2009. Currently developed by Bitcoin Core developers and hundreds of developers worldwide",
    partners: "مقبول من شركات عالمية: Tesla، MicroStrategy، Square، PayPal، وآلاف التجار. ETFs مُعتمدة في أمريكا",
    partners_en: "Accepted by major companies: Tesla, MicroStrategy, Square, PayPal, and thousands of merchants. US-approved ETFs available",
    technology: "Proof-of-Work باستخدام SHA-256. نظام لامركزي بالكامل. Lightning Network للمدفوعات السريعة. أمان عالي جداً",
    technology_en: "Proof-of-Work using SHA-256. Fully decentralized system. Lightning Network for fast payments. Extremely high security",
    useCase: "مخزن القيمة (الذهب الرقمي)، وسيلة دفع عالمية، حماية من التضخم، تحويلات دولية بدون وسطاء، ملاذ آمن في الأزمات",
    useCase_en: "Store of value (digital gold), universal payment method, inflation hedge, international transfers without intermediaries, safe haven",
    links: {
      website: "https://bitcoin.org",
      whitepaper: "https://bitcoin.org/bitcoin.pdf",
      twitter: "https://twitter.com/Bitcoin",
      docs: "https://developer.bitcoin.org"
    }
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    category: "Layer 1 Smart Contracts",
    price_range: "$2,000-$5,000",
    market_cap: "$300B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - منصة عقود ذكية بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Smart contract platform without Riba mechanisms",
    project_description: "منصة عقود ذكية رائدة تدعم التطبيقات اللامركزية والتمويل اللامركزي. تحتوي على أكبر نظام بيئي من التطبيقات اللامركزية.",
    project_description_en: "A leading smart contract platform supporting decentralized applications and decentralized finance. Home to the largest ecosystem of decentralized applications.",
    risk_level: "منخفض",
    growth_potential: "نمو قوي مع توسع DeFi و NFTs والـ Web3",
    growth_potential_en: "Strong growth with DeFi and NFT expansion and Web3 evolution",
    liquidity: "عالية",
    performance_score: 9,
    recommendation: "تعزيز",
    team: "أسسها Vitalik Buterin في 2015 مع Gavin Wood وآخرين. Ethereum Foundation تدير التطوير. آلاف المطورين يساهمون",
    team_en: "Founded by Vitalik Buterin in 2015 with Gavin Wood and others. Ethereum Foundation manages development. Thousands of developers contribute",
    partners: "Microsoft Azure، JPMorgan، Mastercard، Visa، Nike، Adidas. تُستخدم من 90%+ من مشاريع DeFi و NFT",
    partners_en: "Microsoft Azure, JPMorgan, Mastercard, Visa, Nike, Adidas. Used by 90%+ of DeFi and NFT projects",
    technology: "Proof-of-Stake (The Merge 2022). EVM للعقود الذكية. Sharding قادم للتوسع. Layer 2s (Arbitrum, Optimism) للسرعة",
    technology_en: "Proof-of-Stake (The Merge 2022). EVM for smart contracts. Sharding coming for scaling. Layer 2s (Arbitrum, Optimism) for speed",
    useCase: "العقود الذكية، DeFi، NFTs، DAOs، Metaverse، Gaming، Stablecoins (USDC, DAI)، Tokenization، DApps",
    useCase_en: "Smart contracts, DeFi, NFTs, DAOs, Metaverse, Gaming, Stablecoins (USDC, DAI), Tokenization, DApps",
    links: {
      website: "https://ethereum.org",
      whitepaper: "https://ethereum.org/en/whitepaper",
      twitter: "https://twitter.com/ethereum",
      docs: "https://ethereum.org/en/developers/docs"
    }
  },
  BNB: {
    symbol: "BNB",
    name: "Binance Coin",
    category: "Exchange Token / Layer 1",
    price_range: "$300-$700",
    market_cap: "$50B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - عملة منصة تداول مع استخدامات متعددة",
    sharia_notes_en: "Sharia Compliant - Exchange token with multiple utilities",
    project_description: "العملة الأساسية لمنصة Binance وشبكة BNB Chain. تُستخدم لتخفيض رسوم التداول والعمليات على النظام البيئي.",
    project_description_en: "The native currency of Binance platform and BNB Chain network. Used for reducing trading fees and ecosystem operations.",
    risk_level: "متوسط",
    growth_potential: "نمو مرتبط بنجاح منصة Binance والتطبيقات على BNB Chain",
    growth_potential_en: "Growth tied to Binance platform success and BNB Chain applications",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "احتفاظ",
    team: "أسسها Changpeng Zhao (CZ) في 2017. Binance هي أكبر منصة تداول في العالم. فريق BNB Chain يطور النظام البيئي",
    team_en: "Founded by Changpeng Zhao (CZ) in 2017. Binance is the world's largest trading platform. BNB Chain team develops the ecosystem",
    partners: "Trust Wallet، PancakeSwap، Venus Protocol، 1inch. أكثر من 1,000 dApp على BNB Chain",
    partners_en: "Trust Wallet, PancakeSwap, Venus Protocol, 1inch. Over 1,000 dApps on BNB Chain",
    technology: "BNB Chain (BSC) متوافق مع Ethereum EVM. Proof-of-Staked-Authority. رسوم منخفضة وسرعة عالية (3 ثوان)",
    technology_en: "BNB Chain (BSC) compatible with Ethereum EVM. Proof-of-Staked-Authority. Low fees and high speed (3 seconds)",
    useCase: "رسوم تداول مخفضة في Binance، DeFi على BNB Chain، NFTs، Gaming، Staking، Launchpad للمشاريع الجديدة",
    useCase_en: "Reduced trading fees on Binance, DeFi on BNB Chain, NFTs, Gaming, Staking, Launchpad for new projects",
    links: {
      website: "https://www.bnbchain.org",
      whitepaper: "https://www.bnbchain.org/en/bnb-whitepaper",
      twitter: "https://twitter.com/BNBChain",
      docs: "https://docs.bnbchain.org"
    }
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    category: "Layer 1 High-Speed",
    price_range: "$30-$150",
    market_cap: "$60B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - شبكة blockchain بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Blockchain network without Riba mechanisms",
    project_description: "شبكة blockchain عالية السرعة والأداء تركز على سرعة المعاملات والقابلية للتوسع بتكاليف منخفضة.",
    project_description_en: "A high-speed and high-performance blockchain network focused on transaction speed and scalability with low costs.",
    risk_level: "متوسط",
    growth_potential: "نمو قوي مع استخدام NFTs والـ DeFi والألعاب على Solana",
    growth_potential_en: "Strong growth with NFTs, DeFi and gaming usage on Solana",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "احتفاظ",
    team: "أسسها Anatoly Yakovenko في 2017. Solana Labs تطور البروتوكول. مئات المطورين في النظام البيئي",
    team_en: "Founded by Anatoly Yakovenko in 2017. Solana Labs develops the protocol. Hundreds of developers in the ecosystem",
    partners: "Magic Eden، Phantom Wallet، Serum DEX، Marinade Finance، Metaplex. أكثر من 500 مشروع على Solana",
    partners_en: "Magic Eden, Phantom Wallet, Serum DEX, Marinade Finance, Metaplex. Over 500 projects on Solana",
    technology: "Proof-of-History (PoH) + Proof-of-Stake. سرعة: 65,000+ معاملة في الثانية. رسوم: ~$0.00025 لكل معاملة",
    technology_en: "Proof-of-History (PoH) + Proof-of-Stake. Speed: 65,000+ transactions per second. Fees: ~$0.00025 per transaction",
    useCase: "NFTs والـ Gaming على أعلى مستوى، DeFi السريع، Metaverse، تطبيقات الويب3 عالية الأداء، الدفع",
    useCase_en: "High-performance NFTs and Gaming, fast DeFi, Metaverse, high-performance Web3 applications, payments",
    links: {
      website: "https://solana.com",
      whitepaper: "https://solana.com/solana-whitepaper",
      twitter: "https://twitter.com/solana",
      docs: "https://docs.solana.com"
    }
  },
  ADA: {
    symbol: "ADA",
    name: "Cardano",
    category: "Layer 1 Smart Contracts",
    price_range: "$0.5-$1.5",
    market_cap: "$20B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - شبكة عقود ذكية بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Smart contract network without Riba mechanisms",
    project_description: "منصة عقود ذكية تركز على الأمان والاستدامة مع تصميم أكاديمي قوي. تُعتبر من أكثر المشاريع أماناً في المجال.",
    project_description_en: "A smart contract platform focused on security and sustainability with strong academic design. Considered one of the safest projects in the field.",
    risk_level: "منخفض",
    growth_potential: "نمو ثابت مع توسع DeFi والتطبيقات الحكومية في إفريقيا",
    growth_potential_en: "Stable growth with DeFi expansion and government applications in Africa",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "احتفاظ",
    team: "أسسها Charles Hoskinson (أحد مؤسسي Ethereum سابقاً). IOG (Input Output Global) تطور البروتوكول.",
    team_en: "Founded by Charles Hoskinson (former Ethereum co-founder). IOG (Input Output Global) develops the protocol.",
    partners: "حكومات وشركات في إفريقيا. مشاريع DeFi مثل Minswap و SundaeSwap. جامعات عديدة تبحث عن Cardano",
    partners_en: "Governments and companies in Africa. DeFi projects like Minswap and SundaeSwap. Multiple universities research Cardano",
    technology: "Proof-of-Stake (Ouroboros). لغة Plutus للعقود الذكية. تحديثات تدريجية آمنة. منحى أكاديمي قوي",
    technology_en: "Proof-of-Stake (Ouroboros). Plutus language for smart contracts. Gradual safe updates. Strong academic approach",
    useCase: "العقود الذكية الآمنة، التطبيقات الحكومية، DeFi، NFTs، حالات الاستخدام في الدول النامية",
    useCase_en: "Secure smart contracts, government applications, DeFi, NFTs, developing world use cases",
    links: {
      website: "https://cardano.org",
      whitepaper: "https://eprint.iacr.org/2018/262.pdf",
      twitter: "https://twitter.com/Cardano_CF",
      docs: "https://docs.cardano.org"
    }
  },
  DOGE: {
    symbol: "DOGE",
    name: "Dogecoin",
    category: "Memecoin / Payment",
    price_range: "$0.10-$0.50",
    market_cap: "$15B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - عملة دفع بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Payment currency without Riba mechanisms",
    project_description: "عملة دفع لامركزية بدأت كـ meme لكنها أصبحت عملة حقيقية مع مجتمع قوي جداً. مقبولة من تجار حقيقيين.",
    project_description_en: "A decentralized payment currency that started as a meme but became a real currency with a very strong community. Accepted by real merchants.",
    risk_level: "متوسط",
    growth_potential: "نمو متقلب لكن مرتفع. مدعومة من Elon Musk والمجتمع القوي",
    growth_potential_en: "Volatile but potentially high growth. Supported by Elon Musk and a strong community",
    liquidity: "عالية",
    performance_score: 6,
    recommendation: "احتفاظ",
    team: "أنشأها Billy Markus و Jackson Palmer في 2013. مجتمع عالمي كبير يطور المشروع",
    team_en: "Created by Billy Markus and Jackson Palmer in 2013. Large global community develops the project",
    partners: "Elon Musk يدعمها علناً. Tesla قبلت Dogecoin للدفع سابقاً. عديد التجار يقبلونها",
    partners_en: "Openly supported by Elon Musk. Tesla previously accepted Dogecoin for payment. Many merchants accept it",
    technology: "Proof-of-Work مثل Bitcoin. رسوم منخفضة جداً. معاملات سريعة. تضخم معروف (5 مليارات دوجـــه سنوياً)",
    technology_en: "Proof-of-Work like Bitcoin. Very low fees. Fast transactions. Known inflation (5 billion DOGE yearly)",
    useCase: "وسيلة دفع فعلية، تحويلات أموال، هدايا صغيرة، تبرعات، مكافآت للمحتوى",
    useCase_en: "Actual payment method, money transfers, small gifts, donations, content rewards",
    links: {
      website: "https://dogecoin.com",
      twitter: "https://twitter.com/dogecoin",
      docs: "https://github.com/dogecoin/dogecoin"
    }
  },
  XRP: {
    symbol: "XRP",
    name: "Ripple",
    category: "Payment Protocol",
    price_range: "$2-$5",
    market_cap: "$25B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - بروتوكول دفع بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Payment protocol without Riba mechanisms",
    project_description: "بروتوكول دفع عالمي سريع وفعال يركز على تحويلات دولية برسوم منخفضة والمؤسسات المالية.",
    project_description_en: "A fast and efficient global payment protocol focused on international transfers with low fees for financial institutions.",
    risk_level: "منخفض",
    growth_potential: "نمو مرتبط بـ adoption من البنوك والمؤسسات المالية",
    growth_potential_en: "Growth tied to adoption by banks and financial institutions",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Ryan Fugger وتطورها Ripple Labs. يستخدمها عشرات البنوك العالمية",
    team_en: "Founded by Ryan Fugger and developed by Ripple Labs. Used by dozens of banks worldwide",
    partners: "أكثر من 300 بنك وشركة مالية تستخدم Ripple. SBI و American Express و Santander",
    partners_en: "Over 300 banks and financial companies use Ripple. SBI, American Express, Santander",
    technology: "Consensus Protocol (ليس PoW أو PoS). تحويلات في ثوانٍ. الرسوم: $0.00001 XRP",
    technology_en: "Consensus Protocol (not PoW or PoS). Transfers in seconds. Fees: $0.00001 XRP",
    useCase: "تحويلات دولية للبنوك والمؤسسات المالية، دفع B2B، التسويات المالية، استقرار الأموال",
    useCase_en: "International transfers for banks and financial institutions, B2B payments, financial settlements, money stability",
    links: {
      website: "https://ripple.com",
      whitepaper: "https://ripple.com/files/ripple_consensus_whitepaper.pdf",
      twitter: "https://twitter.com/Ripple",
      docs: "https://xrpl.org/docs"
    }
  },
  LTC: {
    symbol: "LTC",
    name: "Litecoin",
    category: "Layer 1 Payment",
    price_range: "$100-$300",
    market_cap: "$15B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - عملة دفع بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Payment currency without Riba mechanisms",
    project_description: "عملة دفع لامركزية تركز على السرعة والكفاءة. غالباً تُعتبر الفضة مقابل ذهب البيتكوين.",
    project_description_en: "A decentralized payment currency focused on speed and efficiency. Often considered the silver to Bitcoin's gold.",
    risk_level: "منخفض",
    growth_potential: "نمو مستقر كعملة دفع موثوقة",
    growth_potential_en: "Stable growth as a reliable payment currency",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أنشأها Charlie Lee في 2011. مجتمع قوي من المطورين والمستخدمين",
    team_en: "Created by Charlie Lee in 2011. Strong community of developers and users",
    partners: "Grayscale Investment Trust. ATMs في عديد الدول. قبول من تجار في كل العالم",
    partners_en: "Grayscale Investment Trust. ATMs in many countries. Merchant acceptance worldwide",
    technology: "Proof-of-Work مع Scrypt. معاملات أسرع من البيتكوين (2.5 دقيقة). Segregated Witness و Lightning Network",
    technology_en: "Proof-of-Work with Scrypt. Faster transactions than Bitcoin (2.5 minutes). Segregated Witness and Lightning Network",
    useCase: "وسيلة دفع سريعة وآمنة، تحويلات دولية برسوم منخفضة، مخزن قيمة طويل الأجل",
    useCase_en: "Fast and secure payment method, international transfers with low fees, long-term store of value",
    links: {
      website: "https://litecoin.org",
      twitter: "https://twitter.com/LitecoinProject",
      docs: "https://litecoin.info"
    }
  },
  MATIC: {
    symbol: "MATIC",
    name: "Polygon",
    category: "Layer 2 Solution",
    price_range: "$0.5-$2",
    market_cap: "$8B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - حل توسع Ethereum بدون آليات ربوية",
    sharia_notes_en: "Sharia Compliant - Ethereum scaling solution without Riba mechanisms",
    project_description: "حل توسع Layer 2 لـ Ethereum يوفر معاملات سريعة برسوم منخفضة جداً. الأكثر استخداماً حالياً.",
    project_description_en: "An Ethereum Layer 2 scaling solution providing fast transactions with very low fees. Currently the most used solution.",
    risk_level: "متوسط",
    growth_potential: "نمو قوي مع توسع DeFi والألعاب على Polygon",
    growth_potential_en: "Strong growth with DeFi and gaming expansion on Polygon",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "تعزيز",
    team: "أسسها Jaynti Kanani و Sandeep Nailwal وآخرون. Polygon Foundation تدير التطوير",
    team_en: "Founded by Jaynti Kanani and Sandeep Nailwal and others. Polygon Foundation manages development",
    partners: "Aave، SushiSwap، QuickSwap، Curve. آلاف dApps على Polygon",
    partners_en: "Aave, SushiSwap, QuickSwap, Curve. Thousands of dApps on Polygon",
    technology: "Plasma و Rollups. معاملات: 7000+ في الثانية. الرسوم: أقل من $0.001",
    technology_en: "Plasma and Rollups. Transactions: 7000+ per second. Fees: less than $0.001",
    useCase: "DeFi على Ethereum برسوم منخفضة، NFTs والألعاب، تطبيقات الويب3",
    useCase_en: "DeFi on Ethereum with low fees, NFTs and gaming, Web3 applications",
    links: {
      website: "https://polygon.technology",
      whitepaper: "https://polygon.technology/papers/",
      twitter: "https://twitter.com/0xPolygon",
      docs: "https://docs.polygon.technology"
    }
  }
};

// دالة للحصول على بيانات العملة
export function getCoinData(symbol: string): CoinData | undefined {
  return COINS_DATABASE[symbol.toUpperCase()];
}

// دالة للحصول على النص بناءً على اللغة
export function getLocalizedText(
  coin: any,
  field: "project_description" | "team" | "partners" | "technology" | "useCase" | "sharia_notes" | "growth_potential",
  language: "ar" | "en"
): string {
  if (language === "en") {
    // محاولة الحصول على النسخة الإنجليزية
    const engField = `${field}_en` as string;
    const engValue = coin[engField];
    
    if (engValue && typeof engValue === 'string') {
      return engValue;
    }
    
    // إذا لم توجد النسخة الإنجليزية، استخدم النسخة الافتراضية
    return (coin[field] as string) || "";
  }
  
  // للعربية، استخدم النسخة العربية مباشرة
  return (coin[field] as string) || "";
}

// دالة للحصول على جميع العملات
export function getAllCoins(): CoinData[] {
  return Object.values(COINS_DATABASE);
}

// دالة للبحث عن عملات
export function searchCoins(query: string): CoinData[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(COINS_DATABASE).filter(coin =>
    coin.symbol.toLowerCase().includes(lowercaseQuery) ||
    coin.name.toLowerCase().includes(lowercaseQuery)
  );
}
