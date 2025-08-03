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
    // CONFIG.bodyScale - usado para escalar o tamanho dos corpos celestes
    // CONFIG.scale - usado para escalar distâncias orbitais
    this.radius = options.radius || this.calculateVisualRadius();
    this.rotationSpeed = options.rotationSpeed || this.calculateRotationSpeed();
    this.color = options.color || [1, 1, 1, 1.0]; // Cor padrão (branco)
    
    // Velocidade orbital (calculada ou fornecida manualmente)
    this.orbitSpeed = options.orbitSpeed || this.calculateOrbitSpeed();

    // Parâmetros para órbita elíptica
    this.ellipticalOrbit = this.calculateEllipticalOrbitParams();
    
    // Coordenadas heliocêntricas para posição inicial
    this.heliocentricCoords = {
      rad_au: options.rad_au || null,
      hgi_lat: options.hgi_lat || null,
      hgi_lon: options.hgi_lon || null
    };
    
    // Dados temporais de coordenadas heliocêntricas
    this.temporalData = {
      loaded: false,
      data: [],
      currentIndex: 0,
      interpolation: options.interpolation !== false, // Por padrão ativo
      useTemporalData: options.useTemporalData !== false // Por padrão ativo se dados disponíveis
    };
    
    // Configurações de tempo
    this.timeConfig = {
      startYear: options.startYear || 1980,
      startDay: options.startDay || 1,
      startHour: options.startHour || 0,
      timeScale: options.timeScale || 1.0, // Fator de escala temporal
      currentSimulationTime: 0
    };
    
    // Calcular posição inicial baseada em coordenadas heliocêntricas ou usar posição fornecida
    this.position = this.calculateInitialPosition(options);
    this.rotation = options.rotation || [0, 0, 0];
    
    // Suporte para centro orbital como posição ou como objeto CelestialBody
    this.orbitParent = options.orbitParent || null;
    this.orbitCenter = this.orbitParent ? null : (options.orbitCenter || [0, 0, 0]);
    
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
    if (this.physicalData.diameter === 0) return CONFIG.logarithmicScale ? CONFIG.minBodySize : 1.0;
    
    // Verificar se está usando escala logarítmica
    if (CONFIG.logarithmicScale) {
      return this.calculateLogarithmicRadius();
    }
    
    // Escala linear tradicional
    if (this.name.toLowerCase() === 'sun' || this.name.toLowerCase() === 'sol') {
      return CONFIG.sunSizeOverride || (this.physicalData.diameter / CONFIG.bodyScale);
    }
    
    return this.physicalData.diameter / CONFIG.bodyScale;
  }

  // Calcula o raio usando escala logarítmica
  calculateLogarithmicRadius() {
    const diameter = this.physicalData.diameter;
    
    if (diameter <= 0) return CONFIG.minBodySize;
    
    // Usar diâmetros de referência para escala logarítmica
    const minDiameter = CONFIG.referenceDiameters ? CONFIG.referenceDiameters.min : 1; // km
    const maxDiameter = CONFIG.referenceDiameters ? CONFIG.referenceDiameters.max : 1400000; // km (Sol)
    
    // Calcular posição logarítmica
    const logMin = Math.log10(minDiameter);
    const logMax = Math.log10(maxDiameter);
    const logCurrent = Math.log10(diameter);
    
    // Normalizar entre 0 e 1
    const normalizedLog = (logCurrent - logMin) / (logMax - logMin);
    
    // Interpolar entre tamanhos mínimo e máximo
    const minSize = CONFIG.minBodySize || 0.1;
    const maxSize = CONFIG.maxBodySize || 10.0;
    
    return minSize + (maxSize - minSize) * Math.max(0, Math.min(1, normalizedLog));
  }

  // Calcula a velocidade de rotação baseada no período de rotação
  calculateRotationSpeed() {
    if (this.physicalData.rotationPeriod === 0) return [0, 0.5, 0];
    const speed = (23.9 / Math.abs(this.physicalData.rotationPeriod)) * CONFIG.simulationVelocity; // 23.9 horas é o dia terrestre
    const direction = this.physicalData.rotationPeriod < 0 ? -1 : 1; // Considera rotação retrógrada (Vênus, Urano)
    return [0, speed * direction, 0];
  }

  // Calcula a velocidade orbital baseada no período orbital
  calculateOrbitSpeed() {
    if (this.physicalData.orbitalPeriod === 0 || 
        this.name.toLowerCase() === 'sun' || 
        this.name.toLowerCase() === 'sol') {
      return 0;
    }
    
    // Converter período orbital (dias terrestres) para velocidade angular (rad/unidade de tempo)
    // Fórmula: ω = 2π / T, onde T é o período orbital
    const orbitalPeriodInDays = this.physicalData.orbitalPeriod;
    const earthYear = 365.25; // dias
    const relativeOrbitalPeriod = orbitalPeriodInDays / earthYear;
    
    // Velocidade angular ajustada pela velocidade de simulação
    return (2 * Math.PI / relativeOrbitalPeriod) * CONFIG.simulationVelocity;
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
  
  // Carrega dados temporais de coordenadas a partir de um arquivo JSON
  async loadTemporalData(filePath) {
    try {
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.temporalData.data = data;
      this.temporalData.loaded = true;
      this.temporalData.currentIndex = 0;
    } catch (error) {
      this.temporalData.loaded = false;
      throw new Error(`${this.name}: Erro ao carregar dados temporais de ${filePath}: ${error}`);
    }
  }

  // Encontra registros de dados temporais para um tempo específico
  findTemporalRecords(astronomicalTime) {
    if (!this.temporalData.loaded || this.temporalData.data.length === 0) {
      return null;
    }
    
    const { year, day, hour } = astronomicalTime;
    
    // Encontrar o índice do registro mais próximo
    let bestIndex = 0;
    let bestTimeDiff = Infinity;
    
    for (let i = 0; i < this.temporalData.data.length; i++) {
      const record = this.temporalData.data[i];
      const timeDiff = Math.abs(
        (record.YEAR - year) * 365 * 24 +
        (record.DAY - day) * 24 +
        (record.HR - hour)
      );
      
      if (timeDiff < bestTimeDiff) {
        bestTimeDiff = timeDiff;
        bestIndex = i;
      }
    }
    
    // Se interpolação está ativa, retornar registros adjacentes para interpolação
    if (this.temporalData.interpolation && bestIndex < this.temporalData.data.length - 1) {
      return {
        current: this.temporalData.data[bestIndex],
        next: this.temporalData.data[bestIndex + 1],
        factor: this.calculateInterpolationFactor(astronomicalTime, bestIndex)
      };
    }
    
    return {
      current: this.temporalData.data[bestIndex],
      next: null,
      factor: 0
    };
  }
  
  // Calcula fator de interpolação entre dois registros
  calculateInterpolationFactor(targetTime, currentIndex) {
    if (currentIndex >= this.temporalData.data.length - 1) {
      return 0;
    }
    
    const current = this.temporalData.data[currentIndex];
    const next = this.temporalData.data[currentIndex + 1];
    
    const currentTime = current.YEAR * 365 * 24 + current.DAY * 24 + current.HR;
    const nextTime = next.YEAR * 365 * 24 + next.DAY * 24 + next.HR;
    const targetTimeNum = targetTime.year * 365 * 24 + targetTime.day * 24 + targetTime.hour;
    
    if (nextTime === currentTime) return 0;
    
    return Math.max(0, Math.min(1, (targetTimeNum - currentTime) / (nextTime - currentTime)));
  }
  
  // Interpola coordenadas heliocêntricas entre dois registros
  interpolateCoordinates(record1, record2, factor) {
    if (!record2 || factor === 0) {
      return {
        rad_au: record1.RAD_AU,
        hgi_lat: record1.HGI_LAT / 100,
        hgi_lon: record1.HGI_LON / 100
      };
    }
    
    // Interpolação linear para rad_au e hgi_lat
    const rad_au = record1.RAD_AU + (record2.RAD_AU - record1.RAD_AU) * factor;
    const hgi_lat = (record1.HGI_LAT + (record2.HGI_LAT - record1.HGI_LAT) * factor) / 100;
    
    // Interpolação circular para longitude (considerando wrap-around em 360°)
    let lon1 = record1.HGI_LON / 100;
    let lon2 = record2.HGI_LON / 100;
    
    // Ajustar para a diferença mínima (considerando wrap-around)
    let lonDiff = lon2 - lon1;
    if (lonDiff > 180) lonDiff -= 360;
    if (lonDiff < -180) lonDiff += 360;
    
    let hgi_lon = lon1 + lonDiff * factor;
    if (hgi_lon < 0) hgi_lon += 360;
    if (hgi_lon >= 360) hgi_lon -= 360;
    
    return { rad_au, hgi_lat, hgi_lon };
  }
  
  // Obtém coordenadas heliocêntricas para um tempo específico (dados ou cálculo)
  getCoordinatesAtTime(simulationTime) {
    // Se dados temporais estão disponíveis e ativos, usar eles
    if (this.hasTemporalData() && this.temporalData.useTemporalData) {
      const astronomicalTime = this.simulationTimeToAstronomical(simulationTime);
      const records = this.findTemporalRecords(astronomicalTime);
      
      if (records) {
        return this.interpolateCoordinates(records.current, records.next, records.factor);
      }
      
      // Se não encontrou registros válidos mas tem dados temporais, 
      // usar o primeiro ou último registro disponível
      if (this.temporalData.data.length > 0) {
        const record = this.temporalData.data[0]; // ou pode usar o último: this.temporalData.data[this.temporalData.data.length - 1]
        return {
          rad_au: record.RAD_AU,
          hgi_lat: record.HGI_LAT / 100,
          hgi_lon: record.HGI_LON / 100
        };
      }
    }
    
    // Fallback: usar cálculos matemáticos baseados em órbita
    return this.calculateMathematicalPosition(simulationTime);
  }
  
  // Calcula posição usando fórmulas matemáticas (fallback)
  calculateMathematicalPosition(simulationTime) {
    // Se há órbita elíptica configurada, usar ela
    if (this.ellipticalOrbit.isElliptical && this.ellipticalOrbit.semiMajorAxis > 0) {
      const position = this.calculateEllipticalPosition(simulationTime);
      return this.cartesianToHeliocentric(position.x, position.y, position.z);
    }
    
    // Posição estática
    return this.cartesianToHeliocentric(this.position[0], this.position[1], this.position[2]);
  }

  // Método estático para carregar do data.json
  static async loadFromDataJson(name, visualOptions = {}) {
    try {
      const response = await fetch('./data/planetary-data.json');
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
      const response = await fetch('./data/planetary-data.json');
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
    // Usar velocidade orbital baseada na 3ª lei de Kepler se aplicável
    const effectiveOrbitSpeed = this.getEffectiveOrbitSpeed();
    const meanAnomaly = (time * effectiveOrbitSpeed) % (2 * Math.PI);
    
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
  
  // Obtém a velocidade orbital efetiva (considerando leis de Kepler se aplicável)
  getEffectiveOrbitSpeed() {
    if (!this.ellipticalOrbit.isElliptical) {
      return this.orbitSpeed;
    }
    
    // Para órbitas elípticas, usar a velocidade baseada no período orbital real
    if (this.physicalData.orbitalPeriod > 0) {
      const orbitalPeriodInYears = this.physicalData.orbitalPeriod / 365.25;
      return (2 * Math.PI / orbitalPeriodInYears) * CONFIG.simulationVelocity;
    }
    
    return this.orbitSpeed;
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
    // Atualizar tempo de simulação
    this.timeConfig.currentSimulationTime = time;
    
    // Reset da matriz
    m4.identity(this.worldMatrix);
    
    // Calcular posição baseada no tipo de órbita
    let calculatedPosition = [0, 0, 0];
    
    // Verificar se deve usar dados temporais ou cálculos matemáticos
    // Prioridade: 1) Dados temporais (se carregados e ativos), 2) Órbita elíptica, 3) Posição estática
    if (this.hasTemporalData()) {
      // Usar dados temporais de coordenadas heliocêntricas
      const coords = this.getCoordinatesAtTime(time);
      const currentOrbitCenter = this.getCurrentOrbitCenter();
      calculatedPosition = this.heliocentricToCartesian(coords.rad_au, coords.hgi_lat, coords.hgi_lon);
      
      m4.translate(this.worldMatrix, this.worldMatrix, [
        calculatedPosition[0] + currentOrbitCenter[0],
        calculatedPosition[1] + currentOrbitCenter[1],
        calculatedPosition[2] + currentOrbitCenter[2]
      ]);
      
      // Atualizar posição armazenada
      this.position = [
        calculatedPosition[0] + currentOrbitCenter[0],
        calculatedPosition[1] + currentOrbitCenter[1],
        calculatedPosition[2] + currentOrbitCenter[2]
      ];
    } else if (this.ellipticalOrbit.isElliptical && this.ellipticalOrbit.semiMajorAxis > 0) {
      const ellipticalPos = this.calculateEllipticalPosition(time);
      const currentOrbitCenter = this.getCurrentOrbitCenter();
      
      calculatedPosition = [ellipticalPos.x, ellipticalPos.y, ellipticalPos.z];
      
      m4.translate(this.worldMatrix, this.worldMatrix, [
        calculatedPosition[0] + currentOrbitCenter[0], 
        calculatedPosition[1] + currentOrbitCenter[1], 
        calculatedPosition[2] + currentOrbitCenter[2]
      ]);
      
      // Atualizar posição armazenada
      this.position = [
        calculatedPosition[0] + currentOrbitCenter[0],
        calculatedPosition[1] + currentOrbitCenter[1],
        calculatedPosition[2] + currentOrbitCenter[2]
      ];
    } else {
      // Posição estática (principalmente para o Sol)
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
    
    // A velocidade orbital varia na elipse segundo a 2ª lei de Kepler
    // v = sqrt(μ * (2/r - 1/a)) onde μ = GM, r = distância atual, a = semi-eixo maior
    const currentOrbitCenter = this.getCurrentOrbitCenter();
    const currentDistance = this.getDistanceFromOrbitCenter();
    
    if (currentDistance <= 0) return this.orbitSpeed;
    
    // Simplificação usando conservação de momento angular
    // v1 * r1 = v2 * r2, onde v1 é velocidade no afélio, v2 no periélio
    const velocityFactor = Math.sqrt(this.ellipticalOrbit.aphelion / currentDistance);
    return this.getEffectiveOrbitSpeed() * velocityFactor;
  }
  
  // Métodos de conveniência para trabalhar com objetos pai
  
  // Define um objeto CelestialBody como pai orbital
  setOrbitParent(parentBody, orbitSpeed = null) {
    this.setOrbitCenter(parentBody);
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
  
  // Verifica se dados temporais foram carregados
  hasTemporalData() {
    return this.temporalData.loaded && this.temporalData.data.length > 0;
  }
  
  // Obtém o centro orbital atual (pode ser posição fixa ou objeto pai)
  getCurrentOrbitCenter() {
    if (this.orbitParent && typeof this.orbitParent.getCurrentPosition === 'function') {
      return this.orbitParent.getCurrentPosition();
    }
    return this.orbitCenter || [0, 0, 0];
  }
  
  // Define o centro orbital (pode ser coordenadas ou objeto CelestialBody)
  setOrbitCenter(center) {
    if (center && typeof center.getCurrentPosition === 'function') {
      // É um objeto CelestialBody
      this.orbitParent = center;
      this.orbitCenter = null;
    } else if (Array.isArray(center) && center.length === 3) {
      // É uma coordenada [x, y, z]
      this.orbitParent = null;
      this.orbitCenter = center;
    } else {
      // Padrão: origem
      this.orbitParent = null;
      this.orbitCenter = [0, 0, 0];
    }
  }
  
  // Converte tempo de simulação para tempo astronômico
  simulationTimeToAstronomical(simulationTime) {
    // Converter tempo de simulação para tempo astronômico
    const totalHours = simulationTime * this.timeConfig.timeScale;
    const totalDays = totalHours / 24;
    
    // Calcular ano, dia e hora baseados na configuração inicial
    const startTotalDays = (this.timeConfig.startYear - 1980) * 365 + this.timeConfig.startDay;
    const currentTotalDays = startTotalDays + totalDays;
    
    const year = 1980 + Math.floor(currentTotalDays / 365);
    const dayOfYear = Math.floor(currentTotalDays % 365) + 1;
    const hour = (currentTotalDays % 1) * 24;
    
    return {
      year: year,
      day: dayOfYear,
      hour: hour
    };
  }
  
  // Obtém informações sobre dados temporais
  getTemporalDataInfo() {
    return {
      loaded: this.temporalData.loaded,
      dataCount: this.temporalData.data.length,
      interpolation: this.temporalData.interpolation,
      useTemporalData: this.temporalData.useTemporalData,
      currentIndex: this.temporalData.currentIndex,
      timeRange: this.temporalData.data.length > 0 ? {
        start: {
          year: this.temporalData.data[0].YEAR,
          day: this.temporalData.data[0].DAY,
          hour: this.temporalData.data[0].HR
        },
        end: {
          year: this.temporalData.data[this.temporalData.data.length - 1].YEAR,
          day: this.temporalData.data[this.temporalData.data.length - 1].DAY,
          hour: this.temporalData.data[this.temporalData.data.length - 1].HR
        }
      } : null
    };
  }
  
  // =================
  // MÉTODOS ESTÁTICOS PARA CONTROLE GLOBAL
  // =================
  
  // Ativar escala logarítmica globalmente
  static enableLogarithmicScale(minSize = 0.1, maxSize = 10.0, referenceDiameters = null) {
    if (!CONFIG.logarithmicScale) {
      console.log('CelestialBody: Ativando escala logarítmica global');
      CONFIG.logarithmicScale = true;
      CONFIG.minBodySize = minSize;
      CONFIG.maxBodySize = maxSize;
      
      if (referenceDiameters) {
        CONFIG.referenceDiameters = referenceDiameters;
      } else {
        // Diâmetros de referência padrão (em km)
        CONFIG.referenceDiameters = {
          min: 1, // Objetos pequenos
          max: 1400000 // Sol
        };
      }
    }
  }
  
  // Desativar escala logarítmica globalmente
  static disableLogarithmicScale() {
    if (CONFIG.logarithmicScale) {
      console.log('CelestialBody: Desativando escala logarítmica global');
      CONFIG.logarithmicScale = false;
    }
  }
  
  // Verificar se escala logarítmica está ativa
  static isLogarithmicScaleEnabled() {
    return CONFIG.logarithmicScale === true;
  }
  
  // Obter configurações atuais de escala
  static getScaleConfig() {
    return {
      logarithmicScale: CONFIG.logarithmicScale || false,
      minBodySize: CONFIG.minBodySize || 0.1,
      maxBodySize: CONFIG.maxBodySize || 10.0,
      referenceDiameters: CONFIG.referenceDiameters || null,
      bodyScale: CONFIG.bodyScale,
      scale: CONFIG.scale
    };
  }
}

export default CelestialBody;