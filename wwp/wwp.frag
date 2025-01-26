#ifdef GL_ES
  precision highp float;
#endif

uniform vec2  iResolution;
uniform float iTime;

// Available sensor uniforms:
// uniform vec3  iAccelerometer;
// uniform vec3  iGyroscope;
// uniform vec3  iMagnetometer;
// uniform vec3  iAmbientLight;
// uniform vec3  iGravity;
// uniform vec3  iLinearAcceleration;
// uniform vec3  iRelativeOrientation;
// uniform vec3  iAbsoluteOrientation;

// Other input uniforms;
// uniform vec3  iMouse;
// uniform float iRandom;
// uniform vec2  iRandom2D;


void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord.xy / iResolution.xy;
    fragColor = vec4(uv.x * cos(iTime), uv.y * sin(iTime), uv.x * uv.y, 1.0);
}

void main() {
    mainImage( gl_FragColor, gl_FragCoord.xy );
}