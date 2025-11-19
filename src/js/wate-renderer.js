/* Walk Around the Earth */
/* renderer.js - Handles visual updates and DOM manipulation */

import {
  formatCoordinates,
  formatTimeToCircumnavigate,
} from "./wate-locations.js";
import { journeyMessages } from "./wate-messages.js";

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
    // this.showingElapsed = true;

    // Track which markers are currently rendered
    this.renderedMarkers = new Map();

    // Track which messages are currently rendered
    this.renderedMessages = new Map();

    // Handle window resize
    window.addEventListener("resize", () => {
      this.viewportWidth = window.innerWidth;
    });

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

    // Calculate speed once per frame and use it for both displays
    const currentSpeed = this.journey.getSpeed();
    this.updateSpeed(currentSpeed);
    this.updateTimeToCircumnavigate(currentSpeed);

    this.updateTerrainDisplay();
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
        this.timeElapsedDisplay.textContent = `Elapsed: ${formatted}`;
        break;
      }
      case "remaining": {
        // Show remaining time (only in cruise control)
        if (this.journey.getTravelMode() === "cruiseControl") {
          const remaining = this.journey.getTimeRemaining();
          if (remaining) {
            const formatted = this.formatDuration(remaining);
            this.timeElapsedDisplay.textContent = `Remaining: ${formatted}`;
          } else {
            this.timeElapsedDisplay.textContent = "Remaining: —";
          }
        } else {
          this.timeElapsedDisplay.textContent = "Remaining: —";
        }
        break;
      }
      case "started": {
        // Show start date/time
        if (this.journey.journeyStartTime) {
          const startDate = new Date(this.journey.journeyStartTime);
          const formatted = this.formatStartTime(startDate);
          this.timeElapsedDisplay.textContent = `Began: ${formatted}`;
        } else {
          this.timeElapsedDisplay.textContent = "Not started";
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
