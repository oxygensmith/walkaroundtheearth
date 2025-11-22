/* Walk Around the Earth */
/* renderer.js - Handles visual updates and DOM manipulation */

import {
  formatCoordinates,
  formatTimeToCircumnavigate,
  getLocalSolarTime,
} from "./wate-locations.js";
import { journeyMessages } from "./wate-messages.js";
import { getTimeOfDay, applyTheme, getSunTimes } from "./wate-daynight.js";
import { calculateNewPosition } from "./wate-locations.js";

export class Renderer {
  constructor(journey) {
    this.journey = journey;
    this.journeyLine = document.getElementById("journey-line");
    this.distanceValue = document.getElementById("distance-value");
    this.distanceMarkers = document.getElementById("distance-markers");
    this.projectTitle = document.querySelector(".project-title");
    this.coordinatesDisplay = document.getElementById("coordinates-display");
    this.speedValue = document.getElementById("speed-value");
    this.meterValue = document.getElementById("meter-value");
    this.timeDisplay = document.getElementById("time-display");
    this.originIcon = document.getElementById("origin-icon");
    this.terrainDisplay = document.getElementById("terrain-display");
    this.viewportWidth = window.innerWidth;
    this.timeElapsedDisplay = document.getElementById("time-elapsed-display");
    this.timeDisplayMode = "elapsed";
    this.currentTimeOfDay = null;
    this.solarTimeDisplay = document.getElementById("solar-time-display");
    this.showingSolarTime = true; // Track which time is showing
    this.themeCheckCounter = 0;
    this.departedFromDisplay = document.getElementById("departed-from-display");
    this.periodDisplay = document.getElementById("period-display");
    this.nextTransitionDisplay = document.getElementById(
      "next-transition-display"
    );

    // this.showingElapsed = true;

    // Set departure city immediately
    this.updateDepartedFrom();

    // Track which markers are currently rendered
    this.renderedMarkers = new Map();

    // Track which messages are currently rendered
    this.renderedMessages = new Map();

    // Handle window resize
    window.addEventListener("resize", () => {
      this.viewportWidth = window.innerWidth;
    });

    // Make solar time display clickable
    if (this.solarTimeDisplay) {
      this.solarTimeDisplay.style.cursor = "pointer";
      this.solarTimeDisplay.addEventListener("click", () => {
        this.showingSolarTime = !this.showingSolarTime;
        this.updateSolarTime(); // Immediate update
      });
    }

    // Make time elapsed clickable
    if (this.timeElapsedDisplay) {
      this.timeElapsedDisplay.style.cursor = "pointer";
      this.timeElapsedDisplay.addEventListener("click", () => {
        // Cycle through three modes
        switch (this.timeDisplayMode) {
          case "elapsed":
            this.timeDisplayMode = "remaining";
            console.log("Time elapsed: Switched to remaining time.");
            break;
          case "remaining":
            this.timeDisplayMode = "started";
            console.log("Time elapsed: Switched to start time.");
            break;
          case "started":
            this.timeDisplayMode = "elapsed";
            console.log("Time elapsed: Switched to elapsed time.");
            break;
          default:
            this.timeDisplayMode = "elapsed";
            console.log("Default condition: Switched to elapsed time.");
        }

        // NEW - force immediate update
        this.updateTimeElapsed();
      });
    }
  }

  // Main render function called each frame
  render() {
    this.updateJourneyLine();
    this.updateDistanceDisplay();
    this.updateMarkers();
    this.updateMessages();
    this.updateProjectTitle();
    this.updateCoordinates();
    this.updateOriginIconRotation();
    this.updateMeterDisplay();
    this.updateTimeElapsed();
    this.updateNextTransition();

    // Calculate speed once per frame and use it for both displays
    const currentSpeed = this.journey.getSpeed();
    this.updateSpeed(currentSpeed);
    this.updateTimeToCircumnavigate(currentSpeed);

    this.updateTerrainDisplay();
    this.updatePeriodDisplay();
    this.updateSolarTime();
    this.updateTheme();
  }

