$(function() {
  var squareVerticesBuffer;
  var mvMatrix;
  var shaderProgram;
  var vertexPositionAttribute;
  var perspectiveMatrix;
  var horizAspect = 480.0/640.0;


  var MyWebGLViewController = Frame.WebGLViewController.extend({
    y: -6.0,
    constructor: function(options) {
      Frame.WebGLViewController.call(this, options);

    },

    viewDidLoad: function() {
      var gl = this.gl;

      gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
      gl.clearDepth(1.0);                 // Clear everything
      gl.enable(gl.DEPTH_TEST);           // Enable depth testing
      gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

      this.initShaders();
      this.initBuffers();

      Frame.WebGLViewController.prototype.viewDidLoad.call(this);
    },

    update: function() {
      var gl = this.gl;

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

      loadIdentity();

      this.z -= 10.0;

      mvTranslate([-0.0, 0.0, -6.0]).augment(Matrix.Rotation(this.z));

      gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
      setMatrixUniforms(gl, this.shaderProgram, perspectiveMatrix);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },

    initBuffers: function() {
      var gl = this.gl;

      squareVerticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

      var vertices = [
        1.0,  1.0,  0.0,
        -1.0, 1.0,  0.0,
        1.0,  -1.0, 0.0,
        -1.0, -1.0, 0.0
      ];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    },

    initShaders: function() {
      var gl = this.gl, shaderProgram;

      var fragmentShader = this.getShader("shader-fs");
      var vertexShader = this.getShader("shader-vs");

      // Create the shader program

      shaderProgram = gl.createProgram();
      this.shaderProgram = shaderProgram;
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      // If creating the shader program failed, alert

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
      }

      gl.useProgram(shaderProgram);

      vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);
    },

    getShader: function(id) {
      var gl = this.gl,
          shaderScript, theSource, currentChild, shader;

      shaderScript = document.getElementById(id);

      if (!shaderScript) {
        return null;
      }

      theSource = "";
      currentChild = shaderScript.firstChild;

      while(currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
          theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
      }

      if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        // Unknown shader type
        return null;
      }

      gl.shaderSource(shader, theSource);

      // Compile the shader program
      gl.compileShader(shader);  

      // See if it compiled successfully
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));  
        return null;  
      }

      return shader;
    },
  });

  Frame.application = Frame.Application.extend({
    didFinishLaunching: function() {
      this.rootViewController = new MyWebGLViewController({el:"#canvas", width: 640, height: 480});
    }
  });
});
