import { addNewChart, getCharts, removeChart, changeChartType, renderChart } from './chart.js';
import { loadGoogleSheet, handleFileUpload, saveState, loadState } from './api.js';

export function initializeApp() {
    initializeDragAndDrop();
    const savedCharts = loadState();
    if (savedCharts.length > 0) {
        savedCharts.forEach(chartData => {
            addNewChart(chartData.dataSource);
            const chart = getCharts().find(c => c.id === chartData.id);
            chart.chart.config.type = chartData.type;
            chart.chart.data.labels = chartData.labelColumn;
            chart.chart.data.datasets[0].data = chartData.dataColumn;
            chart.wrapper.style.width = chartData.wrapper.width;
            chart.wrapper.style.height = chartData.wrapper.height;
            chart.chart.update();
        });
    } else {
        loadSampleData();
    }
    document.getElementById('floating-add-btn').addEventListener('click', openNewChartModal);
    document.getElementById('new-chart-add').addEventListener('click', addNewChartFromModal);
    document.getElementById('new-chart-cancel').addEventListener('click', closeNewChartModal);
    document.getElementById('config-chart-update').addEventListener('click', updateChartConfig);
    document.getElementById('config-chart-filter').addEventListener('click', openFilterModal);
    document.getElementById('config-chart-cancel').addEventListener('click', closeChartConfigModal);
    document.getElementById('filter-apply').addEventListener('click', applyFilters);
    document.getElementById('filter-cancel').addEventListener('click', closeFilterModal);
    document.getElementById('generate-report').addEventListener('click', generateReport);
    document.getElementById('load-google-sheet').addEventListener('click', () => {
        const url = document.getElementById('sheetUrl').value;
        loadGoogleSheet(url);
    });
    document.getElementById('csvFile').addEventListener('change', handleFileUpload);
    document.getElementById('excelFile').addEventListener('change', handleFileUpload);
}

export function showStatus(message, type = 'info') {
    const statusContainer = document.getElementById('statusMessages');
    const statusElement = document.createElement('div');
    statusElement.className = `status-message status-${type}`;

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    statusElement.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    statusContainer.appendChild(statusElement);

    setTimeout(() => {
        statusElement.remove();
    }, 5000);
}

function initializeDragAndDrop() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');

    uploadAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('drag-over');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('drag-over');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload({ target: { files } });
            }
        });
    });
}

function loadSampleData() {
    const sampleData = [
        { Seccion: 'Colchones', PersonalConfigurado: 14, Licencia: 0, ApoyoPrestado: 0, Vacaciones: 0, Permisos: 0, Ausentes: 0 },
        { Seccion: 'Exportaciones', PersonalConfigurado: 4, Licencia: 0, ApoyoPrestado: 0, Vacaciones: 0, Permisos: 0, Ausentes: 0 },
        { Seccion: 'Muebles', PersonalConfigurado: 4, Licencia: 0, ApoyoPrestado: 0, Vacaciones: 0, Permisos: 0, Ausentes: 0 },
        { Seccion: 'Accesorios', PersonalConfigurado: 5, Licencia: 0, ApoyoPrestado: 0, Vacaciones: 0, Permisos: 0, Ausentes: 0 },
        { Seccion: 'Bases', PersonalConfigurado: 9, Licencia: 0, ApoyoPrestado: 0, Vacaciones: 0, Permisos: 0, Ausentes: 0 },
        { Seccion: 'Indirectos', PersonalConfigurado: 8, Licencia: 0, ApoyoPrestado: 0, Vacaciones: 0, Permisos: 0, Ausentes: 0 }
    ];

    window.currentData = {
        data: sampleData,
        columns: Object.keys(sampleData[0]),
        source: 'Datos de ejemplo'
    };

    displayDataMatrix();
    showStatus('Datos de ejemplo cargados', 'info');
}

function displayDataMatrix() {
    // This function needs to be implemented
}

function openNewChartModal() {
    document.getElementById('newChartModal').style.display = 'block';
}

function closeNewChartModal() {
    document.getElementById('newChartModal').style.display = 'none';
}

function addNewChartFromModal() {
    const urlInput = document.getElementById('chartDataSourceUrl');
    const fileInput = document.getElementById('chartDataSourceFile');
    let dataSource = null;

    if (urlInput.value) {
        dataSource = { type: 'url', value: urlInput.value };
    } else if (fileInput.files.length > 0) {
        dataSource = { type: 'file', value: fileInput.files[0] };
    } else {
        showStatus('Por favor, ingrese una URL o seleccione un archivo.', 'error');
        return;
    }

    addNewChart(dataSource);
    closeNewChartModal();
}

