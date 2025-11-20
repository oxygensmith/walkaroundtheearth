/* Walk Around the Earth */
/* daynight.js - Calculate day/night cycles with twilight periods */

// Calculate sunrise/sunset and twilight times
export function getSunTimes(lat, lng, date = new Date()) {
  const DEGREES_TO_RADIANS = Math.PI / 180;
  const RADIANS_TO_DEGREES = 180 / Math.PI;

  // Get day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Calculate solar declination
  const declination =
    -23.45 * Math.cos(DEGREES_TO_RADIANS * (360 / 365) * (dayOfYear + 10));

  // Calculate hour angles for different twilight stages
  const latRad = lat * DEGREES_TO_RADIANS;
  const decRad = declination * DEGREES_TO_RADIANS;

  // Civil twilight: sun 6° below horizon
  const civilAngle = 96; // 90° + 6°
  const cosHourAngleCivil =
    (Math.cos(civilAngle * DEGREES_TO_RADIANS) -
      Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  // Sunrise/sunset: sun at horizon (with refraction)
  const sunAngle = 90.833;
  const cosHourAngleSun =
    (Math.cos(sunAngle * DEGREES_TO_RADIANS) -
      Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  // Check for polar conditions
  if (cosHourAngleSun > 1) {
    return { isPolarNight: true };
  }
  if (cosHourAngleSun < -1) {
    return { isPolarDay: true };
  }

  const hourAngleSun = Math.acos(cosHourAngleSun) * RADIANS_TO_DEGREES;
  const hourAngleCivil =
    Math.acos(Math.max(-1, Math.min(1, cosHourAngleCivil))) *
    RADIANS_TO_DEGREES;

  // Calculate times in minutes since midnight UTC
  const solarNoon = 720 - 4 * lng;

  return {
    dawnStart: minutesToTime(solarNoon - 4 * hourAngleCivil), // Civil twilight begins
    sunrise: minutesToTime(solarNoon - 4 * hourAngleSun), // Sun rises
    sunset: minutesToTime(solarNoon + 4 * hourAngleSun), // Sun sets
    duskEnd: minutesToTime(solarNoon + 4 * hourAngleCivil), // Civil twilight ends
    isPolarNight: false,
    isPolarDay: false,
  };
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = Math.floor(minutes % 60);
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      mins,
      0
    )
  );
}

// Get current time of day phase
export function getTimeOfDay(lat, lng) {
  const now = new Date();
  const times = getSunTimes(lat, lng, now);

  // Handle polar conditions
  if (times.isPolarDay) return "day";
  if (times.isPolarNight) return "night";

  const currentUTC = now.getTime();

  if (
    currentUTC >= times.dawnStart.getTime() &&
    currentUTC < times.sunrise.getTime()
  ) {
    return "dawn";
  } else if (
    currentUTC >= times.sunrise.getTime() &&
    currentUTC < times.sunset.getTime()
  ) {
    return "day";
  } else if (
    currentUTC >= times.sunset.getTime() &&
    currentUTC < times.duskEnd.getTime()
  ) {
    return "dusk";
  } else {
    return "night";
  }
}

// Apply theme with smooth transitions
export function applyTheme(timeOfDay) {
  document.documentElement.setAttribute("data-theme", timeOfDay);
  console.log(`🌓 Theme: ${timeOfDay}`);
}
