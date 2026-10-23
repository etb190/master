import * as THREE from 'three';
import { PLANET_RADIUS } from '../../config.js';
import { SETTLEMENTS } from '../../config.js';
import { rand } from '../../core/random.js';
import { ageForYear, YEAR_FIRST, YEAR_LAST } from './Ages.js';

const TWO_PI = Math.PI * 2;
const MASK_W = 128, MASK_H = 64;
const YEAR_SPAN = YEAR_LAST - YEAR_FIRST + 1;

function spherePosition(latDeg, lonDeg, r = PLANET_RADIUS) {
  const phi = lonDeg * Math.PI / 180;
  const lat = latDeg * Math.PI / 180;
  const cl = Math.cos(lat);
  return new THREE.Vector3(-Math.cos(phi) * cl, Math.sin(lat), Math.sin(phi) * cl).multiplyScalar(r);
}

function maskIdx(lonDeg, latDeg) {
  const ci = Math.floor(((lonDeg + 180) / 360) * MASK_W) & (MASK_W - 1);
  const cj = Math.floor(((latDeg + 90) / 180) * MASK_H) & (MASK_H - 1);
  return cj * MASK_W + ci;
}

/**
 * Human settlements: up to 100 settlements of 200 people each, dotted over land.
 *
 * Zoom out  -> coloured territory canvas (disc) marks each settlement's land.
 * Zoom in   -> small tent models + dirt paths appear; territory canvas fades.
 */
export class Settlements {
  constructor(engine) {
    this.engine = engine;
    this.count = SETTLEMENTS.count;
    this.population = SETTLEMENTS.population;
    this.tentsPer = SETTLEMENTS.tentsPer;
    this.year = YEAR_FIRST;
    this.landMask = null;
    this.settlements = []; // { pos, normal, color, canvasColor, base, tents, line }
    this.near = null;
    this._hudYear = -1;

    this.object3d = new THREE.Group();
    this.object3d.name = 'settlements';

    const tentGeo = new THREE.ConeGeometry(0.13, 0.34, 6);
    tentGeo.translate(0, 0.17, 0); // base sits on the ground
    const poleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.44, 6);
    poleGeo.translate(0, 0.22, 0);
    this.discGeo = new THREE.CircleGeometry(SETTLEMENTS.territoryRadius, 32);

