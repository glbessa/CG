import * as twgl from "../static/twgl/twgl-full.module.js";
import * as m4 from '../static/gl-matrix/esm/mat4.js';
import { gl } from './init.js';
import CONFIG from './config.js';

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
    this.color = options.color || [0, 0, 0, 1.0]; // Cor padrão (preto)
    
    // Parâmetros para órbita elíptica
    this.ellipticalOrbit = this.calculateEllipticalOrbitParams();
    
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
    
    return this.physicalData.diameter / CONFIG.scale;
  }

  // Calcula o raio da órbita baseado na distância do Sol
  calculateOrbitRadius() {
    if (this.physicalData.distanceFromSun === 0) return 0;
    if (this.name.toLowerCase() === 'sun' || this.name.toLowerCase() === 'sol') return 0;

    const distanceInAU = this.physicalData.distanceFromSun / CONFIG.earthDistance; // distância em UA
    return distanceInAU / CONFIG.scale;
  }

  // Calcula a velocidade orbital baseada no período orbital
  calculateOrbitSpeed() {
    if (this.physicalData.orbitalPeriod === 0) return 0;
    if (this.name.toLowerCase() === 'sun' || this.name.toLowerCase() === 'sol') return 0;
    
    return (2 * Math.PI / this.physicalData.orbitalPeriod) * CONFIG.simulationVelocity;
  }

  // Calcula a velocidade de rotação baseada no período de rotação
  calculateRotationSpeed() {
    if (this.physicalData.rotationPeriod === 0) return [0, 0.5, 0];
    const speed = (23.9 / Math.abs(this.physicalData.rotationPeriod)) * CONFIG.simulationVelocity; // 23.9 horas é o dia terrestre
    const direction = this.physicalData.rotationPeriod < 0 ? -1 : 1; // Considera rotação retrógrada (Vênus, Urano)
    return [0, speed * direction, 0];
  }

  // Calcula parâmetros para órbita elíptica realista
  calculateEllipticalOrbitParams() {
    if (this.physicalData.distanceFromSun === 0 || 
        this.name.toLowerCase() === 'sun' || 
        this.name.toLowerCase() === 'sol') {
      return {
        semiMajorAxis: 0,
        semiMinorAxis: 0,
        eccentricity: 0,
        perihelion: 0,
        aphelion: 0,
        focalDistance: 0,
        isElliptical: false
      };
    }

    // Converter distâncias reais para escala visual
    const earthDistance = 149.6; // milhões de km (1 AU)
    
    // Calcular semi-eixo maior (a) e excentricidade (e)
    const realSemiMajorAxis = this.physicalData.distanceFromSun; // distância média em milhões de km
    const eccentricity = this.physicalData.orbitalEccentricity;
  
    const relativeDistance = realSemiMajorAxis / earthDistance;
    const visualSemiMajorAxis = relativeDistance / CONFIG.scale;
    
    // Calcular semi-eixo menor (b) usando: b = a * sqrt(1 - e²)
    const semiMinorAxis = visualSemiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
    
    // Calcular distância focal (c) usando: c = a * e
    const focalDistance = visualSemiMajorAxis * eccentricity;
    
    // Calcular periélio e afélio visuais
    const visualPerihelion = visualSemiMajorAxis * (1 - eccentricity);
    const visualAphelion = visualSemiMajorAxis * (1 + eccentricity);
    
    return {
      semiMajorAxis: visualSemiMajorAxis,
      semiMinorAxis: semiMinorAxis,
      eccentricity: eccentricity,
      perihelion: visualPerihelion,
      aphelion: visualAphelion,
      focalDistance: focalDistance,
      isElliptical: eccentricity > 0.001, // Considerar elíptica se e > 0.001
      inclination: this.physicalData.orbitalInclination * Math.PI / 180 // Converter para radianos
    };
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
  
  // Calcula a posição atual na órbita elíptica
  calculateEllipticalPosition(time) {
    const orbit = this.ellipticalOrbit;
    
    // Anomalia média (varia linearmente com o tempo)
    const meanAnomaly = (time * this.orbitSpeed) % (2 * Math.PI);
    
    // Resolver a equação de Kepler para encontrar a anomalia excêntrica
    // E - e*sin(E) = M (onde E = anomalia excêntrica, e = excentricidade, M = anomalia média)
    const eccentricAnomaly = this.solveKeplersEquation(meanAnomaly, orbit.eccentricity);
    
    // Calcular posição na órbita elíptica
    const x = orbit.semiMajorAxis * (Math.cos(eccentricAnomaly) - orbit.eccentricity);
    const z = orbit.semiMinorAxis * Math.sin(eccentricAnomaly);
    
    // Aplicar inclinação orbital se houver
    let finalX = x;
    let finalY = 0;
    let finalZ = z;
    
    if (orbit.inclination && Math.abs(orbit.inclination) > 0.001) {
      // Rotacionar em torno do eixo X para aplicar inclinação
      finalY = z * Math.sin(orbit.inclination);
      finalZ = z * Math.cos(orbit.inclination);
    }
    
    return { x: finalX, y: finalY, z: finalZ };
  }
  
  // Resolve a equação de Kepler usando método iterativo de Newton-Raphson
  solveKeplersEquation(meanAnomaly, eccentricity, maxIterations = 10, tolerance = 1e-6) {
    let E = meanAnomaly; // Primeira aproximação
    
    for (let i = 0; i < maxIterations; i++) {
      const deltaE = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
      E = E - deltaE;
      
      if (Math.abs(deltaE) < tolerance) {
        break;
      }
    }
    
    return E;
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
    
    // Aplicar órbita elíptica se houver
    if (this.ellipticalOrbit.isElliptical && this.ellipticalOrbit.semiMajorAxis > 0) {
      const position = this.calculateEllipticalPosition(time);
      m4.translate(this.worldMatrix, this.worldMatrix, [
        position.x + this.orbitCenter[0], 
        this.orbitCenter[1], 
        position.z + this.orbitCenter[2]
      ]);
    } else if (this.orbitRadius > 0) {
      // Fallback para órbita circular simples
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
    gl.useProgram(programInfo.program);
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
      u_time: performance.now() * 0.00001, // Velocidade da animação do shader do sol
      u_useTexture: this.useTexture,
      u_isEmissive: this.isEmissive,
    };
    
    if (this.useTexture && this.texture) {
      uniforms.u_texture = this.texture;
    } else {
      uniforms.u_color = this.color;
    }
    
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, this.bufferInfo); // Desenhar
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
      },
      ellipticalOrbit: {
        semiMajorAxis: this.ellipticalOrbit.semiMajorAxis,
        semiMinorAxis: this.ellipticalOrbit.semiMinorAxis,
        eccentricity: this.ellipticalOrbit.eccentricity,
        perihelion: this.ellipticalOrbit.perihelion,
        aphelion: this.ellipticalOrbit.aphelion,
        inclination: this.ellipticalOrbit.inclination,
        isElliptical: this.ellipticalOrbit.isElliptical
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
      },
      ellipticalOrbit: {
        semiMajorAxis: this.ellipticalOrbit.semiMajorAxis.toFixed(2),
        semiMinorAxis: this.ellipticalOrbit.semiMinorAxis.toFixed(2),
        eccentricity: this.ellipticalOrbit.eccentricity.toFixed(4),
        isElliptical: this.ellipticalOrbit.isElliptical
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
  
  // Novo método para configurar órbita elíptica manualmente
  setEllipticalOrbit(semiMajorAxis, eccentricity, inclination = 0, speed = null, center = [0, 0, 0]) {
    this.ellipticalOrbit = {
      semiMajorAxis: semiMajorAxis,
      semiMinorAxis: semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity),
      eccentricity: eccentricity,
      perihelion: semiMajorAxis * (1 - eccentricity),
      aphelion: semiMajorAxis * (1 + eccentricity),
      focalDistance: semiMajorAxis * eccentricity,
      isElliptical: eccentricity > 0.001,
      inclination: inclination
    };
    
    if (speed !== null) {
      this.orbitSpeed = speed;
    }
    
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
  
  // Método para obter a velocidade orbital atual (útil para efeitos visuais)
  getCurrentOrbitalVelocity() {
    if (!this.ellipticalOrbit.isElliptical) {
      return this.orbitSpeed;
    }
    
    // A velocidade orbital varia na elipse (mais rápida no periélio)
    const currentDistance = this.getDistanceFrom({ getCurrentPosition: () => this.orbitCenter });
    const velocityFactor = Math.sqrt(this.ellipticalOrbit.aphelion / currentDistance);
    return this.orbitSpeed * velocityFactor;
  }
}

export default CelestialBody;