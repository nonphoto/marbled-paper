const vertexPositions = [
	-1, -1, 0,
	-1, 1, 0,
	1, -1, 0,
	1, 1, 0
]

const minSize = 50
const viscosity = 10

const colorCount = 4
const backgroundColor = [0.59, 0.05, 0.07] 
const colors = [
  1.00, 0.96, 0.91,
  0.10, 0.22, 0.66,
  0.05, 0.13, 0.31,
  0.89, 0.75, 0.33
]

const types = {
  "pattern-drop": 0,
  "pattern-line": 1,
  "pattern-comb": 2,
  "pattern-smudge": 3
}

let operations = []
let lastOperationScale = 0;

class Operation {
  constructor(p1, p2, color, type) {
    this.p1 = p1
    this.p2 = p2
    this.color = color
    this.type = type
  }

  coordinates() {
    return this.p1.concat(this.p2)
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

function length(x, y) {
    return Math.sqrt((x * x) + (y * y)) 
}

function getPositionInCanvas(canvas, x, y) {
  const bounds = canvas.getBoundingClientRect()
  const nx = x - bounds.left
  const ny = -(y - bounds.bottom)
  return [nx, ny]
}

require(['domReady!', 'text!vertex.glsl', 'text!fragment.glsl'], (document, vertexSource, fragmentSource) => {
  const controls = document.getElementById('controls')
  const buttons = Array.from(controls.getElementsByClassName('radio-button'))
  const getCheckedControl = () => {
    return buttons.find(button => button.checked === true)
  }

  const cursor = document.getElementById('cursor')
  const cursorGraphics = Array.from(cursor.getElementsByTagName('svg'))
  
  const canvas = document.getElementById('canvas')
  canvas.width = 800
  canvas.height = 600

  let startX = 0
  let startY = 0
  let isDragging = false

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) { return }

    const pattern = getCheckedControl().id    
    cursorGraphics.forEach((graphic) => {
      if (graphic.dataset.pattern === pattern) {
        graphic.classList.add('is-visible')
      }
      else {
        graphic.classList.remove('is-visible')
      }
    })

    startX = e.clientX
    startY = e.clientY
    isDragging = true

    cursor.style.opacity = 1;
    cursor.style.transform = `translate(${startX}px, ${startY}px)`
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) { return }

    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const scale = length(dx, dy) * 2
    const strokeWidth = 2 / scale
    const angle = Math.atan2(dx, -dy)

    cursor.style.transform = `translate(${startX}px, ${startY}px) scale(${scale}) rotate(${angle}rad)`
    cursor.style['stroke-width'] = `${strokeWidth}px`
  })

  document.addEventListener('mouseup', (e) => {
    cursor.style.opacity = 0;

    if (!isDragging) { return }
    isDragging = false
    lastOperationScale = 0

    if (getCheckedControl().id === "pattern-spray") {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const l = length(dx, dy)
      const canvasArea = canvas.offsetWidth * canvas.offsetHeight
      const dropCount = Math.min(Math.floor(canvasArea / l), 25);
      const dropRadius = l / 10
      const dropColor = Math.floor(Math.random() * colorCount)

      for (i = 0; i < dropCount; i++) {
        const x = Math.random() * canvas.offsetWidth
        const y = Math.random() * canvas.offsetHeight

        const p1 = [x, y]
        const p2 = [x, y + dropRadius]
        const type = types["pattern-drop"]
        
        const operation = new Operation(p1, p2, dropColor, type)
        operations.unshift(operation)
      }
    }
    else {
      const p1 = getPositionInCanvas(canvas, startX, startY)
      const p2 = getPositionInCanvas(canvas, e.clientX, e.clientY)

      const color = Math.floor(Math.random() * colorCount)
      const type = types[getCheckedControl().id]

      const operation = new Operation(p1, p2, color, type)
      operations.unshift(operation)
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
	gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], 1)

  const vertexPositionAttribute = gl.getAttribLocation(program, 'vertexPosition')
  const resolutionUniform = gl.getUniformLocation(program, 'resolution')
  const colorsUniform = gl.getUniformLocation(program, 'colors')
  const backgroundColorUniform = gl.getUniformLocation(program, 'backgroundColor')
  const operationCountUniform = gl.getUniformLocation(program, 'operationCount')
  const operationTypesUniform = gl.getUniformLocation(program, 'operationTypes')
  const operationColorsUniform = gl.getUniformLocation(program, 'operationColors')
  const operationCoordinatesUniform = gl.getUniformLocation(program, 'operationCoordinates')
  const lastOperationScaleUniform = gl.getUniformLocation(program, 'lastOperationScale')

	const vertexPositionBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW)

	function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    if (operations.length > 0) {
      const operationTypes = operations.map(op => op.type)
      const operationColors = operations.map(op => op.color)
      const operationCoordinates = operations.map(op => op.coordinates()).reduce((acc, val) => acc.concat(val))

      gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
      gl.uniform3fv(colorsUniform, colors)
      gl.uniform3f(backgroundColorUniform, backgroundColor[0], backgroundColor[1], backgroundColor[2])
      gl.uniform1i(operationCountUniform, operations.length)
      gl.uniform1iv(operationTypesUniform, operationTypes)
      gl.uniform1iv(operationColorsUniform, operationColors)
      gl.uniform4fv(operationCoordinatesUniform, operationCoordinates)
      gl.uniform1f(lastOperationScaleUniform, lastOperationScale)

      gl.enableVertexAttribArray(vertexPositionAttribute)
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      lastOperationScale += (1 - lastOperationScale) / viscosity
    }  

		requestAnimationFrame(draw)
	}

	draw();
})