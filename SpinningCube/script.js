"use strict";

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

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2");

twgl.setDefaults({
  attribPrefix: "",
});

// Criar programa com TWGL
const programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

// Estado da câmera organizado
const camera = {
  // Modo orbital
  theta: 0,        // ângulo horizontal (radians)
  phi: 0.5,        // ângulo vertical (radians)
  radius: 10,      // distância da câmera
  
  // Modo livre
  position: [0, 5, 10],  // posição da câmera no modo livre
  yaw: 0,          // rotação horizontal (radians)
  pitch: 0,        // rotação vertical (radians)
  
  // Configurações gerais
  fov: Math.PI / 4, // campo de visão
  near: 0.1,       // plano próximo
  far: 100,        // plano distante
  speed: 0.1,      // velocidade de movimento
  sensitivity: 0.005, // sensibilidade do mouse
  
  // Estados de controle
  mode: 'orbital', // 'orbital' ou 'free'
  isDragging: false,
  lastX: 0,
  lastY: 0,
  keys: {},        // teclas pressionadas
  
  // Limites para modo orbital
  minRadius: 2.0,
  maxRadius: 50.0,
  minPhi: 0.01,
  maxPhi: Math.PI - 0.01,
  
  // Métodos auxiliares
  getPosition() {
    if (this.mode === 'orbital') {
      const x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
      const y = this.radius * Math.cos(this.phi);
      const z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
      return [x, y, z];
    } else {
      return [...this.position];
    }
  },
  
  getTarget() {
    if (this.mode === 'orbital') {
      return [0, 0, 0]; // sempre olha para o centro
    } else {
      // Calcula direção baseada em yaw e pitch
      const x = Math.cos(this.pitch) * Math.sin(this.yaw);
      const y = Math.sin(this.pitch);
      const z = Math.cos(this.pitch) * Math.cos(this.yaw);
      return [
        this.position[0] + x,
        this.position[1] + y,
        this.position[2] + z
      ];
    }
  },
  
  updateProjectionMatrix(projectionMatrix, aspect) {
    const m4 = glMatrix.mat4;
    m4.perspective(projectionMatrix, this.fov, aspect, this.near, this.far);
  },
  
  updateViewMatrix(viewMatrix, up = [0, 1, 0]) {
    const m4 = glMatrix.mat4;
    const eye = this.getPosition();
    const target = this.getTarget();
    m4.lookAt(viewMatrix, eye, target, up);
  },
  
  // Processar movimento WASD
  processMovement(deltaTime) {
    if (this.mode !== 'free') return;
    
    const moveSpeed = this.speed * deltaTime * 60; // 60 fps como base
    
    // Calcular vetores de direção
    const forward = [
      Math.cos(this.pitch) * Math.sin(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.cos(this.yaw)
    ];
    
    const right = [
      Math.sin(this.yaw - Math.PI/2),
      0,
      Math.cos(this.yaw - Math.PI/2)
    ];
    
    const up = [0, 1, 0];
    
    // Movimento baseado nas teclas pressionadas
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.position[0] += forward[0] * moveSpeed;
      this.position[1] += forward[1] * moveSpeed;
      this.position[2] += forward[2] * moveSpeed;
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      this.position[0] -= forward[0] * moveSpeed;
      this.position[1] -= forward[1] * moveSpeed;
      this.position[2] -= forward[2] * moveSpeed;
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.position[0] += right[0] * moveSpeed;
      this.position[2] += right[2] * moveSpeed;
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.position[0] -= right[0] * moveSpeed;
      this.position[2] -= right[2] * moveSpeed;
    }
    if (this.keys['KeyQ'] || this.keys['Space']) {
      this.position[1] += moveSpeed; // subir
    }
    if (this.keys['KeyE'] || this.keys['ShiftLeft']) {
      this.position[1] -= moveSpeed; // descer
    }
  },
  
  // Alternar entre modos
  toggleMode() {
    if (this.mode === 'orbital') {
      this.mode = 'free';
      // Definir posição inicial no modo livre baseada na posição orbital atual
      const orbitalPos = this.getPosition();
      this.position = [...orbitalPos];
      // Definir yaw e pitch para olhar em direção ao centro
      const dx = 0 - this.position[0];
      const dz = 0 - this.position[2];
      const dy = 0 - this.position[1];
      this.yaw = Math.atan2(dx, dz);
      this.pitch = Math.atan2(dy, Math.sqrt(dx*dx + dz*dz));
    } else {
      this.mode = 'orbital';
      // Calcular theta, phi e radius baseados na posição atual
      const dx = this.position[0];
      const dy = this.position[1];
      const dz = this.position[2];
      this.radius = Math.sqrt(dx*dx + dy*dy + dz*dz);
      this.theta = Math.atan2(dx, dz);
      this.phi = Math.acos(dy / this.radius);
    }
  }
};

