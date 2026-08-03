const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusEl = document.getElementById("status");
const reportEl = document.getElementById("report");
const submitButton = form.querySelector('button[type="submit"]');

const weatherCodes = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function describeWeather(code) {
  return weatherCodes[code] || "Unknown conditions";
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", isError);
}

function formatDay(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

async function findCity(name) {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not look up that city right now.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("No matching city found. Try another spelling.");
  }

  return data.results[0];
}

async function fetchWeather(latitude, longitude) {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
  );
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "5");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather service is unavailable. Please try again.");
  }

  return response.json();
}

function renderReport(place, weather) {
  const { current, daily, current_units: units } = weather;
  const region = [place.admin1, place.country].filter(Boolean).join(", ");

  document.getElementById("location-name").textContent = place.name;
  document.getElementById("location-meta").textContent = region;
  document.getElementById("temperature").textContent = `${Math.round(current.temperature_2m)}°`;
  document.getElementById("condition").textContent = describeWeather(current.weather_code);
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`;
  document.getElementById("feels-like").textContent = `${Math.round(current.apparent_temperature)}°`;

  const forecastList = document.getElementById("forecast-list");
  forecastList.innerHTML = "";

  daily.time.forEach((day, index) => {
    const item = document.createElement("li");
    item.className = "forecast__item";
    item.innerHTML = `
      <span class="forecast__day">${formatDay(day)}</span>
      <span class="forecast__range">${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°</span>
      <span class="forecast__label">${describeWeather(daily.weather_code[index])}</span>
    `;
    forecastList.appendChild(item);
  });

  reportEl.hidden = false;
}

async function handleSearch(event) {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Enter a city name to continue.", true);
    return;
  }

  submitButton.disabled = true;
  reportEl.hidden = true;
  setStatus("Fetching the latest sky report…");

  try {
    const place = await findCity(city);
    const weather = await fetchWeather(place.latitude, place.longitude);
    renderReport(place, weather);
    setStatus(`Updated for ${place.name}.`);
  } catch (error) {
    setStatus(error.message || "Something went wrong.", true);
  } finally {
    submitButton.disabled = false;
  }
}

form.addEventListener("submit", handleSearch);
