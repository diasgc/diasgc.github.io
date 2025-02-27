const frag = `
uniform vec2  iResolution;
uniform float iTime;
uniform float uSunPosition;
uniform float uClouds;
uniform float uHumidity;

const vec4  nightColor  = vec4(0.04, 0.034, 0.09, 1.0);
const vec4 _LightColor0 = vec4(0.9,  0.9,   0.7,  1.0);
const vec3 _GroundColor = vec3(0.);

const float _Exposure = 1.0;
const float _SunSize = 0.03;
const float _SunSizeConvergence = 5.0;
const vec3  _SkyTint = vec3(.1, .25, .1);
const float _AtmosphereThickness = 1.1;

#define MOUNTAINS 1
#define STARS 1
#define REALTIME 1
#define OUTER_RADIUS 1.025
#define kRAYLEIGH (mix(0.0, 0.0025, pow(_AtmosphereThickness + uHumidity, 2.5))) 
#define kMIE 0.001 
#define kSUN_BRIGHTNESS 20.0 
#define kMAX_SCATTER 50.0 
#define MIE_G (-0.990) 
#define MIE_G2 0.9801 
#define SKY_GROUND_THRESHOLD 0.005
#define SKYBOX_COLOR_IN_TARGET_COLOR_SPACE 1

const vec3 ScatteringWavelength = vec3(.65, .57, .475); //vec3(.65, .57, .475);
const vec3 ScatteringWavelengthRange = vec3(.15);    
const float kOuterRadius = OUTER_RADIUS; 
const float kOuterRadius2 = OUTER_RADIUS*OUTER_RADIUS;
const float kInnerRadius = 1.0;
const float kInnerRadius2 = 1.0;
const float kCameraHeight = 0.0001;
const float kHDSundiskIntensityFactor = 15.0;
const float kSunScale = 400.0 * kSUN_BRIGHTNESS;
const float kKmESun = kMIE * kSUN_BRIGHTNESS;
const float kKm4PI = kMIE * 4.0 * 3.14159265;
const float kScale = 1.0 / (OUTER_RADIUS - 1.0);
const float kScaleDepth = 0.25;
const float kScaleOverScaleDepth = (1.0 / (OUTER_RADIUS - 1.0)) / 0.25;
const float kSamples = 2.0;

float Scale(float inCos){
  float x = 1.0 - inCos;
  return 0.25 * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));
}

float SunAttenuation(vec3 lightPos, vec3 ray){
  float EyeCos = pow(clamp(dot(lightPos, ray), 0.0 , 1.0), _SunSizeConvergence);		
  float temp = pow(1.0 + MIE_G2 - 2.0 * MIE_G * (-EyeCos), pow(_SunSize, 0.65) * 10.);
  return (1.5 * ((1.0 - MIE_G2) / (2.0 + MIE_G2)) * (1.0 + EyeCos * EyeCos) / max(temp,1.0e-4));	
}

#if REALTIME
#define SUNMOV uSunPosition
#else
#define SUNMOV sin(iTime*0.1)
#endif

vec4 ProceduralSkybox(vec3 ro, vec3 rd){
  vec3 _WorldSpaceLightPos0 = vec3(2, SUNMOV * 20.0 + 1.0, 20);
  vec3 kSkyTintInGammaSpace = _SkyTint;
  vec3 kScatteringWavelength = mix(ScatteringWavelength - ScatteringWavelengthRange, ScatteringWavelength + ScatteringWavelengthRange, vec3(1.) - kSkyTintInGammaSpace);
  vec3 kInvWavelength = 1.0 / (pow(kScatteringWavelength, vec3(4.0)));
  float kKrESun = kRAYLEIGH * kSUN_BRIGHTNESS;
  float kKr4PI = kRAYLEIGH * 4.0 * 3.14159265;
  vec3 cameraPos = vec3(0, kInnerRadius + kCameraHeight, 0);
  vec3 eyeRay = rd;
  float far = 0.0;
  vec3 cIn, cOut;
  if(eyeRay.y >= 0.0){
      far = sqrt(kOuterRadius2 + kInnerRadius2 * eyeRay.y * eyeRay.y - kInnerRadius2) - kInnerRadius * eyeRay.y;
      vec3 pos = cameraPos + far * eyeRay;
      float height = kInnerRadius + kCameraHeight;
      float depth = exp(kScaleOverScaleDepth * (-kCameraHeight));
      float startAngle = dot(eyeRay, cameraPos) / height;
      float startOffset = depth * Scale(startAngle);
      float sampleLength = far / kSamples;
      float scaledLength = sampleLength * kScale;
      vec3 sampleRay = eyeRay * sampleLength;
      vec3 samplePoint = cameraPos + sampleRay * 0.5;
      vec3 frontColor = vec3(0.0);
    for (int i = 0; i < 2; i++){
      float height = length(samplePoint);
      float depth = exp(kScaleOverScaleDepth * (kInnerRadius - height));
      float lightAngle = dot(normalize(_WorldSpaceLightPos0.xyz), samplePoint) / height;
      float cameraAngle = dot(eyeRay, samplePoint) / height;
      float scatter = (startOffset + depth*(Scale(lightAngle) - Scale(cameraAngle)));
      vec3 attenuate = exp(-clamp(scatter, 0.0, kMAX_SCATTER) * (kInvWavelength * kKr4PI + kKm4PI));
      frontColor += attenuate * (depth * scaledLength);
      samplePoint += sampleRay;
    }
    cIn = frontColor * (kInvWavelength * kKrESun);
    cOut = frontColor * kKmESun;
  } else {
    far = (-kCameraHeight) / (min(-0.001, eyeRay.y));
    vec3 pos = cameraPos + far * eyeRay;
    float cameraScale = Scale(dot(-eyeRay, pos));
    float lightScale = Scale(dot(normalize(_WorldSpaceLightPos0.xyz), pos));
    float sampleLength = far / kSamples;
    float scaledLength = sampleLength * kScale;
    vec3 sampleRay = eyeRay * sampleLength;
    vec3 samplePoint = cameraPos + sampleRay * 0.5;
    vec3 frontColor = vec3(0.0);            
    float height = length(samplePoint);
    float d = exp(kScaleOverScaleDepth * (kInnerRadius - height));
    float scatter = d*(lightScale + cameraScale) - exp((-kCameraHeight) * (1.0/kScaleDepth))*cameraScale;
    vec3 attenuate = exp(-clamp(scatter, 0.0, kMAX_SCATTER) * (kInvWavelength * kKr4PI + kKm4PI));
    frontColor += attenuate * (d * scaledLength);
    samplePoint += sampleRay;
    cIn = frontColor * (kInvWavelength * kKrESun + kKmESun);
    cOut = clamp(attenuate, 0.0, 1.0);
  }
  vec3 groundColor = _Exposure * (cIn + _GroundColor*_GroundColor * cOut);
  vec3 skyColor = _Exposure * (cIn * (0.75 + 0.75 * dot(normalize(_WorldSpaceLightPos0.xyz), -eyeRay) * dot(normalize(_WorldSpaceLightPos0.xyz), -eyeRay))); 
  float lightColorIntensity = clamp(length(_LightColor0.xyz), 0.25, 1.0);
  vec3 sunColor = kHDSundiskIntensityFactor * clamp(cOut,0.0,1.0) * _LightColor0.xyz / lightColorIntensity;	    
  vec3 ray = -rd;
  float y = ray.y / SKY_GROUND_THRESHOLD;
  vec3 color = mix(skyColor, groundColor, clamp(y,0.0,1.0));
  if(y < 0.0)
    color += sunColor * SunAttenuation(normalize(_WorldSpaceLightPos0.xyz), -ray);
  return vec4(sqrt(color),1.0);      
}

float sphere( vec3 p, vec3 c,float s ){
  return length(p-c)-s;
}

float box (vec3 p, vec3 c, vec3 s){
  float x = max(p.x - c.x - s.x, c.x - p.x - s.x);
  float y = max(p.y - c.y - s.y, c.y - p.y - s.y);   
  float z = max(p.z - c.z - s.z, c.z - p.z - s.z);
  return max(max(x,y),z);
}

float map (vec3 p){
  float a = box(p, vec3(0.0), vec3(1000.0));
  float b = sphere(p, vec3(0.0), 300.0);
  return max(-b,a);
}

vec4 raymarch (vec3 ro, vec3 rd){
  for (int i = 0; i < 16; i++){
    float t = map(ro);
    if (t < 0.001)
      return ProceduralSkybox(ro, rd);     
    ro += t * rd;
  }
  return vec4(0, 0, 0, 1);
}

//////////////////////////////////////////////////////////////////////////////////////////////

// const float sharpness = 0.001;

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
  float r=0., s=1., w=1.;
  for (int i = 0; i < 6; i++) {
    s *= 2.0;
    w *= 0.5;
    r += w * noise(s*x);
  }
  return r;
}

float mountain(vec2 uv, float scale, float offset, float h1, float h2, float sharpness){
  float h = h1 + perlin(scale * uv.x + offset) * (h2 - h1);
  return smoothstep(h, h + sharpness, uv.y);
}

vec4 desaturate(vec4 color, float amount){
  vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color.xyz));
  return vec4(mix(color.xyz, gray, amount),color.w);
}


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

float starfield(vec2 uv){
  
  // modifies the number of stars that are visible
  float stars_threshold = 8.0;

  // modifies the overall strength of the stars
  float stars_exposure = 20.0;

  vec3 stars_direction = normalize(vec3(uv * 2.0 - 1.0, 1.0)); // could be view vector for example
	float stars = pow(clamp(starnoise(stars_direction * 200.0), 0.0, 1.0), stars_threshold) * stars_exposure;
	stars *= mix(0.4, 1.4, starnoise(stars_direction * 100.0 + vec3(iTime))); // time based flickering
  
  return stars;
}

const float hPos = 0.13;
const float hMnt = 0.03;

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  vec2 uv = (4. * fragCoord.xy - iResolution.xy) / iResolution.y;
  vec2 uv2 = fragCoord.xy/iResolution.xy - vec2(0., .05);

  vec3 ro = vec3 (0.);
  vec3 rd = normalize(vec3(uv, 2.0));
  vec4 color = nightColor;
  vec4 ray = raymarch(ro, rd);
  ray = desaturate(ray, smoothstep(0.9, 1.0, uClouds));
  color += ray;

#if MOUNTAINS
  float m = 0.;
  float sharpness = 0.001 + smoothstep(0.9,1.0, uHumidity) * 0.005;
  float s = max(SUNMOV, 0.0);
  vec3 tone = vec3(s * (0.15 + uHumidity * 0.2));
  vec3 fade = vec3(s * (0.2 + uHumidity * uHumidity * 0.1));
  for(float i = 0.; i < 4.; i += 1.)
    m += mix(.67, mountain(uv2, 1. +  i, 7. * i + 5., hMnt + i * 0.17, hPos, sharpness), 0.5 + 0.448 * i);
  if (m < 0.999)
    color = vec4(mix(fade * 0.5, 1.5 * tone, m), 1.);
#endif

#if STARS
  if (SUNMOV < -0.0 && uClouds < 0.8 && uv2.y > 0.3)
    color += vec4(vec3(smoothstep(0.0, -0.18, SUNMOV) * uv.y * starfield(uv2)), 1.);
#endif

fragColor = color;  
}
`;