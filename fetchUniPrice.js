import fetch from 'node-fetch';

const fetchPrices = async (tokenId) => {
    const days = 100; // Last 100 days
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.prices; // Returns the prices array

    } catch (error) {
        console.error(`Error fetching ${tokenId} prices:`, error);
        return [];
    }
};

const fetchPricesForBothTokens = async () => {
    const uniswapPrices = await fetchPrices('uniswap');
    const ethPrices = await fetchPrices('ethereum');

    // Log Uniswap prices
    console.log('Uniswap Prices:');
    uniswapPrices.forEach(priceData => {
        const timestamp = new Date(priceData[0]);
        const price = priceData[1];
        console.log(`Date: ${timestamp.toISOString().split('T')[0]}, Price: $${price}`);
    });

    // Log Ethereum prices
    console.log('\nEthereum Prices:');
    ethPrices.forEach(priceData => {
        const timestamp = new Date(priceData[0]);
        const price = priceData[1];
        console.log(`Date: ${timestamp.toISOString().split('T')[0]}, Price: $${price}`);
    });
};

fetchPricesForBothTokens();
