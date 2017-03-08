precision mediump float;

const float ALPHA = 240.0;
const float LAMBDA = 8.0;

const int TYPE_DROP = 0;
const int TYPE_LINE = 1;

const int MAX_COLORS = 8;
const int MAX_PATTERNS = 256;

uniform vec3 colors[MAX_COLORS];

uniform int operationCount;
uniform int operationTypes[MAX_PATTERNS];
uniform vec2 operationPositions[MAX_PATTERNS];
uniform vec2 operationArgs[MAX_PATTERNS];

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

    int type = operationTypes[i];
    
    if (type == TYPE_DROP) {
      vec2 c = operationPositions[i];
      float r = operationArgs[i].x;
      int colorIndex = int(operationArgs[i].y);
      
      vec2 d = p - c;
      float l = length(d);
      if (l - r < 0.0) {
        return getColorAtIndex(colorIndex);
      }
      else {
        float l2 = sqrt((l * l) - (r * r));
        p = c + (d / l) * l2;
      }
    }

    else if (type == TYPE_LINE) {
      vec2 c = operationPositions[i];
      vec2 m = normalize(operationArgs[i] - c);

      vec2 n = vec2(-m.y, m.x);
      vec2 d = p - c;
      float l = length(dot(d, n));
      float l2 = (ALPHA * LAMBDA) / (l + LAMBDA);
      p = p - (m * l2);
    }

    else {
      break;
    }
  }

  return vec4(0.5, 0.5, 0.5, 1);
}

void main() {
  gl_FragColor = getColorAtPosition(gl_FragCoord.xy);
}