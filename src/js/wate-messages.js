/* Walk Around the Earth */
/* messages.js - Journey messages that appear at specific distances */

export const journeyMessages = [
  {
    km: 0,
    text: "A 'great circle' is a type of circumnavigation that has the same radius as the Earth itself.|It's the maximum distance you can travel in a straight line - about 40,041 km.",
  },
  {
    km: 150,
    text: "All lines of longtitude and the equator are 'great circle routes.'",
  },
  {
    km: 500,
    text: "Actually, so is any straightline path around the earth of the same distance - as long the circle that it makes would slice through the center of the earth.",
  },
  {
    km: 625,
    text: "Later, you'll be able to set waypoints and your angle of travel. | But for now, this journey is equatorial.",
  },
  {
    km: 725,
    text: "At least you're on the most famous great circle.",
  },
  {
    km: 850,
    text: "This journey around the equator is the longest great circle, because the Earth bulges in the middle. If you were to circle the globe over the North and South Poles, your trip would be 67.154 km shorter.",
  },
  {
    km: 1000,
    text: "We'll have some fun with destinations later.|In the meantime, congratulations on your first 1000km.",
  },
  {
    km: 1500,
    text: "The distance between two points on Earth is calculated with the Haversine formula, to account for the fact that it's a sphere.|It's been in use by sailors since the early 1800s.",
  },
  {
    km: 5000,
    text: "At a brisk walking pace of 5 km/h, this journey would take about 334 days of continuous walking.|Better to just scroll.",
  },
  {
    km: 10010.22,
    text: "Can you believe that you've made it a quarter of the way?",
  },
  {
    km: 11241,
    text: "You've just passed the distance of the longest land-only straight line on Earth.|It runs between SAGRES, PORTUGAL and JINJIANG, CHINA.|From here on, any real walking route would require a boat.",
  },
  {
    km: 20020.72,
    text: "You've reached the halfway point in your circumnavigation, called the ANTIPODE. Congratulations.",
  },
  {
    km: 30031.08,
    text: "Three-quarters of the way around. The finish line is in sight.|Well, 10,010 km away. But still.",
  },
  {
    km: 38037.3,
    text: "You've almost made it. Keep going.",
  },
];

// Not in use yet - conditional messages.
// Messages that show facts based on speed when you enter one,
// or encourage you try one.

// Track which speeds user has tried, some functon
const triedSpeeds = new Set();

// After being in one mode for 30 seconds, suggest another
if (!triedSpeeds.has("continental-drift") && timeInCurrentMode > 30) {
  showDriftingMessage(
    "Try Continental Drift mode. At walking speed, a year passes in 1.75 seconds. At continental drift, a second takes 7 years."
  );
}

// Contientnal drift:
// "Weird how your brain sees this moving but it feels motionless.
// Yet this 'motionless' force broken apart Pangea, created the Himalayas, and opened the Atlantic Ocean."
