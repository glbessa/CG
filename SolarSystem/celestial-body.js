import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';

class CelestialBody {
  constructor(options = {}) {
    this.name = options.name || "Unnamed";
    
    // Dados físicos do data.json
    this.physicalData = {
      mass: options.mass || 0,
      diameter: options.diameter || 0,
      density: options.density || 0,
      gravity: options.gravity || 0,
      escapeVelocity: options.escapeVelocity || 0,
      rotationPeriod: options.rotationPeriod || 0,
      lengthOfDay: options.lengthOfDay || 0,
      distanceFromSun: options.distanceFromSun || 0,
      perihelion: options.perihelion || 0,
      aphelion: options.aphelion || 0,
      orbitalPeriod: options.orbitalPeriod || 0,
      orbitalVelocity: options.orbitalVelocity || 0,
      orbitalInclination: options.orbitalInclination || 0,
      orbitalEccentricity: options.orbitalEccentricity || 0,
      obliquityToOrbit: options.obliquityToOrbit || 0,
      meanTemperature: options.meanTemperature || 0,
      surfacePressure: options.surfacePressure || 0,
      numberOfMoons: options.numberOfMoons || 0,
      ringSystem: options.ringSystem || "No",
      globalMagneticField: options.globalMagneticField || "No"
    };

    // Converter dados físicos para propriedades visuais (se não fornecidas manualmente)
    this.radius = options.radius || this.calculateVisualRadius();
    this.orbitRadius = options.orbitRadius || this.calculateOrbitRadius();
    this.orbitSpeed = options.orbitSpeed || this.calculateOrbitSpeed();
    this.rotationSpeed = options.rotationSpeed || this.calculateRotationSpeed();
    this.color = options.color || this.calculateColor();
    
    this.position = options.position || [0, 0, 0];
    this.rotation = options.rotation || [0, 0, 0];
    this.orbitCenter = options.orbitCenter || [0, 0, 0];
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

  // Calcula o raio visual baseado no diâmetro real (com escala)
  calculateVisualRadius() {
    if (this.physicalData.diameter === 0) return 1.0;
    
    // Escala logarítmica para visualização (Sol como referência)
    if (this.name.toLowerCase() === 'sun' || this.name.toLowerCase() === 'sol') {
      return 2.0; // Sol fixo em 2.0
    }
    
    const sunDiameter = 1391000; // km
    const logScale = Math.log(this.physicalData.diameter / 12756) * 0.3 + 0.8; // Terra como base
    return Math.max(0.2, Math.min(logScale, 2.5)); // Limita entre 0.2 e 2.5
  }

  // Calcula o raio da órbita baseado na distância do Sol
  calculateOrbitRadius() {
    if (this.physicalData.distanceFromSun === 0) return 0;
    if (this.name.toLowerCase() === 'sun' || this.name.toLowerCase() === 'sol') return 0;
    
    // Escala para visualização com compressão logarítmica
    const earthDistance = 149.6; // milhões de km
    const relativeDistance = this.physicalData.distanceFromSun / earthDistance;
    
    // Usar escala logarítmica para distâncias muito grandes
    if (relativeDistance > 10) {
      return 15 + Math.log(relativeDistance / 10) * 5;
    } else {
      return relativeDistance * 5; // Planetas internos mais próximos
    }
  }

  // Calcula a velocidade orbital baseada no período orbital
  calculateOrbitSpeed() {
    if (this.physicalData.orbitalPeriod === 0) return 0;
    if (this.name.toLowerCase() === 'sun' || this.name.toLowerCase() === 'sol') return 0;
    
    // Velocidade proporcional ao período (mais rápido para visualização)
    const earthPeriod = 365.2; // dias
    return (earthPeriod / this.physicalData.orbitalPeriod) * 1.0; // Aumentado para visualização
  }

  // Calcula a velocidade de rotação baseada no período de rotação
  calculateRotationSpeed() {
    if (this.physicalData.rotationPeriod === 0) return [0, 0.5, 0];
    
    // Velocidade de rotação em Y (mais rápida para visualização)
    const earthRotation = 24; // horas
    const speed = (earthRotation / Math.abs(this.physicalData.rotationPeriod)) * 0.5;
    
    // Considera rotação retrógrada (Vênus, Urano)
    const direction = this.physicalData.rotationPeriod < 0 ? -1 : 1;
    
    return [0, speed * direction, 0];
  }

  // Calcula cor baseada na temperatura média
  calculateColor() {
    const temp = this.physicalData.meanTemperature;
    
    // Caso especial para o Sol
    if (this.name.toLowerCase() === 'sun' || this.name.toLowerCase() === 'sol') {
      return [1.0, 1.0, 0.3, 1.0]; // Amarelo brilhante para o Sol
    }
    
    // Mapeamento de temperatura para cor
    if (temp > 400) return [1.0, 0.8, 0.3, 1.0]; // Amarelo quente (Vênus)
    if (temp > 0) return [0.8, 0.7, 0.5, 1.0];   // Marrom/bege (Terra)
    if (temp > -100) return [0.8, 0.5, 0.3, 1.0]; // Laranja/vermelho (Marte)
    if (temp > -150) return [0.9, 0.8, 0.6, 1.0]; // Amarelo pálido (Júpiter)
    if (temp > -180) return [0.9, 0.9, 0.7, 1.0]; // Amarelo claro (Saturno)
    if (temp > -200) return [0.4, 0.8, 0.9, 1.0]; // Azul (Urano)
    return [0.2, 0.4, 0.8, 1.0]; // Azul escuro (Netuno, Plutão)
  }

  // Método estático para carregar do data.json
  static async loadFromDataJson(name, visualOptions = {}) {
    try {
      const response = await fetch('./planetary-data.json');
      const data = await response.json();
      
      if (!data[name.toLowerCase()]) {
        throw new Error(`Corpo celeste "${name}" não encontrado no planetary-data.json`);
      }

      const bodyData = data[name.toLowerCase()];
      
      return new CelestialBody({
        name: name,
        ...bodyData,
        ...visualOptions
      });
    } catch (error) {
      console.error(`Erro ao carregar dados para ${name}:`, error);
      return new CelestialBody({ name: name });
    }
  }

  // Método estático para carregar todos os corpos celestes
  static async loadAllFromDataJson(visualOptions = {}) {
    try {
      const response = await fetch('./planetary-data.json');
      const data = await response.json();
      
      const bodies = [];
      
      for (const [name, bodyData] of Object.entries(data)) {
        const options = visualOptions[name] || {};
        const body = new CelestialBody({
          name: name,
          ...bodyData,
          ...options
        });
        
        bodies.push(body);
      }
      
      return bodies;
    } catch (error) {
      console.error('Erro ao carregar planetary-data.json:', error);
      return [];
    }
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
  
  // Método para obter informações detalhadas
  getDetailedInfo() {
    return {
      name: this.name,
      physicalData: this.physicalData,
      visualProperties: {
        radius: this.radius,
        orbitRadius: this.orbitRadius,
        orbitSpeed: this.orbitSpeed,
        rotationSpeed: this.rotationSpeed,
        color: this.color,
        isEmissive: this.isEmissive
      }
    };
  }

  // Método para debug das conversões
  logConversionInfo() {
    console.log(`${this.name}:`, {
      physical: {
        diameter: `${this.physicalData.diameter} km`,
        distance: `${this.physicalData.distanceFromSun} milhões de km`,
        orbitalPeriod: `${this.physicalData.orbitalPeriod} dias`,
        rotationPeriod: `${this.physicalData.rotationPeriod} horas`,
        temperature: `${this.physicalData.meanTemperature}°C`
      },
      visual: {
        radius: this.radius.toFixed(2),
        orbitRadius: this.orbitRadius.toFixed(2),
        orbitSpeed: this.orbitSpeed.toFixed(4),
        rotationSpeed: this.rotationSpeed[1].toFixed(4)
      }
    });
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