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
    return this.celestialBodies.find(body => body.name === name);
  }
}

export default System;