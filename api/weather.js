import fetch from 'node-fetch';

const API_KEY = process.env.API_KEY;

export async function getWeather(lat, lon) {
    const params = new URLSearchParams({
        lat,
        lon,
        appid: API_KEY,
        units: 'imperial'
    });
    const url = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch weather: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}
