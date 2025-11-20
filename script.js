/* script.js - Weather Forecast App
   Replace API_KEY with your OpenWeatherMap API key.
   IMPORTANT: regenerate a new key on OpenWeatherMap (do not use keys that were shared publicly).
*/

const API_KEY = "3c2ba77afad9f1dc3a62ce1d090987b1"; // <<< PUT YOUR NEW KEY HERE

// DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const recentDropdown = document.getElementById('recentDropdown');
const messageContainer = document.getElementById('messageContainer');

const currentCard = document.getElementById('currentCard');
const cityNameEl = document.getElementById('cityName');
const dateText = document.getElementById('dateText');
const tempToday = document.getElementById('tempToday');
const tempUnit = document.getElementById('tempUnit');
const descriptionEl = document.getElementById('description');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const feelsLikeEl = document.getElementById('feelsLike');

const unitToggle = document.getElementById('unitToggle');
const forecastContainer = document.getElementById('forecastContainer');
const appBody = document.getElementById('appBody');
const currentIconWrap = document.getElementById('currentIconWrap');

let currentData = null;
let isMetric = true; // today display unit
let recentCities = [];

/* ---------- Utilities ---------- */
function clearMessage() { messageContainer.innerHTML = ''; }

function showMessage(text, type='error') {
  // type: 'error' or 'success'
  const colorClass = type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800';
  messageContainer.innerHTML = `
    <div role="alert" class="${colorClass} border px-4 py-3 rounded-md flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="font-semibold">${type === 'error' ? 'Error' : 'Success'}</span>
        <span class="text-sm">${text}</span>
      </div>
      <button id="closeMsg" aria-label="Close message" class="ml-4 text-lg font-bold leading-none">✕</button>
    </div>
  `;
  const closeBtn = document.getElementById('closeMsg');
  if (closeBtn) closeBtn.addEventListener('click', () => { messageContainer.innerHTML = ''; });
}

function formatDateFromUnix(unix, tzOffsetSeconds=0) {
  const d = new Date((unix + tzOffsetSeconds) * 1000);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function cToF(c) { return (c * 9/5) + 32; }
function round(n) { return Math.round(n * 10) / 10; }

/* ---------- Local storage: recent cities ---------- */
function loadRecentCities() {
  const raw = localStorage.getItem('recentCities');
  recentCities = raw ? JSON.parse(raw) : [];
  renderRecentDropdown();
}

function saveToRecent(city) {
  city = city.trim();
  recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
  recentCities.unshift(city);
  if (recentCities.length > 8) recentCities.pop();
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
  renderRecentDropdown();
}

function renderRecentDropdown() {
  recentDropdown.innerHTML = '';
  if (recentCities.length === 0) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = 'No recent searches';
    recentDropdown.appendChild(o);
    return;
  }
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Select a recent city';
  recentDropdown.appendChild(defaultOpt);

  recentCities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    recentDropdown.appendChild(opt);
  });
  recentDropdown.selectedIndex = 0;
}

/* ---------- API functions ---------- */
async function geocodeCity(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  let res;
  try {
    res = await fetch(url);
  } catch (networkErr) {
    throw new Error('Network error while calling geocoding API. Check your connection.');
  }
  if (!res.ok) {
    // try parse body
    let body = '';
    try { body = await res.text(); } catch(e) {}
    if (res.status === 401) throw new Error('Invalid API key. Please check your OpenWeatherMap key.');
    if (res.status === 429) throw new Error('Rate limit exceeded. Try again later.');
    throw new Error(`Geocoding failed (status ${res.status}). ${body}`);
  }
  const data = await res.json();
  if (!data || data.length === 0) throw new Error('City not found. Try a different name or specify "City,CountryCode".');
  return data[0];
}

async function fetchWeatherByLatLon(lat, lon) {
  // OneCall endpoint (units=metric)
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${API_KEY}&units=metric`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error('Network error while fetching weather data.');
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key for weather API.');
    throw new Error(`Weather API error: status ${res.status}`);
  }
  const data = await res.json();
  return data;
}

/* ---------- Icons (inline SVG small icons) ---------- */
const ICON_SVG = {
  temp: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 14.76V6a2 2 0 10-4 0v8.76a4 4 0 104 0z"/></svg>`,
  wind: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h13a4 4 0 100-8 4 4 0 010 8H5"/></svg>`,
  humidity: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2s5 5.5 5 9a5 5 0 11-10 0c0-3.5 5-9 5-9z"/></svg>`
};

/* ---------- Background handling (robust) ---------- */
function applyBackground(main, tempC) {
  const body = appBody;
  const bgClasses = ['bg-blue-200','bg-gray-200','bg-yellow-100','bg-orange-200','bg-sky-100'];
  bgClasses.forEach(c => body.classList.remove(c));
  main = (main || '').toLowerCase();
  if (main.includes('rain') || main.includes('drizzle')) {
    body.classList.add('bg-blue-200');
  } else if (main.includes('cloud')) {
    body.classList.add('bg-gray-200');
  } else if (main.includes('clear')) {
    body.classList.add('bg-yellow-100');
  } else if (tempC >= 40) {
    body.classList.add('bg-orange-200');
  } else {
    body.classList.add('bg-sky-100');
  }
}

