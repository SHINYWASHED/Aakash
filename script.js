const iconMap = {
  Clear: "wi-day-sunny",
  Clouds: "wi-cloudy",
  Rain: "wi-rain",
  Drizzle: "wi-sprinkle",
  Thunderstorm: "wi-thunderstorm",
  Snow: "wi-snow",
  Mist: "wi-fog",
};

// Your own videos folder with video files matching weather conditions
const backgroundMap = {
  Clear: "videos/clear_sky.mp4",
  Clouds: "videos/cloudy.mp4",
  Rain: "videos/rain.mp4",
  Drizzle: "videos/drizzle.mp4",
  Thunderstorm: "videos/thunderstorm.mp4",
  Snow: "videos/snow.mp4",
  Mist: "videos/mist.mp4",
};

let weatherChart;
let debounceTimer; // Added for debouncing city suggestions

// Your gomaps.pro API Key for city search suggestions
const GOMAPS_PRO_API_KEY = "AlzaSyrkk8M_wXQRS9zj_gmvpnf0LLrA384li9I";

async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }
  // Clear suggestions when a city is explicitly searched
  document.getElementById("city-suggestions").innerHTML = "";
  document.getElementById("city-suggestions").style.display = 'none';
  await fetchWeatherByCity(city);
}

async function getWeatherByLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await fetchWeatherByCoords(latitude, longitude);
    },
    () => {
      alert("Unable to retrieve your location.");
    }
  );
}

async function fetchWeatherByCity(city) {
  const apiKey = "f40c184cc6d0f260c5d478b2ea48cf01"; // Your OpenWeather API key
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  await fetchAndDisplay(url);
}

async function fetchWeatherByCoords(lat, lon) {
  const apiKey = "f40c184cc6d0f260c5d478b2ea48cf01"; // Your OpenWeather API key
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  await fetchAndDisplay(url);
}

async function fetchAndDisplay(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") {
      document.getElementById("weather").innerHTML = `<p>Error: ${data.message}. Please try again with a valid city name.</p>`;
      return;
    }

    const cityName = data.city.name;
    const country = data.city.country;

    const forecastByDate = {};
    const allLabels = [];
    const allTemps = [];
    const allHumidity = [];

    data.list.forEach((entry) => {
      const date = new Date(entry.dt * 1000).toDateString();
      if (!forecastByDate[date]) {
        forecastByDate[date] = [];
      }
      forecastByDate[date].push(entry);
    });

    let forecastHTML = `<h2>Weather Forecast for ${cityName}, ${country}</h2>`;

    // Display forecast for the first 3 days
    for (const [date, entries] of Object.entries(forecastByDate).slice(0, 3)) {
      forecastHTML += `<h3>${date}</h3>`;
      forecastHTML += `<table><thead><tr>        <th>Time</th><th>Icon</th><th>Weather</th>
        <th>Temp (°C)</th><th>Humidity (%)</th><th>Wind (m/s)</th>
      </tr></thead><tbody>`;
      entries.forEach((e) => {
        const time = new Date(e.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const weatherMain = e.weather[0].main;
        const iconClass = iconMap[weatherMain] || "wi-na";

        forecastHTML += `<tr>          <td>${time}</td>
          <td><i class="wi ${iconClass} weather-icon"></i></td>
          <td>${e.weather[0].description}</td>
          <td>${e.main.temp.toFixed(1)}</td>
          <td>${e.main.humidity}</td>
          <td>${e.wind.speed}</td>
        </tr>`;
        // Collect data for charts (only for first day's entries)
        if (date === Object.keys(forecastByDate)[0]) {
          allLabels.push(time);
          allTemps.push(e.main.temp);
          allHumidity.push(e.main.humidity);
        }
      });
      forecastHTML += `</tbody></table>`;
    }

    document.getElementById("weather").innerHTML = forecastHTML;

    // Update background video for current weather of first forecast item
    const currentWeather = data.list[0].weather[0].main;
    setBackgroundVideo(currentWeather);

    // Render chart
    renderChart(allLabels, allTemps, allHumidity);
  } catch (error) {
    document.getElementById("weather").innerHTML = `<p>Error fetching weather data. Please try again with a valid city name.</p>`;
    console.error("Error fetching weather data:", error);
  }
}

function setBackgroundVideo(weather) {
  const bgVideo = document.getElementById("background-video");
  const videoSrc = backgroundMap[weather];

  if (videoSrc) {
    if (bgVideo.getAttribute("src") !== videoSrc) {
      bgVideo.src = videoSrc;
      bgVideo.load();
      bgVideo.play();
    }
  } else {
    bgVideo.pause();
    bgVideo.removeAttribute("src");
    bgVideo.load();
  }
}

