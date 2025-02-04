  #pragma optimize(on)
  #pragma debug(off)

  #define rnd1(x) fract(sin(x)*43758.5453123)
  #define drop(x,a,b) (1.5 * rnd1(x) - abs( x * a )) - b
  #define f(x,k) k * (fract(x/k) + fract(x))
 
  #define rain_d 0.99
  #define rain_p 1.0
  #define rain_f 1.9
  #define rain_s 0.2
  #define k3     5.0
  #define k1     50.0  
  #define rain_c 0.21

  vec2 rot(vec2 u, vec2 res, float r, float zoom){
      return (u + vec2(0., u.x * r))/res * zoom;
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = rot(fragCoord.xy, iResolution.xy, 4. , 5.);
    // log density: 100=heavy rain; 1000=soft rain
    float k2 = 1050. - pow(1000.,rain_d);
    float k4 = rain_s + pow(16., rain_c);
    float r = k4 * drop(uv.x - 0.5 - f(iTime * rain_p, k1) + rnd1(uv.y) * k2, k3, rain_f);
    fragColor = vec4(r);
  }