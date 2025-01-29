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


#define S(k) i*i/1e4*sin(cos(k*2e2*u.x/i)+.0875*i*cos(2e1*i+0.1*iDate.w/k))
    
void mainImage(out vec4 f, vec2 u) {
    u /= iResolution.xy;
    for (float i=1.; i < 32.; i++) 
		  f = u.y < .7-.03*i  +2.*S(1.)+S(2.)+.5*S(5.) ? i*vec4(.002,.009,.009,1) : f+.05; 
}

void main() {
    mainImage( gl_FragColor, gl_FragCoord.xy );
}