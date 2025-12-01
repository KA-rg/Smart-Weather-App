// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEATHER_API_KEY;

if (!API_KEY) {
  console.error('ERROR: WEATHER_API_KEY not set in .env');
  process.exit(1);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// EJS + layouts
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('views', path.join(__dirname, 'views'));

// Home page
app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// Weather POST - gets current + 7-day forecast
app.post('/weather', async (req, res) => {
  const city = (req.body.city || '').trim() || 'London';
  try {
    const days = 7;
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=${days}&aqi=yes&alerts=no`;
    const { data } = await axios.get(url);

    // prepare chart arrays
    const dates = [];
    const maxTemps = [];
    const minTemps = [];
    const avgTemps = [];
    const rainChances = [];

    data.forecast.forecastday.forEach(fd => {
      dates.push(fd.date);
      maxTemps.push(fd.day.maxtemp_c);
      minTemps.push(fd.day.mintemp_c);
      avgTemps.push(fd.day.avgtemp_c);
      rainChances.push(fd.day.daily_chance_of_rain || 0);
    });

    // pass data to view
    res.render('result', {
      location: `${data.location.name}${data.location.region ? ', ' + data.location.region : ''}, ${data.location.country}`,
      localtime: data.location.localtime,
      current: data.current,
      forecast: data.forecast.forecastday,
      chart: { dates, maxTemps, minTemps, avgTemps, rainChances },
      weatherCategory: mapConditionToCategory(data.current.condition.text)
    });
  } catch (err) {
    console.error(err?.response?.data || err.message || err);
    const msg = err?.response?.data?.error?.message || 'Could not fetch weather. Try a different location.';
    res.render('index', { error: msg });
  }
});

// helper: simple mapping from text to category
function mapConditionToCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('rain') || t.includes('drizzle') || t.includes('shower')) return 'rain';
  if (t.includes('snow') || t.includes('sleet') || t.includes('blizzard')) return 'snow';
  if (t.includes('cloud') || t.includes('overcast')) return 'cloudy';
  return 'clear';
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
