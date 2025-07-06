import fetch from 'node-fetch';

const API_KEY = process.env.API_KEY || process.env.OPENWEATHER_API_KEY;
console.log('Loaded Weather API key:', API_KEY);

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

export async function getForecast(lat, lon) {
    const params = new URLSearchParams({
        lat,
        lon,
        appid: API_KEY,
        units: 'imperial'
    });

    const url = `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`failed to fetch forecast: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

export async function get5DayForecast(lat, lon) {
    console.log('get5DayForecast called with lat:', lat, 'lon:', lon);
    // Use the 5-day forecast API (free tier) and process the data
    const params = new URLSearchParams({
        lat,
        lon,
        appid: API_KEY,
        units: 'imperial'
    });

    const url = `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`;
    console.log('Fetching from URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
        console.error('Failed to fetch 5-day forecast:', response.status, response.statusText);
        throw new Error(`failed to fetch 5-day forecast: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw forecast data received, list length:', data.list?.length || 0);
    
    // Process the 5-day/3-hour forecast into daily summaries
    const dailyData = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
                date: date,
                temps: [],
                conditions: [],
                descriptions: [],
                precipitationProbs: [],
                windSpeeds: [],
                humidity: [],
                dt: item.dt,
                weather: item.weather[0]
            };
        }
        
        dailyData[dayKey].temps.push(item.main.temp);
        dailyData[dayKey].conditions.push(item.weather[0].main);
        dailyData[dayKey].descriptions.push(item.weather[0].description);
        dailyData[dayKey].precipitationProbs.push(item.pop || 0); // Probability of precipitation
        dailyData[dayKey].windSpeeds.push(item.wind?.speed || 0);
        dailyData[dayKey].humidity.push(item.main.humidity || 0);
        
        // Debug logging for the first few items
        if (Object.keys(dailyData).length <= 2) {
            console.log(`${dayKey} - Condition: ${item.weather[0].description}, POP: ${(item.pop || 0) * 100}%`);
        }
    });
    
    console.log('Daily data keys:', Object.keys(dailyData));
    
    // Convert to daily format (natural 5-day forecast)
    const daily = Object.values(dailyData).map(day => {
        const maxTemp = Math.max(...day.temps);
        const minTemp = Math.min(...day.temps);
        
        // Calculate average precipitation probability first
        const avgPrecipitationProb = day.precipitationProbs.reduce((sum, prob) => sum + prob, 0) / day.precipitationProbs.length;
        const precipPercentage = Math.round(avgPrecipitationProb * 100);
        
        // Find most common weather condition, but prioritize based on precipitation
        const conditionCounts = {};
        const descCounts = {};
        
        day.conditions.forEach((condition, index) => {
            const pop = day.precipitationProbs[index];
            const desc = day.descriptions[index];
            const itemTime = new Date(day.dt * 1000 + (index * 3 * 60 * 60 * 1000)); // Approximate time for this forecast
            const hour = itemTime.getHours();
            
            // Weight conditions by importance and time of day
            let weight = 1;
            
            // Higher weight for daytime conditions (6 AM to 6 PM)
            if (hour >= 6 && hour <= 18) {
                weight += 1;
            }
            
            // Higher weight for precipitation conditions
            if (pop > 0.3) {
                weight += 2;
            }
            
            // Higher weight for severe weather conditions
            if (condition.toLowerCase().includes('thunderstorm') || 
                condition.toLowerCase().includes('snow') ||
                desc.toLowerCase().includes('heavy') ||
                desc.toLowerCase().includes('moderate rain')) {
                weight += 3;
            }
            
            conditionCounts[condition] = (conditionCounts[condition] || 0) + weight;
            descCounts[desc] = (descCounts[desc] || 0) + weight;
        });
        
        // Smart condition selection based on precipitation and severity
        let mostCommonCondition, mostCommonDescription;
        
        // Priority order: Thunderstorms > Snow > Rain > Drizzle > Clouds > Clear
        const priorityConditions = ['Thunderstorm', 'Snow', 'Rain', 'Drizzle', 'Clouds', 'Clear'];
        const priorityDescriptions = ['thunderstorm', 'snow', 'heavy', 'moderate', 'rain', 'drizzle', 'clouds', 'clear'];
        
        if (precipPercentage > 30) {
            // For days with significant precipitation, prioritize weather conditions
            let selectedCondition = null;
            let selectedDescription = null;
            
            // Look for severe weather first
            for (const priority of priorityConditions) {
                const matchingConditions = Object.keys(conditionCounts).filter(cond => 
                    cond.toLowerCase().includes(priority.toLowerCase())
                );
                if (matchingConditions.length > 0) {
                    selectedCondition = matchingConditions.reduce((a, b) => 
                        conditionCounts[a] > conditionCounts[b] ? a : b
                    );
                    break;
                }
            }
            
            // Look for matching descriptions
            for (const priority of priorityDescriptions) {
                const matchingDescriptions = Object.keys(descCounts).filter(desc => 
                    desc.toLowerCase().includes(priority)
                );
                if (matchingDescriptions.length > 0) {
                    selectedDescription = matchingDescriptions.reduce((a, b) => 
                        descCounts[a] > descCounts[b] ? a : b
                    );
                    break;
                }
            }
            
            mostCommonCondition = selectedCondition || Object.keys(conditionCounts).reduce((a, b) => 
                conditionCounts[a] > conditionCounts[b] ? a : b
            );
            mostCommonDescription = selectedDescription || Object.keys(descCounts).reduce((a, b) => 
                descCounts[a] > descCounts[b] ? a : b
            );
        } else {
            // For low precipitation days, use most common condition
            mostCommonCondition = Object.keys(conditionCounts).reduce((a, b) => 
                conditionCounts[a] > conditionCounts[b] ? a : b
            );
            mostCommonDescription = Object.keys(descCounts).reduce((a, b) => 
                descCounts[a] > descCounts[b] ? a : b
            );
        }
        
        // Calculate additional weather metrics
        const avgWindSpeed = day.windSpeeds.reduce((sum, speed) => sum + speed, 0) / day.windSpeeds.length;
        const avgHumidity = day.humidity.reduce((sum, hum) => sum + hum, 0) / day.humidity.length;
        
        return {
            dt: day.dt,
            temp: {
                max: maxTemp,
                min: minTemp
            },
            weather: [{
                main: mostCommonCondition,
                description: mostCommonDescription
            }],
            pop: precipPercentage,
            wind: {
                speed: Math.round(avgWindSpeed * 10) / 10 // Round to 1 decimal place
            },
            humidity: Math.round(avgHumidity)
        };
    });
    
    console.log('Processed daily forecast, length:', daily.length);
    const result = { daily: daily };
    console.log('Returning forecast result:', JSON.stringify(result, null, 2));
    return result;
}
