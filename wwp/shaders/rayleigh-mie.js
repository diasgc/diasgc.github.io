const frag=`#pragma optimize(on)
#pragma debug(off)

#define MOUNTAINS 1
#define STARS 1
#define CLOUDS 1
#define WEATHER 1

#define SHADERTOY 0
#define DEMO 1
#define DEMO_SPEED 0.1

#undef fast
#undef fastRayleigh
#undef fastMie
#undef fastRefractiveIndex
#undef fastMolsPerVolume

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
uniform float       uHumidity;
uniform float       uMoon;
uniform float       uRain;
uniform float       uTemperature;
// alias
#define humidity    uHumidity
#define clouds      uClouds
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

// earth shadow hack, nautical twilight dark at -12º (def: pi/1.95)
const float kCutoffAngle = pi / 1.766;

// inverse of sun intensity stepness: (def: 0.66 = 1./1.5)
const float kSunIStep = .66;
const float kSunI = 400.0;

// Sun fade max (1.0)
const float kSunMax = 1.0;

// Sun fade factor (0.2) lower values increase contrast
const float kSunFade = 0.2;

// 66 arc seconds -> degrees, and the cosine of that
const float kSunArc = 0.999956676; //cos( arcsec2rad * 3840. );
const float kSunDim = 2e-5;

// a = angle, r = refraction
#define sunIntensity(a, r) kSunI * (1. - exp( -kSunIStep * ( kCutoffAngle - acos(clamp(a,-1.,1.)) + r ) ))

const vec3 zenDir = vec3 ( 0.0, 1.5, 0.0 );
vec3 cameraPos = vec3( 1.0, 0.0, 1.5 );

// constants for atmospheric scattering
// optical length at zenith for molecules
const float zenithR = 8400.0;
const float zenithM = 1250.0;

// Sun extinction power def 0.5
const vec3  kSunExPow = vec3( 0.5 );

const float kMoonFade = 2.0;
const vec3  kColorSun = vec3(1.0);
const vec3  kColorNight = vec3(0.04, 0.034, 0.09) * 0.5;

#define rayleighPhase(a)    pi316 * ( 1.0 + a * a )
#define hgPhase( a, g, g2 ) pi14 * (( 1.0 - g2 ) / pow( 1.0 - 2.0 * g * a + g2, 1.5 ))

// Lambda constant for rayleigh and mie, def vec3( 680E-9, 550E-9, 450E-9 );
const vec3 LAMBDA = vec3( 650E-9, 550E-9, 450E-9 );

// Mie scaytering for large particles
#ifdef fastMie
// precalculated values
#define getBetaMie(T) vec3( 1.8399918514433978E-14, 2.7798023919660528E-14, 4.0790479543861094E-14 )
#else
// calc: 10E-18 * 0.434 * ( 0.2 * T ) * pi * pow( ( 2. * pi ) / LAMBDA, V ) * MIE_K
// K coefficient for the primaries
const vec3 kMie = vec3( 0.686, 0.678, 0.666 );
const vec3 V = vec3( 4.0 - 2.0 );
#define getBetaMie(T) 2.726902423E-18 * T * pow( ( 2. * pi ) / LAMBDA, V ) * kMie
#endif 

#ifdef fastRefractiveIndex
#define airRefractiveIndex(Tk, Pmbar, rHum) 1.0003
#else

// Appendix B:  Simple Shop-floor Formula for Refractive Index of Air
// https://emtoolbox.nist.gov/Wavelength/Documentation.asp#AppendixB
#define airRefractiveIndex(Tk, Pmbar, relH) 1.0 + 7.86e-5 * Pmbar / Tk - 1.5e-11 * relH * (pow(Tk - 273.15, 2.0) + 160.0)
#endif

#ifdef fastMolsPerVolume
#define molsPerVolume(P,Tk) 2.545E25
#else
// Boltzmann constant
const float KB = 1.3806488e-23;
#define molsPerVolume(P,Tk) 100.0 * P / (KB * Tk)
#endif

#if 0
float airRefractiveIndex(float Tk, float P, float H){
  float t = Tk - 273.15;
  float e = H * ( 1. + 1e-4 * (7.2 + P * (0.00320 + 5.9e-7 * t * t))) * 6.1121 * exp( ( 18.678 - t / 234.5 ) * t / (t + 257.14));
  float Nr = (77.6 * P - e * (5.6  + 3.75e5 / Tk)) / Tk;
  // refractive index of air (default: 1.0003):
  return 1.0 + Nr * 1e-6 * exp( -altitude / zenithR );
}
#endif

//Rayleigh scattering for small particles
#ifdef fastRayleigh
// precalculated values - default: vec3 (6.869069761642851E-6, 1.3399870327319272E-5, 3.2714527166306815E-5)
#define getBetaRayleigh(r, Tk, P, H ) vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 )
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
#define MOUNTAIN_STEPS 10
#define MOUNTAIN_YSIZE 1.2
#define MOUNTAIN_YOFFS 0.08

float noise(float x){
    float i = floor(x);
    float a = rand(i), b = rand(i + 1.);
    float f = x - i;
    return mix(a, b, f);
}

float perlin(float x){
  float r=0., s=1., w=1.;
  for (int i = 0; i < MOUNTAIN_STEPS; i++) {
    s *= 2.0;
    w *= 0.5;
    r += w * noise(s*x);
  }
  return r;
}

float mountain(vec2 uv, float scale, float offset, float h1, float h2, float s){
  float h = h1 + perlin(MOUNTAIN_YSIZE * scale * uv.x + offset) * (h2 - h1);
  return smoothstep(h, h + s, uv.y - MOUNTAIN_YOFFS);
}

// Starfield (https://www.shadertoy.com/view/NtsBzB)

vec3 hash(vec3 p) {
    p = fract(p * vec3(127.1, 311.7, 74.7));
    p += dot(p, p.yzx + 19.19);
    return fract(sin(p) * 43758.5453123);
}

float noise2(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(
            mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
                dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)),
                u.x),
            mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
                dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)),
                u.x),
            u.y),
        mix(
            mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
                dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)),
                u.x),
            mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
                dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)),
                u.x),
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
  float stars = pow(clamp(noise2(dir * 200.0), 0.0, 1.0), thres) * expos;
  stars *= mix(0.4, 1.4, noise2(dir * 100.0 + vec3(iTime)));
  return vec3( stars * fade );
}

// Starfield#2 (https://www.shadertoy.com/view/fsSfD3) (why AI 4s23Rt)

#define R12(co,s) fract(tan(distance(co * 1.61803398875, co) * s) * co.x)

#define H12(s) vec2(R12(vec2(243.234, 63.834), s) - 0.5, R12(vec2(53.1434, 13.1234), s) - 0.5)

float LS2(vec2 uv, vec2 ofs, float b, float l) {
  float len = length(uv - ofs);
  return smoothstep(0.0, 1000.0, b * max(0.1, l) / pow(max(1e-13, len), 1.0 / max(0.1, l)));
}
  
vec3 sf2(vec2 uv, float sunpos, float clds) {
  if (sunpos > -0.12 || clds > 0.9)
    return vec3(0.);
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 50.0; i++) {
    vec2 ofs = H12(i + 1.0) * vec2(1.8, 1.1);
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

float N21(vec2 p) {
    return fract(sin(p.x*100.+p.y*7446.)*8345.);
}

float SS(vec2 uv) {
    vec2 lv = fract(uv);
    lv = lv * lv * (3.0 - 2.0 * lv);
    vec2 id = floor(uv);
    
    float bl = N21(id);
    float br = N21(id + vec2(1., 0.));
    float b = mix(bl, br, lv.x);

    float tl = N21(id + vec2(0., 1.));
    float tr = N21(id + vec2(1., 1.));
    float t = mix(tl, tr, lv.x);

    return mix(b, t, lv.y);
}
  
vec3 renderClouds(vec2 uv, float sunpos, float humidity, float clouds){
  float c = 0.;
  for(float i = 1.; i < CLOUD_STEPS; i+=1.) {
    c += SS(-iTime * CLOUD_SPEED + uv * pow(1.0 + (uv.y + humidity), i + .7 * clouds)) * pow(CLOUD_SMOOTH, i);
  }
  return vec3( c * CLOUD_INTENSITY );
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
  vec3 sunPos = vec3( 0.5, y, -1.5 );

  vec3 sunDir = normalize( sunPos );
  vec3 cameraPos = vec3( sunPos.x, 0.0, -sunPos.z);
  float cosGamma  = dot( sunDir, zenDir ); // 0 at horizon, 1 at zenith
  vec3 direction = normalize( pos - cameraPos );
  float cosZenith = dot( zenDir, direction );
  float cosTheta  = dot( sunDir, direction );
  float angZenith = acos( clip(cosZenith) ); // horizon cutoff
  
#if WEATHER
  // empirical values for overall humidity turbidity
  vec3 vHum = vec3(pow(humidity, 3.), 0.0, smoothstep(0.9, 1.0, clouds));
  vHum.y = 1. - vHum.x;
#else
  vec3 vHum = vec3(0.0, 1.0, 0.0);
#endif
  
  
  // refraction at horizon hack: todo
  float refraction = 0.0035;
  
  // empiric Rayleigh + Mie coeffs from environment variables
  float rayleigh  = 1. + exp( -cosGamma * vHum.x - altitude * 1E-9);
  float turbidity = 0.5 + vHum.x;
  float mieCoefficient = 0.005 + clip(0.001 * vHum.x - 0.01 * vHum.z);
  
  float sunEx = sunIntensity( cosGamma, refraction );
  
  float sunFd = 1.0 - clip( 1.0 - exp( cosGamma));
  float rayleighCoefficient = rayleigh + sunFd - 1.0;
  // extinction (absorbtion + out scattering)
  vec3 vBetaR = getBetaRayleigh( rayleigh, temperature, pressure, humidity ) * rayleighCoefficient;
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
  vec3 L = pow( sunEx * betaTotal * ( 1.0 - Fex ), vec3( 1.5 ) );
  vec3 B = pow( sunEx * betaTotal * Fex, vec3( 0.5) );
  vec3 L0 = 0.5 * Fex;
  
  vec3 night = kColorNight * (1.0 + moon * kMoonFade);

  // composition + solar disc
  if (vHum.z < 0.01) {
    float sundisk = smoothstep( kSunArc, kSunArc + kSunDim, cosTheta);
    L0 += sunEx * 1.9e5 * Fex * sundisk;
  } else {
    L = mix(L, vec3(length(L)) * (1. - 0.6 * vHum.z), vHum.z);
#if CLOUDS
    night += renderClouds(uv, sunPos.y, humidity, clouds);
#endif
  }
  
  // the horizon line
  L *= mix( kColorSun, B , clip(pow(1.0 - cosGamma, 5.0)));
  float sk = 1.2 / ( 1.2 + 1.2 * sunFd );
  float k = 0.04;
  
  vec3 sky = pow((L + L0) * k, vec3(sk));
  

#if 0
  // clouds will desaturate
  if (vHum.z > 0.01){
    sky = mix(sky, vec3(length(sky)) * (1. - 0.6 * vHum.z), vHum.z);
    #if CLOUDS
      night += renderClouds(uv, sunPos.y, humidity, clouds);
    #endif
  }
#endif

  // acesfilmic color filter, sky only
  sky = ACESFilmic(sky);
  
  
  // add moonlight according to moon phase (do not apply acesfilmic)
  sky = max(sky, night);


#if STARS
  //sky += starfield(uv, sunPos.y, clouds);
  sky += sf2(uv, sunPos.y, vHum.z);
#endif
  

#if MOUNTAINS
  float m = 0.;
  float hPos = -0.10;
  float hMnt = -0.005;

  float sharpness = 0.001 + smoothstep(0.9, 1.0, vHum.x) * 0.005;
  float s = max(sunPos.y, 0.0);
  vec3 tone = vec3(s * (0.25 + vHum.x * 0.35)) * MOUNTAIN_SHADE;
  vec3 fade = vec3(s * (0.3 + vHum.x * 0.2)) * MOUNTAIN_SHADE;
  for(float i = 0.; i < 4.; i += 1.)
    m += mix(.67, mountain(uv, 1. +  i * 0.5, 6. * i + 7., hMnt + i * 0.12, hPos, sharpness), 0.52 + 0.448 * i);
  if (m < 1.)
    sky = mix(fade * 0.8, 1.2 * tone, m);
#endif

  fragColor = vec4( sky, 1.0);
}`;