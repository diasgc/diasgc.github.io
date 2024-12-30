// todo: add input from:
// audio (iAudio)
// camera (iCamera)
// sensors:
//  AbsoluteOrientationSensor	'accelerometer', 'gyroscope', and 'magnetometer'
//  Accelerometer	'accelerometer'
//  AmbientLightSensor	'ambient-light-sensor'
//  GravitySensor	'accelerometer'
//  Gyroscope	'gyroscope'
//  LinearAccelerationSensor	'accelerometer'
//  Magnetometer	'magnetometer'
//  RelativeOrientationSensor	'accelerometer', and 'gyroscope'

class GlCanvas {

  constructor(id, options){
    this.options = options || {
      square: false
    };
    this.sensorSupport = {
      accelerometer: window.accelerometer,
      gyroscope: window.gyroscope,
      magnetometer: window.magnetometer,
      AmbientLightSensor: window.AmbientLightSensor
    };
    this.defaultVertex = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }`;
    this.glCanvas = id ? document.getElementById(id) : document.createElement('canvas');
    this.gl = this.glCanvas.getContext("webgl");
    this.glCanvas.addEventListener('mousemove', (e) => {
      this.mousepos = [ e.offsetX/this.glCanvas.width, e.offsetY/this.glCanvas.height, e.button];
    });

    this.bufObj = {};
    this.mousepos = [0,0,0];
    this.loop = false;
    return this;
  }

  loadByIds(vertexId, fragmentId){
    let vertexCode = vertexId ? document.getElementById(vertexId).firstChild.nodeValue : null;
    let fragmentCode = document.getElementById(fragmentId).firstChild.nodeValue;
    return this.loadCode(vertexCode, fragmentCode);
  }

  loadAssets(vertexPath, fragmentPath, callback){
    let vertexCode;
    if (vertexPath === null){
      vertexCode = this.defaultVertex;
      this.loadAsset(fragmentPath, fragmentCode => {
        this.loadCode(vertexCode, fragmentCode);
        callback(this);
      });
    } else {
      this.loadAsset(vertexPath, vertexCode => {
        this.loadAsset(fragmentPath, fragmentCode => {
          this.loadCode(vertexCode, fragmentCode);
          callback(this);
        })
      });
    }
  }

  loadAsset(path, callback){
    if (!path.match("shaders/"))
      path = "./shaders/" + path;
    fetch(path)
      .then((response) => response.text())
      .then((text) => callback(text));
  }

  loadCode(vertexCode, fragmentCode){
    if (vertexCode === null)
      vertexCode = "attribute vec2 position;\nvoid main() {\n gl_Position = vec4(position, 0.0, 1.0);\n}";
    this.vertexCode = vertexCode;
    this.fragmentCode = fragmentCode;
    this.loadProgram(vertexCode, fragmentCode, program => this.init(program));
    return this;
  }

  requestPermission(key, callback){
    navigator.permissions.query({ name: key }).then((result) => {
      if (result.state === "denied") {
        console.log(`Permission to use ${key} is denied.`);
      } else {
        callback()
      }
    });
  }

  init(program){
    const gl = this.gl;
    program.position = gl.getAttribLocation(program, "position");
    program.iTime = gl.getUniformLocation(program, "iTime");
    program.iMouse = gl.getUniformLocation(program, "iMouse");
    program.iResolution = gl.getUniformLocation(program, "iResolution");
    
    if (this.fragmentCode.match('iAccelerometer')){
      this.requestPermission('accelerometer', () => {
        program.iAccelerometer = gl.getUniformLocation(program, "iAccelerometer");
        this.accelerometer = new Accelerometer({ frequency: 60 });
        this.accelerometer.addEventListener("reading", (e) => {
          this.accelerometer.data = [ this.accelerometer.x, this.accelerometer.y, this.accelerometer.z ];
        });
      });
    }

    if (this.fragmentCode.match('iGyroscope')){
      this.requestPermission('gyroscope', () => {
        program.iGyroscope = gl.getUniformLocation(program, "iGyroscope");
        program.gyro = { data: [] };
        window.addEventListener("devicemotion", function(event){
          program.gyro.data = [ event.rotationRate.alpha / 360.0, (180.0 + event.rotationRate.beta) / 360.0, (90.0 + event.rotationRate.gamma)/ 180.0 ];
        });
      });
    }

    if (this.fragmentCode.match('iMagnetometer')){
      this.requestPermission('magnetometer', () => {
        program.iMagnetometer = gl.getUniformLocation(program, "iMagnetometer");
        this.magnetometer = new Magnetometer({ frequency: 60 });
        this.magnetometer.addEventListener("reading", (e) => {
          this.magnetometer.data = [ this.magnetometer.x, this.magnetometer.y, this.magnetometer.z ];
        });
      });
    }
    

    gl.useProgram(program);

    var pos = [ -1, -1, 1, -1, 1, 1, -1, 1 ];
    var inx = [ 0, 1, 2, 0, 2, 3 ];

    let bufObj = {};
    bufObj.pos = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufObj.pos );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( pos ), gl.STATIC_DRAW );
    bufObj.inx = gl.createBuffer();
    bufObj.inx.len = inx.length;
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufObj.inx );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( inx ), gl.STATIC_DRAW );
    gl.enableVertexAttribArray( program.position );
    gl.vertexAttribPointer( program.position, 2, gl.FLOAT, false, 0, 0 ); 
    
    gl.enable( gl.DEPTH_TEST );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    window.onresize = this.resize;
    this.resize();
    this.gl = gl;
    this.program = program;
    this.bufObj = bufObj;
  }

  start(){
    this.startTime = Date.now();
    //if (this.accelerometer) this.accelerometer.start();
    //if (this.gyroscope) this.gyroscope.start();
    //if (this.magnetometer) this.magnetometer.start();
    this.loop = true;
    this.render();
  }

  render(){
    const gl = this.gl;
    const glCanvas = this.glCanvas;
    const program = this.program;
    const bufObj = this.bufObj;
    const startTime = this.startTime;
    const mousepos = this.mousepos;
    const accl = this.accelerometer;
    const gyro = this.gyroscope;
    const magn = this.magnetometer;
    const keepRunning = this.loop;
    
    function frame(){
      gl.viewport( 0, 0, glCanvas.width, glCanvas.height );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
     
      gl.uniform1f(program.iTime, (Date.now() - startTime)/1000.0);
      gl.uniform2f(program.iResolution, glCanvas.width, glCanvas.height);
      gl.uniform3f(program.iMouse, mousepos[0], mousepos[1], mousepos[2]);
      if (accl) gl.uniform3f(program.iAccelerometer, accl.data[0], accl.data[1], accl.data[2]);
      if (gyro) gl.uniform3f(program.iGyroscope, program.gyro.data[0], program.gyro.data[1], program.gyro.data[2]);
      if (magn) gl.uniform3f(program.iMagnetometer, magn.data[0], magn.data[1], magn.data[2]);
      gl.drawElements( gl.TRIANGLES, bufObj.inx.len, gl.UNSIGNED_SHORT, 0 );
      if (keepRunning)
        requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  resize(){
    let w, h;
    if (this.options.square){
      w = Math.min(window.innerWidth, window.innerHeight);
      h = w;
    } else {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    this.glCanvas.width = w;
    this.glCanvas.height = h;
  }

  loadProgram(vertexCode, fragmentCode, callback){
    const program = this.gl.createProgram();
    if (this.compileShader(this.gl.VERTEX_SHADER, vertexCode,
        shader => this.gl.attachShader(program, shader))
      && this.compileShader(this.gl.FRAGMENT_SHADER, fragmentCode,
        shader => this.gl.attachShader(program, shader))){
          this.gl.linkProgram(program);
          if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            callback(program);
            return true;  
          }
          console.log(`Error linking program: ${this.gl.getProgramInfoLog(program)}`);
      };
    return false;
  }

  compileShader(type, code, callback){
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, code);
    this.gl.compileShader(shader);
    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      callback(shader);
      return true;
    }
    console.log(`error compiling ${type}: ${this.gl.getShaderInfoLog(shader)}`);
    return false;
  }
}

window.addEventListener("load", startup, false);

function squareit(i){
  webGl.options.square = i.checked;
  webGl.resize();
}

let webGl;

function startup() {
  webGl = new GlCanvas('gl-canvas');
  //webGl.loadAssets(null,'toy-MddGWN.frag', gl => gl.start());
  webGl.loadAssets(null,'toy-gyro.frag', gl => gl.start());
}
