// Your API key and subgraph ID should be constants or imported from a config
const apiKey = ""; // Be cautious with API keys
const subgraphId = "";

// Import BigNumber
import BigNumber from 'https://cdn.jsdelivr.net/npm/bignumber.js@9.0.1/bignumber.mjs';
import { PriceLineControl } from '/price-line-control.js';

// Export the function
export async function plotLiquidityChart(poolAddress) {
    try {
        // Define dimensions and margins at top level
        const margin = { top: 20, right: 30, bottom: 100, left: 60 };
        const width = 650 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const poolData = await fetchPoolData(poolAddress);
        if (!poolData || !poolData.sqrtPrice || !poolData.tick || !poolData.token0 || !poolData.token1) {
            console.error('Invalid pool data:', poolData);
            return;
        }
        console.log('poolData:', poolData);

        const price = computePriceFromSqrtPrice(
            poolData.sqrtPrice,
            poolData.token0.decimals,
            poolData.token1.decimals
        );
        console.log('Current Price:', price.toFixed(6));

        const currentTickIdx = parseInt(poolData.tick, 10);
        console.log('Current Tick Index from API:', currentTickIdx);

        const tickStep = 2000;
        const numberOfPoints = 4;
        const dynamicTickRange = tickStep * numberOfPoints;
        
        const tickLower = currentTickIdx - dynamicTickRange;
        const tickUpper = currentTickIdx + dynamicTickRange;
        console.log(`Dynamic tick range: [${tickLower}, ${tickUpper}]`);

        const ticksInRange = await fetchTickDataInRange(poolAddress, tickLower, tickUpper);
        if (ticksInRange.length === 0) {
            console.error("No tick data found within the specified range around the current tick index.");
            return;
        }
        console.log('ticksInRange:', ticksInRange);

        const chartData = prepareChartData(ticksInRange, tickLower, tickUpper);
        if (!chartData || chartData.length === 0) {
            console.error("No chart data prepared:", chartData);
            return;
        }
        console.log('chartData:', chartData);

        // Create scales at top level
        const x = d3.scaleLinear()
            .domain([tickLower, tickUpper])
            .range([0, width]);

        // Initialize price control
        const priceControl = new PriceLineControl({
            initialTickIdx: currentTickIdx,
            tickLower: tickLower,
            tickUpper: tickUpper,
            containerId: 'price-control',
            token0Decimals: poolData.token0.decimals,
            token1Decimals: poolData.token1.decimals,
            token0Symbol: poolData.token0.symbol,
            token1Symbol: poolData.token1.symbol,
            onPriceChange: (newTickIdx) => {
                updatePriceLine(newTickIdx, x, height);  // Pass required parameters
            }
        });

        // Initial chart plotting
        plotLiquidityDistribution(chartData, currentTickIdx, tickLower, tickUpper);

        // Optimized updatePriceLine function
        function updatePriceLine(newTickIdx, x, height) {
            const svg = d3.select('#chart2 svg g');
            
            const priceLine = svg.select('.price-line');
            
            if (priceLine.empty()) {
                svg.append('line')
                    .attr('class', 'price-line')
                    .attr('x1', x(newTickIdx))
                    .attr('x2', x(newTickIdx))
                    .attr('y1', 0)
                    .attr('y2', height)
                    .attr('stroke', 'red')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '4')
                    .attr('stroke-opacity', 1);
            } else {
                priceLine
                    .transition()
                    .duration(50)
                    .attr('x1', x(newTickIdx))
                    .attr('x2', x(newTickIdx));
            }
        }

    } catch (error) {
        console.error('An error occurred while plotting the chart:', error);
    }
}

// Replace the existing plotLiquidityDistribution with this optimized version:
function plotLiquidityDistribution(data, priceTickIdx, tickLower, tickUpper) {
    data.sort((a, b) => a.tickIdx - b.tickIdx);

    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = 650 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Check if SVG exists and create/select accordingly
    let svg = d3.select('#chart2 svg');
    let chartG;
    
    if (svg.empty()) {
        // First time creation
        svg = d3.select('#chart2')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);
            
        chartG = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
    } else {
        // Reuse existing SVG and g element
        chartG = svg.select('g');
    }

    const x = d3.scaleLinear()
        .domain([tickLower, tickUpper])
        .range([0, width]);

    const maxLiquidity = d3.max(data, d => d.liquidityActive);
    
    const y = d3.scaleLinear()
        .domain([0, maxLiquidity])
        .range([height, 0])
        .nice();

    const barWidth = Math.max(1, x(data[1].tickIdx) - x(data[0].tickIdx));

    // Update pattern for bars
    const bars = chartG.selectAll('.bar')
        .data(data, d => d.tickIdx);

    // Remove old bars
    bars.exit().remove();

    // Update existing and add new bars
    const allBars = bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .merge(bars)
        .attr('x', d => x(d.tickIdx) - barWidth / 2)
        .attr('y', d => y(d.liquidityActive))
        .attr('width', barWidth)
        .attr('height', d => height - y(d.liquidityActive))
        .attr('fill', 'steelblue');

    // Update price line
    const priceLine = chartG.selectAll('.price-line')
        .data([priceTickIdx]);

    priceLine.enter()
        .append('line')
        .attr('class', 'price-line')
        .merge(priceLine)
        .attr('x1', d => x(d))
        .attr('x2', d => x(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4')
        .attr('stroke-opacity', 1);

    // Update axes
    const tickStep = 2000;
    const centerTick = Math.round(priceTickIdx / tickStep) * tickStep;
    const numberOfTicks = 11;
    const halfTicks = Math.floor(numberOfTicks / 2);
    
    const tickValues = Array.from({length: numberOfTicks}, (_, i) => 
        centerTick + (i - halfTicks) * tickStep
    );

    // Remove existing axes
    chartG.selectAll('.x-axis').remove();
    chartG.selectAll('.y-axis').remove();

    // Add x-axis
    chartG.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .tickValues(tickValues)
            .tickFormat(d => d.toString())
            .tickSizeOuter(0))
        .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-65)");

    // Add y-axis
    chartG.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y))
        .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('Active Liquidity');

    // Optimize tooltip
    const tooltip = d3.select('body').selectAll('.tooltip')
        .data([null])
        .join('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', '#ffffff')
        .style('border', '1px solid #cccccc')
        .style('padding', '8px')
        .style('pointer-events', 'none');

    // Add tooltip behavior
    allBars
        .on('mouseover', (event, d) => {
            tooltip
                .style('opacity', 1)
                .html(`Tick Index: ${d.tickIdx}<br>Active Liquidity: ${d.liquidityActive.toFixed(2)}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.style('opacity', 0);
        });
}
