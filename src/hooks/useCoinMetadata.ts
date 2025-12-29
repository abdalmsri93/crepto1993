import { useState, useEffect } from 'react';

export interface CoinMetadata {
  launchDate: string | null;
  category: string | null;
  loading: boolean;
  error: string | null;
}

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
const FALLBACK_COIN_DATA: Record<string, { launchDate: string; category: string }> = {
  // العملات الرئيسية
  BTC: { launchDate: '3 يناير 2009', category: 'Layer 1' },
  ETH: { launchDate: '30 يوليو 2015', category: 'Layer 1 Smart Contracts' },
  BNB: { launchDate: '25 يونيو 2017', category: 'Exchange Token' },
  SOL: { launchDate: '10 مارس 2020', category: 'Layer 1' },
  USDT: { launchDate: '6 أكتوبر 2014', category: 'Stablecoin' },
  USDC: { launchDate: '26 سبتمبر 2018', category: 'Stablecoin' },
  ADA: { launchDate: '29 سبتمبر 2017', category: 'Layer 1' },
  DOGE: { launchDate: '6 ديسمبر 2013', category: 'Memecoin' },
  XRP: { launchDate: '2 فبراير 2013', category: 'Payment Protocol' },
  LTC: { launchDate: '7 أكتوبر 2011', category: 'Layer 1' },
  MATIC: { launchDate: '26 أبريل 2019', category: 'Layer 2' },
  LINK: { launchDate: '19 سبتمبر 2017', category: 'Oracle' },
  UNI: { launchDate: '17 سبتمبر 2020', category: 'DeFi' },
  AVAX: { launchDate: '21 سبتمبر 2020', category: 'Layer 1' },
  DOT: { launchDate: '18 أغسطس 2020', category: 'Interoperability' },
  ATOM: { launchDate: '13 مارس 2019', category: 'Interoperability' },
  NEAR: { launchDate: '22 أبريل 2020', category: 'Layer 1' },
  ARB: { launchDate: '23 مارس 2023', category: 'Layer 2' },
  OP: { launchDate: '31 مايو 2022', category: 'Layer 2' },
  POL: { launchDate: '26 أبريل 2019', category: 'Scaling' },
  
  // Memecoins
  PEPE: { launchDate: '14 أبريل 2023', category: 'Memecoin' },
  SHIB: { launchDate: '3 أغسطس 2020', category: 'Memecoin' },
  APE: { launchDate: '17 مارس 2022', category: 'Gaming/NFT' },
  FLOKI: { launchDate: '28 يونيو 2021', category: 'Memecoin' },
  WIF: { launchDate: '20 ديسمبر 2023', category: 'Memecoin' },
  BONK: { launchDate: '25 ديسمبر 2022', category: 'Memecoin' },
  MEME: { launchDate: '28 أكتوبر 2023', category: 'Memecoin' },
  BABYDOGE: { launchDate: '1 يونيو 2021', category: 'Memecoin' },
  ELON: { launchDate: '23 أبريل 2021', category: 'Memecoin' },
  TURBO: { launchDate: '29 أبريل 2023', category: 'Memecoin' },
  
  // Gaming & Metaverse
  GALA: { launchDate: '16 سبتمبر 2020', category: 'Gaming' },
  SAND: { launchDate: '14 أغسطس 2020', category: 'Metaverse' },
  MANA: { launchDate: '8 أغسطس 2017', category: 'Metaverse' },
  AXS: { launchDate: '4 نوفمبر 2020', category: 'Gaming' },
  ILV: { launchDate: '30 مارس 2021', category: 'Gaming' },
  IMX: { launchDate: '13 أبريل 2021', category: 'NFT/Gaming' },
  ALICE: { launchDate: '15 مارس 2021', category: 'Gaming' },
  ENJ: { launchDate: '1 نوفمبر 2017', category: 'Gaming/NFT' },
  GMT: { launchDate: '9 مارس 2022', category: 'Gaming/Move2Earn' },
  MAGIC: { launchDate: '10 سبتمبر 2021', category: 'Gaming' },
  SUPER: { launchDate: '22 مارس 2021', category: 'Gaming/NFT' },
  PIXEL: { launchDate: '19 فبراير 2024', category: 'Gaming' },
  PORTAL: { launchDate: '29 فبراير 2024', category: 'Gaming' },
  
  // DeFi
  ENS: { launchDate: '9 نوفمبر 2021', category: 'Infrastructure' },
  LDO: { launchDate: '17 ديسمبر 2020', category: 'Liquid Staking' },
  MKR: { launchDate: '30 نوفمبر 2017', category: 'DeFi' },
  AAVE: { launchDate: '2 أكتوبر 2020', category: 'DeFi Lending' },
  CRV: { launchDate: '13 أغسطس 2020', category: 'DeFi AMM' },
  YFI: { launchDate: '17 يوليو 2020', category: 'DeFi Yield' },
  SUSHI: { launchDate: '28 أغسطس 2020', category: 'DeFi AMM' },
  COMP: { launchDate: '15 يونيو 2020', category: 'DeFi Lending' },
  SNX: { launchDate: '7 مارس 2018', category: 'DeFi Derivatives' },
  BAL: { launchDate: '23 يونيو 2020', category: 'DeFi AMM' },
  DYDX: { launchDate: '8 سبتمبر 2021', category: 'DeFi DEX' },
  GRT: { launchDate: '17 ديسمبر 2020', category: 'Data Indexing' },
  '1INCH': { launchDate: '25 ديسمبر 2020', category: 'DeFi Aggregator' },
  CAKE: { launchDate: '20 سبتمبر 2020', category: 'DeFi AMM' },
  GMX: { launchDate: '1 سبتمبر 2021', category: 'DeFi Derivatives' },
  PENDLE: { launchDate: '28 أبريل 2021', category: 'DeFi Yield' },
  RPL: { launchDate: '18 نوفمبر 2021', category: 'Liquid Staking' },
  EIGEN: { launchDate: '1 أكتوبر 2024', category: 'Restaking' },
  
  // Layer 1
  TRX: { launchDate: '28 أغسطس 2017', category: 'Layer 1' },
  TON: { launchDate: '28 يوليو 2021', category: 'Layer 1' },
  ETC: { launchDate: '20 يوليو 2016', category: 'Layer 1' },
  BCH: { launchDate: '1 أغسطس 2017', category: 'Layer 1' },
  FIL: { launchDate: '15 أكتوبر 2020', category: 'Storage' },
  ICP: { launchDate: '10 مايو 2021', category: 'Layer 1' },
  HBAR: { launchDate: '16 سبتمبر 2019', category: 'Layer 1 DAG' },
  VET: { launchDate: '29 أغسطس 2017', category: 'Supply Chain' },
  XLM: { launchDate: '4 أغسطس 2014', category: 'Payment' },
  ALGO: { launchDate: '20 يونيو 2019', category: 'Layer 1' },
  EOS: { launchDate: '1 يونيو 2017', category: 'Layer 1' },
  FLOW: { launchDate: '1 يناير 2021', category: 'Layer 1' },
  MINA: { launchDate: '31 مارس 2021', category: 'Layer 1 ZK' },
  KAS: { launchDate: '7 نوفمبر 2021', category: 'Layer 1' },
  INJ: { launchDate: '27 أكتوبر 2020', category: 'DeFi Layer 1' },
  SEI: { launchDate: '15 أغسطس 2023', category: 'Layer 1' },
  SUI: { launchDate: '3 مايو 2023', category: 'Layer 1' },
  APT: { launchDate: '12 أكتوبر 2022', category: 'Layer 1' },
  TIA: { launchDate: '31 أكتوبر 2023', category: 'Data Availability' },
  KAVA: { launchDate: '15 أكتوبر 2019', category: 'Layer 1 DeFi' },
  ROSE: { launchDate: '19 نوفمبر 2020', category: 'Privacy Layer 1' },
  ONE: { launchDate: '1 يونيو 2019', category: 'Layer 1' },
  FTM: { launchDate: '29 أكتوبر 2018', category: 'Layer 1' },
  CELO: { launchDate: '22 أبريل 2020', category: 'Mobile Layer 1' },
  ZIL: { launchDate: '25 يناير 2018', category: 'Layer 1' },
  EGLD: { launchDate: '4 يوليو 2019', category: 'Layer 1' },
  XTZ: { launchDate: '30 يونيو 2018', category: 'Layer 1' },
  NEO: { launchDate: '22 يونيو 2014', category: 'Layer 1' },
  ZEC: { launchDate: '28 أكتوبر 2016', category: 'Privacy' },
  DASH: { launchDate: '18 يناير 2014', category: 'Privacy' },
  XMR: { launchDate: '18 أبريل 2014', category: 'Privacy' },
  
  // Layer 2 & Scaling
  STRK: { launchDate: '20 فبراير 2024', category: 'Layer 2 ZK' },
  ZK: { launchDate: '17 يونيو 2024', category: 'Layer 2 ZK' },
  METIS: { launchDate: '18 نوفمبر 2021', category: 'Layer 2' },
  LRC: { launchDate: '10 ديسمبر 2017', category: 'Layer 2 ZK' },
  CELR: { launchDate: '25 مارس 2019', category: 'Layer 2' },
  SKL: { launchDate: '1 ديسمبر 2020', category: 'Layer 2' },
  CTSI: { launchDate: '3 مايو 2020', category: 'Layer 2' },
  
  // AI & Data
  FET: { launchDate: '25 فبراير 2019', category: 'AI' },
  AGIX: { launchDate: '18 ديسمبر 2017', category: 'AI' },
  OCEAN: { launchDate: '7 مايو 2019', category: 'AI/Data' },
  RNDR: { launchDate: '1 أبريل 2020', category: 'AI/GPU' },
  THETA: { launchDate: '12 يناير 2018', category: 'Video Streaming' },
  AR: { launchDate: '8 يونيو 2018', category: 'Storage' },
  ARKM: { launchDate: '18 يوليو 2023', category: 'AI Analytics' },
  WLD: { launchDate: '24 يوليو 2023', category: 'AI/Identity' },
  TAO: { launchDate: '3 يناير 2021', category: 'AI' },
  ONDO: { launchDate: '18 يناير 2024', category: 'RWA' },
  
  // Exchange Tokens
  OKB: { launchDate: '4 مارس 2019', category: 'Exchange Token' },
  CRO: { launchDate: '14 ديسمبر 2018', category: 'Exchange Token' },
  KCS: { launchDate: '2 نوفمبر 2017', category: 'Exchange Token' },
  WOO: { launchDate: '30 أكتوبر 2020', category: 'Exchange/DeFi' },
  
  // Infrastructure
  QNT: { launchDate: '28 يونيو 2018', category: 'Interoperability' },
  BAND: { launchDate: '18 سبتمبر 2019', category: 'Oracle' },
  API3: { launchDate: '30 نوفمبر 2020', category: 'Oracle' },
  ANKR: { launchDate: '7 مارس 2019', category: 'Infrastructure' },
  STORJ: { launchDate: '2 يوليو 2017', category: 'Storage' },
  GLM: { launchDate: '10 نوفمبر 2016', category: 'Computing' },
  COTI: { launchDate: '3 يونيو 2019', category: 'Payment' },
  ACH: { launchDate: '22 يوليو 2020', category: 'Payment' },
  CHZ: { launchDate: '22 أكتوبر 2019', category: 'Fan Tokens' },
  AUDIO: { launchDate: '20 أكتوبر 2020', category: 'Music' },
  MASK: { launchDate: '24 فبراير 2021', category: 'Social' },
  
  // Stablecoins
  DAI: { launchDate: '18 ديسمبر 2017', category: 'Stablecoin' },
  TUSD: { launchDate: '4 مارس 2018', category: 'Stablecoin' },
  FDUSD: { launchDate: '26 يوليو 2023', category: 'Stablecoin' },
  FRAX: { launchDate: '21 ديسمبر 2020', category: 'Stablecoin' },
  
  // Others Popular
  JASMY: { launchDate: '26 يناير 2021', category: 'IoT' },
  IOTA: { launchDate: '13 يونيو 2017', category: 'IoT' },
  CFX: { launchDate: '29 أكتوبر 2020', category: 'Layer 1' },
  BLUR: { launchDate: '14 فبراير 2023', category: 'NFT Marketplace' },
  ID: { launchDate: '22 مارس 2023', category: 'Identity' },
  CYBER: { launchDate: '15 أغسطس 2023', category: 'Social' },
  JUP: { launchDate: '31 يناير 2024', category: 'DeFi Aggregator' },
  PYTH: { launchDate: '20 نوفمبر 2023', category: 'Oracle' },
  JTO: { launchDate: '7 ديسمبر 2023', category: 'Liquid Staking' },
  DYM: { launchDate: '6 فبراير 2024', category: 'Modular Blockchain' },
  MANTA: { launchDate: '18 يناير 2024', category: 'Layer 2 ZK' },
  ORDI: { launchDate: '8 مارس 2023', category: 'BRC-20' },
  LUNC: { launchDate: '24 أبريل 2019', category: 'Layer 1' },
  LUNA: { launchDate: '28 مايو 2022', category: 'Layer 1' },
  NEXO: { launchDate: '1 أبريل 2018', category: 'CeFi' },
  RSR: { launchDate: '22 مايو 2019', category: 'Stablecoin Protocol' },
  PAXG: { launchDate: '26 سبتمبر 2019', category: 'Gold Backed' },
  BTT: { launchDate: '30 يناير 2019', category: 'Storage/Torrent' },
  TWT: { launchDate: '18 نوفمبر 2019', category: 'Wallet Token' },
  LQTY: { launchDate: '5 أبريل 2021', category: 'DeFi Lending' },
  HOOK: { launchDate: '1 ديسمبر 2022', category: 'Education' },
  HIGH: { launchDate: '11 أكتوبر 2021', category: 'Metaverse' },
  PERP: { launchDate: '14 سبتمبر 2020', category: 'DeFi Derivatives' },
  DODO: { launchDate: '29 سبتمبر 2020', category: 'DeFi AMM' },
  BADGER: { launchDate: '3 ديسمبر 2020', category: 'DeFi' },
  SPELL: { launchDate: '30 مايو 2021', category: 'DeFi Lending' },
  CVX: { launchDate: '17 مايو 2021', category: 'DeFi' },
  FXS: { launchDate: '21 ديسمبر 2020', category: 'DeFi' },
  STG: { launchDate: '17 مارس 2022', category: 'Bridge' },
  ALT: { launchDate: '25 يناير 2024', category: 'Layer 2' },
  XAI: { launchDate: '9 يناير 2024', category: 'Gaming Layer 3' },
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
 * جلب بيانات العملة (تاريخ الإطلاق والفئة) من مصادر متعددة
 * ترتيب الأولوية: Fallback → CoinGecko → CryptoCompare → Binance
 */
export const useCoinMetadata = (symbol: string): CoinMetadata => {
  const [metadata, setMetadata] = useState<CoinMetadata>({
    launchDate: null,
    category: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      setMetadata({ launchDate: null, category: null, loading: true, error: null });

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
          loading: false,
          error: 'غير متوفر',
        });
      } catch (error) {
        console.error(`❌ Fatal error fetching metadata for ${symbol}:`, error);
        setMetadata({
          launchDate: null,
          category: null,
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
