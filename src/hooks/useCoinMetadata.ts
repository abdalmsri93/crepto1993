import { useState, useEffect } from 'react';

export interface CoinMetadata {
  launchDate: string | null;
  category: string | null;
  description: string | null;
  loading: boolean;
  error: string | null;
}

// تواريخ الإطلاق بصيغة ISO للترتيب
export const COIN_LAUNCH_DATES_ISO: Record<string, string> = {
  BTC: '2009-01-03', ETH: '2015-07-30', BNB: '2017-06-25', SOL: '2020-03-10',
  USDT: '2014-10-06', USDC: '2018-09-26', ADA: '2017-09-29', DOGE: '2013-12-06',
  XRP: '2013-02-02', LTC: '2011-10-07', MATIC: '2019-04-26', LINK: '2017-09-19',
  UNI: '2020-09-17', AVAX: '2020-09-21', DOT: '2020-08-18', ATOM: '2019-03-13',
  NEAR: '2020-04-22', ARB: '2023-03-23', OP: '2022-05-31', POL: '2019-04-26',
  PEPE: '2023-04-14', SHIB: '2020-08-03', APE: '2022-03-17', FLOKI: '2021-06-28',
  WIF: '2023-12-20', BONK: '2022-12-25', MEME: '2023-10-28', BABYDOGE: '2021-06-01',
  ELON: '2021-04-23', TURBO: '2023-04-29', GALA: '2020-09-16', SAND: '2020-08-14',
  MANA: '2017-08-08', AXS: '2020-11-04', ILV: '2021-03-30', IMX: '2021-04-13',
  ALICE: '2021-03-15', ENJ: '2017-11-01', GMT: '2022-03-09', MAGIC: '2021-09-10',
  SUPER: '2021-03-22', PIXEL: '2024-02-19', PORTAL: '2024-02-29', ENS: '2021-11-09',
  LDO: '2020-12-17', MKR: '2017-11-30', AAVE: '2020-10-02', CRV: '2020-08-13',
  YFI: '2020-07-17', SUSHI: '2020-08-28', COMP: '2020-06-15', SNX: '2018-03-07',
  BAL: '2020-06-23', DYDX: '2021-09-08', GRT: '2020-12-17', '1INCH': '2020-12-25',
  CAKE: '2020-09-20', GMX: '2021-09-01', PENDLE: '2021-04-28', RPL: '2021-11-18',
  EIGEN: '2024-10-01', TRX: '2017-08-28', TON: '2021-07-28', ETC: '2016-07-20',
  BCH: '2017-08-01', FIL: '2020-10-15', ICP: '2021-05-10', HBAR: '2019-09-16',
  VET: '2017-08-29', XLM: '2014-08-04', ALGO: '2019-06-20', EOS: '2017-06-01',
  FLOW: '2021-01-01', MINA: '2021-03-31', KAS: '2021-11-07', INJ: '2020-10-27',
  SEI: '2023-08-15', SUI: '2023-05-03', APT: '2022-10-12', TIA: '2023-10-31',
  KAVA: '2019-10-15', ROSE: '2020-11-19', ONE: '2019-06-01', FTM: '2018-10-29',
  CELO: '2020-04-22', ZIL: '2018-01-25', EGLD: '2019-07-04', XTZ: '2018-06-30',
  NEO: '2014-06-22', ZEC: '2016-10-28', DASH: '2014-01-18', XMR: '2014-04-18',
  STRK: '2024-02-20', ZK: '2024-06-17', METIS: '2021-11-18', LRC: '2017-12-10',
  CELR: '2019-03-25', SKL: '2020-12-01', CTSI: '2020-05-03', FET: '2019-02-25',
  AGIX: '2017-12-18', OCEAN: '2019-05-07', RNDR: '2020-04-01', THETA: '2018-01-12',
  AR: '2018-06-08', ARKM: '2023-07-18', WLD: '2023-07-24', TAO: '2021-01-03',
  ONDO: '2024-01-18', OKB: '2019-03-04', CRO: '2018-12-14', KCS: '2017-11-02',
  WOO: '2020-10-30', QNT: '2018-06-28', BAND: '2019-09-18', API3: '2020-11-30',
  ANKR: '2019-03-07', STORJ: '2017-07-02', GLM: '2016-11-10', COTI: '2019-06-03',
  ACH: '2020-07-22', CHZ: '2019-10-22', AUDIO: '2020-10-20', MASK: '2021-02-24',
  DAI: '2017-12-18', TUSD: '2018-03-04', FDUSD: '2023-07-26', FRAX: '2020-12-21',
  JASMY: '2021-01-26', IOTA: '2017-06-13', CFX: '2020-10-29', BLUR: '2023-02-14',
  ID: '2023-03-22', CYBER: '2023-08-15', JUP: '2024-01-31', PYTH: '2023-11-20',
  JTO: '2023-12-07', DYM: '2024-02-06', MANTA: '2024-01-18', ORDI: '2023-03-08',
  LUNC: '2019-04-24', LUNA: '2022-05-28', NEXO: '2018-04-01', RSR: '2019-05-22',
  PAXG: '2019-09-26', BTT: '2019-01-30', TWT: '2019-11-18', LQTY: '2021-04-05',
  HOOK: '2022-12-01', HIGH: '2021-10-11', PERP: '2020-09-14', DODO: '2020-09-29',
  BADGER: '2020-12-03', SPELL: '2021-05-30', CVX: '2021-05-17', FXS: '2020-12-21',
  STG: '2022-03-17', ALT: '2024-01-25', XAI: '2024-01-09',
};

