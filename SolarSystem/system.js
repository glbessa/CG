import CelestialBody from "./celestial-body.js";

class System {
  constructor({
    celestialBodies = [],
  }) {
    this.celestialBodies = celestialBodies;
  }

  // Carregar sistema solar do data.json
  async loadFromDataJson() {
    try {
      // Opções visuais específicas para cada corpo
      const visualOptions = {
        sun: {
          isEmissive: true,
          orbitRadius: 0,
          textureUrl: 'textures/2k_sun.jpg',
          color: [1.0, 1.0, 0.3, 1.0]
        },
        mercury: {
          textureUrl: 'textures/2k_mercury.jpg'
        },
        venus: {
          textureUrl: 'textures/2k_venus_atmosphere.jpg'
        },
        earth: {
          textureUrl: 'textures/2k_earth_daymap.jpg'
        },
        moon: {
          textureUrl: 'textures/2k_moon.jpg',
          orbitRadius: 2.0 // Órbita próxima à Terra para visualização
        },
        mars: {
          textureUrl: 'textures/2k_mars.jpg'
        },
        jupiter: {
          textureUrl: 'textures/2k_jupiter.jpg'
        },
        saturn: {
          textureUrl: 'textures/2k_saturn.jpg'
        },
        uranus: {
          textureUrl: 'textures/2k_uranus.jpg'
        },
        neptune: {
          textureUrl: 'textures/2k_neptune.jpg'
        },
        pluto: {
          textureUrl: 'textures/2k_pluto.jpg'
        }
      };

      this.celestialBodies = await CelestialBody.loadAllFromDataJson(visualOptions);
      
      // Configurações especiais pós-carregamento
      this.setupSpecialCases();
      
      console.log(`Sistema solar carregado com ${this.celestialBodies.length} corpos celestes`);
      
      // Debug: mostrar informações dos planetas carregados
      this.celestialBodies.forEach(body => body.logConversionInfo());
      
      return this.celestialBodies;
    } catch (error) {
      console.error('Erro ao carregar sistema solar:', error);
      return [];
    }
  }

  setupSpecialCases() {
    // Encontrar Terra e Lua para configurar órbita lunar
    const earth = this.findCelestialBody('earth');
    const moon = this.findCelestialBody('moon');
    
    if (earth && moon) {
      // Configurar a Lua para orbitar a Terra
      moon.setOrbit(2.0, 2.0, [0, 0, 0]); // Será atualizado dinamicamente
      
      // Sobrescrever o método update da lua para seguir a Terra
      const originalMoonUpdate = moon.update;
      moon.update = function(time) {
        // Primeiro, obter a posição atual da Terra
        const earthPosition = [
          earth.orbitRadius * Math.cos(time * earth.orbitSpeed),
          0,
          earth.orbitRadius * Math.sin(time * earth.orbitSpeed)
        ];
        
        // Atualizar o centro da órbita da lua para a posição da Terra
        this.orbitCenter = earthPosition;
        
        // Chamar o método update original
        originalMoonUpdate.call(this, time);
      };
    }

    // Configurar o Sol
    const sun = this.findCelestialBody('sun');
    if (sun) {
      sun.radius = 2.0; // Sol maior para visualização
      sun.isEmissive = true;
      sun.orbitRadius = 0;
      sun.orbitSpeed = 0;
    }
  }

  addCelestialBody(options) {
    const body = new CelestialBody(options);
    this.celestialBodies.push(body);
    return body;
  }

  removeCelestialBody(name) {
    const index = this.celestialBodies.findIndex(body => body.name === name);
    if (index !== -1) {
      this.celestialBodies.splice(index, 1);
      return true;
    }
    return false;
  }

  findCelestialBody(name) {
    return this.celestialBodies.find(body => 
      body.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Atualizar todos os corpos celestes
  update(time) {
    // Atualizar Terra primeiro
    const earth = this.findCelestialBody('earth');
    if (earth) {
      earth.update(time);
    }

    // Atualizar outros corpos
    this.celestialBodies.forEach(body => {
      if (body.name.toLowerCase() !== 'earth') {
        body.update(time);
      }
    });
  }

  // Renderizar todos os corpos celestes
  render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition) {
    this.celestialBodies.forEach(body => {
      body.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);
    });
  }
}

export default System;