/* script.js - Weather Forecast App
   Replace API_KEY with your OpenWeatherMap API key.
   IMPORTANT: regenerate a new key on OpenWeatherMap (do not use keys that were shared publicly).
*/

/* script.js - Weather Forecast App (FREE API version)
   Uses ONLY free OpenWeatherMap APIs:
   - Geocoding (free)
   - Current Weather (free)
   - 5-day Forecast (free)
*/

const API_KEY = "3c2ba77afad9f1dc3a62ce1d090987b1";

// DOM elements
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
let isMetric = true;
let recentCities = [];

/* ---------- Utilities ---------- */
function clearMessage() { messageContainer.innerHTML = ''; }

function showMessage(text, type='error') {
  const colorClass = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-green-50 border-green-200 text-green-800';

  messageContainer.innerHTML = `
    <div class="${colorClass} border px-4 py-3 rounded-md flex justify-between">
      <span>${text}</span>
      <button onclick="clearMessage()">✕</button>
    </div>
  `;
}

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
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
    recentDropdown.innerHTML = `<option>No recent searches</option>`;
    return;
  }

  recentDropdown.innerHTML += `<option value="">Select recent city</option>`;
  recentCities.forEach(city => {
    recentDropdown.innerHTML += `<option value="${city}">${city}</option>`;
  });
}

/* ---------- API Calls (FREE) ---------- */

// 1. Geocoding API (city → lat/lon)
async function geocodeCity(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Invalid API key or network error");
  
  const data = await res.json();
  if (!data || data.length === 0) throw new Error("City not found");
  
  return data[0];
}

// 2. Current Weather API (FREE)
async function fetchCurrentWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Failed to load current weather");

  return await res.json();
}

// 3. 5-Day Forecast API (FREE)
async function fetchForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Failed to load forecast");

  return await res.json();
}

/* ---------- Render Current Weather ---------- */
function renderCurrentWeather(data, name) {
  currentData = data;
  currentCard.classList.remove("hidden");

  cityNameEl.textContent = name;
  dateText.textContent = formatDate(data.dt);
  descriptionEl.textContent = data.weather[0].description;

  humidityEl.textContent = data.main.humidity + " %";
  windEl.textContent = data.wind.speed + " m/s";
  feelsLikeEl.textContent = round(data.main.feels_like) + " °C";

  const tempC = data.main.temp;
  tempToday.textContent = isMetric ? round(tempC) : round(cToF(tempC));
  tempUnit.textContent = isMetric ? "°C" : "°F";

  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  currentIconWrap.innerHTML = `<img src="${iconUrl}" class="w-14 h-14">`;

  applyBackground(data.weather[0].main.toLowerCase(), data.main.temp);
}

/* ---------- Render FREE Forecast (5 days) ---------- */
function renderForecast(data) {
  forecastContainer.innerHTML = '';

  // group by day
  const dailyMap = {};
  data.list.forEach(item => {
    const day = item.dt_txt.split(" ")[0];
    if (!dailyMap[day]) dailyMap[day] = [];
    dailyMap[day].push(item);
  });

  const days = Object.keys(dailyMap).slice(0, 5);

  days.forEach(day => {
    const entries = dailyMap[day];
    const mid = entries[Math.floor(entries.length / 2)];

    const date = formatDate(mid.dt);
    const temp = round(mid.main.temp);
    const icon = mid.weather[0].icon;

    const card = document.createElement("div");
    card.className = "p-3 rounded-lg bg-white shadow-sm text-center";

    card.innerHTML = `
      <div class="font-medium">${date}</div>
      <div class="text-gray-600 text-sm">${mid.weather[0].description}</div>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="mx-auto w-12 h-12 mt-2">
      <div class="text-lg font-bold">${temp} °C</div>
    `;

    forecastContainer.appendChild(card);
  });
}

/* ---------- Background ---------- */
function applyBackground(main, tempC) {
  const body = appBody;
  body.className = "min-h-screen transition-colors duration-500";

  if (main.includes("rain")) body.classList.add("bg-blue-200");
  else if (main.includes("cloud")) body.classList.add("bg-gray-200");
  else if (main.includes("clear")) body.classList.add("bg-yellow-100");
  else if (tempC >= 40) body.classList.add("bg-orange-200");
  else body.classList.add("bg-sky-100");
}

/* ---------- Event Handlers ---------- */
async function handleSearch() {
  clearMessage();
  const city = cityInput.value.trim();
  if (!city) return showMessage("Enter a city");

  try {
    searchBtn.disabled = true;

    const geo = await geocodeCity(city);
    const current = await fetchCurrentWeather(geo.lat, geo.lon);
    const forecast = await fetchForecast(geo.lat, geo.lon);

    renderCurrentWeather(current, `${geo.name}, ${geo.country}`);
    renderForecast(forecast);

    saveToRecent(`${geo.name}, ${geo.country}`);
  } catch (err) {
    showMessage(err.message);
  } finally {
    searchBtn.disabled = false;
  }
}

async function handleLocation() {
  clearMessage();

  if (!navigator.geolocation) return showMessage("Geolocation not supported");

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      const current = await fetchCurrentWeather(lat, lon);
      const forecast = await fetchForecast(lat, lon);

      renderCurrentWeather(current, "Your location");
      renderForecast(forecast);

      // ✅ Save the real city name to recent searches
      if (current.name) {
        saveToRecent(`${current.name}, ${current.sys.country}`);
      }

    } catch {
      showMessage("Failed to load your weather");
    }
  });
}


function handleUnitToggle() {
  if (!currentData) return showMessage("No weather loaded");

  isMetric = !isMetric;
  const tempC = currentData.main.temp;

  tempToday.textContent = isMetric ? round(tempC) : round(cToF(tempC));
  tempUnit.textContent = isMetric ? "°C" : "°F";
}

/* ---------- Listeners ---------- */
searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", e => (e.key === "Enter" ? handleSearch() : null));
locationBtn.addEventListener("click", handleLocation);
unitToggle.addEventListener("click", handleUnitToggle);
recentDropdown.addEventListener("change", () => {
  if (recentDropdown.value) {
    cityInput.value = recentDropdown.value;
    handleSearch();
  }
});

/* ---------- Init ---------- */
loadRecentCities();
