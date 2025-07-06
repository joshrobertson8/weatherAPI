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
    console.log('=== API WEATHER REQUEST RECEIVED ===');
    try {
        const cityName = req.query.city;
        const lat = req.query.lat;
        const lon = req.query.lon;
        console.log('Request params:', { cityName, lat, lon });

        if (lat && lon) {
            // If coordinates are provided, fetch weather directly
            console.log('Fetching weather data for lat:', lat, 'lon:', lon);
            const weather = await getWeather(lat, lon);
            console.log('Weather data fetched successfully');
            
            const forecast = await getForecast(lat, lon);
            console.log('Forecast data fetched successfully');
            
            console.log('About to fetch 5-day forecast...');
            try {
                const fiveDayForecast = await get5DayForecast(lat, lon);
                console.log('5-day forecast data fetched successfully:', fiveDayForecast ? 'Data exists' : 'No data');
                console.log('About to return response with fiveDayForecast');
                const response = { weather, forecast, fiveDayForecast };
                console.log('Response keys:', Object.keys(response));
                return res.json(response);
            } catch (error) {
                console.error('Error fetching 5-day forecast:', error.message);
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
        console.log('Fetching weather data for found city:', foundLat, foundLon);
        const weather = await getWeather(foundLat, foundLon);
        const forecast = await getForecast(foundLat, foundLon);
        
        try {
            const fiveDayForecast = await get5DayForecast(foundLat, foundLon);
            console.log('5-day forecast data fetched successfully for city');
            res.json({ weather, forecast, fiveDayForecast });
        } catch (error) {
            console.error('Error fetching 5-day forecast for city:', error.message);
            res.json({ weather, forecast });
        }
    } catch (error) {
        console.error(error);
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