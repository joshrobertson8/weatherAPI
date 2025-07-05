import 'dotenv/config';
import { askQuestion } from './utils/prompt.js';
import { processWeatherRequest } from './utils/processWeatherRequest.js';

async function main() {
    try {
        const city = await askQuestion('Enter a city name: ');
        await processWeatherRequest(city);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();