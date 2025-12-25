import { useState, useEffect } from 'react';

export interface CoinMetadata {
  launchDate: string | null;
  category: string | null;
  loading: boolean;
  error: string | null;
}

// خريطة لربط رموز Binance برموز CoinGecko
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
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
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
  APE: 'apecoin',
  GALA: 'gala',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  ENS: 'ethereum-name-service',
  LDO: 'lido-dao',
  MKR: 'maker',
  AAVE: 'aave',
  CRV: 'curve-dao-token',
  YFI: 'yearn-finance',
  SUSHI: 'sushi',
  COMP: 'compound',
};

// بيانات fallback معروفة للعملات الرئيسية
const FALLBACK_COIN_DATA: Record<string, { launchDate: string; category: string }> = {
  BTC: { launchDate: '3 يناير 2009', category: 'Layer 1' },
  ETH: { launchDate: '30 يوليو 2015', category: 'Layer 1 Smart Contracts' },
  BNB: { launchDate: '25 يونيو 2017', category: 'Exchange Token' },
  SOL: { launchDate: '10 مارس 2020', category: 'Layer 1' },
  USDT: { launchDate: '6 أكتوبر 2014', category: 'Stablecoin' },
  USDC: { launchDate: '26 سبتمبر 2018', category: 'Stablecoin' },
  ADA: { launchDate: '29 سبتمبر 2015', category: 'Layer 1' },
  DOGE: { launchDate: '6 ديسمبر 2013', category: 'Memecoin' },
  XRP: { launchDate: '24 يناير 2012', category: 'Payment Protocol' },
  LTC: { launchDate: '7 أكتوبر 2011', category: 'Layer 1' },
  MATIC: { launchDate: '28 يوليو 2017', category: 'Layer 2' },
  LINK: { launchDate: '19 يونيو 2017', category: 'Oracle' },
  UNI: { launchDate: '1 سبتمبر 2020', category: 'DeFi' },
  AVAX: { launchDate: '21 سبتمبر 2020', category: 'Layer 1' },
  DOT: { launchDate: '26 مايو 2020', category: 'Interoperability' },
  ATOM: { launchDate: '13 أبريل 2019', category: 'Interoperability' },
  NEAR: { launchDate: '22 سبتمبر 2020', category: 'Layer 1' },
  ARB: { launchDate: '16 مارس 2021', category: 'Layer 2' },
  OP: { launchDate: '12 يونيو 2021', category: 'Layer 2' },
  POL: { launchDate: '28 يوليو 2017', category: 'Scaling' },
};

/**
 * جلب بيانات العملة (تاريخ الإطلاق والفئة) من CoinGecko و Binance
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
        
        // محاولة جلب من CoinGecko
        let coinGeckoId = SYMBOL_TO_COINGECKO_ID[upperSymbol];
        
        // إذا لم نجد ID، نحاول البحث عن العملة في CoinGecko
        if (!coinGeckoId) {
          console.log(`🔍 ID not found in map, searching CoinGecko for ${upperSymbol}...`);
          try {
            const searchResponse = await fetch(
              `https://api.coingecko.com/api/v3/search?query=${symbol}`
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.coins && searchData.coins.length > 0) {
                coinGeckoId = searchData.coins[0].id;
                console.log(`✅ Found ${upperSymbol} in CoinGecko: ${coinGeckoId}`);
              }
            }
          } catch (searchError) {
            console.warn(`❌ CoinGecko search error for ${symbol}:`, searchError);
          }
        }
        
        // محاولة جلب البيانات من CoinGecko
        if (coinGeckoId) {
          try {
            console.log(`📡 Fetching from CoinGecko: ${coinGeckoId}`);
            const response = await fetch(
              `https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false&community_data=false&developer_data=false`,
              { timeout: 5000 }
            );

            if (response.ok) {
              const data = await response.json();
              
              // جلب البيانات الأساسية
              let launchDate = data.genesis_date || null;
              let category = data.categories?.[0] || null;

              console.log(`📊 Raw CoinGecko response:`, { 
                symbol: upperSymbol,
                genesis_date: data.genesis_date, 
                categories: data.categories,
                market_cap_rank: data.market_cap_rank,
                first_data_at: data.first_data_at
              });

              // إذا لم نجد genesis_date، نحاول first_data_at
              if (!launchDate && data.first_data_at) {
                const date = new Date(data.first_data_at);
                launchDate = date.toLocaleDateString('ar-SA');
                console.log(`📅 Using first_data_at: ${launchDate}`);
              }

              // إذا لم نجد category
              if (!category && data.market_cap_rank) {
                category = `ترتيب: #${data.market_cap_rank}`;
              }

              // إذا حصلنا على أي بيانات من CoinGecko
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

        // استخدام بيانات Fallback إذا توفرت
        if (FALLBACK_COIN_DATA[upperSymbol]) {
          const fallbackData = FALLBACK_COIN_DATA[upperSymbol];
          console.log(`📦 Using fallback data for ${upperSymbol}:`, fallbackData);
          setMetadata({
            launchDate: fallbackData.launchDate,
            category: fallbackData.category,
            loading: false,
            error: null,
          });
          return;
        }

        // المحاولة الثانية: Binance API
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
