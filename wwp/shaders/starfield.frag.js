const frag = `// 3D Gradient noise from: https://www.shadertoy.com/view/Xsl3Dl
vec3 starhash( vec3 p ){
	p = vec3( dot(p, vec3(127.1, 311.7, 74.7)),
			      dot(p, vec3(269.5, 183.3, 246.1)),
			      dot(p, vec3(113.5, 271.9, 124.6)));
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float starnoise( in vec3 p ){
  vec3 i = floor( p );
  vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

  return mix( mix( mix( dot( starhash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                        dot( starhash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                   mix( dot( starhash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                        dot( starhash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
              mix( mix( dot( starhash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                        dot( starhash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                   mix( dot( starhash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                        dot( starhash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

const float stars_threshold = 8.0f; // modifies the number of stars that are visible
const float stars_exposure = 50.0f; // modifies the overall strength of the stars

float starfield(vec2 uv){
  vec3 stars_direction = normalize(vec3(uv * 2.0f - 1.0f, 1.0f)); // could be view vector for example
	float stars = pow(clamp(starnoise(stars_direction * 200.0f), 0.0f, 1.0f), stars_threshold) * stars_exposure;
	stars *= mix(0.4, 1.4, starnoise(stars_direction * 100.0f + vec3(iTime))); // time based flickering
  return stars;
}
  
void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  vec2 uv = fragCoord/iResolution.xy;
  float stars = starfield(uv);
  fragColor = vec4(vec3(uv.y * stars),1.0);
}`