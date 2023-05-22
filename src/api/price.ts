import axios from 'axios';
import {
    PriceChartData,
    PriceHistory,
    PriceStats,
} from 'src/antelope/types';

interface CachedPrice {
    lastFetchTime: number | null,
    lastPrice: number | null,
}

const priceCache: { [tokenId: string]: CachedPrice } = {};

export const getCoingeckoUsdPrice = async (
    tokenId: string,
): Promise<number> => {
    const now = Date.now();

    if (priceCache[tokenId] &&
        priceCache[tokenId].lastFetchTime &&
        now - (priceCache[tokenId].lastFetchTime as number) < 60 * 1000 &&
        priceCache[tokenId].lastPrice !== null
    ) {
        // If less than a minute has passed since the last fetch, return the cached price.
        return priceCache[tokenId].lastPrice as number;
    }

    try {
        const stats: PriceStats = await axios.get(
            getCoingeckoExchangeStatsUrl(tokenId),
        );

        if (stats && stats.status === 200) {
            const price = stats.data[tokenId].usd;
            priceCache[tokenId] = { lastFetchTime: now, lastPrice: price };
            return price;
        } else {
            console.error(`Error: received status code ${stats.status} from Coingecko.`);
            return 0;
        }
    } catch (error) {
        console.error('Error: fetching from Coingecko failed.', error);
        return 0;
    }
};

export const getCoingeckoPriceChartData = async (
    tokenId: string,
): Promise<PriceChartData> => {
    const exchangeStatsUrl = getCoingeckoExchangeStatsUrl(tokenId);
    const priceHistoryUrl = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=USD&days=1&interval=hourly`;

    const [priceStats, priceHistory]: [PriceStats, PriceHistory] =
    await Promise.all([
        axios.get(exchangeStatsUrl),
        axios.get(priceHistoryUrl),
    ]);

    return {
        lastUpdated: priceStats.data[tokenId].last_updated_at,
        tokenPrice: priceStats.data[tokenId].usd,
        dayChange: priceStats.data[tokenId].usd_24h_change,
        dayVolume: priceStats.data[tokenId].usd_24h_vol,
        marketCap: priceStats.data[tokenId].usd_market_cap,
        prices: priceHistory.data.prices,
    };
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getEmptyPriceChartData = async (): Promise<PriceChartData> => ({
    lastUpdated: 0,
    tokenPrice: 0,
    dayChange: 0,
    dayVolume: 0,
    marketCap: 0,
    prices: [],
});

const getCoingeckoExchangeStatsUrl = (tokenId: string): string => `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=USD&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
