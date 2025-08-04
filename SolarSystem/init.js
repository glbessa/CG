import * as twgl from "../static/twgl/twgl-full.module.js";

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

// Definir tamanho inicial do canvas se necessário
if (canvas.width === 0 || canvas.height === 0) {
  canvas.width = 800;
  canvas.height = 600;
}

// Configurar estilo do canvas para preencher a viewport
if (!canvas.style.width) {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
}

twgl.setDefaults({
  attribPrefix: "",
});

export { canvas, gl };