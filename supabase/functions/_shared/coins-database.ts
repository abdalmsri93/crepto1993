// قاعدة بيانات محلية للعملات الرقمية مع تقييماتها

export interface CoinData {
  symbol: string;
  name: string;
  category: string;
  price_range: string;
  market_cap: string;
  sharia_compliant: boolean;
  sharia_notes: string;
  project_description: string;
  risk_level: "منخفض" | "متوسط" | "عالي";
  growth_potential: string;
  liquidity: "عالية" | "متوسطة" | "منخفضة";
  performance_score: number; // 1-10
  recommendation: "تعزيز" | "احتفاظ" | "تقليص" | "إيقاف";
  team?: string;
  partners?: string;
  technology?: string;
  useCase?: string;
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
    project_description: "أول وأكبر عملة رقمية، تعمل كمخزن قيمة ووسيلة للدفع اللامركزي",
    risk_level: "منخفض",
    growth_potential: "نمو مستقر على المدى الطويل، يعتبر الذهب الرقمي",
    liquidity: "عالية",
    performance_score: 9,
    recommendation: "تعزيز",
    team: "أنشأها Satoshi Nakamoto (مجهول الهوية) في 2009. تطويرها الآن بواسطة Bitcoin Core developers ومئات المطورين حول العالم",
    partners: "مقبول من شركات عالمية: Tesla، MicroStrategy، Square، PayPal، وآلاف التجار. ETFs مُعتمدة في أمريكا",
    technology: "Proof-of-Work باستخدام SHA-256. نظام لامركزي بالكامل. Lightning Network للمدفوعات السريعة. أمان عالي جداً",
    useCase: "مخزن القيمة (الذهب الرقمي)، وسيلة دفع عالمية، حماية من التضخم، تحويلات دولية بدون وسطاء، ملاذ آمن في الأزمات",
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
    project_description: "منصة عقود ذكية رائدة تدعم التطبيقات اللامركزية والتمويل اللامركزي",
    risk_level: "منخفض",
    growth_potential: "نمو قوي مع توسع DeFi و NFTs",
    liquidity: "عالية",
    performance_score: 9,
    recommendation: "تعزيز",
    team: "أسسها Vitalik Buterin في 2015 مع Gavin Wood وآخرين. Ethereum Foundation تدير التطوير. آلاف المطورين يساهمون",
    partners: "Microsoft Azure، JPMorgan، Mastercard، Visa، Nike، Adidas. تُستخدم من 90%+ من مشاريع DeFi و NFT",
    technology: "Proof-of-Stake (The Merge 2022). EVM للعقود الذكية. Sharding قادم للتوسع. Layer 2s (Arbitrum, Optimism) للسرعة",
    useCase: "العقود الذكية، DeFi، NFTs، DAOs، Metaverse، Gaming، Stablecoins (USDC, DAI)، Tokenization، DApps",
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
    category: "Exchange Token",
    price_range: "$300-$700",
    market_cap: "$50B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - عملة منصة تداول مع استخدامات متعددة",
    project_description: "العملة الأساسية لمنصة Binance وشبكة BNB Chain",
    risk_level: "متوسط",
    growth_potential: "نمو مرتبط بنجاح منصة Binance",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "احتفاظ",
    team: "أسسها Changpeng Zhao (CZ) في 2017. Binance هي أكبر منصة تداول في العالم. فريق BNB Chain يطور النظام البيئي",
    partners: "Trust Wallet، PancakeSwap، Venus Protocol، 1inch. أكثر من 1,000 dApp على BNB Chain",
    technology: "BNB Chain (BSC) متوافق مع Ethereum EVM. Proof-of-Staked-Authority. رسوم منخفضة وسرعة عالية (3 ثوان)",
    useCase: "رسوم تداول مخفضة في Binance، DeFi على BNB Chain، NFTs، Gaming، Staking، Launchpad للمشاريع الجديدة",
    links: {
      website: "https://www.bnbchain.org",
      whitepaper: "https://www.bnbchain.org/en/bnb-whitepaper",
      twitter: "https://twitter.com/BNBCHAIN",
      docs: "https://docs.bnbchain.org"
    }
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    category: "Layer 1 High Performance",
    price_range: "$20-$200",
    market_cap: "$20B-$80B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - blockchain سريع للتطبيقات اللامركزية",
    project_description: "منصة blockchain عالية السرعة مع رسوم منخفضة جداً",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو عالية مع تحسن الاستقرار",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Anatoly Yakovenko في 2020. Solana Labs و Solana Foundation يديران التطوير. دعم من a16z و Multicoin Capital",
    partners: "Magic Eden، Phantom Wallet، Brave Browser، Circle (USDC)، Visa، Shopify. نظام بيئي كبير من NFTs و DeFi",
    technology: "Proof-of-History + Proof-of-Stake. سرعة 65,000 TPS. رسوم أقل من $0.01. لغة Rust للعقود الذكية",
    useCase: "DeFi عالي السرعة، NFT marketplaces، Gaming، DePIN، Payments، Mobile dApps (Saga phone)",
    links: {
      website: "https://solana.com",
      whitepaper: "https://solana.com/solana-whitepaper.pdf",
      twitter: "https://twitter.com/solana",
      docs: "https://docs.solana.com"
    }
  },
  ADA: {
    symbol: "ADA",
    name: "Cardano",
    category: "Layer 1 Research-Driven",
    price_range: "$0.3-$1.5",
    market_cap: "$10B-$50B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - مشروع بحثي أكاديمي",
    project_description: "منصة blockchain مبنية على أبحاث أكاديمية مع التركيز على الأمان",
    risk_level: "متوسط",
    growth_potential: "نمو بطيء ولكن مستقر",
    liquidity: "عالية",
    performance_score: 6,
    recommendation: "احتفاظ",
    team: "تأسست بواسطة Charles Hoskinson (مؤسس مشارك لـ Ethereum). الفريق يضم أكثر من 500 باحث ومطور، بقيادة IOHK و Emurgo و Cardano Foundation",
    partners: "شراكات مع حكومات أفريقية (إثيوبيا)، جامعات عالمية، ومشاريع DeFi. تُستخدم في أنظمة الهوية الرقمية والتعليم",
    technology: "تستخدم Ouroboros Proof-of-Stake، أول بروتوكول PoS تم التحقق منه أكاديمياً. لغة Plutus للعقود الذكية، معمارية متعددة الطبقات (Settlement + Computation)",
    useCase: "العقود الذكية، التطبيقات اللامركزية DApps، الهوية الرقمية، أنظمة التعليم، التمويل اللامركزي DeFi، وحلول التتبع في سلاسل التوريد",
    links: {
      website: "https://cardano.org",
      whitepaper: "https://cardano.org/whitepaper",
      twitter: "https://twitter.com/cardano",
      docs: "https://docs.cardano.org"
    }
  },
  DOT: {
    symbol: "DOT",
    name: "Polkadot",
    category: "Layer 0 Interoperability",
    price_range: "$5-$40",
    market_cap: "$8B-$40B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - بنية تحتية للربط بين الشبكات",
    project_description: "شبكة متعددة السلاسل تربط بين blockchains مختلفة",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو مع توسع النظام البيئي",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسه Gavin Wood (مؤسس مشارك لـ Ethereum ومبتكر Solidity). يديره فريق Web3 Foundation و Parity Technologies",
    partners: "تكامل مع Chainlink، Moonbeam، Acala، وأكثر من 100 parachain. شراكات مع مشاريع DeFi و NFT",
    technology: "معمارية Relay Chain + Parachains للتوسع. يستخدم Nominated Proof-of-Stake (NPoS). يدعم التشغيل البيني الكامل بين سلاسل مختلفة عبر XCM",
    useCase: "ربط blockchains مختلفة، إنشاء parachains مخصصة، DeFi عابر للسلاسل، Gaming، NFTs، وحلول enterprise blockchain",
    links: {
      website: "https://polkadot.network",
      whitepaper: "https://polkadot.network/whitepaper",
      twitter: "https://twitter.com/Polkadot",
      docs: "https://wiki.polkadot.network"
    }
  },
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    category: "Layer 1 High Speed",
    price_range: "$10-$100",
    market_cap: "$10B-$40B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - منصة عقود ذكية سريعة",
    project_description: "منصة عقود ذكية عالية السرعة ومنخفضة التكلفة",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو قوية مع تبني مؤسسي",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Emin Gün Sirer (أستاذ Cornell). Ava Labs تدير التطوير. دعم من Andreessen Horowitz و Polychain",
    partners: "Amazon AWS، Deloitte، Mastercard، JPMorgan. Subnets للمؤسسات (KYC-compliant blockchains)",
    technology: "معمارية فريدة: X-Chain (تبادل)، C-Chain (عقود)، P-Chain (تنسيق). Avalanche Consensus. نهائية أقل من ثانية",
    useCase: "DeFi، Enterprise Blockchains، Gaming، NFTs، Asset Tokenization، Subnets المخصصة للمؤسسات",
    links: {
      website: "https://www.avax.network",
      whitepaper: "https://www.avalabs.org/whitepapers",
      twitter: "https://twitter.com/avalancheavax",
      docs: "https://docs.avax.network"
    }
  },
  MATIC: {
    symbol: "MATIC",
    name: "Polygon",
    category: "Layer 2 Scaling",
    price_range: "$0.5-$2.5",
    market_cap: "$5B-$20B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - حل توسع لـ Ethereum",
    project_description: "حل layer 2 لتحسين سرعة وتكلفة معاملات Ethereum",
    risk_level: "متوسط",
    growth_potential: "نمو مرتبط بنجاح Ethereum",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "تعزيز",
    team: "أسسه Jaynti Kanani و Sandeep Nailwal و Anurag Arjun. مدعوم من Binance و Coinbase Ventures",
    partners: "شراكات مع Meta، Disney، Starbucks، Reddit، Adobe. أكثر من 37,000 dApp تعمل على Polygon",
    technology: "يستخدم Plasma framework و PoS sidechain. Polygon zkEVM لأداء أعلى. متوافق بالكامل مع Ethereum EVM",
    useCase: "DeFi، NFT marketplaces، Gaming، DApps عالية السرعة، مدفوعات منخفضة التكلفة، وحلول enterprise",
    links: {
      website: "https://polygon.technology",
      whitepaper: "https://polygon.technology/papers",
      twitter: "https://twitter.com/0xPolygon",
      docs: "https://docs.polygon.technology"
    }
  },
  LINK: {
    symbol: "LINK",
    name: "Chainlink",
    category: "Oracle Infrastructure",
    price_range: "$5-$50",
    market_cap: "$5B-$30B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - بنية تحتية للبيانات الخارجية",
    project_description: "شبكة أوراكل لامركزية توفر بيانات العالم الحقيقي للعقود الذكية",
    risk_level: "متوسط",
    growth_potential: "نمو قوي مع توسع DeFi",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "تعزيز",
    team: "أسسه Sergey Nazarov و Steve Ellis. فريق عالمي من 300+ مطور وباحث في مجال blockchain وoracles",
    partners: "تكامل مع Google Cloud، Oracle، SWIFT، AWS، وأكثر من 1,500 مشروع blockchain. معيار الصناعة لـ oracles",
    technology: "شبكة oracles لامركزية تربط العقود الذكية ببيانات خارجية. Chainlink VRF للعشوائية، Automation، Proof of Reserve",
    useCase: "توفير بيانات الأسعار لـ DeFi، VRF للألعاب، التأمين اللامركزي، ربط APIs بالعقود الذكية، CCIP للتشغيل البيني",
    links: {
      website: "https://chain.link",
      whitepaper: "https://chain.link/whitepaper",
      twitter: "https://twitter.com/chainlink",
      docs: "https://docs.chain.link"
    }
  },
  UNI: {
    symbol: "UNI",
    name: "Uniswap",
    category: "DeFi DEX",
    price_range: "$5-$30",
    market_cap: "$3B-$20B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - منصة تبادل لامركزية",
    project_description: "أكبر منصة تبادل لامركزية على Ethereum",
    risk_level: "متوسط",
    growth_potential: "نمو مع زيادة التداول اللامركزي",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Hayden Adams في 2018. Uniswap Labs تدير التطوير. دعم من a16z و Paradigm. فريق من 100+ مطور",
    partners: "متكامل مع MetaMask، Trust Wallet، Coinbase Wallet. يُستخدم من 1M+ مستخدم نشط. TVL $5B+",
    technology: "Automated Market Maker (AMM) باستخدام x*y=k formula. Uniswap V3 مع Concentrated Liquidity. متعدد السلاسل",
    useCase: "تبادل العملات اللامركزي، Liquidity provision، Yield farming، Token launches، Cross-chain swaps",
    links: {
      website: "https://uniswap.org",
      whitepaper: "https://uniswap.org/whitepaper-v3.pdf",
      twitter: "https://twitter.com/Uniswap",
      docs: "https://docs.uniswap.org"
    }
  },
  ATOM: {
    symbol: "ATOM",
    name: "Cosmos",
    category: "Layer 0 Interoperability",
    price_range: "$5-$40",
    market_cap: "$3B-$15B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - شبكة ربط بين blockchains",
    project_description: "إنترنت blockchains - يربط بين شبكات مستقلة",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو مع توسع النظام البيئي",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسه Jae Kwon و Ethan Buchman. Interchain Foundation تدير التطوير. Tendermint Core developers",
    partners: "نظام بيئي من 250+ blockchain متصلة. Binance Chain، Terra، Osmosis. Cosmos Hub هو المركز",
    technology: "Tendermint BFT consensus. Inter-Blockchain Communication (IBC) protocol. Cosmos SDK لبناء blockchains مخصصة",
    useCase: "ربط blockchains مختلفة، إنشاء سلاسل مخصصة، Cross-chain DeFi، Sovereign chains، Interoperability",
    links: {
      website: "https://cosmos.network",
      whitepaper: "https://v1.cosmos.network/resources/whitepaper",
      twitter: "https://twitter.com/cosmos",
      docs: "https://docs.cosmos.network"
    }
  },
  XRP: {
    symbol: "XRP",
    name: "Ripple",
    category: "Payment Network",
    price_range: "$0.4-$3",
    market_cap: "$20B-$150B",
    sharia_compliant: false,
    sharia_notes: "⚠️ يحتاج مراجعة - مركزية عالية وقضايا قانونية",
    project_description: "شبكة دفع للتحويلات المصرفية الدولية",
    risk_level: "عالي",
    growth_potential: "مرتبط بنتائج القضايا القانونية",
    liquidity: "عالية",
    performance_score: 5,
    recommendation: "تقليص"
  },
  DOGE: {
    symbol: "DOGE",
    name: "Dogecoin",
    category: "Meme Coin",
    price_range: "$0.05-$0.3",
    market_cap: "$7B-$40B",
    sharia_compliant: false,
    sharia_notes: "❌ غير متوافق - عملة ميم بدون مشروع حقيقي",
    project_description: "عملة ميم بدأت كمزحة، تعتمد على الدعاية فقط",
    risk_level: "عالي",
    growth_potential: "تقلبات عالية جداً، غير مستقر",
    liquidity: "عالية",
    performance_score: 3,
    recommendation: "إيقاف"
  },
  SHIB: {
    symbol: "SHIB",
    name: "Shiba Inu",
    category: "Meme Coin",
    price_range: "$0.000007-$0.00005",
    market_cap: "$4B-$20B",
    sharia_compliant: false,
    sharia_notes: "❌ غير متوافق - عملة ميم بدون استخدام حقيقي",
    project_description: "عملة ميم تحاكي Dogecoin بدون قيمة فعلية",
    risk_level: "عالي",
    growth_potential: "مضاربة بحتة، خطر عالي جداً",
    liquidity: "متوسطة",
    performance_score: 2,
    recommendation: "إيقاف"
  },
  ARB: {
    symbol: "ARB",
    name: "Arbitrum",
    category: "Layer 2 Scaling",
    price_range: "$0.5-$2",
    market_cap: "$2B-$10B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - حل توسع متقدم لـ Ethereum",
    project_description: "أحد أفضل حلول Layer 2 لـ Ethereum مع تقنية Optimistic Rollup",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو قوية مع توسع النظام البيئي",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "تعزيز",
    team: "طورتها Offchain Labs بقيادة Ed Felten (Princeton) و Steven Goldfeder. فريق من خبراء التشفير",
    partners: "يستخدمه GMX، Uniswap، Aave، Sushiswap. TVL $10B+. الأكبر في Layer 2s",
    technology: "Optimistic Rollup مع fraud proofs. Arbitrum One (mainnet) و Arbitrum Nova (gaming). متوافق 100% مع EVM",
    useCase: "DeFi بتكلفة منخفضة، Gaming، NFTs، DAOs، أي dApp يحتاج سرعة ورسوم قليلة",
    links: {
      website: "https://arbitrum.io",
      whitepaper: "https://github.com/OffchainLabs/nitro/blob/master/docs/Nitro-whitepaper.pdf",
      twitter: "https://twitter.com/arbitrum",
      docs: "https://docs.arbitrum.io"
    }
  },
  OP: {
    symbol: "OP",
    name: "Optimism",
    category: "Layer 2 Scaling",
    price_range: "$1-$4",
    market_cap: "$2B-$10B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - حل توسع لـ Ethereum",
    project_description: "حل Layer 2 لـ Ethereum باستخدام تقنية Optimistic Rollup",
    risk_level: "متوسط",
    growth_potential: "نمو مع زيادة استخدام Ethereum",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "تعزيز",
    team: "أسستها OP Labs (سابقاً Optimism PBC). Optimism Foundation تدير التطوير. Jinglan Wang و Karl Floersch",
    partners: "Coinbase Base built on OP Stack. Synthetix، Velodrome، Uniswap. TVL $6B+. OP Stack لإنشاء L2s",
    technology: "Optimistic Rollup. OP Stack (modular framework). EVM equivalence. Bedrock upgrade للأداء",
    useCase: "DeFi، NFTs، Gaming، Base ecosystem، إنشاء L2s مخصصة باستخدام OP Stack",
    links: {
      website: "https://optimism.io",
      whitepaper: "https://optimism.io/vision",
      twitter: "https://twitter.com/Optimism",
      docs: "https://docs.optimism.io"
    }
  },
  AAVE: {
    symbol: "AAVE",
    name: "Aave",
    category: "DeFi Lending",
    price_range: "$50-$300",
    market_cap: "$1B-$5B",
    sharia_compliant: false,
    sharia_notes: "⚠️ يحتاج مراجعة - بروتوكول إقراض يحتوي على فوائد",
    project_description: "بروتوكول إقراض واقتراض لامركزي",
    risk_level: "متوسط",
    growth_potential: "نمو مع توسع DeFi",
    liquidity: "عالية",
    performance_score: 6,
    recommendation: "تقليص"
  },
  NEAR: {
    symbol: "NEAR",
    name: "NEAR Protocol",
    category: "Layer 1 Sharding",
    price_range: "$1-$20",
    market_cap: "$2B-$20B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - منصة عقود ذكية مع تقنية sharding",
    project_description: "منصة blockchain قابلة للتوسع بشكل كبير مع تجربة مستخدم سهلة",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو جيدة مع التطوير المستمر",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Illia Polosukhin و Alex Skidanov. NEAR Foundation تدير المشروع. فريق من 50+ مطور",
    partners: "شراكات مع Google Cloud، Sweat Economy، Aurora (EVM). Human-readable accounts (@username.near)",
    technology: "Nightshade sharding للتوسع. Proof-of-Stake. Aurora لتشغيل Ethereum dApps. JavaScript SDK سهل الاستخدام",
    useCase: "DeFi، NFTs، Gaming، Web3 Social، Developer-friendly platform، Cross-chain bridges",
    links: {
      website: "https://near.org",
      whitepaper: "https://near.org/papers/the-official-near-white-paper",
      twitter: "https://twitter.com/NEARProtocol",
      docs: "https://docs.near.org"
    }
  },
  FTM: {
    symbol: "FTM",
    name: "Fantom",
    category: "Layer 1 DAG",
    price_range: "$0.2-$3",
    market_cap: "$500M-$8B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - منصة عقود ذكية بتقنية DAG",
    project_description: "منصة عقود ذكية سريعة جداً باستخدام تقنية DAG",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو مع زيادة التبني",
    liquidity: "متوسطة",
    performance_score: 6,
    recommendation: "احتفاظ",
    team: "أسسها Dr. Ahn Byung Ik. Fantom Foundation تدير المشروع. Andre Cronje (مؤسس Yearn) كان مستشاراً رئيسياً",
    partners: "شراكات مع حكومة طاجيكستان، باكستان. SpookySwap، Beethoven X. نظام DeFi قوي",
    technology: "Lachesis aBFT consensus (DAG-based). نهائية في ثانية واحدة. متوافق مع EVM. رسوم منخفضة جداً",
    useCase: "DeFi، Real World Asset tokenization، Government solutions، Fast payments، Gaming",
    links: {
      website: "https://fantom.foundation",
      whitepaper: "https://fantom.foundation/research/fantom_whitepaper.pdf",
      twitter: "https://twitter.com/FantomFDN",
      docs: "https://docs.fantom.foundation"
    }
  },
  ALGO: {
    symbol: "ALGO",
    name: "Algorand",
    category: "Layer 1 Pure PoS",
    price_range: "$0.1-$2",
    market_cap: "$1B-$15B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - blockchain أخضر وسريع",
    project_description: "منصة blockchain صديقة للبيئة مع إثبات حصة نقي",
    risk_level: "متوسط",
    growth_potential: "نمو بطيء ولكن مستقر",
    liquidity: "عالية",
    performance_score: 6,
    recommendation: "احتفاظ",
    team: "أسسه Silvio Micali (حائز على جائزة Turing في علوم الحاسب من MIT). فريق من خبراء التشفير والمطورين العالميين",
    partners: "شراكات مع الأمم المتحدة، FIFA، حكومة السلفادور، Circle (USDC)، ومؤسسات مالية عالمية",
    technology: "يستخدم Pure Proof-of-Stake. معالجة 6,000 TPS مع نهائية فورية (3.7 ثانية). Carbon-negative blockchain",
    useCase: "CBDCs، DeFi، NFTs، Real Estate Tokenization، سلاسل التوريد، الهوية الرقمية، وحلول الدفع الفورية",
    links: {
      website: "https://algorand.com",
      whitepaper: "https://algorand.com/technology/white-papers",
      twitter: "https://twitter.com/Algorand",
      docs: "https://developer.algorand.org"
    }
  },
  VET: {
    symbol: "VET",
    name: "VeChain",
    category: "Supply Chain",
    price_range: "$0.01-$0.2",
    market_cap: "$500M-$15B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - حل سلسلة التوريد",
    project_description: "منصة blockchain لإدارة سلسلة التوريد والتتبع",
    risk_level: "متوسط",
    growth_potential: "نمو مع التبني المؤسسي",
    liquidity: "متوسطة",
    performance_score: 6,
    recommendation: "احتفاظ",
    team: "أسسها Sunny Lu (CIO سابق في Louis Vuitton China). VeChain Foundation. فريق من خبراء supply chain",
    partners: "Walmart China، BMW، H&M، DNV GL، PwC. استخدام فعلي في tracking المنتجات",
    technology: "VeChainThor blockchain. Proof-of-Authority. ToolChain للمؤسسات. NFT Marketplace",
    useCase: "Supply chain tracking، Anti-counterfeiting، Product authenticity، Carbon tracking، Logistics",
    links: {
      website: "https://www.vechain.org",
      whitepaper: "https://www.vechain.org/whitepaper",
      twitter: "https://twitter.com/vechainofficial",
      docs: "https://docs.vechain.org"
    }
  },
  SUI: {
    symbol: "SUI",
    name: "Sui",
    category: "Layer 1 High Performance",
    price_range: "$1-$5",
    market_cap: "$3B-$15B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - تم تصنيفه Halal من Practical Islamic Finance",
    project_description: "blockchain حديث عالي الأداء مبني على لغة Move، يركز على السرعة والأمان",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو قوية مع تقنية متطورة",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Mysten Labs بقيادة Evan Cheng (Meta/Facebook سابقاً). الفريق من مطوري Diem/Libra السابقين",
    partners: "Binance Labs، Circle (USDC Native)، Google Cloud، Wormhole. نظام بيئي سريع النمو من Gaming و DeFi",
    technology: "لغة Move للعقود الذكية (نفس Aptos). معمارية Object-Centric فريدة. Narwhal & Bullshark consensus. 297,000 TPS نظرياً",
    useCase: "Gaming عالي السرعة، NFTs، DeFi، Social Apps، Payments، zkLogin للهوية، Sponsored Transactions",
    links: {
      website: "https://sui.io",
      whitepaper: "https://docs.sui.io/paper/sui.pdf",
      twitter: "https://twitter.com/SuiNetwork",
      docs: "https://docs.sui.io"
    }
  },
  HBAR: {
    symbol: "HBAR",
    name: "Hedera",
    category: "Distributed Ledger (Hashgraph)",
    price_range: "$0.05-$0.5",
    market_cap: "$2B-$15B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - معتمد من Sharlife (Malaysia SEC registered)",
    project_description: "تقنية Hashgraph للمعاملات السريعة جداً والموفرة للطاقة، مدعوم من شركات عالمية",
    risk_level: "متوسط",
    growth_potential: "نمو مع التبني المؤسسي والحكومي",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Leemon Baird و Mance Harmon. Governing Council من 32 شركة عالمية: Google، IBM، Boeing، LG، Deutsche Telekom",
    partners: "استخدام فعلي من: SpaceX، Tata Communications، Hyundai، UCL، Ubisoft. حلول enterprise و government",
    technology: "Hashgraph (ليس blockchain تقليدي). Asynchronous Byzantine Fault Tolerance (aBFT). 10,000+ TPS. رسوم $0.0001",
    useCase: "Tokenization، Supply Chain، Identity، CBDCs، Carbon Credits، Healthcare Records، Enterprise DLT",
    links: {
      website: "https://hedera.com",
      whitepaper: "https://hedera.com/papers",
      twitter: "https://twitter.com/hedera",
      docs: "https://docs.hedera.com"
    }
  },
  PYTH: {
    symbol: "PYTH",
    name: "Pyth Network",
    category: "Oracle Infrastructure",
    price_range: "$0.2-$1.5",
    market_cap: "$1B-$5B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - شبكة أوراكل لتوفير بيانات السوق",
    project_description: "شبكة أوراكل متطورة توفر بيانات أسعار فورية للعقود الذكية من مصادر موثوقة",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو مع توسع DeFi واحتياج البيانات الموثوقة",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "تم بناؤه بواسطة Jump Crypto و Douro Labs. شبكة من 90+ مزود بيانات من مؤسسات مالية كبرى",
    partners: "مزودو البيانات: Jane Street، DRW، Virtu Financial، CME Group، Binance. متكامل مع 250+ blockchain",
    technology: "Oracle عالي التردد (400ms updates). Pull-based model. متعدد السلاسل (Solana, Ethereum, Arbitrum, BNB). Confidence intervals",
    useCase: "توفير أسعار real-time لـ DeFi، Perpetuals، Options، Lending Protocols، cross-chain price data",
    links: {
      website: "https://pyth.network",
      whitepaper: "https://pyth.network/whitepaper",
      twitter: "https://twitter.com/PythNetwork",
      docs: "https://docs.pyth.network"
    }
  },
  GRT: {
    symbol: "GRT",
    name: "The Graph",
    category: "Indexing Protocol",
    price_range: "$0.05-$0.5",
    market_cap: "$1B-$5B",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - بروتوكول فهرسة بيانات blockchain",
    project_description: "بروتوكول لفهرسة والاستعلام عن بيانات blockchain، يُسمى 'Google of blockchains'",
    risk_level: "متوسط",
    growth_potential: "نمو مع زيادة الحاجة لفهرسة البيانات في Web3",
    liquidity: "عالية",
    performance_score: 7,
    recommendation: "احتفاظ",
    team: "أسسها Yaniv Tal و Brandon Ramirez و Jannis Pohlmann. Graph Foundation تدير البروتوكول. دعم من Coinbase Ventures",
    partners: "يستخدمه Uniswap، Aave، Decentraland، Synthetix، ENS. أكثر من 3,000 subgraph منشور",
    technology: "شبكة لامركزية من Indexers و Curators و Delegators. GraphQL API. يدعم Ethereum، Polygon، Arbitrum، وغيرها",
    useCase: "فهرسة بيانات blockchain لـ dApps، استعلام سريع عن البيانات، بناء APIs لامركزية، Web3 data infrastructure",
    links: {
      website: "https://thegraph.com",
      whitepaper: "https://thegraph.com/docs/en/about/",
      twitter: "https://twitter.com/graphprotocol",
      docs: "https://thegraph.com/docs"
    }
  },
  IOTA: {
    symbol: "IOTA",
    name: "IOTA",
    category: "Distributed Ledger (Tangle)",
    price_range: "$0.1-$2",
    market_cap: "$500M-$5B",
    sharia_compliant: true,
    sharia_notes: "✅ متوافق شرعياً - معتمد من Cambridge Institute of Islamic Finance (2024)",
    project_description: "تقنية Tangle (DAG) للمعاملات بدون رسوم، مصممة لإنترنت الأشياء (IoT)",
    risk_level: "متوسط",
    growth_potential: "إمكانيات نمو مع توسع إنترنت الأشياء",
    liquidity: "متوسطة",
    performance_score: 6,
    recommendation: "احتفاظ",
    team: "أسسها David Sønstebø و Sergey Ivancheglo و Dominik Schiener. IOTA Foundation مسجلة في ألمانيا. فريق من 150+ خبير",
    partners: "شراكات مع Dell، Bosch، Volkswagen، Jaguar Land Rover، Linux Foundation. تركيز على IoT و Smart Cities",
    technology: "Tangle (Directed Acyclic Graph) بدلاً من blockchain. معاملات بدون رسوم. Chrysalis (IOTA 2.0) و Shimmer network للتجارب",
    useCase: "IoT data marketplace، Supply Chain tracking، Smart Cities، Connected Cars، Industry 4.0، Digital Identity",
    links: {
      website: "https://www.iota.org",
      whitepaper: "https://www.iota.org/foundation/white-papers",
      twitter: "https://twitter.com/iota",
      docs: "https://wiki.iota.org"
    }
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    category: "Stablecoin",
    price_range: "$0.99-$1.01",
    market_cap: "$100B+",
    sharia_compliant: true,
    sharia_notes: "متوافق شرعياً - عملة مستقرة مربوطة بالدولار 1:1 (معتمد من Sharlife)",
    project_description: "أكبر عملة مستقرة، مربوطة بالدولار الأمريكي بنسبة 1:1",
    risk_level: "منخفض",
    growth_potential: "استقرار السعر، تُستخدم كملاذ آمن وللتداول",
    liquidity: "عالية",
    performance_score: 8,
    recommendation: "احتفاظ",
    team: "تديرها Tether Holdings Limited. احتياطيات مدققة بشكل ربع سنوي. أكبر stablecoin في العالم منذ 2014",
    partners: "متاح على 15+ blockchain. مستخدم في جميع منصات التداول الكبرى (Binance, Coinbase, Kraken). الأكثر سيولة",
    technology: "متعدد السلاسل: ERC-20 (Ethereum)، TRC-20 (Tron)، BEP-20 (BSC)، Solana، Algorand. احتياطي 1:1 مدقق",
    useCase: "ملاذ آمن من تقلبات السوق، تداول، تحويلات دولية، DeFi، Liquidity provision، hedge، on/off ramp للعملات الرقمية",
    links: {
      website: "https://tether.to",
      whitepaper: "https://tether.to/en/transparency",
      twitter: "https://twitter.com/Tether_to",
      docs: "https://tether.to/en/how-it-works"
    }
  }
};

