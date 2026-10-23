import * as THREE from 'three';
import vertexShader from './shaders/stars.vert.glsl?raw';
import fragmentShader from './shaders/stars.frag.glsl?raw';
import { rand, gauss } from '../core/random.js';

export const GALACTIC_TILT = new THREE.Euler(0.9, 0.4, 0.3);
const PALETTE = [[0.62, 0.72, 1], [0.8, 0.86, 1], [1, 1, 1], [1, 0.93, 0.78], [1, 0.78, 0.58], [1, 0.62, 0.5]];

/** Twinkling, multi-coloured stars with a dense Milky Way band. */
export class Starfield {
  constructor({ count = 7000, pixelRatio = 1 } = {}) {
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const size = new Float32Array(count), phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3();
      if (i > count * 0.4) { // galactic band
        const a = rand(0, Math.PI * 2);
        v.set(Math.cos(a), gauss() * 0.2, Math.sin(a)).applyEuler(GALACTIC_TILT);
      } else {
        do v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)); while (v.length() > 1);
      }
      v.normalize().multiplyScalar(900);
      pos.set([v.x, v.y, v.z], i * 3);
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)], br = rand(0.5, 1);
      col.set([c[0] * br, c[1] * br, c[2] * br], i * 3);
      size[i] = Math.random() < 0.03 ? rand(3.5, 5.5) : rand(0.8, 2.4);
      phase[i] = rand(0, 6.28);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
    this.material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, pr: { value: pixelRatio } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader, fragmentShader
    });
    this.object3d = new THREE.Points(geo, this.material);
  }

  update(time) {
    this.material.uniforms.time.value = time;
    this.object3d.rotation.y += 0.00003;
  }
}
