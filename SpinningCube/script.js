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
    
// Criar instâncias dos corpos celestes
const sun = new CelestialBody({
  name: "Sol",
  radius: 2.0,
  position: [0, 0, 0],
  rotationSpeed: [0, 0.5, 0],
  textureUrl: 'textures/2k_sun.jpg',
  isEmissive: true,
  color: [1.0, 0.8, 0.1, 1.0]
});

const mercury = new CelestialBody({
  name: "Mercúrio",
  radius: 0.4,
  orbitRadius: 3.0,
  orbitSpeed: 1.0,
  orbitCenter: [0, 0, 0],
  rotationSpeed: [0, 1.5, 0],
  textureUrl: 'textures/2k_mercury.jpg',
  isEmissive: false,
  color: [0.5, 0.5, 0.5, 1.0]
});

const venus = new CelestialBody({
  name: "Vênus",
  radius: 0.9,
  orbitRadius: 4.5,
  orbitSpeed: 0.7,
  orbitCenter: [0, 0, 0],
  rotationSpeed: [0, 1.2, 0],
  textureUrl: 'textures/2k_venus_atmosphere.jpg',
  isEmissive: false,
  color: [1.0, 0.8, 0.5, 1.0]
});

const earth = new CelestialBody({
  name: "Terra",
  radius: 1.0,
  orbitRadius: 5.0,
  orbitSpeed: 0.5,
  orbitCenter: [0, 0, 0],
  rotationSpeed: [0, 1.0, 0],
  textureUrl: 'textures/2k_earth_daymap.jpg',
  isEmissive: false,
  color: [0.2, 0.6, 1.0, 1.0]
});

// Exemplo de como adicionar uma lua à Terra
const moon = new CelestialBody({
  name: "Lua",
  radius: 0.3,
  orbitRadius: 2.0,
  orbitSpeed: 2.0,
  orbitCenter: [0, 0, 0], // Será atualizado dinamicamente para orbitar a Terra
  rotationSpeed: [0, 0.5, 0],
  textureUrl: 'textures/2k_moon.jpg',
  isEmissive: false,
  useTexture: true
});

// Atualizar a órbita da lua para seguir a Terra
const originalMoonUpdate = moon.update;
moon.update = function(time) {
  // Primeiro, obter a posição atual da Terra
  const earthPosition = [
    earth.orbitRadius * Math.cos(time * earth.orbitSpeed),
    0,
    earth.orbitRadius * Math.sin(time * earth.orbitSpeed)
  ];
  
  // Atualizar o centro da órbita da lua para a posição da Terra
  this.orbitCenter = earthPosition;
  
  // Chamar o método update original
  originalMoonUpdate.call(this, time);
};

const mars = new CelestialBody({
  name: "Marte",
  radius: 0.8,
  orbitRadius: 8.0,
  orbitSpeed: 0.3,
  orbitCenter: [0, 0, 0],
  rotationSpeed: [0, 0.9, 0],
  color: [0.8, 0.3, 0.1, 1.0],
  isEmissive: false,
  textureUrl: 'textures/2k_mars.jpg',
  useTexture: true
});

// Exemplo: Adicionar Júpiter
const jupiter = new CelestialBody({
  name: "Júpiter",
  radius: 1.8,
  orbitRadius: 12.0,
  orbitSpeed: 0.15,
  orbitCenter: [0, 0, 0],
  rotationSpeed: [0, 2.0, 0],
  color: [0.9, 0.7, 0.4, 1.0],
  isEmissive: false,
  useTexture: false
});

const saturn = new CelestialBody({
    name: "Saturno",
    radius: 1.5,
    orbitRadius: 8.0,
    orbitSpeed: 0.3,
    orbitCenter: [0, 0, 0],
    rotationSpeed: [0, 0.8, 0],
    textureUrl: 'textures/2k_saturn.jpg',
    isEmissive: false,
    useTexture: true,
    color: [0.9, 0.8, 0.6, 1.0]
});

const uranus = new CelestialBody({
    name: "Urano",
    radius: 1.2,
    orbitRadius: 10.0,
    orbitSpeed: 0.2,
    orbitCenter: [0, 0, 0],
    rotationSpeed: [0, 0.6, 0],
    textureUrl: 'textures/2k_uranus.jpg',
    isEmissive: false,
    useTexture: true,
    color: [0.5, 0.7, 1.0, 1.0]
});

const neptune = new CelestialBody({
    name: "Netuno",
    radius: 1.1,
    orbitRadius: 12.0,
    orbitSpeed: 0.1,
    orbitCenter: [0, 0, 0],
    rotationSpeed: [0, 0.4, 0],
    textureUrl: 'textures/2k_neptune.jpg',
    isEmissive: false,
    useTexture: true,
    color: [0.3, 0.5, 1.0, 1.0]
});

// Matrizes
const projectionMatrix = m4.create();
const viewMatrix = m4.create();

const system = new System({
    celestialBodies: [
        sun, 
        mercury,
        venus,
        earth,
        moon,
        mars,
        jupiter,
        saturn,
        uranus,
        neptune,
    ]
});

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
    
    // Atualizar e renderizar todos os corpos celestes
    system.celestialBodies.forEach(body => {
        body.update(time);
        body.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);
    });

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
