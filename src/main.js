import * as three from 'three'

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
  'palette-1': [0.59, 0.05, 0.07],
  'palette-2': [0.10, 0.14, 0.10],
  'palette-3': [0.18, 0.15, 0.54],
  'palette-4': [0.86, 0.74, 0.39],
  'palette-5': [1.00, 1.00, 1.00],
}

const colors = {
  'palette-1': [
    0.10, 0.22, 0.66,
    1.00, 0.96, 0.91,
    0.05, 0.13, 0.31,
    0.89, 0.75, 0.33
  ],
  'palette-2': [
    0.20, 0.25, 0.19,
    0.40, 0.47, 0.38,
    0.58, 0.63, 0.55,
    0.87, 0.88, 0.79
  ],
  'palette-3': [
    0.74, 0.18, 0.36,
    0.59, 0.18, 0.75,
    0.15, 0.42, 0.63,
    0.14, 0.68, 0.58
  ],
  'palette-4': [
    0.62, 0.16, 0.19,
    0.31, 0.42, 0.48,
    0.75, 0.38, 0.38,
    0.03, 0.10, 0.28
  ],
  'palette-5': [
    0.00, 0.76, 0.79,
    0.69, 0.05, 0.67,
    1.00, 1.00, 0.00,
    0.18, 0.07, 0.49
  ]
}

const types = {
  'pattern-drop': 0,
  'pattern-line': 1,
  'pattern-comb': 2,
  'pattern-smudge': 3
}

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

function getSelectedButtonId(buttons) {
  return buttons.find(button => button.checked).id
}

function getPositionInCanvas(canvas, x, y) {
  const bounds = canvas.getBoundingClientRect()
  const nx = x - bounds.left
  const ny = -(y - bounds.bottom)
  return [nx, ny]
}

const refs = {}
refs.cursor = document.getElementById('cursor')
refs.cursorGraphics = Array.from(refs.cursor.getElementsByTagName('svg'))
refs.renderContainer = document.getElementById('render-container')
refs.patterns = document.getElementById('patterns')
refs.patternButtons = Array.from(refs.patterns.getElementsByClassName('radio-button'))
refs.palettes = document.getElementById('palettes')
refs.paletteButtons = Array.from(refs.palettes.getElementsByClassName('radio-button'))
refs.paletteLabels = Array.from(refs.palettes.getElementsByTagName('label'))

let mouse = new three.Vector2()
let mouseStart = new three.Vector2()

let operations = []
let lastOperationScale = 0

const vw = window.innerWidth
const vh = window.innerHeight

const scene = new three.Scene()
const camera = new three.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
camera.position.z = 1

const renderer = new three.WebGLRenderer()
const canvas = renderer.domElement
renderer.setSize(vw, vh)
refs.renderContainer.appendChild(canvas)

const geometry = new three.PlaneGeometry(2, 2)
const material = new three.MeshBasicMaterial({ color: 0x0000ff })
const plane = new three.Mesh(geometry, material)
scene.add(plane)

renderer.render(scene, camera)

function initControls() {
  refs.paletteLabels.forEach(label => {
    const c1 = backgroundColors[label.htmlFor]
    const c2 = colors[label.htmlFor]

    const r1 = Math.floor(255 * c1[0])
    const g1 = Math.floor(255 * c1[1])
    const b1 = Math.floor(255 * c1[2])
    label.style.background = `rgb(${r1}, ${g1}, ${b1})`

    for (let i = 0; i < 4; i++) {
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
}

function handleMouseDown(event) {
  if (event.button !== 0) return

  const pattern = getSelectedButtonId(refs.patternButtons)
  refs.cursorGraphics.forEach((graphic) => {
    if (graphic.dataset.pattern === pattern) {
      graphic.classList.add('is-visible')
    }
    else {
      graphic.classList.remove('is-visible')
    }
  })

  mouseStart = mouse.clone()

  cursor.style.opacity = 1
  cursor.style.transform = `translate(${mouseStart.x}px, ${mouseStart.y}px)`
}

function handleMouseMove(event) {
  mouse.x = event.clientX
  mouse.y = event.clientY

  if (mouseStart) {
    const difference = mouse.clone().sub(mouseStart)
    const strokeWidth = 1 / difference.length

    cursor.style.transform = `translate(${mouseStart.x}px, ${mouseStart.y}px) scale(${difference.length}) rotate(${difference.angle}rad)`
    cursor.style['stroke-width'] = `${strokeWidth}px`
  }
}

function handleMouseUp(event) {
  cursor.style.opacity = 0

  if (!mouseStart) return

  if (getSelectedButtonId(refs.patternButtons) === 'pattern-spray') {
    const difference = mouse.clone().sub(mouseStart)
    const canvasArea = vw * vh
    const dropCount = Math.min(Math.floor(canvasArea / difference.length), 25)
    const dropRadius = difference.length / 10
    const dropColor = Math.floor(Math.random() * colorCount)

    for (let i = 0; i < dropCount; i++) {
      const x = Math.random() * vw
      const y = Math.random() * vh

      const p1 = [x, y]
      const p2 = [x, y + dropRadius]
      const type = types['pattern-drop']

      const operation = new Operation(p1, p2, dropColor, type)
      operations.unshift(operation)
    }
  }
  else {
    const p1 = getPositionInCanvas(canvas, mouseStart.x, mouseStart.y)
    const p2 = getPositionInCanvas(canvas, mouse.x, mouse.y)

    const color = Math.floor(Math.random() * colorCount)
    const type = types[getSelectedButtonId(refs.patternButtons)]

    const operation = new Operation(p1, p2, color, type)
    operations.unshift(operation)
  }

  mouseStart = null
  lastOperationScale = 0
}

canvas.addEventListener('mousedown', handleMouseDown)
document.addEventListener('mousemove', handleMouseMove)
document.addEventListener('mouseup', handleMouseUp)

initControls()

function initWebGl() {
  let gl = null
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!gl) {
    alert('Unable to initialize WebGL. Maybe your browser doesn\'t support it.')
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

  draw()
}