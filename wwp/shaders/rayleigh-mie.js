const live = false;
const frag=`#pragma optimize(on)
#pragma debug(off)

#define MOUNTAINS 1
#define STARS 1
#define CLOUDS 1
#define WEATHER 1

#define SHADERTOY 0
#define DEMO ${live ? 1 : 0}
#define DEMO_SPEED 0.1

#undef fast
#undef fastRayleigh
#undef fastMie
#undef fastRefractiveIndex
#undef fastMolsPerVolume

#if WEATHER == 0
#undef CLOUDS
#define CLOUDS 0
#endif

#ifdef  fast
#define fastRayleigh
#define fastMie
#endif

#ifdef fastRayleigh
#define fastRefractiveIndex
#define fastMolsPerVolume
#endif

// utilities
#define clip(x) clamp(x, 0., 1.)
#define rand(x) fract(sin(x) * 75154.32912)
#define ACESFilmic(x) clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0)

// environment variables
#if SHADERTOY
#define temperature 273.0
#define humidity    0.5
#define clouds      0.2
#define moon        0.5
#define rain        0.0
#else
// uniforms
uniform vec2        iResolution;
uniform float       iTime;
uniform vec3        iMouse;
uniform float       uSunPosition;
uniform float       uClouds;
uniform float       uCloudLow;
uniform float       uHumidity;
uniform float       uMoon;
uniform float       uRain;
uniform float       uTemperature;
// alias
#define humidity    uHumidity
#define clouds      uClouds
#define cloudLow    uCloudLow
#define moon        uMoon
#define rain        uRain
#define temperature uTemperature
#endif

#define altitude    0.0
#define pressure    1018.0
#define opacity     1.0
#define izoom       2.0

const float pi = acos(0.0) * 2.0;
const float pi316 = 3.0 / (16.0 * pi);
const float pi14 = 1.0 / (4.0 * pi);
const float arcsec2rad = pi / 648000.0;
const float rad2deg = 180.0 / pi;

const vec3 zenDir = vec3 ( 0.0, 1.0, 0.0 );
const vec3 cameraPos = vec3( 1.0, 0.0, 1.0 );


const float moonFade = 2.0;
const vec3  sunLighColor = vec3(1.0);
const vec3  nightColor = vec3(0.03, 0.034, 0.09) * 0.32;

// inverse of sun intensity steepness: (def: 0.66 = 1./1.5)
const float sunIStep = 0.66;
const float sunImax = 1000.0;
const float sunImin = 300.0;

// earth shadow hack, nautical twilight dark at -12º (def: pi/1.95)
const float sunCutoffAngle = pi / 1.9; //1.766

// 66 arc seconds -> degrees, and the cosine of that
const float kSunArc = 0.999956676; //cos( arcsec2rad * 3840. );
const float kSunDim = 2e-5;

// Sun extinction power def 0.5
const vec3  sunExtinctPow = vec3( 0.5 );

float sunIntensity(float angle, float refraction, float cloudiness) {
  return mix(sunImax, sunImin, cloudiness) * (1. - exp( -sunIStep * ( sunCutoffAngle - acos(clamp(angle,-1.,1.)) + refraction ) ));
}


// constants for atmospheric scattering
// optical length at zenith for molecules
const float zenithR = 8400.0;
const float zenithM = 1250.0;

#define rayleighPhase(a)    pi316 * ( 1.0 + a * a )
#define hgPhase( a, g, g2 ) pi14 * (( 1.0 - g2 ) / pow( 1.0 - 2.0 * g * a + g2, 1.5 ))

// Lambda constant for rayleigh and mie, def vec3( 680E-9, 550E-9, 450E-9 );
const vec3 LAMBDA = vec3( 650E-9, 550E-9, 450E-9 ); // 650e-9
const vec3 L_SCAT = vec3( 0.686, 0.678, 0.666 ); // ?vec3(3.469, 9.288, 21.2);


// Mie scaytering for large particles
#ifdef fastMie
// precalculated values
 #define getBetaMie(T) vec3( 1.8399918514433978E-14, 2.7798023919660528E-14, 4.0790479543861094E-14 )
 #else
 // calc: 10E-18 * 0.434 * ( 0.2 * T ) * pi * pow( ( 2. * pi ) / LAMBDA, V ) * MIE_K
 const vec3 bMie = 2.726902423E-18 * pow( (2.0 * pi) / LAMBDA, vec3( 4.0 - 2.0 ) ) * L_SCAT;
 #define getBetaMie(T) T * bMie
 #endif 

#ifdef fastRefractiveIndex
#define airRefractiveIndex(kelvin, Pmbar, rHum) 1.0003
#else
// Appendix B:  Simple Shop-floor Formula for Refractive Index of Air
// https://emtoolbox.nist.gov/Wavelength/Documentation.asp#AppendixB
// 1. + 7.86e-4 * kPa / kelvin - 1.5e-11 * relH * (kelvin - 273.15)² + 160.0 (1kPa = 10mbar)
float airRefractiveIndex(float kelvin, float Pmbar, float relH) {
  return 1.0 + 7.86e-5 * Pmbar / kelvin - 1.5e-11 * relH * (pow(kelvin - 273.15, 2.0) + 160.0);
}
// full calculation
float airRefractiveIndexFull(float kelvin, float P, float rH){
  float t = kelvin - 273.15;
  float e = rH * ( 1. + 1e-4 * (7.2 + P * (0.00320 + 5.9e-7 * t * t))) * 6.1121 * exp( ( 18.678 - t / 234.5 ) * t / (t + 257.14));
  float Nr = (77.6 * P - e * (5.6  + 3.75e5 / kelvin)) / kelvin;
  // refractive index of air (default: 1.0003):
  return 1.0 + Nr * 1e-6 * exp( -altitude / zenithR );
}
#endif

#ifdef fastMolsPerVolume
#define molsPerVolume(Pmbar,kelvin) 2.545E25
#else
// Boltzmann constant
const float KB = 1.3806488e-23;
#define molsPerVolume(Pmbar,kelvin) 100.0 * Pmbar / (KB * kelvin)
#endif


//Rayleigh scattering for small particles
#ifdef fastRayleigh
// precalculated values - default: vec3 (6.869069761642851E-6, 1.3399870327319272E-5, 3.2714527166306815E-5)
#define getBetaRayleigh(r, Tk, Pmbar, H ) vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 )
#else
// depolarization factor (default: 0.0035) 0.0279
const float def_pn = 0.0279;
const float def_kpn = (6.0 + 3.0 * def_pn)/( 6.0 - 7.0 * def_pn );
const float pi383 = 8.0 / 3.0 * pow( pi, 3. );
const vec3  L4 = pow(LAMBDA, vec3( 4.0 ) );
// (8*pi³*(n²-1)²*(6+3pn)) / (3N * pow(lambda, vec3(4.0))*(6-7pn))
vec3 getBetaRayleigh( float rayleigh, float Tk, float P, float H ){
  float n = pow( pow( airRefractiveIndex(Tk, P, H), 2.) - 1., 2.);
  float N = molsPerVolume(P,Tk);  
  return pi383 * n * def_kpn / ( N * L4);
}
#endif




// Mountains (https://www.shadertoy.com/view/fsdGWf)

#define MOUNTAIN_SHADE vec3(1.13, 1.04, 1.1) // vec3(1.04, 1.13, 1.1)
#define PERLIN_STEPS 10
#define MOUNTAIN_YSIZE 1.2
#define MOUNTAIN_YOFFS 0.08

float R11(float x){
    return fract(sin(x)*43758.5453);
}

float N11(float x){
    float i = floor(x);
    float f = fract(x);
    return mix(R11(i), R11(i + 1.), f);
}

float perlin(float x){
  float p = 0.0, freq = 1.0, amp = 1.0;
  for (int i = 0; i < PERLIN_STEPS; i++) {
    freq *= 2.0;
    amp *= 0.5;
    p += amp * N11(freq * x);
  }
  return p;
}

float mountain(vec2 uv, float scale, float offset, float h1, float h2, float s){
  float h = h1 + perlin(MOUNTAIN_YSIZE * scale * uv.x + offset) * (h2 - h1);
  return 1. - smoothstep(h, h + s, uv.y - MOUNTAIN_YOFFS);
}

float renderMountains(vec2 uv, float sunElev, float hum){
  float m = 0.;
  float s = max(sunElev, 0.0);
  float ss = 0.001 + smoothstep(0.9, 1.0, hum) * 0.009;
  m  = mountain(uv, 1.0, 7., -0.005, -0.10, ss);
  m += max(m, mountain(uv, 1.2, 9., 0.025, -0.10, ss));
  m += max(m, mountain(uv, 1.7, 11., 0.105, -0.10, ss));
  m += max(m, mountain(uv, 2.5, 16., 0.175, -0.10, ss));
  return m * (1. - ss * uv.y * 500.);
}

// Starfield (https://www.shadertoy.com/view/NtsBzB)

vec3 H33(vec3 p) {
    p = fract(p * vec3(127.1, 311.7, 74.7));
    p += dot(p, p.yzx + 19.19);
    return fract((p + p.yzx) * 43758.5453123);
}

float H33_D(vec3 i, vec3 f, vec3 ii) {
  vec3 p = i + ii;
  p = fract(p * vec3(127.1, 311.7, 74.7));
  p += dot(p, p.yzx + 19.19);
  p = fract((p + p.yzx) * 43758.5453123);
  return dot(H33(i + ii), f - ii);
}

const vec2 I = vec2(0.0, 1.0);
#define H33D(i,f,ii) dot(H33(i + ii), f - ii)

float N13(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(
            mix(H33D(i,f,I.xxx), H33D(i,f,I.yxx), u.x),
            mix(H33D(i,f,I.xyx), H33D(i,f,I.yyx), u.x),
            u.y),
        mix(
            mix(H33D(i,f,I.xxy), H33D(i,f,I.yxy), u.x),
            mix(H33D(i,f,I.xyy), H33D(i,f,I.yyy), u.x),

            u.y),
        u.z);
}
        
float N13_old(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(
            mix(dot(H33(i + I.xxx), f - I.xxx),
                dot(H33(i + I.yxx), f - I.yxx), u.x),
            mix(dot(H33(i + I.xyx), f - I.xyx),
                dot(H33(i + I.yyx), f - I.yyx), u.x),
            u.y),
        mix(
            mix(dot(H33(i + I.xxy), f - I.xxy),
                dot(H33(i + I.yxy), f - I.yxy), u.x),
            mix(dot(H33(i + I.xyy), f - I.xyy),
                dot(H33(i + I.yyy), f - I.yyy), u.x),
            u.y),
        u.z);
}

vec3 starfield(vec2 uv, float sunpos, float clds){
  if (sunpos > -0.12 || clds > 0.9)
    return vec3(0.);
  float fade = smoothstep(-0.12, -0.18, sunpos);
  float thres = 6.0 + smoothstep(0.5, 1.0, clds * fade) * 4.;
  float expos = 20.0;
  vec3 dir = normalize(vec3(uv * 2.0 - 1.0, 1.0));
  float stars = pow(clamp(N13(dir * 200.0), 0.0, 1.0), thres) * expos;
  stars *= mix(0.4, 1.4, N13(dir * 100.0 + vec3(iTime)));
  return vec3( stars * fade );
}

// Starfield#2 (https://www.shadertoy.com/view/fsSfD3) (why AI 4s23Rt)

const float phi = 1.61803398874989484820459;
float R121(vec2 co, float s){
  return fract(tan(distance(co * phi, co) * s) * co.x);
}

vec2 H21(float s){
  return vec2( R121(vec2(243.234, 63.834), s) - 0.5, R121(vec2(53.1434, 13.1234), s) - 0.5);
}

float LS2(vec2 uv, vec2 ofs, float b, float l) {
  float len = length(uv - ofs);
  return smoothstep(0.0, 1000.0, b * max(0.1, l) / pow(max(1e-13, len), 1.0 / max(0.1, l)));
}
  
vec3 sf2(vec2 uv, float sunpos, float clds) {
  if (sunpos > -0.12 || clds > 0.5)
    return vec3(0.);
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 50.0; i++) {
    vec2 ofs = H21(i + 1.0) * vec2(1.8, 1.1);
    float r = (mod(i, 10.0) == 0.0) ? 0.5 + abs(sin(i / 50.0)) : 0.25;
    float l = 1.0 + 0.02 * (sin(fract(iTime) * 0.5 * i) + 1.0);
    col += vec3(LS2(0.5 - uv, ofs, r, l));
  }
  return col;
}    

// Clouds (https://www.shadertoy.com/view/Xs23zX)

#define CLOUD_STEPS 8.
#define CLOUD_SCALE 0.001
#define CLOUD_INTENSITY 0.5
#define CLOUD_SMOOTH 0.23
#define CLOUD_SPEED 0.001

float H12(vec2 p) {
    return fract(sin(p.x * 100. + p.y * 7446.) * 8345.);
}

float N12(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(H12(i), H12(i + I.yx), f.x),
      mix(H12(i + I.xy), H12(i + I.yy), f.x),
      f.y);
}
  
vec3 renderClouds(vec2 uv, float sunpos, float humidity, float clouds){
  float c = 0.;
  for(float i = 1.; i < CLOUD_STEPS; i+=1.) {
    c += N12(-iTime * CLOUD_SPEED + uv * pow(1.0 + (uv.y + humidity), i + .7 * clouds)) * pow(CLOUD_SMOOTH, i);
  }
  return vec3( c * clouds * CLOUD_INTENSITY * mix(0.25, 1.5, clip(sunpos)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  float ar = 1.;//iResolution.x/iResolution.y;
  vec2 uv = fragCoord/iResolution.xy;
  vec3 pos = vec3(izoom * uv * ar - vec2(0.0, 0.1), 0.0);

#if SHADERTOY || DEMO
  float y = iMouse.z > 0. ? iMouse.y/iResolution.y : sin( iTime * DEMO_SPEED);
#else
  float y = uSunPosition;
#endif
  vec3 sunPos = vec3( 0.5 , y, -1. );

  vec3 sunDir = normalize( sunPos );
  vec3 cameraPos = vec3( sunPos.x, 0.0, -sunPos.z);
  float cosGamma  = dot( sunDir, zenDir ); // 0 at horizon, 1 at zenith
  vec3 direction = normalize( pos - cameraPos );
  float cosZenith = dot( zenDir, direction );
  float cosTheta  = dot( sunDir, direction );
  float angZenith = acos( clip(cosZenith) ); // horizon cutoff
  
  // refraction at horizon hack: todo
  float refraction = 0.0035;

#if WEATHER
  // empirical values for overall humidity turbidity
  vec3 vHum = pow(vec3(humidity, cloudLow, clouds), vec3(3.));
  // empiric Rayleigh + Mie coeffs from environment variables
  float rayleigh  = 1.0 + exp( -cosGamma - altitude * 1E-9) + length(vHum);
  float turbidity = 1.0 + vHum.x + vHum.y;
  float mieCoefficient = 0.00335 - clip(0.001 * vHum.x - 0.001 * vHum.y);
#else
  vec3 vHum = vec3(0.0);
  float rayleigh  = 1.0;
  float turbidity = 0.7;
  float mieCoefficient = 0.00335;
#endif
  
  
  
  
  
  float sunEx = sunIntensity( cosGamma, refraction, vHum.z );
  
  float sunFd = 1.0 - clip( 1.0 - exp( cosGamma ));  // <---- exp(cosGamma) original
  float rayleighCoefficient = rayleigh + sunFd - 1.0;
  // extinction (absorbtion + out scattering)
  vec3 vBetaR = getBetaRayleigh( rayleigh, temperature, pressure, vHum.x ) * rayleighCoefficient;
  vec3 vBetaM = getBetaMie( turbidity ) * mieCoefficient;

  // Mie directional g def float g = 0.8;
  float g = 0.8 + vHum.x * 0.01;
  float g2 = g * g;
  
 
  // combined extinction factor
  float iq0 = 1.0 - vHum.z * 0.2;
  float Iqbal = iq0 / ( cosZenith + 0.15 * pow( 93.885 - degrees( angZenith ), -1.253 ) );
  vec3 Fex = exp( -Iqbal * ( vBetaR * zenithR + vBetaM * zenithM ) );
  
  // in scattering
  float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
  float mPhase = hgPhase( cosTheta, g, g2 );
  vec3 betaTotal = ( vBetaR * rPhase + vBetaM * mPhase ) / ( vBetaR + vBetaM );
  vec3 L = pow( sunEx * betaTotal * ( 1.0 - Fex ), vec3( 1.0 + cosGamma) ); // zenith
  vec3 B = pow( sunEx * betaTotal * Fex, vec3( 0.5 - cosGamma) ); // horizon
  vec3 L0 = vec3(0.);
  
  vec3 night = nightColor * (1.0 + moon * moonFade);
  vec3 light = sunLighColor * (1.0 - vHum.z * 0.75 - vHum.y * 0.25) + night;

  
  if (vHum.z < 0.01) {
    L0 += 0.5 * Fex;
    // composition + solar disc
    float sundisk = smoothstep( kSunArc, kSunArc + kSunDim, cosTheta);
    L0 += sunEx * 1.9e5 * Fex * sundisk;
  } else {
    // clouds will desaturate
    L = mix(L, vec3(length(L)) * (1. - 0.6 * vHum.z), vHum.z);
#if CLOUDS
    night += renderClouds(uv, sunPos.y, vHum.x, vHum.z);
#endif
  }
  
  // the horizon line
  L *= mix( light, B , clip(pow(1.0 - cosGamma, 5.0)));
  float sk = 1.2 / ( 1.2 + 1.2 * sunFd );
  float k = 0.04;
  
  vec3 sky = pow((L + L0) * k, vec3(sk));

  // acesfilmic color filter, sky only
  sky = ACESFilmic(sky);
  
  
  // add moonlight according to moon phase (do not apply acesfilmic)
  //sky = max(sky, night);
  sky += night;


#if STARS
  sky += sf2(uv, sunPos.y, vHum.z);
#endif
  

#if MOUNTAINS
  float m = renderMountains(uv, sunPos.y, vHum.y);
  if (m > 0.0) {
    float s = clip(sunPos.y);
    vec3 shade = mix(MOUNTAIN_SHADE, light, vHum.y);
    vec3 fade = vec3(s * (0.25 + vHum.y * 0.25)) * shade;
    vec3 tone = vec3(s * (0.35 + vHum.y * 0.35)) * shade;
    sky = mix(0.9 * tone, fade * 1.1, m);
  }
#endif
  float haze = 1. - vHum.y * vHum.x * clamp(cosGamma, 0.1, 0.8); 

  fragColor = vec4( sky * haze, 1.0);
}`;