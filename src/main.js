import './styles.css';
import { Engine } from './core/Engine.js';
import { Starfield } from './space/Starfield.js';
import { Nebula } from './space/Nebula.js';
import { Sun } from './space/Sun.js';
import { Planet } from './world/Planet.js';
import { hideLoading } from './ui/Loading.js';

const engine = new Engine();
engine.add(new Sun());
engine.add(new Nebula());
engine.add(new Starfield({ pixelRatio: engine.renderer.getPixelRatio() }));
const planet = engine.add(new Planet(engine));

engine.start();
// Let the loading screen paint first, then build the world.
setTimeout(() => { planet.generate(); hideLoading(); }, 60);