// دالة لتوليد تحليل تلقائي للعملات غير الموجودة
export function generateAutoAnalysis(asset: string, usdValue: number, allocation: number, priceChange: number | null): string {
  const changeText = priceChange !== null ? 
    (priceChange > 0 ? `ارتفاع بحوالي ${priceChange.toFixed(2)}%` : 
     priceChange < 0 ? `انخفاض بحوالي ${Math.abs(priceChange).toFixed(2)}%` : 
     "استقرار") : "غير متوفر";
  
  // تقييم تلقائي للمخاطر بناءً على التقلبات
  let riskLevel = "متوسط";
  let performance = "مستقر";
  
  if (priceChange !== null) {
    if (Math.abs(priceChange) > 10) {
      riskLevel = "عالي";
      performance = priceChange > 0 ? "متقلب صعوداً" : "متقلب هبوطاً";
    } else if (Math.abs(priceChange) > 5) {
      riskLevel = "متوسط إلى عالي";
      performance = priceChange > 0 ? "نشط صعوداً" : "نشط هبوطاً";
    } else if (Math.abs(priceChange) < 1) {
      riskLevel = "منخفض إلى متوسط";
      performance = "مستقر نسبياً";
    }
  }
  
  return `🪙 **${asset}** 🤖 *(تحليل تلقائي)*
   • قيمة مركزك التقريبية: $${usdValue.toFixed(2)} (${allocation.toFixed(2)}% من إجمالي المحفظة)
   • حركة السعر اليومية: ${changeText} خلال 24 ساعة
   • الأداء التلقائي: ${performance}
   • المخاطر المقدرة: ${riskLevel} (بناءً على التقلبات السعرية)
   • السيولة: عالية (متوفر على Binance)
   
   ⚠️ **ملاحظة مهمة:** هذا تحليل تلقائي أولي بناءً على بيانات Binance فقط.
   📊 لم يتم التحقق من التوافق الشرعي أو تفاصيل المشروع بعد.
   💡 يمكنك طلب تحليل محسّن باستخدام الذكاء الاصطناعي للحصول على معلومات أكثر تفصيلاً.\n\n`;
}