  // Update the journey line position
  updateJourneyLine() {
    const offset = this.journey.getOffset();
    this.journeyLine.style.transform = `translate(-50%, -50%) translateX(${-offset}px)`;
  }

  // Update the distance counter
  updateDistanceDisplay() {
    const distance = Math.abs(this.journey.getDistance());
    this.distanceValue.textContent = Math.floor(distance).toLocaleString();
  }

  updatePeriodDisplay() {
    if (!this.periodDisplay) return;

    // Use the current theme state
    if (this.currentTimeOfDay) {
      this.periodDisplay.textContent = this.currentTimeOfDay.toUpperCase();
    }
  }

  // Update visible distance markers
  updateMarkers() {
    const visibleMarkers = this.journey.getVisibleMarkers(this.viewportWidth);
    const currentMarkerKeys = new Set(visibleMarkers.map((m) => m.km));

    // Remove markers that are no longer visible
    for (const [key, element] of this.renderedMarkers.entries()) {
      if (!currentMarkerKeys.has(key)) {
        element.remove();
        this.renderedMarkers.delete(key);
      }
    }

    // Add or update visible markers
    for (const marker of visibleMarkers) {
      let element = this.renderedMarkers.get(marker.km);

      if (!element) {
        // Create new marker
        element = this.createMarkerElement(marker);
        this.distanceMarkers.appendChild(element);
        this.renderedMarkers.set(marker.km, element);
      }

      // Update position
      element.style.left = `${marker.offset}px`;
    }
  }

  updateTimeElapsed() {
    if (!this.timeElapsedDisplay) return;

    switch (this.timeDisplayMode) {
      case "elapsed": {
        // Show elapsed time
        const elapsed = this.journey.getElapsedTime();
        const formatted = this.formatDuration(elapsed);
        this.timeElapsedDisplay.innerHTML = `Elapsed: ${formatted}`;
        break;
      }
      case "remaining": {
        // Show remaining time (only in cruise control)
        if (this.journey.getTravelMode() === "cruiseControl") {
          const remaining = this.journey.getTimeRemaining();
          if (remaining) {
            const formatted = this.formatDuration(remaining);
            this.timeElapsedDisplay.innerHTML = `Remaining: ${formatted}`;
          } else {
            this.timeElapsedDisplay.innerHTML = "Remaining: —";
          }
        } else {
          this.timeElapsedDisplay.innerHTML = "Remaining: —";
        }
        break;
      }
      case "started": {
        // Show start date/time
        if (this.journey.journeyStartTime) {
          const startDate = new Date(this.journey.journeyStartTime);
          const formatted = this.formatStartTime(startDate);
          this.timeElapsedDisplay.innerHTML = `Began: ${formatted}`;
        } else {
          this.timeElapsedDisplay.innerHTML = "Not started";
        }
        break;
      }
      default: {
        const elapsed = this.journey.getElapsedTime();
        const formatted = this.formatDuration(elapsed);
        this.timeElapsedDisplay.textContent = `Elapsed: ${formatted}`;
      }
    }
  }