// Event listeners para controles
canvas.addEventListener("mousedown", (e) => {
  camera.isDragging = true;
  camera.lastX = e.clientX;
  camera.lastY = e.clientY;
  if (camera.mode === 'free') {
    canvas.requestPointerLock(); // Travar o mouse no modo livre
  }
});

canvas.addEventListener("mouseup", () => {
  camera.isDragging = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!camera.isDragging) return;
  
  const deltaX = e.clientX - camera.lastX;
  const deltaY = e.clientY - camera.lastY;
  camera.lastX = e.clientX;
  camera.lastY = e.clientY;

  if (camera.mode === 'orbital') {
    // Controle orbital
    camera.theta -= deltaX * 0.01;
    camera.phi += deltaY * 0.01;
    camera.phi = Math.max(camera.minPhi, Math.min(camera.maxPhi, camera.phi));
  } else {
    // Controle livre (mouse look)
    camera.yaw -= deltaX * camera.sensitivity;
    camera.pitch -= deltaY * camera.sensitivity;
    // Limitar pitch para evitar flip
    camera.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, camera.pitch));
  }
});

canvas.addEventListener("wheel", (e) => {
  if (camera.mode === 'orbital') {
    camera.radius += e.deltaY * 0.01;
    camera.radius = Math.max(camera.minRadius, Math.min(camera.maxRadius, camera.radius));
  } else {
    // No modo livre, wheel pode ajustar velocidade
    camera.speed += e.deltaY * -0.001;
    camera.speed = Math.max(0.01, Math.min(1.0, camera.speed));
    updateSpeedIndicator();
  }
});

// Controles de teclado
document.addEventListener("keydown", (e) => {
  camera.keys[e.code] = true;
  
  // Tecla para alternar modo (C)
  if (e.code === 'KeyC') {
    camera.toggleMode();
    updateModeIndicator();
    console.log(`Modo da câmera: ${camera.mode}`);
  }
  
  // ESC para sair do pointer lock
  if (e.code === 'Escape') {
    document.exitPointerLock();
  }
});

document.addEventListener("keyup", (e) => {
  camera.keys[e.code] = false;
});

// Lidar com pointer lock para o modo livre
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) {
    // Pointer está travado, usar moveDelta para controle suave
    document.addEventListener('mousemove', handlePointerLockMouseMove);
  } else {
    // Pointer foi liberado
    document.removeEventListener('mousemove', handlePointerLockMouseMove);
    camera.isDragging = false;
  }
});

function handlePointerLockMouseMove(e) {
  if (camera.mode === 'free') {
    camera.yaw -= e.movementX * camera.sensitivity;
    camera.pitch -= e.movementY * camera.sensitivity;
    camera.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, camera.pitch));
  }
}

// Funções para atualizar a interface
function updateModeIndicator() {
  const modeIndicator = document.getElementById('mode-indicator');
  if (modeIndicator) {
    modeIndicator.textContent = `Modo: ${camera.mode === 'orbital' ? 'Orbital' : 'Livre'}`;
  }
}

function updateSpeedIndicator() {
  const speedIndicator = document.getElementById('speed-indicator');
  if (speedIndicator) {
    speedIndicator.textContent = `Velocidade: ${camera.speed.toFixed(2)}`;
  }
}

// Classe genérica para corpos celestes
class CelestialBody {
  constructor(options = {}) {
    this.name = options.name || "Unnamed";
    this.radius = options.radius || 1.0;
    this.position = options.position || [0, 0, 0];
    this.rotation = options.rotation || [0, 0, 0];
    this.rotationSpeed = options.rotationSpeed || [0, 0, 0];
    this.orbitRadius = options.orbitRadius || 0;
    this.orbitSpeed = options.orbitSpeed || 0;
    this.orbitCenter = options.orbitCenter || [0, 0, 0];
    this.color = options.color || [1, 1, 1, 1];
    this.textureUrl = options.textureUrl || null;
    this.isEmissive = options.isEmissive || false;
    this.useTexture = options.useTexture !== undefined ? options.useTexture : !!this.textureUrl;
    
    // Propriedades internas
    this.bufferInfo = null;
    this.texture = null;
    this.worldMatrix = glMatrix.mat4.create();
    this.worldInverseTranspose = glMatrix.mat4.create();
    
    this.initGeometry();
    this.initTexture();
  }
  
  initGeometry() {
    // Criar geometria esférica com base no raio
    this.bufferInfo = twgl.primitives.createSphereBufferInfo(gl, this.radius, 64, 32);
  }
  
