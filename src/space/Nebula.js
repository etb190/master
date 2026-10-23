import * as THREE from 'three';
import { rand, gauss } from '../core/random.js';
import { GALACTIC_TILT } from './Starfield.js';

const COLORS = [[90, 70, 200], [40, 110, 200], [190, 70, 140], [60, 150, 180]];

function glowTexture([r, g, b]) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${r},${g},${b},0.5)`);
  gr.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** Soft coloured haze sprites scattered along the galactic band. */
export class Nebula {
  constructor(count = 26) {
    this.object3d = new THREE.Group();
    const textures = COLORS.map(glowTexture);
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: textures[i % textures.length], blending: THREE.AdditiveBlending,
        depthWrite: false, transparent: true, opacity: rand(0.25, 0.55)
      }));
      sprite.position.set(Math.cos(a), gauss() * 0.3, Math.sin(a)).applyEuler(GALACTIC_TILT).multiplyScalar(850);
      sprite.scale.setScalar(rand(300, 650));
      this.object3d.add(sprite);
    }
  }
  update() { this.object3d.rotation.y += 0.00003; }
}
