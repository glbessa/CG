import * as m4 from '../static/gl-matrix/esm/mat4.js';
import * as twgl from "../static/twgl/twgl-full.module.js";
import { gl } from './init.js';
import CONFIG from './config.js';
import { heliocentricToCartesian, cartesianToHeliocentric, solveKeplersEquation } from './utils.js';

class CelestialBody {
    constructor(options = {}) {
        this.name = options.name || "Unnamed";
        
        // Dados físicos essenciais - usar diretamente as propriedades passadas
        this.physicalData = {
            diameter: options.diameter || options.physicalData?.diameter || 1000,
            rotationPeriod: options.rotationPeriod || options.physicalData?.rotationPeriod || 24,
            distanceFromSun: options.distanceFromSun || options.physicalData?.distanceFromSun || 0,
            orbitalPeriod: options.orbitalPeriod || options.physicalData?.orbitalPeriod || 365,
            orbitalInclination: options.orbitalInclination || options.physicalData?.orbitalInclination || 0,
            orbitalEccentricity: options.orbitalEccentricity || options.physicalData?.orbitalEccentricity || 0
        };
        

        // Coordenadas heliocêntricas para posição inicial
        this.heliocentricCoords = {
            rad_au: options.rad_au || null,
            hgi_lat: options.hgi_lat || null,
            hgi_lon: options.hgi_lon || null
        };

        // Dados temporais de coordenadas heliocêntricas
        this.temporalData = options.temporalData || {};

        // Propriedades visuais calculadas
        this.radius = options.radius || this._calculateRadius();
        this.rotationSpeed = options.rotationSpeed || this._calculateRotationSpeed();
        this.orbit = options.orbit || this._calculateOrbitParams();
        this.orbit.parent = options.orbitParent || null;
        this.daysSinceStart = options.daysSinceStart || 0; // Dias desde o inicio da simulação

        // Posição, rotação e matriz de transformação
        this.position = this._calculateInitialPosition(options);
        this.rotation = options.rotation || [0, 0, 0];
        this.worldMatrix = m4.create();
        this.worldInverseTranspose = m4.create();
        this.programInfo = options.programInfo || null;
        this.bufferInfo = null;
        this.color = options.color || [1, 1, 1, 1];
        this.texture = null;
        this.textureUrl = options.textureUrl || options.texturesFilepath || null;
        this.isEmissive = options.isEmissive || (this.name === 'sun');
        this.useTexture = options.useTexture !== undefined ? options.useTexture : !!this.textureUrl;

        this._initGeometry();
        this._initTexture();
    }

    _initGeometry() {
        // Criar geometria esférica com base no raio
        this.bufferInfo = twgl.primitives.createSphereBufferInfo(gl, this.radius, 64, 32);
        
        if (!this.bufferInfo) {
            console.error(`Erro: BufferInfo não criado para ${this.name}`);
        }
    }

    _initTexture() {
        if (this.textureUrl) {
            this.texture = twgl.createTexture(gl, {
                src: this.textureUrl,
                crossOrigin: '',
            });
            
            if (!this.texture) {
                console.error(`Erro: Textura não carregada para ${this.name}`);
            }
        }
    }

    // Calcula o raio visual baseado no diâmetro real (com escala)
    _calculateRadius() {
        const calculatedRadius = this.physicalData.diameter / CONFIG.bodyScale;
        const minRadius = 0.1; // Raio mínimo para visibilidade
        const finalRadius = Math.max(calculatedRadius, minRadius);
        
        return finalRadius;
    }

    // Calcula a velocidade de rotação baseada no período de rotação
    _calculateRotationSpeed() {
        if (this.physicalData.rotationPeriod === 0) return [0, 0.5, 0];
        const speed = (CONFIG.earthHours / Math.abs(this.physicalData.rotationPeriod)) * CONFIG.simulationVelocity;
        const direction = this.physicalData.rotationPeriod < 0 ? -1 : 1;
        return [0, speed * direction, 0];
    }

