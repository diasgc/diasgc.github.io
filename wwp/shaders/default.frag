#pragma optimize(on)
#pragma debug(off)

#define MOUNTAINS 1
#define STARS 1
#define CLOUDS 1
#define WEATHER 1
#define DEF_LAMBDA 0

#define SHADERTOY 0
#define DEMO 0
#define DEMO_SPEED 0.1

#undef fast
#undef fastRayleigh
#undef fastMie
#undef fastRefractiveIndex
#undef fastMolsPerVolume

#if WEATHER == 0
 #undef  CLOUDS
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

// (Inverse) Relative Air Mass Models 1.0/ram
// https://github.com/pvlib/pvlib-python/blob/main/pvlib/atmosphere.py
#define ram_simple(c,d)          c
#define ram_kastenyoung1989(c,d) c + 0.50572 * pow(96.07995 - d, -1.6364)
#define ram_kasten1966(c,d)      c + 0.15 * pow(93.885 - d, -1.253 )
#define ram_pickering2002(c,d)   sin(radians(90.0 - d + 244.0 / pow(165.0 + 47.0 * (90.0 - d), 1.1)))
#define ram_youngirvine1967(c,d) c / (1.0 - 0.0012 * (pow(c, -2.0) - 1.0))
#define ram_young1994(c,d)       (pow(c, 3.0) + 0.149864 * pow(c, 2.0) + 0.0102963 * c + 0.000303978) / (1.002432 * pow(c, 2.0) + 0.148386 * c + 0.0096467)
#define ram_gueymard1993(c,d)    c + 0.00176759 * (d) * pow(94.37515 - d, -1.21563)
#define ram_gueymard2003(c,d)    c + 0.48353 * pow(d, 0.095846) * pow(96.741 - d, -1.754)

#define ra_model(c,d)            ram_young1994(c,d)

const vec3 nightColor = vec3( 0.0, 0.002, 0.07) * 0.32; // vec3(0.0,0.001,0.0025) * 0.3

// utilities
#define clip(x)       clamp(x, 0., 1.)
#define rand(x)       fract(sin(x) * 75154.32912)
#define R11(x)        fract(sin(x) * 43758.5453)
#define ACESFilmic(x) (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)

// environment variables
#if SHADERTOY
 #define temperature  273.0
 #define humidity     0.5
 #define clouds       0.9
 #define cloudLow     0.9
 #define moon         0.5
 #define rain         0.0
 #define wind         10.0
#else
 // uniforms
 uniform vec2         iResolution;
 uniform float        iTime;
 uniform vec3         iMouse;
 uniform float        uSunPosition;
 uniform float        uClouds;
 uniform float        uCloudLow;
 uniform float        uHumidity;
 uniform float        uMoon;
 uniform float        uRain;
 uniform float        uTemperature;
 uniform float        uWind;
 // alias
 #define sunElev      uSunPosition
 #define humidity     uHumidity
 #define clouds       uClouds
 #define cloudLow     uCloudLow
 #define moon         uMoon
 #define rain         uRain
 #define temperature  uTemperature
 #define wind         uWind
#endif

#define altitude      0.0
#define pressure      1018.0
#define opacity       1.0
#define izoom         1.2

// constants
const float pi_2      = acos(0.0);
const float pi        = pi_2 * 2.0;
const float pi2       = pi * 2.0;
const float pi316     = 3.0 / (16.0 * pi);
const float pi34      = 3.0 / (4.0 * pi);
const float pi383     = 8.0 / 3.0 * pow( pi, 3. );
const float pi14      = 1.0 / (4.0 * pi);
const float asec2r    = pi / 648000.0;
const float rad2deg   = 180.0 / pi;

const vec3 zenDir     = vec3( 0.0, 1.0, 0.0 );


const struct Sun {
  float arc;    // 66 arc seconds -> degrees, and the cosine of that
  float dim;
  float exd;
  float extPow; // Sun extinction power def 0.5
  float istep;  // inverse of sun intensity steepness: (def: 0.66 = 1./1.5)
  float imax;
  float imin;
  float cutoff; // earth shadow hack, nautical twilight dark at -12º (def: pi/1.95)
  vec3  color;
} sun = Sun( cos(asec2r * 3840.), 2E-5, 0.5E5, 0.5, 0.66, 1000., 900., pi / 1.83, vec3( 0.5 ) );

