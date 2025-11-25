/* Walk Around the Earth */
/* main.js - Application entry point */

import { Journey } from "./wate-journey.js";
import { Renderer } from "./wate-renderer.js";
import { SequenceManager } from "./wate-sequences.js";
import { showGreeting, hideWelcome } from "./wate-messages.js";
import { PanelManager } from "./wate-panels.js";

// Utility function to wait
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class WalkAroundTheEarth {
  constructor() {
    this.journey = new Journey();
    this.renderer = new Renderer(this.journey);
    this.sequenceManager = new SequenceManager(this.journey);
    this.isAnimating = false;
    this.originIcon = document.getElementById("origin-icon");
    this.hasStarted = false;
    this.panelManager = new PanelManager();
    this.setupPanels();
    this.setupChoiceContainer();

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
    this.startAutoSave();

    // Check if this is a restored journey
    if (this.journey.returnInfo) {
      // Journey was already in progress - auto-start
      this.hasStarted = true;
      hideWelcome();

      // Restore triggered sequences
      if (this.journey.triggeredSequences) {
        this.sequenceManager.restoreState(this.journey.triggeredSequences);
      }

      this.startAnimationLoop();
      this.showWelcomeBackMessage(
        this.journey.returnInfo.timeAway,
        this.journey.returnInfo.distanceTraveled
      );
    } else {
      // New journey - wait for start button
      showGreeting();
      this.restoreUIState();
    }

    console.log("🌍 Walk Around the Earth initialized");
  }

  setupPanels() {
    // Register Settings Panel
    this.settingsPanel = this.panelManager.registerPanel({
      panelId: "settings-panel",
      toggleBtnId: "settings-toggle",
      animationType: "slide", // or 'fade'
      position: "bottom",
      exclusive: true,
      overlay: true,
      onOpen: () => console.log("Settings opened"),
      onClose: () => console.log("Settings closed"),
    });

    // Register Travelmode Panel
    this.travelModePanel = this.panelManager.registerPanel({
      panelId: "travelmode-panel",
      toggleBtnId: "travelmode-toggle",
      animationType: "slide", // or 'fade'
      // position: "bottom",
      exclusive: true,
      overlay: false,
      onOpen: () => console.log("Travelmode panel opened"),
      onClose: () => console.log("Travelmode closed"),
    });

    // Register Console Panel
    this.consolePanel = this.panelManager.registerPanel({
      panelId: "console-panel",
      toggleBtnId: "console-toggle",
      animationType: "slide", // or 'fade'
      // position: "right",
      exclusive: true,
      overlay: true,
      onOpen: () => console.log("Console panel opened"),
      onClose: () => console.log("Console closed"),
    });

    // Journey Management Controls:
    // Setup journey management button listeners
    this.settingsPanel.onButtonClick("journey-pause-btn", () => {
      this.togglePause();
    });

    this.settingsPanel.onButtonClick("journey-restart-btn", () => {
      this.showRestartConfirmation();
    });

    this.settingsPanel.onButtonClick("journey-save-btn", () => {
      this.journey.saveState();
      this.showNotification("Journey saved!");
    });

    this.settingsPanel.onButtonClick("journey-load-btn", () => {
      this.loadSavedJourney();
    });

    this.settingsPanel.onButtonClick("journey-share-btn", () => {
      this.shareJourney();
    });

    // Setup context layer toggles
    this.settingsPanel.onCheckboxChange("context-biome", (e) => {
      this.renderer.showBiomeInfo = e.target.checked;
      console.log("Biome info:", e.target.checked);
    });

    this.settingsPanel.onCheckboxChange("context-settlements", (e) => {
      this.renderer.showSettlements = e.target.checked;
      console.log("Settlements:", e.target.checked);
    });

    this.settingsPanel.onCheckboxChange("context-weather", (e) => {
      this.renderer.showWeather = e.target.checked;
      console.log("Weather:", e.target.checked);
    });

    this.settingsPanel.onCheckboxChange("context-photography", (e) => {
      this.renderer.showPhotography = e.target.checked;
      console.log("Photography:", e.target.checked);
    });

    // Setup About links
    this.settingsPanel.onLinkClick("about-wate", () => {
      this.showAboutModal();
    });

    this.settingsPanel.onLinkClick("about-credits", () => {
      this.showCreditsModal();
    });
  }

  // Called when journey info panel opens
  updateConsoleStats() {
    const position = this.journey.getCurrentPosition();
    const waypointInfo = this.journey.getCurrentWaypointInfo();

    this.consolePanel.updateStat(
      "panel-coordinates",
      `${position.lat.toFixed(4)}°${
        position.lat >= 0 ? "N" : "S"
      }, ${position.lng.toFixed(4)}°${position.lng >= 0 ? "E" : "W"}`
    );

    this.consolePanel.updateStat(
      "panel-altitude",
      `${Math.floor(Math.abs(this.journey.distance) * 1000).toLocaleString()} m`
    );

    this.consolePanel.updateStat(
      "panel-speed",
      `${this.renderer.speedValue.textContent}`
    );

    this.consolePanel.updateStat(
      "panel-solar-time",
      `${this.renderer.solarTimeDisplay.textContent}`
    );

    this.consolePanel.updateStat(
      "panel-eta",
      `${this.renderer.timeDisplay.textContent}`
    );

    this.consolePanel.updateStat(
      "panel-terrain",
      waypointInfo ? waypointInfo.terrain : "—"
    );
  }

  togglePause() {
    if (this.journey.isPaused) {
      this.journey.resume();
      console.log("Journey resumed");
    } else {
      this.journey.pause();
      console.log("Journey paused");
    }
  }

  showRestartConfirmation() {
    // Close settings panel
    this.settingsPanel.close();

    // Show choice container
    const choiceContainer = document.getElementById("restart-container");
    choiceContainer.classList.add("visible");

    // Prevent body scroll
    document.body.style.overflow = "hidden";
  }

  hideRestartConfirmation() {
    // Hide choice container
    const choiceContainer = document.getElementById("restart-container");
    choiceContainer.classList.remove("visible");

    // Re-enable body scroll
    document.body.style.overflow = "";
  }

  setupChoiceContainer() {
    const choiceContainer = document.getElementById("restart-container");
    const choiceOverlay = document.querySelector(".choice-overlay");
    const cancelBtn = document.getElementById("restart-cancel");
    const confirmBtn = document.getElementById("restart-confirm");

    // Close on cancel button
    cancelBtn.addEventListener("click", () => {
      this.hideRestartConfirmation();
    });

    // Close on overlay click
    choiceOverlay.addEventListener("click", () => {
      this.hideRestartConfirmation();
    });

    // Handle restart confirmation
    confirmBtn.addEventListener("click", async () => {
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

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && choiceContainer.classList.contains("visible")) {
        this.hideRestartConfirmation();
      }
    });
  }

  /* if (
      confirm(
        "Are you sure you want to restart your journey? All progress will be lost."
      )
    ) {
      this.journey.clearState();
      location.replace(location.href);
    }
  */

  loadSavedJourney() {
    const saved = this.journey.loadState();
    if (saved) {
      this.showNotification("Journey loaded!");
      this.settingsPanel.close();
    } else {
      this.showNotification("No saved journey found");
    }
  }

  shareJourney() {
    const distance = Math.floor(this.journey.distance);
    const elapsed = this.renderer.formatDuration(this.journey.getElapsedTime());
    const startLocation = this.journey.getStartLocation().name;

    const shareText = `I've travelled ${distance} km around Earth in ${elapsed}, starting from ${startLocation}! 🌍`;
    const shareUrl = `${
      window.location.origin
    }?distance=${distance}&elapsed=${this.journey.getElapsedTime()}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareText + "\n" + shareUrl).then(() => {
      this.showNotification("Journey link copied!");
    });

    // Or use native share API if available
    if (navigator.share) {
      navigator.share({
        title: "Walk Around the Earth",
        text: shareText,
        url: shareUrl,
      });
    }
  }

  showNotification(message) {
    // Create a temporary notification
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--color-text);
      color: var(--color-bg);
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 2000;
      animation: fadeInOut 3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showAboutModal() {
    console.log("Show About WATE modal");
    // Implement modal for About
  }

  showCreditsModal() {
    console.log("Show Credits modal");
    // Implement modal for Credits
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
    // const creditsToggle = document.getElementById("credits-toggle");
    // const creditsContainer = document.getElementById("credits-container");

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
    /* creditsToggle.addEventListener("click", () => {
      creditsContainer.classList.toggle("expanded");
    }); */

    // set up handler for restart options panel toggle.
    /* restartToggle.addEventListener("click", (e) => {
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

    */

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
