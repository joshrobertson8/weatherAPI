import { getWeather, getForecast } from '../api/weather.js';
import { selectCity } from './citySelector.js';
import { displayForecast } from './display.js';

export async function processWeatherRequest(cityName) {
    try {
        // Select the correct city
        const { lat, lon } = await selectCity(cityName);
        
        // Get weather data
        const weather = await getWeather(lat, lon);
        const forecast = await getForecast(lat, lon);
        
        // Display the forecast
        displayForecast(forecast);
        
        return { weather, forecast };
    } catch (error) {
        throw new Error(`Failed to get weather data: ${error.message}`);
    }
}
