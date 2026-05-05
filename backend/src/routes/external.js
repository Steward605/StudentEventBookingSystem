import express from 'express';

const router = express.Router();

router.get('/weather', async (req, res, next) => {
  try {
    const city = req.query.city?.trim() || 'Kuching';
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) throw new Error('Unable to resolve city weather location.');

    const geoData = await geoResponse.json();
    const place = geoData.results?.[0];
    if (!place) {
      return res.status(404).json({ message: 'Weather location not found.' });
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m`;
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error('Unable to retrieve weather forecast.');

    const forecast = await forecastResponse.json();
    res.json({
      location: `${place.name}, ${place.country}`,
      current: forecast.current
    });
  } catch (error) {
    error.status = 502;
    next(error);
  }
});

export default router;
