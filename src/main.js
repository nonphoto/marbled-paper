import getPositionInBounds from './get-position-in-bounds'
import getContext from './get-context'
import vertexSource from './vertex.glsl'
import fragmentSource from './fragment.glsl'

import loop from 'raf-loop'
import drawTriangle from 'a-big-triangle'
import createShader from 'gl-shader'
import {vec2} from 'gl-matrix'

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

  get coordinates() {
    return this.p1.concat(this.p2)
  }
}

function getSelectedButtonId(buttons) {
  return buttons.find(button => button.checked).id
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

let mouse = vec2.create()
let mouseStart = vec2.create()
let operations = []
let lastOperationScale = 0

const vw = window.innerWidth
const vh = window.innerHeight

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

  mouseStart = vec2.clone(mouse)

  cursor.style.opacity = 1
  cursor.style.transform = `translate(${mouseStart.x}px, ${mouseStart.y}px)`
}

function handleMouseMove(event) {
  mouse[0] = event.clientX
  mouse[1] = event.clientY

  if (mouseStart) {
    const difference = vec2.subtract([], mouse, mouseStart)

    const s = vec2.length(difference)
    const a = vec2.angle([1, 0], difference)
    const [x, y] = mouseStart

    cursor.style.transform = `translate(${x}px, ${y}px) scale(${2 * s}) rotate(${a}rad)`
    cursor.style.strokeWidth = `${1 / s}px`
  }
}

function handleMouseUp(event) {
  cursor.style.opacity = 0

  if (!mouseStart) return

  if (getSelectedButtonId(refs.patternButtons) === 'pattern-spray') {
    const difference = vec2.subtract([], mouse, mouseStart)

    const l = vec2.length(difference)

    const canvasArea = vw * vh
    const dropCount = Math.min(Math.floor(canvasArea / l), 25)
    const dropRadius = l / 10
    const dropColor = Math.floor(Math.random() * colorCount)

    for (let i = 0; i < dropCount; i++) {
      const x = Math.random() * vw
      const y = Math.random() * vh

      const p1 = [x, y]
      const p2 = [x, y + dropRadius]
      const type = types['pattern-drop']

      const operation = new Operation(p1, p2, dropColor, type)
      operations.unshift(operation)
      operations.pop()
    }
  }
  else {
    const bounds = canvas.getBoundingClientRect()
    const p1 = getPositionInBounds(bounds, mouseStart)
    const p2 = getPositionInBounds(bounds, mouse)

    const color = Math.floor(Math.random() * colorCount)
    const type = types[getSelectedButtonId(refs.patternButtons)]

    const operation = new Operation(p1, p2, color, type)
    operations.unshift(operation)
  }

  mouseStart = null
  lastOperationScale = 0
}

const canvas = document.querySelector('#render-canvas')
const gl = getContext(canvas)

canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight

canvas.addEventListener('mousedown', handleMouseDown)
document.addEventListener('mousemove', handleMouseMove)
document.addEventListener('mouseup', handleMouseUp)

gl.clearColor(0, 0, 1, 1)
gl.viewport(0, 0, canvas.width, canvas.height)
gl.clear(gl.COLOR_BUFFER_BIT)

for (let i = 0; i < 16; i++) {
  const color = Math.floor(Math.random() * colorCount)
  const operation = new Operation([0, 0], [0.1, 0.1], color, 0)
  operations.unshift(operation)
}

const shader = createShader(gl, vertexSource, fragmentSource)
shader.bind()

shader.uniforms.resolution = [canvas.width, canvas.height]
shader.uniforms.colors = [
  [0.10, 0.22, 0.66],
  [1.00, 0.96, 0.91],
  [0.05, 0.13, 0.31],
  [0.89, 0.75, 0.33]
]
shader.uniforms.backgroundColor = [0.59, 0.05, 0.07]
shader.uniforms.operationCount = operations.length

const engine = loop(() => {
  shader.uniforms.operationTypes = operations.map(op => op.type)
  shader.uniforms.operationColors = operations.map(op => op.color)
  shader.uniforms.operationCoordinates = operations.map(op => op.coordinates)
  shader.uniforms.lastOperationScale

  drawTriangle(gl)
})

engine.start()
