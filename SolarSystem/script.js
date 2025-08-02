"use strict";

import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';
import CelestialBody from "./celestial-body.js";
import System from "./system.js";
import camera from "./camera.js";
import Timeline from "./timeline.js";
import { updateModeIndicator, updateSpeedIndicator, setTimeline } from "./ui.js";

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

const sunFragmentShaderSource = `#version 300 es
precision highp float;

out vec4 outColor;
in vec3 v_position;

uniform float u_time;

// Função hash simples para ruído
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Ruído interpolado simples
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(
    mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
    u.y);
}

// Fractal Brownian Motion para textura complexa
float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for(int i = 0; i < 5; i++) {
    total += noise(p) * amplitude;
    p *= 2.0;
    amplitude *= 0.5;
  }
  return total;
}

void main() {
  // Normaliza a posição xy para a esfera de raio 1
  vec2 uv = normalize(v_position.xy);
  float radius = length(v_position.xy);

  // Ajusta radius para a faixa 0..1, limitando em 1
  radius = clamp(radius, 0.0, 1.0);

  // Pulsação suave
  float pulse = 0.6 + 0.4 * sin(u_time * 3.0 + radius * 15.0);

  // Textura turbulenta animada
  float pattern = fbm(uv * 4.0 + vec2(u_time * 0.2, u_time * 0.1));

  // Gradiente de cor do Sol (vermelho -> amarelo), reduzindo intensidade para evitar saturar
  vec3 baseColor = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.8, 0.3), pattern) * 0.6;

  // Aplica pulso e fade radial com smoothstep para bordas suaves
  vec3 color = baseColor * pulse * smoothstep(1.0, 0.6, 1.0 - radius);

  // Glow central intenso e concentrado, mas suavizado para não saturar
  float coreGlow = pow(1.0 - radius, 6.0);
  color += coreGlow * vec3(1.0, 0.6, 0.2) * 0.4;

  // Alpha suave para fade nas bordas
  float alpha = smoothstep(1.0, 0.7, 1.0 - radius);

  outColor = vec4(color, alpha);
}





`;

twgl.setDefaults({
  attribPrefix: "",
});

// Criar programa com TWGL
const programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
const sunProgramInfo = twgl.createProgramInfo(gl, [vertexShaderSource, sunFragmentShaderSource]);

// Criar instância do sistema solar
const system = new System({
    celestialBodies: []
});

// Criar instância da linha do tempo
const timeline = new Timeline();

// Configurar referência da timeline no ui.js
setTimeline(timeline);

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

    // Atualizar linha do tempo
    timeline.update(deltaTime);
    
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
    //gl.useProgram(programInfo.program);
    
    // Atualizar sistema solar com o tempo da timeline
    const timelineTime = timeline.getNormalizedTime() * 40.0; // Escalar para a simulação
    system.update(timelineTime);
    system.celestialBodies.forEach(body => {
      if (body.name === 'sun') {
        // Renderizar o Sol com o shader especial
        gl.useProgram(sunProgramInfo.program);
        body.render(sunProgramInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      } else {
        gl.useProgram(programInfo.program);
        body.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      }
    });

    // Atualizar e renderizar usando o sistema
    //system.render(programInfo, sunProgramInfo, viewProjectionMatrix, lightPosition, cameraPosition);

    requestAnimationFrame(render);
}

// Inicializar o sistema solar
initSolarSystem();
