// Based on "A Practical Analytic Model for Daylight" aka The Preetham Model, the de facto standard analytic skydome model
// http://www.cs.utah.edu/~shirley/papers/sunsky/sunsky.pdf
// Original implementation by Simon Wallner: http://www.simonwallner.at/projects/atmospheric-scattering
// Improved by Martin Upitis: http://blenderartists.org/forum/showthread.php?245954-preethams-sky-impementation-HDR
// Three.js integration by zz85: http://twitter.com/blurspline / https://github.com/zz85 / http://threejs.org/examples/webgl_shaders_sky.html
// Additional uniforms, refactoring and integrated with editable sky example: https://twitter.com/Sam_Twidale / https://github.com/Tw1ddle/Sky-Particles-Shader

const float PI = 3.141592653589793238462643383279502884197169;

luminance: { type: "f", value:1.0 },
turbidity: { type: "f", value:1.0 },
cameraPos: { type: "v3", value: new Vector3() },
primaries: { type: "v3", value: new Vector3() },
tonemapWeighting: { type: "f", value: 9.50 }

struct Sun {
  const float cutoffAngle = PI / 1.95; // Earth shadow hack
  const vec3 UP = vec3(0.0, 1.0, 0.0);
  float sunAngularDiameterDegrees = 1.0;
  float sunIntensityFactor = 1.0;
  float sunIntensityFalloffSteepness = 1.0;
  vec3 sunPosition = vec3(0.0, 0.0, 0.0);
} sun;

struct Rayleigh {
  float rayleigh = 1.0;
  float rayleighZenithLength = 1.0;
  float refractiveIndex = 
  float depolarizationFactor = 1.0;
  float numMolecules = 1.0;
} rayleigh;

struct Mie {
  float mieCoefficient = 1.0;
  float mieDirectionalG = 1.0;
  float mieV = 1.0;
  float mieZenithLength = 1.0;
  vec3 mieKCoefficient = vec3(0.0);
} mie;

varying vec3 vWorldPosition;

uniform vec3 cameraPos;

uniform float luminance;

uniform vec3 primaries;
uniform float tonemapWeighting;
uniform float turbidity;

vec3 totalRayleigh(vec3 lambda){
	return (8.0 * pow(PI, 3.0) * pow(pow(rayleigh.refractiveIndex, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * rayleigh.depolarizationFactor)) / (3.0 * rayleigh.numMolecules * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * rayleigh.depolarizationFactor));
}

vec3 totalMie(vec3 lambda, vec3 K, float T){
	float c = 0.2 * T * 10e-18;
	return 0.434 * c * PI * pow((2.0 * PI) / lambda, vec3(mie.mieV - 2.0)) * K;
}

float rayleighPhase(float cosTheta){
	return (3.0 / (16.0 * PI)) * (1.0 + pow(cosTheta, 2.0));
}

float henyeyGreensteinPhase(float cosTheta, float g){
	return (1.0 / (4.0 * PI)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0 * g * cosTheta + pow(g, 2.0), 1.5));
}

float sunIntensity(float zenithAngleCos){
	return sun.sunIntensityFactor * max(0.0, 1.0 - exp(-((sun.cutoffAngle - acos(zenithAngleCos)) / sun.sunIntensityFalloffSteepness)));
}

// Whitescale tonemapping calculation, see http://filmicgames.com/archives/75
// Also see http://blenderartists.org/forum/showthread.php?321110-Shaders-and-Skybox-madness
const float A = 0.15; // Shoulder strength
const float B = 0.50; // Linear strength
const float C = 0.10; // Linear angle
const float D = 0.20; // Toe strength
const float E = 0.02; // Toe numerator
const float F = 0.30; // Toe denominator
vec3 Uncharted2Tonemap(vec3 W){
	return ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
}

vec3 fastUncharted2Tonemap(vec3 x){
  return x/(3.3 + 1.3 * x);
}

void main(){
	// Rayleigh coefficient
	float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
	float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
	vec3 betaR = totalRayleigh(primaries) * rayleighCoefficient;
	
	// Mie coefficient
	vec3 betaM = totalMie(primaries, mieKCoefficient, turbidity) * mieCoefficient;
	
	// Optical length, cutoff angle at 90 to avoid singularity
	float zenithAngle = acos(max(0.0, dot(UP, normalize(vWorldPosition - cameraPos))));
	float denom = cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / PI), -1.253);
	float sR = rayleighZenithLength / denom;
	float sM = mieZenithLength / denom;
	
	// Combined extinction factor
	vec3 Fex = exp(-(betaR * sR + betaM * sM));
	
	// In-scattering
	vec3 sunDirection = normalize(sunPosition);
	float cosTheta = dot(normalize(vWorldPosition - cameraPos), sunDirection);
	vec3 betaRTheta = betaR * rayleighPhase(cosTheta * 0.5 + 0.5);
	vec3 betaMTheta = betaM * henyeyGreensteinPhase(cosTheta, mieDirectionalG);
	float sunE = sunIntensity(dot(sunDirection, UP));
	vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3(1.5));
	Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(0.5)), clamp(pow(1.0 - dot(UP, sunDirection), 5.0), 0.0, 1.0));
	
	// Composition + solar disc
	float sunAngularDiameterCos = cos(sunAngularDiameterDegrees);
	float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
	vec3 L0 = vec3(0.1) * Fex;
	L0 += sunE * 19000.0 * Fex * sundisk;
	vec3 texColor = Lin + L0;
	texColor *= 0.04;
	texColor += vec3(0.0, 0.001, 0.0025) * 0.3;
	
	// Tonemapping
	vec3 whiteScale = 1.0 / Uncharted2Tonemap2(vec3(tonemapWeighting));
	vec3 curr = Uncharted2Tonemap2((log2(2.0 / pow(luminance, 4.0))) * texColor);
	vec3 color = curr * whiteScale;
	vec3 retColor = pow(color, vec3(1.0 / (1.2 + (1.2 * sunfade))));

	gl_FragColor = vec4(retColor, 1.0);
}