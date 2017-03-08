const vertexPositions = [
	-1, -1, 0,
	-1, 1, 0,
	1, -1, 0,
	1, 1, 0
]

const minDropSize = 50
const maxDropSize = 100

const lineSize = 150

const viscosity = 10

const colorCount = 7
const colors = [
  0.59, 0.05, 0.07,
  1.00, 0.96, 0.91,
  0.10, 0.22, 0.66,
  0.10, 0.22, 0.66,
  0.05, 0.13, 0.31,
  0.05, 0.13, 0.31,
  0.89, 0.75, 0.33
]

let operations = []

class Drop {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.size = 0
    this.targetSize = minDropSize + (Math.random() * (maxDropSize - minDropSize))
    this.color = Math.floor(Math.random() * colorCount)
  }

  update() {
    this.size += (this.targetSize - this.size) / viscosity
  }

  position() {
    return [this.x, this.y, 0, 0]
  }

  args() {
    return [this.size, this.color]
  }

  type() {
    return 0
  }
}

class Line {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.size = 0
    this.targetSize = 1
  }

  update() {
    this.size += (this.targetSize - this.size) / viscosity
  }

  position() {
    return [this.x1, this.y1, this.x2, this.y2]
  }

  args() {
    return [this.size, 0]
  }

  type() {
    return 1
  }
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
  const controls = document.getElementById('controls')
  const buttons = Array.from(controls.getElementsByClassName('radio-button'))
  const getCheckedControl = () => {
    return buttons.find(button => button.checked === true).id
  }
  
  const canvas = document.getElementById('canvas')
  canvas.width = 800
  canvas.height = 600

  canvas.addEventListener('click', (e) => {
    const bounds = canvas.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = -(e.clientY - bounds.bottom)

    switch (getCheckedControl()) {
      case "pattern-drop":
        operations.unshift(new Drop(x, y))
        break;
      case "pattern-line":
        operations.unshift(new Line(x, y, x + 1, y + 1))
        break;
      case "pattern-comb":
      default:
        break;
    }
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
	gl.clearColor(0.1, 0.1, 0.1, 0.1)

  const vertexPositionAttribute = gl.getAttribLocation(program, 'vertexPosition')
  const resolutionUniform = gl.getUniformLocation(program, 'resolution')
  const colorsUniform = gl.getUniformLocation(program, 'colors')
  const operationCountUniform = gl.getUniformLocation(program, 'operationCount')
  const operationTypesUniform = gl.getUniformLocation(program, 'operationTypes')
  const operationPositionsUniform = gl.getUniformLocation(program, 'operationPositions')
  const operationArgsUniform = gl.getUniformLocation(program, 'operationArgs')

	const vertexPositionBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW)

	function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    if (operations.length > 0) {
      const operationTypes = operations.map(op => op.type())
      const operationPositions = operations.map(op => op.position()).reduce((acc, val) => acc.concat(val))
      const operationArgs = operations.map(op => op.args()).reduce((acc, val) => acc.concat(val))

      gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
      gl.uniform3fv(colorsUniform, colors)
      gl.uniform1i(operationCountUniform, operations.length)
      gl.uniform1iv(operationTypesUniform, operationTypes)
      gl.uniform4fv(operationPositionsUniform, operationPositions)
      gl.uniform2fv(operationArgsUniform, operationArgs)

      gl.enableVertexAttribArray(vertexPositionAttribute)
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      operations[0].update()
    }  

		requestAnimationFrame(draw)
	}

	draw();
})