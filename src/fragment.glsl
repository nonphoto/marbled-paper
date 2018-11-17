precision mediump float;

const bool ANTIALIASING = false;

const float ALPHA = 250.0;
const float LAMBDA = 20.0;

const int TYPE_DROP = 0;
const int TYPE_LINE = 1;
const int TYPE_COMB = 2;
const int TYPE_SMUDGE = 3;

const int MAX_COLORS = 8;
const int MAX_PATTERNS = 256;

uniform vec2 resolution;

uniform vec3 colors[MAX_COLORS];
uniform vec3 backgroundColor;

uniform int operationCount;
uniform int operationTypes[MAX_PATTERNS];
uniform int operationColors[MAX_PATTERNS];
uniform vec4 operationCoordinates[MAX_PATTERNS];
uniform float lastOperationScale;

bool circleTest(vec2 p, vec2 c, float r) {
  return length(p - c) < r;
}

vec4 getColorAtIndex(int i) {
  for (int j = 0; j < MAX_COLORS; j++) {
    if (j == i) {
      return vec4(colors[j], 1);
    }
  }
  return vec4(1, 0, 1, 1);
}

vec4 getColorAtPosition(vec2 position) {
  vec2 p = position;

  for (int i = 0; i < MAX_PATTERNS; i++) {
    if (i >= operationCount) {
      break;
    }

    float scale = 1.0;
    if (i == 0) {
      scale = lastOperationScale;
    }

    int type = operationTypes[i];
    int colorIndex = operationColors[i];
    vec2 a = operationCoordinates[i].xy;
    vec2 b = operationCoordinates[i].zw;

    if (type == TYPE_DROP) {
      vec2 d = p - a;
      float r = scale * length(b - a);
      float l = length(d);
      if (l - r < 0.0) {
        return getColorAtIndex(colorIndex);
      }
      else {
        float l2 = sqrt((l * l) - (r * r));
        p = a + (d / l) * l2;
      }
    }

    else if (type == TYPE_LINE) {
      vec2 m = normalize(b - a);
      vec2 n = vec2(-m.y, m.x);
      vec2 d = p - a;
      float l = length(dot(d, n));
      float l2 = (ALPHA * LAMBDA) / (l + LAMBDA);
      p = p - (m * l2 * scale);
    }

    else if (type == TYPE_COMB) {
      vec2 m = normalize(b - a);
      vec2 n = vec2(-m.y, m.x);
      vec2 d = p - a;
      float s2 = length(b - a);
      float s = s2 / 2.0;
      float l = length(dot(d, n));
      float l2 = abs(mod(l, s2) - s);
      float l3 = (ALPHA * LAMBDA) / (s - l2 + LAMBDA);
      float l4 = l3 * (l2 / s) * (l2 / s) ;
      p = p - (m * l4 * scale);
    }

    else if (type == TYPE_SMUDGE) {
      vec2 m = normalize(b - a);
      vec2 n = vec2(-m.y, m.x);
      vec2 d = p - a;
      float s = length(b - a);
      float l = length(dot(d, n));
      float l2 = abs(mod(l, 2.0) - 1.0);
      float l3 = (s * LAMBDA) / (1.0 - l2 + LAMBDA);
      float l4 = l3 * l2 * l2 ;
      p = p - (m * l4 * scale);
    }

    else {
      break;
    }
  }

  return vec4(backgroundColor, 1);
}

void main() {
  gl_FragColor = getColorAtPosition(gl_FragCoord.xy);
}
