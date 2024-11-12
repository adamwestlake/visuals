<script type="module">
        import { drawChart } from './correlationvis.js';

        const fetchPrices = async () => {
            const ethResponse = await fetch('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=30');
            const uniResponse = await fetch('https://api.coingecko.com/api/v3/coins/uniswap/market_chart?vs_currency=usd&days=30');
            
            const ethData = await ethResponse.json();
            const uniData = await uniResponse.json();
            
            return { ethData, uniData };
        };

        fetchPrices().then(({ ethData, uniData }) => {
            drawChart(ethData.prices, uniData.prices);
        }).catch(error => console.error('Error fetching data:', error));


    </script>