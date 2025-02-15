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
  
  options = {
    square: false
  }

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
uniform float iTime;

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

  uniforms = {
    isTouchDevice: 'ontouchstart' in window || navigator.msMaxTouchPoints,
    uniformList: [
      'accelerometer', 'gyroscope', 'magnetometer', 'ambientLightSensor', 'gravitySensor',
      'linearAccelerationSensor', 'relativeOrientationSensor', 'absoluteOrientationSensor',
      'mouse', 'time', 'random1', 'random2', 'noise24b256', 'noise8b256'
    ],
    addUniform: function(name, type, start, stop){
      this.uniformList.push(name);
      this[name] = {
        isEnabled: false,
        name: name,
        type: type,
        data: [],
        start: start || function(){},
        stop:  stop  || function(){},
        update: function(gl, program){
          if (type === 'float')
            gl.uniform1f(program[this.name], this.data[0]);
          else if (type === 'vec2')
            gl.uniform2f(program[this.name], this.data[0], this.data[1]);
          else if (type === 'vec3')
            gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
          else if (type === 'sampler2D')
            gl.uniform1i(program[this.name], 0);
        }
      };
    },
    accelerometer: {
      isEnabled: false,
      name: 'iAccelerometer',
      type: 'vec3',
      data: [0,0,0],
      start: function(){
        this.sensor = new Accelerometer();
        this.sensor.addEventListener("reading", (e) => this.data = [ e.target.x, e.target.y, e.target.z ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    gyroscope: {
      isEnabled: false,
      name: 'iGyroscope',
      type: 'vec3',
      data: [0,0,0],
      start: function(){
        this.sensor = new Gyroscope();
        this.sensor.addEventListener('reading', (e) => this.data = [ e.target.x, e.target.y, e.target.z ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    magnetometer: {
      isEnabled: false,
      name: 'iMagnetometer',
      type: 'vec3',
      data: [0,0,0],
      start: function(){
        this.sensor = new Magnetometer();
        this.sensor.addEventListener('reading', (e) => this.data = [ e.target.x, e.target.y, e.target.z ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    ambientLightSensor: {
      isEnabled: false,
      name: 'iAmbientLight',
      type: 'float',
      data: 0,
      start: function(){
        this.sensor = new AmbientLightSensor();
        this.sensor.addEventListener('reading', (e) => this.data = e.target.illuminance);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    gravitySensor: {
      isEnabled: false,
      name: 'iGravity',
      type: 'vec3',
      data: [0,0,0],
      start: function(){
        this.sensor = new GravitySensor();
        this.sensor.addEventListener('reading', (e) => this.data = [ e.target.x, e.target.y, e.target.z ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    linearAccelerationSensor: {
      isEnabled: false,
      name: 'iLinearAcceleration',
      type: 'vec3',
      data: [0,0,0],
      start: function(){
        this.sensor = new LinearAccelerationSensor();
        this.sensor.addEventListener('reading', (e) => this.data = [ e.target.x, e.target.y, e.target.z ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    relativeOrientationSensor: {
      isEnabled: false,
      name: 'iRelativeOrientation',
      type: 'vec3',
      data: [0,0,0],
      start: function(){
        this.sensor = new RelativeOrientationSensor();
        this.sensor.addEventListener('reading', (e) => this.data = [ e.target.x, e.target.y, e.target.z ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    absoluteOrientationSensor: {
      isEnabled: false,
      name: 'iAbsoluteOrientation',
      type: 'vec3',
      data: [0,0,0],
      start: function(){
        this.sensor = new AbsoluteOrientationSensor();
        this.sensor.addEventListener('reading', (e) => this.data = [ e.target.x, e.target.y, e.target.z ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    mouse: {
      isEnabled: false,
      name: 'iMouse',
      type: 'vec3',
      data: [0,0,0],
      checkCode: function(code){ this.isEnabled = code.match(/\s+^uniform vec[23] iMouse/g) ? true : false; },
      start: function(){
        if (this.isTouchDevice)
          window.addEventListener("touchmove", (event) => this.data = [ event.touches[0].clientX, event.touches[0].clientY, event.button ]);
        else
          window.addEventListener("mousemove", (event) => this.data = [ event.clientX, event.clientY, event.button ]);
      },
      stop: function(){
        this.sensor.addEventListener("reading", null);
      },
      update: function(gl, program){
        gl.uniform3f(program[this.name], this.data[0], this.data[1], this.data[2]);
      }
    },
    time: {
      isEnabled: false,
      name: 'iTime',
      type: 'float',
      data: 0,
      checkCode: function(code){ this.isEnabled = uniforms.chkDecl(code, 'float', 'iTime'); },
      start: function(){
        this.data = Date.now();
      },
      stop: function(){
        this.data = 0;
      },
      update: function(gl, program){
        gl.uniform1f(program[this.name], (Date.now() - this.data)/1000.0);
      }
    },
    random1: {
      isEnabled: false,
      name: 'iRandom',
      type: 'float',
      data: 0,
      start: function(){
        this.data = Math.random();
      },
      stop: function(){
        this.data = 0;
      },
      update: function(gl, program){
        gl.uniform1f(program[this.name], Math.random());
      }
    },
    random2: {
      isEnabled: false,
      name: 'iRandom2D',
      type: 'vec2',
      data: [0, 0],
      start: function(){
        this.data = [Math.random(), Math.random()];
      },
      stop: function(){
        this.data = 0;
      },
      update: function(gl, program){
        gl.uniform2f(program[this.name], Math.random(), Math.random());
      }
    },
    noise8b256: {
      isEnabled: false,
      name: 'iNoise8b256',
      type: 'sampler2D',
      data: null,
      rnd256: function(){
        return (Math.random() * 255) & 0xFF;
      },
      init: function(gl, program){
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = gl.LUMINANCE;
        const width = 256;
        const height = 256;
        const border = 0;
        const srcFormat = gl.LUMINANCE;
        const srcType = gl.UNSIGNED_BYTE;
        let data = [];
        for (let i = 0; i < 256 * 256; i++)
          data.push(this.rnd256());
        const pixels = new Uint8Array(data);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixels);
        gl.uniform1i(program.noise24b256, 0);
      },
      start: function(){},
      stop: function(){},
      update: function(){}
    },
    noise24b256: {
      isEnabled: false,
      name: 'iNoise24b256',
      type: 'sampler2D',
      data: null,
      rnd256: function(){
        return (Math.random() * 255) & 0xFF;
      },
      init: function(gl, program){
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 256;
        const height = 256;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        let data = [];
        for (let i = 0; i < 256 * 256; i++)
          data.push(this.rnd256() , this.rnd256(), this.rnd256(), 255);
        const pixels = new Uint8Array(data);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixels);
        gl.uniform1i(program.noise24b256, 0);
      },
      start: function(){},
      stop: function(){},
      update: function(){}
    },

    inspectCode: function(code){
      this.uniformList.forEach(uniform => {
        let regex = new RegExp(`[\n\\s]+uniform\\s+${this[uniform].type}\\s+${this[uniform].name}`,'g');
        this[uniform].isEnabled = code.match(regex) ? true : false;
      });
    },

    init: function(gl, program){
      this.uniformList.forEach(u => {
        if (this[u].isEnabled){
          program[this[u].name] = gl.getUniformLocation(program, this[u].name);
          if (this[u].init)
            this[u].init(gl, program);
        }
      });
      return program;
    },

    start: function(){
      this.uniformList.forEach(u => {
        if (this[u].isEnabled)
          this[u].start();
      });
    },

    update: function(gl, program){
      this.uniformList.forEach(u => {
        if (this[u].isEnabled)
          this[u].update(gl, program);
      });
    }
  }



  constructor(id, options){
    this.options = options || this.defOptions;
    this.glCanvas = id ? document.getElementById(id) : document.createElement('canvas');
    this.gl = this.glCanvas.getContext("webgl");
    return this;
  }

  debug(elId){
    this.logger.set(elId);
  }

  load(opts, callback){
    let isLoaded = false;
    this.vertexCode = this.defaultVertex;
    this.fragmentCode = this.defaultFragment;
    if (opts.uniforms){
      Object.keys(opts.uniforms).forEach(u => {
        this.uniforms.addUniform(u, opts.uniforms[u].type, opts.uniforms[u].start || null, opts.uniforms[u].stop || null);
      });
    }
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
    //if (!path.match("shaders/"))
    //  path = "./shaders/" + path;
    fetch(path)
      .then((response) => response.text())
      .then((text) => callback(text));
  }

  static formatCode(code){
    return code.replace(/(\w+)([+=*/<>?:])(\w)/g,"$1 $2 $3");
    //return code.replace(/\<|\>/gi, (m) => ` ${m} `);
    //return code.replace(/\/\/|\/\*|\*\/|\/\=|\*\=|\+\=|\-\=|\+\+|\-\-|\<|\>|\=|\*|\+|\-|\/|\?|\:\)|\(/gi, (m) => m.lenght === 2 ? m :` ${m} `).replaceAll('  ',' ');
  }

  checkCode(code){
    this.uniforms.inspectCode(code);
    if (code.match(/\#ifdef GL_ES/) === null)
      code = "#ifdef GL_ES\n precision highp float;\n#endif\n\n" + code;
    if (code.match(/\nvoid main\(\)/) === null)
      code = code + "\n\nvoid main() {\n  mainImage( gl_FragColor, gl_FragCoord.xy );\n}";
    // give some space to special characters
    code = GlCanvas.formatCode(code);
    return code;
  }

  init(program, callback){
    const gl = this.gl;
    program.position = gl.getAttribLocation(program, "position");
    program.iResolution = gl.getUniformLocation(program, "iResolution");
    
    program = this.uniforms.init(gl, program);
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

  start(loop=true){
    this.uniforms.start();
    this.loop = loop;
    this.render();
  }

  stop(){
    this.loop = false;
    this.uniforms.stop();
  }

  render(){
    const gl = this.gl;
    const u = this.uniforms;
    const glCanvas = this.glCanvas;
    const program = this.program;
    const bufObj = this.bufObj;
    const keepRunning = this.loop;
    
    function frame(){
      gl.viewport( 0, 0, glCanvas.width, glCanvas.height );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
     
      gl.uniform2f(program.iResolution, glCanvas.width, glCanvas.height);
      u.update(gl, program);

      gl.drawElements( gl.TRIANGLES, bufObj.inx.len, gl.UNSIGNED_SHORT, 0 );
      if (keepRunning)
        requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  resize(){
    if (this.glCanvas){
      if (this.options && this.options.square){
        this.glCanvas.width = Math.min(window.innerWidth, window.innerHeight);
        this.glCanvas.height = w;
      } else {
        this.glCanvas.width = window.innerWidth;
        this.glCanvas.height = window.innerHeight;
      }
    }
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