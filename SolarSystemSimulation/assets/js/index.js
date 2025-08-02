"use strict"

import OrbitalObject from "./orbital-object.js";
import * as twgl from "../static/twgl/twgl-full.js";

const distanceScale = 30e6;
const sizeScale = 3000;
const orbitScale = 2 * Math.PI; // pode ser ajustado para seu sistema

const PLANETS = [
    new OrbitalObject("Mercury", 57.9 / 30, 0.206, 4879 / 3000, orbitScale / 88, [0.6, 0.6, 0.6]),
    new OrbitalObject("Venus", 108.2 / 30, 0.007, 12104 / 3000, orbitScale / 224.7, [1.0, 0.9, 0.6]),
    new OrbitalObject("Earth", 149.6 / 30, 0.017, 12756 / 3000, orbitScale / 365.2, [0.2, 0.5, 1]),
    new OrbitalObject("Mars", 228.0 / 30, 0.094, 6792 / 3000, orbitScale / 687, [1.0, 0.4, 0.2]),
    new OrbitalObject("Jupiter", 778.5 / 30, 0.049, 142984 / 3000, orbitScale / 4331, [1.0, 0.9, 0.7]),
    new OrbitalObject("Saturn", 1432 / 30, 0.052, 120536 / 3000, orbitScale / 10747, [1.0, 0.85, 0.5]),
    new OrbitalObject("Uranus", 2867 / 30, 0.047, 51118 / 3000, orbitScale / 30589, [0.6, 0.9, 1.0]),
    new OrbitalObject("Neptune", 4515 / 30, 0.010, 49528 / 3000, orbitScale / 59800, [0.3, 0.5, 1.0]),
    new OrbitalObject("Pluto", 5906.4 / 30, 0.244, 2376 / 3000, orbitScale / 90560, [0.7, 0.7, 0.7]),
]

let gl;
let canvas;
let programInfo;
let sphereBufferInfo;
let camera = {
    position: [0, 50, 100],
    target: [0, 0, 0],
    up: [0, 1, 0]
};

function init() {
    canvas = document.getElementById('canvas'); // Corrigido para 'canvas' conforme o HTML
    gl = canvas.getContext('webgl');

    if (!gl) {
        throw new Error("Unable to initialize WebGL.");
    }

    programInfo = twgl.createProgramInfo(gl, [
        './assets/shaders/shader.vert',
        './assets/shaders/shader.frag'
    ]);

    requestAnimationFrame(render);
}

function render() {
    time *= 0.001;

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    for (const planet of PLANETS) {
        const u_world = planet.getMatrix(time);

        const uniforms = {
            u_color: planet.color,
            u_world,
            u_viewProjection: viewProjection,
        };

        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, sphereBufferInfo);
    }

    requestAnimationFrame(render);
}

window.addEventListener('DOMContentLoaded', init);