import * as d3 from "d3";
import csv1 from "./assets/fgo.csv"
import csv2 from "./assets/原神.csv"
import csv3 from "./assets/少女前线.csv"
import csv4 from "./assets/崩坏3.csv"
import csv5 from "./assets/明日方舟.csv"
import csv6 from "./assets/星穹铁道.csv"
import csv7 from "./assets/碧蓝航线.csv"
import csv8 from "./assets/蔚蓝档案.csv"

const game2path = new Map([
    ["fgo", csv1],
    ["原神", csv2],
    ["少女前线", csv3],
    ["崩坏3", csv4],
    ["明日方舟", csv5],
    ["星穹铁道", csv6],
    ["碧蓝航线", csv7],
    ["蔚蓝档案", csv8]
]);

// Function to compute the sum of values for each month
function computeMonthlySums(data, countries) {
    const monthlySums = {};
  
    data.forEach(row => {
        const [year, month] = row.date.split('/').slice(0, 2);
        const key = `${year}-${month}`;
    
        if (!monthlySums[key]) {
            monthlySums[key] = { month: `${year}/${month}` };
            countries.forEach(c => { monthlySums[key][c] = 0; })
        }
        countries.forEach(c => { monthlySums[key][c] += +row[c]; })
    });
  
    // Replace csvData with an array of objects with month and sum attributes
    return Object.values(monthlySums);
}

const game_data_cache = new Map();
function load_game_data_with_cache(game)
{
    // console.log(game_data_cache);
    return new Promise((resolve, reject) => {
        if(game_data_cache.has(game))
            resolve(game_data_cache.get(game));
        else
        {
            console.log(`Load ${game} data for the first time`);
            const csv = game2path.get(game);
            d3.csv(csv).then((data) => {
                game_data_cache.set(game, data);
                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
        }
    });
}

export function load_data(game, year, month)
{
    function get_extent(data)
    {
        const values = [];
        const countries = Object.keys(data[0]).slice(1);
        data.forEach((row) => {
            countries.forEach((c) => {
                if(+row[c] > 0)
                    values.push(+row[c]);
            })
        });
        return d3.extent(values);
    }
    return new Promise((resolve, reject) => {
        load_game_data_with_cache(game).then((data) => {
            const countries = Object.keys(data[0]).slice(1);
            const result = computeMonthlySums(data, countries);
            const domain = get_extent(result);
            const ret = [];
            if(year === undefined || month === undefined)
                resolve([result, domain]);
            else
            {
                result.forEach(row => {
                    if(row.month === `${year}/${month}`)
                        countries.forEach(c => { if(row[c] > 0) ret.push({name:c, sum:row[c]}); })
                })
                resolve([ret, domain]);
            }
        })
        .catch((error) => {
            reject(error);
        });
    })
}

export function get_date_range(game)
{
    return new Promise((resolve, reject) => {
        load_game_data_with_cache(game).then((data) => {
            resolve([new Date(data.at(0).date), new Date(data.at(-1).date)]);
        })
        .catch((error) => {
            reject(error);
        })
    });
}