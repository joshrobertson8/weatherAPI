import 'dotenv/config';
import { getCoordinates } from './api/geo.js';
import { getWeather } from './api/weather.js';
import { askQuestion } from './utils/prompt.js';

async function main() {
    try {
        const city = await askQuestion('Enter a city name: ');
        const { lat, lon } = await getCoordinates(city);
        const weather = await getWeather(lat, lon);

        // Format and display weather data
        console.log(`\nWeather for ${city}:`);
        console.log(`Temperature: ${weather.main.temp}°F`);
        console.log(`Feels like: ${weather.main.feels_like}°F`);
        console.log(`Condition: ${weather.weather[0].description}`);
        console.log(`Humidity: ${weather.main.humidity}%`);
        console.log(`Wind: ${weather.wind.speed} mph\n`);
    } catch (err) {
        console.error(err);
    }
}

main();