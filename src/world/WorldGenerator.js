import * as THREE from 'three';
import terrainShader from './shaders/terrain.frag.glsl?raw';

/**
 * Generates the planet's textures on the GPU in a few full-screen passes:
 *  0 = low-res heights (used to pick the sea level), 1 = colour, 2 = normal map,
 *  3 = specular (shiny oceans), 4 = clouds.
 * Returns { color, normal, specular, clouds } textures.
 */
export function generateWorld(renderer, { landFraction, seed, maxAnisotropy }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      mode: { value: 0 }, sea: { value: 0 },
      res: { value: new THREE.Vector2(1, 1) }, SEED: { value: seed }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: terrainShader,
    depthTest: false, depthWrite: false, blending: THREE.NoBlending
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const run = (mode, w, h, mips) => {
    const rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
      magFilter: THREE.LinearFilter, generateMipmaps: !!mips, depthBuffer: false
    });
    rt.texture.wrapS = THREE.RepeatWrapping;
    rt.texture.anisotropy = maxAnisotropy;
    material.uniforms.mode.value = mode;
    material.uniforms.res.value.set(w, h);
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    return rt;
  };

  // Pass 0: pick the sea level so that `landFraction` of the planet's surface is land.
  const SW = 512, SH = 256, buf = new Uint8Array(SW * SH * 4);
  const lo = run(0, SW, SH, false);
  renderer.readRenderTargetPixels(lo, 0, 0, SW, SH, buf);
  const hist = new Float64Array(256);
  let total = 0;
  for (let j = 0; j < SH; j++) {
    const w = Math.abs(Math.cos(((j + 0.5) / SH) * Math.PI - Math.PI / 2)); // rows near the poles cover less area
    for (let i = 0; i < SW; i++) { hist[buf[(j * SW + i) * 4]] += w; total += w; }
  }
  let acc = 0, bin = 0;
  for (; bin < 256; bin++) { acc += hist[bin]; if (acc >= total * (1 - landFraction)) break; }
  material.uniforms.sea.value = ((bin + 0.5) / 255) * 1.6 - 0.8;
  lo.dispose();

  // Full-quality passes.
  const big = renderer.capabilities.isWebGL2 && !matchMedia('(pointer: coarse)').matches && renderer.capabilities.maxTextureSize >= 8192;
  const W = big ? 6144 : 4096;
  const color = run(1, W, W / 2, true);
  color.texture.encoding = THREE.sRGBEncoding;
  const normal = run(2, 4096, 2048, true);
  const specular = run(3, 2048, 1024, true);
  const clouds = run(4, 2048, 1024, true);
  material.dispose();
  return { color: color.texture, normal: normal.texture, specular: specular.texture, clouds: clouds.texture };
}