/**
 * الحصول على تاريخ إطلاق العملة بصيغة ISO للترتيب
 */
export const getCoinLaunchDateISO = (symbol: string): string | null => {
  const upperSymbol = symbol.toUpperCase().replace(/USDT$/i, '');
  return COIN_LAUNCH_DATES_ISO[upperSymbol] || null;
};

// خريطة موسعة لربط رموز Binance برموز CoinGecko (~150+ عملة)
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  // العملات الرئيسية
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  USDT: 'tether',
  USDC: 'usd-coin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  LTC: 'litecoin',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  ATOM: 'cosmos',
  NEAR: 'near',
  ARB: 'arbitrum',
  OP: 'optimism',
  POL: 'polygon',
  
  // Memecoins
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
  APE: 'apecoin',
  FLOKI: 'floki',
  WIF: 'dogwifcoin',
  BONK: 'bonk',
  MEME: 'memecoin-2',
  BABYDOGE: 'baby-doge-coin',
  ELON: 'dogelon-mars',
  TURBO: 'turbo',
  WOJAK: 'wojak',
  
  // Gaming & Metaverse
  GALA: 'gala',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  ILV: 'illuvium',
  IMX: 'immutable-x',
  ALICE: 'my-neighbor-alice',
  ENJ: 'enjincoin',
  GMT: 'stepn',
  MAGIC: 'magic',
  SUPER: 'superfarm',
  RONIN: 'ronin',
  PIXEL: 'pixels',
  PORTAL: 'portal-2',
  
  // DeFi
  ENS: 'ethereum-name-service',
  LDO: 'lido-dao',
  MKR: 'maker',
  AAVE: 'aave',
  CRV: 'curve-dao-token',
  YFI: 'yearn-finance',
  SUSHI: 'sushi',
  COMP: 'compound',
  SNX: 'havven',
  BAL: 'balancer',
  DYDX: 'dydx',
  GRT: 'the-graph',
  '1INCH': '1inch',
  CAKE: 'pancakeswap-token',
  JOE: 'joe',
  GMX: 'gmx',
  PENDLE: 'pendle',
  RDNT: 'radiant-capital',
  RPL: 'rocket-pool',
  SSV: 'ssv-network',
  EIGEN: 'eigenlayer',
  
  // Layer 1
  TRX: 'tron',
  TON: 'the-open-network',
  ETC: 'ethereum-classic',
  BCH: 'bitcoin-cash',
  FIL: 'filecoin',
  ICP: 'internet-computer',
  HBAR: 'hedera-hashgraph',
  VET: 'vechain',
  XLM: 'stellar',
  ALGO: 'algorand',
  EOS: 'eos',
  FLOW: 'flow',
  MINA: 'mina-protocol',
  KAS: 'kaspa',
  INJ: 'injective-protocol',
  SEI: 'sei-network',
  SUI: 'sui',
  APT: 'aptos',
  TIA: 'celestia',
  KAVA: 'kava',
  ROSE: 'oasis-network',
  ONE: 'harmony',
  FTM: 'fantom',
  CELO: 'celo',
  ZIL: 'zilliqa',
  EGLD: 'elrond-erd-2',
  XTZ: 'tezos',
  NEO: 'neo',
  QTUM: 'qtum',
  WAVES: 'waves',
  ZEC: 'zcash',
  DASH: 'dash',
  XMR: 'monero',
  
  // Layer 2 & Scaling
  STRK: 'starknet',
  ZK: 'zksync',
  METIS: 'metis-token',
  BOBA: 'boba-network',
  LRC: 'loopring',
  CELR: 'celer-network',
  SKL: 'skale',
  CTSI: 'cartesi',
  
  // AI & Data
  FET: 'fetch-ai',
  AGIX: 'singularitynet',
  OCEAN: 'ocean-protocol',
  RNDR: 'render-token',
  THETA: 'theta-token',
  TFUEL: 'theta-fuel',
  AR: 'arweave',
  ARKM: 'arkham',
  WLD: 'worldcoin-wld',
  TAO: 'bittensor',
  ONDO: 'ondo-finance',
  
  // Exchange Tokens
  OKB: 'okb',
  CRO: 'crypto-com-chain',
  HT: 'huobi-token',
  LEO: 'leo-token',
  KCS: 'kucoin-shares',
  GT: 'gatechain-token',
  MX: 'mx-token',
  WOO: 'woo-network',
  
  // Infrastructure
  QNT: 'quant-network',
  BAND: 'band-protocol',
  API3: 'api3',
  RLC: 'iexec-rlc',
  ANKR: 'ankr',
  STORJ: 'storj',
  GLM: 'golem',
  NKN: 'nkn',
  COTI: 'coti',
  ACH: 'alchemy-pay',
  CHZ: 'chiliz',
  HOT: 'holotoken',
  VRA: 'verasity',
  AUDIO: 'audius',
  MASK: 'mask-network',
  
  // Stablecoins
  DAI: 'dai',
  TUSD: 'true-usd',
  BUSD: 'binance-usd',
  FDUSD: 'first-digital-usd',
  PYUSD: 'paypal-usd',
  FRAX: 'frax',
  USDD: 'usdd',
  
  // Others
  JASMY: 'jasmy',
  IOTA: 'iota',
  CFX: 'conflux-token',
  BLUR: 'blur',
  ID: 'space-id',
  CYBER: 'cyber',
  BAKE: 'bakerytoken',
  XAI: 'xai-blockchain',
  ALT: 'altlayer',
  JUP: 'jupiter-exchange-solana',
  PYTH: 'pyth-network',
  JTO: 'jito-governance-token',
  DYM: 'dymension',
  MANTA: 'manta-network',
  ORDI: 'ordinals',
  SATS: '1000sats-ordinals',
  RATS: 'rats',
  LUNC: 'terra-luna',
  LUNA: 'terra-luna-2',
  USTC: 'terrausd',
  NEXO: 'nexo',
  RSR: 'reserve-rights-token',
  PAXG: 'pax-gold',
  XDC: 'xdce-crowd-sale',
  BTT: 'bittorrent',
  WIN: 'winklink',
  SXP: 'swipe',
  TWT: 'trust-wallet-token',
  NFT: 'apenft',
  GMT: 'stepn',
  GST: 'green-satoshi-token',
  LQTY: 'liquity',
  HOOK: 'hooked-protocol',
  HIGH: 'highstreet',
  LEVER: 'lever',
  AMB: 'amber',
  AERGO: 'aergo',
  BETA: 'beta-finance',
  RARE: 'superrare',
  PERP: 'perpetual-protocol',
  REEF: 'reef',
  DODO: 'dodo',
  BADGER: 'badger-dao',
  ALCX: 'alchemix',
  SPELL: 'spell-token',
  CVX: 'convex-finance',
  FXS: 'frax-share',
  T: 'threshold-network-token',
  STG: 'stargate-finance',
};

