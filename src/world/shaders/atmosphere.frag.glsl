varying vec3 n;
void main() {
  float i = pow(0.64 - dot(n, vec3(0.0, 0.0, 1.0)), 3.0);
  gl_FragColor = vec4(0.25, 0.55, 1.0, 1.0) * i;
}
