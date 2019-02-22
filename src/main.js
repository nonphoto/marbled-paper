import getPositionInBounds from './get-position-in-bounds'
import getContext from './get-context'
import vertexSource from './vertex.glsl'
import fragmentSource from './fragment.glsl'

import loop from 'raf-loop'
import drawTriangle from 'a-big-triangle'
import createShader from 'gl-shader'
import {vec2} from 'gl-matrix'
import ControlKit from 'controlkit'

const viscosity = 10

const options = {
  operation: ['drop', 'line', 'comb', 'smudge'],
  operationSelection: 'drop',
  palette: [
    [86, 84, 240],
    [87, 1, 153],
    [186, 26, 38],
    [240, 104, 54],
    [255, 219, 93]
  ]
}

options.color = options.palette[0]
options.backgroundColor = options.palette[1]

const controls = new ControlKit()
const panel = controls.addPanel()
panel.addSelect(options, 'operation', { target: 'operationSelection'})
panel.addColor(options, 'color', { colorMode: 'rgb', presets: 'palette' })

// const backgroundColors = {
//   'palette-1': [0.59, 0.05, 0.07],
//   'palette-2': [0.10, 0.14, 0.10],
//   'palette-3': [0.18, 0.15, 0.54],
//   'palette-4': [0.86, 0.74, 0.39],
//   'palette-5': [1.00, 1.00, 1.00],
// }

// const colors = {
//   'palette-1': [
//     0.10, 0.22, 0.66,
//     1.00, 0.96, 0.91,
//     0.05, 0.13, 0.31,
//     0.89, 0.75, 0.33
//   ],
//   'palette-2': [
//     0.20, 0.25, 0.19,
//     0.40, 0.47, 0.38,
//     0.58, 0.63, 0.55,
//     0.87, 0.88, 0.79
//   ],
//   'palette-3': [
//     0.74, 0.18, 0.36,
//     0.59, 0.18, 0.75,
//     0.15, 0.42, 0.63,
//     0.14, 0.68, 0.58
//   ],
//   'palette-4': [
//     0.62, 0.16, 0.19,
//     0.31, 0.42, 0.48,
//     0.75, 0.38, 0.38,
//     0.03, 0.10, 0.28
//   ],
//   'palette-5': [
//     0.00, 0.76, 0.79,
//     0.69, 0.05, 0.67,
//     1.00, 1.00, 0.00,
//     0.18, 0.07, 0.49
//   ]
// }

const types = {
  'drop': 0,
  'line': 1,
  'comb': 2,
  'smudge': 3
}

class Operation {
  constructor(start, end, color, type) {
    this.start = start
    this.end = end
    this.color = color
    this.type = type
    this.scale = 1
  }

  update() {
    if (1 - this.scale > 0.0001) {
      this.scale += (1 - this.scale) / viscosity
    }
    else {
      this.scale = 1
    }
  }
}

let mouse = vec2.create()
let isMouseDown = false
let operations = []

const canvas = document.querySelector('#render-canvas')
const bounds = canvas.getBoundingClientRect()
const gl = getContext(canvas)

canvas.width = 512
canvas.height = 512

canvas.addEventListener('mousedown', () => {
  if (event.button !== 0) return

  const op = operations.pop()
  operations.unshift(op)
  op.color = [...options.color]
  op.start = getPositionInBounds(bounds, mouse)
  op.end = [...op.start]
  op.type = types[options.operationSelection]

  isMouseDown = true
})

document.addEventListener('mousemove', () => {
  mouse[0] = event.clientX
  mouse[1] = event.clientY

  if (isMouseDown) {
    const op = operations[0]
    op.end = getPositionInBounds(bounds, mouse)
  }
})

document.addEventListener('mouseup', () => {
  isMouseDown = false
})

gl.clearColor(0, 0, 1, 1)
gl.viewport(0, 0, canvas.width, canvas.height)
gl.clear(gl.COLOR_BUFFER_BIT)

for (let i = 0; i < 128; i++) {
  const operation = new Operation([0, 0], [0, 0], [0, 0, 0], 0)
  operations.unshift(operation)
}

const shader = createShader(gl, vertexSource, fragmentSource)
shader.bind()

shader.uniforms.resolution = [canvas.width, canvas.height]
shader.uniforms.backgroundColor = options.backgroundColor

const engine = loop(() => {
  shader.uniforms.operations = operations

  drawTriangle(gl)
})

engine.start()
