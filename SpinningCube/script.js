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
  theta: 0,        // ângulo horizontal (radians)
  phi: 0.5,        // ângulo vertical (radians)
  radius: 10,      // distância da câmera
  fov: Math.PI / 4, // campo de visão
  near: 0.1,       // plano próximo
  far: 100,        // plano distante
  
  // Controles de mouse
  isDragging: false,
  lastX: 0,
  lastY: 0,
  
  // Limites
  minRadius: 2.0,
  maxRadius: 50.0,
  minPhi: 0.01,
  maxPhi: Math.PI - 0.01,
  
  // Métodos auxiliares
  getPosition() {
    const x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.radius * Math.cos(this.phi);
    const z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    return [x, y, z];
  },
  
  updateProjectionMatrix(projectionMatrix, aspect) {
    const m4 = glMatrix.mat4;
    m4.perspective(projectionMatrix, this.fov, aspect, this.near, this.far);
  },
  
  updateViewMatrix(viewMatrix, target = [0, 0, 0], up = [0, 1, 0]) {
    const m4 = glMatrix.mat4;
    const eye = this.getPosition();
    m4.lookAt(viewMatrix, eye, target, up);
  }
};

canvas.addEventListener("mousedown", (e) => {
  camera.isDragging = true;
  camera.lastX = e.clientX;
  camera.lastY = e.clientY;
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

  camera.theta -= deltaX * 0.01;
  camera.phi += deltaY * 0.01;
  camera.phi = Math.max(camera.minPhi, Math.min(camera.maxPhi, camera.phi));
});

canvas.addEventListener("wheel", (e) => {
  camera.radius += e.deltaY * 0.01;
  camera.radius = Math.max(camera.minRadius, Math.min(camera.maxRadius, camera.radius));
});

// Criar geometria básica
//const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1); // Lado = 1
//const planetBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 32, 16);
const planetBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 64, 32); // mais suavidade
const texture = twgl.createTexture(gl, {
  src: 'textures/2k_earth_daymap.jpg',
  crossOrigin: '',
});

const glowBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 2.5, 32, 16); // ligeiramente maior que o Sol
const sunBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 2, 64, 32); // raio = 2
const sunTexture = twgl.createTexture(gl, {
  src: 'textures/2k_sun.jpg',
  crossOrigin: '',
});


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
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    camera.updateProjectionMatrix(projectionMatrix, aspect);
    camera.updateViewMatrix(viewMatrix);
    
    const eye = camera.getPosition();
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    m4.multiply(worldViewProjectionMatrix, projectionMatrix, viewMatrix);



    // Planeta (esfera girando em si mesmo)
    m4.identity(worldMatrix);
    m4.translate(worldMatrix, worldMatrix, [3 * Math.cos(time), 0, 3 * Math.sin(time)]); // Orbita circular
    m4.rotateY(worldMatrix, worldMatrix, time); // Rotação própria

    // Combinação das matrizes
    const viewProjection = m4.create();
    m4.multiply(viewProjection, projectionMatrix, viewMatrix);
    m4.multiply(worldViewProjectionMatrix, viewProjection, worldMatrix);

    // === Desenhar o Sol ===
    let sunMatrix = m4.create();
    m4.identity(sunMatrix);
    const sunWVP = m4.create();
    m4.multiply(sunWVP, viewProjection, sunMatrix);

    const cameraPosition = camera.getPosition();
    const lightPosition = [0, 0, 0]; // O Sol no centro

    // Desenho
    gl.useProgram(programInfo.program);
    
    // Desenhar o Sol
    twgl.setBuffersAndAttributes(gl, programInfo, sunBufferInfo);
    const sunWorldInverseTranspose = m4.create();
    m4.invert(sunWorldInverseTranspose, sunMatrix);
    m4.transpose(sunWorldInverseTranspose, sunWorldInverseTranspose);

    twgl.setUniforms(programInfo, {
        u_worldViewProjection: sunWVP,
        u_world: sunMatrix,
        u_worldInverseTranspose: sunWorldInverseTranspose,
        u_lightWorldPosition: lightPosition,
        u_viewWorldPosition: cameraPosition,
        u_useTexture: true,
        u_texture: sunTexture,
        u_isEmissive: true,
    });
    twgl.drawBufferInfo(gl, sunBufferInfo);
    gl.disable(gl.BLEND);

    // Desenhar o brilho do Sol
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // blending aditivo (glow)

    // let glowMatrix = m4.create();
    // m4.identity(glowMatrix);
    // const glowWVP = m4.create();
    // m4.multiply(glowWVP, viewProjection, glowMatrix);

    // const glowWorldInverseTranspose = m4.create();
    // m4.invert(glowWorldInverseTranspose, glowMatrix);
    // m4.transpose(glowWorldInverseTranspose, glowWorldInverseTranspose);

    // twgl.setBuffersAndAttributes(gl, programInfo, glowBufferInfo);
    // twgl.setUniforms(programInfo, {
    // u_worldViewProjection: glowWVP,
    // u_world: glowMatrix,
    // u_worldInverseTranspose: glowWorldInverseTranspose,
    // u_lightWorldPosition: lightPosition,
    // u_viewWorldPosition: cameraPosition,
    // u_useTexture: false,
    // u_color: [1.0, 0.8, 0.1, 0.2], // amarelo dourado com baixa opacidade
    // u_isEmissive: true,
    // });
    // twgl.drawBufferInfo(gl, glowBufferInfo);


    // Desenhar planeta
    twgl.setBuffersAndAttributes(gl, programInfo, planetBufferInfo);
    const worldInverseTranspose = m4.create();
    m4.invert(worldInverseTranspose, worldMatrix);
    m4.transpose(worldInverseTranspose, worldInverseTranspose);

    twgl.setUniforms(programInfo, {
        u_worldViewProjection: worldViewProjectionMatrix,
        u_world: worldMatrix,
        u_worldInverseTranspose: worldInverseTranspose,
        u_lightWorldPosition: lightPosition,
        u_viewWorldPosition: cameraPosition,
        u_useTexture: true,
        u_texture: texture,
        u_isEmissive: false,
    });
    twgl.drawBufferInfo(gl, planetBufferInfo);

    requestAnimationFrame(render);
}
requestAnimationFrame(render);
