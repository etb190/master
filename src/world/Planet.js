import * as THREE from 'three';
import { PLANET_RADIUS, LAND_FRACTION, WORLD_SEED } from '../config.js';
import { generateWorld } from './WorldGenerator.js';
import { Atmosphere } from './Atmosphere.js';

/** The planet: terrain sphere, cloud layer and atmosphere. */
export class Planet {
  constructor(engine) {
    this.engine = engine;
    this.object3d = new THREE.Group();

    this.surfaceMaterial = new THREE.MeshPhongMaterial({ color: 0x0b2a55, specular: new THREE.Color(0x4a5566), shininess: 28 });
    this.surface = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS, 192, 192), this.surfaceMaterial);

    this.cloudMaterial = new THREE.MeshLambertMaterial({ transparent: true, depthWrite: false, opacity: 0 });
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS * 1.012, 128, 128), this.cloudMaterial);

    this.atmosphere = new Atmosphere();
    this.object3d.add(this.surface, this.clouds, this.atmosphere.object3d);
  }

  /** Builds terrain textures on the GPU and applies them. */
  generate({ landFraction = LAND_FRACTION, seed = WORLD_SEED } = {}) {
    const tex = generateWorld(this.engine.renderer, { landFraction, seed, maxAnisotropy: this.engine.maxAnisotropy });
    const m = this.surfaceMaterial;
    m.color.set(0xffffff);
    m.map = tex.color; m.normalMap = tex.normal; m.specularMap = tex.specular;
    m.needsUpdate = true;
    this.cloudMaterial.map = tex.clouds;
    this.cloudMaterial.opacity = 1;
    this.cloudMaterial.needsUpdate = true;
  }

  update() { this.clouds.rotation.y += 0.00006; }
}
