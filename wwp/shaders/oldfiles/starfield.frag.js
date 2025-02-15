const frag = `// Starfield (https://www.shadertoy.com/view/NtsBzB)

vec3 hash(vec3 p) {
    p = fract(p * vec3(127.1, 311.7, 74.7));
    p += dot(p, p.yzx + 19.19);
    return fract(sin(p) * 43758.5453123);
}

float noise2(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(
            mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
                dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)),
                u.x),
            mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
                dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)),
                u.x),
            u.y),
        mix(
            mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
                dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)),
                u.x),
            mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
                dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)),
                u.x),
            u.y),
        u.z);
}

float starfield(vec2 uv, float sunpos, float clds){
  if (sunpos > -0.12 || clds > 0.9)
    return 0.;
  float fade = smoothstep(-0.12, -0.18, sunpos);
  float thres = 6.0 + smoothstep(0.5, 1.0, clds * fade) * 4.;
  float expos = 20.0;
  vec3 dir = normalize(vec3(uv * 2.0 - 1.0, 1.0));
  float stars = pow(clamp(noise2(dir * 200.0), 0.0, 1.0), thres) * expos;
  stars *= mix(0.4, 1.4, noise2(dir * 100.0 + vec3(iTime)));
  return stars * fade;
}

  
void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  vec2 uv = fragCoord/iResolution.xy;
  float stars = starfield(uv, 0.0, 0.0);
  fragColor = vec4(vec3(uv.y * stars),1.0);
}`