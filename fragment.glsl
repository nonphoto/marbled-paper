precision mediump float;

uniform vec2 dropPositions[1];
uniform float dropSizes[1];
uniform vec3 dropColors[1];

bool circleTest(vec2 p, vec2 c, float r) {
  return length(p - c) < r;
}

void main() {
  vec4 color;
  
  if (circleTest(gl_FragCoord.xy, dropPositions[0], dropSizes[0])) {
    color = vec4(dropColors[0], 1);
  }
  else {
    color = vec4(0.5, 0.5, 0.5, 1);
  }

  gl_FragColor = color;
}