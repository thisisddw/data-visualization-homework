import * as d3 from "d3";

function line_chart(data, {
    xval = (d) => d.x,
    yval = (d) => d.y,
    domain,
    range,
    xscale = d3.scaleLinear,
    yscale = d3.scaleLinear,
    ylabel = "",
    width = 928,
    height = 500,
    marginTop = 20,
    marginRight = 30,
    marginBottom = 30,
    marginLeft = 40,        
    } = {})
{

    if(domain === undefined)
        domain = d3.extent(data, xval);
    if(range === undefined)
        range = d3.extent(data, yval);

    // Declare the x (horizontal position) scale.
    const x = xscale(domain, [marginLeft, width - marginRight]);

    // Declare the y (vertical position) scale.
    const y = yscale(range, [height - marginBottom, marginTop]);

    // Declare the line generator.
    const line = d3.line()
        .x(d => x(xval(d)))
        .y(d => y(yval(d)));

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(ylabel));

    // Append a path for the line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line(data));

    return svg.node();
}

export default line_chart;