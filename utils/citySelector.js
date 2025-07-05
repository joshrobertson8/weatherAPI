import { getCoordinates } from '../api/geo.js';
import { askQuestion } from './prompt.js';

export async function selectCity(cityName) {
    const matches = await getCoordinates(cityName, true);
    
    if (!Array.isArray(matches)) {
        throw new Error('Invalid response from geocoding API');
    }

    let selected;
    if (matches.length > 1) {
        console.log('Multiple cities found:');
        matches.forEach((c, i) => {
            console.log(`${i + 1}: ${c.name}, ${c.state || ''} ${c.country}`);
        });
        const choice = await askQuestion('Enter the number of the correct city: ');
        const idx = parseInt(choice) - 1;
        if (isNaN(idx) || idx < 0 || idx >= matches.length) {
            throw new Error('Invalid selection');
        }
        selected = matches[idx];
    } else if (matches.length === 1) {
        selected = matches[0];
    } else {
        throw new Error('No cities found');
    }

    return { lat: selected.lat, lon: selected.lon };
}
