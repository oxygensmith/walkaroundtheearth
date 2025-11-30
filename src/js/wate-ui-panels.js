/* Walk Around the Earth */
/* wate-panels.js - Reusable collapsible panel system */

export class CollapsiblePanel {
  constructor(options = {}) {
    // Configuration
    this.panelId = options.panelId || null;
    this.toggleBtnId = options.toggleBtnId || null;
    this.animationType = options.animationType || "slide"; // 'slide' or 'fade'
    this.position = options.position || "bottom-left"; // 'bottom-left', 'bottom-right', 'full-screen'
    this.exclusive = options.exclusive !== false; // Close other panels when opening this one
    this.overlay = options.overlay !== false;
    this.onOpen = options.onOpen || null;
    this.onClose = options.onClose || null;
    this.onToggle = options.onToggle || null;

    // DOM elements
    this.panelElement = document.getElementById(this.panelId);
    this.toggleBtn = document.getElementById(this.toggleBtnId);
    this.closeBtn = null;
    this.overlay = null;

    if (!this.panelElement) {
      console.error(`Panel with ID "${this.panelId}" not found`);
      return;
    }

    this.isOpen = false;
    this.allPanels = []; // Track all panel instances for exclusive behavior

    this.init();
  }

  init() {
    // Get sub-elements
    this.closeBtn = this.panelElement.querySelector(".panel-close");
    this.overlayElement = this.panelElement.querySelector(".panel-overlay");

    // Add animation class to panel-content
    const panelContent = this.panelElement.querySelector(".panel-content");
    if (panelContent) {
      panelContent.classList.add(`panel--${this.animationType}`);
      panelContent.classList.add(`panel--${this.position}`);
    }

    // Event listeners
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () => this.toggle());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.close());
    }

    if (this.overlayElement) {
      if (this.overlay) {
        // Overlay is enabled: show it and attach click listener
        this.overlayElement.style.display = ""; // Show
        this.overlayElement.addEventListener("click", () => this.close());
      } else {
        // Overlay is disabled: hide it
        this.overlayElement.style.display = "none";
      }
    }

    // ESC key listener
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    // Set ARIA attributes
    this.panelElement.setAttribute("role", "dialog");
    this.panelElement.setAttribute("aria-hidden", "true");
  }

  open() {
    if (this.isOpen) return;

    // Close other panels if exclusive mode is enabled
    if (this.exclusive && window.openPanel && window.openPanel !== this) {
      window.openPanel.close();
    }

    this.isOpen = true;
    this.panelElement.classList.add("panel--open");
    this.panelElement.setAttribute("aria-hidden", "false");

    // Disable scroll on body
    document.body.style.overflow = "hidden";

    if (this.toggleBtn) {
      this.toggleBtn.classList.add("active");
    }

    if (this.onOpen) this.onOpen();
    if (this.onToggle) this.onToggle(true);

    // Track open panel globally
    window.openPanel = this;

    console.log(`📂 Opened panel: ${this.panelId}`);
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.panelElement.classList.remove("panel--open");
    this.panelElement.setAttribute("aria-hidden", "true");

    // Re-enable scroll on body
    document.body.style.overflow = "";

    if (this.toggleBtn) {
      this.toggleBtn.classList.remove("active");
    }

    if (this.onClose) this.onClose();
    if (this.onToggle) this.onToggle(false);

    // Clear global open panel tracking
    if (window.openPanel === this) {
      window.openPanel = null;
    }

    console.log(`📁 Closed panel: ${this.panelId}`);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Utility methods for updating panel content
  updateStat(elementId, value) {
    const element = this.panelElement.querySelector(`#${elementId}`);
    if (element) {
      element.textContent = value;
    }
  }

  // Get checkbox state
  isContextLayerEnabled(contextName) {
    const checkbox = this.panelElement.querySelector(`#context-${contextName}`);
    return checkbox ? checkbox.checked : false;
  }

  // Set checkbox state
  setContextLayerEnabled(contextName, enabled) {
    const checkbox = this.panelElement.querySelector(`#context-${contextName}`);
    if (checkbox) {
      checkbox.checked = enabled;
    }
  }

  // Get all enabled context layers
  getEnabledContextLayers() {
    const layers = {};
    const checkboxes = this.panelElement.querySelectorAll(".panel-checkbox");
    checkboxes.forEach((checkbox) => {
      const contextName = checkbox.id.replace("context-", "");
      layers[contextName] = checkbox.checked;
    });
    return layers;
  }

  // Add event listener to a button in the panel
  onButtonClick(buttonId, callback) {
    const btn = this.panelElement.querySelector(`#${buttonId}`);
    if (btn) {
      btn.addEventListener("click", callback);
    }
  }

  // Add event listener to a checkbox in the panel
  onCheckboxChange(checkboxId, callback) {
    const checkbox = this.panelElement.querySelector(`#${checkboxId}`);
    if (checkbox) {
      checkbox.addEventListener("change", callback);
    }
  }

  // Add event listener to a link in the panel
  onLinkClick(linkId, callback) {
    const link = this.panelElement.querySelector(`#${linkId}`);
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        callback();
      });
    }
  }

  destroy() {
    // Clean up event listeners
    if (this.toggleBtn) {
      this.toggleBtn.removeEventListener("click", () => this.toggle());
    }
    if (this.closeBtn) {
      this.closeBtn.removeEventListener("click", () => this.close());
    }
    console.log(`🗑️ Destroyed panel: ${this.panelId}`);
  }
}

// Panel Manager - handles multiple panels with exclusive behavior
export class PanelManager {
  constructor() {
    this.panels = new Map();
  }

  registerPanel(panelConfig) {
    const panel = new CollapsiblePanel(panelConfig);
    this.panels.set(panelConfig.panelId, panel);
    return panel;
  }

  getPanel(panelId) {
    return this.panels.get(panelId);
  }

  openPanel(panelId) {
    const panel = this.getPanel(panelId);
    if (panel) {
      panel.open();
    }
  }

  closePanel(panelId) {
    const panel = this.getPanel(panelId);
    if (panel) {
      panel.close();
    }
  }

  togglePanel(panelId) {
    const panel = this.getPanel(panelId);
    if (panel) {
      panel.toggle();
    }
  }

  closeAllPanels() {
    this.panels.forEach((panel) => {
      if (panel.isOpen) {
        panel.close();
      }
    });
  }

  getOpenPanel() {
    return window.openPanel || null;
  }
}
