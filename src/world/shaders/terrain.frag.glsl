precision highp float;
varying vec2 vUv;
uniform float mode; uniform float sea; uniform vec2 res;
const float PI = 3.14159265;
uniform vec3 SEED; // world seed (set from config.js)
vec3 dirFromUv(vec2 uv){ float phi = uv.x * 2.0 * PI; float lat = (uv.y - 0.5) * PI; float cl = cos(lat); return vec3(-cos(phi) * cl, sin(lat), sin(phi) * cl); }
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float gnc(vec3 i, vec3 f){ return dot(hash33(i) * 2.0 - 1.0, f); }
float gn(vec3 p){
  vec3 i = floor(p), f = fract(p), u = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(mix(gnc(i,f), gnc(i+vec3(1,0,0),f-vec3(1,0,0)), u.x), mix(gnc(i+vec3(0,1,0),f-vec3(0,1,0)), gnc(i+vec3(1,1,0),f-vec3(1,1,0)), u.x), u.y),
             mix(mix(gnc(i+vec3(0,0,1),f-vec3(0,0,1)), gnc(i+vec3(1,0,1),f-vec3(1,0,1)), u.x), mix(gnc(i+vec3(0,1,1),f-vec3(0,1,1)), gnc(i+vec3(1,1,1),f-vec3(1,1,1)), u.x), u.y), u.z);
}
float fbm4(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * gn(p); p *= 2.03; a *= 0.5; } return s; }
float landH(vec3 p){
  vec3 q = p * 1.1 + SEED;
  q += 0.6 * vec3(gn(q*1.6), gn(q*1.6+vec3(5.2,1.3,8.1)), gn(q*1.6+vec3(2.9,7.7,3.3)));
  float s = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 10; i++) { s += a * gn(q * f); f *= 2.02; a *= 0.5; }
  return s;
}
float ridge(vec3 p){ float s = 0.0, a = 0.5, f = 1.0; for (int i = 0; i < 6; i++) { float r = max(1.0 - abs(gn(p*f)*1.6), 0.0); s += a*r*r; f *= 2.1; a *= 0.5; } return s; }
float elev(vec3 p, float h){
  float ls = h - sea; if (ls < 0.0) return 0.0;
  float inl = smoothstep(0.02, 0.22, ls);
  float mask = smoothstep(-0.1, 0.3, gn(p*1.3 + vec3(40.0)));
  return ls * 1.5 + max(ridge(p*2.6 + SEED) * mask * inl - 0.2, 0.0) * 1.3;
}
float sq(float x){ return x * x; }
vec3 C(float r, float g, float b){ return vec3(r, g, b) / 255.0; }
vec3 surface(vec3 p, float h){
  float ls = h - sea, ay = abs(p.y), latDeg = degrees(asin(clamp(ay, 0.0, 1.0)));
  float dN = gn(p*45.0)*0.5+0.5, dM = gn(p*9.0)*0.5+0.5;
  if (ls < 0.0) {
    float t = clamp(-ls / 0.3, 0.0, 1.0);
    vec3 c = t < 0.3 ? mix(C(46.0,140.0,170.0), C(14.0,70.0,128.0), t/0.3) : mix(C(14.0,70.0,128.0), C(5.0,24.0,66.0), (t-0.3)/0.7);
    c *= 0.96 + 0.08 * dN;
    return mix(c, C(226.0,237.0,247.0), smoothstep(0.86, 0.93, ay + (dM-0.5)*0.08));
  }
  float E = elev(p, h);
  float m = 0.5 + 1.3 * fbm4(p*1.7 + vec3(40.0));
  m += 0.18*exp(-sq((latDeg-3.0)/14.0)) - 0.3*exp(-sq((latDeg-26.0)/9.0)) + 0.08*smoothstep(40.0, 60.0, latDeg);
  m = clamp(m, 0.0, 1.0);
  float temp = 1.0 - pow(ay, 1.5)*1.15 - E*0.45 + (dM-0.5)*0.12;
  vec3 c;
  if (m < 0.3) c = mix(C(198.0,160.0,100.0), C(160.0,150.0,80.0), m/0.3*0.5);
  else if (m < 0.5) c = mix(C(160.0,150.0,80.0), C(92.0,130.0,62.0), (m-0.3)/0.2);
  else if (m < 0.7) c = mix(C(92.0,130.0,62.0), C(38.0,88.0,44.0), (m-0.5)/0.2);
  else c = mix(C(38.0,88.0,44.0), C(18.0,70.0,36.0), (m-0.7)/0.3);
  c = mix(c, C(48.0,80.0,58.0), (1.0 - smoothstep(0.28, 0.45, temp)) * (m > 0.35 ? 1.0 : 0.4));
  c = mix(c, C(130.0,130.0,110.0), 1.0 - smoothstep(0.18, 0.3, temp));
  c = mix(c, C(208.0,191.0,142.0), (1.0 - smoothstep(0.0, 0.012, ls)) * 0.95);
  c = mix(c, C(112.0,100.0,90.0), smoothstep(0.5, 0.75, E));
  c = mix(c, C(245.0,248.0,252.0), max(1.0 - smoothstep(0.06, 0.18, temp), smoothstep(0.85, 1.1, E)));
  return c * (0.86 + 0.28 * dN) * (0.92 + 0.16 * dM);
}
void main(){
  vec2 uv = vec2(vUv.x, clamp(vUv.y, 0.002, 0.998));
  vec3 p = dirFromUv(uv);
  if (mode < 0.5) { float h = landH(p); gl_FragColor = vec4(vec3(clamp((h + 0.8) / 1.6, 0.0, 1.0)), 1.0); return; }
  if (mode < 1.5) { gl_FragColor = vec4(surface(p, landH(p)), 1.0); return; }
  if (mode < 2.5) {
    vec2 d = 1.0 / res;
    vec3 pe = dirFromUv(uv + vec2(d.x, 0.0)), pw = dirFromUv(uv - vec2(d.x, 0.0));
    vec3 pn = dirFromUv(uv + vec2(0.0, d.y)), ps = dirFromUv(uv - vec2(0.0, d.y));
    float sx = (elev(pe, landH(pe)) - elev(pw, landH(pw))) / max(length(pe - pw) * 5.0, 1e-4);
    float sy = (elev(pn, landH(pn)) - elev(ps, landH(ps))) / max(length(pn - ps) * 5.0, 1e-4);
    vec3 n = normalize(vec3(-sx * 0.12, -sy * 0.12, 1.0));
    gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); return;
  }
  if (mode < 3.5) {
    float h = landH(p), ice = smoothstep(0.86, 0.93, abs(p.y));
    float s = h < sea ? 1.0 - ice * 0.85 : 0.08;
    gl_FragColor = vec4(vec3(s), 1.0); return;
  }
  vec3 q = p * 2.2 + SEED * 2.0;
  q += 0.5 * vec3(gn(q), gn(q + 7.1), gn(q + 3.3));
  float c = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 6; i++) { c += a * gn(q * f); f *= 2.1; a *= 0.5; }
  c += 0.12 * cos(p.y * 9.0);
  gl_FragColor = vec4(1.0, 1.0, 1.0, smoothstep(0.02, 0.38, c) * 0.9);
}
