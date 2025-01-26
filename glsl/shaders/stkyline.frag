#define S(k) i*i/1e4*sin(k*2e2*u.x/i+9.*i+iDate.w/k)
    
void mainImage(out vec4 f, vec2 u) {
    u /= iResolution.xy;
    for (float i=1.; i < 22.; i++) 
		f = u.y < .7-.03*i  +2.*S(1.)+S(2.)+.5*S(5.) ? i*vec4(0,.03,1,1) : f+.05; 
}