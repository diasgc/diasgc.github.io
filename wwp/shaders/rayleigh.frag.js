const frag = `
#pragma optimize(on)
#pragma debug(off)

uniform vec2 iResolution;
uniform float iTime;
uniform float uSunPosition;
uniform float uClouds;
uniform float uHumidity;

#define weather
#undef  default_horizonline

#undef fast
#undef fastRayleigh
#undef fastMie
#undef fastRefractiveIndex
#undef fastMolsPerVolume

#ifdef fast
#define fastRayleigh
#define fastMie
#endif

#ifdef fastRayleigh
#undef fastRefractiveIndex
#undef fastMolsPerVolume
#endif

// utilities
#define clip(x) clamp(x, 0., 1.)

//const vec3 sunPosition = vec3( 0.0, 0.5, 0.0 );
const float temperature = 273.0;
const float altitude = 0.0;
const float pressure = 1018.0;
const float humidity = 0.97;
const float clouds = 0.1;
const float rain = 0.0;
const float pi = acos(0.0) * 2.0;
const float pi316 = 3.0 / (16.0 * pi);
const float pi14 = 1.0 / (4.0 * pi);
const float arcsec2rad = pi / 648000.0;
const float rad2deg = 180.0 / pi;
// earth shadow hack, nautical twilight dark at -12º (def: pi/1.95)
const float kCutoffAngle = pi / 1.766;
// inverse of sun intensity steepness: (def: 0.66 = 1./1.5)
const float kSunIStep = 1.0;
const float kSunI = 500.0;
// Sun fade max (1.0)
const float kSunMax = 1.0;

// a = angle, r = refraction
#define sunIntensity(a, r) kSunI * (1. - exp( -kSunIStep * ( kCutoffAngle - acos(clamp(a,-1.,1.)) + r ) ))

const float moon = 0.5;
const float opacity = 1.0;

const vec3 zenithDirection = vec3 ( 0.0, 1.5, 0.0 );
const vec3 cameraPos = vec3( 0.0, 0.0, 1.5 );

// constants for atmospheric scattering
// optical length at zenith for molecules
const float zenithR = 8400.0;
const float zenithM = 1250.0;

// Sun fade factor (0.2) lower values increase contrast
const float kSunFade = 0.33;
// 66 arc seconds -> degrees, and the cosine of that
const float kSunArc = 0.999956676; //cos( arcsec2rad * 3840. );
const float kSunDim = 2e-4;
// Sun extinction power def 0.5
const vec3  kSunExPow = vec3( 0.5 );

const float kMoonFade = 2.0;
const vec3  kColorSun = vec3 (0.5);
const vec3  kColorNight = vec3( 0.0, 0.015, 0.05078125 ); // vec3( 0.0, 1.3e-6, 8e-6 )

#define rayleighPhase(a) pi316 * ( 1.0 + a * a )
#define hgPhase( a, g, g2 ) pi14 * ( ( 1.0 - g2 ) / pow( 1.0 - 2.0 * g * a + g2, 1.5 ) )

// Lambda constant for rayleigh and mie, def vec3( 680E-9, 550E-9, 450E-9 );
const vec3 LAMBDA = vec3( 650E-9, 550E-9, 450E-9 );
// optical lengths for rayleigh and mie
//const float zenithR = 8400.0;
//const float zenithM = 1250.0;

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

vec3 ACESFilm( vec3 x ){
    float tA = 2.51;
    float tB = 0.03;
    float tC = 2.43;
    float tD = 0.59;
    float tE = 0.14;
    return clamp((x*(tA*x+tB))/(x*(tC*x+tD)+tE),0.0,1.0);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  vec2 uv = fragCoord.xy / iResolution.xy; // * vec2(1.0, 0.8) + vec2(0.0, 0.2);
  vec3 vPosition = vec3(uv, 0.0);
  vec3 sunPosition = vec3( 0.5, uSunPosition, 0. );
  vec3 vSunDirection = normalize( sunPosition );
  float cosGamma  = dot( vSunDirection, zenithDirection ); // 0 at horizon, 1 at zenith
  vec3 vVapor = pow( vec3( uHumidity, uClouds, rain ), vec3( 8., 30.0, 1.0 ));
  // refraction at horizon hack: todo
  float refraction = 0.0035;

  // empiric Rayleigh + Mie coeffs from environment variables
  float rayleigh  = 1.0 + exp( -cosGamma * vVapor.x - altitude * 1.0e-9);
  float turbidity = (1. + 10. * vVapor.x) * exp( -altitude/5000. );
  float mieCoefficient = 0.005;
  
  float vSunEx = sunIntensity( cosGamma, refraction );
  float vSunFd = 1.0 - clip( 1.0 - exp( cosGamma)); // exp(vSunDirection.y)
  float rayleighCoefficient = rayleigh + vSunFd - 1.0;
  // extinction (absorbtion + out scattering)
  vec3 vBetaR = getBetaRayleigh( rayleigh, temperature, pressure, uHumidity ) * rayleighCoefficient;
  vec3 vBetaM = getBetaMie( turbidity ) * mieCoefficient;

  // Mie directional g def float g = 0.8;
  float g = 0.8 + vVapor.x * 0.2;
  float g2 = g * g;
  
  vec3 direction = normalize( vPosition - cameraPos );
  float cosZenith = dot( zenithDirection, direction );
  float cosTheta  = dot( vSunDirection, direction );
  float angZenith = acos( max(0., cosZenith ) ); // horizon cutoff
  
  // combined extinction factor
  float Iqbal = 1.0 / ( cosZenith + 0.15 * pow( 93.885 - degrees( angZenith ), -1.253 ) );
  vec3 Fex = exp( -Iqbal * ( vBetaR * zenithR + vBetaM * zenithM ) );
  
  // in scattering
  float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
  float mPhase = hgPhase( cosTheta, g, g2 );
  vec3 betaTotal = ( vBetaR * rPhase + vBetaM * mPhase ) / ( vBetaR + vBetaM );
  
  vec3 L0 = 0.5 * Fex;
  // composition + solar disc
  float sundisk = smoothstep( kSunArc, kSunArc + 2e-6, cosTheta + kSunDim );
  L0 += vSunEx * 19000.0 * Fex * sundisk;
  
  vec3 L = pow( vSunEx * betaTotal * ( 1.0 - Fex ), vec3( 1.5 ) );
  vec3 B = pow( vSunEx * betaTotal * Fex, vec3( 0.5 ) );
  
  vec3 nightsky = kColorNight * (1.0 + moon * kMoonFade);
  
  // the horizon line
#ifdef default_horizonline // default
  L *= mix( kColorSun, B , clip( pow( 1.0 - cosGamma, 5.0 ) ) );
  float sk = 1.0 / ( 1.2 + 1.2 * vSunFd );
  vec3 sky = pow( ( L + L0 ) * 0.04  + nightsky, vec3( sk ) );
#else
  vec3 sunColor = pow(vec3( 1.0, 0.8, 0.7 ), vec3(2.0 - 2.0 * cosGamma));
  L *= mix( sunColor, B , clip(pow(1.0 - cosGamma, 5.0)));
  // k: lower values improve contrast
  float sk = 1.0 - 1.0 / (10.0 * cosGamma * cosGamma + 2.0 - vVapor.x);
  float k = 0.01 + sk * 0.03;
  vec3 sky = pow( ( L + L0 ) * k, vec3( sk ) ) + nightsky;
#endif

#ifdef weather // apply weather
  if ( vVapor.y > 0.9){
    sky = vec3(0.5 + atan(20. * (cosGamma - 0.06))/pi) + nightsky * vec3(1.,1.5,1.1);
  }
#endif
  fragColor = vec4( ACESFilm(sky), 1.0 - vVapor.y);
}
`;