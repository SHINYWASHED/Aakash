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

async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }
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
  const apiKey = "f40c184cc6d0f260c5d478b2ea48cf01"; // Use your OpenWeather API key
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  await fetchAndDisplay(url);
}

async function fetchWeatherByCoords(lat, lon) {
  const apiKey = "f40c184cc6d0f260c5d478b2ea48cf01";
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  await fetchAndDisplay(url);
}

async function fetchAndDisplay(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") {
      document.getElementById("weather").innerHTML = `<p>${data.message}</p>`;
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

    for (const [date, entries] of Object.entries(forecastByDate).slice(0, 3)) {
      forecastHTML += `<h3>${date}</h3>`;
      forecastHTML += `<table><thead><tr>
        <th>Time</th><th>Icon</th><th>Weather</th>
        <th>Temp (°C)</th><th>Humidity (%)</th><th>Wind (m/s)</th>
      </tr></thead><tbody>`;

      entries.forEach((e) => {
        const time = new Date(e.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const weatherMain = e.weather[0].main;
        const iconClass = iconMap[weatherMain] || "wi-na";

        forecastHTML += `<tr>
          <td>${time}</td>
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
    document.getElementById("weather").innerHTML = `<p>Error fetching weather data.</p>`;
    console.error(error);
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
