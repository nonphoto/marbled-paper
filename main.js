const positions = [
	-1, -1, 0,
	-1, 1, 0,
	1, -1, 0,
	1, 1, 0
];

function loadShader(gl, source, type) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error("Shader compilation failed." + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    
		return null;
  }
  
	return shader;
}

require(['domReady!', 'text!vertex.glsl', 'text!fragment.glsl'], (document, vertexSource, fragmentSource) => {
  const canvas = document.getElementById('canvas')
  canvas.width = 800
  canvas.height = 600

	var gl = null
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
	if (!gl) {
		alert("Unable to initialize WebGL. Maybe your browser doesn't support it.")
		return
  }
  
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

	const vertexShader = loadShader(gl, vertexSource, gl.VERTEX_SHADER)
	const fragmentShader = loadShader(gl, fragmentSource, gl.FRAGMENT_SHADER)

	program = gl.createProgram()
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program))
		return
	}

	gl.useProgram(program)
	gl.clearColor(1.0, 1.0, 1.0, 1.0)

	const vertexPositionAttribute = gl.getAttribLocation(program, 'vertexPosition')
	const resolutionUniform = gl.getUniformLocation(program, 'resolution')

	const vertexPositionBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

	function draw() {
		gl.clear(gl.COLOR_BUFFER_BIT)
	
		gl.uniform2f(resolutionUniform, canvas.width, canvas.height)

		gl.enableVertexAttribArray(vertexPositionAttribute)
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0)

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
		requestAnimationFrame(draw)
	}

	draw();
})