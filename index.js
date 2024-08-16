const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json';

// Set dimensions and margins for the chart
const margin = { top: 20, right: 30, bottom: 150, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", "100%")
    .attr("height", height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${800} ${height + 64 + margin.top + margin.bottom}`)
    .append("g")
    .attr('transform', `translate(${margin.left},${margin.top})`);
    

// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "#333")
    .style('color', 'white')
    .style("border", "1px solid #000")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none");

// Fetch the data and create the chart
d3.json(url).then(data => {
    // Parse the data as needed
    data.forEach(d => {
        d.Year = +d.Year;
        d.Time = d3.timeParse("%M:%S")(d.Time);
    });

    // Create scales
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
        .range([0, width]);

    const y = d3.scaleTime()
        .domain(d3.extent(data, d => d.Time))
        .range([height, 0]);

    // Create the axes
    const xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%Y"));

    const yAxis = d3.axisLeft(y)
        .tickFormat(d3.timeFormat("%M:%S"));

    // Add x-axis
    svg.append("g")
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .attr("id", "x-axis");

    // Add y-axis 
    svg.append('g')
        .call(yAxis)
        .attr("id", "y-axis");

    // Updated color scales for better complementarity
    const placeColorScale = d3.scaleLinear()
        .domain([1, 35])
        .range(["#1a9850", "#d73027"]); // Green to Red (ColorBrewer)

    const timeColorScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Time))
        .range(["#ffffbf", "#4575b4"]); // Blue to Yellow (ColorBrewer)

    // Create scattered dots with dual color gradient
    svg.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(new Date(d.Year, 0, 1)))
        .attr('cy', d => y(d.Time))
        .attr("r", 5)
        .attr("data-xvalue", d => d.Year)
        .attr("data-yvalue", d => d.Time.toISOString())
        .style("fill", d => `url(#gradient-${d.Year}-${d.Place})`)
        .on('mouseover', (event, d) => {
            tooltip.style('visibility', 'visible')
                .html(`Name: ${d.Name}<br>Place: ${d.Place}<br>Time: ${d3.timeFormat('%M:%S')(d.Time)}<br>Year: ${d.Year}<br>Doping: ${d.Doping || "No Doping"}`)
                .style('left', `${Math.min(window.innerWidth - 150, event.pageX + 5)}px`)
                .style('top', `${Math.min(window.innerHeight - 50, event.pageY - 28)}px`)
                .attr('data-year', d.Year);
        })
        .on('mouseout', () => {
            tooltip.style('visibility', 'hidden');
        });

    // Define gradients for dual color effect
    const defs = svg.append("defs");

    data.forEach(d => {
        const placeColor = placeColorScale(d.Place);
        const timeColor = timeColorScale(d.Time);

        defs.append("linearGradient")
            .attr("id", `gradient-${d.Year}-${d.Place}`)
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "100%")
            .selectAll("stop")
            .data([
                { offset: "0%", color: timeColor },
                { offset: "100%", color: placeColor }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
    });

// Add legend
const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(0, ${height + margin.bottom - 50})`);

const legendWidth = 600;
const legendHeight = 70;
const legendPadding = 10;

// Create legend for place
const placeLegendGroup = legend.append("g")
    .attr("transform", "translate(0, 0)");

const placeLegend = placeLegendGroup.append("defs")
    .append("linearGradient")
    .attr("id", "placeLegendGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

placeLegend.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#1a9850");

placeLegend.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#d73027");

placeLegendGroup.append("rect")
    .attr("x", legendPadding + 100)
    .attr("y", 0)
    .attr("width", legendWidth)
    .attr("height", legendHeight / 2)
    // .style('padding', '20px')
    .style("fill", "url(#placeLegendGradient)");

placeLegendGroup.append("text")
    .attr("x", 0)
    .attr("y", legendHeight / 4)
    .text("Place Legend")
    .style('fill', 'white')
    .style("font-weight", "bold");

// Add numbers to place legend
placeLegendGroup.append("text")
    .attr("x", legendPadding + 100)
    .attr("y", legendHeight / 2 + 15)
    .text("1st")
    .style('fill', 'white')
    .style("text-anchor", "start");

placeLegendGroup.append("text")
    .attr("x", legendPadding + 100 + legendWidth)
    .attr("y", legendHeight / 2 + 15)
    .text("35th")
    .style('fill', 'white')
    .style("text-anchor", "end");

// Create legend for time
const timeLegendGroup = legend.append("g")
    .attr("transform", `translate(0, ${legendHeight / 2 + 20})`);

const timeLegend = timeLegendGroup.append("defs")
    .append("linearGradient")
    .attr("id", "timeLegendGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

timeLegend.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#ffffbf");

timeLegend.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#4575b4");

timeLegendGroup.append("rect")
    .attr("x", legendPadding + 100)
    .attr("y", 0)
    .attr("width", legendWidth)
    .attr("height", legendHeight / 2)
    .style("fill", "url(#timeLegendGradient)");

timeLegendGroup.append("text")
    .attr("x", 0)
    .attr("y", legendHeight / 4)
    .text("Time Legend")
    .style('fill', 'white')
    .style("font-weight", "bold");

// Add numbers to time legend
timeLegendGroup.append("text")
    .attr("x", legendPadding + 100)
    .attr("y", legendHeight / 2 + 15)
    .text("Faster")
    .style('fill', 'white')
    .style("text-anchor", "start");

timeLegendGroup.append("text")
    .attr("x", legendPadding + 100 + legendWidth)
    .attr("y", legendHeight / 2 + 15)
    .text("Slower")
    .style('fill', 'white')
    .style("text-anchor", "end");

    // Add zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([1, 20])
        .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event) {
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);

        svg.select("#x-axis").call(xAxis.scale(newX));
        svg.select("#y-axis").call(yAxis.scale(newY));

        svg.selectAll(".dot")
            .attr("cx", d => newX(new Date(d.Year, 0, 1)))
            .attr("cy", d => newY(d.Time));

        // Update x-axis label format based on zoom level
        if (event.transform.k > 10) {
            svg.select("#x-axis").call(xAxis.scale(newX).tickFormat(d3.timeFormat("%Y-%m")));
        } else {
            svg.select("#x-axis").call(xAxis.scale(newX).tickFormat(d3.timeFormat("%Y")));
        }
    }
});