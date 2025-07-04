import fetch from 'node-fetch';

const API_KEY = process.env.API_KEY;

export async function getCoordinates(city) {
    const params = new URLSearchParams({
        q: city,
        appid: API_KEY,
        limit: 1
    });
    const url = `http://api.openweathermap.org/geo/1.0/direct?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch coordinates: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const { lat, lon } = data[0];
    return { lat, lon };
}
