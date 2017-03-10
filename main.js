const vertexPositions = [
  -1, -1, 0,
  -1, 1, 0,
  1, -1, 0,
  1, 1, 0
]

const minSize = 50
const viscosity = 10
const colorCount = 4

const backgroundColors = {
  "palette-1": [0.10, 0.22, 0.66],
  "palette-2": [0.10, 0.14, 0.10],
  "palette-3": [1.00, 0.22, 0.22],
  "palette-4": [0.84, 0.53, 0.52],
  "palette-5": [1.00, 1.00, 1.00],
}

const colors = {
  "palette-1": [
    0.59, 0.05, 0.07,
    1.00, 0.96, 0.91,
    0.05, 0.13, 0.31,
    0.89, 0.75, 0.33
  ],
  "palette-2": [
    0.20, 0.25, 0.19,
    0.40, 0.47, 0.38,
    0.58, 0.63, 0.55,
    0.87, 0.88, 0.79
  ],
  "palette-3": [
    0.29, 0.37, 0.40,
    0.09, 0.28, 0.32,
    0.15, 0.22, 0.23,
    0.08, 0.12, 0.16
  ],
  "palette-4": [
    0.24, 0.22, 0.28,
    0.45, 0.33, 0.38,
    0.95, 0.69, 0.69,
    0.92, 0.82, 0.77
  ],
  "palette-5": [
    0.00, 0.76, 0.79,
    0.69, 0.05, 0.67,
    1.00, 1.00, 0.00,
    0.18, 0.07, 0.49
  ]
}

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

function getSelectedButtonId(buttons) {
  return buttons.find(button => button.checked).id
}

function getPositionInCanvas(canvas, x, y) {
  const bounds = canvas.getBoundingClientRect()
  const nx = x - bounds.left
  const ny = -(y - bounds.bottom)
  return [nx, ny]
}

require(['domReady!', 'text!vertex.glsl', 'text!fragment.glsl'], (document, vertexSource, fragmentSource) => {
  const canvas = document.getElementById('canvas')
  canvas.width = 800
  canvas.height = 600

  const patterns = document.getElementById('patterns')
  const patternButtons = Array.from(patterns.getElementsByClassName('radio-button'))

  const palettes = document.getElementById('palettes')
  const paletteButtons = Array.from(palettes.getElementsByClassName('radio-button'))
  const paletteLabels = Array.from(palettes.getElementsByTagName('label'))
  paletteLabels.forEach(label => {
    const c1 = backgroundColors[label.htmlFor]
    const c2 = colors[label.htmlFor]

    const r1 = Math.floor(255 * c1[0])
    const g1 = Math.floor(255 * c1[1])
    const b1 = Math.floor(255 * c1[2])
    label.style.background = `rgb(${r1}, ${g1}, ${b1})`

    for (i = 0; i < 4; i++) {
      const dot = document.createElement('span')
      dot.classList.add('palette-color')

      const j = i * 3      
      const r2 = Math.floor(255 * c2[j])
      const g2 = Math.floor(255 * c2[j + 1])
      const b2 = Math.floor(255 * c2[j + 2])
      dot.style.background = `rgb(${r2}, ${g2}, ${b2})`

      label.appendChild(dot)
    }
  })

  const cursor = document.getElementById('cursor')
  const cursorGraphics = Array.from(cursor.getElementsByTagName('svg'))

  let startX = 0
  let startY = 0
  let isDragging = false

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) { return }

    const pattern = getSelectedButtonId(patternButtons)
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

    if (getSelectedButtonId(patternButtons) === "pattern-spray") {
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
      const type = types[getSelectedButtonId(patternButtons)]

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
  gl.clearColor(0.1, 0.1, 0.1, 1)

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

      const selectedButtonId = getSelectedButtonId(paletteButtons)
      const selectedBackground = backgroundColors[selectedButtonId]
      const selectedColors = colors[selectedButtonId]

      gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
      gl.uniform3fv(colorsUniform, selectedColors)
      gl.uniform3f(backgroundColorUniform, selectedBackground[0], selectedBackground[1], selectedBackground[2])
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

    const resetButton = document.getElementById('reset-button')
    resetButton.addEventListener('click', () => {
      operations = []
      const c = backgroundColors[getSelectedButtonId(paletteButtons)]
      gl.clearColor(c[0], c[1], c[2], 1)
      gl.clear(gl.COLOR_BUFFER_BIT)      
    })

    requestAnimationFrame(draw)
  }

  draw();
})