float sunIntensity(float angle, float refraction) {
  return mix(sun.imax, sun.imin, clouds) * max(0., 1. - exp( -sun.istep * ( sun.cutoff - acos(angle) + refraction )));
}

const struct Scattering {
  float zenithR;  // Rayleigh optical length at zenith for molecules
  float zenithM;  // Mie optical length at zenith for molecules
  vec3  primary;  //
  vec3  lambda;   // Lambda constant for rayleigh and mie, def vec3( 680E-9, 550E-9, 450E-9 );
  vec3  l0;
  vec3  V;
  vec3  betaMie;
  float airRefractiveIndex; // refractive index of air (default: 1.0003):
  vec3  fastRayleigh;       // precalculated values - default: vec3 (6.869069761642851E-6, 1.3399870327319272E-5, 3.2714527166306815E-5)
  float fastMolsPerVolume;
  float fastRefractiveIndex;
  float rAtmos;   // Atmosphere radius m 6420e3
  float rEarth;   // Earth radius m 6360e3
} SCAT = Scattering(
  8400.0,
  1250.0,
  vec3(  0.686,  0.678,  0.666 ),
  vec3( 650E-9, 550E-9, 450E-9 ),
  vec3( 650E-9 ),
  vec3( 4.0 - 2.0 ),
  vec3( 1.8399918514433978E-14, 2.7798023919660528E-14, 4.0790479543861094E-14 ),
  1.0003,
  vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 ),
  2.545E25,
  1.0003,
  6420e3,
  6360e3
);

#define rayleighPhase(a)  pi316 * ( 1.0 + a * a )
#define hgPhase(a,g,g2)   pi14 * (( 1.0 - g2 ) / pow( 1.0 - 2.0 * g * a + g2, 1.5 ))

#if DEF_LAMBDA
 #define LAMBDA     SCAT.lambda
 const vec3 BMIE    = 2.726902423E-18 * pow( pi2 / LAMBDA, SCAT.V ) * SCAT.primary;
 const vec3 L4      = pow(LAMBDA, vec3( 4.0 ) );
#else
 #define LAMBDA     mix(SCAT.lambda, SCAT.l0, smoothstep(0.8, 1.0, clouds) * smoothstep(-0.12, 0.12, sunElev))
 // calc: 10E-18 * 0.434 * ( 0.2 * T ) * pi * pow( 2*pi / LAMBDA, V ) * MIE_K
 #define BMIE       2.726902423E-18 * pow( pi2 / LAMBDA, SCAT.V ) * SCAT.primary
 #define L4         pow(LAMBDA, vec3( 4.0 ) )
#endif


// Mie scaytering for large particles
#ifdef fastMie
 #define getBetaMie(T) SCAT.betaMie
#else
 #define getBetaMie(T) T * BMIE
#endif

#ifdef fastRefractiveIndex
 #define airRefractiveIndex(kelvin, Pmbar, rHum) SCAT.fastRefractiveIndex
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
  float Nr = (77.6 * P - e * (5.6  + 3.75E5 / kelvin)) / kelvin;
  // refractive index of air (default: 1.0003):
  return 1.0 + Nr * 1E-6 * exp( -altitude / SCAT.zenithR );
 }
#endif

#ifdef fastMolsPerVolume
 #define molsPerVolume(Pmbar,kelvin) SCAT.fastMolsPerVolume
#else
 // Boltzmann constant
 const float KB = 1.3806488E-23;
 #define molsPerVolume(Pmbar,kelvin) 100.0 * Pmbar / (KB * kelvin)
#endif


//Rayleigh scattering for small particles
#ifdef fastRayleigh
 #define getBetaRayleigh(r, Tk, Pmbar, H ) SCAT.fastRayleigh
#else
 // depolarization factor (default: 0.0035) 0.0279
 const float def_pn = 0.0279;
 const float def_kpn = (6.0 + 3.0 * def_pn)/( 6.0 - 7.0 * def_pn );

 // (8*pi³*(n²-1)²*(6+3pn)) / (3N * pow(lambda, vec3(4.0))*(6-7pn))
 vec3 getBetaRayleigh( float rayleigh, float Tk, float P, float H ){
  float n = pow( pow( airRefractiveIndex(Tk, P, H), 2.) - 1., 2.);
  float N = molsPerVolume(P,Tk);  
  return pi383 * n * def_kpn / ( N * L4);
 }