function renderChart(labels, temps, humidity) {
  const ctx = document.getElementById("weatherChart").getContext("2d");
  if (weatherChart) weatherChart.destroy();

  weatherChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temps,
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.2)",
          yAxisID: "y",
          tension: 0.3,
        },
        {
          label: "Humidity (%)",
          data: humidity,
          borderColor: "#17a2b8",
          backgroundColor: "rgba(23,162,184,0.2)",
          yAxisID: "y1",
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      stacked: false,
      scales: {
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: { display: true, text: "Temperature (°C)" },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Humidity (%)" },
        },
      },
    },
  });
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// UPDATED: Autocomplete/City Search Suggestion Functionality using gomaps.pro findplacefromtext API
async function getCitySuggestions(query) {
    if (!GOMAPS_PRO_API_KEY) {
        console.error("gomaps.pro API Key not set. Please add it to script.js.");
        document.getElementById("city-suggestions").innerHTML = "";
        document.getElementById("city-suggestions").style.display = 'none';
        return;
    }

    if (query.length < 3) { // Require at least 3 characters for suggestions
        document.getElementById("city-suggestions").innerHTML = "";
        document.getElementById("city-suggestions").style.display = 'none';
        return;
    }

    // gomaps.pro findplacefromtext API endpoint with corrected parameters
    const url = `https://maps.gomaps.pro/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=name,formatted_address&key=${GOMAPS_PRO_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Check if it's a 4xx or 5xx error
            const errorData = await response.json().catch(() => ({})); // Try to parse JSON error
            console.error(`HTTP error! Status: ${response.status}`, errorData);
            document.getElementById("city-suggestions").innerHTML = `<div style="color: red;">Error fetching suggestions. Check console.</div>`;
            document.getElementById("city-suggestions").style.display = 'block';
            return;
        }
        const data = await response.json();

        // Check for specific API error status if present in JSON body
        if (data.status && data.status !== "OK") {
            console.warn("gomaps.pro findplacefromtext API returned status:", data.status, data.error_message || "");
            document.getElementById("city-suggestions").innerHTML = "";
            document.getElementById("city-suggestions").style.display = 'none';
            return;
        }

        // Assuming gomaps.pro returns a 'candidates' array for results
        if (data.candidates && data.candidates.length > 0) {
            displayCitySuggestions(data.candidates);
        } else {
            // If status is OK but no candidates, it means no results found
            console.log("gomaps.pro findplacefromtext API returned no candidates for query:", query);
            document.getElementById("city-suggestions").innerHTML = "";
            document.getElementById("city-suggestions").style.display = 'none';
        }
    } catch (error) {
        console.error("Error fetching city suggestions from gomaps.pro:", error);
        document.getElementById("city-suggestions").innerHTML = ""; // Clear suggestions on error
        document.getElementById("city-suggestions").style.display = 'none';
    }
}

function displayCitySuggestions(candidates) {
    const suggestionsContainer = document.getElementById("city-suggestions");
    suggestionsContainer.innerHTML = ""; // Clear previous suggestions

    if (candidates.length === 0) {
        suggestionsContainer.style.display = 'none'; // Hide if no suggestions
        return;
    }

    candidates.forEach(candidate => {
        const suggestionItem = document.createElement("div");
        // Use 'name' for primary display and for OpenWeatherMap if available, fallback to formatted_address
        const displayName = candidate.name || candidate.formatted_address || "Unnamed Place";
        const cityForOpenWeather = candidate.name || (candidate.formatted_address ? candidate.formatted_address.split(',')[0].trim() : displayName.split(',')[0].trim());

        suggestionItem.textContent = displayName; // Display the full name to the user
        suggestionItem.classList.add("suggestion-item");
        suggestionItem.addEventListener("click", () => {
            document.getElementById("city").value = cityForOpenWeather; // Set input value to the city name for OpenWeatherMap
            suggestionsContainer.innerHTML = ""; // Clear suggestions
            suggestionsContainer.style.display = 'none'; // Hide the suggestions box
            getWeather(); // Automatically fetch weather for the selected city
        });
        suggestionsContainer.appendChild(suggestionItem);
    });
    suggestionsContainer.style.display = 'block'; // Show container if there are suggestions
}

// Event listener for city input to trigger suggestions
document.addEventListener("DOMContentLoaded", () => {
    const cityInput = document.getElementById("city");
    cityInput.addEventListener("input", (event) => {
        clearTimeout(debounceTimer);
        const query = event.target.value.trim();
        debounceTimer = setTimeout(() => {
            getCitySuggestions(query);
        }, 300); // Debounce API calls for 300ms
    });

    // Hide suggestions when clicking anywhere outside the input and suggestion box
    document.addEventListener("click", (event) => {
        const suggestionsContainer = document.getElementById("city-suggestions");
        const cityInput = document.getElementById("city");
        if (!suggestionsContainer.contains(event.target) && event.target !== cityInput) {
            suggestionsContainer.innerHTML = "";
            suggestionsContainer.style.display = 'none';
        }
    });
});
