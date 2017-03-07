precision mediump float;

const int MAX_DROPS = 256;

uniform int dropCount;
uniform vec2 dropPositions[MAX_DROPS];
uniform float dropSizes[MAX_DROPS];
uniform vec3 dropColors[MAX_DROPS];

bool circleTest(vec2 p, vec2 c, float r) {
  return length(p - c) < r;
}

vec4 getColor(vec2 position) {
  vec2 p = position;

  for (int i = 0; i < MAX_DROPS; i++) {
    if (i >= dropCount) {
      break;
    }

    vec2 c = dropPositions[i];
    float r = dropSizes[i];
    
    vec2 d = p - c;
    float l = length(d);
    if (l - r < 0.0) {
      return vec4(dropColors[i], 1);
    }
    else {
      float l2 = sqrt((l * l) - (r * r));
      p = c + (d / l) * l2;
    }
  }

  return vec4(0.5, 0.5, 0.5, 1);
}

void main() {
  gl_FragColor = getColor(gl_FragCoord.xy);
}