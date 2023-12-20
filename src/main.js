'use strict';
import Choropleth from "./Choropleth.js"
import * as d3 from "d3";
import * as topojson from "topojson"
import world from "./assets/countries-50m.json";
import Legend from "./color-legend.js"

import { load_data, get_date_range, get_max_value } from "./utils.js";

const game = "原神";
const year = 2021;
const month = 12;

function update_map(game, year, month) {
    load_data(game, year, month).then(([data, min_max], error) => {
        if (error) {
            console.log(error);
        } else {
            // console.log(game, year, month, "data: ", typeof(data), data);
            // console.log("world: ", typeof(world), world);
    
            const countries = topojson.feature(world, world.objects.countries);
            const countrymesh = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
            // console.log(countries);
            // console.log(countrymesh);
    
            const chart = Choropleth(data, {
                id: d => d.name, // country name, e.g. Zimbabwe
                value: d => d.sum, // health-adjusted life expectancy
                scale: d3.scaleSequentialLog,
                domain: min_max,
                range: d3.interpolateYlGnBu,
                features: countries,
                featureId: d => d.properties.name, // i.e., not ISO 3166-1 numeric
                borders: countrymesh,
                projection: d3.geoEqualEarth()
            });
            const {color} = chart.scales;
            const legend = Legend(color, {title: `${game} revenue in ${year}/${month}`, width: 260})
            // console.log(typeof(chart), chart);
            // console.log(color);
            // console.log(legend);
    
            var parentDiv = document.getElementById('map');
            parentDiv.innerHTML = "";
            parentDiv.appendChild(legend);
            parentDiv.appendChild(chart);
        };
        return data;
    }); 
}

document.addEventListener('DOMContentLoaded', function () {
    const gameSelector = document.getElementById('gameSelector');
    const dateSlider = document.getElementById('dateSlider');
    const selectedDateDisplay = document.getElementById('selectedDate');
  
    // Your date range and corresponding values (adjust as needed)
    var startDate = new Date('2012-01-01');
    var endDate = new Date('2023-12-31');
    var totalDays = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000));
  
    function updateSelectedDate() {
        const selectedGame = gameSelector.value;
        const selectedDays = parseInt(dateSlider.value);
        const selectedDate = new Date(startDate);
        selectedDate.setDate(startDate.getDate() + selectedDays);
    
        // const formattedDate = selectedDate.toISOString().split('T')[0];
        selectedDateDisplay.textContent = `Selected Month: ${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}`;
        update_map(selectedGame, selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }
    function updateSliderLabels() {
        const startLabel = startDate.toISOString().split('T')[0];
        const endLabel = endDate.toISOString().split('T')[0];
        function ymd2ym(date) {
            const [y,m,d] = date.split("-");
            return `${y}-${m}`;
        }
        startDateLabel.textContent = `${ymd2ym(startLabel)}`;
        endDateLabel.textContent = `${ymd2ym(endLabel)}`;
    }
    function updateSelectedGame() {
        const selectedGame = gameSelector.value;
        get_date_range(selectedGame).then((data) => {
            // update dateSlider
            startDate = data[0];
            endDate = data[1];
            totalDays = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000));
            dateSlider.setAttribute('max', totalDays);
            updateSliderLabels();

            // update map
            updateSelectedDate();
        });
    }

    // Initial update
    updateSelectedGame();
  
    // Event listener for slider change
    dateSlider.addEventListener('input', updateSelectedDate);
    gameSelector.addEventListener('change', updateSelectedGame);
});