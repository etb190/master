varying vec3 c;
varying float t;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 1.6) * t;
  gl_FragColor = vec4(c * 1.3, a);
}
