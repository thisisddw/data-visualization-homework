import * as d3 from "d3";

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/choropleth
function Choropleth(data, {
    id = d => d.id, // given d in data, returns the feature id
    value = () => undefined, // given d in data, returns the quantitative value
    title, // given a feature f and possibly a datum d, returns the hover text
    format, // optional format specifier for the title
    scale = d3.scaleSequential, // type of color scale
    domain, // [min, max] values; input of color scale
    range = d3.interpolateBlues, // output of color scale
    width = 640, // outer width, in pixels
    height, // outer height, in pixels
    projection, // a D3 projection; null for pre-projected geometry
    features, // a GeoJSON feature collection
    featureId = d => d.id, // given a feature, returns its id
    borders, // a GeoJSON object for stroking borders
    outline = projection && projection.rotate ? {type: "Sphere"} : null, // a GeoJSON object for the background
    unknown = "#ccc", // fill color for missing data
    fill = "white", // fill color for outline
    stroke = "white", // stroke color for borders
    strokeLinecap = "round", // stroke line cap for borders
    strokeLinejoin = "round", // stroke line join for borders
    strokeWidth, // stroke width for borders
    strokeOpacity, // stroke opacity for borders

    tip, // given featureId, returns a svg element with tip to display
    tipWidth = "50%",
    tipHeight = "50%",
  } = {}) {
    // Compute values.
    const N = d3.map(data, id);
    const V = d3.map(data, value).map(d => d == null ? NaN : +d);
    const Im = new d3.InternMap(N.map((id, i) => [id, i]));
    const If = d3.map(features.features, featureId);
  
    // Compute default domains.
    if (domain === undefined) domain = d3.extent(V);
  
    // Construct scales.
    const color = scale(domain, range);
    if (color.unknown && unknown !== undefined) color.unknown(unknown);
  
    // Compute titles.
    if (title === undefined) {
        format = color.tickFormat(100, format);
        title = (f, i) => `${f.properties.name}\n${format(V[i])}`;
    } else if (title !== null) {
        const T = title;
        const O = d3.map(data, d => d);
        title = (f, i) => T(f, O[i]);
    }
  
    // Compute the default height. If an outline object is specified, scale the projection to fit
    // the width, and then compute the corresponding height.
    if (height === undefined) {
        if (outline === undefined) {
            height = 400;
        } else {
            const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, outline)).bounds(outline);
            const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
            projection.scale(projection.scale() * (l - 1) / l).precision(0.2);
            height = dy;
        }
    }
  
    // Construct a path generator.
    const path = d3.geoPath(projection);
  
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "width: 100%; height: auto; height: intrinsic;")
        .on("click", reset);
  
    if (outline != null) svg.append("path")
        .attr("fill", fill)
        .attr("stroke", "currentColor")
        .attr("d", path(outline));
  
    svg.append("g")
        .selectAll("path")
        .data(features.features)
        .join("path")
            .attr("fill", (d, i) => color(V[Im.get(If[i])]))
            .attr("d", path)
            .on("mouseover", mouseover)
            .on("mouseout", reset)
            .on("click", (event) => { event.stopPropagation(); })
        .append("title")
            .text((d, i) => title(d, Im.get(If[i])));

    if (borders != null) svg.append("path")
        .attr("pointer-events", "none")
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("d", path(borders));

    if(tip === undefined)
        tip = (name) => {
            const ret = d3.create("svg");
            ret.append("rect")
                    .attr("stroke", "black")
                    .attr("fill", "none")
                    .attr("width", "100%")
                    .attr("height", "100%");
            return ret.node();
        }
  
    const numericTipWidth = Math.round(width * parseFloat(tipWidth.replace('%', '').trim()) / 100);
    const numericTipHeight = Math.round(height * parseFloat(tipHeight.replace('%', '').trim()) / 100);
    console.log(`tipw: ${numericTipWidth} tiph: ${numericTipHeight}`);

    const highlight_layer = svg.append("g");
    const tip_layer = svg.append("g");
    tip_layer.append("svg")
        .attr("id", "tip")
        .attr("width", tipWidth)
        .attr("height", tipHeight)
        .attr("display", "none");
    svg.on("pointermove", pointermoved);
        
    return Object.assign(svg.node(), {scales: {color}});
      
    function highlight(name, color) {
        highlight_layer.append("path")
            .attr("class", "highlight")
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-linecap", strokeLinecap)
            .attr("stroke-linejoin", strokeLinejoin)
            .attr("stroke-width", strokeWidth)
            .attr("stroke-opacity", strokeOpacity)
            .attr("d", path(d3.filter(features.features, (d) => { return d.properties.name === name; })[0]));
            // .on("mouseout", (event, d) => { d3.select(event.currentTarget).remove(); console.log(this); });
    }
    function reset(event, d) {
        d3.selectAll(".highlight").remove();
        tip_layer.selectAll("svg").attr("display", "none");
    }
    function tip_location([x, y]) {
        if (width - x < numericTipWidth)
            x -= numericTipWidth;
        return [x, y];
    }
    function pointermoved(event, d) {
        const [x, y] = tip_location(d3.pointer(event));
        tip_layer.select("svg")
            .attr("x", x)
            .attr("y", y);
    }
    function mouseover(event, d) {
        const name = d3.select(this).select("title").html().split("\n")[0];
        const [x, y] = tip_location(d3.pointer(event));

        reset();

        highlight(name, "gray");
        
        tip_layer.select("#tip").remove();
        const tip_svg = tip(name);
        if(tip_svg) tip_layer.append(() => tip_svg)
            .attr("id", "tip")
            .attr("width", tipWidth)
            .attr("height", tipHeight)
            .attr("display", null)
            .attr("x", x)
            .attr("y", y);
    }
}

export default Choropleth;