// بيانات fallback موسعة للعملات الرئيسية (~150+ عملة)
const FALLBACK_COIN_DATA: Record<string, { launchDate: string; category: string; description: string }> = {
  // العملات الرئيسية
  BTC: { launchDate: '3 يناير 2009', category: 'Layer 1', description: 'أول عملة رقمية لامركزية - ذهب رقمي' },
  ETH: { launchDate: '30 يوليو 2015', category: 'Layer 1 Smart Contracts', description: 'منصة العقود الذكية الأولى' },
  BNB: { launchDate: '25 يونيو 2017', category: 'Exchange Token', description: 'عملة منصة Binance' },
  SOL: { launchDate: '10 مارس 2020', category: 'Layer 1', description: 'بلوكتشين فائق السرعة' },
  USDT: { launchDate: '6 أكتوبر 2014', category: 'Stablecoin', description: 'عملة مستقرة مرتبطة بالدولار' },
  USDC: { launchDate: '26 سبتمبر 2018', category: 'Stablecoin', description: 'عملة مستقرة من Circle' },
  ADA: { launchDate: '29 سبتمبر 2017', category: 'Layer 1', description: 'بلوكتشين بحثي علمي' },
  DOGE: { launchDate: '6 ديسمبر 2013', category: 'Memecoin', description: 'أول عملة ميم - الكلب الشهير' },
  XRP: { launchDate: '2 فبراير 2013', category: 'Payment Protocol', description: 'شبكة مدفوعات سريعة للبنوك' },
  LTC: { launchDate: '7 أكتوبر 2011', category: 'Layer 1', description: 'فضة رقمية - نسخة محسنة من BTC' },
  MATIC: { launchDate: '26 أبريل 2019', category: 'Layer 2', description: 'حلول توسعة لإيثريوم' },
  LINK: { launchDate: '19 سبتمبر 2017', category: 'Oracle', description: 'شبكة أوراكل لامركزية' },
  UNI: { launchDate: '17 سبتمبر 2020', category: 'DeFi', description: 'أكبر منصة تبادل لامركزية' },
  AVAX: { launchDate: '21 سبتمبر 2020', category: 'Layer 1', description: 'منصة عقود ذكية سريعة' },
  DOT: { launchDate: '18 أغسطس 2020', category: 'Interoperability', description: 'ربط البلوكتشينات معاً' },
  ATOM: { launchDate: '13 مارس 2019', category: 'Interoperability', description: 'إنترنت البلوكتشينات' },
  NEAR: { launchDate: '22 أبريل 2020', category: 'Layer 1', description: 'بلوكتشين صديق للمطورين' },
  ARB: { launchDate: '23 مارس 2023', category: 'Layer 2', description: 'حل Layer 2 لإيثريوم' },
  OP: { launchDate: '31 مايو 2022', category: 'Layer 2', description: 'Optimistic Rollup لإيثريوم' },
  POL: { launchDate: '26 أبريل 2019', category: 'Scaling', description: 'توكن حوكمة Polygon' },
  
  // Memecoins
  PEPE: { launchDate: '14 أبريل 2023', category: 'Memecoin', description: 'عملة ميم الضفدع الشهير' },
  SHIB: { launchDate: '3 أغسطس 2020', category: 'Memecoin', description: 'قاتل Dogecoin المزعوم' },
  APE: { launchDate: '17 مارس 2022', category: 'Gaming/NFT', description: 'توكن مجتمع Bored Ape' },
  FLOKI: { launchDate: '28 يونيو 2021', category: 'Memecoin', description: 'عملة ميم مستوحاة من كلب إيلون' },
  WIF: { launchDate: '20 ديسمبر 2023', category: 'Memecoin', description: 'كلب يرتدي قبعة على Solana' },
  BONK: { launchDate: '25 ديسمبر 2022', category: 'Memecoin', description: 'أول عملة ميم على Solana' },
  MEME: { launchDate: '28 أكتوبر 2023', category: 'Memecoin', description: 'توكن منصة Memeland' },
  BABYDOGE: { launchDate: '1 يونيو 2021', category: 'Memecoin', description: 'ابن Dogecoin' },
  ELON: { launchDate: '23 أبريل 2021', category: 'Memecoin', description: 'عملة ميم باسم إيلون ماسك' },
  TURBO: { launchDate: '29 أبريل 2023', category: 'Memecoin', description: 'أول عملة أنشأها ChatGPT' },
  
  // Gaming & Metaverse
  GALA: { launchDate: '16 سبتمبر 2020', category: 'Gaming', description: 'منصة ألعاب بلوكتشين' },
  SAND: { launchDate: '14 أغسطس 2020', category: 'Metaverse', description: 'عالم افتراضي للألعاب' },
  MANA: { launchDate: '8 أغسطس 2017', category: 'Metaverse', description: 'عالم Decentraland الافتراضي' },
  AXS: { launchDate: '4 نوفمبر 2020', category: 'Gaming', description: 'لعبة Axie Infinity' },
  ILV: { launchDate: '30 مارس 2021', category: 'Gaming', description: 'لعبة RPG على بلوكتشين' },
  IMX: { launchDate: '13 أبريل 2021', category: 'NFT/Gaming', description: 'Layer 2 للألعاب و NFT' },
  ALICE: { launchDate: '15 مارس 2021', category: 'Gaming', description: 'لعبة بناء عوالم' },
  ENJ: { launchDate: '1 نوفمبر 2017', category: 'Gaming/NFT', description: 'منصة أصول الألعاب' },
  GMT: { launchDate: '9 مارس 2022', category: 'Gaming/Move2Earn', description: 'تطبيق STEPN للمشي' },
  MAGIC: { launchDate: '10 سبتمبر 2021', category: 'Gaming', description: 'نظام Treasure للألعاب' },
  SUPER: { launchDate: '22 مارس 2021', category: 'Gaming/NFT', description: 'منصة NFT للألعاب' },
  PIXEL: { launchDate: '19 فبراير 2024', category: 'Gaming', description: 'لعبة زراعة على الويب' },
  PORTAL: { launchDate: '29 فبراير 2024', category: 'Gaming', description: 'منصة ألعاب Web3' },
  
  // DeFi
  ENS: { launchDate: '9 نوفمبر 2021', category: 'Infrastructure', description: 'أسماء نطاقات إيثريوم' },
  LDO: { launchDate: '17 ديسمبر 2020', category: 'Liquid Staking', description: 'أكبر منصة Staking سائل' },
  MKR: { launchDate: '30 نوفمبر 2017', category: 'DeFi', description: 'حوكمة عملة DAI المستقرة' },
  AAVE: { launchDate: '2 أكتوبر 2020', category: 'DeFi Lending', description: 'أكبر منصة إقراض لامركزي' },
  CRV: { launchDate: '13 أغسطس 2020', category: 'DeFi AMM', description: 'تبادل العملات المستقرة' },
  YFI: { launchDate: '17 يوليو 2020', category: 'DeFi Yield', description: 'تحسين عوائد DeFi' },
  SUSHI: { launchDate: '28 أغسطس 2020', category: 'DeFi AMM', description: 'منصة تبادل لامركزية' },
  COMP: { launchDate: '15 يونيو 2020', category: 'DeFi Lending', description: 'بروتوكول إقراض Compound' },
  SNX: { launchDate: '7 مارس 2018', category: 'DeFi Derivatives', description: 'أصول اصطناعية لامركزية' },
  BAL: { launchDate: '23 يونيو 2020', category: 'DeFi AMM', description: 'مجمعات سيولة مرنة' },
  DYDX: { launchDate: '8 سبتمبر 2021', category: 'DeFi DEX', description: 'تداول مشتقات لامركزي' },
  GRT: { launchDate: '17 ديسمبر 2020', category: 'Data Indexing', description: 'فهرسة بيانات البلوكتشين' },
  '1INCH': { launchDate: '25 ديسمبر 2020', category: 'DeFi Aggregator', description: 'مجمع DEX للأسعار الأفضل' },
  CAKE: { launchDate: '20 سبتمبر 2020', category: 'DeFi AMM', description: 'أكبر DEX على BNB Chain' },
  GMX: { launchDate: '1 سبتمبر 2021', category: 'DeFi Derivatives', description: 'تداول Perpetual لامركزي' },
  PENDLE: { launchDate: '28 أبريل 2021', category: 'DeFi Yield', description: 'تداول عوائد المستقبل' },
  RPL: { launchDate: '18 نوفمبر 2021', category: 'Liquid Staking', description: 'Staking لامركزي لإيثريوم' },
  EIGEN: { launchDate: '1 أكتوبر 2024', category: 'Restaking', description: 'إعادة تخزين إيثريوم' },
  
  // Layer 1
  TRX: { launchDate: '28 أغسطس 2017', category: 'Layer 1', description: 'شبكة ترفيه لامركزية' },
  TON: { launchDate: '28 يوليو 2021', category: 'Layer 1', description: 'بلوكتشين Telegram' },
  ETC: { launchDate: '20 يوليو 2016', category: 'Layer 1', description: 'إيثريوم الأصلي' },
  BCH: { launchDate: '1 أغسطس 2017', category: 'Layer 1', description: 'فورك بيتكوين للمدفوعات' },
  FIL: { launchDate: '15 أكتوبر 2020', category: 'Storage', description: 'تخزين لامركزي للملفات' },
  ICP: { launchDate: '10 مايو 2021', category: 'Layer 1', description: 'حاسوب الإنترنت العالمي' },
  HBAR: { launchDate: '16 سبتمبر 2019', category: 'Layer 1 DAG', description: 'شبكة هاشغراف للمؤسسات' },
  VET: { launchDate: '29 أغسطس 2017', category: 'Supply Chain', description: 'تتبع سلسلة التوريد' },
  XLM: { launchDate: '4 أغسطس 2014', category: 'Payment', description: 'مدفوعات عابرة للحدود' },
  ALGO: { launchDate: '20 يونيو 2019', category: 'Layer 1', description: 'بلوكتشين Pure PoS' },
  EOS: { launchDate: '1 يونيو 2017', category: 'Layer 1', description: 'منصة dApps قابلة للتوسع' },
  FLOW: { launchDate: '1 يناير 2021', category: 'Layer 1', description: 'بلوكتشين NFT و الألعاب' },
  MINA: { launchDate: '31 مارس 2021', category: 'Layer 1 ZK', description: 'أخف بلوكتشين في العالم' },
  KAS: { launchDate: '7 نوفمبر 2021', category: 'Layer 1', description: 'أسرع PoW مع BlockDAG' },
  INJ: { launchDate: '27 أكتوبر 2020', category: 'DeFi Layer 1', description: 'بلوكتشين للتمويل اللامركزي' },
  SEI: { launchDate: '15 أغسطس 2023', category: 'Layer 1', description: 'أسرع Layer 1 للتداول' },
  SUI: { launchDate: '3 مايو 2023', category: 'Layer 1', description: 'بلوكتشين من فريق Meta' },
  APT: { launchDate: '12 أكتوبر 2022', category: 'Layer 1', description: 'بلوكتشين Move من Diem' },
  TIA: { launchDate: '31 أكتوبر 2023', category: 'Data Availability', description: 'طبقة بيانات معيارية' },
  KAVA: { launchDate: '15 أكتوبر 2019', category: 'Layer 1 DeFi', description: 'DeFi متعدد السلاسل' },
  ROSE: { launchDate: '19 نوفمبر 2020', category: 'Privacy Layer 1', description: 'حوسبة خاصة وآمنة' },
  ONE: { launchDate: '1 يونيو 2019', category: 'Layer 1', description: 'بلوكتشين سريع وقابل للتوسع' },
  FTM: { launchDate: '29 أكتوبر 2018', category: 'Layer 1', description: 'DAG عالي الأداء' },
  CELO: { launchDate: '22 أبريل 2020', category: 'Mobile Layer 1', description: 'بلوكتشين للهاتف المحمول' },
  ZIL: { launchDate: '25 يناير 2018', category: 'Layer 1', description: 'أول بلوكتشين Sharding' },
  EGLD: { launchDate: '4 يوليو 2019', category: 'Layer 1', description: 'بلوكتشين فائق القابلية للتوسع' },
  XTZ: { launchDate: '30 يونيو 2018', category: 'Layer 1', description: 'بلوكتشين ذاتي التعديل' },
  NEO: { launchDate: '22 يونيو 2014', category: 'Layer 1', description: 'إيثريوم الصين' },
  ZEC: { launchDate: '28 أكتوبر 2016', category: 'Privacy', description: 'عملة خصوصية متقدمة' },
  DASH: { launchDate: '18 يناير 2014', category: 'Privacy', description: 'عملة نقدية رقمية سريعة' },
  XMR: { launchDate: '18 أبريل 2014', category: 'Privacy', description: 'أقوى عملة خصوصية' },
  
  // Layer 2 & Scaling
  STRK: { launchDate: '20 فبراير 2024', category: 'Layer 2 ZK', description: 'StarkNet ZK Rollup' },
  ZK: { launchDate: '17 يونيو 2024', category: 'Layer 2 ZK', description: 'zkSync Era للإيثريوم' },
  METIS: { launchDate: '18 نوفمبر 2021', category: 'Layer 2', description: 'Layer 2 للشركات' },
  LRC: { launchDate: '10 ديسمبر 2017', category: 'Layer 2 ZK', description: 'بروتوكول ZK Rollup' },
  CELR: { launchDate: '25 مارس 2019', category: 'Layer 2', description: 'شبكة توسعة Layer 2' },
  SKL: { launchDate: '1 ديسمبر 2020', category: 'Layer 2', description: 'شبكة Elastic Sidechains' },
  CTSI: { launchDate: '3 مايو 2020', category: 'Layer 2', description: 'حوسبة خارج السلسلة' },
  
  // AI & Data
  FET: { launchDate: '25 فبراير 2019', category: 'AI', description: 'وكلاء ذكاء اصطناعي مستقلون' },
  AGIX: { launchDate: '18 ديسمبر 2017', category: 'AI', description: 'سوق خدمات AI لامركزي' },
  OCEAN: { launchDate: '7 مايو 2019', category: 'AI/Data', description: 'سوق بيانات لامركزي' },
  RNDR: { launchDate: '1 أبريل 2020', category: 'AI/GPU', description: 'شبكة معالجة GPU موزعة' },
  THETA: { launchDate: '12 يناير 2018', category: 'Video Streaming', description: 'بث فيديو لامركزي' },
  AR: { launchDate: '8 يونيو 2018', category: 'Storage', description: 'تخزين دائم للبيانات' },
  ARKM: { launchDate: '18 يوليو 2023', category: 'AI Analytics', description: 'تحليلات بلوكتشين بالذكاء الاصطناعي' },
  WLD: { launchDate: '24 يوليو 2023', category: 'AI/Identity', description: 'هوية رقمية عالمية' },
  TAO: { launchDate: '3 يناير 2021', category: 'AI', description: 'شبكة تعلم آلي لامركزية' },
  ONDO: { launchDate: '18 يناير 2024', category: 'RWA', description: 'أصول حقيقية على البلوكتشين' },
  
  // Exchange Tokens
  OKB: { launchDate: '4 مارس 2019', category: 'Exchange Token', description: 'عملة منصة OKX' },
  CRO: { launchDate: '14 ديسمبر 2018', category: 'Exchange Token', description: 'عملة Crypto.com' },
  KCS: { launchDate: '2 نوفمبر 2017', category: 'Exchange Token', description: 'عملة منصة KuCoin' },
  WOO: { launchDate: '30 أكتوبر 2020', category: 'Exchange/DeFi', description: 'شبكة سيولة للتداول' },
  
  // Infrastructure
  QNT: { launchDate: '28 يونيو 2018', category: 'Interoperability', description: 'ربط البلوكتشينات للمؤسسات' },
  BAND: { launchDate: '18 سبتمبر 2019', category: 'Oracle', description: 'أوراكل عبر السلاسل' },
  API3: { launchDate: '30 نوفمبر 2020', category: 'Oracle', description: 'أوراكل من الطرف الأول' },
  ANKR: { launchDate: '7 مارس 2019', category: 'Infrastructure', description: 'بنية تحتية Web3 موزعة' },
  STORJ: { launchDate: '2 يوليو 2017', category: 'Storage', description: 'تخزين سحابي لامركزي' },
  GLM: { launchDate: '10 نوفمبر 2016', category: 'Computing', description: 'حوسبة موزعة' },
  COTI: { launchDate: '3 يونيو 2019', category: 'Payment', description: 'مدفوعات للمؤسسات' },
  ACH: { launchDate: '22 يوليو 2020', category: 'Payment', description: 'بوابة دفع كريبتو' },
  CHZ: { launchDate: '22 أكتوبر 2019', category: 'Fan Tokens', description: 'توكنات المشجعين الرياضية' },
  AUDIO: { launchDate: '20 أكتوبر 2020', category: 'Music', description: 'بث موسيقى لامركزي' },
  MASK: { launchDate: '24 فبراير 2021', category: 'Social', description: 'جسر Web3 لوسائل التواصل' },
  
  // Stablecoins
  DAI: { launchDate: '18 ديسمبر 2017', category: 'Stablecoin', description: 'عملة مستقرة لامركزية' },
  TUSD: { launchDate: '4 مارس 2018', category: 'Stablecoin', description: 'دولار حقيقي مدعوم' },
  FDUSD: { launchDate: '26 يوليو 2023', category: 'Stablecoin', description: 'عملة مستقرة من First Digital' },
  FRAX: { launchDate: '21 ديسمبر 2020', category: 'Stablecoin', description: 'عملة مستقرة خوارزمية' },
  
  // Others Popular
  JASMY: { launchDate: '26 يناير 2021', category: 'IoT', description: 'إنترنت الأشياء الياباني' },
  IOTA: { launchDate: '13 يونيو 2017', category: 'IoT', description: 'شبكة DAG لإنترنت الأشياء' },
  CFX: { launchDate: '29 أكتوبر 2020', category: 'Layer 1', description: 'بلوكتشين صيني عام' },
  BLUR: { launchDate: '14 فبراير 2023', category: 'NFT Marketplace', description: 'سوق NFT للمحترفين' },
  ID: { launchDate: '22 مارس 2023', category: 'Identity', description: 'نطاقات Web3' },
  CYBER: { launchDate: '15 أغسطس 2023', category: 'Social', description: 'شبكة اجتماعية Web3' },
  JUP: { launchDate: '31 يناير 2024', category: 'DeFi Aggregator', description: 'مجمع DEX على Solana' },
  PYTH: { launchDate: '20 نوفمبر 2023', category: 'Oracle', description: 'أوراكل بيانات مالية' },
  JTO: { launchDate: '7 ديسمبر 2023', category: 'Liquid Staking', description: 'Staking سائل على Solana' },
  DYM: { launchDate: '6 فبراير 2024', category: 'Modular Blockchain', description: 'بلوكتشين معياري' },
  MANTA: { launchDate: '18 يناير 2024', category: 'Layer 2 ZK', description: 'Layer 2 للخصوصية' },
  ORDI: { launchDate: '8 مارس 2023', category: 'BRC-20', description: 'أول توكن BRC-20 على بيتكوين' },
  LUNC: { launchDate: '24 أبريل 2019', category: 'Layer 1', description: 'Terra الكلاسيكية' },
  LUNA: { launchDate: '28 مايو 2022', category: 'Layer 1', description: 'Terra 2.0 الجديدة' },
  NEXO: { launchDate: '1 أبريل 2018', category: 'CeFi', description: 'منصة إقراض مركزية' },
  RSR: { launchDate: '22 مايو 2019', category: 'Stablecoin Protocol', description: 'بروتوكول عملات مستقرة' },
  PAXG: { launchDate: '26 سبتمبر 2019', category: 'Gold Backed', description: 'ذهب حقيقي على البلوكتشين' },
  BTT: { launchDate: '30 يناير 2019', category: 'Storage/Torrent', description: 'تحفيز شبكة BitTorrent' },
  TWT: { launchDate: '18 نوفمبر 2019', category: 'Wallet Token', description: 'توكن محفظة Trust' },
  LQTY: { launchDate: '5 أبريل 2021', category: 'DeFi Lending', description: 'إقراض بدون فوائد' },
  HOOK: { launchDate: '1 ديسمبر 2022', category: 'Education', description: 'تعليم Web3 تفاعلي' },
  HIGH: { launchDate: '11 أكتوبر 2021', category: 'Metaverse', description: 'ميتافيرس تجاري' },
  PERP: { launchDate: '14 سبتمبر 2020', category: 'DeFi Derivatives', description: 'عقود دائمة لامركزية' },
  DODO: { launchDate: '29 سبتمبر 2020', category: 'DeFi AMM', description: 'خوارزمية PMM للسيولة' },
  BADGER: { launchDate: '3 ديسمبر 2020', category: 'DeFi', description: 'DeFi لحاملي بيتكوين' },
  SPELL: { launchDate: '30 مايو 2021', category: 'DeFi Lending', description: 'إقراض عملات مستقرة' },
  CVX: { launchDate: '17 مايو 2021', category: 'DeFi', description: 'تعزيز عوائد Curve' },
  FXS: { launchDate: '21 ديسمبر 2020', category: 'DeFi', description: 'حوكمة FRAX' },
  STG: { launchDate: '17 مارس 2022', category: 'Bridge', description: 'جسر Omnichain' },
  ALT: { launchDate: '25 يناير 2024', category: 'Layer 2', description: 'Rollups كخدمة' },
  XAI: { launchDate: '9 يناير 2024', category: 'Gaming Layer 3', description: 'Layer 3 للألعاب على Arbitrum' },
};

