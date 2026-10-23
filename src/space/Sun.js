import * as THREE from 'three';
import { SUN_POSITION } from '../config.js';

/** Scene lighting: a warm sun plus soft ambient fill. */
export class Sun {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.add(new THREE.AmbientLight(0x9fb0d0, 0.5));
    const light = new THREE.DirectionalLight(0xfff4e6, 1.35);
    light.position.copy(SUN_POSITION);
    this.object3d.add(light);
  }
}