    // Calcula a velocidade orbital baseada no período orbital
    _calculateOrbitSpeed() {
        if (this.physicalData.orbitalPeriod === 0 || 
            this.name.toLowerCase() === 'sun') {
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
            const pos = heliocentricToCartesian(options.rad_au, options.hgi_lat, options.hgi_lon);
            return pos;
        }
        
        // Se não há dados heliocêntricos, usar distância do Sol para posição orbital básica
        if (this.physicalData.distanceFromSun > 0) {
            const orbitRadius = this.physicalData.distanceFromSun / CONFIG.earthDistance / CONFIG.distanceScale;
            const angle = Math.random() * 2 * Math.PI; // Ângulo aleatório para início
            const pos = [
                orbitRadius * Math.cos(angle),
                0,
                orbitRadius * Math.sin(angle)
            ];
            return pos;
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

    _getCoordinatesAtTime(daysSinceStart) {
        if (!this.temporalData) return;

        const datetimeSinceStart = new Date(CONFIG.startDatetime.getTime() + Math.floor(daysSinceStart) * 24 * 60 * 60 * 1000);
        const timeAsString = datetimeSinceStart.toISOString().split('T')[0];
        const coords = this.temporalData[timeAsString];
        if (!coords) {
            //console.warn(`No temporal data found for ${this.name} at time ${timeAsString}`);
            return null;
        }

        return {
            rad_au: coords.RAD_AU,
            hgi_lat: coords.HGI_LAT,
            hgi_lon: coords.HGI_LON
        };
    }

    // Atualiza a posição e rotação do corpo celeste
    update(daysSinceStart) {
        m4.identity(this.worldMatrix);
        
        let calculatedPosition = [...this.position]; // Usar posição inicial como padrão
        const coords = this._getCoordinatesAtTime(daysSinceStart);

        if (coords) {
            calculatedPosition = heliocentricToCartesian(coords.rad_au, coords.hgi_lat, coords.hgi_lon);
            
            this.position = [
                calculatedPosition[0],
                calculatedPosition[1],
                calculatedPosition[2]
            ];
        }
        
        // Aplicar translação
        m4.translate(this.worldMatrix, this.worldMatrix, this.position);
        
        // Aplicar rotação própria
        if (this.rotationSpeed[0] !== 0) m4.rotateX(this.worldMatrix, this.worldMatrix, daysSinceStart * this.rotationSpeed[0]);
        if (this.rotationSpeed[1] !== 0) m4.rotateY(this.worldMatrix, this.worldMatrix, daysSinceStart * this.rotationSpeed[1]);
        if (this.rotationSpeed[2] !== 0) m4.rotateZ(this.worldMatrix, this.worldMatrix, daysSinceStart * this.rotationSpeed[2]);

        // Calcular matriz inversa transposta para normais
        m4.invert(this.worldInverseTranspose, this.worldMatrix);
        m4.transpose(this.worldInverseTranspose, this.worldInverseTranspose);

        this.daysSinceStart = daysSinceStart;
    }

    render(viewProjectionMatrix, lightPosition, cameraPosition) {
        // Verificações básicas antes de renderizar
        if (!this.programInfo) {
            console.error(`Erro: ${this.name} não tem programInfo`);
            return;
        }
        
        if (!this.bufferInfo) {
            console.error(`Erro: ${this.name} não tem bufferInfo`);
            return;
        }
        
        // Debug da primeira renderização
        if (!this.renderDebugShown) {
            this.renderDebugShown = true;
        }
        
        gl.useProgram(this.programInfo.program);
        // Calcular matriz world-view-projection
        const worldViewProjectionMatrix = m4.create();
        m4.multiply(worldViewProjectionMatrix, viewProjectionMatrix, this.worldMatrix);
        
        // Configurar buffers e atributos
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
        
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
        
        twgl.setUniforms(this.programInfo, uniforms);
        twgl.drawBufferInfo(gl, this.bufferInfo); // Desenhar
        
        // Verificar erros WebGL após renderização
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error(`WebGL error ao renderizar ${this.name}:`, error);
        }
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