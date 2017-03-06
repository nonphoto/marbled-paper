precision mediump float;

uniform vec3 dropPositions[1];

bool circleTest(vec2 p, vec2 c, float r) {
  return length(p - c) < r;
}

void main() {
  vec4 color;
  
  if (circleTest(gl_FragCoord.xy, dropPositions[0].xy, dropPositions[0].z)) {
    color = vec4(1, 0, 0, 1);
  }
  else {
    color = vec4(0, 0, 1, 1);
  }

  gl_FragColor = color;
}