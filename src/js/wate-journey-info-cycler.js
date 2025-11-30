/* Walk Around the Earth */
/* journey-info-cycler.js - Manages the meditative journey information display */

export class JourneyInfoCycler {
  constructor(options = {}) {
    // Configuration
    this.cycleDuration = options.cycleDuration || 4500; // milliseconds (4.5 seconds)
    this.transitionDuration = 400; // milliseconds
    this.journey = options.journey || null;
    this.renderer = options.renderer || null;

    // DOM elements
    this.container = document.getElementById("journey-info-display");
    this.cyclingContainer = document.getElementById(
      "journey-info-cycling-container"
    );
    this.cyclingText = document.getElementById("journey-info-cycling");
    this.toggleBtn = document.getElementById("journey-info-toggle");
    this.closeBtn = document.getElementById("journey-info-close");
    this.expandedSection = document.getElementById("journey-info-expanded");
    this.periodDisplay = document.getElementById("journey-period");
    this.terrainDisplay = document.getElementById("journey-terrain");

    // State
    this.currentLineIndex = 0;
    this.isExpanded = false;
    this.isHovering = false;
    this.cycleTimer = null;
    this.lines = [
      {
        id: "elapsed-to-circle",
        label: "Time to Circle Earth",
        getValue: () => this.getTimeToCircumnavigate(),
      },
      {
        id: "departed-from",
        label: "Departed From",
        getValue: () => {
          const location = this.journey?.getStartLocation();
          return location
            ? `DEPARTED FROM ${location.name.toUpperCase()}`
            : "DEPARTED FROM —";
        },
      },
      {
        id: "began-time",
        label: "Began",
        getValue: () => {
          if (!this.journey?.journeyStartTime) return "BEGAN —";
          const date = new Date(this.journey.journeyStartTime);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const timeStr = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return `BEGAN ${dateStr} AT ${timeStr}`;
        },
      },
    ];

    this.init();
  }

  init() {
    // Event listeners
    this.toggleBtn.addEventListener("click", () => this.toggleExpanded());
    this.closeBtn.addEventListener("click", () => this.collapse());

    // Pause cycling on hover
    this.cyclingContainer.addEventListener("mouseenter", () => {
      this.isHovering = true;
      this.pauseCycle();
    });

    this.cyclingContainer.addEventListener("mouseleave", () => {
      this.isHovering = false;
      this.resumeCycle();
    });

    // Start the cycling
    this.startCycling();

    console.log("🔄 JourneyInfoCycler initialized");
  }

  startCycling() {
    // Update the initial line
    this.updateCyclingText(0);

    // Start the cycle timer
    this.cycleTimer = setInterval(() => {
      this.nextLine();
    }, this.cycleDuration);
  }

  pauseCycle() {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  resumeCycle() {
    if (!this.isHovering) {
      this.startCycling();
    }
  }

  nextLine() {
    const nextIndex = (this.currentLineIndex + 1) % this.lines.length;
    this.updateCyclingText(nextIndex);
  }

  updateCyclingText(nextIndex) {
    const currentLine = this.cyclingText.querySelector(
      `[data-index="${this.currentLineIndex}"]`
    );
    const nextLine = this.cyclingText.querySelector(
      `[data-index="${nextIndex}"]`
    );

    if (currentLine && nextLine) {
      // Add exiting animation to current line
      currentLine.classList.remove("journey-info-line--active");
      currentLine.classList.add("journey-info-line--exiting");

      // Wait for exit animation, then add entering animation
      setTimeout(() => {
        currentLine.classList.remove("journey-info-line--exiting");

        // Update the content
        const lineData = this.lines[nextIndex];
        const valueElement = nextLine.querySelector(".journey-info-value");
        valueElement.textContent = lineData.getValue();

        // Add entering animation
        nextLine.classList.add("journey-info-line--entering");

        setTimeout(() => {
          nextLine.classList.remove("journey-info-line--entering");
          nextLine.classList.add("journey-info-line--active");
        }, 0);
      }, this.transitionDuration);
    }

    this.currentLineIndex = nextIndex;
  }

  toggleExpanded() {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  expand() {
    this.isExpanded = true;
    this.expandedSection.classList.add("visible");
    this.toggleBtn.classList.add("expanded");

    // Pause cycling when expanded
    this.pauseCycle();

    // Update all stats
    this.updateAllStats();

    console.log("📈 Journey info expanded");
  }

  collapse() {
    this.isExpanded = false;
    this.expandedSection.classList.remove("visible");
    this.toggleBtn.classList.remove("expanded");

    // Resume cycling when collapsed
    if (!this.isHovering) {
      this.resumeCycle();
    }

    console.log("📉 Journey info collapsed");
  }

  // Update all stat displays
  updateAllStats() {
    const position = this.journey?.getCurrentPosition();
    const waypointInfo = this.journey?.getCurrentWaypointInfo();

    // Coordinates
    if (position) {
      const latDir = position.lat >= 0 ? "N" : "S";
      const lngDir = position.lng >= 0 ? "E" : "W";
      document.getElementById("stat-latitude").textContent = `${Math.abs(
        position.lat
      ).toFixed(4)}°${latDir}`;
      document.getElementById("stat-longitude").textContent = `${Math.abs(
        position.lng
      ).toFixed(4)}°${lngDir}`;
    }

    // Distance and speed
    const distanceKm = Math.abs(this.journey?.getDistance() || 0);
    const distanceM = distanceKm * 1000;
    document.getElementById("stat-distance").textContent = `${Math.floor(
      distanceM
    ).toLocaleString()} m`;

    const speed = this.renderer?.speedValue?.textContent || "0 km/h";
    document.getElementById("stat-speed").textContent = speed;

    // Time information
    const elapsed = this.renderer?.timeElapsedDisplay?.textContent || "—";
    document.getElementById("stat-elapsed").textContent = elapsed;

    const remaining = this.renderer?.timeDisplay?.textContent || "—";
    document.getElementById("stat-remaining").textContent = remaining;

    // Solar time and next period
    const solarTime =
      this.renderer?.solarTimeDisplay?.textContent || "12:00:00 PM";
    document.getElementById("stat-solar-time").textContent = solarTime;

    const nextTransition =
      this.renderer?.nextTransitionDisplay?.textContent || "—";
    document.getElementById("stat-next-period").textContent = nextTransition;
    document.getElementById("stat-event-distance").textContent = nextTransition; // Same info

    // Terrain
    if (waypointInfo) {
      this.terrainDisplay.textContent = `OVER ${waypointInfo.terrain.toUpperCase()}`;
    }

    // Period
    if (this.renderer?.currentTimeOfDay) {
      this.periodDisplay.textContent =
        this.renderer.currentTimeOfDay.toUpperCase();
    }
  }

  // Get formatted time to circumnavigate
  getTimeToCircumnavigate() {
    if (!this.renderer?.timeDisplay?.textContent) {
      return "TIME TO CIRCLE EARTH —";
    }
    return `${this.renderer.timeDisplay.textContent.toUpperCase()}`;
  }

  // Called on every frame update (from main render loop)
  update() {
    if (this.isExpanded) {
      this.updateAllStats();
    }
  }

  // Clean up
  destroy() {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
    }
    console.log("🗑️ JourneyInfoCycler destroyed");
  }
}
