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
    
    // Coordenadas heliocêntricas para posição inicial
    this.heliocentricCoords = {
      rad_au: options.rad_au || null,
      hgi_lat: options.hgi_lat || null,
      hgi_lon: options.hgi_lon || null
    };
    
    // Calcular posição inicial baseada em coordenadas heliocêntricas ou usar posição fornecida
    this.position = this.calculateInitialPosition(options);
    this.rotation = options.rotation || [0, 0, 0];
    
    // Suporte para centro orbital como posição ou como objeto CelestialBody
    this.orbitParent = null;
    this.orbitCenter = [0, 0, 0];
    this.setOrbitCenter(options.orbitCenter || options.orbitParent || [0, 0, 0]);
    
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

  // Calcula posição inicial baseada em coordenadas heliocêntricas ou posição fornecida
  calculateInitialPosition(options) {
    // Se posição explícita foi fornecida, usar ela
    if (options.position) {
      return options.position;
    }
    
    // Se coordenadas heliocêntricas foram fornecidas, converter para cartesianas
    if (options.rad_au !== undefined && options.hgi_lat !== undefined && options.hgi_lon !== undefined) {
      return this.heliocentricToCartesian(options.rad_au, options.hgi_lat, options.hgi_lon);
    }
    
    // Posição padrão
    return [0, 0, 0];
  }

  // Converte coordenadas heliocêntricas para cartesianas
  heliocentricToCartesian(rad_au, hgi_lat_deg, hgi_lon_deg) {
    // Converter graus para radianos
    const hgi_lat = hgi_lat_deg * Math.PI / 180;
    const hgi_lon = hgi_lon_deg * Math.PI / 180;
    
    // Aplicar escala visual
    const visualDistance = rad_au / CONFIG.scale;
    
    // Converter para coordenadas cartesianas
    // Sistema heliocêntrico: origem no Sol
    const x = visualDistance * Math.cos(hgi_lat) * Math.cos(hgi_lon);
    const y = visualDistance * Math.sin(hgi_lat);
    const z = visualDistance * Math.cos(hgi_lat) * Math.sin(hgi_lon);
    
    return [x, y, z];
  }

  // Converte coordenadas cartesianas para heliocêntricas
  cartesianToHeliocentric(x, y, z) {
    // Calcular distância radial
    const rad_au = Math.sqrt(x * x + y * y + z * z) * CONFIG.scale;
    
    // Calcular latitude heliográfica
    const hgi_lat_rad = Math.asin(y / (rad_au / CONFIG.scale));
    const hgi_lat_deg = hgi_lat_rad * 180 / Math.PI;
    
    // Calcular longitude heliográfica
    const hgi_lon_rad = Math.atan2(z, x);
    const hgi_lon_deg = hgi_lon_rad * 180 / Math.PI;
    
    return {
      rad_au: rad_au,
      hgi_lat: hgi_lat_deg,
      hgi_lon: hgi_lon_deg
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
      const currentOrbitCenter = this.getCurrentOrbitCenter();
      m4.translate(this.worldMatrix, this.worldMatrix, [
        position.x + currentOrbitCenter[0], 
        currentOrbitCenter[1], 
        position.z + currentOrbitCenter[2]
      ]);
    } else if (this.orbitRadius > 0) {
      // Fallback para órbita circular simples
      const orbitAngle = time * this.orbitSpeed;
      const currentOrbitCenter = this.getCurrentOrbitCenter();
      const orbitX = currentOrbitCenter[0] + this.orbitRadius * Math.cos(orbitAngle);
      const orbitZ = currentOrbitCenter[2] + this.orbitRadius * Math.sin(orbitAngle);
      m4.translate(this.worldMatrix, this.worldMatrix, [orbitX, currentOrbitCenter[1], orbitZ]);
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
      },
      heliocentricCoords: {
        initial: this.getInitialHeliocentricCoords(),
        current: this.getCurrentHeliocentricCoords(),
        hasInitialCoords: this.hasHeliocentricCoords()
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
    this.setOrbitCenter(center);
  }
  
  // Método para definir o centro orbital (posição ou objeto CelestialBody)
  setOrbitCenter(center) {
    if (center instanceof CelestialBody) {
      this.orbitParent = center;
      this.orbitCenter = [0, 0, 0]; // Será atualizado dinamicamente
    } else if (Array.isArray(center) && center.length >= 3) {
      this.orbitParent = null;
      this.orbitCenter = [center[0], center[1], center[2]];
    } else {
      this.orbitParent = null;
      this.orbitCenter = [0, 0, 0];
    }
  }
  
  // Método para obter a posição atual do centro orbital
  getCurrentOrbitCenter() {
    if (this.orbitParent) {
      return this.orbitParent.getCurrentPosition();
    }
    return this.orbitCenter;
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
    
    this.setOrbitCenter(center);
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
    const currentOrbitCenter = this.getCurrentOrbitCenter();
    const currentDistance = this.getDistanceFrom({ getCurrentPosition: () => currentOrbitCenter });
    const velocityFactor = Math.sqrt(this.ellipticalOrbit.aphelion / currentDistance);
    return this.orbitSpeed * velocityFactor;
  }
  
  // Métodos de conveniência para trabalhar com objetos pai
  
  // Define um objeto CelestialBody como pai orbital
  setOrbitParent(parentBody, orbitRadius = null, orbitSpeed = null) {
    this.setOrbitCenter(parentBody);
    if (orbitRadius !== null) this.orbitRadius = orbitRadius;
    if (orbitSpeed !== null) this.orbitSpeed = orbitSpeed;
  }
  
  // Verifica se este corpo está orbitando outro objeto
  hasOrbitParent() {
    return this.orbitParent !== null;
  }
  
  // Obtém o objeto pai (se houver)
  getOrbitParent() {
    return this.orbitParent;
  }
  
  // Calcula a distância atual do centro orbital
  getDistanceFromOrbitCenter() {
    const currentOrbitCenter = this.getCurrentOrbitCenter();
    const currentPosition = this.getCurrentPosition();
    const dx = currentPosition[0] - currentOrbitCenter[0];
    const dy = currentPosition[1] - currentOrbitCenter[1];
    const dz = currentPosition[2] - currentOrbitCenter[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  // Métodos para trabalhar com coordenadas heliocêntricas
  
  // Define a posição usando coordenadas heliocêntricas
  setHeliocentricPosition(rad_au, hgi_lat_deg, hgi_lon_deg) {
    this.heliocentricCoords = {
      rad_au: rad_au,
      hgi_lat: hgi_lat_deg,
      hgi_lon: hgi_lon_deg
    };
    this.position = this.heliocentricToCartesian(rad_au, hgi_lat_deg, hgi_lon_deg);
  }
  
  // Obtém as coordenadas heliocêntricas atuais
  getCurrentHeliocentricCoords() {
    const currentPos = this.getCurrentPosition();
    return this.cartesianToHeliocentric(currentPos[0], currentPos[1], currentPos[2]);
  }
  
  // Obtém as coordenadas heliocêntricas iniciais (se definidas)
  getInitialHeliocentricCoords() {
    return this.heliocentricCoords;
  }
  
  // Verifica se foram definidas coordenadas heliocêntricas iniciais
  hasHeliocentricCoords() {
    return this.heliocentricCoords.rad_au !== null && 
           this.heliocentricCoords.hgi_lat !== null && 
           this.heliocentricCoords.hgi_lon !== null;
  }
  
  // Método para debug das coordenadas heliocêntricas
  logHeliocentricInfo() {
    const current = this.getCurrentHeliocentricCoords();
    const initial = this.getInitialHeliocentricCoords();
    
    console.log(`${this.name} - Coordenadas Heliocêntricas:`, {
      initial: {
        rad_au: initial.rad_au?.toFixed(3) || "N/A",
        hgi_lat: initial.hgi_lat?.toFixed(2) || "N/A",
        hgi_lon: initial.hgi_lon?.toFixed(2) || "N/A"
      },
      current: {
        rad_au: current.rad_au.toFixed(3),
        hgi_lat: current.hgi_lat.toFixed(2),
        hgi_lon: current.hgi_lon.toFixed(2)
      },
      cartesian: {
        position: this.getCurrentPosition().map(v => v.toFixed(2))
      }
    });
  }
}

export default CelestialBody;