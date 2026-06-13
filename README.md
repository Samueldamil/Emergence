# 🚑 Emergence

Emergence is a web application that helps users find nearby emergency services using their current location. Whether you need a hospital, pharmacy, police station, or fire station, the app helps you locate the nearest available options and quickly navigate to them using Google Maps.

## 🌐 Live Demo

**Live App:** [https://emergence-hazel.vercel.app]

---

## Why I Built This

In emergency situations, time is critical. People often don't know where the nearest hospital, pharmacy, police station, or fire station is located, especially when they're in an unfamiliar area.

I wanted to build a simple tool that could help users quickly find nearby emergency services without having to manually search through different map applications.

---

## How It Works

When a user selects an emergency service category, the app:

- Detects their current location.
- Searches for nearby emergency centers.
- Displays the results on an interactive map.
- Shows how far each location is from the user.
- Allows users to open turn-by-turn navigation in Google Maps with a single click.

If no nearby emergency centers are found, the app provides an option to continue the search using Google Maps.

---

## Features

- 📍 Real-time location detection
- 🏥 Nearby hospitals
- 💊 Nearby pharmacies
- 👮 Nearby police stations
- 🚒 Nearby fire stations
- 🗺️ Interactive map view
- 📏 Distance calculation
- 🚗 Google Maps navigation
- ⚡ Animated loading experience
- 📱 Mobile responsive design
- 🔄 Fallback search options

---

## Challenges & Lessons Learned

One of the biggest challenges while building Emergence was working with location data.

The app uses OpenStreetMap data through Geoapify or Overpass. While this works very well in many cities, some local areas may have incomplete mapping data. Because of this, certain emergency centers may not appear even though they exist in real life.

To improve the user experience, I added Google Maps integration so users can continue searching when nearby results aren't available.

Building this project taught me a lot about:

- Geolocation APIs
- Interactive maps
- Third-party API integration
- Error handling
- Fallback strategies
- Real-world problem solving

---

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- React Leaflet
- OpenStreetMap
- Geoapify API
- Google Maps Integration
- Vercel

---

## Screenshot

![Emergence Screenshot](/public/screenshot/emergence-screenshot.PNG)

---

## Author

**Damilare Edun**

Full Stack Developer
- Portfolio: [https://daredeveloper.netlify.app/]

---

If you have feedback, suggestions, or ideas for improving the project, feel free to reach out.
