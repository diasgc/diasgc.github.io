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

  defOptions = {
    square: false
  }
  options;

  sensorSupport = {
    accelerometer: window.accelerometer,
    gyroscope: window.gyroscope,
    magnetometer: window.magnetometer,
    AmbientLightSensor: window.AmbientLightSensor
  };

  defaultVertex =
`attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  defaultFragment = 
`uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

// shaderToy style:
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord.xy / iResolution.xy;
    fragColor = vec4(uv.x * cos(iTime), uv.y * sin(iTime), uv.x * uv.y, 1.0);
}`;

  bufObj = {};
  mousepos = [0,0,0];
  loop = false;

  logger = {
    id: null,
    set: function(id){
      this.id = document.getElementById(id) || null;
    },
    log: function(msg){
      if (this.id)
        this.id.innerText += `${msg}\n`;
      console.log(msg);
    },
    show: function(){
      if (this.id && this.id.style.display === 'none')
        this.id.style.display = 'block';
    }
  }

  constructor(id, options){
    this.options = options || this.defOptions;
    this.glCanvas = id ? document.getElementById(id) : document.createElement('canvas');
    this.gl = this.glCanvas.getContext("webgl");
    this.glCanvas.addEventListener('mousemove', (e) => {
      this.mousepos = [ e.offsetX/this.glCanvas.width, e.offsetY/this.glCanvas.height, e.button];
    });

    return this;
  }

  debug(elId){
    this.logger.set(elId);
  }

  load(opts, callback){
    let isLoaded = false;
    this.vertexCode = this.defaultVertex;
    this.fragmentCode = this.defaultFragment;
    if (opts.vertexId)
      this.vertexCode = document.getElementById(opts.vertexId).firstChild.nodeValue;
    if (opts.fragmentId)
      this.fragmentCode = document.getElementById(opts.fragmentId).firstChild.nodeValue;
    if (opts.vertexAsset){
      this.vertexCode = null;
      this.loadAsset(opts.vertexAsset, vertexCode => {
        this.vertexCode = vertexCode;
        isLoaded = this.checkCodeCallback(callback);
      });
    }
    if (opts.fragmentAsset){
      this.fragmentCode = null;
      this.loadAsset(opts.fragmentAsset, fragmentCode => {
        this.fragmentCode = fragmentCode;
        isLoaded = this.checkLoadingState(callback);
      });
    }
    if (opts.vertexCode)
      this.vertexCode = opts.vertexCode;
    if (opts.fragmentCode)  
      this.fragmentCode = opts.fragmentCode;
    if (opts.vertexCode === null)
      this.vertexCode = this.defaultVertex;
    if (opts.fragmentCode === null)
      this.fragmentCode = this.defaultFragment;
    if (!isLoaded)
      this.checkLoadingState(callback);
  }

  checkLoadingState(callback){
    let state = this.vertexCode && this.fragmentCode;
    if (state)
      this.loadProgram(program => this.init(program, callback));
    return state;
  }

  loadAsset(path, callback){
    if (!path.match("shaders/"))
      path = "./shaders/" + path;
    fetch(path)
      .then((response) => response.text())
      .then((text) => callback(text));
  }

  checkVar(code, varName, boolName){
    window[boolName] = this.testU(code, 'vec3', varName);
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

    if (code.match(/\#ifdef GL_ES/) === null)
      code = "#ifdef GL_ES\n precision highp float;\n#endif\n\n" + code;
    if (code.match(/\nvoid main\(\)/) === null)
      code = code + "\n\nvoid main() {\n  mainImage( gl_FragColor, gl_FragCoord.xy );\n}";
    // give some space to special characters
    code = code.replace(/\<|\>|\=|\*|\+|\-|\/|\?|\:\)|\(/gi, (m) => ` ${m} `)
      .replaceAll('  ',' ')
      .replaceAll(' / /','//')
      .replaceAll(' / *','/*')
      .replaceAll(' * /','*/');
    return code;
  }

  testU(str, t, n){
    return str.match(`\nuniform[ ]+${t}[ ]+${n}`)
  }
  init(program, callback){
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
    callback(this);
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

  loadProgram(callback){
    this.fragmentCode = this.checkCode(this.fragmentCode)
    const program = this.gl.createProgram();
    if (this.compileShader(this.gl.VERTEX_SHADER, this.vertexCode,
        shader => this.gl.attachShader(program, shader))
      && this.compileShader(this.gl.FRAGMENT_SHADER, this.fragmentCode,
        shader => this.gl.attachShader(program, shader))){
          this.gl.linkProgram(program);
          if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            callback(program);
            this.logger.log(`linking program successfully: ${this.gl.getProgramInfoLog(program)}`); 
            return true;  
          }
          this.logger.log(`Error linking program: ${this.gl.getProgramInfoLog(program)}`);
      };
    return false;
  }

  compileShader(type, code, callback){
    const shader = this.gl.createShader(type);
    const typeName = type === this.gl.VERTEX_SHADER ? "vertex" : "fragment";
    this.gl.shaderSource(shader, code);
    this.gl.compileShader(shader);
    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      callback(shader);
      this.logger.log(`compiling successfully ${typeName}: ${this.gl.getShaderInfoLog(shader)}`);
      return true;
    }
    this.logger.log(`error compiling ${typeName}: ${this.gl.getShaderInfoLog(shader)}`);
    return false;
  }
}