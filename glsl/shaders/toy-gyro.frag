// From: https://www.shadertoy.com/view/MddGWN adapted by diasgc
// Created by Stephane Cuillerdier - Aiekick/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Tuned via XShade (http://www.funparadigm.com/xshade/)

#ifdef GL_ES
  precision highp float;
#endif

uniform vec2  iResolution;
uniform vec3  iAccelerometer;
uniform float iTime;
uniform vec3  iOrientation;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  float t = iTime+5.;
  float z = 6.;

  const int n = 100; // particle count
    
  vec3 startColor = iOrientation;
  vec3 endColor = vec3(0.06,0.35,0.85) * iAccelerometer;
    
  float startRadius = 0.84;
  float endRadius = 1.6;
    
  float power = 0.51;
  float duration = 10.;
    
  vec2 s = iResolution.xy;
  vec2 v = z*(2.*fragCoord.xy-s)/s.y;
    
  vec3 col = vec3(0.);
  vec2 pm = v.yx * 2.8;
  float dMax = duration;
  float evo = (sin(iTime*.01 + 400.) * .5 + .5) * 99. + 1.;
  float mb = 0.;
  float mbRadius = 0.;
  float sum = 0.;
  for(int i=0;i<n;i++){
    float d = fract(t*power+48934.4238*sin(float(i/int(evo))*692.7398));
    float tt = 0.;
    float a = 6.28*float(i)/float(n);
    float x = d*cos(a)*duration;
    float y = d*sin(a)*duration;
    float distRatio = d/dMax;
    mbRadius = mix(startRadius, endRadius, distRatio); 
    vec2 p = v - vec2(x,y);//*vec2(1,sin(a+3.14159/2.));
    mb = mbRadius/dot(p,p);
    sum += mb;     
    col = mix(col, mix(startColor, endColor, distRatio), mb/sum);
  }
  sum /= float(n);
  col = normalize(col) * sum;
  sum = clamp(sum, 0., .4);
  vec3 tex = vec3(1.);
  col *= smoothstep(tex, vec3(0.), vec3(sum));        
  fragColor = vec4(col,1.0);
}

void main() {
  mainImage( gl_FragColor, gl_FragCoord.xy );
}