/* Walk Around the Earth */
/* main.js - Application entry point - v02 */

import { Journey } from "./wate-journey.js";
import { Renderer } from "./wate-renderer.js";
import { SequenceManager } from "./wate-sequences.js";
import { showGreeting, hideWelcome } from "./wate-messages.js";
import { InfoCarousel } from "./wate-ui-infocarousel.js";

// Utility function to wait
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class WalkAroundTheEarth {
  constructor() {
    this.isAnimating = false;
    this.originIcon = document.getElementById("origin-icon");
    this.hasStarted = false;

    this.setupEventListeners();
    this.setupVisibilityTracking();
    this.startAutoSave();

    /* this.journey = null;
    this.renderer = null;
    this.sequenceManager = null; */

    // Check if we should resume or show start screen
    this.setupStartScreen();

    console.log("🌍 Walk Around the Earth initialized");
  }

  setupStartScreen() {
    const startScreen = document.getElementById("start-screen");
    const beginButton = document.getElementById("begin-journey");
    const locationSelect = document.getElementById("start-location");

    console.log("🎬 Start screen element:", startScreen);
    console.log("🔘 Begin button:", beginButton);
    console.log("📍 Location select:", locationSelect);

    // Check for saved journey
    const savedState = localStorage.getItem("wate-journey");
    console.log("💾 Saved state exists:", !!savedState);

    if (savedState) {
      // Resume saved journey - skip start screen
      console.log("▶️ Resuming saved journey...");
      this.initializeJourney(null); // null = use saved location
      startScreen.classList.add("hidden");

      // Show welcome back message if applicable
      if (this.journey.returnInfo) {
        this.showWelcomeBackMessage(
          this.journey.returnInfo.timeAway,
          this.journey.returnInfo.distanceTraveled
        );
      }
    } else {
      // New journey - show start screen
      console.log("🆕 Showing start screen...");

      beginButton.addEventListener("click", () => {
        console.log("🚀 Begin button clicked!");

        const selectedLocation =
          locationSelect.value === "random"
            ? null
            : locationSelect.options[locationSelect.selectedIndex].text;

        console.log("📍 Selected location:", selectedLocation);

        this.initializeJourney(selectedLocation);
        startScreen.classList.add("hidden");
      });
    }
  }

  initializeJourney(selectedLocation) {
    console.log("🎬 Initializing journey with location:", selectedLocation);

    // Pass selectedLocation to Journey constructor
    this.journey = new Journey(selectedLocation);
    this.renderer = new Renderer(this.journey);
    this.sequenceManager = new SequenceManager(this.journey);
    this.infoCarousel = new InfoCarousel(this.journey, this.renderer);

    console.log(
      "🔍 Journey travel mode on init:",
      this.journey.getTravelMode()
    );
    console.log(
      "🔍 Journey cruise mode index:",
      this.journey.currentCruiseModeIndex
    );

    this.isAnimating = false;
    this.originIcon = document.getElementById("origin-icon");
    this.hasStarted = false;

    // Check if this is a restored journey
    if (this.journey.returnInfo) {
      // Journey was already in progress - auto-start
      this.hasStarted = true;
      // hideWelcome();

      // Restore triggered sequences
      if (this.journey.triggeredSequences) {
        this.sequenceManager.restoreState(this.journey.triggeredSequences);
      }

      this.startAnimationLoop();
      /* this.showWelcomeBackMessage(
        this.journey.returnInfo.timeAway,
        this.journey.returnInfo.distanceTraveled
      ); */
    } else {
      // Brand new journey - wait for start button
      this.hasStarted = false;
      showGreeting();
    }

    this.restoreUIState();

    console.log("🌍 Journey initialized");
  }

  restoreUIState() {
    console.log("🎨 Restoring UI state...");
    console.log("🎨 Current travel mode:", this.journey.getTravelMode());

    const freeScrollBtn = document.getElementById("mode-freescroll");
    const cruiseBtn = document.getElementById("mode-cruise");
    const controlBtn = document.getElementById("control-btn");
    const controlLabel = document.getElementById("control-label");
    const instructions = document.querySelector(".instructions");

    if (this.journey.getTravelMode() === "cruiseControl") {
      console.log("🎨 Setting cruise control UI...");
      // Update buttons
      cruiseBtn.classList.add("active");
      freeScrollBtn.classList.remove("active");

      // Update control label
      const cruiseMode = this.journey.getCurrentCruiseMode();
      controlLabel.innerHTML = `<svg class="icon icon--sm"><use xlink:href="#icon-${cruiseMode.icon}"/></svg> ${cruiseMode.name}`;
      // Update origin icon
      this.originIcon.innerHTML = `<svg class="icon"><use xlink:href="#icon-${cruiseMode.icon}"/></svg>`;

      // Hide instructions
      instructions.style.display = "none";
    } else {
      console.log("🎨 Setting free scroll UI...");
      // Free scroll mode
      freeScrollBtn.classList.add("active");
      cruiseBtn.classList.remove("active");

      // Update control label
      const throttle = this.journey.getCurrentThrottle();
      controlLabel.innerHTML = `<svg class="icon icon--sm"><use xlink:href="#icon-ufo" /></svg> ${throttle.label}`;

      // Update origin icon
      this.originIcon.innerHTML =
        "<svg class='icon icon--sm'><use xlink:href='#icon-ufo' /></svg>";

      // Show instructions
      instructions.style.display = "block";
    }
  }

  startAutoSave() {
    // Save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.journey.saveState();
    }, 30000);

    // Also save when page is about to unload
    this.saveBeforeUnload = () => {
      this.journey.saveState();
    };
    window.addEventListener("beforeunload", this.saveBeforeUnload);
  }

  showWelcomeBackMessage(timeAwayMs, distanceTraveled) {
    const seconds = Math.round(timeAwayMs / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);

    let timeString;
    if (hours > 1) {
      timeString = `${hours} hours`;
    } else if (minutes > 1) {
      timeString = `${minutes} minutes`;
    } else {
      timeString = `${seconds} seconds`;
    }

    const msg = document.createElement("div");
    msg.className = "welcome-back-message";
    msg.innerHTML = `
    <strong>Welcome back!</strong><br>
    You were away for ${timeString}<br>
    Traveled ${distanceTraveled.toFixed(3)} km<br ><br >
    <em>Click Restart below if you'd like to start over</em>
  `;
    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 5000);
  }

  setupVisibilityTracking() {
    // Only track time away in cruise control mode
    let hiddenTime = null;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Window just became hidden - record the time
        if (this.journey.getTravelMode() === "cruiseControl") {
          hiddenTime = performance.now();
          console.log("⏸️ Window hidden, pausing journey...");
        }
      } else {
        // Window just became visible - calculate missed distance
        if (hiddenTime && this.journey.getTravelMode() === "cruiseControl") {
          const elapsedMs = performance.now() - hiddenTime;
          const elapsedHours = elapsedMs / (1000 * 60 * 60);

          const cruiseMode = this.journey.getCurrentCruiseMode();
          const missedKm = cruiseMode.speed * elapsedHours;

          console.log(
            `⏩ Catching up: ${elapsedMs / 1000}s away = ${missedKm.toFixed(
              6
            )} km`
          );

          // Add the missed distance
          this.journey.distance += missedKm;

          // Show a brief notification
          this.showCatchupMessage(elapsedMs / 1000, missedKm);

          hiddenTime = null;
        }
      }
    });
  }

  showCatchupMessage(seconds, km) {
    // Create a temporary message showing the catch-up
    const msg = document.createElement("div");
    msg.className = "catchup-message";
    msg.textContent = `Traveled ${km.toFixed(3)} km while away (${Math.round(
      seconds
    )}s)`;
    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 3000);
  }

  setupEventListeners() {
    // Mode switcher
    const startButton = document.getElementById("start-button");
    const freeScrollBtn = document.getElementById("mode-freescroll");
    const cruiseBtn = document.getElementById("mode-cruise");
    const controlBtn = document.getElementById("control-btn");
    const controlLabel = document.getElementById("control-label");
    const instructions = document.querySelector(".instructions");

    // Credits toggle
    const creditsToggle = document.getElementById("credits-toggle");
    const creditsContainer = document.getElementById("credits-container");

    // 'Restart' controls.
    const restartToggle = document.getElementById("restart-toggle");
    const restartContainer = document.getElementById("restart-container");
    const restartCancel = document.getElementById("restart-cancel");
    const restartConfirm = document.getElementById("restart-confirm");

    startButton.addEventListener("click", () => {
      if (!this.hasStarted) {
        this.hasStarted = true;
        this.journey.startJourney();
        hideWelcome();
        this.startAnimationLoop();
        console.log("🚶 Journey started!");
      }
    });

    // set up handler for credits toggle.
    creditsToggle.addEventListener("click", () => {
      creditsContainer.classList.toggle("expanded");
    });

    // set up handler for restart options panel toggle.
    restartToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔄 Restart toggle clicked!");
      restartContainer.classList.toggle("expanded");
    });

    restartCancel.addEventListener("click", () => {
      restartContainer.classList.remove("expanded");
    });

    restartConfirm.addEventListener("click", async () => {
      console.log("🗑️ Clearing journey state...");

      // CRITICAL: Stop auto-save first!
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
        console.log("⏸️ Auto-save stopped");
      }

      // Remove the beforeunload listener
      window.removeEventListener("beforeunload", this.saveBeforeUnload);
      console.log("⏸️ beforeunload listener removed");

      // Now clear the state
      this.journey.clearState();

      const check = localStorage.getItem("wate-journey");
      console.log("🔍 After clear, localStorage has:", check);

      if (check === null) {
        console.log("✅ State cleared, reloading to start screen...");
        location.reload(); // simpler?
        // was location.replace(location.href);
      } else {
        console.error("❌ Failed to clear state!");
      }
    });

    // travel mode buttons.
    freeScrollBtn.addEventListener("click", () => {
      this.journey.setTravelMode("freeScroll");
      freeScrollBtn.classList.add("active");
      cruiseBtn.classList.remove("active");
      const throttle = this.journey.getCurrentThrottle();
      controlLabel.innerHTML = `<svg class="icon icon--sm"><use xlink:href="#icon-ufo"/></svg> ${throttle.label}`;
      this.originIcon.className = "mode--free";
      this.originIcon.innerHTML = `<svg class="icon"><use xlink:href="#icon-ufo"/></svg>`;
      instructions.style.display = "block";
      this.renderer.updateNextTransition(); // Hide it
    });

    cruiseBtn.addEventListener("click", () => {
      this.journey.setTravelMode("cruiseControl");
      cruiseBtn.classList.add("active");
      freeScrollBtn.classList.remove("active");
      const cruiseMode = this.journey.getCurrentCruiseMode();
      this.originIcon.className = "mode--cruise";
      controlLabel.innerHTML = `<svg class="icon icon--sm"><use xlink:href="#icon-${cruiseMode.icon}"/></svg> ${cruiseMode.name}`;
      this.originIcon.innerHTML = `<svg class="icon"><use xlink:href="#icon-${cruiseMode.icon}"/></svg>`;
      instructions.style.display = "none";
      this.renderer.updateNextTransition(); // Show it
    });

    // Control button (cycles throttle or cruise mode based on current mode)
    controlBtn.addEventListener("click", () => {
      if (this.journey.getTravelMode() === "freeScroll") {
        const throttle = this.journey.cycleThrottle();
        controlLabel.innerHTML = `<svg class="icon icon--sm"><use xlink:href="#icon-ufo"/></svg> ${throttle.label}`;
        // Icon stays as our UFO icon
      } else {
        const cruiseMode = this.journey.cycleCruiseMode();
        controlLabel.innerHTML = `<svg class="icon icon--sm"><use xlink:href="#icon-${cruiseMode.icon}"/></svg> ${cruiseMode.name}`;
        this.originIcon.innerHTML = `<svg class="icon"><use xlink:href="#icon-${cruiseMode.icon}"/></svg>`;
        this.renderer.updateNextTransition(); // Show it
      }
    });

    // Mouse events
    document.addEventListener("mousedown", (e) => {
      this.journey.startDrag(e.clientX);
    });

    document.addEventListener("mousemove", (e) => {
      this.journey.drag(e.clientX);
    });

    document.addEventListener("mouseup", () => {
      this.journey.endDrag();
    });

    document.addEventListener("mouseleave", () => {
      this.journey.endDrag();
    });

    // Touch events
    document.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length > 0) {
          this.journey.startDrag(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) {
          this.journey.drag(e.touches[0].clientX);
        }
      },
      { passive: true }
    );

    document.addEventListener("touchend", () => {
      this.journey.endDrag();
    });

    // Scroll events
    document.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.journey.scroll(e.deltaY);
      },
      { passive: false }
    );

    // Prevent text selection during drag
    document.addEventListener("selectstart", (e) => {
      if (this.journey.isDragging) {
        e.preventDefault();
      }
    });
  }

  startAnimationLoop() {
    const animate = () => {
      this.journey.update();
      this.renderer.render();
      // check for triggered sequences
      this.sequenceManager.update();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.walkApp = new WalkAroundTheEarth();
  });
} else {
  window.walkApp = new WalkAroundTheEarth();
}
