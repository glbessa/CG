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
let solarSystem = new System({
    celestialBodies: []
});

// Criar instância da linha do tempo
const timeline = new Timeline();

// Configurar referência da timeline no ui.js
setTimeline(timeline);

// Mapeamento de nomes dos corpos celestes para arquivos de dados temporais
const temporalDataFiles = {
    'earth': 'data/orbital/earth.json',
    'mars': 'data/orbital/mars.json',
    'mercury': 'data/orbital/mercury.json',
    'venus': 'data/orbital/venus.json',
    'jupiter': 'data/orbital/jupiter.json',
    'saturn': 'data/orbital/saturn.json',
    'uranus': 'data/orbital/uranus.json',
    'neptune': 'data/orbital/neptune.json',
    'pluto': 'data/orbital/pluto.json',
    'moon': 'data/orbital/moon.json',
    'comet_halley': 'data/orbital/comet_halley.json'
};

// Função para carregar dados temporais em um corpo celeste
async function loadTemporalDataForBody(body) {
    const bodyNameLower = body.name.toLowerCase();
    const filePath = temporalDataFiles[bodyNameLower];
    
    if (filePath) {
        try {
            console.log(`Carregando dados temporais para ${body.name}...`);
            const success = await body.loadTemporalData(filePath);
            
            if (success) {
                console.log(`✅ Dados temporais carregados para ${body.name}`);
                
                // Configurar parâmetros temporais
                body.setStartTime(1965, 1, 0); // Data inicial dos dados
                body.setTimeScale(365.25 * 24); // 1 hora simulação = 1 ano real
                body.setInterpolation(true);
                body.setUseTemporalData(true);
                
                // Log informações sobre os dados carregados
                body.logTemporalDataInfo();
            } else {
                console.log(`⚠️ Falha ao carregar dados temporais para ${body.name} - usando cálculos matemáticos`);
            }
        } catch (error) {
            console.warn(`⚠️ Erro ao carregar dados temporais para ${body.name}:`, error.message);
            console.log(`Usando cálculos matemáticos para ${body.name}`);
        }
    } else {
        console.log(`ℹ️ Nenhum arquivo de dados temporais encontrado para ${body.name} - usando cálculos matemáticos`);
    }
}

// Carregar dados do planetary-data.json
async function initSolarSystem() {
    try {
        await solarSystem.loadFromDataJson('data/planetary-data.json');
        console.log('Sistema solar carregado com sucesso!');
        
        // Carregar dados temporais para todos os corpos celestes
        console.log('Iniciando carregamento de dados temporais...');
        await loadTemporalDataForAllBodies();
        console.log('Carregamento de dados temporais concluído!');
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Carregar dados temporais para todos os corpos celestes do sistema
async function loadTemporalDataForAllBodies() {
    const bodies = solarSystem.getCelestialBodies();
    const loadPromises = bodies.map(body => loadTemporalDataForBody(body));
    
    // Carregar dados temporais em paralelo
    await Promise.all(loadPromises);
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
    
    // Atualizar sistema solar com o tempo da timeline
    const timelineTime = timeline.getNormalizedTime() * 40.0; // Escalar para a simulação
    solarSystem.update(timelineTime);
    solarSystem.celestialBodies.forEach(body => {
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
requestAnimationFrame(render);
