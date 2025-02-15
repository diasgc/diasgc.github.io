// Atmospheric scattering shader - optimized version

// Core configuration
struct Config {
    bool enableMountains;
    bool enableStars; 
    bool enableClouds;
    bool fastMode;
} config;

// Atmospheric parameters
struct Atmosphere {
    float temperature;
    float humidity;
    float cloudCover;
    float moonPhase;
    float rainfall;
    
    const float zenithR = 8400.0;
    const float zenithM = 1250.0;
    const vec3 lambda = vec3(650E-9, 550E-9, 450E-9);
} atm;

// Utility functions
#define clip(x) clamp(x, 0., 1.)
#define fastHash(p) fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453)
#define ACESFilmic(x) (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)

// Optimized scattering calculation
vec3 calculateScattering(vec3 sunDir, vec3 viewDir) {
    float cosTheta = dot(sunDir, viewDir);
    float rayleighPhase = 0.0596831 * (1.0 + cosTheta * cosTheta);
    float g = 0.8;
    float miePhase = 0.0796179 * ((1.0 - g * g) / pow(1.0 - 2.0 * g * cosTheta + g * g, 1.5));
    
    vec3 betaR = getBetaRayleigh(atm.temperature, atm.humidity);
    vec3 betaM = getBetaMie(atm.temperature);
    
    return (betaR * rayleighPhase + betaM * miePhase) / (betaR + betaM);
}

// Optimized feature rendering
vec3 renderFeatures(vec2 uv, vec3 sky) {
    if (config.enableStars) {
        sky += calculateStars(uv, 200.0);
    }
    
    if (config.enableMountains) {
        sky = applyMountains(uv, sky, 4);
    }
    
    if (config.enableClouds) {
        sky += calculateClouds(uv, 8);
    }
    
    return sky;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord/iResolution.xy;
    vec3 viewDir = normalize(vec3(uv * 2.0 - 1.0, 1.0));
    vec3 sunDir = normalize(vec3(0.0, sin(iTime * 0.2), cos(iTime * 0.2)));
    
    // Calculate base sky color
    vec3 sky = calculateScattering(sunDir, viewDir);
    
    // Apply features
    sky = renderFeatures(uv, sky);
    
    // Final color processing
    sky = ACESFilmic(clamp(sky, 0.0, 1.0));
    
    fragColor = vec4(sky, 1.0);
}
