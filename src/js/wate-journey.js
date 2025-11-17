/* Walk Around the Earth */
/* journey.js - Handles the journey state and physics */

import { getRandomLocation, calculateNewPosition } from "./wate-locations.js";
import { getGeographicInfo } from "./wate-geography.js";

const EARTH_CIRCUMFERENCE_KM = 40041.44; // Average of polar and equatorial
const SCALE_PX_PER_KM = 10; // 10 pixels = 1 kilometer
const MAX_VELOCITY = 15; // Maximum pixels per frame
const FRICTION = 0.92; // Velocity decay
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

    // Select a random starting location
    this.startLocation = getRandomLocation();
    // For now, we'll travel due east (90 degrees)
    this.bearing = 90;

    this.waypoints = [];
    this.waypointsReady = false;

    // Start generating waypoints (don't await here)
    this.generateWaypoints().then(() => {
      this.waypointsReady = true;
      console.log("✅ Waypoints ready!");
    });

    // Travel modes
    this.travelMode = "freeScroll"; // "freeScroll" or "cruiseControl"

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
    this.cruiseModes = [
      { name: "Walking", speed: 5, icon: "fa-person-walking" },
      { name: "Running", speed: 10, icon: "fa-person-running" },
      { name: "Bicycle", speed: 15, icon: "fa-person-biking" },
      { name: "Car", speed: 100, icon: "fa-car-side" },
      { name: "Light Aircraft", speed: 220, icon: "fa-plane" },
      { name: "Commercial Airliner", speed: 900, icon: "fa-plane" },
      { name: "Speed of sound (avg)", speed: 1225, icon: "fa-volume-high" },
      { name: "Space Shuttle (LEO)", speed: 28000, icon: "fa-rocket" },
      { name: "Voyager I", speed: 61000, icon: "fa-satellite" },
    ];
    this.currentCruiseModeIndex = 0;
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
    const halfCircumference = EARTH_CIRCUMFERENCE_KM / 2;
    if (this.distance > halfCircumference) {
      this.distance = halfCircumference - (this.distance - halfCircumference);
      this.velocity = 0;
    } else if (this.distance < -halfCircumference) {
      this.distance = -halfCircumference - (this.distance + halfCircumference);
      this.velocity = 0;
    }
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

    // Generate 100km markers
    const start100 = Math.floor(startKm / 100) * 100;
    const end100 = Math.ceil(endKm / 100) * 100;

    for (let km = start100; km <= end100; km += 100) {
      const isMajor = km % 1000 === 0;
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
          ? "major"
          : "minor",
        label:
          isMajor || isAntipodal || isOrigin
            ? Math.abs(km).toLocaleString()
            : null,
      });
    }

    return markers;
  }
}
