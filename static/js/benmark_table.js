
//Formatter to generate charts
var chartFormatter = function (cell, formatterParams, onRendered) {
    var content = document.createElement("span");
    var values = cell.getValue();

    //invert values if needed
    if (formatterParams.invert) {
        values = values.map(val => val * -1);
    }

    //add values to chart and style
    content.classList.add(formatterParams.type);
    content.inneHrTML = values.join(",");

    //setup chart options
    var options = {
        width: 50,
        // min: 0.0,
        // max: 100.0,
    }

    if (formatterParams.fill) {
        options.fill = formatterParams.fill
    }

    //instantiate piety chart after the cell element has been aded to the DOM
    onRendered(function () {
        peity(content, formatterParams.type, options);
    });

    return content;
};



var colorFormatter = function (cell, formatterParams) {
    var value = cell.getValue();

    // Check for the specific string "-"
    if (value === "-") {
        return value;
    }

    // Default values
    var defaults = {
        min: 0.0,
        max: 100.0,
        startColor: { r: 255, g: 255, b: 255 },
        endColor: { r: 100, g: 150, b: 250 }
    };

    // Override defaults with provided formatterParams values
    var min = (formatterParams && formatterParams.min) || defaults.min;
    var max = (formatterParams && formatterParams.max) || defaults.max;
    var startColor = (formatterParams && formatterParams.startColor) || defaults.startColor;
    var endColor = (formatterParams && formatterParams.endColor) || defaults.endColor;

    // Normalize the value between 0 and 1
    var normalizedValue = (value - min) / (max - min);

    // Compute the color gradient 
    var red = Math.floor(startColor.r + (endColor.r - startColor.r) * normalizedValue);
    var green = Math.floor(startColor.g + (endColor.g - startColor.g) * normalizedValue);
    var blue = Math.floor(startColor.b + (endColor.b - startColor.b) * normalizedValue);

    // make sure the value is rounded to 1 decimal place
    value = parseFloat(value).toFixed(1)

    return "<span style='display: block; width: 100%; height: 100%; background-color: rgb(" + red + ", " + green + ", " + blue + ");'>" + value + "</span>";
}


var barColorFn = function (value, formatterParams) {
    var defaults = {
        range: [-50, 50],
        low: { r: 255, g: 100, b: 150 },
        high: { r: 150, g: 255, b: 150 }
    };

    // Override defaults with provided formatterParams values

    var low_range = (formatterParams && formatterParams.range[0]) || defaults.range[0];
    var high_range = (formatterParams && formatterParams.range[1]) || defaults.range[1];
    var low = (formatterParams && formatterParams.low) || defaults.low;
    var high = (formatterParams && formatterParams.high) || defaults.high;

    // Clamp the value to the range [-100, 100]
    value = Math.max(low_range, Math.min(high_range, value));
    var range = high_range - low_range;

    // Normalize the value to the range [0, 1]
    var normalizedValue = (value + range / 2) / range;
    // Interpolate between the two colors based on the normalized value
    var interpolated = {
        r: Math.floor(low.r + (high.r - low.r) * normalizedValue),
        g: Math.floor(low.g + (high.g - low.g) * normalizedValue),
        b: Math.floor(low.b + (high.b - low.b) * normalizedValue)
    };

    return 'rgba(' + interpolated.r + ',' + interpolated.g + ',' + interpolated.b + ',0.9)';
}

document.addEventListener('DOMContentLoaded', function () {
    Promise.all([
        fetch('static/data/benchmark.json').then(response => response.json()),
        fetch('static/data/feedback_comparison.json').then(response => response.json()),
        fetch('static/data/eurus_code_sr_vs_k_series.json').then(response => response.json()),
        fetch('static/data/eurus_math_sr_vs_k_series.json').then(response => response.json())
    ])
        .then(([
            benchmark_tabledata,
            benchmark_feedback_efficancy_tabledata,
            eurus_code_sr_vs_k_series,
            eurus_math_sr_vs_k_series]) => {

            // 1. Benchmark Table
            benchmark_tabledata.forEach(row => {
                row.line = [row['1'], row['2'], row['3'], row['4'], row['5']]
            })

            var table = new Tabulator("#benchmark-table", {
                data: benchmark_tabledata,
                layout: "fitColumns",
                responsiveLayout: "collapse",
                movableColumns: false,
                columnDefaults: {
                    tooltip: true,
                },
                columns: [
                    { title: "Model", field: "Model", headerHozAlign: "center", headerVAlign: "middle", widthGrow: 2.0, minWidth: 180 },
                    { title: "Params", field: "Params", headerHozAlign: "center", hozAlign: "right", widthGrow: 1.0, minWidth: 60 },
                    { title: "Exec. Rate", field: "Exec_Rate", headerHozAlign: "center", hozAlign: "center", widthGrow: 1.3, minWidth: 60 },
                    {
                        title: "Low-Level",
                        headerHozAlign: "center",
                        headerVAlign: "middle",
                        columns: [
                            { title: "Text", field: "Text", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Layout", field: "Layout", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Type", field: "Type", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Color", field: "Color", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Avg.", field: "Avg", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                        ],
                    },
                    {
                        title: "High-Level",
                        headerHozAlign: "center",
                        columns: [
                            { title: "GPT-4V", field: "GPT-4V", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                        ]
                    },
                    { title: "Overall", field: "Overall", sorter: "number", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                ],
                initialSort: [
                    { column: "Overall", dir: "desc" },
                ],
            });


            var eurus_code_table = new Tabulator("#eurus-code-table", {
                data: eurus_code_sr_vs_k_series,
                layout: "fitColumns",
                responsiveLayout: "collapse",
                movableColumns: false,
                columnDefaults: {
                    tooltip: true,
                },
                columns: [
                    { title: "Model", field: "Model", headerHozAlign: "center", headerVAlign: "middle", widthGrow: 2.0, minWidth: 180 },
                    { title: "Params", field: "Params", headerHozAlign: "center", hozAlign: "right", widthGrow: 1.0, minWidth: 60 },
                    { title: "Exec. Rate", field: "Exec_Rate", headerHozAlign: "center", hozAlign: "center", widthGrow: 1.3, minWidth: 60 },
                    {
                        title: "Low-Level",
                        headerHozAlign: "center",
                        headerVAlign: "middle",
                        columns: [
                            { title: "Text", field: "Text", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Layout", field: "Layout", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Type", field: "Type", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Color", field: "Color", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                            { title: "Avg.", field: "Avg", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                        ],
                    },
                    {
                        title: "High-Level",
                        headerHozAlign: "center",
                        columns: [
                            { title: "GPT-4V", field: "GPT-4V", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                        ]
                    },
                    { title: "Overall", field: "Overall", sorter: "number", headerHozAlign: "center", hozAlign: "center", minWidth: 90, formatter: colorFormatter },
                ],
                initialSort: [
                    { column: "Overall", dir: "desc" },
                ],
            });

            // 2. Benchmark Feedback Efficancy Table
            benchmark_feedback_efficancy_tabledata.forEach(row => {
                row.model = row.feedback_provider_info.model;
                row.size = row.feedback_provider_info.size;
                row.type = row.feedback_provider_info.type;
            })
        });

})