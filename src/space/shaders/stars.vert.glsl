attribute float size;
attribute float phase;
attribute vec3 color;
uniform float time;
uniform float pr;
varying vec3 c;
varying float t;
void main() {
  c = color;
  t = 0.75 + 0.25 * sin(time * 1.5 + phase * 3.0);
  gl_PointSize = size * pr * (0.9 + 0.2 * t);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
