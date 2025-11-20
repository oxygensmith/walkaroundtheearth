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
    this.lastLoggedSecond = -1; // NEW

    // Create DOM elements for sequence display
    this.createSequenceDisplay();
  }

  createSequenceDisplay() {
    // Container for floating messages
    const container = document.createElement("div");
    container.id = "sequence-container";
    container.className = "sequence-container";
    document.body.appendChild(container);
    // console.log("✨ Creating sequence display.");

    // Message display
    const messageDisplay = document.createElement("div");
    messageDisplay.id = "sequence-message";
    messageDisplay.className = "sequence-message hidden";
    container.appendChild(messageDisplay);
    // console.log("✨ Created message display.");

    // Skip button
    const skipButton = document.createElement("button");
    skipButton.id = "sequence-skip";
    skipButton.className = "sequence-skip hidden";
    skipButton.innerHTML = 'Skip <i class="fa-solid fa-forward"></i>';
    skipButton.addEventListener("click", () => this.skipSequence());
    container.appendChild(skipButton);
    // console.log("✨ Created skip button.");

    this.container = container;
    this.messageDisplay = messageDisplay;
    this.skipButton = skipButton;
  }

  // Check for triggered sequences (called each frame)
  update() {
    if (this.currentSequence) {
      /* console.log("⏸️ Currently showing sequence, skipping check"); // DEBUG */
      return; // Already showing a sequence
    }
    // Check time-based triggers
    const elapsedSeconds = this.journey.getElapsedTime() / 1000;

    // Only log every second to avoid spam
    if (Math.floor(elapsedSeconds) !== this.lastLoggedSecond) {
      // console.log(`⏱️ Elapsed: ${elapsedSeconds.toFixed(1)}s`);
      this.lastLoggedSecond = Math.floor(elapsedSeconds);
    }

    for (const sequence of timeSequences) {
      const sequenceKey = `time-${sequence.id}`;
      const hasTriggered = this.triggeredSequences.has(sequenceKey);
      const shouldTrigger = elapsedSeconds >= sequence.triggerSeconds;

      /*)console.log(
        `🔍 Checking ${sequence.id}: elapsed=${elapsedSeconds.toFixed(
          1
        )}s, trigger=${
          sequence.triggerSeconds
        }s, hasTriggered=${hasTriggered}, shouldTrigger=${shouldTrigger}`
      ); */

      if (!hasTriggered && shouldTrigger) {
        /* console.log(`🎬 TRIGGERING TIME SEQUENCE: ${sequence.id}`); */
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
        /* console.log(
          `🎬 TRIGGERING DISTANCE SEQUENCE: ${
            sequence.id
          } at ${distance.toFixed(2)}km`
        ); */
        this.startSequence(sequence, sequenceKey);
        return;
      }
    }
  }

  // Start showing a sequence
  startSequence(sequence, sequenceKey) {
    /* console.log(`🎬 Starting sequence: ${sequence.id}`);
    console.log(`📝 Sequence has ${sequence.messages.length} messages`); */
    this.currentSequence = sequence;
    this.currentMessageIndex = 0;
    this.triggeredSequences.add(sequenceKey);

    // Show skip button if skippable
    if (sequence.skippable) {
      /*  console.log("⏭️ Sequence is skippable, showing skip button"); */
      this.skipButton.classList.remove("hidden");
    }

    this.showNextMessage();
  }

  // Show the next message in the current sequence
  showNextMessage() {
    if (!this.currentSequence) {
      /* console.log("❌ No current sequence in showNextMessage"); */
      return;
    }

    const message = this.currentSequence.messages[this.currentMessageIndex];

    if (!message) {
      /* console.log("✅ Sequence complete"); */
      this.endSequence();
      return;
    }
    /* console.log(
      `💬 Showing message ${this.currentMessageIndex + 1}/${
        this.currentSequence.messages.length
      }: "${message.text.substring(0, 50)}..."`
    ); */
    // console.log(`⏱️ Duration: ${message.duration}s`);

    // Display message with fade in
    this.messageDisplay.textContent = message.text;
    /* console.log("🔍 messageDisplay element:", this.messageDisplay);
    console.log(
      "🔍 messageDisplay classList before:",
      Array.from(this.messageDisplay.classList)
    ); */

    this.messageDisplay.classList.remove("hidden");
    this.messageDisplay.classList.add("fade-in");

    /* console.log(
      "🔍 messageDisplay classList after:",
      Array.from(this.messageDisplay.classList)
    ); */

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
    /* console.log("⏭️ Skipping sequence"); */
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
      /*   console.log(
        `📋 Restored ${triggeredSequences.length} triggered sequences`
      ); */
    }
  }
}
