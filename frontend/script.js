// frontend/script.js

let currentCity = 'mumbai';

// 1. Initialize Map centered on Mumbai (supports switching to Mysore)
const map = L.map('map').setView([19.0760, 72.8777], 11);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CartoDB'
}).addTo(map);

function setCity(city) {
    currentCity = city;
    if (city === 'mumbai') {
        map.setView([19.0760, 72.8777], 11);
    } else {
        map.setView([12.3050, 76.6550], 12);
    }
    runSimulation();
}

// Update slider text in real time
const slider = document.getElementById('budgetSlider');
const budgetDisplay = document.getElementById('budgetValue');
if (slider && budgetDisplay) {
    slider.oninput = function() {
        budgetDisplay.innerHTML = "₹" + parseInt(this.value).toLocaleString('en-IN');
    }
}

// Map layer group for wards
let wardLayerGroup = L.layerGroup().addTo(map);

// 2. Fetch Optimization Data
async function runSimulation() {
    const budget = slider ? parseInt(slider.value) : 5000000;
    
    try {
        const response = await fetch('http://127.0.0.1:8000/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: currentCity, budget: budget })
        });
        
        const data = await response.json();
        updateDashboard(data);
        drawMap(data.wards);
    } catch (error) {
        console.error("API Error - Make sure backend is running:", error);
    }
}

// 3. Update Dashboard Stats & Table
function updateDashboard(data) {
    const statBefore = document.getElementById('stat-before');
    if (statBefore) statBefore.innerText = data.summary.top5_hmri_before || data.summary.avg_hmri_before;
    const statAfter = document.getElementById('stat-after');
    if (statAfter) statAfter.innerText = data.summary.top5_hmri_after || data.summary.avg_hmri_after;
    const statRed = document.getElementById('stat-reduction');
    if (statRed) statRed.innerText = `-${data.summary.city_risk_reduction_pct || data.summary.reduction_pct}%`;
    const statUnspent = document.getElementById('stat-unspent');
    if (statUnspent) statUnspent.innerText = "₹" + (data.summary.unspent_budget || data.summary.unspent || 0).toLocaleString('en-IN');

    const tbody = document.getElementById('actions-table');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    data.wards.slice(0, 8).forEach(ward => {
        if(ward.actions !== "None") {
            const drop = (ward.hmri_before_actions - ward.hmri_after_actions).toFixed(1);
            tbody.innerHTML += `
                <tr class="bg-white">
                    <td class="px-4 py-3 font-bold">${ward.ward_id}</td>
                    <td class="px-4 py-3 text-green-600 font-semibold">-${drop}</td>
                    <td class="px-4 py-3">${ward.actions}</td>
                </tr>
            `;
        }
    });
}

// 4. Draw Heatmap Wards
let cachedMysoreGeoJson = null;

async function drawMap(wardsData) {
    wardLayerGroup.clearLayers();
    
    if (currentCity === 'mysore') {
        if (!cachedMysoreGeoJson) {
            try {
                const res = await fetch('mysore-wards.geojson');
                cachedMysoreGeoJson = await res.json();
            } catch(e) {}
        }
        if (cachedMysoreGeoJson) {
            const predMap = new Map();
            wardsData.forEach(w => predMap.set(w.ward_id, w));
            L.geoJSON(cachedMysoreGeoJson, {
                style: function(f) {
                    const matched = predMap.get(f.properties.ward_id) || {};
                    const hmri = matched.hmri_after_actions || 40;
                    const color = hmri >= 75 ? '#ef4444' : (hmri >= 45 ? '#f59e0b' : (hmri >= 25 ? '#eab308' : '#10b981'));
                    return { color: 'white', weight: 1.5, fillColor: color, fillOpacity: 0.65 };
                },
                onEachFeature: function(f, layer) {
                    const matched = predMap.get(f.properties.ward_id);
                    if (matched) {
                        layer.bindPopup(`
                            <div class="p-2 text-xs">
                                <h3 class="font-bold text-sm mb-1">Ward ${matched.ward_id} (${matched.area_name || ''})</h3>
                                <p>Tin Roof Density: <b>${Math.round(matched.tin_roof_pct)}%</b></p>
                                <p>HMRI Before: <b>${Number(matched.hmri_before_actions).toFixed(1)}</b></p>
                                <p>HMRI After: <b>${Number(matched.hmri_after_actions).toFixed(1)}</b></p>
                                <hr class="my-1 border-gray-300">
                                <p class="text-xs text-amber-700">Actions: ${matched.actions}</p>
                            </div>
                        `);
                    }
                }
            }).addTo(wardLayerGroup);
            return;
        }
    }

    wardsData.forEach((ward, index) => {
        const lat = ward.lat || (currentCity === 'mumbai' ? 18.92 + (index % 6) * 0.04 : 12.28 + (index % 4) * 0.03);
        const lon = ward.lon || (currentCity === 'mumbai' ? 72.82 + Math.floor(index / 6) * 0.04 : 76.63 + Math.floor(index / 4) * 0.03);
        const bounds = [[lat - 0.015, lon - 0.015], [lat + 0.015, lon - 0.015], [lat + 0.015, lon + 0.015], [lat - 0.015, lon + 0.015]];

        // Color intensity based on HMRI *after* actions
        const hmri = ward.hmri_after_actions;
        let color = hmri >= 75 ? '#ef4444' : (hmri >= 45 ? '#f59e0b' : (hmri >= 25 ? '#eab308' : '#10b981'));

        const polygon = L.polygon(bounds, {
            color: 'white',
            weight: 1,
            fillColor: color,
            fillOpacity: 0.65
        });

        // Clickable popup showing vulnerability breakdown
        const popupContent = `
            <div class="p-2 text-xs">
                <h3 class="font-bold text-sm mb-1">Ward ${ward.ward_id} (${ward.area_name || ''})</h3>
                <p>Tin Roof Density: <b>${Math.round(ward.tin_roof_pct)}%</b></p>
                <p>HMRI Before: <b>${Number(ward.hmri_before_actions).toFixed(1)}</b></p>
                <p>HMRI After: <b>${Number(ward.hmri_after_actions).toFixed(1)}</b></p>
                <hr class="my-1 border-gray-300">
                <p class="text-xs text-amber-700">Actions: ${ward.actions}</p>
            </div>
        `;
        
        polygon.bindPopup(popupContent);
        wardLayerGroup.addLayer(polygon);
    });
}

// Run initial simulation on page load
window.onload = runSimulation;
