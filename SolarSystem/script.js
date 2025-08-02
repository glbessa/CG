"use strict";

import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';
import CelestialBody from "./celestial-body.js";
import System from "./system.js";
import camera from "./camera.js";
import { updateModeIndicator, updateSpeedIndicator } from "./ui.js";

const vertexShaderSource = `#version 300 es
in vec4 position;
in vec2 texcoord;
in vec3 normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;

out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_position;

void main() {
  gl_Position = u_worldViewProjection * position;
  v_texcoord = texcoord;

  // Transforma a normal para o espaço mundial
  v_normal = mat3(u_worldInverseTranspose) * normal;
  v_position = (u_world * position).xyz;
}
`;


const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_position;

uniform sampler2D u_texture;
uniform bool u_useTexture;
uniform bool u_isEmissive;
uniform vec4 u_color;

uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

out vec4 outColor;

float sphereSDF(vec3 p, vec3 center, float radius) {
    return length(p - center) - radius;
}

void main() {
  vec3 normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(u_lightWorldPosition - v_position);
  vec3 surfaceToView = normalize(u_viewWorldPosition - v_position);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);

  float diffuse = max(dot(normal, surfaceToLight), 0.0);
  float specular = pow(max(dot(normal, halfVector), 0.0), 50.0); // brilho intenso

  vec4 baseColor = u_useTexture ? texture(u_texture, v_texcoord) : u_color;

  if (u_isEmissive) {
    outColor = baseColor;
  } else {
    vec3 finalColor = baseColor.rgb * diffuse + vec3(1.0) * specular;
    outColor = vec4(finalColor, baseColor.a);
  }
}
`;

twgl.setDefaults({
  attribPrefix: "",
});

// Criar programa com TWGL
const programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

// Criar instância do sistema solar
const system = new System({
    celestialBodies: []
});

// Carregar dados do planetary-data.json
async function initSolarSystem() {
    await system.loadFromDataJson();
    console.log('Sistema solar carregado com dados reais!');
    
    // Iniciar o loop de renderização
    requestAnimationFrame(render);
}

// Matrizes
const projectionMatrix = m4.create();
const viewMatrix = m4.create();

function render(time) {
    time *= 0.001; // ms → s
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Processar movimento da câmera (para modo livre)
    const deltaTime = time - (render.lastTime || 0);
    render.lastTime = time;
    camera.processMovement(deltaTime);

    // Configurar câmera
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    camera.updateProjectionMatrix(projectionMatrix, aspect);
    camera.updateViewMatrix(viewMatrix);
    
    // Calcular matriz view-projection
    const viewProjectionMatrix = m4.create();
    m4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
    
    // Posições da câmera e luz
    const cameraPosition = camera.getPosition();
    const lightPosition = [0, 0, 0]; // O Sol no centro
    
    // Usar o programa de shader
    gl.useProgram(programInfo.program);
    
    // Atualizar e renderizar usando o sistema
    system.update(time);
    system.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);

    requestAnimationFrame(render);
}

// Inicializar o sistema solar
initSolarSystem();
