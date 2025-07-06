class WeatherApp {
    constructor() {
        this.form = document.getElementById('weather-form');
        this.cityInput = document.getElementById('city');
        this.loadingMsg = document.getElementById('loading-msg');
        this.citySelection = document.getElementById('city-selection');
        this.citySelectionGrid = document.getElementById('city-selection-grid');
        this.locationHeader = document.getElementById('location-header');
        this.weatherGrid = document.getElementById('weather-grid');
        this.searchSection = document.getElementById('search-section');
        this.homeButton = document.getElementById('home-button');
        this.homeBtn = document.getElementById('home-btn');
        this.forecastSection = document.getElementById('forecast-section');
        this.forecastGrid = document.getElementById('forecast-grid');
        
        // Icon legend elements
        this.iconLegendBtn = document.getElementById('icon-legend-btn');
        this.iconLegendModal = document.getElementById('icon-legend-modal');
        this.iconLegendClose = document.getElementById('icon-legend-close');
        this.iconLegendOverlay = document.querySelector('.icon-legend-overlay');
        
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.homeBtn.addEventListener('click', () => this.goHome());
        
        // Enhanced search input interactions
        this.cityInput.addEventListener('focus', () => this.handleInputFocus());
        this.cityInput.addEventListener('blur', () => this.handleInputBlur());
        this.cityInput.addEventListener('input', (e) => this.handleInputChange(e));
        
        // Icon legend interactions
        this.iconLegendBtn.addEventListener('click', () => this.toggleIconLegend());
        this.iconLegendClose.addEventListener('click', () => this.closeIconLegend());
        this.iconLegendOverlay.addEventListener('click', () => this.closeIconLegend());
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const city = this.cityInput.value.trim();
        if (!city) return;

        this.hideAllSections();
        this.showLoading();

        try {
            const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            if (data.weather) {
                this.displayWeather(data, city);
                if (data.fiveDayForecast) {
                    this.displayForecast(data.fiveDayForecast);
                }
            } else if (data.multiple && data.matches) {
                this.displayCitySelection(data.matches);
            } else {
                this.showError('No weather data found.');
            }
        } catch (err) {
            this.showError(err.message);
        } finally {
            this.hideLoading();
        }
    }

    displayWeather(data, cityName) {
        this.hideAllSections();
        
        // Show home button
        this.homeButton.classList.remove('hidden');
        
        // Update location header
        document.getElementById('current-city').textContent = cityName;
        document.getElementById('current-time').textContent = new Date().toLocaleString();
        
        // Update weather data
        const weather = data.weather;
        const temp = Math.round(weather.main.temp);
        const condition = weather.weather[0].description;
        const humidity = weather.main.humidity;
        const feelsLike = Math.round(weather.main.feels_like);
        const tempMin = Math.round(weather.main.temp_min);
        const tempMax = Math.round(weather.main.temp_max);
        
        // Get weather icon and styling
        const weatherIcon = this.getWeatherIcon(weather.weather[0].main, weather.weather[0].description);
        const iconClass = this.getWeatherIconClass(weather.weather[0].main, weather.weather[0].description);
        
        // Update background based on weather
        this.updateBackgroundForWeather(weather.weather[0].main);
        
        // Update main card with enhanced styling
        const mainIconElement = document.getElementById('main-icon');
        mainIconElement.textContent = weatherIcon;
        mainIconElement.className = `weather-card__icon ${iconClass}`;
        mainIconElement.title = this.getWeatherIconDescription(weather.weather[0].main, weather.weather[0].description);
        
        document.getElementById('main-temp').textContent = `${temp}°`;
        document.getElementById('main-condition').textContent = condition;
        document.getElementById('main-feels-like').textContent = `Feels like ${feelsLike}°`;
        
        // Update temperature card
        document.getElementById('temp-value').textContent = `${temp}°F`;
        document.getElementById('temp-range').textContent = `H: ${tempMax}° L: ${tempMin}°`;
        
        // Update condition card with enhanced styling
        const conditionIconElement = document.getElementById('condition-icon');
        conditionIconElement.textContent = weatherIcon;
        conditionIconElement.className = `weather-card__icon ${iconClass}`;
        conditionIconElement.title = this.getWeatherIconDescription(weather.weather[0].main, weather.weather[0].description);
        
        document.getElementById('condition-text').textContent = weather.weather[0].main;
        document.getElementById('condition-desc').textContent = condition;
        
        // Update humidity card
        document.getElementById('humidity-value').textContent = `${humidity}%`;
        
        this.locationHeader.classList.remove('hidden');
        this.weatherGrid.classList.remove('hidden');
    }

    displayCitySelection(matches) {
        this.hideAllSections();
        
        this.citySelectionGrid.innerHTML = '';
        
        matches.forEach(match => {
            const button = document.createElement('button');
            button.className = 'city-select-btn';
            button.innerHTML = `
                <span class="city-select-btn__icon">📍</span>
                <div class="city-select-btn__text">
                    ${match.name}, ${match.state || ''} ${match.country}
                </div>
            `;
            
            button.addEventListener('click', async () => {
                this.hideAllSections();
                this.showLoading();
                
                try {
                    const res = await fetch(`/api/weather?lat=${match.lat}&lon=${match.lon}`);
                    if (!res.ok) throw new Error(await res.text());
                    const data = await res.json();
                    this.displayWeather(data, `${match.name}, ${match.state || ''} ${match.country}`);
                    if (data.fiveDayForecast) {
                        this.displayForecast(data.fiveDayForecast);
                    }
                } catch (err) {
                    this.showError(err.message);
                } finally {
                    this.hideLoading();
                }
            });
            
            this.citySelectionGrid.appendChild(button);
        });
        
        this.citySelection.classList.remove('hidden');
    }

    getWeatherIcon(condition, description = '') {
        // Enhanced icon mapping with more specific conditions
        const icons = {
            // Clear conditions
            'Clear': '☀️',
            'clear sky': '☀️',
            
            // Cloud conditions - more specific with better distinction
            'Clouds': '☁️', // Default fallback
            'few clouds': '🌤️',  // Few clouds - sun with small cloud
            'scattered clouds': '⛅',  // Scattered clouds - sun behind cloud
            'broken clouds': '🌥️',  // Broken clouds - sun behind larger cloud
            'overcast clouds': '☁️',  // Overcast - full cloud cover
            
            // Rain conditions with better progression
            'Rain': '🌧️',
            'light rain': '🌦️',  // Light rain - sun with rain
            'moderate rain': '🌧️',  // Moderate rain - cloud with rain
            'heavy rain': '🌧️',  // Heavy rain - same as moderate but handled by description
            'very heavy rain': '🌧️',
            'extreme rain': '🌧️',
            'freezing rain': '🌨️',  // Freezing rain - cloud with snow
            'light intensity shower rain': '🌦️',
            'shower rain': '🌧️',
            'heavy intensity shower rain': '🌧️',
            'ragged shower rain': '🌦️',
            
            // Drizzle conditions
            'Drizzle': '🌦️',
            'light intensity drizzle': '🌦️',
            'drizzle': '🌦️',
            'heavy intensity drizzle': '�️',
            'light intensity drizzle rain': '🌦️',
            'drizzle rain': '🌦️',
            'heavy intensity drizzle rain': '�️',
            'shower drizzle': '🌦️',
            
            // Thunderstorm conditions with distinction
            'Thunderstorm': '⛈️',
            'thunderstorm with light rain': '🌩️',  // Light thunderstorm
            'thunderstorm with rain': '⛈️',  // Regular thunderstorm
            'thunderstorm with heavy rain': '⛈️',
            'light thunderstorm': '🌩️',
            'thunderstorm': '⛈️',
            'heavy thunderstorm': '⛈️',
            'ragged thunderstorm': '🌩️',
            'thunderstorm with light drizzle': '🌩️',
            'thunderstorm with drizzle': '⛈️',
            'thunderstorm with heavy drizzle': '⛈️',
            
            // Snow conditions with better distinction
            'Snow': '❄️',
            'light snow': '🌨️',  // Light snow - cloud with snow
            'snow': '❄️',  // Regular snow - snowflake
            'heavy snow': '❄️',
            'sleet': '🌨️',  // Sleet - mixed precipitation
            'light shower sleet': '🌨️',
            'shower sleet': '🌨️',
            'light rain and snow': '🌨️',
            'rain and snow': '🌨️',
            'light shower snow': '🌨️',
            'shower snow': '❄️',
            'heavy shower snow': '❄️',
            
            // Atmospheric conditions
            'Mist': '🌫️',
            'Smoke': '🌫️',
            'Haze': '🌫️',
            'sand/dust whirls': '🌪️',
            'fog': '🌫️',
            'Fog': '🌫️',
            'sand': '🌪️',
            'dust': '🌪️',
            'volcanic ash': '🌋',
            'squalls': '💨',
            'tornado': '🌪️',
            
            // Extreme conditions
            'Tornado': '🌪️',
            'tropical storm': '🌀',
            'hurricane': '🌀',
            'cold': '🥶',
            'hot': '🥵',
            'windy': '💨',
            'hail': '🧊'
        };
        
        // First try to match the exact description
        if (description && icons[description.toLowerCase()]) {
            return icons[description.toLowerCase()];
        }
        
        // Fall back to the main condition
        return icons[condition] || '🌤️';
    }

    getWeatherIconClass(condition, description = '') {
        const conditionLower = condition.toLowerCase();
        const descriptionLower = description.toLowerCase();
        
        // Determine icon class for animations and styling
        if (conditionLower === 'clear') {
            return 'weather-icon--clear';
        } else if (conditionLower === 'clouds') {
            return 'weather-icon--cloudy';
        } else if (conditionLower === 'rain' || conditionLower === 'drizzle' || 
                   descriptionLower.includes('rain') || descriptionLower.includes('drizzle')) {
            return 'weather-icon--rainy weather-icon--rain';
        } else if (conditionLower === 'thunderstorm' || descriptionLower.includes('thunderstorm')) {
            return 'weather-icon--stormy weather-icon--thunderstorm';
        } else if (conditionLower === 'snow' || descriptionLower.includes('snow')) {
            return 'weather-icon--snowy weather-icon--snow';
        } else if (descriptionLower.includes('wind') || conditionLower.includes('wind') || 
                   descriptionLower.includes('squall') || conditionLower === 'tornado') {
            return 'weather-icon--wind';
        } else {
            return 'weather-icon--cloudy';
        }
    }

    // Helper function to get descriptive text for weather icons
    getWeatherIconDescription(condition, description = '') {
        const descriptions = {
            '☀️': 'Clear sunny sky',
            '🌤️': 'Mostly sunny with few clouds',
            '⛅': 'Partly cloudy',
            '🌥️': 'Mostly cloudy with some sun',
            '☁️': 'Overcast - completely cloudy',
            '🌦️': 'Light rain or drizzle',
            '🌧️': 'Moderate to heavy rain',
            '⛈️': 'Thunderstorm with heavy rain',
            '🌩️': 'Light thunderstorm',
            '🌨️': 'Light snow or sleet',
            '❄️': 'Snow',
            '🌫️': 'Fog or mist',
            '🌪️': 'Tornado or strong winds',
            '🌀': 'Hurricane or tropical storm',
            '🥶': 'Very cold',
            '🥵': 'Very hot',
            '💨': 'Windy',
            '🧊': 'Hail'
        };
        
        const icon = this.getWeatherIcon(condition, description);
        return descriptions[icon] || 'Weather condition';
    }

    updateBackgroundForWeather(condition) {
        // Remove all existing weather classes
        document.body.className = document.body.className.replace(/weather-\w+/g, '');
        
        // Add new weather class based on condition
        const weatherClass = `weather-${condition.toLowerCase()}`;
        document.body.classList.add(weatherClass);
    }

    resetToHomepage() {
        // Remove all weather classes to show homepage background
        document.body.className = document.body.className.replace(/weather-\w+/g, '');
    }

    showLoading() {
        this.loadingMsg.classList.add('show');
    }

    hideLoading() {
        this.loadingMsg.classList.remove('show');
    }

    hideAllSections() {
        this.searchSection.classList.add('hidden');
        this.citySelection.classList.add('hidden');
        this.locationHeader.classList.add('hidden');
        this.weatherGrid.classList.add('hidden');
        this.forecastSection.classList.add('hidden');
        // Reset to homepage background when hiding all sections
        this.resetToHomepage();
    }

    goHome() {
        // Hide all sections
        this.hideAllSections();
        
        // Show search section and hide home button
        this.searchSection.classList.remove('hidden');
        this.homeButton.classList.add('hidden');
        
        // Clear the input field
        this.cityInput.value = '';
        
        // Reset to homepage background
        this.resetToHomepage();
    }

    showError(message) {
        this.hideAllSections();
        // You could create an error section here
        alert(message); // Temporary error display
    }

    handleInputFocus() {
        const searchIcon = document.querySelector('.search-icon');
        const searchPulse = document.querySelector('.search-icon-pulse');
        
        if (searchIcon) {
            searchIcon.style.fill = 'rgba(255, 255, 255, 0.9)';
            searchIcon.style.transform = 'scale(1.1)';
        }
        
        if (searchPulse) {
            searchPulse.style.opacity = '1';
        }
    }

    handleInputBlur() {
        const searchIcon = document.querySelector('.search-icon');
        const searchPulse = document.querySelector('.search-icon-pulse');
        
        if (searchIcon) {
            searchIcon.style.fill = 'rgba(255, 255, 255, 0.6)';
            searchIcon.style.transform = 'scale(1)';
        }
        
        if (searchPulse) {
            searchPulse.style.opacity = '0';
        }
    }

    handleInputChange(e) {
        // Add typing animation or real-time search suggestions here if needed
        const value = e.target.value;
        // Could add debounced search suggestions in the future
    }

    toggleIconLegend() {
        this.iconLegendModal.classList.toggle('hidden');
    }

    closeIconLegend() {
        this.iconLegendModal.classList.add('hidden');
    }

    showIconLegend() {
        this.iconLegendModal.classList.remove('hidden');
    }

    displayForecast(forecastData) {
        if (!forecastData || !forecastData.daily) {
            return;
        }

        // Skip the first day (today) since current weather is already displayed
        const dailyForecasts = forecastData.daily.slice(1); 
        this.forecastGrid.innerHTML = '';

        dailyForecasts.forEach((day, index) => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const fullDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const icon = this.getWeatherIcon(day.weather[0].main, day.weather[0].description);
            const iconClass = this.getWeatherIconClass(day.weather[0].main, day.weather[0].description);
            const high = Math.round(day.temp.max);
            const low = Math.round(day.temp.min);
            const condition = day.weather[0].description;
            const precipChance = day.pop || 0; // Precipitation probability percentage
            const windSpeed = day.wind?.speed || 0;
            const humidity = day.humidity || 0;
            
            // Create more meaningful precipitation text with better logic
            let precipText = '';
            if (precipChance === 0) {
                precipText = 'No rain expected';
            } else if (precipChance < 20) {
                precipText = `${precipChance}% chance - Light possible`;
            } else if (precipChance < 40) {
                precipText = `${precipChance}% chance - Possible`;
            } else if (precipChance < 60) {
                precipText = `${precipChance}% chance - Likely`;
            } else if (precipChance < 80) {
                precipText = `${precipChance}% chance - Very likely`;
            } else {
                precipText = `${precipChance}% chance - Expect rain`;
            }
            
            // Add wind information if significant
            let windText = '';
            if (windSpeed > 10) {
                windText = `Wind: ${windSpeed} mph`;
            }

            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            const iconTooltip = this.getWeatherIconDescription(day.weather[0].main, day.weather[0].description);
            forecastCard.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${fullDate}</div>
                <div class="forecast-icon ${iconClass}" title="${iconTooltip}">${icon}</div>
                <div class="forecast-temps">
                    <span class="forecast-high">${high}°</span>
                    <span class="forecast-low">${low}°</span>
                </div>
                <div class="forecast-condition">${condition}</div>
                <div class="forecast-precipitation">${precipText}</div>
                ${windText ? `<div class="forecast-wind">${windText}</div>` : ''}
                <div class="forecast-humidity">Humidity: ${humidity}%</div>
            `;

            this.forecastGrid.appendChild(forecastCard);
        });

        this.forecastSection.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});