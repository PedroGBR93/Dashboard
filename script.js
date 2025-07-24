// Configuración de la API de Google
const API_KEY = 'TU_API_KEY'; // REEMPLAZAR CON TU API KEY
const CLIENT_ID = 'TU_CLIENT_ID'; // REEMPLAZAR CON TU CLIENT ID
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

const addChartBtn = document.getElementById('add-chart-btn');
const dashboard = document.getElementById('dashboard');
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close-btn');
const chartForm = document.getElementById('chart-form');
const configIaBtn = document.getElementById('config-ia-btn');
const generateReportBtn = document.getElementById('generate-report-btn');
const iaConfigModal = document.getElementById('ia-config-modal');
const reportModal = document.getElementById('report-modal');
const iaConfigForm = document.getElementById('ia-config-form');
const reportContent = document.getElementById('report-content');

const closeIaConfigBtn = iaConfigModal.querySelector('.close-btn');
const closeReportBtn = reportModal.querySelector('.close-btn');

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        addChartBtn.addEventListener('click', () => {
            if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                modal.style.display = 'block';
            } else {
                gapi.auth2.getAuthInstance().signIn();
            }
        });
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        addChartBtn.textContent = 'Agregar Gráfico';
    } else {
        addChartBtn.textContent = 'Autorizar';
    }
}

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == modal || event.target == iaConfigModal || event.target == reportModal) {
        modal.style.display = 'none';
        iaConfigModal.style.display = 'none';
        reportModal.style.display = 'none';
    }
});

configIaBtn.addEventListener('click', () => {
    // Cargar configuración guardada al abrir el modal
    document.getElementById('gemini-api-key').value = localStorage.getItem('geminiApiKey') || '';
    document.getElementById('custom-prompt').value = localStorage.getItem('customPrompt') || '';
    iaConfigModal.style.display = 'block';
});

iaConfigForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const apiKey = document.getElementById('gemini-api-key').value;
    const prompt = document.getElementById('custom-prompt').value;

    localStorage.setItem('geminiApiKey', apiKey);
    localStorage.setItem('customPrompt', prompt);

    iaConfigModal.style.display = 'none';
    alert('Configuración de IA guardada.');
});

generateReportBtn.addEventListener('click', async () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    const customPrompt = localStorage.getItem('customPrompt');

    if (!apiKey) {
        alert('Por favor, configura tu clave de API de Gemini primero.');
        return;
    }

    // Recopilar datos de los gráficos
    const chartsData = [];
    document.querySelectorAll('.chart-container').forEach(container => {
        const chart = Chart.getChart(container.querySelector('canvas'));
        if (chart) {
            const chartData = {
                type: chart.config.type,
                title: chart.config.data.datasets[0].label,
                labels: chart.config.data.labels,
                values: chart.config.data.datasets[0].data,
            };
            chartsData.push(chartData);
        }
    });

    if (chartsData.length === 0) {
        alert('No hay gráficos en el dashboard para generar un informe.');
        return;
    }

    // Construir el prompt para Gemini
    const dataString = chartsData.map(c =>
        `Gráfico de tipo '${c.type}' titulado '${c.title}':\n` +
        c.labels.map((label, i) => `- ${label}: ${c.values[i]}`).join('\n')
    ).join('\n\n');

    const fullPrompt = `${customPrompt}\n\nAquí están los datos:\n${dataString}`;

    // Llamar a la API de Gemini
    reportContent.textContent = 'Generando informe...';
    reportModal.style.display = 'block';

    try {
        const response = await callGeminiApi(apiKey, fullPrompt);
        reportContent.textContent = response;
    } catch (error) {
        console.error('Error al llamar a la API de Gemini:', error);
        reportContent.textContent = 'Error al generar el informe. Revisa la consola para más detalles.';
    }
});

async function callGeminiApi(apiKey, prompt) {
    // Esta es una implementación simulada. Necesitarás reemplazarla con una llamada real a la API de Gemini.
    // La implementación exacta dependerá de cómo estés alojando y autenticando tu aplicación.
    // A continuación se muestra un ejemplo conceptual usando fetch.

    const GEMINI_API_ENDPOINT = 'TU_ENDPOINT_DE_GEMINI_AQUI'; // Ej: https://us-central1-aiplatform.googleapis.com/v1/projects/tu-proyecto/locations/us-central1/publishers/google/models/gemini-pro:streamGenerateContent

    const response = await fetch(GEMINI_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error de la API: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    // La estructura de la respuesta puede variar. Ajústala según la respuesta real de la API.
    return data.candidates[0].content.parts[0].text;
}

closeIaConfigBtn.addEventListener('click', () => {
    iaConfigModal.style.display = 'none';
});

closeReportBtn.addEventListener('click', () => {
    reportModal.style.display = 'none';
});

chartForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const chartType = event.target['chart-type'].value;
    const spreadsheetUrl = event.target['spreadsheet-url'].value;
    const range = event.target['sheet-range'].value;

    const spreadsheetId = extractSpreadsheetIdFromUrl(spreadsheetUrl);

    if (spreadsheetId) {
        obtenerDatosDeSheet(spreadsheetId, range, chartType);
        modal.style.display = 'none';
        chartForm.reset();
    } else {
        alert('URL de Google Sheet no válida.');
    }
});

function extractSpreadsheetIdFromUrl(url) {
    const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

function obtenerDatosDeSheet(spreadsheetId, range, chartType) {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
    }).then((response) => {
        const data = response.result.values;
        if (data && data.length > 0) {
            crearGrafico(data, chartType);
        } else {
            console.error('No se encontraron datos.');
        }
    }, (response) => {
        console.error('Error: ' + response.result.error.message);
        alert('Error al obtener datos de Google Sheets: ' + response.result.error.message);
    });
}

function crearGrafico(data, chartType) {
    const chartContainer = document.createElement('div');
    chartContainer.classList.add('chart-container');

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => {
        chartContainer.remove();
    });
    chartContainer.appendChild(deleteBtn);

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    dashboard.appendChild(chartContainer);

    const labels = data.slice(1).map(row => row[0]);
    const values = data.slice(1).map(row => row[1]);
    const datasetLabel = data[0][1];

    new Chart(canvas, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: datasetLabel,
                data: values,
                backgroundColor: '#c0392b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

const qvdFileInput = document.getElementById('qvd-file-input');

qvdFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const data = parseCSV(text);
            if (data && data.length > 0) {
                // Por ahora, crea un gráfico de barras por defecto
                crearGrafico(data, 'bar');
            } else {
                console.error('No se pudieron analizar los datos del archivo.');
                alert('No se pudieron analizar los datos del archivo. Asegúrese de que sea un CSV válido.');
            }
        };
        reader.readAsText(file);
    }
});

function parseCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    return lines.map(line => line.split(','));
}

window.onload = function() {
    handleClientLoad();
    new Sortable(dashboard, {
        animation: 150,
        ghostClass: 'sortable-ghost'
    });
}
