// Exemplo prático: Sistema Solar com posições heliocêntricas realistas
// Baseado em dados astronômicos aproximados

import CelestialBody from '../celestial-body.js';

// Dados astronômicos reais aproximados (época J2000.0)
const astronomicalData = {
  mercury: { rad_au: 0.387, hgi_lat: 3.38, hgi_lon: 252.25, inclination: 7.0 },
  venus: { rad_au: 0.723, hgi_lat: 3.86, hgi_lon: 181.98, inclination: 3.4 },
  earth: { rad_au: 1.000, hgi_lat: 0.00, hgi_lon: 100.46, inclination: 0.0 },
  mars: { rad_au: 1.524, hgi_lat: 1.85, hgi_lon: 355.43, inclination: 1.9 },
  jupiter: { rad_au: 5.204, hgi_lat: 1.31, hgi_lon: 34.35, inclination: 1.3 },
  saturn: { rad_au: 9.573, hgi_lat: 2.49, hgi_lon: 50.08, inclination: 2.5 },
  uranus: { rad_au: 19.165, hgi_lat: 0.77, hgi_lon: 314.05, inclination: 0.8 },
  neptune: { rad_au: 30.178, hgi_lat: 1.77, hgi_lon: 304.35, inclination: 1.8 }
};

// Configurações visuais para cada planeta
const visualConfig = {
  mercury: { radius: 0.1, color: [0.7, 0.7, 0.7, 1.0] },
  venus: { radius: 0.15, color: [1.0, 0.8, 0.4, 1.0] },
  earth: { radius: 0.16, color: [0.2, 0.6, 1.0, 1.0] },
  mars: { radius: 0.12, color: [1.0, 0.4, 0.2, 1.0] },
  jupiter: { radius: 0.8, color: [1.0, 0.6, 0.3, 1.0] },
  saturn: { radius: 0.7, color: [1.0, 0.9, 0.6, 1.0] },
  uranus: { radius: 0.4, color: [0.4, 0.8, 1.0, 1.0] },
  neptune: { radius: 0.38, color: [0.2, 0.4, 1.0, 1.0] }
};

// Função para criar o sistema solar completo
function createRealisticSolarSystem() {
  const solarSystem = {};
  
  // Sol no centro
  solarSystem.sun = new CelestialBody({
    name: "Sol",
    radius: 2.0,
    color: [1.0, 1.0, 0.0, 1.0],
    isEmissive: true,
    position: [0, 0, 0]
  });
  
  // Criar planetas com dados astronômicos
  Object.entries(astronomicalData).forEach(([planetName, astroData]) => {
    const visual = visualConfig[planetName];
    
    solarSystem[planetName] = new CelestialBody({
      name: planetName.charAt(0).toUpperCase() + planetName.slice(1),
      
      // Coordenadas heliocêntricas
      rad_au: astroData.rad_au,
      hgi_lat: astroData.hgi_lat,
      hgi_lon: astroData.hgi_lon,
      
      // Propriedades visuais
      radius: visual.radius,
      color: visual.color,
      
      // Propriedades orbitais (simplificadas)
      orbitRadius: astroData.rad_au / 10, // Escala visual
      orbitSpeed: 0.5 / Math.sqrt(astroData.rad_au), // Lei de Kepler simplificada
      
      // Centro orbital (Sol)
      orbitCenter: [0, 0, 0]
    });
  });
  
  return solarSystem;
}

// Função para criar configuração de missão específica
function createMissionScenario() {
  const scenario = {};
  
  // Terra como ponto de partida
  scenario.earth = new CelestialBody({
    name: "Terra",
    radius: 0.16,
    color: [0.2, 0.6, 1.0, 1.0],
    rad_au: 1.0,
    hgi_lat: 0.0,
    hgi_lon: 100.0,
    orbitRadius: 0.1,
    orbitSpeed: 0.5
  });
  
  // Marte como destino
  scenario.mars = new CelestialBody({
    name: "Marte",
    radius: 0.12,
    color: [1.0, 0.4, 0.2, 1.0],
    rad_au: 1.524,
    hgi_lat: 1.85,
    hgi_lon: 220.0, // Posição favorável para transferência
    orbitRadius: 0.152,
    orbitSpeed: 0.36
  });
  
  // Sonda em trajetória de transferência Hohmann
  scenario.spacecraft = new CelestialBody({
    name: "Mars Express",
    radius: 0.02,
    color: [0.9, 0.9, 0.9, 1.0],
    rad_au: 1.262, // Posição intermediária na transferência
    hgi_lat: 0.93, // Inclinação média entre Terra e Marte
    hgi_lon: 160.0, // Posição na trajetória
    orbitSpeed: 0.43
  });
  
  // Estação espacial em L1 (ponto de Lagrange Terra-Sol)
  scenario.spaceStation = new CelestialBody({
    name: "Estação L1",
    radius: 0.01,
    color: [1.0, 1.0, 1.0, 1.0],
    rad_au: 0.99, // Ligeiramente mais próxima do Sol que a Terra
    hgi_lat: 0.0,
    hgi_lon: 100.0, // Mesma longitude da Terra
    orbitSpeed: 0.5 // Mesma velocidade da Terra
  });
  
  return scenario;
}

