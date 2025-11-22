/* Walk Around the Earth */
/* journey.js - Handles the journey state and physics */

import { getRandomLocation, calculateNewPosition } from "./wate-locations.js";
import { getGeographicInfo } from "./wate-geography.js";

// Average of polar and equatorial circumferences.
// Make it exportable.
export const EARTH_CIRCUMFERENCE_KM = 40041.44;

const SCALE_PX_PER_KM = 10; // 10 pixels = 1 kilometer
const MAX_VELOCITY = 15; // Maximum pixels per frame
const FRICTION = 0.92; // Velocity decay (freeScroll mode only)
const SCROLL_SENSITIVITY = 0.5; // How much scroll affects velocity

export class Journey {
  constructor() {
    this.distance = 0; // Current distance in km from origin
    this.velocity = 0; // Current velocity in pixels per frame
    this.isDragging = false;
    this.lastMouseX = 0;
    this.targetDistance = 0;
    this.lastDistance = 0; // For speed calculation
    this.lastTime = performance.now(); // For speed calculation

    // Throttle settings for Free Scroll mode
    this.throttleLevels = [
      { level: 0, maxSpeed: null, label: "No Limit" },
      { level: 1, maxSpeed: 25, label: "25 km/h" },
      { level: 2, maxSpeed: 50, label: "50 km/h" },
      { level: 3, maxSpeed: 100, label: "100 km/h" },
      { level: 4, maxSpeed: 500, label: "500 km/h" },
      { level: 5, maxSpeed: 1000, label: "1,000 km/h" },
      { level: 6, maxSpeed: 5000, label: "5,000 km/h" },
      { level: 7, maxSpeed: 10000, label: "10,000 km/h" },
      { level: 8, maxSpeed: 50000, label: "50,000 km/h" },
      { level: 9, maxSpeed: 100000, label: "100,000 km/h" },
    ];
    this.currentThrottleIndex = 0; // Start with no limit

    // Cruise Control travel modes
    // In journey.js - update cruiseModes array
    this.cruiseModes = [
      { name: "Walking", speed: 5, decimals: 1, icon: "walker" },
      { name: "Running", speed: 10, decimals: 0, icon: "runner" },
      { name: "Scootering", speed: 10, decimals: 0, icon: "scooter" },
      { name: "Bicycle", speed: 15, decimals: 0, icon: "cyclist" },
      { name: "Car", speed: 100, decimals: 0, icon: "car-side" },
      {
        name: "Light Aircraft",
        speed: 220,
        decimals: 0,
        icon: "airplane-propeller",
      },
      {
        name: "Commercial Airliner",
        speed: 900,
        decimals: 0,
        icon: "airplane-commercial",
      },
      {
        name: "Speed of sound (avg)",
        speed: 1225,
        decimals: 0,
        icon: "sound",
      },
      {
        name: "Space Shuttle (LEO)",
        speed: 28000,
        decimals: 0,
        icon: "shuttle",
      },
      { name: "Voyager I", speed: 61000, decimals: 0, icon: "satellite" },
      { name: "Carpenter Ant", speed: 0.8, decimals: 1, icon: "ant" },
      { name: "Turtle", speed: 0.4, decimals: 1, icon: "turtle" },
      { name: "Sloth", speed: 0.24, decimals: 2, icon: "sloth" },
      { name: "Garden Snail", speed: 0.048, decimals: 3, icon: "snail" },
      {
        name: "Continental Drift",
        speed: 0.000004,
        decimals: 6,
        icon: "mountain",
      },
    ];
    this.currentCruiseModeIndex = 0;

    // Virtual time system
    this.virtualTime = Date.now(); // Start at current real time
    this.lastUpdateTime = performance.now();
    this.timeScale = 1; // Real-time by default (can adjust for testing/pause)
    this.isPaused = false;

    // Try to load saved state first
    const savedState = this.loadState();

    if (savedState) {
      // Restore from saved state
      this.startLocation = savedState.startLocation;
      this.bearing = savedState.bearing;
      this.distance = savedState.distance;
      this.travelMode = savedState.travelMode;
      this.currentCruiseModeIndex = savedState.currentCruiseModeIndex;
      this.currentThrottleIndex = savedState.currentThrottleIndex;

      // Calculate distance traveled while away (if in cruise control)
      if (this.travelMode === "cruiseControl") {
        const elapsedMs = Date.now() - savedState.lastSaveTime;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        const cruiseMode = this.cruiseModes[this.currentCruiseModeIndex];
        const distanceTraveled = cruiseMode.speed * elapsedHours;

        this.distance += distanceTraveled;

        console.log(`⏩ Traveled ${distanceTraveled.toFixed(6)} km while away`);

        // Store this info to show in UI
        this.returnInfo = {
          timeAway: elapsedMs,
          distanceTraveled: distanceTraveled,
        };
        document.getElementById("distance-display").classList.remove("hidden");
      }
      this.virtualTime = savedState.virtualTime || Date.now();
    } else {
      // No saved state - start fresh
      this.travelMode = "cruiseControl"; // "freeScroll" or "cruiseControl"
      this.currentCruiseModeIndex = 0; // walking is first
      this.startLocation = getRandomLocation();
      this.bearing = 90;
      this.virtualTime = Date.now();
    }

    if (savedState && savedState.journeyStartTime) {
      this.journeyStartTime = savedState.journeyStartTime;
    } else {
      this.journeyStartTime = null; // not Date.now() - don't set date until start is clicked
    }

    this.waypoints = [];
    this.waypointsReady = false;

    // Start generating waypoints (don't await here)
    this.generateWaypoints().then(() => {
      this.waypointsReady = true;
      console.log("✅ Waypoints ready!");
    });
  }

