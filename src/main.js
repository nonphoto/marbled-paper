import getPositionInBounds from './get-position-in-bounds.js'
import getContext from './get-context.js'
import vertexSource from './marble.vert'
import fragmentSource from './marble.frag'
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

function randomInRange(min, max) {
  return Math.random() * (max - min) + min
}

function toFloatColor(c) {
  return hexRgb(c, {format: 'array'}).map(x => x / 255)
}

const viscosity = 10

const stats = new Stats()

window.debugOptions = {
  showStats: () => {
    stats.showPanel(1)
    document.body.appendChild(stats.dom)
  },
  background: true,
  foreground: true,
}

const options = {
  operationPalette: ['drop-small', 'drop-large', 'spray-narrow', 'spray-wide', 'comb-narrow', 'comb-wide', 'smudge'],
  colorPalette: palettes[0],
}

options.color = options.colorPalette[1]
options.operation = options.operationPalette[0]

const controls = new ControlKit()
const panel = controls.addPanel()
panel.addSelect(options, 'operationPalette', { target: 'operation' })
panel.addColor(options, 'color', { colorMode: 'hex', presets: 'colorPalette', })

let mouse = vec2.create()
let isMouseDown = false
let operations = []

const canvas = document.querySelector('#render-canvas')
const bounds = canvas.getBoundingClientRect()
const gl = getContext(canvas)

canvas.width = 1024
canvas.height = 1024

function createOperation() {
  return {
    type: -1,
    color: [0, 0, 0, 0],
    start: [0, 0],
    end: [0, 0],
    scale: 0,
  }
}

function shiftOperations() {
  const op = operations.pop()
  operations.unshift(op)

  const previous = fbos[fboIndex]
  const next = fbos[fboIndex ^= 1]
  next.bind()
  shader.uniforms.backgroundTexture = previous.color[0].bind()
  shader.uniforms.operationCount = 1
  shader.uniforms.operations = operations
  drawTriangle(gl)

  return op
}

function addDrop(start, scale) {
  const op = shiftOperations()
  op.type = 0
  op.color = toFloatColor(options.color)
  op.start = [...start]
  op.end = [...start]
  op.end[0] += scale
  op.scale = 1
  return op
}

function addComb(start, scale) {
  const op = shiftOperations()
  op.type = 1
  op.color = toFloatColor(options.color)
  op.start = [...start]
  op.end = [...start]
  op.scale = scale
  return op
}

canvas.addEventListener('mousedown', () => {
  if (event.button !== 0) {
    isMouseDown = false
    return
  }

  const position = getPositionInBounds(bounds, mouse)

  if (options.operation === 'drop-small') {
    addDrop(position, randomInRange(0.02, 0.1))
  } else if (options.operation === 'drop-large') {
    addDrop(position, randomInRange(0.1, 0.2))
  } else if (options.operation === 'comb-narrow') {
    addComb(position, randomInRange(0.1, 0.3))
  } else if (options.operation === 'comb-wide') {
    addComb(position, randomInRange(0.3, 0.6))
  } else if (options.operation === 'smudge') {
    addComb(position, 0)
  }

  isMouseDown = true
})

document.addEventListener('mousemove', () => {
  mouse[0] = event.clientX
  mouse[1] = event.clientY

  if (isMouseDown) {
    const op = operations[0]
    const position = getPositionInBounds(bounds, mouse)

    if (options.operation === 'comb-narrow') {
      op.end = position
    } else if (options.operation === 'comb-wide') {
      op.end = position
    } else if (options.operation === 'smudge') {
      op.end = position
    }
  }
})

document.addEventListener('mouseup', () => {
  isMouseDown = false
})

gl.clearColor(...toFloatColor(options.colorPalette[0]))
gl.viewport(0, 0, canvas.width, canvas.height)
gl.clear(gl.COLOR_BUFFER_BIT)

for (let i = 0; i < 32; i++) {
  operations.push(createOperation())
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
  if (isMouseDown) {
    const position = getPositionInBounds(bounds, mouse)

    if (options.operation === 'spray-narrow') {
      addDrop(position, randomInRange(0.01, 0.02))
    } else if (options.operation === 'spray-wide') {
      addDrop(position, randomInRange(0.01, 0.02))
    }
  }

  stats.begin()
  unbindFBO(gl)
  shader.uniforms.backgroundTexture = window.debugOptions.background ? fbos[fboIndex].color[0].bind() : emptyTexture.bind()
  shader.uniforms.operationCount = window.debugOptions.foreground ? operations.length : 0
  shader.uniforms.operations = operations
  drawTriangle(gl)
  stats.end()
})

engine.start()
