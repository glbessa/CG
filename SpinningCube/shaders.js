const vertexShaderSource = `#version 300 es
in vec4 position;
uniform mat4 u_worldViewProjection;
void main() {
  gl_Position = u_worldViewProjection * position;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4(0.2, 0.7, 1.0, 1.0);
}
`;
