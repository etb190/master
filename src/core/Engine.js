import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAMERA } from '../config.js';

/**
 * Owns the renderer, scene, camera, controls and the main loop.
 * Anything added with add() that has an update(time) method is ticked every frame.
 */
export class Engine {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, innerWidth / innerHeight, 0.1, 2000);
    this.camera.position.set(...CAMERA.start);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(this.renderer.domElement);
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = CAMERA.minDistance;
    this.controls.maxDistance = CAMERA.maxDistance;
    this.controls.rotateSpeed = 0.6;

    this.updatables = [];
    addEventListener('resize', () => this.resize());
  }

  add(entity) {
    this.scene.add(entity.object3d ?? entity);
    if (typeof entity.update === 'function') this.updatables.push(entity);
    return entity;
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }

  start() {
    const loop = (ms) => {
      requestAnimationFrame(loop);
      const time = ms / 1000;
      for (const u of this.updatables) u.update(time);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop(0);
  }
}
