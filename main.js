const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

class NoiseTexture extends THREE.DataTexture {
    constructor(sz) {
      let size = 4 * sz * sz;
      const data = new Uint8Array( size );
      const rndUInt8 = () => Math.round(Math.random() * 255);
      for ( let i = 0; i < size; i ++ ) {
        data[ i ] = rndUInt8();
      }
      super( data, sz, sz );
      this.generateMipmaps = true;
      this.magFilter = THREE.LinearFilter;
      this.format = THREE.RGBAFormat;
      this.wrapS = this.wrapT = THREE.RepeatWrapping;
      this.needsUpdate = true;
    }
    
  }
  
  class TestMesh extends THREE.Mesh {
    constructor() {
      const material = new THREE.ShaderMaterial({
        vertexShader: document.getElementById("vertex").textContent,
        fragmentShader: document.getElementById("fragment").textContent,
        uniforms: {
          uNoise:  { type: "t", value: new NoiseTexture(128) },
          uTime:   { value: 0.0 },
          uRingsN: { value: 7 },
          uWidth:  { value: 0.26 },
          uSize:   { value: 0.28 }
          // Add more
        },
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        depthTest: true
      });
      super(new THREE.PlaneGeometry(), material);
      this.clock = new THREE.Clock();
    }
    
    render(){
      if (this.visible)
        this.material.uniforms.uTime.value += this.clock.getDelta();
    }
  }
  
  let camera, scene, renderer;
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.setClearColor(0x000a14);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 45000 );
  camera.position.z = 0.25;
  
  const mesh = new TestMesh();
  mesh.position.z = -0.5;
  scene.add(mesh);
  
  // usage: varEnv(mesh, "id2", (x) => x/100 )
  function applyUniform(v,id){
    mesh.material.uniforms[id].value = v;
    renderer.render(scene, camera);
    //console.log("change "+id+" to "+v);
  }

  function varEnv(mesh, id, func){
    let i = document.getElementById(id);
    i.onchange = () => {
      let v = func(i.value);
      applyUniform(v,id);
      }
    }
  
  varEnv(mesh, "uRingsN", (x) => clamp(x, 1, 32));
  
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    mesh.render();
  }

  setInterval(function(){
    let e = document.getElementById('uRingsN');
    e.value = e.value * 1 + 1;
    if (e.value > 32)
      e.value = 1;
    applyUniform(e.value,"uRingsN");
  },10000);
  
  render();