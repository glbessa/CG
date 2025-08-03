import * as twgl from "../static/twgl/twgl-full.module.js";

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

twgl.setDefaults({
  attribPrefix: "",
});

export { canvas, gl };