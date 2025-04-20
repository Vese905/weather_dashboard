// Simple Weather Dashboard - Beginner Friendly Version

// Configuration
const config = {
    location: {
        latitude: 61.4991, // Tampere, Finland
        longitude: 23.7871,
        timezone: 'Europe/Helsinki'
    },
    apiBase: 'https://api.open-meteo.com/v1/forecast'
};

// DOM Elements
const elements = {
    views: {
        temp: document.getElementById('tempView'),
        rain: document.getElementById('rainView'),
        wind: document.getElementById('windView')
    },
    buttons: {
        temp: document.getElementById('tempBtn'),
        rain: document.getElementById('rainBtn'),
        wind: document.getElementById('windBtn')
    },
    loading: document.getElementById('loading'),
    tables: {
        temp: document.getElementById('tempData'),
        rain: document.getElementById('rainData'),
        wind: document.getElementById('windData')
    },
    stats: {
        rain: document.getElementById('rainStats'),
        wind: document.getElementById('windStats')
    },
    timeSelectors: {
        rain: document.getElementById('rainTime'),
        wind: document.getElementById('windTime')
    },
    charts: {
        rain: document.getElementById('rainChart'),
        wind: document.getElementById('windChart')
    }
};

// Chart instances
let rainChart = null;
let windChart = null;

// Initialize the dashboard
function initDashboard() {
    setupEventListeners();
    showLoading(true);
    loadTemperatureData();
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation buttons
    elements.buttons.temp.addEventListener('click', () => switchView('temp'));
    elements.buttons.rain.addEventListener('click', () => switchView('rain'));
    elements.buttons.wind.addEventListener('click', () => switchView('wind'));
    
    // Time period selectors
    elements.timeSelectors.rain.addEventListener('change', loadRainData);
    elements.timeSelectors.wind.addEventListener('change', loadWindData);
}

// Switch between views
function switchView(view) {
    // Hide all views
    Object.values(elements.views).forEach(view => view.style.display = 'none');
    
    // Show selected view
    elements.views[view].style.display = 'block';
    
    // Update active button
    Object.values(elements.buttons).forEach(btn => btn.classList.remove('active'));
    elements.buttons[view].classList.add('active');
    
    // Load data if needed
    if (view === 'rain' && elements.tables.rain.innerHTML === '') {
        loadRainData();
    } else if (view === 'wind' && elements.tables.wind.innerHTML === '') {
        loadWindData();
    }
}

// Show/hide loading spinner
function showLoading(show) {
    elements.loading.style.display = show ? 'block' : 'none';
}

