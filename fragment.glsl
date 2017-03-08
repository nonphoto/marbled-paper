precision mediump float;

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
  vec3 color = vec3(1, 0, 1);
  if (i == 0) {
    color = colors[0];
  }
  else if (i == 1) {
    color = colors[1];
  }
  else if (i == 2) {
    color = colors[2];
  }
  else if (i == 3) {
    color = colors[3];
  }
  else if (i == 4) {
    color = colors[4];
  }
  else if (i == 5) {
    color = colors[5];
  }
  else if (i == 6) {
    color = colors[6];
  }
  else if (i == 7) {
    color = colors[7];
  }
  return vec4(color, 1);
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