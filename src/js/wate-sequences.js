/* Walk Around the Earth */
/* sequences.js - Manages time and distance-triggered message sequences */

import { timeSequences, distanceSequences } from "./wate-messages.js";

export class SequenceManager {
  constructor(journey) {
    this.journey = journey;
    this.triggeredSequences = new Set(); // Track which sequences have been shown
    this.currentSequence = null;
    this.currentMessageIndex = 0;
    this.messageTimeout = null;

    // Create DOM elements for sequence display
    this.createSequenceDisplay();
  }

  createSequenceDisplay() {
    // Container for floating messages
    const container = document.createElement("div");
    container.id = "sequence-container";
    container.className = "sequence-container";
    document.body.appendChild(container);

    // Message display
    const messageDisplay = document.createElement("div");
    messageDisplay.id = "sequence-message";
    messageDisplay.className = "sequence-message hidden";
    container.appendChild(messageDisplay);

    // Skip button
    const skipButton = document.createElement("button");
    skipButton.id = "sequence-skip";
    skipButton.className = "sequence-skip hidden";
    skipButton.innerHTML = 'Skip <i class="fa-solid fa-forward"></i>';
    skipButton.addEventListener("click", () => this.skipSequence());
    container.appendChild(skipButton);

    this.container = container;
    this.messageDisplay = messageDisplay;
    this.skipButton = skipButton;
  }

  // Check for triggered sequences (called each frame)
  update() {
    if (this.currentSequence) return; // Already showing a sequence

    // Check time-based triggers
    const elapsedSeconds = this.journey.getElapsedTime() / 1000;
    for (const sequence of timeSequences) {
      const sequenceKey = `time-${sequence.id}`;
      if (
        !this.triggeredSequences.has(sequenceKey) &&
        elapsedSeconds >= sequence.triggerSeconds
      ) {
        this.startSequence(sequence, sequenceKey);
        return;
      }
    }

    // Check distance-based triggers
    const distance = Math.abs(this.journey.getDistance());
    for (const sequence of distanceSequences) {
      const sequenceKey = `distance-${sequence.id}`;
      if (
        !this.triggeredSequences.has(sequenceKey) &&
        distance >= sequence.triggerKm
      ) {
        this.startSequence(sequence, sequenceKey);
        return;
      }
    }
  }

  // Start showing a sequence
  startSequence(sequence, sequenceKey) {
    console.log(`🎬 Starting sequence: ${sequence.id}`);
    this.currentSequence = sequence;
    this.currentMessageIndex = 0;
    this.triggeredSequences.add(sequenceKey);

    // Show skip button if skippable
    if (sequence.skippable) {
      this.skipButton.classList.remove("hidden");
    }

    this.showNextMessage();
  }

  // Show the next message in the current sequence
  showNextMessage() {
    if (!this.currentSequence) return;

    const message = this.currentSequence.messages[this.currentMessageIndex];

    if (!message) {
      // Sequence complete
      this.endSequence();
      return;
    }

    // Display message with fade in
    this.messageDisplay.textContent = message.text;
    this.messageDisplay.classList.remove("hidden");
    this.messageDisplay.classList.add("fade-in");

    // Schedule fade out and next message
    this.messageTimeout = setTimeout(() => {
      this.messageDisplay.classList.remove("fade-in");
      this.messageDisplay.classList.add("fade-out");

      // Wait for fade out, then show next message
      setTimeout(() => {
        this.messageDisplay.classList.remove("fade-out");
        this.messageDisplay.classList.add("hidden");
        this.currentMessageIndex++;
        this.showNextMessage();
      }, 500); // Fade out duration
    }, message.duration * 1000);
  }

  // Skip to end of current sequence
  skipSequence() {
    console.log("⏭️ Skipping sequence");
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    this.endSequence();
  }

  // End the current sequence
  endSequence() {
    this.messageDisplay.classList.add("hidden");
    this.messageDisplay.classList.remove("fade-in", "fade-out");
    this.skipButton.classList.add("hidden");
    this.currentSequence = null;
    this.currentMessageIndex = 0;

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  // Save triggered sequences to localStorage
  saveState() {
    return Array.from(this.triggeredSequences);
  }

  // Restore triggered sequences from localStorage
  restoreState(triggeredSequences) {
    if (triggeredSequences) {
      this.triggeredSequences = new Set(triggeredSequences);
      console.log(
        `📋 Restored ${triggeredSequences.length} triggered sequences`
      );
    }
  }
}