// Função para criar configuração de asteroides
function createAsteroidBelt() {
  const asteroids = [];
  
  // Asteroides principais conhecidos
  const mainAsteroids = [
    { name: "Ceres", rad_au: 2.768, hgi_lat: 10.6, hgi_lon: 291.4 },
    { name: "Vesta", rad_au: 2.362, hgi_lat: 7.1, hgi_lon: 103.9 },
    { name: "Pallas", rad_au: 2.773, hgi_lat: 34.8, hgi_lon: 172.9 },
    { name: "Juno", rad_au: 2.670, hgi_lat: 13.0, hgi_lon: 248.1 }
  ];
  
  mainAsteroids.forEach((asteroid, index) => {
    asteroids.push(new CelestialBody({
      name: asteroid.name,
      radius: 0.05 + index * 0.02, // Tamanhos variados
      color: [0.5 + Math.random() * 0.3, 0.4 + Math.random() * 0.3, 0.3, 1.0],
      rad_au: asteroid.rad_au,
      hgi_lat: asteroid.hgi_lat,
      hgi_lon: asteroid.hgi_lon,
      orbitRadius: asteroid.rad_au / 10,
      orbitSpeed: 0.3 / Math.sqrt(asteroid.rad_au)
    }));
  });
  
  // Asteroides aleatórios no cinturão
  for (let i = 0; i < 20; i++) {
    asteroids.push(new CelestialBody({
      name: `Asteroid ${i + 5}`,
      radius: 0.01 + Math.random() * 0.03,
      color: [0.4 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.2, 1.0],
      rad_au: 2.2 + Math.random() * 1.2, // 2.2 a 3.4 UA
      hgi_lat: (Math.random() - 0.5) * 30, // ±15° de inclinação
      hgi_lon: Math.random() * 360,
      orbitSpeed: 0.2 + Math.random() * 0.2
    }));
  }
  
  return asteroids;
}

// Função para criar cometas com órbitas excêntricas
function createComets() {
  const comets = [];
  
  // Cometas famosos
  const famousComets = [
    { 
      name: "Halley", 
      rad_au: 17.8, // Posição média (varia muito)
      hgi_lat: 162.3, // Órbita retrógrada
      hgi_lon: 58.4,
      eccentricity: 0.967
    },
    { 
      name: "Encke", 
      rad_au: 2.2,
      hgi_lat: 11.8,
      hgi_lon: 186.5,
      eccentricity: 0.848
    },
    { 
      name: "Swift-Tuttle", 
      rad_au: 26.1,
      hgi_lat: 113.5,
      hgi_lon: 153.2,
      eccentricity: 0.963
    }
  ];
  
  famousComets.forEach(comet => {
    comets.push(new CelestialBody({
      name: `Cometa ${comet.name}`,
      radius: 0.02,
      color: [0.7, 0.8, 1.0, 1.0],
      rad_au: comet.rad_au,
      hgi_lat: comet.hgi_lat,
      hgi_lon: comet.hgi_lon,
      orbitSpeed: 0.1 / Math.sqrt(comet.rad_au)
    }));
  });
  
  return comets;
}

// Função para análise e debug do sistema
function analyzeSystem(system) {
  console.log("=== ANÁLISE DO SISTEMA SOLAR ===\n");
  
  Object.entries(system).forEach(([name, body]) => {
    if (name === 'sun') return;
    
    const coords = body.getCurrentHeliocentricCoords();
    const hasInitial = body.hasHeliocentricCoords();
    
    console.log(`${body.name}:`);
    console.log(`  Distância: ${coords.rad_au.toFixed(3)} UA`);
    console.log(`  Latitude: ${coords.hgi_lat.toFixed(2)}°`);
    console.log(`  Longitude: ${coords.hgi_lon.toFixed(2)}°`);
    console.log(`  Coords. iniciais: ${hasInitial ? 'Sim' : 'Não'}`);
    console.log(`  Posição visual: [${body.getCurrentPosition().map(v => v.toFixed(2)).join(', ')}]`);
    console.log('');
  });
}

// Função de simulação temporal
function simulateTimeStep(system, timeStep) {
  Object.values(system).forEach(body => {
    if (body instanceof CelestialBody) {
      body.update(timeStep);
    }
  });
}

// Exportar configurações para uso
export {
  createRealisticSolarSystem,
  createMissionScenario,
  createAsteroidBelt,
  createComets,
  analyzeSystem,
  simulateTimeStep,
  astronomicalData,
  visualConfig
};
