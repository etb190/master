import * as THREE from 'three';
import vertexShader from './shaders/atmosphere.vert.glsl?raw';
import fragmentShader from './shaders/atmosphere.frag.glsl?raw';
import { PLANET_RADIUS } from '../config.js';

/** Blue rim-glow around the planet. */
export class Atmosphere {
  constructor() {
    this.object3d = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS * 1.07, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        vertexShader, fragmentShader
      })
    );
  }
}
