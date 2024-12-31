#ifdef GL_ES
  precision highp float;
#endif

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

// shaderToy style:
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord.xy / iResolution.xy;
    fragColor = vec4(uv.x * cos(iTime), uv.y * sin(iTime), uv.x * uv.y, 1.0);
}

void main() {
    mainImage( gl_FragColor, gl_FragCoord.xy );
}