// Exemplo de uso das coordenadas heliocêntricas na classe CelestialBody
// Este arquivo demonstra como usar as coordenadas rad_au, hgi_lat, hgi_lon

import CelestialBody from './celestial-body.js';

// Exemplo 1: Criando corpos celestes com coordenadas heliocêntricas

// Sol no centro (origem do sistema heliocêntrico)
const sol = new CelestialBody({
  name: "Sol",
  radius: 2.0,
  color: [1.0, 1.0, 0.0, 1.0],
  isEmissive: true,
  position: [0, 0, 0] // Sol está na origem
});

// Terra usando coordenadas heliocêntricas (1 UA do Sol)
const terra = new CelestialBody({
  name: "Terra",
  radius: 0.5,
  color: [0.0, 0.5, 1.0, 1.0],
  rad_au: 1.0,        // 1 UA de distância do Sol
  hgi_lat: 0.0,       // No plano eclíptico
  hgi_lon: 0.0,       // Longitude inicial 0°
  orbitRadius: 1.0,   // Órbita circular de 1 UA
  orbitSpeed: 0.1
});

// Marte em posição específica
const marte = new CelestialBody({
  name: "Marte",
  radius: 0.3,
  color: [1.0, 0.3, 0.1, 1.0],
  rad_au: 1.52,       // 1.52 UA do Sol
  hgi_lat: 1.85,      // Pequena inclinação orbital (1.85°)
  hgi_lon: 45.0,      // Começando em 45° de longitude
  orbitRadius: 1.52,
  orbitSpeed: 0.05
});

// Cometa em posição muito específica
const cometa = new CelestialBody({
  name: "Cometa Halley",
  radius: 0.05,
  color: [0.7, 0.7, 0.9, 1.0],
  rad_au: 35.0,       // Muito distante do Sol
  hgi_lat: 162.0,     // Órbita retrógrada inclinada
  hgi_lon: 58.0,      // Posição específica
  orbitSpeed: 0.001   // Muito lento
});

// Exemplo 2: Usando métodos de conveniência

// Criar um asteroide e posicioná-lo dinamicamente
const asteroide = new CelestialBody({
  name: "Ceres",
  radius: 0.1,
  color: [0.5, 0.4, 0.3, 1.0]
});

// Definir posição usando coordenadas heliocêntricas
asteroide.setHeliocentricPosition(2.77, 10.6, 120.0); // Cinturão de asteroides

// Exemplo 3: Verificando e convertendo coordenadas

console.log("=== Informações de Coordenadas ===");

// Verificar quais corpos têm coordenadas heliocêntricas definidas
const corpos = [sol, terra, marte, cometa, asteroide];

corpos.forEach(corpo => {
  console.log(`\n${corpo.name}:`);
  
  if (corpo.hasHeliocentricCoords()) {
    console.log("Tem coordenadas heliocêntricas iniciais:");
    corpo.logHeliocentricInfo();
  } else {
    console.log("Não tem coordenadas heliocêntricas iniciais");
    console.log("Coordenadas atuais:", corpo.getCurrentHeliocentricCoords());
  }
});

// Exemplo 4: Função de monitoramento durante a simulação

function monitorHeliocentricPositions(time) {
  // Atualizar todos os corpos
  corpos.forEach(corpo => corpo.update(time));
  
  // Log das posições a cada 5 segundos (exemplo)
  if (Math.floor(time) % 5 === 0) {
    console.log(`\n=== Posições em t=${time.toFixed(1)} ===`);
    
    corpos.forEach(corpo => {
      if (corpo.name !== "Sol") { // Sol fica na origem
        const coords = corpo.getCurrentHeliocentricCoords();
        console.log(`${corpo.name}: ${coords.rad_au.toFixed(2)} UA, ` +
                   `lat=${coords.hgi_lat.toFixed(1)}°, ` +
                   `lon=${coords.hgi_lon.toFixed(1)}°`);
      }
    });
  }
}

// Exemplo 5: Convertendo coordenadas existentes

