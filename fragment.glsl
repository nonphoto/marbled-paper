precision mediump float;

const int MAX_DROPS = 256;

uniform int dropCount;
uniform vec2 dropPositions[MAX_DROPS];
uniform float dropSizes[MAX_DROPS];
uniform vec3 dropColors[MAX_DROPS];

bool circleTest(vec2 p, vec2 c, float r) {
  return length(p - c) < r;
}

void main() {
  vec4 color = vec4(0.5, 0.5, 0.5, 1);
  
  for (int i = 0; i < MAX_DROPS; i++) {
    if (i > dropCount) {
      break;
    }
    if (circleTest(gl_FragCoord.xy, dropPositions[i], dropSizes[i])) {
      color = vec4(dropColors[i], 1);
    }
  }

  gl_FragColor = color;
}