#endif




// Mountains (https://www.shadertoy.com/view/fsdGWf)

const struct Mountains {
  vec3  shade;
  int   steps;
  float height;
  float offset;
} MOUNTS = Mountains(vec3(1.13, 1.04, 1.1), 10, 1.2, 0.08);

float N11(float x){
    float i = floor(x);
    float f = fract(x);
    return mix(R11(i), R11(i + 1.0), f);
}

float perlin(float x){
  float p = 0.0, freq = 1.0, amp = 1.0;
  for (int i = 0; i < MOUNTS.steps; i++) {
    freq *= 2.0;
    amp *= 0.5;
    p += amp * N11(freq * x);
  }
  return p;
}

float mountain(vec2 uv, float scale, float offset, float h1, float h2, float s){
  float h = h1 + perlin(MOUNTS.height * scale * uv.x + offset) * (h2 - h1);
  return 1. - smoothstep(h, h + s, uv.y - MOUNTS.offset);
}

float renderMountains(vec2 uv, float h){
  float m = 0.;
  //float s = max(sunElev, 0.0);
  float ss = 0.001 + smoothstep(0.9, 1.0, h) * 0.008;
  m  = mountain(uv, 2.0, 7., -0.005, -0.07, ss * 1.5); // back
  m += max(m, mountain(uv, 1.2, 9., 0.035, -0.10, ss));
  m += max(m, mountain(uv, 1.7, 11., 0.105, -0.10, ss));
  m += max(m, mountain(uv, 2.5, 16., 0.175, -0.10, ss * 1.5)); // front
  return m * (1. - ss * uv.y * 500.);
}

/*
float mountain2(vec2 u, in vec3 sky){
  u /= iResolution.y;
  float o = 0.;
  float s = length(sky);
  float d = 1.0, x = 0.0, a = 0.0, f = 0.0, l = 3.0;
  for(float i = 0.0; i < 1.0; i += 0.1){
      x = u.x / d + 71.0 * i;
      for(float b = 0.5; b > 0.001; b = b * 0.5){
          f = fract(x);
          a += mix(fract((x - f) * 0.37), fract((x - f + 1.0) * 0.37), f) * b;
          x *= 2.5;
      }
      if(u.y < d * a + i - 0.2)
        l = i + .9;
      if (l < 2.)
        break;
      d *= 0.9;
      o = s * l;
  }
  return o;
}
*/

const vec2 I = vec2(0.0, 1.0);

// Starfield#2 (based on https://www.shadertoy.com/view/fsSfD3)

const float phi = 1.61803398874989484820459;

float R121(vec2 co, float s){
  return fract(tan(distance(co * phi, co) * s) * co.x);
}

vec2 H21(float s){
  return vec2( R121(vec2(243.234, 63.834), s) - 0.5, R121(vec2(53.1434, 13.1234), s) - 0.5);
}

float LS2(vec2 uv, vec2 ofs, float b, float l) {
  float len = length(uv - ofs);
  return smoothstep(0.0, 1000.0, b * max(0.1, l) / pow(max(1E-13, len), 1.0 / max(0.1, l)));
}
  
vec3 renderStarfield(vec2 uv, float sunpos, float clds) {
  if (sunpos > -0.12 || clds > 0.5)
    return vec3(0.);
  vec3 col = vec3(0.0);
  float lim = min(-sunpos * 100.0, 50.0);
  float intens = 0.02 + 0.02 * clds;
  for (float i = 0.0; i < 50.0; i += 1.0) {
    vec2 ofs = H21(i + 1.0) * vec2(1.8, 1.1);
    float r = (mod(i, 10.0) == 0.0) ? 0.5 + abs(sin(i / 50.0)) : 0.25;
    float l = 1.0 + intens * (sin(fract(iTime) * 0.5 * i) + 1.0);
    col += vec3(LS2(0.5 - uv, ofs, r, l));
    if (i > lim)
      break;
  }
  return col;
}    

