import { showStatus } from './ui.js';
import { saveState } from './api.js';

let charts = [];
let chartCounter = 0;

export function getCharts() {
    return charts;
}

export function addNewChart(dataSource) {
    chartCounter++;
    const chartId = `chart-${chartCounter}`;

    const chartCard = document.createElement('div');
    chartCard.className = 'chart-card';
    chartCard.id = chartId;

    chartCard.innerHTML = `
        <div class="chart-card-header">
            <h3 class="chart-title">
                <i class="fas fa-chart-pie"></i>
                Gráfico ${chartCounter}
            </h3>
            <div class="chart-options">
                <select onchange="changeChartType('${chartId}', this.value)">
                    <option value="bar">Barras</option>
                    <option value="line">Líneas</option>
                    <option value="pie">Torta</option>
                </select>
                <button class="remove-chart-btn" onclick="removeChart('${chartId}')">
                    <i class="fas fa-times"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="openChartConfigModal('${chartId}')">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </div>
        <div class="chart-canvas-wrapper">
            <canvas></canvas>
        </div>
    `;

    document.getElementById('chartsContainer').appendChild(chartCard);

    let chartData;
    if (dataSource.type === 'url') {
        try {
            let csvUrl = dataSource.value;
            if (csvUrl.includes('spreadsheets/d/')) {
                const sheetId = csvUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)[1];
                csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            }
            fetch(csvUrl)
                .then(response => response.text())
                .then(text => {
                    chartData = Papa.parse(text, { header: true }).data;
                    renderChart(chartId, chartData);
                });
        } catch (error) {
            showStatus(`Error al cargar datos desde la URL: ${error.message}`, 'error');
            return;
        }
    } else { // 'file'
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            if (dataSource.value.name.toLowerCase().endsWith('.csv') || dataSource.value.name.toLowerCase().endsWith('.txt')) {
                chartData = Papa.parse(content, { header: true }).data;
            } else if (dataSource.value.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
                const workbook = XLSX.read(content, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                chartData = XLSX.utils.sheet_to_json(worksheet);
            } else {
                showStatus('Formato de archivo no soportado para gráficos.', 'error');
                return;
            }
            renderChart(chartId, chartData);
        };
        if (dataSource.value.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
            reader.readAsBinaryString(dataSource.value);
        } else {
            reader.readAsText(dataSource.value);
        }
        return; // renderChart will be called from onload
    }
}

export function renderChart(chartId, data) {
    const chartCard = document.getElementById(chartId);
    const canvas = chartCard.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const labels = data.map(row => row[Object.keys(row)[0]]);
    const values = data.map(row => parseFloat(row[Object.keys(row)[1]]));

    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Datos del Gráfico',
                data: values,
                backgroundColor: 'rgba(220, 38, 38, 0.6)',
                borderColor: 'rgba(220, 38, 38, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value, index, values) {
                            if (value >= 0 && value <= 1) {
                                return value.toLocaleString(undefined, {style: 'percent'});
                            }
                            return value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.parsed.y >= 0 && context.parsed.y <= 1) {
                                    label += context.parsed.y.toLocaleString(undefined, {style: 'percent', minimumFractionDigits: 2});
                                } else {
                                    label += context.parsed.y;
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    const chartWrapper = chartCard.querySelector('.chart-canvas-wrapper');
    charts.push({
        id: chartId,
        chart: newChart,
        data: data,
        dataSource: null, // Will be added later
        wrapper: chartWrapper
    });

    new ResizeObserver(entries => {
        for (let entry of entries) {
            newChart.resize();
        }
    }).observe(chartWrapper);
}

import { saveState } from './api.js';

export function removeChart(chartId) {
    const chartIndex = charts.findIndex(c => c.id === chartId);
    if (chartIndex > -1) {
        charts[chartIndex].chart.destroy();
        charts.splice(chartIndex, 1);
        document.getElementById(chartId).remove();
        saveState(charts);
    }
}

export function changeChartType(chartId, type) {
    const chartInfo = charts.find(c => c.id === chartId);
    if (chartInfo) {
        chartInfo.chart.config.type = type;
        chartInfo.chart.update();
        saveState(charts);
    }
}
