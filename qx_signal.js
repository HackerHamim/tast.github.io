// Signal Generator Script with JSON Output

// Global Variables
let listBestPairTimes = [];
let listPairs = [
    "EUR_USD", "GBP_AUD", "EUR_AUD", "EUR_JPY", "GBP_CAD",
    "USD_JPY", "EUR_CHF", "AUD_CAD", "GBP_CHF", "EUR_GBP",
    "AUD_CHF", "CAD_JPY", "GBP_JPY", "EUR_CAD", "AUD_JPY", "GBP_NZD",
];

// Default Parameters
let parameters = {
    percentageMin: 100,
    percentageMax: 100,
    candleTime: "M5",
    daysAnalyse: 20,
    martingales: 1,
    orderType: "PUT",
    timeInit: 2,
    timeEnd: 18,
    cbAtivo: 0, // Represents "All Assets" by default
};

// Entry Point
function processSignals() {
    console.log("Starting signal processing...");
    listBestPairTimes = [];
    fetchParameters();
    let count = calculateCandlesCount();

    if (count > 50000) {
        alert("The number of candles exceeds 50,000. Reduce the days analysed.");
        return;
    }

    let pairsToAnalyze = parameters.cbAtivo === 0 ? listPairs : [parameters.cbAtivo];
    pairsToAnalyze.forEach((pair) => fetchHistoricData(pair, count));
}

// Fetch Parameters from Input Fields
function fetchParameters() {
    parameters.percentageMin = document.getElementById("selPercentageMin").value || parameters.percentageMin;
    parameters.percentageMax = document.getElementById("selPercentageMax").value || parameters.percentageMax;
    parameters.candleTime = document.getElementById("selCandleTime").value || parameters.candleTime;
    parameters.daysAnalyse = document.getElementById("selDays").value || parameters.daysAnalyse;
    parameters.martingales = document.getElementById("selMartingales").value || parameters.martingales;
    parameters.orderType = document.getElementById("selOrderType").value || parameters.orderType;
    parameters.timeInit = document.getElementById("selTimeInit").value || parameters.timeInit;
    parameters.timeEnd = document.getElementById("selTimeEnd").value || parameters.timeEnd;
    parameters.cbAtivo = document.getElementById("cbAtivo").value || parameters.cbAtivo;
}

// Calculate Number of Candles to Analyze
function calculateCandlesCount() {
    const timeMapping = {
        M1: 1, M5: 5, M15: 15, M30: 30,
        H1: 60, H2: 120, H4: 240,
    };
    const minutes = timeMapping[parameters.candleTime] || 15;
    return (24 * (60 / minutes)) * parameters.daysAnalyse;
}

// Fetch Historic Data for a Pair
function fetchHistoricData(pair, count) {
    const url = `https://api-fxpractice.oanda.com/v3/instruments/${pair}/candles?granularity=${parameters.candleTime}&count=${count}`;
    fetch(url, {
        headers: {
            Authorization: "Bearer YOUR_ACCESS_TOKEN_HERE",
        },
    })
        .then((response) => response.json())
        .then((data) => processHistoricData(data, pair))
        .catch((error) => console.error(`Error fetching data for ${pair}:`, error));
}

// Process Historic Data
function processHistoricData(data, pair) {
    const { candles } = data;
    let processedData = candles.map((candle) => {
        let resultValue = candle.mid.o - candle.mid.c;
        return {
            time: new Date(candle.time).toLocaleTimeString(),
            pair,
            result: resultValue > 0 ? "PUT" : "CALL",
            percentDif: (resultValue * 100) / candle.mid.o,
        };
    });

    // Filter and Store Signals
    processedData.forEach((entry) => {
        if (
            entry.result === parameters.orderType &&
            entry.percentDif >= parameters.percentageMin &&
            entry.percentDif <= parameters.percentageMax
        ) {
            listBestPairTimes.push(entry);
        }
    });

    // Check Completion
    if (--parameters.requestNumber === 0) generateJSONOutput();
}

// Generate JSON Output
function generateJSONOutput() {
    let jsonOutput = JSON.stringify(listBestPairTimes, null, 4);
    console.log("Generated JSON:", jsonOutput);

    // Display JSON in a pre-formatted text area
    let outputElement = document.getElementById("output");
    if (outputElement) {
        outputElement.textContent = jsonOutput;
    } else {
        alert("Output container not found!");
    }

    // Optional: Provide JSON file for download
    let blob = new Blob([jsonOutput], { type: "application/json" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "signals.json";
    link.click();
}

// Attach Process Function to a Button
document.getElementById("processButton").addEventListener("click", processSignals);
