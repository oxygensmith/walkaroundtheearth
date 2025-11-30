export class InfoCarousel {
  constructor(journey, renderer) {
    this.journey = journey;
    this.renderer = renderer;

    // Configuration
    this.cycleDuration = 5000;
    this.currentIndex = 0;
    this.isPaused = false;
    this.cycleTimer = null;
    this.isExpanded = false;

    // DOM elements
    this.container = document.getElementById("info-carousel");
    this.elementsContainer = document.getElementById("info-carousel-elements");
    this.elements = this.elementsContainer.querySelectorAll(".info-element");
    this.toggleBtn = document.getElementById("info-toggle");
    this.expandedPanel = document.getElementById("journey-stats-main");

    this.init();
  }

  init() {
    // Hide all elements except the first
    this.showElement(0);

    // Start cycling
    this.startCycle();

    // Pause on hover
    this.container.addEventListener("mouseenter", () => this.pause());
    this.container.addEventListener("mouseleave", () => this.resume());

    // Advance on click (but not if clicking the button)
    this.container.addEventListener("click", (e) => {
      if (e.target !== this.toggleBtn) {
        this.next();
      }
    });

    // Toggle expanded panel
    this.toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleExpanded();
    });

    console.log("🔄 Info carousel initialized");
  }

  startCycle() {
    this.cycleTimer = setInterval(() => {
      if (!this.isPaused) {
        this.next();
      }
    }, this.cycleDuration);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  next() {
    const currentElement = this.elements[this.currentIndex];

    // Fade out current
    currentElement.classList.add("fade-out-up");

    setTimeout(() => {
      currentElement.classList.remove("active", "fade-out-up");

      // Update index
      this.currentIndex = (this.currentIndex + 1) % this.elements.length;

      // Show next element
      this.showElement(this.currentIndex);
    }, 400);
  }

  showElement(index) {
    const element = this.elements[index];

    // Add active class and fade in
    element.classList.add("active", "fade-in-down");

    setTimeout(() => {
      element.classList.remove("fade-in-down");
    }, 400);
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.expandedPanel.classList.add("visible");
      this.toggleBtn.textContent = "less info";
    } else {
      this.expandedPanel.classList.remove("visible");
      this.toggleBtn.textContent = "more info >>";
    }
  }

  // No update() method needed - renderer handles updating the DOM elements

  destroy() {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
    }
  }
}
