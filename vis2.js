function plotLiquidityDistribution(data) {
    // Sort data by tick index
    data.sort((a, b) => a.tickIdx - b.tickIdx);
  
    // Set up the SVG canvas dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    // Clear any existing content
    d3.select('#chart2').html('');
  
    // Append the SVG object to the div with id "chart2"
    const svg = d3.select('#chart2')
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Create scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.tickIdx))
      .range([0, width])
      .padding(0.1); // Adjusts the spacing between bars
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.liquidityActive)])
      .range([height, 0]);
  
    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickValues([])) // Hides tick labels if too many
      .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text('Tick Index');
  
    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(y))
      .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text('Active Liquidity');
  
    // Create the bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.tickIdx))
        .attr('y', d => y(d.liquidityActive))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.liquidityActive))
        .attr('fill', 'steelblue')
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
  
    // Tooltip
    const tooltip = d3.select('#chart2')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', '#ffffff')
      .style('border', '1px solid #cccccc')
      .style('padding', '8px')
      .style('pointer-events', 'none');
  }
  