/* ---------- Rendering ---------- */
function renderCurrent(data, locationName) {
  currentData = data;
  currentCard.classList.remove('hidden');
  const tzOffset = data.timezone_offset || 0;

  cityNameEl.textContent = locationName;
  dateText.textContent = formatDateFromUnix(data.current.dt, tzOffset);
  descriptionEl.textContent = data.current.weather?.[0]?.description || '';

  humidityEl.textContent = `${data.current.humidity} %`;
  windEl.textContent = `${data.current.wind_speed} m/s`;
  feelsLikeEl.textContent = `${round(data.current.feels_like)} °C`;

  const tempC = data.current.temp;
  tempToday.textContent = isMetric ? round(tempC) : round(cToF(tempC));
  tempUnit.textContent = isMetric ? '°C' : '°F';

  // current icon
  const iconCode = data.current.weather?.[0]?.icon;
  const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;
  if (iconUrl) {
    currentIconWrap.innerHTML = `<img id="currentIcon" src="${iconUrl}" alt="${data.current.weather?.[0]?.main || 'weather'}" class="w-14 h-14">`;
    currentIconWrap.classList.remove('hidden');
  } else {
    currentIconWrap.innerHTML = '';
    currentIconWrap.classList.add('hidden');
  }

  const main = data.current.weather?.[0]?.main?.toLowerCase() || '';
  applyBackground(main, data.current.temp);

  // temp alert
  if (data.current.temp >= 40) {
    showMessage(`Heat alert: temperature is ${round(data.current.temp)}°C — take precautions!`, 'error');
  } else if (data.current.temp <= -10) {
    showMessage(`Cold alert: temperature is ${round(data.current.temp)}°C — dress warmly!`, 'error');
  }
}

function renderForecast(data) {
  forecastContainer.innerHTML = '';
  const tzOffset = data.timezone_offset || 0;
  const days = data.daily.slice(0, 5);
  days.forEach(day => {
    const iconCode = day.weather?.[0]?.icon;
    const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';

    const dayTemp = round(day.temp.day);

    const card = document.createElement('div');
    card.className = 'p-3 rounded-lg bg-white shadow-sm text-center flex flex-col items-center justify-between';
    card.innerHTML = `
      <div class="w-full">
        <div class="font-medium text-sm">${formatDateFromUnix(day.dt, tzOffset)}</div>
        <div class="text-xs text-gray-500 mt-1 truncate">${day.weather?.[0]?.main || ''} - ${day.weather?.[0]?.description || ''}</div>
      </div>

      <div class="mt-2 flex items-center gap-2">
        ${iconUrl ? `<img src="${iconUrl}" alt="${day.weather?.[0]?.main || 'icon'}" class="w-12 h-12">` : ''}
        <div class="text-lg font-bold">${dayTemp} °C</div>
      </div>

      <div class="w-full mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div class="flex items-center justify-center">${ICON_SVG.temp}<span>${round(day.temp.day)}°</span></div>
        <div class="flex items-center justify-center">${ICON_SVG.wind}<span>${day.wind_speed} m/s</span></div>
        <div class="flex items-center justify-center">${ICON_SVG.humidity}<span>${day.humidity}%</span></div>
      </div>
    `;
    forecastContainer.appendChild(card);
  });
}

/* ---------- Event handlers ---------- */
async function handleSearch() {
  clearMessage();
  const city = cityInput.value.trim();
  if (!city) {
    showMessage('Please enter a city name', 'error');
    return;
  }
  try {
    searchBtn.disabled = true;
    const geo = await geocodeCity(city);
    const weather = await fetchWeatherByLatLon(geo.lat, geo.lon);
    renderCurrent(weather, `${geo.name}${geo.state ? ', ' + geo.state : ''}, ${geo.country}`);
    renderForecast(weather);
    saveToRecent(`${geo.name}${geo.state ? ', ' + geo.state : ''}`);
  } catch (err) {
    showMessage(err.message || 'Error fetching weather', 'error');
  } finally {
    searchBtn.disabled = false;
  }
}

async function handleLocation() {
  clearMessage();
  if (!navigator.geolocation) {
    showMessage('Geolocation not supported in this browser', 'error');
    return;
  }
  try {
    locationBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const weather = await fetchWeatherByLatLon(lat, lon);
        renderCurrent(weather, `Your location`);
        renderForecast(weather);
      } catch (err) {
        showMessage('Failed to fetch weather for current location', 'error');
      } finally {
        locationBtn.disabled = false;
      }
    }, (err) => {
      showMessage('Permission denied or unable to get location', 'error');
      locationBtn.disabled = false;
    }, { enableHighAccuracy: false, maximumAge: 120000 });
  } catch (err) {
    showMessage('Error fetching current location', 'error');
    locationBtn.disabled = false;
  }
}

function handleUnitToggle() {
  if (!currentData) {
    showMessage('No weather loaded to toggle unit', 'error');
    return;
  }
  isMetric = !isMetric;
  const tempC = currentData.current.temp;
  tempToday.textContent = isMetric ? round(tempC) : round(cToF(tempC));
  tempUnit.textContent = isMetric ? '°C' : '°F';
  unitToggle.setAttribute('aria-pressed', (!isMetric).toString());
}

async function handleRecentChange() {
  const city = recentDropdown.value;
  if (!city) return;
  cityInput.value = city;
  await handleSearch();
}

/* ---------- Validation ---------- */
function validateCityInput(txt) {
  if (!txt || txt.trim().length === 0) return false;
  // allow letters, spaces, hyphens, commas, periods
  return /^[a-zA-Z\s\-,.]+$/.test(txt);
}

/* ---------- Listeners ---------- */
searchBtn.addEventListener('click', async () => {
  if (!validateCityInput(cityInput.value)) {
    showMessage('Invalid city name. Use letters, spaces, commas only.', 'error');
    return;
  }
  await handleSearch();
});

cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtn.click(); });

locationBtn.addEventListener('click', handleLocation);
unitToggle.addEventListener('click', handleUnitToggle);
recentDropdown.addEventListener('change', handleRecentChange);

/* ---------- Init ---------- */
loadRecentCities();

/* ---------- Helper: Celsius to Fahrenheit ---------- */
function cToF(c) { return (c * 9/5) + 32; }
