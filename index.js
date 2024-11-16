document.addEventListener("DOMContentLoaded", async () => {
    const rawDataUrl = 'http://localhost:3000/api/raw-data';
    const statsUrl = 'http://localhost:3000/api/statistics';


    async function fetchRawData() {
        const response = await fetch(rawDataUrl);
        const data = await response.json();
        return data.data;
    }


    async function fetchStats() {
        const response = await fetch(statsUrl);
        const data = await response.json();
        return data.stats;
    }

    async function renderRawData() {
        const rawData = await fetchRawData();
        const tableBody = document.getElementById("data-table-body");
        rawData.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.temperature_inside}</td>
                <td>${item.temperature_outside}</td>
                <td>${item.humidity}</td>
                <td>${item.gas}</td>
            `;
            tableBody.appendChild(row);
        });
        renderCharts(rawData);  // Llamada a la función de gráficos después de cargar los datos
    }

    renderRawData();

    // Gráficas de Datos Crudos (Barras)
    function renderCharts(rawData) {
        new Chart(document.getElementById("temperatureInsideChart"), {
            type: 'bar',
            data: {
                labels: rawData.map((_, index) => `Muestra ${index + 1}`),
                datasets: [{
                    label: 'Temperatura Interior (°C)',
                    data: rawData.map(item => item.temperature_inside),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            }
        });

        new Chart(document.getElementById("temperatureOutsideChart"), {
            type: 'bar',
            data: {
                labels: rawData.map((_, index) => `Muestra ${index + 1}`),
                datasets: [{
                    label: 'Temperatura Exterior (°C)',
                    data: rawData.map(item => item.temperature_outside),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            }
        });

        new Chart(document.getElementById("humidityChart"), {
            type: 'bar',
            data: {
                labels: rawData.map((_, index) => `Muestra ${index + 1}`),
                datasets: [{
                    label: 'Humedad (%)',
                    data: rawData.map(item => item.humidity),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            }
        });

        new Chart(document.getElementById("gasChart"), {
            type: 'bar',
            data: {
                labels: rawData.map((_, index) => `Muestra ${index + 1}`),
                datasets: [{
                    label: 'Gas (ppm)',
                    data: rawData.map(item => item.gas),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            }
        });
    }

    // Gráficas de Estadísticas (Pastel)
    async function renderStatsCharts() {
        const stats = await fetchStats();

        new Chart(document.getElementById("temperatureInsideStatsChart"), {
            type: 'pie',
            data: {
                labels: ['Temperatura por debajo', 'Temperatura encima','dentro de los parametros'],
                datasets: [{
                    label: 'Temperatura Interior (°C)',
                    data: [stats.temperature_inside.probabilities.below_min, stats.temperature_inside.probabilities.above_max, stats.temperature_inside.probabilities.within_limits],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                }]
            }
        });

        new Chart(document.getElementById("temperatureOutsideStatsChart"), {
            type: 'pie',
            data: {
                labels: ['Temperatura por debajo', 'Temperatura encima','dentro de los parametros'],
                datasets: [{
                    label: 'Temperatura Exterior (°C)',
                    data: [stats.temperature_outside.probabilities.below_min, stats.temperature_outside.probabilities.above_max, stats.temperature_outside.probabilities.within_limits],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 159, 64, 0.6)','rgba(153, 102, 255, 0.6)'],
                }]
            }
        });

        new Chart(document.getElementById("humidityStatsChart"), {
            type: 'pie',
            data: {
                labels: ['Humedad por debajo', 'Humedad encima','dentro de los parametros'],
                datasets: [{
                    label: 'Humedad (%)',
                    data: [stats.humidity.probabilities.below_min, stats.humidity.probabilities.above_max, stats.humidity.probabilities.within_limits],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 159, 64, 0.6)','rgba(153, 102, 255, 0.6)'],
                }]
            }
        });

        new Chart(document.getElementById("gasStatsChart"), {
            type: 'pie',
            data: {
                labels: ['Gas por debajo', 'Gas encima','dentro de los parametros'],
                datasets: [{
                    label: 'Gas (ppm)',
                    data: [stats.gas.probabilities.below_min, stats.gas.probabilities.above_max, stats.gas.probabilities.within_limits],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 159, 64, 0.6)','rgba(153, 102, 255, 0.6)'],
                    width:[ '300px'],
                    height: ['100px']
                }]
            }
        });
    }

    renderStatsCharts();
     try {
        const response = await fetch('/api/movement-statistics');
        const data = await response.json();

        if (data.success) {
            // Actualizar los elementos con los datos de estadísticas
            document.getElementById('total-records').textContent = data.stats.totalRecords;
            document.getElementById('movement-count').textContent = data.stats.movementCount;
            document.getElementById('movement-probability').textContent = data.stats.movementProbability.toFixed(2);

            // Crear gráfico de barras para mostrar las estadísticas de movimiento
            const ctx = document.getElementById('movementStatsChart').getContext('2d');
            const movementStatsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Total de Registros', 'Movimientos Detectados'],
                    datasets: [{
                        label: 'Estadísticas de Movimiento',
                        data: [data.stats.totalRecords, data.stats.movementCount],
                        backgroundColor: ['#ffcc00', '#ff6666'],
                        borderColor: ['#ff9900', '#ff3333'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            console.error("Error al obtener las estadísticas");
        }
    } catch (error) {
        console.error("Error en la solicitud de estadísticas:", error);
    }
});