  updateVirtualTime() {
    if (this.isPaused) return; // Don't advance time when paused

    const now = performance.now();
    const deltaMs = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Advance virtual time
    const virtualDeltaMs = deltaMs * this.timeScale;
    this.virtualTime += virtualDeltaMs;
  }

  getVirtualTime() {
    return new Date(this.virtualTime);
  }

  // Add pause/resume methods
  pause() {
    this.isPaused = true;
    console.log("⏸️ Journey paused");
  }

  resume() {
    this.isPaused = false;
    this.lastUpdateTime = performance.now(); // Reset to avoid time jump
    console.log("▶️ Journey resumed");
  }

  // Add method to start the journey
  startJourney() {
    if (!this.journeyStartTime) {
      this.journeyStartTime = Date.now();
      console.log("🚀 Journey started at:", new Date(this.journeyStartTime));
    }
  }

  // Convert distance in km to pixel offset
  kmToPixels(km) {
    return km * SCALE_PX_PER_KM;
  }

  // Convert pixel offset to distance in km
  pixelsToKm(pixels) {
    return pixels / SCALE_PX_PER_KM;
  }

  // Get the current distance, wrapping at antipodal point
  getDistance() {
    return this.distance;
  }

  // Get the current pixel offset
  getOffset() {
    return this.kmToPixels(this.distance);
  }

  // Update position based on velocity (called each frame)
  update() {
    this.updateVirtualTime();
    // Cruise Control mode: maintain constant speed
    if (this.travelMode === "cruiseControl") {
      const cruiseMode = this.cruiseModes[this.currentCruiseModeIndex];
      const assumedFPS = 60;
      // Convert km/h to pixels per frame
      const kmPerFrame = cruiseMode.speed / (assumedFPS * 3600);
      const pixelsPerFrame = this.kmToPixels(kmPerFrame);
      this.velocity = pixelsPerFrame;
    } else {
      // Free Scroll mode: apply friction
      if (!this.isDragging) {
        this.velocity *= FRICTION;

        // Stop if velocity is negligible
        if (Math.abs(this.velocity) < 0.1) {
          this.velocity = 0;
        }
      }
    }

    // Apply velocity to distance, respecting throttle in Free Scroll mode
    let deltaPixels = this.velocity;

    if (this.travelMode === "freeScroll") {
      const currentThrottle = this.throttleLevels[this.currentThrottleIndex];

      if (currentThrottle.maxSpeed !== null) {
        // Calculate what the speed would be at 60fps
        const assumedFPS = 60;
        const deltaKmRaw = this.pixelsToKm(deltaPixels);
        const speedKmPerHour = Math.abs(deltaKmRaw) * assumedFPS * 3600;

        if (speedKmPerHour > currentThrottle.maxSpeed) {
          // Scale down the velocity to match throttle
          const scaleFactor = currentThrottle.maxSpeed / speedKmPerHour;
          deltaPixels *= scaleFactor;
        }
      }
    }

    const deltaKm = this.pixelsToKm(deltaPixels);
    this.distance += deltaKm;

    // Wrap at antipodal point (half circumference in either direction)
    /* const halfCircumference = EARTH_CIRCUMFERENCE_KM / 2;
    if (this.distance > halfCircumference) {
      this.distance = halfCircumference - (this.distance - halfCircumference);
      this.velocity = 0;
    } else if (this.distance < -halfCircumference) {
      this.distance = -halfCircumference - (this.distance + halfCircumference);
      this.velocity = 0;
    } */
  }