// دالة للحصول على معلومات العملة
export function getCoinData(symbol: string): CoinData | null {
  return COINS_DATABASE[symbol.toUpperCase()] || null;
}

// دالة لتحليل محفظة كاملة
export function analyzePortfolio(balances: any[]): string {
  function getDailyChangeText(change: number | null): string {
    if (change === null || isNaN(change)) {
      return "لم تتوفر بيانات موثوقة عن حركة السعر خلال آخر 24 ساعة";
    }
    if (change >= 10) return `ارتفاع قوي بحوالي ${change.toFixed(2)}% خلال 24 ساعة (تقلب عالي)`;
    if (change >= 3) return `أداء إيجابي مع ارتفاع يقارب ${change.toFixed(2)}% خلال 24 ساعة`;
    if (change > 0) return `ارتفاع طفيف بحوالي ${change.toFixed(2)}% خلال 24 ساعة`;
    if (change <= -10) return `هبوط حاد بحوالي ${change.toFixed(2)}-% خلال 24 ساعة (مخاطر مرتفعة)`;
    if (change <= -3) return `أداء سلبي مع هبوط يقارب ${change.toFixed(2)}-% خلال 24 ساعة`;
    if (change < 0) return `انخفاض طفيف بحوالي ${change.toFixed(2)}-% خلال 24 ساعة`;
    return "استقرار نسبي في السعر خلال آخر 24 ساعة";
  }

  // تحويل القيم القادمة من Binance لأرقام واستخدامها في التحليل
  const normalizedBalances = balances.map((balance) => {
    const usdValueRaw = balance.usdValue ?? balance.usd_value ?? 0;
    const usdValue = typeof usdValueRaw === "string" ? parseFloat(usdValueRaw) : Number(usdValueRaw) || 0;

    const changeRaw = balance.priceChangePercent ?? balance.price_change_percent ?? null;
    const priceChange =
      changeRaw === null || changeRaw === undefined
        ? null
        : parseFloat(String(changeRaw));

    return {
      ...balance,
      usdValueNumber: isNaN(usdValue) ? 0 : usdValue,
      priceChangeNumber: priceChange === null || isNaN(priceChange) ? null : priceChange,
    };
  });

  const totalValue = normalizedBalances.reduce(
    (sum: number, b: any) => sum + (typeof b.usdValueNumber === "number" ? b.usdValueNumber : 0),
    0,
  );

  let analysis = `═══════════════════════════════════\n📊 تحليل محفظة العملات الرقمية\n═══════════════════════════════════\n\n`;
  
  analysis += `🔍 **تحليل العملات الحالية**\n────────────────────────────────\n\n`;
  
  // تحليل كل عملة
  for (const balance of normalizedBalances) {
    const coinData = getCoinData(balance.asset);
    const usdValue: number = balance.usdValueNumber || 0;
    const allocation = totalValue > 0 && usdValue > 0 ? (usdValue / totalValue) * 100 : 0;
    const change: number | null = balance.priceChangeNumber;

    const allocationText =
      usdValue > 0 && totalValue > 0
        ? `$${usdValue.toFixed(2)} (${allocation.toFixed(2)}% من إجمالي المحفظة)`
        : "قيمة صغيرة أو غير محددة مقارنة بحجم المحفظة";

    const changeText = getDailyChangeText(change);
    
    if (coinData) {
      analysis += `🪙 **${coinData.name} (${coinData.symbol})**\n`;
      analysis += `   • قيمة مركزك التقريبية: ${allocationText}\n`;
      analysis += `   • حركة السعر اليومية (من بيانات Binance): ${changeText}\n`;
      analysis += `   • الأداء التاريخي: ${getPerformanceText(coinData.performance_score)}\n`;
      analysis += `   • قوة المشروع: ${coinData.project_description}\n`;
      analysis += `   • السيولة: ${coinData.liquidity}\n`;
      analysis += `   • المخاطر: ${coinData.risk_level}\n`;
      analysis += `   • التوافق الشرعي: ${coinData.sharia_notes}\n\n`;
    } else {
      // استخدام التحليل التلقائي للعملات غير الموجودة
      analysis += generateAutoAnalysis(balance.asset, usdValue, allocation, change);
    }
  }
  
  analysis += `────────────────────────────────\n\n`;
  analysis += `📋 **التوصيات والقرارات**\n────────────────────────────────\n\n`;
  
  // توليد توصيات مفصلة ومحددة لكل عملة
  for (const balance of normalizedBalances) {
    const coinData = getCoinData(balance.asset);
    const usdValue: number = balance.usdValueNumber || 0;
    const allocation = totalValue > 0 && usdValue > 0 ? (usdValue / totalValue) * 100 : 0;
    const change: number | null = balance.priceChangeNumber;
    
    if (coinData) {
      // عنوان التوصية
      const recommendationEmoji = {
        "تعزيز": "✅",
        "احتفاظ": "⚖️",
        "تقليص": "⚠️",
        "إيقاف": "❌"
      }[coinData.recommendation];
      
      analysis += `${recommendationEmoji} **توصية ${coinData.symbol}: ${coinData.recommendation}**\n\n`;
      
      // تحليل الأداء الحالي
      if (change !== null && !isNaN(change)) {
        if (change > 10) {
          analysis += `📈 **الأداء الحالي:** ارتفاع قوي (+${change.toFixed(2)}%) خلال 24 ساعة - يشير إلى زخم إيجابي قوي ولكن مع تقلبات عالية.\n`;
        } else if (change > 3) {
          analysis += `📈 **الأداء الحالي:** أداء إيجابي (+${change.toFixed(2)}%) خلال 24 ساعة - اتجاه صعودي معتدل.\n`;
        } else if (change > 0) {
          analysis += `📊 **الأداء الحالي:** استقرار مع ميل صعودي طفيف (+${change.toFixed(2)}%) خلال 24 ساعة.\n`;
        } else if (change < -10) {
          analysis += `📉 **الأداء الحالي:** انخفاض حاد (${change.toFixed(2)}%) خلال 24 ساعة - تقلبات عالية وضغط بيعي.\n`;
        } else if (change < -3) {
          analysis += `📉 **الأداء الحالي:** أداء سلبي (${change.toFixed(2)}%) خلال 24 ساعة - اتجاه هبوطي معتدل.\n`;
        } else if (change < 0) {
          analysis += `📊 **الأداء الحالي:** استقرار مع ميل هبوطي طفيف (${change.toFixed(2)}%) خلال 24 ساعة.\n`;
        } else {
          analysis += `📊 **الأداء الحالي:** استقرار تام في السعر خلال 24 ساعة الأخيرة.\n`;
        }
      }
      
      // توصيات محددة بناءً على نوع التوصية والبيانات الفعلية
      if (coinData.recommendation === "تعزيز") {
        analysis += `\n💡 **أسباب التوصية بالتعزيز:**\n`;
        analysis += `   • مشروع قوي: ${coinData.project_description}\n`;
        analysis += `   • درجة أداء عالية: ${coinData.performance_score}/10\n`;
        analysis += `   • سيولة ممتازة: ${coinData.liquidity}\n`;
        analysis += `   • توافق شرعي كامل: ${coinData.sharia_notes}\n`;
        
        analysis += `\n🎯 **الإجراءات المقترحة:**\n`;
        if (allocation < 15) {
          analysis += `   • زيادة التخصيص تدريجياً من ${allocation.toFixed(1)}% إلى 15-20%\n`;
          analysis += `   • الشراء على دفعات عند أي تصحيحات سعرية\n`;
        } else {
          analysis += `   • الحفاظ على المركز الحالي (${allocation.toFixed(1)}%)\n`;
          analysis += `   • إضافة المزيد في حالة انخفاض السعر بأكثر من 10%\n`;
        }
        
      } else if (coinData.recommendation === "احتفاظ") {
        analysis += `\n💡 **تقييم المركز الحالي:**\n`;
        analysis += `   • التخصيص الحالي: ${allocation.toFixed(1)}% من المحفظة ($${usdValue.toFixed(2)})\n`;
        analysis += `   • المشروع: ${coinData.project_description}\n`;
        analysis += `   • مستوى المخاطر: ${coinData.risk_level}\n`;
        
        analysis += `\n🎯 **استراتيجية الاحتفاظ:**\n`;
        
        // توصيات محددة حسب نوع العملة
        if (coinData.symbol === "USDT") {
          analysis += `   • احتفظ بـ USDT كمخزون استقرار (10-20% من المحفظة)\n`;
          analysis += `   • استخدمه للاستفادة من فرص الشراء عند انخفاض الأسعار\n`;
          analysis += `   • لا حاجة لزيادة أو تقليل إلا بناءً على استراتيجية التداول\n`;
        } else if (coinData.category.includes("Oracle") || coinData.category.includes("Indexing")) {
          analysis += `   • مشاريع البنية التحتية (${coinData.name}) تحتاج وقت للنمو\n`;
          analysis += `   • راقب التطورات التقنية وزيادة التبني\n`;
          analysis += `   • احتفظ بالمركز الحالي وراقب الأداء ربع سنوي\n`;
          if (change !== null && change < -5) {
            analysis += `   • الأداء الحالي سلبي - فرصة للشراء بسعر أفضل إذا كنت تخطط للتعزيز\n`;
          }
        } else {
          analysis += `   • احتفظ بالمركز الحالي دون تغييرات كبيرة\n`;
          analysis += `   • راقب أخبار المشروع والشراكات الجديدة\n`;
          analysis += `   • ${coinData.growth_potential}\n`;
          if (allocation > 15) {
            analysis += `   • التخصيص مرتفع نسبياً (${allocation.toFixed(1)}%) - فكر في جني بعض الأرباح عند ارتفاع 20%+\n`;
          }
        }
        
        analysis += `\n⚠️ **نقاط المراقبة:**\n`;
        analysis += `   • راقب التطورات التقنية والشراكات\n`;
        analysis += `   • ضع أمر إيقاف خسارة عند -15% من السعر الحالي\n`;
        if (change !== null && change < -5) {
          analysis += `   • الأداء حالياً سلبي - مراقبة دقيقة مطلوبة\n`;
        }
        
      } else if (coinData.recommendation === "تقليص") {
        analysis += `\n⚠️ **أسباب التوصية بالتقليص:**\n`;
        analysis += `   • مستوى مخاطر: ${coinData.risk_level}\n`;
        analysis += `   • ${coinData.growth_potential}\n`;
        
        analysis += `\n🎯 **الإجراءات المقترحة:**\n`;
        analysis += `   • تقليص المركز من ${allocation.toFixed(1)}% إلى 5% تدريجياً\n`;
        analysis += `   • البيع على دفعات عند أي ارتفاعات سعرية\n`;
        analysis += `   • تحويل الأموال لعملات أكثر استقراراً\n`;
        
      } else if (coinData.recommendation === "إيقاف") {
        analysis += `\n❌ **أسباب التوصية بالإيقاف:**\n`;
        analysis += `   • ${coinData.sharia_notes}\n`;
        analysis += `   • مخاطر عالية جداً\n`;
        
        analysis += `\n🎯 **الإجراءات المقترحة:**\n`;
        analysis += `   • الخروج التام من المركز في أقرب وقت ممكن\n`;
        analysis += `   • عدم الانتظار لاسترداد الخسائر\n`;
        analysis += `   • تحويل الأموال لعملات متوافقة شرعياً\n`;
      }
      
      analysis += `\n────────────────────────────────\n\n`;
    }
  }
  
  analysis += `────────────────────────────────\n\n`;
  analysis += `💡 **استراتيجية التنويع المقترحة**\n────────────────────────────────\n\n`;
  analysis += `1. **التوزيع المثالي المقترح:**\n`;
  analysis += `   • 40-50% - عملات أساسية قوية (BTC, ETH)\n`;
  analysis += `   • 30-40% - عملات layer 1/2 واعدة\n`;
  analysis += `   • 10-20% - مشاريع بنية تحتية\n`;
  analysis += `   • 5-10% - فرص نمو عالية\n\n`;
  analysis += `2. **نصائح إضافية:**\n`;
  analysis += `   • راجع محفظتك شهرياً\n`;
  analysis += `   • لا تستثمر أكثر مما تستطيع خسارته\n`;
  analysis += `   • تحقق من التطورات التقنية للمشاريع\n`;
  analysis += `   • تأكد من التوافق الشرعي قبل الاستثمار\n\n`;
  analysis += `════════════════════════════════════\n`;
  
  return analysis;
}