/**
 * تحويل التاريخ إلى العربية
 */
const formatDateToArabic = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * جلب بيانات من CryptoCompare API (مصدر بديل)
 */
const fetchFromCryptoCompare = async (symbol: string): Promise<{ launchDate: string | null; category: string | null }> => {
  try {
    console.log(`🔍 CryptoCompare: Searching for ${symbol}...`);
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=1&allData=true`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.Data && data.Data.Data && data.Data.Data.length > 0) {
        // أول تاريخ تداول للعملة
        const firstDataPoint = data.Data.Data[0];
        if (firstDataPoint.time) {
          const launchDate = formatDateToArabic(new Date(firstDataPoint.time * 1000).toISOString().split('T')[0]);
          console.log(`✅ CryptoCompare found launch date for ${symbol}: ${launchDate}`);
          return { launchDate, category: null };
        }
      }
    }
  } catch (error) {
    console.warn(`❌ CryptoCompare error for ${symbol}:`, error);
  }
  return { launchDate: null, category: null };
};

/**
 * تحسين البحث في CoinGecko بمحاولات متعددة
 */
const searchCoinGeckoId = async (symbol: string): Promise<string | null> => {
  const variations = [
    symbol.toLowerCase(),
    symbol.toUpperCase(),
    symbol.toLowerCase().replace(/usdt$|busd$|btc$/i, ''),
  ];
  
  for (const query of variations) {
    try {
      const searchResponse = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${query}`
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.coins && searchData.coins.length > 0) {
          // البحث عن تطابق دقيق أولاً
          const exactMatch = searchData.coins.find(
            (c: any) => c.symbol?.toUpperCase() === symbol.toUpperCase()
          );
          if (exactMatch) {
            console.log(`✅ CoinGecko exact match for ${symbol}: ${exactMatch.id}`);
            return exactMatch.id;
          }
          // أو أول نتيجة
          console.log(`✅ CoinGecko first match for ${symbol}: ${searchData.coins[0].id}`);
          return searchData.coins[0].id;
        }
      }
    } catch (error) {
      console.warn(`CoinGecko search variation error:`, error);
    }
    // تأخير بين المحاولات لتجنب rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
};