  // Handle mouse/touch drag start
  startDrag(x) {
    this.isDragging = true;
    this.lastMouseX = x;
    this.velocity = 0;
  }

  // Handle mouse/touch drag movement
  drag(x) {
    if (!this.isDragging) return;

    const delta = x - this.lastMouseX;
    this.velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, delta));
    this.lastMouseX = x;
  }

  // Handle mouse/touch drag end
  endDrag() {
    this.isDragging = false;
    // Velocity persists and will decay with friction
  }

  // Handle scroll wheel
  scroll(deltaY) {
    const scrollVelocity = -deltaY * SCROLL_SENSITIVITY;
    this.velocity += scrollVelocity;
    this.velocity = Math.max(
      -MAX_VELOCITY,
      Math.min(MAX_VELOCITY, this.velocity)
    );
  }

  // Get current latitude/longitude based on distance traveled
  getCurrentPosition() {
    return calculateNewPosition(
      this.startLocation.lat,
      this.startLocation.lng,
      this.bearing,
      this.distance
    );
  }

  // Get the starting location
  getStartLocation() {
    return this.startLocation;
  }

  // Get current speed in km/h
  getSpeed() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    const deltaDistance = Math.abs(this.distance - this.lastDistance);

    // Update tracking variables
    this.lastDistance = this.distance;
    this.lastTime = currentTime;

    // Avoid division by zero
    if (deltaTime === 0) return 0;

    // Calculate speed in km/h
    const speedKmPerSecond = deltaDistance / deltaTime;
    const speedKmPerHour = speedKmPerSecond * 3600;

    return speedKmPerHour;
  }

  // Cycle to next throttle level
  cycleThrottle() {
    this.currentThrottleIndex =
      (this.currentThrottleIndex + 1) % this.throttleLevels.length;
    return this.getCurrentThrottle();
  }

  // Get current throttle info
  getCurrentThrottle() {
    return this.throttleLevels[this.currentThrottleIndex];
  }

  // Toggle travel mode
  setTravelMode(mode) {
    this.travelMode = mode;
    if (mode === "cruiseControl") {
      // Reset velocity when entering cruise control
      this.velocity = 0;
    }
  }

  // Get current travel mode
  getTravelMode() {
    return this.travelMode;
  }

  // Cycle to next cruise mode
  cycleCruiseMode() {
    this.currentCruiseModeIndex =
      (this.currentCruiseModeIndex + 1) % this.cruiseModes.length;
    return this.getCurrentCruiseMode();
  }

  // Get current cruise mode
  getCurrentCruiseMode() {
    return this.cruiseModes[this.currentCruiseModeIndex];
  }

  async generateWaypoints() {
    console.log("🗺️ Generating waypoints with geographic data...");
    const startTime = performance.now();

    const totalKm = 40041.44;
    const interval = 100; // Check every 100km

    for (let km = 0; km <= totalKm; km += interval) {
      const position = calculateNewPosition(
        this.startLocation.lat,
        this.startLocation.lng,
        this.bearing,
        km
      );

      // Get geographic info for this point (now async)
      const geoInfo = await getGeographicInfo(position.lat, position.lng);

      this.waypoints.push({
        km,
        ...position,
        ...geoInfo,
      });
    }

    const endTime = performance.now();
    console.log(
      `✅ Generated ${this.waypoints.length} waypoints in ${Math.round(
        endTime - startTime
      )}ms`
    );
  }

  // Get waypoint info for current position
  getCurrentWaypointInfo() {
    if (!this.waypointsReady || this.waypoints.length === 0) {
      return null;
    }
    const currentKm = Math.abs(this.distance);
    const index = Math.round(currentKm / 100);
    return this.waypoints[index] || this.waypoints[0];
  }

  // Get distance markers that should be visible
  getVisibleMarkers(viewportWidth) {
    const markers = [];
    const currentOffset = this.getOffset();
    const viewportKm = this.pixelsToKm(viewportWidth);
    const startKm = this.distance - viewportKm;
    const endKm = this.distance + viewportKm;

    // Generate 10km markers (changed from 100km)
    const start10 = Math.floor(startKm / 10) * 10;
    const end10 = Math.ceil(endKm / 10) * 10;

    for (let km = start10; km <= end10; km += 10) {
      const isMajor = km % 1000 === 0;
      const isHundred = km % 100 === 0;
      const isAntipodal =
        Math.abs(Math.abs(km) - EARTH_CIRCUMFERENCE_KM / 2) < 0.1;
      const isOrigin = km === 0;

      markers.push({
        km,
        offset: this.kmToPixels(km),
        type: isOrigin
          ? "origin"
          : isAntipodal
          ? "antipodal"
          : isMajor
          ? "major" // 1000km - white/thick
          : isHundred
          ? "hundred" // 100km - medium
          : "minor", // 10km - thin
        label:
          isMajor || isAntipodal || isOrigin
            ? Math.abs(km).toLocaleString()
            : null,
      });
    }

    return markers;
  }

  // Save current journey state
  saveState() {
    const state = {
      distance: this.distance,
      startLocation: this.startLocation,
      bearing: this.bearing,
      travelMode: this.travelMode,
      currentCruiseModeIndex: this.currentCruiseModeIndex,
      currentThrottleIndex: this.currentThrottleIndex,
      lastSaveTime: Date.now(),
      journeyStartTime: this.journeyStartTime,
      virtualTime: this.virtualTime, // NEW
      waypointsReady: this.waypointsReady,
      triggeredSequences: window.walkApp?.sequenceManager?.saveState() || [],
      version: "1.0",
    };

    localStorage.setItem("wate-journey", JSON.stringify(state));
    console.log("💾 Journey saved");
  }

  // Load saved journey state
  loadState() {
    console.log("🔍 Checking localStorage for saved journey...");
    const saved = localStorage.getItem("wate-journey");
    console.log("🔍 Raw localStorage value:", saved);

    if (!saved) {
      console.log("✅ No saved state found - starting fresh");
      return null;
    }

    try {
      const state = JSON.parse(saved);
      console.log("📂 Found saved journey:", state);
      return state;
    } catch (e) {
      console.error("Failed to load journey state:", e);
      return null;
    }
  }

  // Clear saved state
  clearState() {
    console.log("🗑️ Clearing journey state...");
    localStorage.removeItem("wate-journey");

    // Double-check it's really gone
    const check = localStorage.getItem("wate-journey");
    console.log("🔍 After removal, localStorage has:", check);

    if (check === null) {
      console.log("✅ Journey state successfully cleared from localStorage");
    } else {
      console.error("❌ WARNING: State still in localStorage after removal!");
    }
  }

  getElapsedTime() {
    return Date.now() - this.journeyStartTime;
  }

  getTimeRemaining() {
    const EARTH_CIRCUMFERENCE = 40041.44;
    const distanceRemaining = EARTH_CIRCUMFERENCE - Math.abs(this.distance);

    // Get current speed
    if (this.getTravelMode() === "cruiseControl") {
      const cruiseMode = this.getCurrentCruiseMode();
      const hoursRemaining = distanceRemaining / cruiseMode.speed;
      return hoursRemaining * 60 * 60 * 1000; // Convert to ms
    }

    return null; // Can't calculate in free scroll mode
  }
}
