const frag=`uniform vec2 iResolution;
uniform float iTime;

const vec3 skyC = vec3(0.3984,0.5117,0.7305);
const vec3 sunC = vec3(1.,0.8,0.6); //vec3(0.9031,0.7687,0.5055);

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
	vec2 uv = fragCoord.xy / iResolution.y;
    
  // animation
  float t = 0.1 * iTime;
  vec2 sunVec = vec2(0.25 + 0.25 * sin(t), 0.1 + 0.4 * cos( 2.0 * t));
    
  //Mie mask
  float sun = max(1.0 - (1.0 + 45.0 * sunVec.y + 1.0 * uv.y) * length(uv - sunVec),0.0)
      + 0.3 * pow(1.0-uv.y,12.0) * (1.6-sunVec.y);

  //the sauce
  fragColor = vec4(mix(skyC, sunC, sun)
            * ((0.5 + 1.0 * pow(sunVec.y,0.4)) * (1.5-uv.y) + pow(sun, 5.2)
            * sunVec.y * (5.0 + 15.0 * sunVec.y)),1.0);
  
}`