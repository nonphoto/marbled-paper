precision mediump float;

const int MAX_DROPS = 256;

uniform int dropCount;
uniform vec2 dropPositions[MAX_DROPS];
uniform float dropSizes[MAX_DROPS];
uniform vec3 dropColors[MAX_DROPS];

bool circleTest(vec2 p, vec2 c, float r) {
  return length(p - c) < r;
}

vec4 getColor(vec2 p, vec2 c, float r) {
  vec4 color = vec4(0.5, 0.5, 0.5, 1);

  vec2 d = p - c;
  float l = length(d);
  if (l - r < 0.0) {
    // Point came from inside drop
    color = vec4(dropColors[0], 1);
  }
  else {
    vec2 p2 = p - (d / l) * r;
    for (int i = 1; i < MAX_DROPS; i++) {
      if (i > dropCount) {
        break;
      }

      if (circleTest(p2, dropPositions[i], dropSizes[i])) {
        color = vec4(dropColors[i], 1);
      }
    }
  }

  return color;
}

void main() {
  gl_FragColor = getColor(gl_FragCoord.xy, dropPositions[0], dropSizes[0]);
}