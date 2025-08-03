"use strict";

import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';
import System from "./system.js";
import camera from "./camera.js";
import CONFIG from "./config.js";

let programInfo;
let sunProgramInfo;
let cometProgramInfo;
let solarSystem;
let projectionMatrix = m4.create();
let viewMatrix = m4.create();

async function main() {
    const shaders = {
        vertex: await fetch(CONFIG.shaders.vertex).then(response => response.text()),
        fragment: await fetch(CONFIG.shaders.fragment).then(response => response.text()),
        sunFragment: await fetch(CONFIG.shaders.sunFragment).then(response => response.text()),
        cometFragment: await fetch(CONFIG.shaders.cometFragment).then(response => response.text())
    }

    programInfo = twgl.createProgramInfo(gl, [shaders.vertex, shaders.fragment]);
    sunProgramInfo = twgl.createProgramInfo(gl, [shaders.vertex, shaders.sunFragment]);
    cometProgramInfo = twgl.createProgramInfo(gl, [shaders.vertex, shaders.cometFragment]);

    solarSystem = new System({});
    await solarSystem.loadFromDataJson();

    requestAnimationFrame(render);
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

    solarSystem.update(time);
    solarSystem.celestialBodies.forEach(body => {
      if (body.name === 'sun') {
        body.render(sunProgramInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      } else if (body.name === 'comet_halley') {
        body.render(cometProgramInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      } else {
        body.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      }
    });

    requestAnimationFrame(render);
}

main()