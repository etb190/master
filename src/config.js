import * as THREE from 'three';

// Central place for tunable game settings.
export const PLANET_RADIUS = 5;
export const LAND_FRACTION = 0.45;                 // share of the planet that is land
export const WORLD_SEED = new THREE.Vector3(3.7, 11.3, 5.1); // change for a different world
export const SUN_POSITION = new THREE.Vector3(20, 8, 15);
export const CAMERA = { fov: 45, start: [0, 3, 15], minDistance: PLANET_RADIUS + 1.0, maxDistance: 40 };
