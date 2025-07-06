import fetch from 'node-fetch';

const API_KEY = process.env.API_KEY || process.env.OPENWEATHER_API_KEY;
console.log('Loaded Geo API key:', API_KEY);

export async function getCoordinates(city, all = false) {
    const params = new URLSearchParams({
        q: city,
        appid: API_KEY,
        limit: 5 // or any reasonable number
    });
    const url = `http://api.openweathermap.org/geo/1.0/direct?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch coordinates: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (all) return data;
    if (!data[0]) throw new Error('No city found');
    const { lat, lon } = data[0];
    return { lat, lon };
}