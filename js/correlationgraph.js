import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { drawHorizontalLines, createSlider } from './user.js'; // Import the user lines module


export const drawChart = (ethPrices, uniPrices) => {
    const minLength = Math.min(ethPrices.length, uniPrices.length);
    const truncatedEthPrices = ethPrices.slice(0, minLength);
    const truncatedUniPrices = uniPrices.slice(0, minLength);

    const svgWidth = 500;
    const svgHeight = 200;

    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight);

    const data = truncatedEthPrices.map((price, index) => {
        const ethPrice = truncatedEthPrices[index][1];
        const uniPrice = truncatedUniPrices[index][1];
        const uniPerEth = ethPrice / uniPrice;

        return {
            date: new Date(truncatedEthPrices[index][0]),
            uniPerEth: uniPerEth
        };
    });

    const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, svgWidth]);

    // get latest value to orientate for y-axis 
    const latestBoundaryValue = data[data.length - 1].uniPerEth;

    // calculate max and min for svg to occupy. 80% +-
    const lowerBound = latestBoundaryValue * 0.2;
    const upperBound = latestBoundaryValue * 1.8;

    // Manipulate yscale to centre value
    const yScale = d3.scaleLinear()
    .domain([lowerBound, upperBound])
    .range([svgHeight, 0]);

    // log y to confirm
    console.log('Y DOMAINS', yScale.domain());

    // const yScale = d3.scaleLinear()
    //     .domain([0, d3.max(data, d => d.uniPerEth) * 1.2]) // Add a buffer above the max
    //     .range([svgHeight, 0]);

        // Log the Y domain and max value to the console
    console.log('Y Domain:', yScale.domain());
    console.log('Max Uni Per Eth:', d3.max(data, d => d.uniPerEth));
      
    // Append x-axis
    svg.append('g')
        .attr('transform', `translate(0, ${svgHeight})`)
        .call(d3.axisBottom(xScale));
    
    // Append y-axis
    svg.append('g')
        .call(d3.axisLeft(yScale));

    const lineUniPerEth = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.uniPerEth));

    svg.append('path')
        .data([data])
        .attr('class', 'line')
        .attr('d', lineUniPerEth)
        .style('fill', 'none')
        .style('stroke', 'green')
        .style('stroke-width', 1.5);

        // ////////////////////////
        // // HORIZONTAL USER LINES
        // const drawHorizontalLines = (lowerPrice, upperPrice) => {
        //     svg.selectAll('.horizontal-line').remove(); // Remove existing lines
    
        //     // Draw the red line for lowerPrice
        //     svg.append('line')
        //         .attr('class', 'horizontal-line')
        //         .attr('x1', 0)
        //         .attr('x2', svgWidth)
        //         .attr('y1', yScale(lowerPrice)) // Use dynamic lowerPrice from the slider
        //         .attr('y2', yScale(lowerPrice))
        //         .attr('stroke', 'red')
        //         .attr('stroke-width', 2)
        //         .attr('stroke-dasharray', '6');
    
        //     // Draw the blue line for upperPrice
        //     svg.append('line')
        //         .attr('class', 'horizontal-line')
        //         .attr('x1', 0)
        //         .attr('x2', svgWidth)
        //         .attr('y1', yScale(upperPrice)) // Use dynamic upperPrice from the slider
        //         .attr('y2', yScale(upperPrice))
        //         .attr('stroke', 'blue')
        //         .attr('stroke-width', 2)
        //         .attr('stroke-dasharray', '6');
        // };
    
        // Initial rendering with 25% margin
        const latestValue = data[data.length - 1].uniPerEth;
        const initialUpperPrice = latestValue * 1.25;
        const initialLowerPrice = latestValue * 0.75;
        drawHorizontalLines(svg, yScale, svgWidth, initialLowerPrice, initialUpperPrice); // Initial lines with 25% margin

        // slider
        const slider = document.getElementById('priceSlider');
        createSlider(slider, svg, yScale, svgWidth, initialLowerPrice, initialUpperPrice, data, d3);
        
        /////////////////////
        // VERTICAL HOVERLINE
        const verticalLine = svg.append('line')
        .attr('class', 'hover-line')
        .attr('y1', 0)
        .attr('y2', svgHeight)
        .attr('stroke', 'gray')
        .attr('stroke-width', 1.5)
        .style('visibility', 'hidden');

    // Hover circle
    const hoverCircle = svg.append('circle')
        .attr('r', 4)
        .attr('fill', 'red')
        .style('visibility', 'hidden');

    // Tooltip
    const tooltip = svg.append('text')
        .attr('class', 'tooltip')
        .attr('x', 10)
        .attr('y', 10)
        .style('visibility', 'hidden')
        .style('font-size', '12px')
        .style('fill', 'black')
        .style('background-color', 'white');

    // Create a transparent rect for capturing mouse hover events
    svg.append('rect')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', () => {
            verticalLine.style('visibility', 'visible');
            hoverCircle.style('visibility', 'visible');
            tooltip.style('visibility', 'visible');
        })
        .on('mousemove', (event) => {
            const [mouseX] = d3.pointer(event); // Get the mouse X position
            const date = xScale.invert(mouseX); // Get corresponding date from X scale

            // Find the closest data point
            const bisectDate = d3.bisector(d => d.date).left;
            const index = bisectDate(data, date); // Find the index of the closest date
            const closestData = data[index];

            // Update the vertical line
            verticalLine
                .attr('x1', mouseX)
                .attr('x2', mouseX);

            // Update the position of the hover circle
            hoverCircle
                .attr('cx', xScale(closestData.date))
                .attr('cy', yScale(closestData.uniPerEth));

            // Update the tooltip content and position
            tooltip
                .attr('x', mouseX + 10) // Position tooltip slightly to the right of the vertical line
                .attr('y', yScale(closestData.uniPerEth) - 10) // Position tooltip slightly above the circle
                .text(`Date: ${closestData.date.toLocaleDateString()}, Price: ${closestData.uniPerEth.toFixed(2)}`);
        })
        .on('mouseout', () => {
            verticalLine.style('visibility', 'hidden');
            hoverCircle.style('visibility', 'hidden');
            tooltip.style('visibility', 'hidden');
        });


        
        // ////////////////////
        // // SLIDER noUiSlider
        // const slider = document.getElementById('priceSlider');
        // noUiSlider.create(slider, {
        //     start: [initialLowerPrice, initialUpperPrice], // Set initial values from the 25% margins
        //     connect: true,
        //     range: {
        //         'min': 0,
        //         'max': d3.max(data, d => d.uniPerEth) * 1.5, // Increase range to handle larger updates
        //     },
        //     step: 1,
        // });
    
        // // Update the chart dynamically when the slider values change
        // slider.noUiSlider.on('update', (values) => {
        //     const lowerPrice = parseFloat(values[0]); // Get the lower value from the slider
        //     const upperPrice = parseFloat(values[1]); // Get the upper value from the slider
        //     drawHorizontalLines(lowerPrice, upperPrice); // Redraw the lines with the new slider values
        // });
    };