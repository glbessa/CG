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
          useTexture: false,
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
        },
        comet_halley: {
          color: [0.9, 0.9, 0.7, 1.0],
          useTexture: false
        }
      };

      this.celestialBodies = await CelestialBody.loadAllFromDataJson(visualOptions);
      
      // Configurações especiais pós-carregamento
      this.setupSpecialCases();
      
      return this.celestialBodies;
    } catch (error) {
      console.error('Erro ao carregar sistema solar:', error);
      return [];
    }
  }

  setupSpecialCases() {
    const earth = this.findCelestialBody('earth');
    const moon = this.findCelestialBody('moon');
    
    if (earth && moon) {
      moon.bodyParent = earth;
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
    // Atualizar Sol primeiro (se necessário)
    const sun = this.findCelestialBody('sun');
    if (sun) {
      sun.update(time);
    }
    
    // Atualizar Terra antes da Lua
    const earth = this.findCelestialBody('earth');
    if (earth) {
      earth.update(time);
    }

    // Atualizar todos os outros corpos (exceto Sol, Terra e Lua)
    this.celestialBodies.forEach(body => {
      const name = body.name.toLowerCase();
      if (name !== 'sun' && name !== 'earth' && name !== 'moon') {
        body.update(time);
      }
    });
    
    // Atualizar Lua por último para que ela tenha a posição atualizada da Terra
    const moon = this.findCelestialBody('moon');
    if (moon) {
      moon.update(time);
    }
  }

  // Renderizar todos os corpos celestes
  render(programInfo, sunProgramInfo, viewProjectionMatrix, lightPosition, cameraPosition) {
    this.celestialBodies.forEach(body => {
      if (body.name === 'sun') {
        body.render(sunProgramInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      } else {
        body.render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition);
      }
    });
  }

  // Getter para acesso aos corpos celestes
  getCelestialBodies() {
    return this.celestialBodies;
  }
}

export default System;