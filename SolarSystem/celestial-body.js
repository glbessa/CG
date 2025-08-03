import * as m4 from '../static/gl-matrix/esm/mat4.js';
import CONFIG from './config.js';
import { heliocentricToCartesian, cartesianToHeliocentric, solveKeplersEquation } from './utils.js';

class CelestialBody {
  constructor(options = {}) {
    this.name = options.name || "Unnamed";
    
    // Dados físicos essenciais
    this.physicalData = {
      diameter: options.diameter || 0,
      rotationPeriod: options.rotationPeriod || 0,
      distanceFromSun: options.distanceFromSun || 0,
      orbitalPeriod: options.orbitalPeriod || 0,
      orbitalInclination: options.orbitalInclination || 0,
      orbitalEccentricity: options.orbitalEccentricity || 0
    };

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
      interpolation: options.interpolation !== false,
      useTemporalData: options.useTemporalData !== false
    };

    // Propriedades visuais calculadas
    this.radius = options.radius || this._calculateRadius();
    this.rotationSpeed = options.rotationSpeed || this._calculateRotationSpeed();
    this.orbit = options.orbit || this._calculateOrbitParams();
    this.orbit.parent = options.orbitParent || null;
    this.time = options.time || 0;
    
    // Posição, rotação e matriz de transformação
    this.position = this._calculateInitialPosition(options);
    this.rotation = options.rotation || [0, 0, 0];
    this.worldMatrix = m4.create();
  }

  // Calcula o raio visual baseado no diâmetro real (com escala)
  _calculateRadius() {
    return this.physicalData.diameter / CONFIG.bodyScale;
  }

  // Calcula a velocidade de rotação baseada no período de rotação
  _calculateRotationSpeed() {
    if (this.physicalData.rotationPeriod === 0) return [0, 0.5, 0];
    const speed = (23.9 / Math.abs(this.physicalData.rotationPeriod)) * CONFIG.simulationVelocity;
    const direction = this.physicalData.rotationPeriod < 0 ? -1 : 1;
    return [0, speed * direction, 0];
  }

  // Calcula a velocidade orbital baseada no período orbital
  _calculateOrbitSpeed() {
    if (this.physicalData.orbitalPeriod === 0 || 
        this.name.toLowerCase() === 'sun' || 
        this.name.toLowerCase() === 'sol') {
      return 0;
    }
    
    const orbitalPeriodInDays = this.physicalData.orbitalPeriod;
    const earthYear = 365.25;
    const relativeOrbitalPeriod = orbitalPeriodInDays / earthYear;
    
    return (2 * Math.PI / relativeOrbitalPeriod) * CONFIG.simulationVelocity;
  }

  // Calcula parâmetros para órbita elíptica realista
  _calculateOrbitParams(orbitOptions = {}) {
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
        isElliptical: false,
        parent: null,
        inclination: 0,
        speed: 0
      };
    }

    const earthDistance = 149.6; // milhões de km (1 AU)
    
    const realSemiMajorAxis = this.physicalData.distanceFromSun;
    const eccentricity = this.physicalData.orbitalEccentricity;
  
    const relativeDistance = realSemiMajorAxis / earthDistance;
    const visualSemiMajorAxis = relativeDistance / CONFIG.distanceScale;
    
    const semiMinorAxis = visualSemiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
    const focalDistance = visualSemiMajorAxis * eccentricity;
    const visualPerihelion = visualSemiMajorAxis * (1 - eccentricity);
    const visualAphelion = visualSemiMajorAxis * (1 + eccentricity);
    
    return {
      semiMajorAxis: visualSemiMajorAxis,
      semiMinorAxis: semiMinorAxis,
      eccentricity: eccentricity,
      perihelion: visualPerihelion,
      aphelion: visualAphelion,
      focalDistance: focalDistance,
      isElliptical: eccentricity > 0.001,
      inclination: this.physicalData.orbitalInclination * Math.PI / 180,
      speed: this._calculateOrbitSpeed(),
      parent: orbitOptions.parent || null
    };
  }

  // Calcula posição inicial baseada em coordenadas heliocêntricas ou posição fornecida
  _calculateInitialPosition(options) {
    if (options.position) {
      return options.position;
    }
    
    if (options.rad_au !== undefined && options.hgi_lat !== undefined && options.hgi_lon !== undefined) {
      return this.heliocentricToCartesian(options.rad_au, options.hgi_lat, options.hgi_lon);
    }
    
    return [0, 0, 0];
  }
  
  // Calcula a posição atual na órbita elíptica
  _calculatePosition(time) {
    const orbit = this.orbit;
    const meanAnomaly = (time * this.orbit.speed) % (2 * Math.PI);

    const eccentricAnomaly = solveKeplersEquation(meanAnomaly, orbit.eccentricity);

    const x = orbit.semiMajorAxis * (Math.cos(eccentricAnomaly) - orbit.eccentricity);
    const z = orbit.semiMinorAxis * Math.sin(eccentricAnomaly);
    
    let finalX = x;
    let finalY = 0;
    let finalZ = z;
    
    if (orbit.inclination && Math.abs(orbit.inclination) > 0.001) {
      finalY = z * Math.sin(orbit.inclination);
      finalZ = z * Math.cos(orbit.inclination);
    }
    
    return { x: finalX, y: finalY, z: finalZ };
  }
  
  // Atualiza a posição e rotação do corpo celeste
  update(time) {
    if (!time || time <= this.time) return;
    if (this.orbit.parent.time && time > this.orbit.parent.time) return;

    m4.identity(this.worldMatrix);
    
    let calculatedPosition = [0, 0, 0];
    const coords = this._getCoordinatesAtTime(time);

    if (coords) {
      calculatedPosition = heliocentricToCartesian(coords.rad_au, coords.hgi_lat, coords.hgi_lon);
      
      m4.translate(this.worldMatrix, this.worldMatrix, [
        calculatedPosition[0],
        calculatedPosition[1],
        calculatedPosition[2]
      ]);
      
      this.position = [
        calculatedPosition[0],
        calculatedPosition[1],
        calculatedPosition[2]
      ];
    } else if (this.orbit.semiMajorAxis > 0) {
      const ellipticalPos = this._calculatePosition(time);
      calculatedPosition = [ellipticalPos.x, ellipticalPos.y, ellipticalPos.z];
      
      m4.translate(this.worldMatrix, this.worldMatrix, [
        calculatedPosition[0],
        calculatedPosition[1],
        calculatedPosition[2],
      ]);
      
      this.position = [
        calculatedPosition[0],
        calculatedPosition[1],
        calculatedPosition[2],
      ];
    } else {
      m4.translate(this.worldMatrix, this.worldMatrix, this.position);
    }
    
    // Aplicar rotação própria
    if (this.rotationSpeed[0] !== 0) m4.rotateX(this.worldMatrix, this.worldMatrix, time * this.rotationSpeed[0]);
    if (this.rotationSpeed[1] !== 0) m4.rotateY(this.worldMatrix, this.worldMatrix, time * this.rotationSpeed[1]);
    if (this.rotationSpeed[2] !== 0) m4.rotateZ(this.worldMatrix, this.worldMatrix, time * this.rotationSpeed[2]);

    this.time = time;
  }

  setOrbit(semiMajorAxis, eccentricity, inclination = 0, speed = null) {
    this.orbit = {
      semiMajorAxis: semiMajorAxis,
      semiMinorAxis: semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity),
      eccentricity: eccentricity,
      perihelion: semiMajorAxis * (1 - eccentricity),
      aphelion: semiMajorAxis * (1 + eccentricity),
      focalDistance: semiMajorAxis * eccentricity,
      isElliptical: eccentricity > 0.001,
      inclination: inclination,
      speed: speed !== null ? speed : this._calculateOrbitSpeed(),
      parent: this.orbit.parent || null
    };
  }
  
  setHeliocentricPosition(rad_au, hgi_lat_deg, hgi_lon_deg) {
    this.heliocentricCoords = {
      rad_au: rad_au,
      hgi_lat: hgi_lat_deg,
      hgi_lon: hgi_lon_deg
    };
    this.position = heliocentricToCartesian(rad_au, hgi_lat_deg, hgi_lon_deg);
  }
  
  getCurrentHeliocentricCoords() {
    return cartesianToHeliocentric(this.position[0], this.position[1], this.position[2]);
  }
}

export default CelestialBody;