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

    this.logger = {
      id: null,
      set: function(id){
        this.id = id || document.getElementById(id);
      },
      log: function(msg){
        if (this.id)
          id.innerText += `${msg}\n`;
        console.log(msg);
      }
    }
    return this;
  }

  debug(elId){
    this.logger.set(elId);
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
    this.fragmentCode = this.checkCode(fragmentCode);
    this.loadProgram(vertexCode, fragmentCode, program => this.init(program));
    return this;
  }

  checkVar(code, varName, boolName){
    window[boolName] = this.testU(this.fragmentCode, 'vec3', varName);
    if (!window[boolName] && code.match("varName")){
      code =`uniform vec3 ${varName}\n${code}` ;
      window[boolName] = true;
    }
  }

  checkCode(code){
    this.checkVar(code, 'iAccelerometer', 'useAccel');
    this.checkVar(code, 'iOrientation',   'useOrien');
    this.checkVar(code, 'iGyroscope',     'useGyros');
    this.checkVar(code, 'iMagnetometer',  'useMagne');

    if (!code.match(/\#ifdef GL_ES/))
      code = "#ifdef GL_ES\n precision highp float;\n#endif\n\n" + code;
    if (!code.match(/\nvoid main\(\)/))
      code = code + "\n\nvoid main() {\n  mainImage( gl_FragColor, gl_FragCoord.xy );\n}";
  }

  requestPermission(key, callback){
    navigator.permissions.query({ name: key }).then((result) => {
      if (result.state === "denied") {
        this.logger.log(`Permission to use ${key} is denied.`);
      } else {
        callback()
      }
    });
  }
  testU(str, t, n){
    return str.match(`\nuniform[ ]+${t}[ ]+${n}`)
  }
  init(program){
    const gl = this.gl;
    program.position = gl.getAttribLocation(program, "position");
    program.iTime = gl.getUniformLocation(program, "iTime");
    program.iMouse = gl.getUniformLocation(program, "iMouse");
    program.iResolution = gl.getUniformLocation(program, "iResolution");
    
    if (this.useAccel){
      this.logger.log("Using iAccelerometer");
      program.iAccelerometer = gl.getUniformLocation(program, "iAccelerometer");
      program.accelerometer = new Accelerometer();
      program.accelerometer.data = [ 0, 0, 0 ];
      program.accelerometer.addEventListener("reading", (e) => {
        program.accelerometer.data = [ e.target.x, e.target.y, e.target.z ];
      });
    }

    if (this.useOrien){
      this.logger.log("Using iOrientation");
      program.iOrientation = gl.getUniformLocation(program, "iOrientation");
      program.orientation = { 
        data: [0,0,0],
        start: function(){
          window.addEventListener("deviceorientation", function(event){
            program.orientation.data = [ event.alpha / 360.0, (180.0 + event.beta) / 360.0, (90.0 + event.gamma)/ 180.0 ];
          });
        },
        stop: function(){
          window.addEventListener("deviceorientation", null);
        }
      }
    }

    if (this.useGyros){
      this.logger.log("Using iGyroscope");
      program.iGyroscope = gl.getUniformLocation(program, "iGyroscope");
      program.gyroscope = new Gyroscope();
      program.gyroscope.data = [ 0, 0, 0 ];
      program.gyroscope.addEventListener('reading', function(e) {
        program.gyroscope.data = [ e.target.x, e.target.y, e.target.z ];
      });
    }

    if (this.useMagne){
      this.logger.log("Using iMagnetometer");
      program.iMagnetometer = gl.getUniformLocation(program, "iMagnetometer");
      program.magnetometer = new Magnetometer();
      program.magnetometer.data = [ 0, 0, 0 ];
      program.magnetometer.addEventListener('reading', function(e) {
        program.magnetometer.data = [ e.target.x, e.target.y, e.target.z ];
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
    if (this.useAccel) this.program.accelerometer.start();
    if (this.useOrien) this.program.orientation.start();
    if (this.useGyros) this.program.gyroscope.start();
    if (this.useMagne) this.program.magnetometer.start();
    this.loop = true;
    this.render();
  }

  stop(){
    this.loop = false;
    if (this.useAccel) this.program.accelerometer.stop();
    if (this.useOrien) this.program.orientation.stop();
    if (this.useGyros) this.program.gyroscope.stop();
    if (this.useMagne) this.program.magnetometer.stop();
  }

  render(){
    const gl = this.gl;
    const glCanvas = this.glCanvas;
    const program = this.program;
    const bufObj = this.bufObj;
    const startTime = this.startTime;
    const mousepos = this.mousepos;
    const keepRunning = this.loop;
    
    function frame(){
      gl.viewport( 0, 0, glCanvas.width, glCanvas.height );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
     
      gl.uniform1f(program.iTime, (Date.now() - startTime)/1000.0);
      gl.uniform2f(program.iResolution, glCanvas.width, glCanvas.height);
      gl.uniform3f(program.iMouse, mousepos[0], mousepos[1], mousepos[2]);
      if (program.accelerometer)
        gl.uniform3f(program.iAccelerometer, program.accelerometer.data[0], program.accelerometer.data[1], program.accelerometer.data[2]);
      if (program.gyroscope)
        gl.uniform3f(program.iGyroscope, program.gyroscope.data[0], program.gyroscope.data[1], program.gyroscope.data[2]);
      if (program.magnetometer)
        gl.uniform3f(program.iMagnetometer, program.magnetometer.data[0], program.magnetometer.data[1], program.magnetometer.data[2]);
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
          this.logger.log(`Error linking program: ${this.gl.getProgramInfoLog(program)}`);
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