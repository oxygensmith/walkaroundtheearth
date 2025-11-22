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
    dawnStart: minutesToTime(solarNoon - 4 * hourAngleCivil, date), // Pass date
    sunrise: minutesToTime(solarNoon - 4 * hourAngleSun, date), // Pass date
    sunset: minutesToTime(solarNoon + 4 * hourAngleSun, date), // Pass date
    duskEnd: minutesToTime(solarNoon + 4 * hourAngleCivil, date), // Pass date
    isPolarNight: false,
    isPolarDay: false,
  };
}

// Update minutesToTime to use the provided date
function minutesToTime(minutes, date) {
  let totalMinutes = Math.floor(minutes);

  // Handle negative minutes (previous day)
  let dayOffset = 0;
  while (totalMinutes < 0) {
    totalMinutes += 1440; // 24 * 60
    dayOffset--;
  }

  // Handle minutes beyond 24 hours (next day)
  while (totalMinutes >= 1440) {
    totalMinutes -= 1440;
    dayOffset++;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  // Create date with proper day offset
  const result = new Date(date);
  result.setUTCDate(date.getUTCDate() + dayOffset);
  result.setUTCHours(hours, mins, 0, 0);

  return result;
}

// Get current time of day phase
export function getTimeOfDay(lat, lng, date = new Date()) {
  // const now = new Date();
  const times = getSunTimes(lat, lng, date); // use provided date

  /* Uncomment if debugging sun times */
  /* console.log(
    `🌅 Sun times for lat=${lat.toFixed(2)}, lng=${lng.toFixed(2)}:`,
    `Dawn: ${times.dawnStart?.toUTCString()},`,
    `Sunrise: ${times.sunrise?.toUTCString()},`,
    `Sunset: ${times.sunset?.toUTCString()},`,
    `Dusk: ${times.duskEnd?.toUTCString()}`
  ); */

  // Handle polar conditions
  if (times.isPolarDay) return "day";
  if (times.isPolarNight) return "night";

  const currentUTC = date.getTime();

  // Duration of sunrise/sunset periods in milliseconds
  const SUNRISE_DURATION = 20 * 60 * 1000; // 20 minutes
  const SUNSET_DURATION = 20 * 60 * 1000; // 20 minutes

  if (
    currentUTC >= times.dawnStart.getTime() &&
    currentUTC < times.sunrise.getTime()
  ) {
    return "dawn";
  } else if (
    currentUTC >= times.sunrise.getTime() &&
    currentUTC < times.sunrise.getTime() + SUNRISE_DURATION
  ) {
    return "sunrise";
  } else if (
    currentUTC >= times.sunrise.getTime() + SUNRISE_DURATION &&
    currentUTC < times.sunset.getTime() - SUNSET_DURATION
  ) {
    return "day";
  } else if (
    currentUTC >= times.sunset.getTime() - SUNSET_DURATION &&
    currentUTC < times.sunset.getTime()
  ) {
    return "sunset";
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