  updateNextTransition() {
    if (!this.nextTransitionDisplay) return;

    if (this.journey.getTravelMode() !== "cruiseControl") {
      this.nextTransitionDisplay.style.display = "none";
      return;
    }

    this.nextTransitionDisplay.style.display = "block";

    const cruiseMode = this.journey.getCurrentCruiseMode();
    const speed = cruiseMode.speed; // km/h

    // SPECIAL CASE: Standing still (speed = 0 or very slow)
    if (speed < 0.1) {
      const position = this.journey.getCurrentPosition();
      const virtualTime = this.journey.getVirtualTime();
      const times = getSunTimes(position.lat, position.lng, virtualTime);
      const currentTimeOfDay = getTimeOfDay(
        position.lat,
        position.lng,
        virtualTime
      );

      let nextEventTime, nextEventName;

      if (currentTimeOfDay === "night") {
        nextEventTime = times.dawnStart;
        nextEventName = "Dawn";
      } else if (currentTimeOfDay === "dawn") {
        nextEventTime = times.sunrise;
        nextEventName = "Sunrise";
      } else if (currentTimeOfDay === "day") {
        nextEventTime = times.sunset;
        nextEventName = "Sunset";
      } else if (currentTimeOfDay === "dusk") {
        nextEventTime = times.duskEnd;
        nextEventName = "Night";
      }

      const msUntil = nextEventTime.getTime() - virtualTime.getTime();

      this.nextTransitionDisplay.innerHTML = `
      Next ${nextEventName} in ${this.formatDuration(msUntil)}<br>
      Standing still
    `;
      return;
    }

    // NORMAL CASE: Moving - simulate forward
    const currentTimeOfDay = getTimeOfDay(
      this.journey.getCurrentPosition().lat,
      this.journey.getCurrentPosition().lng,
      this.journey.getVirtualTime()
    );

    // Simulate forward to find when theme changes
    let simulatedDistance = this.journey.distance;
    let simulatedTime = this.journey.virtualTime;
    const timeStep = 60 * 60 * 1000; // 1 hour in ms
    const distanceStep = speed; // km per hour

    let steps = 0;
    const maxSteps = 48; // Don't simulate more than 48 hours

    while (steps < maxSteps) {
      simulatedDistance += distanceStep;
      simulatedTime += timeStep;

      const futurePosition = calculateNewPosition(
        this.journey.getStartLocation().lat,
        this.journey.getStartLocation().lng,
        this.journey.bearing,
        simulatedDistance
      );

      const futureTimeOfDay = getTimeOfDay(
        futurePosition.lat,
        futurePosition.lng,
        new Date(simulatedTime)
      );

      if (futureTimeOfDay !== currentTimeOfDay) {
        // Found the transition!
        const msUntil = simulatedTime - this.journey.virtualTime;
        const kmUntil = speed * (msUntil / (1000 * 60 * 60));

        const nextPeriodName =
          futureTimeOfDay.charAt(0).toUpperCase() + futureTimeOfDay.slice(1);

        this.nextTransitionDisplay.innerHTML = `
        Next ${nextPeriodName} in ${this.formatDuration(msUntil)}<br>
        ${kmUntil.toFixed(1)} km away
      `;
        return;
      }

      steps++;
    }

    // Fallback if no transition found
    this.nextTransitionDisplay.innerHTML = `No transition in next 48h`;
  }

