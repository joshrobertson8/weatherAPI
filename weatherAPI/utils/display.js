export function displayForecast(forecast) {
    const forecastList = forecast.list.filter(x => x.dt_txt.includes("12:00:00"));
    
    if (forecastList.length === 0) {
        console.log('No 12:00 PM forecast data available.');
        return;
    }
    
    console.log('\n5-Day Weather Forecast:\n');
    for (const day of forecastList) {
        const date = new Date(day.dt_txt);
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        console.log(`${weekday}, ${dateString}:`);
        console.log(`  Condition: ${day.weather[0].description}`);
        console.log(`  High: ${day.main.temp}°F`);
        console.log(`  Precipitation Chance: ${Math.round((day.pop || 0) * 100)}%`);
        console.log('---');
    }
}
