const frag = `
//referenced 
//http://www-ljk.imag.fr/Publications/Basilic/com.lmc.publi.PUBLI_Article@11e7cdda2f7_f64b69/index_en.html
//https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter16.html
//https://github.com/wwwtyro/glsl-atmosphere

uniform vec2 iResolution;
uniform float iTime;

mat4 createVTW(vec3 eye,vec3 center,vec3 up) {
  vec3 f = normalize( center - eye );
  vec3 s = normalize( cross(f,up) );
  vec3 u = cross(s,f);
  return mat4(
    vec4(s,0.),
    vec4(u,0.),
    vec4(-f,0.),
    vec4(0.,0.,0.,1)
  );
}

vec3 rayDirection(float fieldofView,vec2 size,vec2 fragCoord) {
  vec2 xy = fragCoord - size / 2.0;
  float z = size.y / tan(radians(fieldofView) / 2.0 );
  return normalize(vec3(xy,-z));
}


float sdf( vec3 p ) {
    return length( p ) - 1.2 ;
}

vec3 createnormal(vec3 p) {
  float e = 0.001;
  return normalize( vec3(
    sdf( vec3(p.x+e,p.y,p.z) ) - sdf( vec3(p.x-e,p.y,p.z) ) ,
    sdf( vec3(p.x,p.y+e,p.z) ) - sdf( vec3(p.x,p.y-e,p.z) ) ,
    sdf( vec3(p.x,p.y,p.z+e) ) - sdf( vec3(p.x,p.y,p.z-e) )
  ));
}

vec2 rsi(vec3 r0, vec3 rd, float sr) {
  float a = dot(rd, rd);
  float b = 2.0 * dot(rd, r0);
  float c = dot(r0, r0) - (sr * sr);
  float d = (b*b) - 4.0*a*c;
  if (d < 0.0) return vec2(1e5,-1e5);
  return vec2(
      (-b - sqrt(d))/(2.0*a),
      (-b + sqrt(d))/(2.0*a)
  );
}

const int iSteps = 30;
const int jSteps = 8;
const float PI = 3.14159265;

const float intensity = 15.;
const float g = -.995;
const float rAtmos = 6420e3;
const float rPlanet = 6360e3;

vec4 render( vec2 uv , vec3 eye , vec3 dir ) {
  float len = 0.;
  float atmosThickness = rAtmos - rPlanet; 
  float shRlh = 0.25 * atmosThickness; //scale height rayliegh
  float shMie = 0.01 * atmosThickness; //scale height mie
  float kMie = 21e-6;
  vec3 kRlh = vec3(5.5e-6, 13.0e-6, 22.4e-6);
  vec3 r0 = vec3(0,rPlanet,0);

  //////////////////////////////////////////
  float T = iTime * 0.1;
  vec3 pSun = normalize( vec3( cos(T) , sin(T*3.5) * .1 + .2 , sin(T) ) );
  vec3 rayDirection = normalize(dir);

  float iOdRlh = 0.0;
  float iOdMie = 0.0;
  vec3 totalRlh = vec3(0,0,0);
  vec3 totalMie = vec3(0,0,0);

  float iStepSize = 0.;
  {
    vec2 p = rsi(r0, rayDirection, rAtmos);
    p.y = min(p.y, rsi(r0, rayDirection, rPlanet).x);
    iStepSize = (p.y - p.x) / float(iSteps);
  }

  float len2 = 0.;
  vec3 objcol = vec3(0.);
  for ( int si = 0 ; si < iSteps ; si++ ) {

    vec3 iPos = (eye + r0) + rayDirection * ( float(si) * iStepSize + iStepSize * 0.5 );
      
    // The Out-Scattering Equation
    float iHeight = length(iPos) - rPlanet;
    float odStepRlh = exp(-iHeight / shRlh) * iStepSize;
    float odStepMie = exp(-iHeight / shMie) * iStepSize;
    iOdRlh += odStepRlh;
    iOdMie += odStepMie;
    
    ////////////////
    float jStepSize = rsi(iPos, pSun, rAtmos).y / float(jSteps);
    float jTime = 0.0;
    float jOdRlh = 0.0;
    float jOdMie = 0.0;
    for (int j = 0; j < jSteps; j++) {
        vec3 jPos = iPos + pSun * ( float(j) * jStepSize + jStepSize * 0.5 );
        float jHeight = length(jPos) - rPlanet;
        jOdRlh += exp(-jHeight / shRlh) * jStepSize;
        jOdMie += exp(-jHeight / shMie) * jStepSize;
    }

    ////////////////
    totalRlh += odStepRlh * exp( -( kRlh * (iOdRlh + jOdRlh) ) );
    totalMie += odStepMie * exp( -( vec3(kMie) * (iOdMie + jOdMie) ) );

    ////////////////
    vec3 p = eye + dir * len2;
    float l = sdf( p );
    len2 += min( l , 3. );
    if ( l < 0.01 ) {
      objcol = dot ( createnormal(p) , pSun ) * vec3(.5,.4,.3);
      break;
    }

  }



  ////////////////
  float mu = dot( -rayDirection , pSun);
  float mumu = mu * mu;
  float gg = g * g;
    
  //fix
  //float pRlh = 1. / (4. * PI) * ( 1.0 + mumu );
  float pRlh = 3. / (16. * PI) * ( 1.0 + mumu );
    
  //fix
  //float pMie = 1. / (4. * PI) * ( ( 3. * (1.0 - gg) ) / (2. * (2.0 + gg) ) )  * ( (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) )
  float pMie = 3. / (8. * PI) * ( ( (1. - gg) * (mumu + 1.) ) / ( ( 2. + gg ) * pow(1. + gg - 2. * mu * g, 1.5) ) );

  ////////////////
  vec3 col = intensity * (pRlh * kRlh * totalRlh + pMie * kMie * totalMie) + objcol;
  return vec4( col , 1. );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord * (1.0/iResolution.x) - vec2(0.5, 0.5);

    vec3 eye = vec3( -25. , -2. ,  -25. );
    vec3 center = vec3( 0. , 3., 0. );
    vec3 up = vec3(0.,1.,0.);
    mat4 vtw = createVTW(eye,center,up);
    vec3 viewDir = rayDirection(45.,iResolution.xy,fragCoord);
    vec3 worldDir = (vtw * vec4(viewDir,0.)).xyz;
   fragColor = render( uv , eye , worldDir );
}`