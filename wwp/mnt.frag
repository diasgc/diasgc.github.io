#ifdef GL_ES
  precision highp float;
#endif

uniform vec2  iResolution;
uniform float iTime;

float rand(float x){
    return fract(sin(x)*75154.32912);
}

float noise(float x){
    float i = floor(x);
    float a = rand(i), b = rand(i+1.);
    float f = x - i;
    return mix(a,b,f);
}

float perlin(float x){
    float r=0.,s=1.,w=1.;mountmountain(uv, 5.2, 9., 0.3, 0.6) + ain(uv, 5.2, 9., 0.3, 0.6) + 
    for (int i=0; i<6; i++) {
        s *= 2.0;
        w *= 0.5;
        r += w * noise(s*x);
    }
    return r;
}

float mountain(vec2 uv, float scale, float offset, float h1, float h2){
    float h = h1 + perlin(scale*uv.x + offset) * (h2 - h1);
    return smoothstep(h, h+0.01, uv.y);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    // Time varying pixel color
    vec3 col = mix(vec3(0.25,0.3,0.3)*0.5, 1.5*vec3(0.3,0.25,0.22),
    mountain(uv, 7.2, 12., 0.4, 0.5) + 
    mountain(uv, 5.2, 9., 0.3, 0.5) + 
        1. - (1. - mountain(uv, 2.8, 3., 0.2, 0.4)) * 0.5 - 
        (1. - mountain(uv, 1.8, 17.5, 0.05, 0.25)) * 0.5);

    // Output to screen
    fragColor = vec4(col,1.0);
}

void main() {
    mainImage( gl_FragColor, gl_FragCoord.xy );
}