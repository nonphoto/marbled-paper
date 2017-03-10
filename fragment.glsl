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

  return getColorAtIndex(0);
}

void main() {
  if (ANTIALIASING) {
    vec2 p = gl_FragCoord.xy;
    vec2 p1 = vec2(0.125, 0.375);
    vec2 p2 = vec2(-0.375, 0.125);
    vec2 p3 = vec2(0.375, -0.125);
    vec2 p4 = vec2(-0.125, -0.375);

    vec4 c1 = getColorAtPosition(p + p1);
    vec4 c2 = getColorAtPosition(p + p2);
    vec4 c3 = getColorAtPosition(p + p3);
    vec4 c4 = getColorAtPosition(p + p4);

    gl_FragColor = mix(mix(c1, c2, 0.5), mix(c3, c4, 0.5), 0.5);
  }
  else {
    gl_FragColor = getColorAtPosition(gl_FragCoord.xy);
  }
}