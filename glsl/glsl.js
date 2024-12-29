class GlCanvas {

  constructor(id, vertexId, fragmentId){
    
    this.glCanvas = id ? document.getElementById(id) : document.createElement('canvas');
    this.gl = this.glCanvas.getContext("webgl");
    this.bufObj = {};
    this.mousepos = [0,0];
    this.loadProgram(vertexId, fragmentId, program => this.init(program));
  }

  init(program){
    const gl = this.gl;
    program.position = gl.getAttribLocation(program, "position");
    program.iTime = gl.getUniformLocation(program, "iTime");
    program.iMouse = gl.getUniformLocation(program, "iMouse");
    program.iResolution = gl.getUniformLocation(program, "iResolution");
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
    this.render();
  }

  render(){
    const gl = this.gl;
    const glCanvas = this.glCanvas;
    const program = this.program;
    const bufObj = this.bufObj;
    const startTime = this.startTime;
    const mousepos = [0,0];
    
    function frame(){
      gl.viewport( 0, 0, glCanvas.width, glCanvas.height );
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
     
      gl.uniform1f(program.iTime, (Date.now() - startTime)/1000.0);
      gl.uniform2f(program.iResolution, glCanvas.width, glCanvas.height);
      gl.uniform2f(program.iMouse, mousepos[0], mousepos[1]);
      gl.drawElements( gl.TRIANGLES, bufObj.inx.len, gl.UNSIGNED_SHORT, 0 );
      requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  resize(){
    this.glCanvas.width = window.innerWidth;
    this.glCanvas.height = window.innerHeight;
  }

  loadProgram(vertexId, fragmentId, callback){
    const program = this.gl.createProgram();
    if (this.compileShader(vertexId, this.gl.VERTEX_SHADER,
        shader => this.gl.attachShader(program, shader))
      && this.compileShader(fragmentId, this.gl.FRAGMENT_SHADER,
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

  compileShader(id, type, callback){
    const code = document.getElementById(id).firstChild.nodeValue;
    const shader = this.gl.createShader(type);
  
    this.gl.shaderSource(shader, code);
    this.gl.compileShader(shader);
  
    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      callback(shader);
      return true;
    }
    console.log(`error compiling ${id}: ${this.gl.getShaderInfoLog(shader)}`);
    return false;
  }
}

window.addEventListener("load", startup, false);


function startup() {
  const webGl = new GlCanvas('gl-canvas', 'vertexShader', 'fragmentShader');
  webGl.start();
}