// دالة مساعدة لاستخراج متوسط السعر من نطاق السعر
function getAveragePriceFromRange(priceRange: string): number {
  // مثال: "$1-$5" -> متوسط 3
  // مثال: "$0.05-$0.5" -> متوسط 0.275
  const match = priceRange.match(/\$?([\d.]+)[-–]\$?([\d.]+)/);
  if (match) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    return (min + max) / 2;
  }
  // إذا كان السعر ثابت مثل "$1.00"
  const singleMatch = priceRange.match(/\$?([\d.]+)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }
  return 0;
}

// دالة مساعدة للتحقق من القيمة السوقية
function matchesMarketCap(marketCap: string, filter: string): boolean {
  if (filter === "all") return true;
  
  // استخراج القيمة من النص
  const hasB = marketCap.includes("B");
  const hasM = marketCap.includes("M");
  
  if (filter === "small") {
    // صغيرة: $10M - $500M
    return hasM && !marketCap.includes("$100B");
  } else if (filter === "medium") {
    // متوسطة: $500M - $10B
    return (hasM && marketCap.includes("$5")) || 
           (hasB && !marketCap.includes("$10B") && !marketCap.includes("$100B"));
  } else if (filter === "large") {
    // كبيرة: $10B+
    return hasB && (marketCap.includes("$10B") || marketCap.includes("$100B"));
  }
  
  return true;
}

