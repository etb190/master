# God Game

A browser game where you play as God over a procedurally generated, Earth-like planet.
Built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

## Project structure

```
index.html              page shell
src/
  main.js               entry point: wires everything together
  config.js             tunable settings (planet size, land %, seed, camera)
  styles.css            global styles
  core/
    Engine.js           renderer, scene, camera, controls, main loop
    random.js           small random helpers
  space/                everything outside the planet
    Starfield.js, Nebula.js, Sun.js, shaders/
  world/                the planet
    Planet.js           terrain sphere + clouds + atmosphere
    WorldGenerator.js   GPU world generation (colour, normals, specular, clouds)
    Atmosphere.js
    shaders/            terrain.frag.glsl, atmosphere.*.glsl
  ui/
    Loading.js          loading overlay
```

New game systems (humans, animals, buildings, eras, tools) get their own folders under `src/`
and plug into the engine with `engine.add(entity)`; any entity with an `update(time)` method is ticked each frame.

## Roadmap

- Click the globe to get a lat/lon, then place humans, animals and houses
- Tool palette, eras and time
