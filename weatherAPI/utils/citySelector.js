import { getCoordinates } from '../api/geo.js';

export async function selectCity(cityName) {
    const matches = await getCoordinates(cityName, true);

    if (!Array.isArray(matches)) {
        throw new Error('Invalid response from geocoding API');
    }

    if (matches.length === 0) {
        throw new Error('No cities found');
    }

    return matches;
}
