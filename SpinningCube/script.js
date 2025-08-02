"use strict";

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

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2");

twgl.setDefaults({
  attribPrefix: "",
});

// Criar programa com TWGL
const programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

// Criar geometria básica
const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1); // Lado = 1

// Matrizes
const m4 = glMatrix.mat4;
const time = 0;
const projectionMatrix = m4.create();
const viewMatrix = m4.create();
const worldMatrix = m4.create();
const worldViewProjectionMatrix = m4.create();

function render(time) {
  time *= 0.001; // ms → s
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Câmera
  const fov = Math.PI / 4;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  m4.perspective(projectionMatrix, fov, aspect, 0.1, 100);
  m4.lookAt(viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);

  // Rotacionar o cubo
  m4.identity(worldMatrix);
  m4.rotateY(worldMatrix, worldMatrix, time);
  m4.rotateX(worldMatrix, worldMatrix, time * 0.5);

  // Multiplicar as matrizes
  const viewProjection = m4.create();
  m4.multiply(viewProjection, projectionMatrix, viewMatrix);
  m4.multiply(worldViewProjectionMatrix, viewProjection, worldMatrix);

  // Desenhar
  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, {
    u_worldViewProjection: worldViewProjectionMatrix,
  });
  twgl.drawBufferInfo(gl, bufferInfo);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