function openChartConfigModal(chartId) {
    const charts = getCharts();
    const chartInfo = charts.find(c => c.id === chartId);
    if (!chartInfo) return;

    const { data } = chartInfo;
    const columns = Object.keys(data[0]);

    const labelColumnSelector = document.getElementById('labelColumn');
    const dataColumnSelector = document.getElementById('dataColumn');
    labelColumnSelector.innerHTML = '';
    dataColumnSelector.innerHTML = '';

    columns.forEach(column => {
        const option1 = document.createElement('option');
        option1.value = column;
        option1.textContent = column;
        labelColumnSelector.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = column;
        option2.textContent = column;
        dataColumnSelector.appendChild(option2);
    });

    document.getElementById('configChartId').value = chartId;
    document.getElementById('configChartModal').style.display = 'block';
}

function closeChartConfigModal() {
    document.getElementById('configChartModal').style.display = 'none';
}

function updateChartConfig() {
    const chartId = document.getElementById('configChartId').value;
    const labelColumn = document.getElementById('labelColumn').value;
    const dataColumn = document.getElementById('dataColumn').value;
    const charts = getCharts();
    const chartInfo = charts.find(c => c.id === chartId);
    if (!chartInfo) return;

    const { chart, data } = chartInfo;

    chart.data.labels = data.map(row => row[labelColumn]);
    chart.data.datasets[0].data = data.map(row => parseFloat(row[dataColumn]));
    chart.update();

    saveState(getCharts());
    closeChartConfigModal();
}

function openFilterModal() {
    const chartId = document.getElementById('configChartId').value;
    const charts = getCharts();
    const chartInfo = charts.find(c => c.id === chartId);
    if (!chartInfo) return;

    const { data } = chartInfo;
    const columns = Object.keys(data[0]);
    const filterContainer = document.getElementById('filter-container');
    filterContainer.innerHTML = '';

    columns.forEach(column => {
        const filterGroup = document.createElement('div');
        filterGroup.className = 'form-group';
        const label = document.createElement('label');
        label.textContent = `Filtro para "${column}":`;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `filter-${column}`;
        input.placeholder = `Valor para ${column}`;
        filterGroup.appendChild(label);
        filterGroup.appendChild(input);
        filterContainer.appendChild(filterGroup);
    });

    document.getElementById('filterModal').style.display = 'block';
}

function closeFilterModal() {
    document.getElementById('filterModal').style.display = 'none';
}

function applyFilters() {
    const chartId = document.getElementById('configChartId').value;
    const charts = getCharts();
    const chartInfo = charts.find(c => c.id === chartId);
    if (!chartInfo) return;

    const { data } = chartInfo;
    let filteredData = [...data];

    const columns = Object.keys(data[0]);
    columns.forEach(column => {
        const filterValue = document.getElementById(`filter-${column}`).value;
        if (filterValue) {
            filteredData = filteredData.filter(row => {
                return row[column].toString().toLowerCase().includes(filterValue.toLowerCase());
            });
        }
    });

    const labelColumn = document.getElementById('labelColumn').value;
    const dataColumn = document.getElementById('dataColumn').value;

    chartInfo.chart.data.labels = filteredData.map(row => row[labelColumn]);
    chartInfo.chart.data.datasets[0].data = filteredData.map(row => parseFloat(row[dataColumn]));
    chartInfo.chart.update();

    saveState(getCharts());
    closeFilterModal();
    closeChartConfigModal();
}

async function generateReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;
    const charts = getCharts();

    for (let i = 0; i < charts.length; i++) {
        const chartInfo = charts[i];
        const canvas = chartInfo.chart.canvas;
        const chartTitle = chartInfo.chart.options.plugins.title.text;

        doc.text(chartTitle, 10, y);
        y += 10;

        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 20;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (y + pdfHeight > doc.internal.pageSize.getHeight() - 10) {
            doc.addPage();
            y = 10;
        }

        doc.addImage(imgData, 'PNG', 10, y, pdfWidth, pdfHeight);
        y += pdfHeight + 10;
    }

    doc.save('dashboard-report.pdf');
}