// دالة للحصول على اقتراحات عملات جديدة مع جميع الفلاتر
// دالة للاختيار العشوائي من مصفوفة (Random Sampling) - هذا هو المفتاح!
function randomSample<T>(array: T[], count: number): T[] {
  if (array.length <= count) return array;
  
  const result: T[] = [];
  const used = new Set<number>();
  
  // اختيار عشوائي بدون تكرار
  while (result.length < count) {
    const randomIndex = Math.floor(Math.random() * array.length);
    if (!used.has(randomIndex)) {
      used.add(randomIndex);
      result.push(array[randomIndex]);
    }
  }
  
  return result;
}

// دالة لتخليط المصفوفة بشكل عشوائي قوي (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // استخدام crypto للعشوائية الحقيقية
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function suggestNewCoins(
  currentAssets: string[], 
  investmentAmount: number | null = null,
  minPrice: number = 0.10,
  maxPrice: number = 10,
  marketCapFilter: string = "all",
  coinCount: number = 5
) {
  const currentSymbols = currentAssets.map(a => a.toUpperCase());
  
  // تصفية العملات بناءً على جميع الشروط
  let availableCoins = Object.values(COINS_DATABASE).filter(coin => {
    // الشروط الأساسية
    if (!coin.sharia_compliant) return false;
    if (currentSymbols.includes(coin.symbol)) return false;
    if (coin.recommendation === "إيقاف") return false;
    
    // فلتر السعر
    const avgPrice = getAveragePriceFromRange(coin.price_range);
    if (avgPrice < minPrice || avgPrice > maxPrice) return false;
    
    // فلتر القيمة السوقية
    if (!matchesMarketCap(coin.market_cap, marketCapFilter)) return false;
    
    return true;
  });
  
  // حساب "أفضل قيمة مقابل السعر" لكل عملة
  const coinsWithValue = availableCoins.map(coin => {
    const avgPrice = getAveragePriceFromRange(coin.price_range);
    const valueScore = avgPrice > 0 ? coin.performance_score / avgPrice : 0;
    return {
      ...coin,
      avgPrice,
      valueScore
    };
  });
  
  // ترتيب حسب أفضل قيمة
  coinsWithValue.sort((a, b) => b.valueScore - a.valueScore);
  
  // اختيار عشوائي من أفضل 80% من العملات (استخدام randomSample)
  const topPercent = Math.ceil(coinsWithValue.length * 0.8);
  const topCoins = coinsWithValue.slice(0, topPercent);
  
  // استخدام random sampling لاختيار عملات عشوائية مختلفة **كل مرة**
  const selectedCoins = randomSample(topCoins, Math.min(coinCount, topCoins.length));
  
  // حساب توزيع ديناميكي بناءً على عدد العملات
  const generateDistribution = (count: number): number[] => {
    if (count === 3) return [50, 30, 20];
    if (count === 4) return [40, 30, 20, 10];
    if (count === 5) return [35, 25, 20, 15, 5];
    if (count === 6) return [30, 25, 20, 12, 8, 5];
    if (count === 7) return [25, 20, 18, 15, 10, 7, 5];
    if (count === 8) return [22, 18, 15, 13, 10, 8, 7, 7];
    if (count === 9) return [20, 16, 14, 12, 10, 9, 8, 6, 5];
    if (count === 10) return [18, 15, 13, 11, 10, 9, 8, 7, 5, 4];
    // default
    return Array(count).fill(100 / count);
  };
  
  const distribution = generateDistribution(selectedCoins.length);
  
  return selectedCoins.map((coin, index) => {
    const percentage = distribution[index];
    const suggestedAmount = investmentAmount ? (investmentAmount * percentage / 100).toFixed(2) : null;
    
    return {
      name: coin.name,
      symbol: coin.symbol,
      price: coin.price_range,
      marketCap: coin.market_cap,
      project: coin.project_description,
      shariaCompliance: coin.sharia_notes,
      growth: coin.growth_potential,
      riskLevel: coin.risk_level,
      liquidity: coin.liquidity,
      performanceScore: coin.performance_score,
      investmentPercentage: percentage,
      suggestedAmount: suggestedAmount,
      recommendation: coin.recommendation,
      category: coin.category,
      valueScore: coin.valueScore.toFixed(2),
      avgPrice: coin.avgPrice.toFixed(2),
      team: coin.team,
      partners: coin.partners,
      technology: coin.technology,
      useCase: coin.useCase,
      links: coin.links
    };
  });
}

function getPerformanceText(score: number): string {
  if (score >= 9) return "ممتاز - أداء قوي جداً ومستقر";
  if (score >= 7) return "جيد جداً - أداء قوي مع استقرار";
  if (score >= 5) return "جيد - أداء مقبول مع بعض التقلبات";
  if (score >= 3) return "ضعيف - أداء متذبذب ومخاطر عالية";
  return "سيء جداً - مخاطر عالية جداً";
}