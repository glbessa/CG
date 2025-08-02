import { canvas } from './init.js';
import * as glMatrix from '../static/gl-matrix/esm/index.js';

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
  far: 100000000,        // plano distante
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
  maxRadius: 100000000,
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

export default camera;