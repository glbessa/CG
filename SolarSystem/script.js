"use strict";

import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';
import CelestialBody from "./celestial-body.js";
import System from "./system.js";
import camera from "./camera.js";
import Timeline from "./timeline.js";
import { updateModeIndicator, updateSpeedIndicator, setTimeline } from "./ui.js";
import { loadAsset } from "./utils.js";

const vertexShaderSource = await loadAsset('./shaders/general.vert');
const fragmentShaderSource = await loadAsset('./shaders/general.frag');
const sunFragmentShaderSource = await loadAsset('./shaders/sun.frag');
const cometFragmentShaderSource = await loadAsset('./shaders/comet.frag');

twgl.setDefaults({
  attribPrefix: "",
});

// Criar programa com TWGL
const programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);
const sunProgramInfo = twgl.createProgramInfo(gl, [vertexShaderSource, sunFragmentShaderSource]);
const cometProgramInfo = twgl.createProgramInfo(gl, [vertexShaderSource, cometFragmentShaderSource]);

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
        body.render(sunProgramInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      } else {
        body.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      }
    });

    requestAnimationFrame(render);
}

// Inicializar o sistema solar
initSolarSystem();
