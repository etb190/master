import * as THREE from 'three';

// Central place for tunable game settings.
export const PLANET_RADIUS = 5;
export const LAND_FRACTION = 0.45;                 // share of the planet that is land
export const WORLD_SEED = new THREE.Vector3(3.7, 11.3, 5.1); // change for a different world
export const SUN_POSITION = new THREE.Vector3(20, 8, 15);
export const CAMERA = { fov: 45, start: [0, 3, 15], minDistance: PLANET_RADIUS + 1.0, maxDistance: 40 };

export const SETTLEMENTS = {
  count: 100,              // max settlements on the map
  population: 200,         // people per settlement (human-based)
  tentsPer: 8,             // tent models per settlement
  territoryRadius: 0.34,   // coloured canvas radius when zoomed out
  minSep: 0.12,            // min angular separation between settlements
  lodNear: 13,             // camera distance: below this, tents + dirt paths show
};
