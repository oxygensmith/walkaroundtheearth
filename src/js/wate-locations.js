/* Walk Around the Earth */
/* locations.js - Equatorial locations and geographic calculations */

export const EQUATORIAL_LOCATIONS = [
  {
    name: "Quito, Ecuador",
    lat: -0.1807,
    lng: -78.4678,
    antipode: {
      lat: 0.1807,
      lng: 101.5322,
      location: "Somewhere in the South China Sea, between Borneo and Sumatra",
      type: "ocean",
    },
    unsplash: "https://unsplash.com/s/photos/quito",
    facts: {
      f01: "Quito is built on the slopes of the Pichincha Volcano! (yes, it's active).",
      f02: "And the nearby Mindo Cloud Forest is a home to rare wildlife.",
      f03: "Including th olinguito, a small mammal discovered only in 2013.",
      f04: "Quito was the very first city to be declared a UNESCO World Cultural Heritage Site due to its exceptionally well-preserved historic center and rich architectural fusion of Spanish, Italian, Moorish, Flemish, and indigenous influences.",
      f05: "It gets called 'Mitad del Mundo' (“Middle of the World”), and there's a monument and museum marking the general location of the equator.",
      f06: "However, modern GPS shows the real equator line is a short distance away—there's actually a yellow line for you to straddle both hemispheres.",
      f07: "Which is the line you're following if you're doing the equator path.",
    },
  },
  {
    name: "Macapá, Brazil",
    lat: 0.0389,
    lng: -51.0664,
    antipode: {
      lat: -0.0389,
      lng: 128.9336,
      location: "In the ocean northeast of Indonesia, near Halmahera Island",
      type: "ocean",
    },
  },
  {
    name: "Pontianak, Indonesia",
    lat: -0.0263,
    lng: 109.3425,
    antipode: {
      lat: 0.0263,
      lng: -70.6575,
      location: "In the Amazon rainforest, Colombia (near the Brazil border)",
      type: "land",
    },
  },
  {
    name: "Nanyuki, Kenya",
    lat: 0.0167,
    lng: 37.0667,
    antipode: {
      lat: -0.0167,
      lng: -142.9333,
      location: "In the Pacific Ocean, southeast of Hawaii",
      type: "ocean",
    },
  },
];

// Select a random location from the list
export function getRandomLocation() {
  const index = Math.floor(Math.random() * EQUATORIAL_LOCATIONS.length);
  return EQUATORIAL_LOCATIONS[index];
}

// Calculate new coordinates along a great circle route
// bearing: direction in degrees (0-360, where 0 is north, 90 is east)
// distance: distance in kilometers
export function calculateNewPosition(startLat, startLng, bearing, distanceKm) {
  const R = 6371; // Earth's radius in km
  const bearingRad = (bearing * Math.PI) / 180;
  const lat1 = (startLat * Math.PI) / 180;
  const lng1 = (startLng * Math.PI) / 180;
  const angularDistance = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180, // Normalize to -180 to 180
  };
}

// Format coordinates for display
export function formatCoordinates(lat, lng) {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  const latAbs = Math.abs(lat).toFixed(4);
  const lngAbs = Math.abs(lng).toFixed(4);
  return `${latAbs}°${latDir}, ${lngAbs}°${lngDir}`;
}

// Calculate time to travel around Earth at given speed
// Returns formatted string like "3 days 5 hours" or "2 years 4 months"
export function formatTimeToCircumnavigate(speedKmPerHour) {
  const EARTH_CIRCUMFERENCE = 40041.44; // km

  if (speedKmPerHour < 0.000001) {
    return "—";
  }

  // Calculate total hours
  const totalHours = EARTH_CIRCUMFERENCE / speedKmPerHour;

  // Convert to time units
  const minutesPerHour = 60;
  const hoursPerDay = 24;
  const daysPerWeek = 7;
  const daysPerMonth = 30.44; // Average
  const daysPerYear = 365.25;

  const totalMinutes = totalHours * minutesPerHour;
  const totalDays = totalHours / hoursPerDay;

  // Calculate years, months, weeks, days, hours, minutes
  let remaining = totalMinutes;

  const years = Math.floor(totalDays / daysPerYear);
  remaining -= years * daysPerYear * hoursPerDay * minutesPerHour;

  const months = Math.floor(
    remaining / minutesPerHour / hoursPerDay / daysPerMonth
  );
  remaining -= months * daysPerMonth * hoursPerDay * minutesPerHour;

  const weeks = Math.floor(
    remaining / minutesPerHour / hoursPerDay / daysPerWeek
  );
  remaining -= weeks * daysPerWeek * hoursPerDay * minutesPerHour;

  const days = Math.floor(remaining / minutesPerHour / hoursPerDay);
  remaining -= days * hoursPerDay * minutesPerHour;

  const hours = Math.floor(remaining / minutesPerHour);
  remaining -= hours * minutesPerHour;

  const minutes = Math.floor(remaining);

  // Build output string with up to 2 most significant units
  const parts = [];

  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
  if (weeks > 0 && years === 0)
    parts.push(`${weeks} week${weeks !== 1 ? "s" : ""}`);
  if (days > 0 && years === 0 && months === 0)
    parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0 && years === 0 && months === 0 && weeks === 0)
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0 && years === 0 && months === 0 && weeks === 0 && days === 0)
    parts.push(`${minutes} min${minutes !== 1 ? "s" : ""}`);

  // Return up to 2 parts
  const displayParts = parts.slice(0, 2);

  if (displayParts.length === 0) {
    return "< 1 min";
  }

  return displayParts.join(" ") + " to circle Earth";
}
