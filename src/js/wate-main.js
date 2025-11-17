/* Walk Around the Earth */
/* main.js - Application entry point */

import { Journey } from "./wate-journey.js";
import { Renderer } from "./wate-renderer.js";

class WalkAroundTheEarth {
  constructor() {
    this.journey = new Journey();
    this.renderer = new Renderer(this.journey);
    this.isAnimating = false;
    this.originIcon = document.getElementById("origin-icon");

    this.setupEventListeners();
    this.setupVisibilityTracking();
    this.startAnimationLoop();

    console.log("🌍 Walk Around the Earth initialized");
    console.log(`Earth circumference: ${40041.44} km`);
    console.log(`Scale: 10px = 1km`);
  }

  // In main.js - add to WalkAroundTheEarth constructor

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

    creditsToggle.addEventListener("click", () => {
      creditsContainer.classList.toggle("expanded");
    });

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
