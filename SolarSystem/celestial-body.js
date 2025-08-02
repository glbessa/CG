import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';

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
    this.worldMatrix = m4.create();
    this.worldInverseTranspose = m4.create();
    
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

export default CelestialBody;