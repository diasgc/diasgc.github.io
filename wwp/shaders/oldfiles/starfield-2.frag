// Starfield#2 (based on https://www.shadertoy.com/view/fsSfD3)
const float phi = 1.61803398874989484820459;

float R121(vec2 co, float s){
  return fract(tan(distance(co * phi, co) * s) * co.x);
}

vec2 H21(float s){
  return vec2( R121(vec2(243.234, 63.834), s) - 0.5, R121(vec2(53.1434, 13.1234), s) - 0.5);
}

float LS2(vec2 uv, vec2 ofs, float b, float l) {
  float len = length(uv - ofs);
  return smoothstep(0.0, 1000.0, b * max(0.1, l) / pow(max(1E-13, len), 1.0 / max(0.1, l)));
}
  
vec3 starfield(vec2 uv, float sunpos, float clds) {
  if (sunpos > -0.12 || clds > 0.5)
    return vec3(0.);
  vec3 col = vec3(0.0);
  float lim = min(-sunpos * 50.0, 50.0);
  float intens = 0.02 + 0.02 * clds;
  for (float i = 0.0; i < 100.0; i += 1.0) {
    vec2 ofs = H21(i + 1.0) * vec2(1.1, 1.6);
    float r = (mod(i, 10.0) == 0.0) ? 0.5 + abs(sin(i / 50.0)) : 0.25;
    float l = 1.0 + intens * (sin(fract(iTime) * 0.5 * i) + 1.0);
    col += vec3(LS2(0.5 - uv, ofs, r, l));
    if (i > lim)
      break;
  }
  return col;
}

  
void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  vec2 uv = fragCoord/iResolution.xy;
  vec3 stars = starfield(uv, -0.2, 0.0);
  fragColor = vec4(stars, 1.0);
}