// Format time for display
function formatTime(isoTime) {
    const date = new Date(isoTime);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load temperature data
async function loadTemperatureData() {
    try {
        const url = `${config.apiBase}?latitude=${config.location.latitude}&longitude=${config.location.longitude}&hourly=temperature_2m&past_days=1&timezone=${config.location.timezone}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        const temps = data.hourly.temperature_2m.slice(-20);
        const times = data.hourly.time.slice(-20);
        
        // Display in table
        elements.tables.temp.innerHTML = times.map((time, i) => `
            <tr>
                <td>${formatTime(time)}</td>
                <td>${temps[i].toFixed(1)}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        alert("Couldn't load temperature data. Please try again later.");
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Load rainfall data
async function loadRainData() {
    showLoading(true);
    const days = getDaysFromSelection(elements.timeSelectors.rain.value);
    
    try {
        const url = `${config.apiBase}?latitude=${config.location.latitude}&longitude=${config.location.longitude}&hourly=precipitation&past_days=${days}&timezone=${config.location.timezone}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        let rainData = data.hourly.precipitation;
        let timeData = data.hourly.time;
        
        // For "last 20 readings" option
        if (elements.timeSelectors.rain.value === '20') {
            rainData = rainData.slice(-20);
            timeData = timeData.slice(-20);
        }
        
        // Update chart
        updateChart('rain', timeData, rainData, 'Rainfall (mm)', 'rgba(54, 162, 235, 0.7)');
        
        // Update statistics
        updateStatistics('rain', rainData, 'mm');
        
        // Update table
        elements.tables.rain.innerHTML = timeData.map((time, i) => `
            <tr>
                <td>${formatTime(time)}</td>
                <td>${rainData[i].toFixed(1)}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        alert("Couldn't load rainfall data. Please try again later.");
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Load wind data
async function loadWindData() {
    showLoading(true);
    const days = getDaysFromSelection(elements.timeSelectors.wind.value);
    
    try {
        const url = `${config.apiBase}?latitude=${config.location.latitude}&longitude=${config.location.longitude}&hourly=windspeed_10m&past_days=${days}&timezone=${config.location.timezone}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        let windData = data.hourly.windspeed_10m;
        let timeData = data.hourly.time;
        
        // For "last 20 readings" option
        if (elements.timeSelectors.wind.value === '20') {
            windData = windData.slice(-20);
            timeData = timeData.slice(-20);
        }
        
        // Update chart
        updateChart('wind', timeData, windData, 'Wind Speed (km/h)', 'rgba(255, 99, 132, 0.7)');
        
        // Update statistics
        updateStatistics('wind', windData, 'km/h');
        
        // Update table
        elements.tables.wind.innerHTML = timeData.map((time, i) => `
            <tr>
                <td>${formatTime(time)}</td>
                <td>${windData[i].toFixed(1)}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        alert("Couldn't load wind data. Please try again later.");
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Helper function to get days from time selection
function getDaysFromSelection(value) {
    switch(value) {
        case '24': return 1;
        case '48': return 2;
        case '72': return 3;
        case '168': return 7;
        default: return 1; // Default to 1 day for '20 readings'
    }
}

// Update chart with new data
function updateChart(type, labels, data, label, color) {
    const ctx = elements.charts[type].getContext('2d');
    
    // Destroy previous chart if it exists
    if (type === 'rain' && rainChart) {
        rainChart.destroy();
    } else if (type === 'wind' && windChart) {
        windChart.destroy();
    }
    
    // Create new chart
    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(time => formatTime(time)),
            datasets: [{
                label: label,
                data: data,
                backgroundColor: color,
                borderColor: color.replace('0.7', '1'),
                borderWidth: 1,
                tension: 0.1,
                fill: true
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
    
    // Save chart instance
    if (type === 'rain') {
        rainChart = newChart;
    } else {
        windChart = newChart;
    }
}

// Calculate and display statistics
function updateStatistics(type, data, unit) {
    const stats = calculateStatistics(data);
    const container = elements.stats[type];
    
    container.innerHTML = `
        <li class="list-group-item">Average: <span class="badge bg-primary">${stats.mean.toFixed(2)} ${unit}</span></li>
        <li class="list-group-item">Median: <span class="badge bg-primary">${stats.median.toFixed(2)} ${unit}</span></li>
        <li class="list-group-item">Most Common: <span class="badge bg-primary">${stats.mode} ${unit}</span></li>
        <li class="list-group-item">Range: <span class="badge bg-primary">${stats.range.toFixed(2)} ${unit}</span></li>
        <li class="list-group-item">Min: <span class="badge bg-primary">${stats.min.toFixed(2)} ${unit}</span></li>
        <li class="list-group-item">Max: <span class="badge bg-primary">${stats.max.toFixed(2)} ${unit}</span></li>
    `;
}

// Calculate basic statistics
function calculateStatistics(data) {
    // Mean (average)
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / data.length;
    
    // Median
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    
    // Mode (most frequent)
    const frequency = {};
    let maxFreq = 0;
    let mode = [];
    
    sorted.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
        if (frequency[num] > maxFreq) {
            maxFreq = frequency[num];
            mode = [num];
        } else if (frequency[num] === maxFreq) {
            mode.push(num);
        }
    });
    
    // Range
    const range = sorted[sorted.length - 1] - sorted[0];
    
    return {
        mean,
        median,
        mode: mode.length === data.length ? 'N/A' : mode.join(', '),
        range,
        min: sorted[0],
        max: sorted[sorted.length - 1]
    };
}

// Start the dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);