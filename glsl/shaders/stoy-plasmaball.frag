// Plasma Globe by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/XsjXRm
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options

//looks best with around 25 rays
#define NUM_RAYS 13.0

#define VOLUMETRIC_STEPS 19

#define MAX_ITER 35
#define FAR 6.0

#define time iTime*1.1

uniform float iTime;
uniform vec2  iResolution;
uniform vec2  iMouse;
uniform sampler2D iNoise24b256;

mat2 mm2(in float a){
  float c = cos(a), s = sin(a);
  return mat2(c,-s,s,c);
}

float noise( in float x ){
  return texture2D(iNoise24b256, vec2(x * 0.01, 1.0), 0.0).x;
}

float hash( float n ){
  return fract(sin(n) * 43758.5453);
}

float noise(in vec3 p){
	vec3 ip = floor(p);
  vec3 fp = fract(p);
	fp = fp * fp * (3.0 - 2.0 * fp);
	
	vec2 tap = (ip.xy + vec2(37.0, 17.0) * ip.z) + fp.xy;
	vec2 rg = texture2D(iNoise24b256, (tap + 0.5) / 256.0, 0.0).yx;
	return mix(rg.x, rg.y, fp.z);
}

mat3 m3 = mat3( 0.00,  0.80,  0.60,
               -0.80,  0.36, -0.48,
               -0.60, -0.48,  0.64 );


//See: https://www.shadertoy.com/view/XdfXRj
float flow(in vec3 p, in float t){
	float z = 2.0;
	float rz = 0.0;
	vec3 bp = p;
	for (float i= 1.0; i < 5.0; i++){
		p += time * 0.1;
		rz+= (sin(noise(p + t * 0.8) * 6.0) * 0.5 + 0.5) / z;
		p = mix(bp, p, 0.6);
		z *= 2.0;
		p *= 2.01;
    p*= m3;
	}
	return rz;	
}

//could be improved
float sins(in float x){
 	float rz = 0.;
  float z = 2.;
  for (float i=0.0; i < 3.0; i++ ){
    rz += abs(fract(x * 1.4) - 0.5) / z;
    x *= 1.3;
    z *= 1.15;
    x -= time * 0.65 * z;
  }
  return rz;
}

float segm( vec3 p, vec3 a, vec3 b){
  vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0 );	
	return length(pa - ba * h) * 0.5;
}

vec3 path(in float i, in float d){
  vec3 en = vec3(0.0, 0.0, 1.0);
  float sns2 = sins(d + i * 0.5) * 0.22;
  float sns = sins(d + i * 0.6) * 0.21;
  en.xz *= mm2((hash(i * 10.569) - 0.5) * 6.2 + sns2);
  en.xy *= mm2((hash(i * 4.732) - 0.5) * 6.2 + sns);
  return en;
}

vec2 map(vec3 p, float i){
	float lp = length(p);
  vec3 bg = vec3(0.);   
  vec3 en = path(i, lp);
  
  float ins = smoothstep(0.11, 0.46, lp);
  float outs = 0.15 + smoothstep(0.0, 0.15, abs(lp-1.));
  p *= ins*outs;
  float id = ins*outs;
  
  float rz = segm(p, bg, en) - 0.011;
  return vec2(rz,id);
}

float march(in vec3 ro, in vec3 rd, in float startf, in float maxd, in float j){
	float precis = 0.001;
  float h = 0.5;
  float d = startf;
  for(int i = 0; i < MAX_ITER; i++){
    if(abs(h) < precis || d > maxd)
      break;
    d += h * 1.2;
    float res = map(ro + rd * d, j).x;
    h = res;
  }
	return d;
}

//volumetric marching
vec3 vmarch(in vec3 ro, in vec3 rd, in float j, in vec3 orig){   
  vec3 p = ro;
  vec2 r = vec2(0.0);
  vec3 sum = vec3(0);
  float w = 0.0;
  for(int i = 0; i < VOLUMETRIC_STEPS; i++){
    r = map(p, j);
    p += rd * 0.03;
    float lp = length(p);
    
    vec3 col = sin(vec3(1.05, 2.5, 1.52) * 3.94 + r.y) * 0.85 + 0.4;
    col.rgb *= smoothstep(0.0, 0.015, -r.x);
    col *= smoothstep(0.04, 0.2, abs(lp - 1.1));
    col *= smoothstep(0.1, 0.34, lp);
    sum += abs(col)*5. * (1.2 - noise(lp * 2.0 + j * 13.0 + time * 5.0) * 1.1) / (log(distance(p, orig) - 2.0) + 0.75);
  }
  return sum;
}

//returns both collision dists of unit sphere
vec2 iSphere2(in vec3 ro, in vec3 rd){
  vec3 oc = ro;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - 1.;
  float h = b * b - c;
  if(h < 0.0)
    return vec2(-1.0);
  else
    return vec2((-b - sqrt(h)), (-b + sqrt(h)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){	
	vec2 p = fragCoord.xy / iResolution.xy - 0.5;
	p.x *= iResolution.x / iResolution.y;
	vec2 um = iMouse.xy / iResolution.xy - 0.5;
    
	//camera
	vec3 ro = vec3(0.,0.,5.);
  vec3 rd = normalize(vec3(p * 0.7, -1.5));
  mat2 mx = mm2(time * 0.4 + um.x * 6.0);
  mat2 my = mm2(time * 0.3 + um.y * 6.0); 
  ro.xz *= mx; rd.xz *= mx;
  ro.xy *= my; rd.xy *= my;
  
  vec3 bro = ro;
  vec3 brd = rd;

  vec3 col = vec3(0.0125, 0.0, 0.025);
#if 1
  for (float j = 1.0; j < NUM_RAYS + 1.0; j++){
    ro = bro;
    rd = brd;
    mat2 mm = mm2((time*0.1+((j+1.)*5.1))*j*0.25);
    ro.xy *= mm; rd.xy *= mm;
    ro.xz *= mm; rd.xz *= mm;
    float rz = march(ro, rd, 2.5, FAR, j);
    if ( rz >= FAR)
      continue;
    vec3 pos = ro + rz * rd;
    col = max(col, vmarch(pos, rd, j, bro));
  }
#endif
    
  ro = bro;
  rd = brd;
  vec2 sph = iSphere2(ro,rd);
  
  if (sph.x > 0.0){
    vec3 pos = ro + rd * sph.x;
    vec3 pos2 = ro + rd * sph.y;
    vec3 rf = reflect( rd, pos );
    vec3 rf2 = reflect( rd, pos2 );
    float nz = (-log(abs(flow(rf * 1.2, time) - 0.01)));
    float nz2 = (-log(abs(flow(rf2 * 1.2, -time) - 0.01)));
    col += (0.1 * nz * nz * vec3(0.12,0.12,0.5) + 0.05 * nz2 * nz2 * vec3(0.55,0.2,.55)) * 0.8;
  }
    
	fragColor = vec4(col*1.3, 1.0);
}