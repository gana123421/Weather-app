🌦️ Weather Forecast Web Application
This project is a responsive weather forecasting web application built using HTML, Tailwind CSS, and Vanilla JavaScript. It uses the OpenWeatherMap API to provide real-time weather information, a 5-day forecast, recent search history, and the option to fetch weather based on the user’s current location.

📌 Feature
✔ Search by City Name
Users can enter a city name to get the current weather.
Includes input validation and helpful error messages.
Supports formats like:
Delhi | London, UK | New York, US

✔ Use Current Location
Uses the browser’s Geolocation API to detect the user's latitude and longitude.
Fetches weather data based on the detected coordinates.
Shows proper error messages if permission is denied or GPS is disabled.

✔ Recent Searches (LocalStorage)
Saves the last few searched cities.
Dropdown to quickly re-search recent cities.
Stored using browser localStorage.

✔ Current Weather Information
Displays:
City name
Date (adjusted to location timezone)
Temperature (°C / °F toggle for today only)
Weather description
Humidity
Wind speed
Feels like temperature
Weather icon
Dynamic background colors based on conditions (sunny, cloudy, rainy, extreme heat, etc.)

✔ 5-Day Forecast
Each forecast card includes:
Date
Weather condition
Icon
Day temperature
Wind speed
Humidity
Small inline SVG icons for temperature/wind/humidity
Grid adapts automatically:
1 column: Phones (iPhone SE / ≤640px)
2 columns: Small tablets
3 columns: iPad Mini (≥768px)
5 columns: Desktop (≥1024px)

✔ Responsive UI (Tailwind CSS)
The layout is optimized for:
Mobile devices
iPad Mini
Laptops & desktops
Uses Tailwind classes for spacing, typography, grid layouts, and modern card UI styling.

✔ Custom Error Messages
Errors are displayed inside the page (not alerts):
Invalid city input
API issues
Permission denied
Network failures
Each message has a dismiss button.

🛠️ Technologies Used
HTML5
Tailwind CSS (CDN)
Vanilla JavaScript
OpenWeatherMap API (Geocoding + OneCall)
LocalStorage
Browser Geolocation API