    this.tentMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 0 });
    this.poleMat = new THREE.MeshPhongMaterial({ color: 0x4a443e, shininess: 0 });
    this.discMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 });
    this.pathMat = new THREE.LineBasicMaterial({ color: 0x8b6a42, transparent: true, opacity: 0.9, depthTest: false });

    const maxInstances = this.count * this.tentsPer;
    this.tents = new THREE.InstancedMesh(tentGeo, this.tentMat, maxInstances);
    this.poles = new THREE.InstancedMesh(poleGeo, this.poleMat, maxInstances);
    this.tents.count = 0;
    this.poles.count = 0;
    this.tents.frustumCulled = false;
    this.poles.frustumCulled = false;
    // base instance matrices (position + orientation, unit scale), one block per settlement
    this.instanceBase = new Float32Array(maxInstances * 16);

    this.object3d.add(this.tents, this.poles);

    this.discs = new THREE.Group();
    this.paths = new THREE.Group();
    this.object3d.add(this.discs, this.paths);

    this.hud = typeof document !== 'undefined' ? document.getElementById('age') : null;
    this._tmp = new THREE.Vector3();
    this._quat = new THREE.Quaternion();
    this._mat = new THREE.Matrix4();
  }

  /** Called by Planet once the terrain textures (and land mask) exist. */
  place(landMask) {
    this.landMask = landMask;
    const placed = [];
    let attempts = 0;
    const maxAttempts = this.count * 60;
    while (this.settlements.length < this.count && attempts++ < maxAttempts) {
      const lat = rand(-50, 50);
      const lon = rand(-180, 180);
      if (!(this.landMask[maskIdx(lon, lat)] & 1)) continue;
      const pos = spherePosition(lat, lon);
      const unit = pos.clone().normalize();
      let tooClose = false;
      for (const s of placed) {
        if (unit.dot(s) > Math.cos(SETTLEMENTS.minSep)) { tooClose = true; break; }
      }
      if (tooClose) continue;
      placed.push(unit);
      this.addSettlement(lat, lon, pos);
    }
    this.uploadInstances();
    this.applyLOD();
    this.touchHud();
  }

  addSettlement(lat, lon, pos) {
    const index = this.settlements.length;
    const base = index * this.tentsPer;
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.55, 0.55);
    const canvasColor = new THREE.Color().setHSL(hue, 0.45, 0.72);

    const normal = pos.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    let t1 = this._tmp.copy(normal).cross(up);
    if (t1.lengthSq() < 0.01) t1.set(1, 0, 0);
    t1.normalize();
    const t2 = new THREE.Vector3().crossVectors(normal, t1);
    const tentQuat = this._quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const discQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    const spread = 0.16 + Math.random() * 0.14;
    const tents = [], angles = [];
    const world = new THREE.Vector3();
    for (let k = 0; k < this.tentsPer; k++) {
      const a = Math.random() * TWO_PI;
      const d = 0.04 + Math.random() * spread;
      world.copy(pos)
        .add(t1.clone().multiplyScalar(Math.cos(a) * d))
        .add(t2.clone().multiplyScalar(Math.sin(a) * d))
        .normalize()
        .multiplyScalar(PLANET_RADIUS * 1.005);
      tents.push(world);
      angles.push(a);
    }
    // order tents around the centre so the dirt path loops neatly
    const order = tents.map((_, i) => i).sort((a, b) => angles[a] - angles[b]);
    const pathPts = [];
    for (let k = 0; k < order.length; k++) {
      const p1 = tents[order[k]];
      const p2 = tents[order[(k + 1) % order.length]];
      for (let s = 0; s <= 8; s++) {
        const pt = world.copy(p1).lerp(p2, s / 8).normalize().multiplyScalar(PLANET_RADIUS * 1.004);
        pathPts.push(pt.x, pt.y, pt.z);
      }
    }

    const m = new THREE.Matrix4();
    for (let k = 0; k < this.tentsPer; k++) {
      m.compose(tents[k], tentQuat, new THREE.Vector3(1, 1, 1));
      m.toArray(this.instanceBase, (base + k) * 16);
    }

    this.settlements.push({ pos, normal, color, canvasColor, base, tents, pathPts });

    // coloured territory canvas: drawn on top of the terrain, slightly above the surface
    const discMat = this.discMat.clone();
    discMat.color.copy(color);
    const disc = new THREE.Mesh(this.discGeo, discMat);
    disc.position.copy(pos.clone().multiplyScalar(1.006));
    disc.quaternion.copy(discQuat);
    disc.renderOrder = 110;
    disc.frustumCulled = false;
    this.discs.add(disc);

    // dirt path connecting the tents
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pathPts, 3));
    const line = new THREE.LineLoop(geo, this.pathMat);
    line.renderOrder = 100;
    line.visible = false;
    line.frustumCulled = false;
    this.paths.add(line);
  }

  uploadInstances() {
    const total = this.settlements.length * this.tentsPer;
    this.tents.count = total;
    this.poles.count = total;
    this.tents.instanceMatrix.array.set(this.instanceBase.subarray(0, total * 16));
    this.poles.instanceMatrix.array.set(this.instanceBase.subarray(0, total * 16));
    this.tents.instanceMatrix.needsUpdate = true;
    this.poles.instanceMatrix.needsUpdate = true;
  }

  applyLOD() {
    const camera = this.engine.camera;
    const dist = camera.position.length();
    const near = dist < SETTLEMENTS.lodNear;
    if (near === this.near) { this.updateOpacity(dist); return; }
    this.near = near;
    // tents + dirt paths only exist close up
    const total = this.settlements.length * this.tentsPer;
    this.tents.count = near ? total : 0;
    this.poles.count = near ? total : 0;
    for (const line of this.paths.children) line.visible = near;
    this.updateOpacity(dist);
  }

  updateOpacity(dist) {
    const near = SETTLEMENTS.lodNear;
    const far = 22;
    let t = 0;
    if (dist > near) t = (dist - near) / (far - near);
    t = Math.min(Math.max(t, 0), 1);
    this.discMat.opacity = THREE.MathUtils.lerp(0.10, 0.55, t);
    this.discMat.needsUpdate = true;
  }

  touchHud() {
    if (!this.hud) return;
    const year = Math.floor(this.year);
    if (year === this._hudYear && this.settlements.length === 0) return;
    this._hudYear = year;
    const info = ageForYear(this.year);
    const total = this.population * this.settlements.length;
    this.hud.textContent = `Age ${info.index} — ${info.name} · Year ${year} · ${this.settlements.length} settlements · ${total} people`;
  }

  update(time) {
    if (!this.landMask) return;

    const camera = this.engine.camera;
    const dist = camera.position.length();
    const near = dist < SETTLEMENTS.lodNear;
    if (near !== this.near) this.applyLOD();
    else this.updateOpacity(dist);

    // simple clock: ~1.5 years per second, wrapping from the 1920s back to year 1
    if (this.lastTime === undefined) this.lastTime = time;
    const dt = time - this.lastTime;
    this.lastTime = time;
    if (dt > 0) {
      this.year += dt * 1.5;
      while (this.year > YEAR_LAST) this.year -= YEAR_SPAN;
      const year = Math.floor(this.year);
      if (year !== this._hudYear) this.touchHud();
    }
  }
}
