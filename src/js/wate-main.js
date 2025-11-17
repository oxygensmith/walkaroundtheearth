/* Walk Around the Earth */
/* main.js - Application entry point */

import { Journey } from "./wate-journey.js";
import { Renderer } from "./wate-renderer.js";

// Utility function to wait
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class WalkAroundTheEarth {
  constructor() {
    this.journey = new Journey();
    this.renderer = new Renderer(this.journey);
    this.isAnimating = false;
    this.originIcon = document.getElementById("origin-icon");

    console.log(
      "🔍 Journey travel mode on init:",
      this.journey.getTravelMode()
    );
    console.log(
      "🔍 Journey cruise mode index:",
      this.journey.currentCruiseModeIndex
    );

    this.setupEventListeners();
    this.setupVisibilityTracking();
    this.startAnimationLoop();
    this.startAutoSave();

    // Restore UI state to match journey state
    this.restoreUIState();

    // Show welcome back message if returning
    if (this.journey.returnInfo) {
      this.showWelcomeBackMessage(
        this.journey.returnInfo.timeAway,
        this.journey.returnInfo.distanceTraveled
      );
    }

    console.log("🌍 Walk Around the Earth initialized");
    console.log(`Earth circumference: ${40041.44} km`);
    console.log(`Scale: 10px = 1km`);
  }

  restoreUIState() {
    console.log("🎨 Restoring UI state...");
    console.log("🎨 Current travel mode:", this.journey.getTravelMode());

    const freeScrollBtn = document.getElementById("mode-freescroll");
    const cruiseBtn = document.getElementById("mode-cruise");
    const controlBtn = document.getElementById("control-btn");
    const controlLabel = document.getElementById("control-label");
    const instructions = document.querySelector(".instructions");

    console.log("🎨 Found elements:", {
      freeScrollBtn,
      cruiseBtn,
      controlLabel,
      instructions,
    });

    if (this.journey.getTravelMode() === "cruiseControl") {
      console.log("🎨 Setting cruise control UI...");
      // Update buttons
      cruiseBtn.classList.add("active");
      freeScrollBtn.classList.remove("active");

      // Update control label
      const cruiseMode = this.journey.getCurrentCruiseMode();
      controlLabel.innerHTML = `<i class="fa-solid ${cruiseMode.icon}"></i> ${cruiseMode.name}`;

      // Update origin icon
      this.originIcon.className = `fa-solid ${cruiseMode.icon}`;

      // Hide instructions
      instructions.style.display = "none";
    } else {
      console.log("🎨 Setting free scroll UI...");
      // Free scroll mode
      freeScrollBtn.classList.add("active");
      cruiseBtn.classList.remove("active");

      // Update control label
      const throttle = this.journey.getCurrentThrottle();
      controlLabel.innerHTML = `<i class="fa-brands fa-space-awesome"></i> ${throttle.label}`;

      // Update origin icon
      this.originIcon.className = "fa-brands fa-space-awesome";

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
    console.log("🔍 restartToggle element:", restartToggle);
    console.log("🔍 Is it null?", restartToggle === null);

    const restartContainer = document.getElementById("restart-container");
    const restartCancel = document.getElementById("restart-cancel");
    const restartConfirm = document.getElementById("restart-confirm");

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
        location.replace(location.href);
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
      controlLabel.innerHTML = `<i class="fa-brands fa-space-awesome"></i> ${throttle.label}`;
      this.originIcon.className = "fa-brands fa-space-awesome";
      instructions.style.display = "block";
    });

    cruiseBtn.addEventListener("click", () => {
      this.journey.setTravelMode("cruiseControl");
      cruiseBtn.classList.add("active");
      freeScrollBtn.classList.remove("active");
      const cruiseMode = this.journey.getCurrentCruiseMode();
      controlLabel.innerHTML = `<i class="fa-solid ${cruiseMode.icon}"></i> ${cruiseMode.name}`;
      this.originIcon.className = `fa-solid ${cruiseMode.icon}`;
      instructions.style.display = "none";
    });

    // Control button (cycles throttle or cruise mode based on current mode)
    controlBtn.addEventListener("click", () => {
      if (this.journey.getTravelMode() === "freeScroll") {
        const throttle = this.journey.cycleThrottle();
        controlLabel.innerHTML = `<i class="fa-brands fa-space-awesome"></i> ${throttle.label}`;
        // Icon stays as Space Awesome in free scroll mode
      } else {
        const cruiseMode = this.journey.cycleCruiseMode();
        controlLabel.innerHTML = `<i class="fa-solid ${cruiseMode.icon}"></i> ${cruiseMode.name}`;
        this.originIcon.className = `fa-solid ${cruiseMode.icon}`;
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
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new WalkAroundTheEarth();
  });
} else {
  new WalkAroundTheEarth();
}