// Pegar um corpo com posição cartesiana e ver suas coordenadas heliocêntricas
const jupiter = new CelestialBody({
  name: "Júpiter",
  radius: 1.2,
  color: [1.0, 0.6, 0.2, 1.0],
  position: [5.2, 0.1, 0.8] // Posição cartesiana manual
});

console.log("\nJúpiter (posição cartesiana convertida):");
const jupiterCoords = jupiter.getCurrentHeliocentricCoords();
console.log(`Distância: ${jupiterCoords.rad_au.toFixed(2)} UA`);
console.log(`Latitude: ${jupiterCoords.hgi_lat.toFixed(2)}°`);
console.log(`Longitude: ${jupiterCoords.hgi_lon.toFixed(2)}°`);

// Exemplo 6: Configuração de missão espacial

// Sonda espacial posicionada entre Terra e Marte
const sondaEspacial = new CelestialBody({
  name: "Voyager 1",
  radius: 0.01,
  color: [0.9, 0.9, 0.9, 1.0],
  rad_au: 1.3,        // Entre Terra e Marte
  hgi_lat: 5.0,       // Ligeiramente fora do plano eclíptico
  hgi_lon: 22.5,      // Posição específica da missão
  orbitSpeed: 0.08    // Velocidade intermediária
});

// Asteroid belt object usando coordenadas realistas
const asteroideBelt = new CelestialBody({
  name: "Vesta",
  radius: 0.08,
  color: [0.6, 0.5, 0.4, 1.0],
  rad_au: 2.36,       // Distância média do cinturão
  hgi_lat: 7.1,       // Inclinação típica do cinturão
  hgi_lon: 95.0       // Posição arbitrária
});

// Função para simular uma trajetória específica
function simulateTrajectory(startCoords, endCoords, duration) {
  console.log(`\nSimulando trajetória:`);
  console.log(`De: ${startCoords.rad_au} UA, lat=${startCoords.hgi_lat}°, lon=${startCoords.hgi_lon}°`);
  console.log(`Para: ${endCoords.rad_au} UA, lat=${endCoords.hgi_lat}°, lon=${endCoords.hgi_lon}°`);
  console.log(`Duração: ${duration} unidades de tempo`);
  
  // Criar objeto para rastrear a trajetória
  const trajectoryObject = new CelestialBody({
    name: "Trajetória",
    radius: 0.02,
    color: [1.0, 0.0, 1.0, 1.0],
    rad_au: startCoords.rad_au,
    hgi_lat: startCoords.hgi_lat,
    hgi_lon: startCoords.hgi_lon
  });
  
  return trajectoryObject;
}

// Exemplo de uso da simulação de trajetória
const startPos = { rad_au: 1.0, hgi_lat: 0.0, hgi_lon: 0.0 }; // Terra
const endPos = { rad_au: 1.52, hgi_lat: 1.85, hgi_lon: 180.0 }; // Marte

const missaoMarte = simulateTrajectory(startPos, endPos, 260); // ~260 dias para Marte

// Função de debug abrangente
function debugAllHeliocentricInfo() {
  console.log("\n=== DEBUG COMPLETO - COORDENADAS HELIOCÊNTRICAS ===");
  
  const allBodies = [sol, terra, marte, cometa, asteroide, jupiter, sondaEspacial, asteroideBelt, missaoMarte];
  
  allBodies.forEach(body => {
    console.log(`\n--- ${body.name} ---`);
    const detailed = body.getDetailedInfo();
    
    console.log("Coordenadas heliocêntricas:", detailed.heliocentricCoords);
    console.log("Posição cartesiana:", body.getCurrentPosition().map(v => v.toFixed(3)));
    
    if (body.hasHeliocentricCoords()) {
      console.log("✓ Definido com coordenadas heliocêntricas iniciais");
    } else {
      console.log("○ Calculado a partir de posição cartesiana");
    }
  });
}

// Exportar para uso externo
export {
  sol, terra, marte, cometa, asteroide, jupiter, sondaEspacial, asteroideBelt, missaoMarte,
  monitorHeliocentricPositions,
  simulateTrajectory,
  debugAllHeliocentricInfo
};
