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
        
        // المحاولة الأولى: CoinGecko مع ID معروف
        let coinGeckoId = SYMBOL_TO_COINGECKO_ID[upperSymbol];
        
        // إذا لم نجد ID، نحاول البحث عن العملة في CoinGecko
        if (!coinGeckoId) {
          try {
            const searchResponse = await fetch(
              `https://api.coingecko.com/api/v3/search?query=${symbol}`
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.coins && searchData.coins.length > 0) {
                coinGeckoId = searchData.coins[0].id;
                console.log(`🔍 Found ${upperSymbol} in CoinGecko: ${coinGeckoId}`);
              }
            }
          } catch (searchError) {
            console.warn(`❌ CoinGecko search error for ${symbol}:`, searchError);
          }
        }
        
        if (coinGeckoId) {
          try {
            const response = await fetch(
              `https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false&community_data=false&developer_data=false`
            );

            if (response.ok) {
              const data = await response.json();
              
              // جلب البيانات الأساسية
              let launchDate = data.genesis_date || null;
              let category = data.categories?.[0] || null;

              console.log(`📊 CoinGecko raw data for ${upperSymbol}:`, { 
                genesis_date: data.genesis_date, 
                categories: data.categories,
                market_cap_rank: data.market_cap_rank,
                first_data_at: data.first_data_at
              });

              // إذا لم نجد genesis_date، نحاول first_data_at
              if (!launchDate && data.first_data_at) {
                const date = new Date(data.first_data_at);
                launchDate = date.toLocaleDateString('ar-SA');
              }

              // إذا لم نجد category، نستخدم معلومة أخرى
              if (!category && data.market_cap_rank) {
                category = `ترتيب: ${data.market_cap_rank}`;
              }

              // إذا حصلنا على أي بيانات
              if (launchDate || category) {
                console.log(`✅ CoinGecko data for ${upperSymbol}:`, { launchDate, category });
                setMetadata({
                  launchDate,
                  category,
                  loading: false,
                  error: null,
                });
                return;
              }
            }
          } catch (coinGeckoError) {
            console.warn(`❌ CoinGecko API error for ${symbol}:`, coinGeckoError);
          }
        }

        // المحاولة الثانية: Binance API
        try {
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
        console.error(`❌ Error fetching metadata for ${symbol}:`, error);
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
