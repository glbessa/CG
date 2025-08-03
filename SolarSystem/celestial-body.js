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

  // Métodos para dados temporais de coordenadas heliocêntricas
  
  // Carrega dados temporais de coordenadas a partir de um arquivo JSON
  async loadTemporalData(filePath) {
    try {
      const response = await fetch(filePath);
      const data = await response.json();
      
      // Validar e processar dados
      this.temporalData.data = this.validateTemporalData(data);
      this.temporalData.loaded = true;
      this.temporalData.currentIndex = 0;
      
      console.log(`Dados temporais carregados para ${this.name}: ${this.temporalData.data.length} registros`);
      
      // Definir posição inicial com base no primeiro registro se disponível
      if (this.temporalData.data.length > 0 && this.temporalData.useTemporalData) {
        const firstRecord = this.temporalData.data[0];
        this.heliocentricCoords = {
          rad_au: firstRecord.RAD_AU,
          hgi_lat: firstRecord.HGI_LAT / 100, // Dados vêm em centésimos de grau
          hgi_lon: firstRecord.HGI_LON / 100
        };
        this.position = this.heliocentricToCartesian(
          firstRecord.RAD_AU,
          firstRecord.HGI_LAT / 100,
          firstRecord.HGI_LON / 100
        );
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao carregar dados temporais para ${this.name}:`, error);
      this.temporalData.loaded = false;
      return false;
    }
  }
  
  // Valida e processa dados temporais
  validateTemporalData(rawData) {
    if (!Array.isArray(rawData)) {
      throw new Error('Dados temporais devem ser um array');
    }
    
    return rawData
      .filter(record => {
        // Verificar se todos os campos obrigatórios estão presentes
        return record.YEAR !== undefined && 
               record.DAY !== undefined && 
               record.HR !== undefined &&
               record.RAD_AU !== undefined && 
               record.HGI_LAT !== undefined && 
               record.HGI_LON !== undefined;
      })
      .sort((a, b) => {
        // Ordenar por ano, dia e hora
        if (a.YEAR !== b.YEAR) return a.YEAR - b.YEAR;
        if (a.DAY !== b.DAY) return a.DAY - b.DAY;
        return a.HR - b.HR;
      });
  }
  
  // Converte tempo de simulação para data/hora astronômica
  simulationTimeToAstronomical(simulationTime) {
    const scaledTime = simulationTime * this.timeConfig.timeScale;
    
    // Calcular dias desde o início
    const totalHours = scaledTime;
    const totalDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    
    let year = this.timeConfig.startYear;
    let day = this.timeConfig.startDay + totalDays;
    let hour = this.timeConfig.startHour + remainingHours;
    
    // Ajustar overflow de horas
    if (hour >= 24) {
      day += Math.floor(hour / 24);
      hour = hour % 24;
    }
    
    // Ajustar overflow de dias (simplificado - assumindo 365 dias por ano)
    while (day > 365) {
      day -= 365;
      year++;
    }
    
    return { year, day, hour };
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
    if (this.temporalData.loaded && this.temporalData.useTemporalData) {
      const astronomicalTime = this.simulationTimeToAstronomical(simulationTime);
      const records = this.findTemporalRecords(astronomicalTime);
      
      if (records) {
        return this.interpolateCoordinates(records.current, records.next, records.factor);
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
    
    // Se há órbita circular simples
    if (this.orbitRadius > 0) {
      const angle = simulationTime * this.orbitSpeed;
      const x = this.orbitRadius * Math.cos(angle);
      const z = this.orbitRadius * Math.sin(angle);
      return this.cartesianToHeliocentric(x, 0, z);
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
    // Atualizar tempo de simulação
    this.timeConfig.currentSimulationTime = time;
    
    // Reset da matriz
    m4.identity(this.worldMatrix);
    
    // Verificar se deve usar dados temporais ou cálculos matemáticos
    if (this.temporalData.loaded && this.temporalData.useTemporalData) {
      // Usar dados temporais de coordenadas heliocêntricas
      const coords = this.getCoordinatesAtTime(time);
      const currentOrbitCenter = this.getCurrentOrbitCenter();
      const position = this.heliocentricToCartesian(coords.rad_au, coords.hgi_lat, coords.hgi_lon);
      
      m4.translate(this.worldMatrix, this.worldMatrix, [
        position[0] + currentOrbitCenter[0],
        position[1] + currentOrbitCenter[1],
        position[2] + currentOrbitCenter[2]
      ]);
    }
    // Aplicar órbita elíptica se houver
    else if (this.ellipticalOrbit.isElliptical && this.ellipticalOrbit.semiMajorAxis > 0) {
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
      },
      temporalData: this.getTemporalDataInfo()
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
  
  // Métodos de conveniência para dados temporais
  
  // Verifica se dados temporais foram carregados
  hasTemporalData() {
    return this.temporalData.loaded && this.temporalData.data.length > 0;
  }
  
  // Ativa/desativa uso de dados temporais
  setUseTemporalData(use) {
    this.temporalData.useTemporalData = use;
  }
  
  // Ativa/desativa interpolação
  setInterpolation(enabled) {
    this.temporalData.interpolation = enabled;
  }
  
  // Configura escala temporal
  setTimeScale(scale) {
    this.timeConfig.timeScale = scale;
  }
  
  // Configura data/hora inicial da simulação
  setStartTime(year, day, hour) {
    this.timeConfig.startYear = year;
    this.timeConfig.startDay = day;
    this.timeConfig.startHour = hour;
  }
  
  // Obtém informações sobre dados temporais
  getTemporalDataInfo() {
    if (!this.temporalData.loaded) {
      return { loaded: false };
    }
    
    const data = this.temporalData.data;
    const firstRecord = data[0];
    const lastRecord = data[data.length - 1];
    
    return {
      loaded: true,
      recordCount: data.length,
      timeRange: {
        start: { year: firstRecord.YEAR, day: firstRecord.DAY, hour: firstRecord.HR },
        end: { year: lastRecord.YEAR, day: lastRecord.DAY, hour: lastRecord.HR }
      },
      interpolation: this.temporalData.interpolation,
      useTemporalData: this.temporalData.useTemporalData,
      currentTime: this.simulationTimeToAstronomical(this.timeConfig.currentSimulationTime)
    };
  }
  
  // Obtém coordenadas para uma data específica
  getCoordinatesAtDate(year, day, hour) {
    if (!this.temporalData.loaded) {
      return null;
    }
    
    const records = this.findTemporalRecords({ year, day, hour });
    if (!records) {
      return null;
    }
    
    return this.interpolateCoordinates(records.current, records.next, records.factor);
  }
  
  // Método para debug dos dados temporais
  logTemporalDataInfo() {
    const info = this.getTemporalDataInfo();
    
    if (!info.loaded) {
      console.log(`${this.name}: Nenhum dado temporal carregado`);
      return;
    }
    
    console.log(`${this.name} - Dados Temporais:`, {
      registros: info.recordCount,
      periodo: `${info.timeRange.start.year}/${info.timeRange.start.day} até ${info.timeRange.end.year}/${info.timeRange.end.day}`,
      interpolacao: info.interpolation ? "Ativa" : "Inativa",
      usoAtivo: info.useTemporalData ? "Sim" : "Não",
      tempoAtual: `${info.currentTime.year}/${info.currentTime.day} ${info.currentTime.hour.toFixed(1)}h`
    });
    
    if (info.useTemporalData) {
      const currentCoords = this.getCoordinatesAtTime(this.timeConfig.currentSimulationTime);
      console.log("Coordenadas atuais (dados temporais):", {
        rad_au: currentCoords.rad_au.toFixed(3),
        hgi_lat: currentCoords.hgi_lat.toFixed(2),
        hgi_lon: currentCoords.hgi_lon.toFixed(2)
      });
    }
  }
  
  // Método estático para carregar múltiplos corpos com dados temporais
  static async loadMultipleWithTemporalData(configurations) {
    const bodies = [];
    
    for (const config of configurations) {
      const body = new CelestialBody(config.options || {});
      
      if (config.temporalDataPath) {
        await body.loadTemporalData(config.temporalDataPath);
      }
      
      bodies.push(body);
    }
    
    return bodies;
  }
}

export default CelestialBody;