// Created by 42yeah - 42yeah/2020
// Ripped off from inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define R13(p) fract(sin(dot(p, vec3(12.345, 67.89, 412.12))) * 42123.45) * 2.0 - 1.0
#define P13_OCTAVES 5
#define wind -0.1
#define I vec2(0.0,1.0)

// Perlin noise 3D
float P13(vec3 p) {
    vec3 u = floor(p);
    vec3 v = fract(p);
    vec3 s = smoothstep(0.0, 1.0, v);
    
    return mix(
      mix(
        mix(R13(u + I.xxx), R13(u + I.yxx), s.x),
        mix(R13(u + I.xyx), R13(u + I.yyx), s.x),
        s.y),
      mix(
        mix(R13(u + I.xxy), R13(u + I.yxy), s.x),
        mix(R13(u + I.xyy), R13(u + I.yyy), s.x),
        s.y),
      s.z);
}

// Fractional Brownian Motion 3D
float fBM13(vec3 p) {
    vec3 off = vec3(0.0, 0.1, 1.0) * iTime * wind;
    vec3 q = p - off;
    
    // fbm
    float a1 = 0.5;
    float a2 = 2.0;
    float f = 0.0;
    for (int i = 0; i < P13_OCTAVES; i++){
        f += a1 * P13(q);
        a1 *= 0.5;
        q *= a2;
    }
    return clamp(f - p.y, 0.0, 1.0);
}


void volumetricTrace(vec3 ro, vec3 rd, inout vec3 sky, vec2 m) {

    float depth = 0.0;
    vec4 sumColor = vec4(0.0);
    
    for (int i = 0; i < 120; i++) {
        vec3 p = ro + depth * rd;
        float density = fBM13(p);
        if (density > 1e-3) {
            vec4 color = vec4(mix(sky, vec3(m.x), density), density);
            color.w *= 0.4;
            color.rgb *= color.w;
            sumColor += color * (1.0 - sumColor.a);
            sumColor.a = pow(sumColor.a, m.x);
        }
        depth += max(0.05, 0.03 * depth);
    }
    sumColor = clamp(sumColor, 0.0, 1.0);
    sumColor = pow(sky.b * sumColor, vec4(m.y));
    sky = mix(sky, sumColor.rgb, sumColor.a);
}

#define cloudiness 0.9
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv.x   *= iResolution.x / iResolution.y;
    vec2 m  = 0.5 + 0.5 * iMouse.xy / iResolution.xy;
    
    vec3 ro = vec3(0.5, 1.0, -1.0);
    vec3 rd = normalize(vec3(-uv, 1.0));
    
    vec3 sky = vec3(0.1,0.8,1.0) * (0.5+0.5 *sin(iTime * 0.1));
    
    volumetricTrace(ro, rd, sky, m);
    

    fragColor = vec4(sky, 1.0);
}
