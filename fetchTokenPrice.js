import fetch from 'node-fetch';

// Replace with the actual token address you want to query
const tokenAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'; // Example: Uniswap V2 Router address
const url = `https://api.geckoterminal.com/api/v2/networks/ethereum/tokens/${tokenAddress}`;

async function fetchTokenPrice() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Extracting the price in USD
    const price = data.price_usd; 
    const liquidity = data.liquidity; 

    console.log(`Token Price: $${price}`);
    console.log(`Liquidity: $${liquidity}`);
  } catch (error) {
    console.error('Error fetching token price:', error);
  }
}

fetchTokenPrice();
