import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Function to calculate UNI/ETH price based on tick index
function calculateUniEthPrice(tickIdx) {
    // Uniswap V3 price calculation formula, adjust if necessary
    return Math.pow(1.0001, tickIdx);
}

// Draws horizontal lines on the chart at specified values
export const drawHorizontalLines = (svg, yScale, svgWidth, lowerValue, upperValue) => {
    svg.selectAll('.horizontal-line').remove();

    svg.append('line')
        .attr('class', 'horizontal-line')
        .attr('x1', 0)
        .attr('x2', svgWidth)
        .attr('y1', yScale(lowerValue))
        .attr('y2', yScale(lowerValue))
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6');

    svg.append('line')
        .attr('class', 'horizontal-line')
        .attr('x1', 0)
        .attr('x2', svgWidth)
        .attr('y1', yScale(upperValue))
        .attr('y2', yScale(upperValue))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6');
};

// Draws vertical lines on the chart at specified values
export const drawVerticalLines = (svg, xScale, svgHeight, lowerValue, upperValue) => {
    svg.selectAll('.vertical-line').remove();
    svg.selectAll('.price-label').remove();

    // Calculate prices at lower and upper tick indices
    const lowerPrice = calculateUniEthPrice(lowerValue); // Price at lower tick index
    const upperPrice = calculateUniEthPrice(upperValue); // Price at upper tick index

    // Draw lower bound line
    svg.append('line')
        .attr('class', 'vertical-line')
        .attr('y1', 0)
        .attr('y2', svgHeight)
        .attr('x1', xScale(lowerValue))
        .attr('x2', xScale(lowerValue))
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6');

    // Draw upper bound line
    svg.append('line')
        .attr('class', 'vertical-line')
        .attr('y1', 0)
        .attr('y2', svgHeight)
        .attr('x1', xScale(upperValue))
        .attr('x2', xScale(upperValue))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6');

    // Add text labels to show the calculated prices at each line
    svg.append('text')
        .attr('class', 'price-label')
        .attr('x', xScale(lowerValue) - 5)
        .attr('y', svgHeight - 10)
        .attr('text-anchor', 'end')
        .style('fill', 'red')
        .text(`Price: ${lowerPrice.toFixed(4)} UNI/ETH`);

    svg.append('text')
        .attr('class', 'price-label')
        .attr('x', xScale(upperValue) + 5)
        .attr('y', svgHeight - 10)
        .attr('text-anchor', 'start')
        .style('fill', 'blue')
        .text(`Price: ${upperPrice.toFixed(4)} UNI/ETH`);
};

// Slider creation and event handling
export const createSlider = (sliderElement, svg, scale, dimension, initialLowerValue, initialUpperValue, data, d3, orientation = 'horizontal') => {
    noUiSlider.create(sliderElement, {
        start: [initialLowerValue, initialUpperValue],
        connect: true,
        range: {
            'min': d3.min(data, d => (orientation === 'horizontal' ? d.uniPerEth : d.tickIdx)),
            'max': d3.max(data, d => (orientation === 'horizontal' ? d.uniPerEth : d.tickIdx)) * 1.5,
        },
        step: 1,
    });

    // Update the chart dynamically when the slider values change
    sliderElement.noUiSlider.on('update', (values) => {
        const lowerValue = parseFloat(values[0]);
        const upperValue = parseFloat(values[1]);

        if (orientation === 'horizontal') {
            drawHorizontalLines(svg, scale, dimension, lowerValue, upperValue);
        } else {
            drawVerticalLines(svg, scale, dimension, lowerValue, upperValue);
        }
    });
};