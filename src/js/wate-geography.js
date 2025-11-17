// geography.js - Handle GeometryCollection format

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

let landData = null;
let isLoading = false;
let loadPromise = null;

// Load land data once
async function loadLandData() {
  if (landData) return landData;

  if (isLoading) return loadPromise;

  isLoading = true;
  console.log("🌍 Loading land data from /land.json...");

  loadPromise = fetch("/land.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("📦 Data loaded:", data.type);

      // Handle both FeatureCollection and GeometryCollection
      if (data.type === "GeometryCollection") {
        console.log(
          "✅ GeometryCollection with",
          data.geometries.length,
          "geometries"
        );
        landData = data;
      } else if (data.type === "FeatureCollection") {
        console.log(
          "✅ FeatureCollection with",
          data.features.length,
          "features"
        );
        landData = data;
      } else {
        throw new Error(
          "Invalid GeoJSON: must be FeatureCollection or GeometryCollection"
        );
      }

      return landData;
    })
    .catch((error) => {
      console.error("❌ Error loading land data:", error);
      throw error;
    });

  return loadPromise;
}

// Check if coordinates are on land
export async function isOnLand(lat, lng) {
  const data = await loadLandData();
  const pt = point([lng, lat]);

  // Handle GeometryCollection
  if (data.type === "GeometryCollection") {
    for (const geometry of data.geometries) {
      if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
        const poly = polygon(geometry.coordinates);
        if (booleanPointInPolygon(pt, poly)) {
          return true;
        }
      }
    }
  }

  // Handle FeatureCollection
  if (data.type === "FeatureCollection") {
    for (const feature of data.features) {
      if (booleanPointInPolygon(pt, feature)) {
        return true;
      }
    }
  }

  return false;
}

// Get basic geographic info for a point
export async function getGeographicInfo(lat, lng) {
  const onLand = await isOnLand(lat, lng);

  return {
    isLand: onLand,
    terrain: onLand ? "Land" : "Ocean",
    lat,
    lng,
  };
}
