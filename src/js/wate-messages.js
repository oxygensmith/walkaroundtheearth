/* Walk Around the Earth */
/* messages.js - Journey messages that appear at specific distances */

// Time-triggered message sequences (triggered by elapsed seconds)
// TODO: Integrate into project.
export const timeSequences = [
  {
    triggerSeconds: 3,
    id: "onboarding",
    skippable: true,
    messages: [
      { text: "And so it begins.", duration: 3 },
      {
        text: "Even though you've already travelled at least a few meters, you've probably already noticed that getting around the world is going to take awhile.",
        duration: 6,
      },
      {
        text: "Feel free to get on a bike or into a car or something faster with the controls below.",
        duration: 5,
      },
      { text: "It's still going to take you awhile.", duration: 3 },
      {
        text: "You've probably noticed that in this trip around Earth, we've made you very focussed.",
        duration: 4,
      },
      {
        text: "We've removed the need for you to eat, sleep and rest - and a lot of other obstacles.",
        duration: 5,
      },
      {
        text: "In a real straight-line journey around the planet, you'd also have the problem of walking (or driving) into the ocean.",
        duration: 6,
      },
      {
        text: "For this trip, though, please enjoy your magic sidewalk.",
        duration: 4,
      },
      {
        text: "P.S. Don't worry about sitting here and staring at the screen for days, weeks or months. You can reload this page, close the browser, or even turn the computer on and off, and it'll remember where you're at in your journey.",
        duration: 8,
      },
      { text: "Just don't clear cookies.", duration: 3 },
      {
        text: "You can voluntarily restart by clicking the Restart button below.",
        duration: 4,
      },
      { text: "Have fun!", duration: 3 },
    ],
  },
  {
    triggerSeconds: 60, // 1 minute after onboarding
    id: "great-circle-intro",
    skippable: true,
    messages: [
      {
        text: "A 'great circle' is a type of circumnavigation that has the same radius as the Earth itself.",
        duration: 5,
      },
      {
        text: "It's the maximum distance you can travel in a straight line - about 40,041 km.",
        duration: 4,
      },
      {
        text: "All lines of longitude and the equator are 'great circle routes.'",
        duration: 4,
      },
      {
        text: "Actually, any straightline path around the earth that comes back to its starting point - as long the circle that it makes would slice through the exact center of the earth - is a great circle route.",
        duration: 7,
      },
      {
        text: "Later, you'll be able to set waypoints and your angle of travel.",
        duration: 4,
      },
      { text: "But for now, this journey is equatorial.", duration: 3 },
      { text: "At least you're on the most famous great circle.", duration: 3 },
    ],
  },
];

// Time-triggered message sequences (triggered by km travelled)
// TODO: Integrate into project.
export const distanceSequences = [
  {
    triggerKm: 500,
    id: "haversine",
    skippable: true,
    messages: [
      {
        text: "The distance between two points on Earth is calculated with the Haversine formula, to account for the fact that it's a sphere.",
        duration: 6,
      },
      {
        text: "It's been in use by sailors since the early 1800s.",
        duration: 3,
      },
    ],
  },
  {
    triggerKm: 998,
    id: "approaching-1000",
    skippable: true,
    messages: [
      {
        text: "This journey around the equator is the longest great circle, because the Earth bulges in the middle.",
        duration: 5,
      },
      {
        text: "If you were to circle the globe over the North and South Poles, your trip would be 67.154 km shorter.",
        duration: 5,
      },
      { text: "We'll have some fun with destinations later.", duration: 3 },
      {
        text: "In the meantime, you're coming up on 1000 KM. Congratulations.",
        duration: 4,
      },
    ],
  },
  {
    triggerKm: 5000,
    id: "five-thousand",
    skippable: true,
    messages: [
      { text: "Congratulations on your first 5000km.", duration: 3 },
      {
        text: "If you were in walking mode this whole time, at 5 km/h, this journey would take about 334 days of continuous walking.",
        duration: 6,
      },
      {
        text: "Probably good that we've given you magic walking, at least.",
        duration: 4,
      },
    ],
  },
  {
    triggerKm: 10010.22,
    id: "quarter-way",
    skippable: true,
    messages: [
      {
        text: "Can you believe that you've made it a quarter of the way?",
        duration: 4,
      },
    ],
  },
  {
    triggerKm: 11241,
    id: "longest-land",
    skippable: true,
    messages: [
      {
        text: "You've just passed the distance of the longest land-only straight line on Earth.",
        duration: 5,
      },
      {
        text: "It runs between Sagres, Portugal and Jinjiang, China.",
        duration: 4,
      },
      {
        text: "From here on, any real walking route would require a boat.",
        duration: 4,
      },
    ],
  },
  {
    triggerKm: 20020.72,
    id: "antipode",
    skippable: true,
    messages: [
      {
        text: "You've reached the halfway point in your circumnavigation, called the ANTIPODE. Congratulations.",
        duration: 5,
      },
    ],
  },
  {
    triggerKm: 30031.08,
    id: "three-quarters",
    skippable: true,
    messages: [
      {
        text: "Three-quarters of the way around. The finish line is in sight.",
        duration: 4,
      },
      { text: "Well, 10,010 km away. But still.", duration: 3 },
    ],
  },
  {
    triggerKm: 40000,
    id: "almost-there",
    skippable: true,
    messages: [
      { text: "40000 km! Incredible!", duration: 3 },
      { text: "You've almost made it. Keep going.", duration: 3 },
    ],
  },
];

