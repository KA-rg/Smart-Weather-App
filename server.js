// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEATHER_API_KEY;

if (!API_KEY) {
  console.error('ERROR: WEATHER_API_KEY is not set in .env');
  process.exit(1);
}
app.set("view engine", "ejs");
app.set("layout", "layout");
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Home - form
app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// Weather fetch (POST from form)
app.post('/weather', async (req, res) => {
  try {
    const location = req.body.location || 'London';
    // Use forecast endpoint for current + upcoming days
    const days = 4; // current day + upcoming 3 days
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(location)}&days=${days}&aqi=yes&alerts=no`;

    const response = await axios.get(url);
    const data = response.data;

    // Extract useful parts
    const locationInfo = data.location;
    const current = data.current;
    const forecastDays = data.forecast.forecastday; // array

    // Some processed data to send to template
    const result = {
      location: `${locationInfo.name}, ${locationInfo.region || ''} ${locationInfo.country}`.trim(),
      localtime: locationInfo.localtime,
      current: {
        temp_c: current.temp_c,
        temp_f: current.temp_f,
        condition_text: current.condition.text,
        condition_icon: current.condition.icon,
        wind_kph: current.wind_kph,
        wind_dir: current.wind_dir,
        humidity: current.humidity,
        feelslike_c: current.feelslike_c,
        vis_km: current.vis_km,
        cloud: current.cloud,
        gust_kph: current.gust_kph,
        uv: current.uv,
        precip_mm: current.precip_mm,
        aqi: current.air_quality || null
      },
      forecast: forecastDays.map(fd => ({
        date: fd.date,
        // day: summary
        day: {
          maxtemp_c: fd.day.maxtemp_c,
          mintemp_c: fd.day.mintemp_c,
          avgtemp_c: fd.day.avgtemp_c,
          condition_text: fd.day.condition.text,
          condition_icon: fd.day.condition.icon,
          daily_chance_of_rain: fd.day.daily_chance_of_rain || 0,
          daily_chance_of_snow: fd.day.daily_chance_of_snow || 0,
          totalprecip_mm: fd.day.totalprecip_mm
        },
        astro: fd.astro // sunrise, sunset etc.
      }))
    };

    res.render('result', { error: null, result });
  } catch (err) {
    console.error(err?.response?.data || err.message || err);
    const msg = err?.response?.data?.error?.message || 'Could not fetch weather for that location. Try a city name or ZIP/postal code.';
    res.render('index', { error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});