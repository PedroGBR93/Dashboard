import { showStatus } from './ui.js';
import { renderChart } from './chart.js';

export async function loadGoogleSheet(url) {
    const loadingIndicator = document.getElementById('loadingIndicator');

    if (!url) {
        showStatus('Por favor ingresa una URL válida de Google Sheet', 'error');
        return;
    }

    loadingIndicator.innerHTML = '<span class="loading"></span>';

    try {
        // Convertir URL de Google Sheet a formato CSV
        let csvUrl = url;
        if (url.includes('spreadsheets/d/')) {
            const sheetId = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)[1];
            csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        }

        // Nota: En un entorno real, necesitarías un proxy o configuración CORS
        showStatus('Simulando carga de Google Sheet...', 'info');

        // Simular carga exitosa con datos de ejemplo ampliados
        setTimeout(() => {
            const expandedData = [
                { Seccion: 'Colchones', PersonalConfigurado: 14, Licencia: 2, ApoyoPrestado: 1, Vacaciones: 1, Permisos: 0, Ausentes: 4 },
                { Seccion: 'Exportaciones', PersonalConfigurado: 4, Licencia: 0, ApoyoPrestado: 0, Vacaciones: 1, Permisos: 0, Ausentes: 1 },
                { Seccion: 'Muebles', PersonalConfigurado: 4, Licencia: 1, ApoyoPrestado: 0, Vacaciones: 0, Permisos: 1, Ausentes: 2 },
                { Seccion: 'Accesorios', PersonalConfigurado: 5, Licencia: 0, ApoyoPrestado: 1, Vacaciones: 0, Permisos: 0, Ausentes: 1 },
                { Seccion: 'Bases', PersonalConfigurado: 9, Licencia: 1, ApoyoPrestado: 0, Vacaciones: 2, Permisos: 0, Ausentes: 3 },
                { Seccion: 'Indirectos', PersonalConfigurado: 8, Licencia: 0, ApoyoPrestado: 2, Vacaciones: 1, Permisos: 1, Ausentes: 4 }
            ];

            currentData = {
                data: expandedData,
                columns: Object.keys(expandedData[0]),
                source: 'Google Sheet'
            };

            displayDataMatrix();
            showStatus('Google Sheet cargado exitosamente', 'success');
            loadingIndicator.innerHTML = '';
        }, 2000);

    } catch (error) {
        showStatus(`Error al cargar Google Sheet: ${error.message}`, 'error');
        loadingIndicator.innerHTML = '';
    }
}

export function saveState(charts) {
    localStorage.setItem('dashboardState', JSON.stringify(charts.map(c => ({
        id: c.id,
        data: c.data,
        type: c.chart.config.type,
        labelColumn: c.chart.data.labels,
        dataColumn: c.chart.data.datasets[0].data,
        wrapper: {
            width: c.wrapper.style.width,
            height: c.wrapper.style.height
        }
    }))));
}

export function loadState() {
    const savedState = localStorage.getItem('dashboardState');
    if (savedState) {
        return JSON.parse(savedState);
    }
    return [];
}

export function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;

        if (file.name.toLowerCase().endsWith('.qvd')) {
            parseQVDData(content, file.name);
.        } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
            showStatus('Procesando archivo Excel...', 'info');
            const workbook = XLSX.read(content, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const chartData = XLSX.utils.sheet_to_json(worksheet);
            renderChart('chart-1', chartData); // This needs to be improved
            showStatus('Archivo Excel procesado', 'success');
        } else {
            const chartData = Papa.parse(content, { header: true }).data;
            renderChart('chart-1', chartData); // This needs to be improved
        }
    };

    if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        reader.readAsBinaryString(file);
    } else {
        reader.readAsText(file);
    }
}