  formatStartTime(date) {
    const dateOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const dateStr = date.toLocaleDateString("en-US", dateOptions);

    const timeOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    const timeStr = date.toLocaleTimeString("en-US", timeOptions);

    return `${dateStr}, ${timeStr}`;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const years = Math.floor(days / 365.25);

    if (years > 1) {
      const remainingDays = Math.floor(days % 365.25);
      return `${years}y ${remainingDays}d`;
    } else if (days > 1) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 1) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 1) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  updateDepartedFrom() {
    if (!this.departedFromDisplay) return;

    const departureCity = this.journey.getStartLocation().name;
    this.departedFromDisplay.innerHTML = `(departed from: ${departureCity})`;
  }

  // Create a marker DOM element
  createMarkerElement(marker) {
    const div = document.createElement("div");
    div.className = `marker ${marker.type}`;

    if (marker.label) {
      const label = document.createElement("div");
      label.className = "marker-label writing-font";
      label.textContent = `${marker.label} km`;
      div.appendChild(label);
    }

    // Add subtitle for origin marker
    if (marker.type === "origin") {
      const subtitle = document.createElement("div");
      subtitle.className = "marker-subtitle writing-font";
      subtitle.textContent = this.journey.getStartLocation().name;
      div.appendChild(subtitle);
    }

    return div;
  }

  // Update project title position with drift effect
  updateProjectTitle() {
    const distance = this.journey.getDistance();
    const threshold = 150; // km before title starts drifting

    if (Math.abs(distance) <= threshold) {
      // Within threshold: title stays fixed at upper left
      this.projectTitle.style.transform = "translateX(0)";
    } else {
      // Beyond threshold: title drifts away with ease-out
      const excessDistance = Math.abs(distance) - threshold;
      const driftAmount =
        this.easeOutCubic(Math.min(excessDistance / 100, 1)) *
        this.viewportWidth;

      if (distance > threshold) {
        // Traveling right: drift left (off screen to the left)
        this.projectTitle.style.transform = `translateX(-${driftAmount}px)`;
      } else {
        // Traveling left: drift right (off screen to the right)
        this.projectTitle.style.transform = `translateX(${driftAmount}px)`;
      }
    }
  }

  // Ease-out cubic function for smooth deceleration
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Update coordinates display
  updateCoordinates() {
    const position = this.journey.getCurrentPosition();
    this.coordinatesDisplay.textContent = formatCoordinates(
      position.lat,
      position.lng
    );
  }

  updateTerrainDisplay() {
    const waypointInfo = this.journey.getCurrentWaypointInfo();

    if (!waypointInfo) return;

    this.terrainDisplay.textContent = waypointInfo.terrain;
  }

  // Update speed display
  updateSpeed(speed) {
    // Check if we're in cruise control mode
    if (this.journey.getTravelMode() === "cruiseControl") {
      // Display the exact cruise speed with specified decimals
      const cruiseMode = this.journey.getCurrentCruiseMode();
      const cruiseSpeed = cruiseMode.speed;
      const decimals =
        cruiseMode.decimals !== undefined ? cruiseMode.decimals : 0;

      const formattedSpeed = cruiseSpeed.toFixed(decimals);
      this.speedValue.textContent = `${formattedSpeed} km/h`;
    } else {
      // Free scroll mode: use calculated speed with auto-formatting
      let formattedSpeed;
      if (speed >= 1000) {
        formattedSpeed = Math.round(speed).toLocaleString();
      } else if (speed >= 10) {
        formattedSpeed = Math.round(speed).toString();
      } else {
        formattedSpeed = speed.toFixed(1);
      }

      this.speedValue.textContent = `${formattedSpeed} km/h`;
    }
  }

  // Update time to circumnavigate display
  updateTimeToCircumnavigate(speed) {
    if (!this.timeDisplay) {
      console.error("timeDisplay element not found");
      return;
    }

    let displaySpeed;

    // In cruise control, use the exact cruise mode speed
    if (this.journey.getTravelMode() === "cruiseControl") {
      const cruiseMode = this.journey.getCurrentCruiseMode();
      displaySpeed = cruiseMode.speed;
      // No threshold check for cruise control - always show time
      const formattedTime = formatTimeToCircumnavigate(displaySpeed);
      this.timeDisplay.textContent = formattedTime;
    } else {
      // In free scroll, use the calculated speed with threshold
      displaySpeed = speed;

      // Only show time if moving at a reasonable speed
      if (displaySpeed < 0.1) {
        this.timeDisplay.textContent = "—";
      } else {
        const formattedTime = formatTimeToCircumnavigate(displaySpeed);
        this.timeDisplay.textContent = formattedTime;
      }
    }
  }
  updateMeterDisplay() {
    const distanceKm = Math.abs(this.journey.getDistance());
    const meters = distanceKm * 1000; // Convert km to meters (but don't floor yet)

    // In cruise control, adjust precision based on speed
    if (this.journey.getTravelMode() === "cruiseControl") {
      const cruiseMode = this.journey.getCurrentCruiseMode();

      // For extremely slow speeds, show decimal places
      if (cruiseMode.speed < 0.001) {
        // Continental drift and similar - show 6 decimals
        this.meterValue.textContent = `${meters.toFixed(6)} m`;
      } else if (cruiseMode.speed < 1) {
        // Snail, sloth, turtle - show 2 decimals
        this.meterValue.textContent = `${meters.toFixed(2)} m`;
      } else {
        // Normal speeds - whole meters
        this.meterValue.textContent = `${Math.floor(
          meters
        ).toLocaleString()} m`;
      }
    } else {
      // Free scroll mode - whole meters
      this.meterValue.textContent = `${Math.floor(meters).toLocaleString()} m`;
    }
  }

  // Update origin icon rotation based on velocity
  updateOriginIconRotation() {
    const velocity = this.journey.velocity;

    /* future flipping script */
    /* if (Math.abs(velocity) < 0.01) {
      // Not moving - no rotation
      this.originIcon.style.setProperty("--fa-rotate-angle", "0deg");
    } else if (velocity > 0) {
      // Traveling right
      this.originIcon.style.setProperty("--fa-rotate-angle", "90deg");
    } else {
      // Traveling left
      this.originIcon.style.setProperty("--fa-rotate-angle", "-90deg");
    } */
  }

  // Add this method to renderer.js
  updateTheme() {
    // Only check every 60 frames (once per second at 60fps)
    this.themeCheckCounter++;

    if (this.themeCheckCounter % 60 === 0) {
      const position = this.journey.getCurrentPosition();
      const virtualTime = this.journey.getVirtualTime();
      const timeOfDay = getTimeOfDay(position.lat, position.lng, virtualTime);

      if (timeOfDay !== this.currentTimeOfDay) {
        applyTheme(timeOfDay);
        this.currentTimeOfDay = timeOfDay;
      }
    }
  }

  updateSolarTime() {
    if (!this.solarTimeDisplay) return;

    if (this.showingSolarTime) {
      // Show solar time at current position
      const position = this.journey.getCurrentPosition();
      const virtualTime = this.journey.getVirtualTime();
      const solarTime = getLocalSolarTime(position.lng, virtualTime);
      this.solarTimeDisplay.textContent = `Solar Time: ${solarTime.formatted}`;
    } else {
      // Show user's local time (real-world)
      const now = new Date();
      const localTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      this.solarTimeDisplay.textContent = `Your Time: ${localTime}`;
    }
  }

  // Update visible journey messages
  updateMessages() {
    const visibleMessages = this.getVisibleMessages();
    const currentMessageKeys = new Set(visibleMessages.map((m) => m.km));

    // Remove messages that are no longer visible
    for (const [key, element] of this.renderedMessages.entries()) {
      if (!currentMessageKeys.has(key)) {
        element.remove();
        this.renderedMessages.delete(key);
      }
    }

    // Add or update visible messages
    for (const message of visibleMessages) {
      let element = this.renderedMessages.get(message.km);

      if (!element) {
        // Create new message
        element = this.createMessageElement(message);
        this.distanceMarkers.appendChild(element);
        this.renderedMessages.set(message.km, element);
      }

      // Update position
      element.style.left = `${message.offset}px`;
    }
  }

  // Get messages that should be visible in viewport
  getVisibleMessages() {
    const messages = [];
    const viewportKm = this.journey.pixelsToKm(this.viewportWidth);
    const startKm = this.journey.distance - viewportKm;
    const endKm = this.journey.distance + viewportKm;

    for (const message of journeyMessages) {
      if (message.km >= startKm && message.km <= endKm) {
        messages.push({
          km: message.km,
          text: message.text,
          offset: this.journey.kmToPixels(message.km),
        });
      }
    }

    return messages;
  }

  // Create a message DOM element
  createMessageElement(message) {
    const div = document.createElement("div");
    div.className = "journey-message";

    // Split text by pipe character and create paragraphs
    const paragraphs = message.text.split("|");

    paragraphs.forEach((paragraph, index) => {
      const p = document.createElement("p");
      p.textContent = paragraph.trim();
      if (index > 0) {
        p.style.marginTop = "1em"; // Add spacing for subsequent paragraphs
      }
      div.appendChild(p);
    });

    return div;
  }
}

export function getLocalSolarTime(lng, virtualTime) {
  const date = new Date(virtualTime);

  // Solar time: 15° longitude = 1 hour
  const hoursFromUTC = lng / 15;

  // Get UTC time from virtual time
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcSeconds = date.getUTCSeconds();

  // Calculate local solar time
  let solarHours = utcHours + hoursFromUTC;

  // Normalize to 0-24 range
  while (solarHours < 0) solarHours += 24;
  while (solarHours >= 24) solarHours -= 24;

  const hours = Math.floor(solarHours);
  const minutes = Math.floor((solarHours % 1) * 60 + utcMinutes);
  const seconds = utcSeconds;

  // Format as 12-hour time
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return {
    formatted: `${displayHours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")} ${period}`,
    hours,
    minutes,
    seconds,
    period,
  };
}
