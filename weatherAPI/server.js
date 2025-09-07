// server code for a simple weather app
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getWeather, getForecast, get5DayForecast } from './api/weather.js';
import { selectCity } from './utils/citySelector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/weather', async (req, res) => {
    try {
        const cityName = req.query.city;
        const lat = req.query.lat;
        const lon = req.query.lon;

        if (lat && lon) {
            // If coordinates are provided, fetch weather directly
            const weather = await getWeather(lat, lon);
            
            const forecast = await getForecast(lat, lon);
            
            try {
                const fiveDayForecast = await get5DayForecast(lat, lon);
                const response = { weather, forecast, fiveDayForecast };
                return res.json(response);
            } catch (error) {
                return res.json({ weather, forecast });
            }
        }

        if (!cityName) {
            return res.status(400).send('City name is required');
        }

        const matches = await selectCity(cityName);

        if (matches.length > 1) {
            // Send all possible matches to the frontend
            return res.json({ multiple: true, matches });
        }

        const { lat: foundLat, lon: foundLon } = matches[0];
        const weather = await getWeather(foundLat, foundLon);
        const forecast = await getForecast(foundLat, foundLon);
        
        try {
            const fiveDayForecast = await get5DayForecast(foundLat, foundLon);
            res.json({ weather, forecast, fiveDayForecast });
        } catch (error) {
            res.json({ weather, forecast });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
}); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});