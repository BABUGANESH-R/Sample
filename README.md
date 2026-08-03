# Skylight — Simple Weather Report

A lightweight weather report app built with plain HTML, CSS, and JavaScript.

It uses the free [Open-Meteo](https://open-meteo.com/) API (no API key required) to look up a city and show:

- Current temperature and conditions
- Humidity, wind, and feels-like temperature
- A five-day outlook

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Usage

1. Type a city name (for example, `Lisbon` or `Tokyo`).
2. Click **Get weather**.
3. Review the current conditions and five-day forecast.