// Clouds (https://www.shadertoy.com/view/Xs23zX)

const struct Clouds {
  float steps;
  float scale;
  float intensity;
  float smooth;
  float speed;
} CLDS = Clouds( 4., 0.01, 2., 0.23, 0.005);

float H12(vec2 p) {
  return fract(sin(p.x * 100. + p.y * 7446.) * 8345.);
}

//#define H12(p) fract(sin(p.x * 100. + p.y * 7446.) * 8345.)

float N12(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(H12(i       ), H12(i + I.yx), f.x),
    mix(H12(i + I.xy), H12(i + I.yy), f.x),
    f.y);
}

vec3 renderClouds(vec2 uv, float sunpos, float h, float c){
  float r = 0.;
  float pw = .5 * c;
  float a = -iTime * CLDS.speed * wind;
  float b = CLDS.smooth * h;
  vec2 uv2 = (1. - c * uv);
  float accum = 1.0;
  for(float i = 1.0; i < CLDS.steps; i += 1.0) {
    accum *= b; // Avoid pow() inside loop
    r += N12(a - uv2 * (1.0 + uv2.y * (i + pw))) * accum;
  }
  return vec3( r * c * (CLDS.intensity - h * 0.5) * mix(0.25, 0.5, sunpos));
}

vec3 rclouds(vec2 uv, float cosGamma, vec3 hum, float windd){
  float r = 0.;
  float pw = 2. * hum.y;
  float a = -iTime * CLDS.speed * windd;
  float b = CLDS.smooth * hum.y;
  vec2 uv2 = (1. - hum.y * hum.x * uv);
  float accum = 1.0;
  for(float i = 1.0; i < CLDS.steps; i += 1.0) {
    accum *= b; // Avoid pow() inside loop
    r += N12(a - uv2 * (1.0 + uv2.y * (i + pw))) * accum;
  }
  return vec3( r * hum.y * (CLDS.intensity - hum.y * 0.5) * (0.2 + 0.8 * step(cosGamma, 0.0)));
}






struct AtmCond {
  float hum;
  float clow;
  float clouds;
};

#if SHADERTOY || DEMO
  #define SUN_ELEV iMouse.z > 0. ? iMouse.y/iResolution.y : sin( iTime * DEMO_SPEED)
#else
  #define SUN_ELEV sunElev
#endif

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  float ar        = 1.;//iResolution.y/iResolution.x;
  vec2  uv        = fragCoord/iResolution.xy;
  vec3  pos       = vec3(izoom * uv * ar - vec2(0.0, izoom/25.0), 0.0);
  vec3  sunPos    = vec3( 0. , SUN_ELEV, -1.0);
  vec3  sunDir    = normalize( sunPos );
  vec3  camPos    = vec3( sunDir.x, 0.0, sunDir.z);
  vec3  direction = normalize( pos - camPos );
  float cosGamma  = dot( sunDir, zenDir ); // 0 at horizon, 1 at zenith
  float cosZenith = dot( zenDir, direction );
  float cosTheta  = dot( sunDir, direction );
  float angZenith = acos( clip(cosZenith) ); // horizon cutoff
  
  // refraction at horizon hack: todo

#if WEATHER
  // empirical values for global humidity turbidity
  // AtmCond atm = AtmCond(humidity, cloudLow, clouds);
  vec3  vhum       = vec3(humidity, cloudLow, clouds);
  vec3  phum       = pow(vhum, vec3(3.));
  // empiric Rayleigh + Mie coeffs from environment variables
  float rayleigh   = 0.5 + exp(0.15 / (pow(cosGamma, 2.0) + 0.1) - altitude * 1E-9);
  // atmLen(cosGamma = 0) = sqrt(a2 +2aR), a = atm len, R = earth radius
  float turbidity  = 1.0 + 10. *  vhum.x * vhum.y;
  float mieCoeff   = 0.00335;
  float refraction = 0.0035;
#else
  vec3  vhum       = vec3(0.0);
  vec3  phum       = vec3(0.0);
  float rayleigh   = 1.0;
  float turbidity  = 0.7;
  float mieCoeff   = 0.00335;
  float refraction = 0.0035;
