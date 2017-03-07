const vertexPositions = [
	-1, -1, 0,
	-1, 1, 0,
	1, -1, 0,
	1, 1, 0
]

const minDropSize = 50
const maxDropSize = 100

const colors = [
  [1.00, 0.96, 0.91],
  [0.59, 0.05, 0.07],
  [0.10, 0.22, 0.66],
  [0.05, 0.13, 0.31],
  [0.89, 0.75, 0.33]
]

let dropCount = 0
let dropPositions = []
let dropSizes = []
let dropColors = []

function addDrop(x, y) {
  const color = colors[dropCount % colors.length]
  const size = minDropSize + (Math.random() * (maxDropSize - minDropSize))
  dropPositions.unshift(x, y)
  dropColors.unshift(color[0], color[1], color[2])
  dropSizes.unshift(size)
  dropCount += 1;
}

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

  canvas.addEventListener('click', (e) => {
    const bounds = canvas.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = -(e.clientY - bounds.bottom)
    addDrop(x, y)
  })

	let gl = null
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
  const dropCountUniform = gl.getUniformLocation (program, 'dropCount')
  const dropPositionsUniform = gl.getUniformLocation(program, 'dropPositions')
  const dropSizesUniform = gl.getUniformLocation(program, 'dropSizes')
  const dropColorsUniform = gl.getUniformLocation(program, 'dropColors')

	const vertexPositionBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW)

	function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    if (dropCount > 0) {
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
      gl.uniform1i(dropCountUniform, dropCount)
      gl.uniform2fv(dropPositionsUniform, dropPositions)
      gl.uniform1fv(dropSizesUniform, dropSizes)
      gl.uniform3fv(dropColorsUniform, dropColors)

      gl.enableVertexAttribArray(vertexPositionAttribute)
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }  
    
		requestAnimationFrame(draw)
	}

	draw();
})