  initTexture() {
    if (this.textureUrl) {
      this.texture = twgl.createTexture(gl, {
        src: this.textureUrl,
        crossOrigin: '',
      });
    }
  }
  
  update(time) {
    const m4 = glMatrix.mat4;
    
    // Reset da matriz
    m4.identity(this.worldMatrix);
    
    // Aplicar órbita se houver
    if (this.orbitRadius > 0) {
      const orbitAngle = time * this.orbitSpeed;
      const orbitX = this.orbitCenter[0] + this.orbitRadius * Math.cos(orbitAngle);
      const orbitZ = this.orbitCenter[2] + this.orbitRadius * Math.sin(orbitAngle);
      m4.translate(this.worldMatrix, this.worldMatrix, [orbitX, this.orbitCenter[1], orbitZ]);
    } else {
      // Posição estática
      m4.translate(this.worldMatrix, this.worldMatrix, this.position);
    }
    
    // Aplicar rotação própria
    if (this.rotationSpeed[0] !== 0) m4.rotateX(this.worldMatrix, this.worldMatrix, time * this.rotationSpeed[0]);
    if (this.rotationSpeed[1] !== 0) m4.rotateY(this.worldMatrix, this.worldMatrix, time * this.rotationSpeed[1]);
    if (this.rotationSpeed[2] !== 0) m4.rotateZ(this.worldMatrix, this.worldMatrix, time * this.rotationSpeed[2]);
    
    // Calcular matriz inversa transposta para as normais
    m4.invert(this.worldInverseTranspose, this.worldMatrix);
    m4.transpose(this.worldInverseTranspose, this.worldInverseTranspose);
  }
  
  render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition) {
    const m4 = glMatrix.mat4;
    
    // Calcular matriz world-view-projection
    const worldViewProjectionMatrix = m4.create();
    m4.multiply(worldViewProjectionMatrix, viewProjectionMatrix, this.worldMatrix);
    
    // Configurar buffers e atributos
    twgl.setBuffersAndAttributes(gl, programInfo, this.bufferInfo);
    
    // Configurar uniforms
    const uniforms = {
      u_worldViewProjection: worldViewProjectionMatrix,
      u_world: this.worldMatrix,
      u_worldInverseTranspose: this.worldInverseTranspose,
      u_lightWorldPosition: lightPosition,
      u_viewWorldPosition: cameraPosition,
      u_useTexture: this.useTexture,
      u_isEmissive: this.isEmissive,
    };
    
    if (this.useTexture && this.texture) {
      uniforms.u_texture = this.texture;
    } else {
      uniforms.u_color = this.color;
    }
    
    twgl.setUniforms(programInfo, uniforms);
    
    // Desenhar
    twgl.drawBufferInfo(gl, this.bufferInfo);
  }
  
  // Métodos utilitários
  setPosition(x, y, z) {
    this.position = [x, y, z];
  }
  
  setRotationSpeed(x, y, z) {
    this.rotationSpeed = [x, y, z];
  }
  
  setOrbit(radius, speed, center = [0, 0, 0]) {
    this.orbitRadius = radius;
    this.orbitSpeed = speed;
    this.orbitCenter = center;
  }
  
  setColor(r, g, b, a = 1.0) {
    this.color = [r, g, b, a];
  }
  
  getCurrentPosition() {
    // Extrai a posição atual da matriz world
    return [this.worldMatrix[12], this.worldMatrix[13], this.worldMatrix[14]];
  }
  
  getDistanceFrom(otherBody) {
    const pos1 = this.getCurrentPosition();
    const pos2 = otherBody.getCurrentPosition();
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1];
    const dz = pos1[2] - pos2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

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
const m4 = glMatrix.mat4;
const projectionMatrix = m4.create();
const viewMatrix = m4.create();

// Array de corpos celestes para facilitar o gerenciamento
const celestialBodies = [
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
];

// Função utilitária para adicionar novos corpos celestes
function addCelestialBody(options) {
  const body = new CelestialBody(options);
  celestialBodies.push(body);
  return body;
}

// Função utilitária para remover um corpo celeste
function removeCelestialBody(name) {
  const index = celestialBodies.findIndex(body => body.name === name);
  if (index !== -1) {
    celestialBodies.splice(index, 1);
    return true;
  }
  return false;
}

// Função utilitária para encontrar um corpo celeste pelo nome
function findCelestialBody(name) {
  return celestialBodies.find(body => body.name === name);
}

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
    celestialBodies.forEach(body => {
        body.update(time);
        body.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);
    });

    requestAnimationFrame(render);
}

// Inicializar interface e começar renderização
document.addEventListener('DOMContentLoaded', () => {
  updateModeIndicator();
  updateSpeedIndicator();
});

requestAnimationFrame(render);
