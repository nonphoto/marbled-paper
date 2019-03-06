import getPositionInBounds from './get-position-in-bounds.js'
import getContext from './get-context.js'
import vertexSource from './vertex.glsl'
import fragmentSource from './fragment.glsl'
import unbindFBO from './unbind-fbo.js'
import palettes from './palettes.js'

import loop from 'raf-loop'
import drawTriangle from 'a-big-triangle'
import createShader from 'gl-shader'
import createTexture from 'gl-texture2d'
import createFBO from 'gl-fbo'
import { vec2 } from 'gl-matrix'
import hexRgb from 'hex-rgb'
import ControlKit from 'controlkit'
import Stats from 'stats.js'

function toFloatColor(c) {
  return hexRgb(c, {format: 'array'}).map(x => x / 255)
}

const viscosity = 10

const options = {
  operation: ['drop', 'comb'],
  operationSelection: 'drop',
  size: ['tiny', 'small', 'medium', 'large'],
  sizeSelection: 'medium',
  palette: palettes[0],
  background: true,
  foreground: true,
}

options.color = options.palette[1]

const controls = new ControlKit()
const panel = controls.addPanel()
panel.addSelect(options, 'operation', { target: 'operationSelection' })
panel.addSelect(options, 'size', { target: 'sizeSelection' })
panel.addColor(options, 'color', { colorMode: 'hex', presets: 'palette', })
panel.addCheckbox(options, 'background')
panel.addCheckbox(options, 'foreground')

class Operation {
  constructor() {
    this.start = [0, 0]
    this.end = [0, 0]
    this.color = [0, 0, 0, 0]
    this.type = -1
    this.size = 0
  }
}

var stats = new Stats()
stats.showPanel(1)
document.body.appendChild(stats.dom)

let mouse = vec2.create()
let isMouseDown = false
let operations = []

const canvas = document.querySelector('#render-canvas')
const bounds = canvas.getBoundingClientRect()
const gl = getContext(canvas)

canvas.width = 1024
canvas.height = 1024

canvas.addEventListener('mousedown', () => {
  if (event.button !== 0) {
    isMouseDown = false
    return
  }

  const op = operations.pop()
  operations.unshift(op)

  const previous = fbos[fboIndex]
  const next = fbos[fboIndex ^= 1]
  next.bind()
  shader.uniforms.backgroundTexture = previous.color[0].bind()
  shader.uniforms.operationCount = 1
  shader.uniforms.operations = operations
  drawTriangle(gl)

  op.color = toFloatColor(options.color)
  op.start = getPositionInBounds(bounds, mouse)
  op.end = [...op.start]
  op.type = options.operation.indexOf(options.operationSelection)
  op.size = options.size.indexOf(options.sizeSelection) + 1

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

gl.clearColor(...toFloatColor(options.palette[0]))
gl.viewport(0, 0, canvas.width, canvas.height)
gl.clear(gl.COLOR_BUFFER_BIT)

for (let i = 0; i < 32; i++) {
  const operation = new Operation()
  operations.unshift(operation)
}

const shader = createShader(gl, vertexSource, fragmentSource)
shader.bind()
shader.uniforms.operationCount = operations.length
shader.uniforms.resolution = [canvas.width, canvas.height]

const fbos = [
  createFBO(gl, [canvas.width, canvas.height], { depth: false }),
  createFBO(gl, [canvas.width, canvas.height], { depth: false })
]

fbos[0].bind()
gl.clear(gl.COLOR_BUFFER_BIT)
fbos[1].bind()
gl.clear(gl.COLOR_BUFFER_BIT)

let fboIndex = 0

const emptyTexture = createTexture(gl, [canvas.width, canvas.height])

const engine = loop(() => {
  stats.begin()
  unbindFBO(gl)
  shader.uniforms.backgroundTexture = options.background ? fbos[fboIndex].color[0].bind() : emptyTexture.bind()
  shader.uniforms.operationCount = options.foreground ? operations.length : 0
  shader.uniforms.operations = operations
  drawTriangle(gl)
  stats.end()
})

engine.start()
