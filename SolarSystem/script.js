"use strict";

import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';
import System from "./system.js";
import camera from "./camera.js";
import CONFIG from "./config.js";
import Timeline from "./timeline.js";
import { setTimeline, populateCelestialBodiesList } from './ui.js'; // Importar funções para conectar timeline e listar corpos celestes ao UI

let programInfo;
let sunProgramInfo;
let cometProgramInfo;
let solarSystem;
let background;
let timeline;
let projectionMatrix = m4.create();
let viewMatrix = m4.create();

async function main() {
    try {
        // Verificar contexto WebGL
        if (!gl) {
            console.error("WebGL não está disponível!");
            return;
        }
        
        console.log("WebGL version:", gl.getParameter(gl.VERSION));
        console.log("WebGL vendor:", gl.getParameter(gl.VENDOR));
        
        // Verificar canvas
        if (gl.canvas.width === 0 || gl.canvas.height === 0) {
            console.warn("Canvas tem tamanho zero, redimensionando...");
            gl.canvas.width = 800;
            gl.canvas.height = 600;
        }
        
        console.log("Canvas inicial:", gl.canvas.width, "x", gl.canvas.height);

        // Carregar shaders com verificação de erro
        const shaders = {
            vertex: await fetch(CONFIG.shaders.vertex).then(response => {
                if (!response.ok) throw new Error(`Erro ao carregar vertex shader: ${response.statusText}`);
                return response.text();
            }),
            fragment: await fetch(CONFIG.shaders.fragment).then(response => {
                if (!response.ok) throw new Error(`Erro ao carregar fragment shader: ${response.statusText}`);
                return response.text();
            }),
            sunFragment: await fetch(CONFIG.shaders.sunFragment).then(response => {
                if (!response.ok) throw new Error(`Erro ao carregar sun fragment shader: ${response.statusText}`);
                return response.text();
            }),
            cometFragment: await fetch(CONFIG.shaders.cometFragment).then(response => {
                if (!response.ok) throw new Error(`Erro ao carregar comet fragment shader: ${response.statusText}`);
                return response.text();
            })
        }

        console.log("Shaders carregados:", Object.keys(shaders));

        // Criar programs com verificação de erro
        programInfo = twgl.createProgramInfo(gl, [shaders.vertex, shaders.fragment]);
        sunProgramInfo = twgl.createProgramInfo(gl, [shaders.vertex, shaders.sunFragment]);
        cometProgramInfo = twgl.createProgramInfo(gl, [shaders.vertex, shaders.cometFragment]);

        if (!programInfo || !sunProgramInfo || !cometProgramInfo) {
            console.error("Erro ao criar program info");
            return;
        }

        console.log("Programs criados com sucesso");

        // Carregar sistema solar
        solarSystem = new System({});
        await solarSystem.load({
            celestialBodiesData: CONFIG.celestialBodies,
            texturesFilepath: CONFIG.texturesFilepath,
            astronomicalDataFilepath: CONFIG.astronomicalData,
            temporalDataFilepath: CONFIG.temporalDataFilepath,
        });

        console.log("Sistema solar carregado:");
        console.log("- Corpos celestes:", solarSystem.celestialBodies.length);
        if (solarSystem.celestialBodies.length > 0) {
            console.log("- Primeiros corpos:", solarSystem.celestialBodies.slice(0, 3).map(b => b.name));
        } else {
            console.error("Nenhum corpo celeste foi carregado!");
            return;
        }

        // Atribuir programs aos corpos
        solarSystem.celestialBodies.forEach(body => {
            if (body.name === 'sun') {
                body.programInfo = sunProgramInfo;
            } else if (body.name === 'comet_halley') {
                body.programInfo = cometProgramInfo;
            } else {
                body.programInfo = programInfo;
            }
            console.log(`Program atribuído a ${body.name}`);
        });

        console.log("Iniciando loop de renderização...");
        
        // Inicializar timeline
        timeline = new Timeline();
        console.log("Timeline inicializada");
        
        // Conectar timeline ao UI
        setTimeline(timeline);
        console.log("Timeline conectada ao UI");
        
        // Popular lista de corpos celestes
        populateCelestialBodiesList(solarSystem);
        console.log("Lista de corpos celestes criada");
        
        setupBackground();

        requestAnimationFrame(render);
        
    } catch (error) {
        console.error("Erro na inicialização:", error);
    }
}

function setupBackground() {
    const backgroundTexture = twgl.createTexture(gl, {
        src: 'textures/2k_stars_milky_way.jpg',
    });
    background = {
        position: [0, 0, -100], // Posição atrás do sistema solar
        scale: 1000, // Escala grande para cobrir o fundo
        texture: backgroundTexture,
        bufferInfo: twgl.primitives.createSphereBufferInfo(gl, 100000, 32, 32),
    };
}

function render(time) {
    time *= 0.001; // ms → s
    
    // Verificar contexto WebGL
    if (gl.isContextLost()) {
        console.error("WebGL context lost!");
        return;
    }
    
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    
    // Verificar tamanho do canvas
    if (gl.canvas.width === 0 || gl.canvas.height === 0) {
        console.error("Canvas tem tamanho zero!");
        return;
    }
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    
    // Cor de fundo azul escuro para visualizar melhor
    gl.clearColor(0.02, 0.02, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Verificar erros WebGL
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error("WebGL error:", error);
    }

    // Processar movimento da câmera (para modo livre)
    const deltaTime = time - (render.lastTime || 0);
    render.lastTime = time;
    camera.processMovement(deltaTime);
    
    // Atualizar timeline
    if (timeline) {
        timeline.update(deltaTime);
    }
    
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

    // Debug da primeira vez
    if (render.debugCount < 5) {
        render.debugCount = (render.debugCount || 0) + 1;
        console.log(`Frame ${render.debugCount}:`);
        console.log("- Canvas size:", gl.canvas.width, "x", gl.canvas.height);
        console.log("- Aspect ratio:", aspect);
        console.log("- Camera position:", cameraPosition);
        console.log("- Camera mode:", camera.mode);
        console.log("- Camera radius (orbital):", camera.radius);
        console.log("- Camera theta:", camera.theta, "phi:", camera.phi);
        console.log("- Corpos a renderizar:", solarSystem?.celestialBodies?.length || 0);
        if (timeline) {
            console.log("- Timeline data:", timeline.getTimeInfo());
        }
    }

    // Verificar se sistema solar existe e tem corpos
    if (!solarSystem || !solarSystem.celestialBodies || solarSystem.celestialBodies.length === 0) {
        console.error("Sistema solar não carregado ou sem corpos celestes");
        requestAnimationFrame(render);
        return;
    }

    // Usar tempo da timeline em vez do tempo real
    let simulationTime;
    if (timeline) {
        // Obter tempo em anos desde o início da simulação
        simulationTime = timeline.getYearsSinceStart() * 365.25; // converter anos para dias
    } else {
        // Fallback para o sistema antigo
        simulationTime = time * CONFIG.simulationVelocity / 86400; // time em segundos -> dias
    }
    
    // Renderizar fundo
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, background.bufferInfo);
    twgl.setUniforms(programInfo, {
        u_viewProjection: viewProjectionMatrix,
        u_texture: background.texture,
    });

    solarSystem.update(simulationTime);
    solarSystem.render(viewProjectionMatrix, lightPosition, cameraPosition);

    // Verificar erros após renderização
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error("WebGL error após renderização:", error);
    }

    requestAnimationFrame(render);
}

document.addEventListener('DOMContentLoaded', main);