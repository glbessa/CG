import CelestialBody from "./celestial-body.js";

class System {
  constructor({
    celestialBodies = [],
  }) {
    this.celestialBodies = celestialBodies;
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

  // Getter para acesso aos corpos celestes
  getCelestialBodies() {
    return this.celestialBodies;
  }
}

export default System;