/**
 * جلب بيانات العملة (تاريخ الإطلاق والفئة والوصف) من مصادر متعددة
 * ترتيب الأولوية: Fallback → CoinGecko → CryptoCompare → Binance
 */
export const useCoinMetadata = (symbol: string): CoinMetadata => {
  const [metadata, setMetadata] = useState<CoinMetadata>({
    launchDate: null,
    category: null,
    description: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      setMetadata({ launchDate: null, category: null, description: null, loading: true, error: null });

      try {
        const upperSymbol = symbol.toUpperCase();
        
        console.log(`🚀 Starting fetch for ${upperSymbol}...`);
        
        // 1️⃣ الأولوية الأولى: استخدام بيانات Fallback المحلية (أسرع وأدق)
        if (FALLBACK_COIN_DATA[upperSymbol]) {
          const fallbackData = FALLBACK_COIN_DATA[upperSymbol];
          console.log(`📦 Using local fallback data for ${upperSymbol}:`, fallbackData);
          setMetadata({
            launchDate: fallbackData.launchDate,
            category: fallbackData.category,
            description: fallbackData.description,
            loading: false,
            error: null,
          });
          return;
        }
        
        // 2️⃣ الأولوية الثانية: CoinGecko API
        let coinGeckoId = SYMBOL_TO_COINGECKO_ID[upperSymbol];
        
        // إذا لم نجد ID في الخريطة، نحاول البحث
        if (!coinGeckoId) {
          console.log(`🔍 ID not found in map, searching CoinGecko for ${upperSymbol}...`);
          coinGeckoId = await searchCoinGeckoId(upperSymbol);
        }
        
        // محاولة جلب البيانات من CoinGecko
        if (coinGeckoId) {
          try {
            console.log(`📡 Fetching from CoinGecko: ${coinGeckoId}`);
            const response = await fetch(
              `https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false&community_data=false&developer_data=false`
            );

            if (response.ok) {
              const data = await response.json();
              
              // جلب البيانات الأساسية
              let launchDate = data.genesis_date ? formatDateToArabic(data.genesis_date) : null;
              let category = data.categories?.[0] || null;
              // استخراج وصف مختصر من CoinGecko
              let description = data.description?.en 
                ? data.description.en.split('.')[0].substring(0, 100) 
                : null;

              console.log(`📊 CoinGecko response for ${upperSymbol}:`, { 
                genesis_date: data.genesis_date, 
                categories: data.categories,
              });

              // إذا لم نجد genesis_date، نستخدم market_data.atl_date
              if (!launchDate && data.market_data?.atl_date?.usd) {
                launchDate = formatDateToArabic(data.market_data.atl_date.usd.split('T')[0]);
                console.log(`📅 Using ATL date: ${launchDate}`);
              }

              // إذا حصلنا على بيانات
              if (launchDate || category) {
                console.log(`✅ CoinGecko success for ${upperSymbol}:`, { launchDate, category });
                setMetadata({
                  launchDate,
                  category,
                  description,
                  loading: false,
                  error: null,
                });
                return;
              }
            } else {
              console.warn(`❌ CoinGecko returned status: ${response.status}`);
            }
          } catch (coinGeckoError) {
            console.warn(`❌ CoinGecko API error for ${symbol}:`, coinGeckoError);
          }
        }

        // 3️⃣ الأولوية الثالثة: CryptoCompare API
        const cryptoCompareData = await fetchFromCryptoCompare(upperSymbol);
        if (cryptoCompareData.launchDate) {
          setMetadata({
            launchDate: cryptoCompareData.launchDate,
            category: cryptoCompareData.category || 'Cryptocurrency',
            description: null,
            loading: false,
            error: null,
          });
          return;
        }

        // 4️⃣ الأولوية الرابعة: Binance API (للتحقق من وجود العملة فقط)
        try {
          console.log(`📡 Trying Binance API for ${upperSymbol}USDT`);
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${upperSymbol}USDT`
          );

          if (response.ok) {
            console.log(`✅ Binance API found ${upperSymbol}`);
            setMetadata({
              launchDate: null,
              category: 'متوفرة على Binance',
              description: null,
              loading: false,
              error: null,
            });
            return;
          }
        } catch (binanceError) {
          console.warn(`❌ Binance API error for ${symbol}:`, binanceError);
        }

        // إذا فشلت جميع المحاولات
        console.warn(`⚠️ No data found for ${upperSymbol}`);
        setMetadata({
          launchDate: null,
          category: null,
          description: null,
          loading: false,
          error: 'غير متوفر',
        });
      } catch (error) {
        console.error(`❌ Fatal error fetching metadata for ${symbol}:`, error);
        setMetadata({
          launchDate: null,
          category: null,
          description: null,
          loading: false,
          error: 'خطأ في جلب البيانات',
        });
      }
    };

    if (symbol) {
      fetchMetadata();
    }
  }, [symbol]);

  return metadata;
};