export const journeyMessages = [
  // will add other things here.
];

// Welcome message components
const welcomeIntro =
  "|Ever wanted to walk around the entire planet? Or run or bike?|Now's as good as any other time.";
const welcomePreButton = "|Just click";
const welcomePostButton =
  "and you'll be off! And... quickly getting a sense of how long it will take you.";

// Generate time-based greeting
function getGreeting() {
  const now = new Date();
  const hour = now.getHours();

  // Determine time of day
  let timeOfDay;
  if (hour >= 5 && hour < 12) {
    timeOfDay = "morning";
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = "afternoon";
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = "evening";
  } else {
    timeOfDay = "night";
  }

  // Format date and time
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateStr = now.toLocaleDateString("en-US", dateOptions);

  const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  const timeStr = now.toLocaleTimeString("en-US", timeOptions);

  return `Good ${timeOfDay}.<br />It's ${dateStr} and ${timeStr} where you are.`;
}

// Compose full welcome message
export function getWelcomeMessage() {
  return {
    greeting: getGreeting(),
    intro: welcomeIntro,
    preButton: welcomePreButton,
    postButton: welcomePostButton,
  };
}

// Utility function to convert pipe-separated text to HTML paragraphs
export function formatMessageText(text) {
  return text
    .split("|")
    .map((line) => `${line.trim()}<br />`)
    .join("");
}

export function showGreeting() {
  const message = getWelcomeMessage();
  document.getElementById("welcome-greeting").innerHTML = formatMessageText(
    message.greeting
  );
  document.getElementById("welcome-intro").innerHTML = formatMessageText(
    message.intro
  );
  document.getElementById("welcome-pre-button").innerHTML = formatMessageText(
    message.preButton
  );
  document.getElementById("welcome-post-button").innerHTML = formatMessageText(
    message.postButton
  );
}

export function hideWelcome() {
  document.querySelectorAll(".dismissible").forEach((el) => {
    el.classList.add("hidden");
  });
  // Show distance display
  document.getElementById("distance-display").classList.remove("hidden");
}

/*
// IDEA SCRATCHPAD

// Not in use yet - time/distance messages.
// Messages that show facts based on speed when you enter one,
// or encourage you try one.

// Track which speeds user has tried, some function. Something like:

/* const triedSpeeds = new Set();

// After being in one mode for 30 seconds, suggest another
if (!triedSpeeds.has("continental-drift") && timeInCurrentMode > 30) {
  showDriftingMessage(
    "Try Continental Drift mode. At walking speed, a year passes in 1.75 seconds. At continental drift, a second takes 7 years."
  );
}
  */

/* Continentnal drift:
   Weird how your brain sees this moving but it feels motionless.
// Yet this 'motionless' force broken apart Pangea, created the Himalayas, and opened the Atlantic Ocean." */
