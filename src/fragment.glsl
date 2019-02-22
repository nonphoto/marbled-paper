// Using Jaffer et al's approach to mathematical marbling.
// http://people.csail.mit.edu/jaffer/Marbling/

precision mediump float;

const float ALPHA = 0.25;
const float LAMBDA = 0.02;
const int MAX_OPS = 16;

struct Operation {
  int type;
  vec2 start;
  vec2 end;
  vec3 color;
  float scale;
};

uniform vec2 resolution;
uniform vec3 backgroundColor;
uniform Operation operations[MAX_OPS];

vec4 getColorAtPosition(vec2 position) {
  vec2 p = position;

  for (int i = 0; i < MAX_OPS; i++) {
    Operation op = operations[i];

    // Drop
    if (op.type == 0) {
      vec2 d = p - op.start;
      float r = op.scale * length(op.end - op.start);
      float l = length(d);
      if (l - r < 0.0) {
        return vec4(op.color / 255.0, 1.0);
      }
      else {
        float l2 = sqrt((l * l) - (r * r));
        p = op.start + (d / l) * l2;
      }
    }

    // Line
    else if (op.type == 1) {
      vec2 m = normalize(op.end - op.start);
      vec2 n = vec2(-m.y, m.x);
      vec2 d = p - op.start;
      float l = length(dot(d, n));
      float l2 = (ALPHA * LAMBDA) / (l + LAMBDA);
      p = p - (m * l2);
    }

    // Comb
    else if (op.type == 2) {
      vec2 m = normalize(op.end - op.start);
      vec2 n = vec2(-m.y, m.x);
      vec2 d = p - op.start;
      float width = 0.1;
      float halfWidth = 0.1 * 0.5;
      float height = length(op.end - op.start);
      float l = length(dot(d, n));
      float l2 = abs(mod(l, width) - halfWidth);
      float l3 = (height * LAMBDA) / (halfWidth - l2 + LAMBDA);
      float l4 = l3 * (l2 / halfWidth) * (l2 / halfWidth) ;
      p = p - (m * l4 * op.scale);
    }

    // Smudge
    else if (op.type == 3) {
      vec2 m = normalize(op.end - op.start);
      vec2 n = vec2(-m.y, m.x);
      vec2 d = p - op.start;
      float s = length(op.end - op.start);
      float l = length(dot(d, n));
      float l2 = abs(mod(l, 2.0) - 1.0);
      float l3 = (s * LAMBDA) / (1.0 - l2 + LAMBDA);
      float l4 = l3 * l2 * l2 ;
      p = p - (m * l4 * op.scale);
    }

    else {
      break;
    }
  }

  return vec4(backgroundColor / 255.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = getColorAtPosition(uv);
}
