import * as glMatrix from '../static/gl-matrix/esm/index.js';

class Camera {
  constructor(options = {}) {
    // Modo orbital
    this.theta = 0;        // ângulo horizontal (radians)
    this.phi = 0.01;       // ângulo vertical (radians) - polo norte solar (quase 0)
    this.radius = 100;      // distância da câmera

    // Modo livre
    this.position = [0, 100, 0];  // posição da câmera no modo livre - polo norte solar
    this.yaw = 0;          // rotação horizontal (radians)
    this.pitch = -Math.PI/2;      // rotação vertical (radians) - olhando para baixo do polo norte
    
    // Configurações gerais
    this.fov = Math.PI / 4; // campo de visão
    this.near = 0.1;       // plano próximo
    this.far = 100000000;        // plano distante
    this.speed = 0.1;      // velocidade de movimento
    this.sensitivity = 0.005; // sensibilidade do mouse

    // Estados de controle
    this.mode = 'orbital'; // 'orbital' ou 'free'
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.keys = {};        // teclas pressionadas
    this.target = [0, 0, 0]; // alvo da câmera (usado no modo orbital)
    this.lookAt = null;    // direção de olhar (usado no modo livre)

    // Limites para modo orbital
    this.minRadius = 2.0;
    this.maxRadius = 100000000;
    this.minPhi = 0.01;
    this.maxPhi = Math.PI - 0.01;
  }
  
  // Métodos auxiliares
  getPosition() {
    if (this.mode === 'orbital') {
      const x = this.radius * Math.sin(this.phi) * Math.sin(this.theta) + this.target[0];
      const y = this.radius * Math.cos(this.phi) + this.target[1];
      const z = this.radius * Math.sin(this.phi) * Math.cos(this.theta) + this.target[2];
      return [x, y, z];
    } else {
      return [...this.position];
    }
  }
  
  getTarget() {
    if (this.mode === 'orbital') {
      return [...this.target]; // olha para o alvo definido
    } else {
      if (this.lookAt) {
        return [...this.lookAt]; // olha para uma posição específica
      }
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
  }
  
  updateProjectionMatrix(projectionMatrix, aspect) {
    const m4 = glMatrix.mat4;
    m4.perspective(projectionMatrix, this.fov, aspect, this.near, this.far);
  }
  
  updateViewMatrix(viewMatrix, up = [0, 1, 0]) {
    const m4 = glMatrix.mat4;
    const eye = this.getPosition();
    const target = this.getTarget();
    m4.lookAt(viewMatrix, eye, target, up);
  }
  
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
  }
  
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
  
  // Posicionamentos astronômicos específicos
  setToNorthPole(distance = 100) {
    this.mode = 'orbital';
    this.theta = 0;                    // qualquer ângulo horizontal
    this.phi = 0.01;                   // quase no polo norte (evita singularidade)
    this.radius = distance;
    this.target = [0, 0, 0];          // olhando para o Sol
    console.log(`Câmera posicionada no polo norte solar (distância: ${distance})`);
  }
  
  setSouthPole(distance = 100) {
    this.mode = 'orbital';
    this.theta = 0;                    // qualquer ângulo horizontal
    this.phi = Math.PI - 0.01;         // quase no polo sul (evita singularidade)
    this.radius = distance;
    this.target = [0, 0, 0];          // olhando para o Sol
    console.log(`Câmera posicionada no polo sul solar (distância: ${distance})`);
  }
  
  setEclipticView(distance = 100, angle = 0) {
    this.mode = 'orbital';
    this.theta = angle;                // ângulo no plano eclíptico
    this.phi = Math.PI / 2;           // no plano eclíptico (Y = 0)
    this.radius = distance;
    this.target = [0, 0, 0];          // olhando para o Sol
    console.log(`Câmera posicionada no plano eclíptico (ângulo: ${(angle * 180 / Math.PI).toFixed(1)}°, distância: ${distance})`);
  }
  
  setInclinedView(inclination = 30, azimuth = 0, distance = 100) {
    this.mode = 'orbital';
    this.theta = azimuth * Math.PI / 180;                    // ângulo horizontal em graus
    this.phi = (90 - inclination) * Math.PI / 180;          // ângulo vertical em graus (90° - inclinação)
    this.radius = distance;
    this.target = [0, 0, 0];
    console.log(`Câmera posicionada com inclinação ${inclination}° e azimute ${azimuth}° (distância: ${distance})`);
  }
  
  followCelestialBody(body, distance = 50, height = 20) {
    if (!body || !body.getCurrentPosition) {
      console.warn('Corpo celeste inválido para seguir');
      return;
    }
    
    const bodyPos = body.getCurrentPosition();
    this.mode = 'free';
    
    // Posicionar câmera atrás e acima do corpo
    this.position = [
      bodyPos[0] - distance,  // atrás do corpo
      bodyPos[1] + height,    // acima do corpo
      bodyPos[2]
    ];
    
    // Olhar para o corpo
    this.lookAt = [...bodyPos];
    console.log(`Câmera seguindo ${body.name || 'corpo celeste'}`);
  }
  
  setToHeliocentricCoords(rad_au, hgi_lat_deg, hgi_lon_deg, lookAtSun = true) {
    // Converter coordenadas heliocêntricas para cartesianas
    const hgi_lat = hgi_lat_deg * Math.PI / 180;
    const hgi_lon = hgi_lon_deg * Math.PI / 180;
    
    this.mode = 'free';
    this.position = [
      rad_au * Math.cos(hgi_lat) * Math.cos(hgi_lon),
      rad_au * Math.sin(hgi_lat),
      rad_au * Math.cos(hgi_lat) * Math.sin(hgi_lon)
    ];
    
    if (lookAtSun) {
      this.lookAt = [0, 0, 0]; // olhar para o Sol
    }
  }
  
  // Métodos de conveniência para pontos de vista específicos
  setTopView(distance = 200) {
    this.setToNorthPole(distance);
  }
  
  setBottomView(distance = 200) {
    this.setSouthPole(distance);
  }
  
  setSideView(distance = 200) {
    this.setEclipticView(distance, 0);
  }
  
  setIsometricView(distance = 150) {
    this.setInclinedView(35.26, 45, distance); // Ângulos isométricos clássicos
  }
  
  // Animação suave entre posições
  animateTo(targetTheta, targetPhi, targetRadius, duration = 2000) {
    if (this.mode !== 'orbital') {
      console.warn('Animação só funciona no modo orbital');
      return;
    }
    
    const startTheta = this.theta;
    const startPhi = this.phi;
    const startRadius = this.radius;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Interpolação suave (easing)
      const t = 0.5 * (1 - Math.cos(progress * Math.PI));
      
      this.theta = startTheta + (targetTheta - startTheta) * t;
      this.phi = startPhi + (targetPhi - startPhi) * t;
      this.radius = startRadius + (targetRadius - startRadius) * t;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('Animação da câmera concluída');
      }
    };
    
    requestAnimationFrame(animate);
  }
};

const camera = new Camera();

export default camera;