#endif
  
  float sunEx = sunIntensity( cosGamma, refraction );
  float sunFd = 1.0 - clip( 1.0 - exp( cosGamma ));
  float rayleighCoeff = rayleigh + sunFd - 1.0;
  
  // extinction (absorbtion + out scattering)
  vec3 vBetaR = getBetaRayleigh( rayleigh, temperature, pressure, vhum.x ) * rayleighCoeff;
  vec3 vBetaM = getBetaMie( turbidity ) * mieCoeff;

  // Mie directional, asymmetry parameter g def float g = 0.8
  // https://www.tandfonline.com/doi/full/10.1080/02786826.2023.2186214#d1e188
  float g  = 0.8;
  float g2 = g * g;
  
 
  // combined extinction factor
  // Relative Air Mass
  // see https://github.com/pvlib/pvlib-python/blob/main/pvlib/atmosphere.py for more models
  float raModel   = ra_model(cosZenith, degrees(angZenith));
  float relAm     = 1.0 / mix(raModel, vhum.z, vhum.z);
  
  vec3  Fex       = exp( -relAm * ( vBetaR * SCAT.zenithR + vBetaM * SCAT.zenithM ) );
  
  // in scattering
  float rPhase    = rayleighPhase( cosTheta );
  float mPhase    = hgPhase( cosTheta, g, g2 );
  vec3  betaTotal = ( vBetaR * rPhase + vBetaM * mPhase ) / ( vBetaR + vBetaM );

  vec3 L = pow( sunEx * betaTotal * ( 1.0 - Fex ), vec3( 1.5) ); // zenith
  vec3 B = pow( sunEx * betaTotal * Fex , vec3( 0.5 ) ); // horizon
  vec3 L0 = (1. - phum.z) * vec3(0.1 * Fex);

  vec3 night = nightColor * (1. - cosGamma) * (1.0 + sin(pi * moon * (1. - phum.z)));
  vec3 light = sun.color + night;
  
  
#if MOUNTAINS
  float m = renderMountains(uv, vhum.x * vhum.y);
  //float m = mountain2(uv,L);
#else
  float m = 0.;
#endif

  // sun disk
  float sundisk  = cosGamma * smoothstep( sun.arc, sun.arc + sun.dim, cosTheta);
  float overcast = step(phum.z, 0.5);
  L0 += mix(0.0, sundisk, overcast * step(m, 0.0));
#if DEF_LAMBDA
  // clouds will desaturate
  L = mix(L, vec3(length(L)), overcast);
#endif

#if CLOUDS
  vec3 clds = renderClouds(uv, cosGamma, vhum.x + vhum.y, vhum.z + vhum.y);
  //vec3 clds = rclouds(uv, cosGamma, vhum, wind);
#else
  vec3 clds = vec3(0.);
#endif
  night += pow(clds, vec3(1.5));
  
  // the horizon line
  L *= mix( light, B , clip(pow(1.0 - cosGamma, 5.0)));
  float sk = 1.2 / ( 1.2 + 1.2 * sunFd );
  float k = 0.04;

  vec3 sky = pow((L + L0) * k, vec3(sk));

  // acesfilmic color filter, sky only
  sky = ACESFilmic(sky);
  // add moonlight according to moon phase (do not apply acesfilmic)
  sky += night;

#if STARS
  sky += renderStarfield(uv, sunPos.y, phum.z);
#endif
  

  if (m > 0.0) {
    float s = smoothstep(0.01, 0.1, cosGamma) * length(sky) * vhum.y * 0.5;
    vec3 shade = mix(MOUNTS.shade, light * s, vhum.y);
    vec3 fade = 0.5 * shade;
    vec3 tone = shade;
    sky = s * mix(sky, mix(tone, fade, m), m * phum.y * (1. - vhum.x) * cosGamma);
  }

  if (phum.y > 0.5){
    float sc = smoothstep( 0.0, 0.8, uv.y * cosGamma);
    float hazeD = 1. - 0.5 * phum.x * phum.y * sc;
    float hazeE = (1. - hazeD) * sc;
    sky = sky * hazeD;
    sky += (hazeE + phum.y * clds * uv.y);
  }

  fragColor = vec4( sky, 1.0);
}