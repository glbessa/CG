// Exemplo de uso da classe CelestialBody adaptada
// Este arquivo demonstra como usar a nova funcionalidade de órbita com objetos

import CelestialBody from './celestial-body.js';

// Exemplo 1: Criando um sistema Sol-Terra-Lua

// 1. Criar o Sol (centro do sistema)
const sol = new CelestialBody({
  name: "Sol",
  radius: 2.0,
  color: [1.0, 1.0, 0.0, 1.0],
  isEmissive: true,
  position: [0, 0, 0] // Posição fixa no centro
});

// 2. Criar a Terra orbitando o Sol (usando posição como centro)
const terra = new CelestialBody({
  name: "Terra",
  radius: 0.5,
  color: [0.0, 0.5, 1.0, 1.0],
  orbitRadius: 10.0,
  orbitSpeed: 0.1,
  orbitCenter: [0, 0, 0] // Orbitando o centro (onde está o Sol)
});

// 3. Criar a Lua orbitando a Terra (usando objeto CelestialBody como centro)
const lua = new CelestialBody({
  name: "Lua",
  radius: 0.2,
  color: [0.7, 0.7, 0.7, 1.0],
  orbitRadius: 2.0,
  orbitSpeed: 0.5,
  orbitParent: terra // A Lua orbita a Terra!
});

// Exemplo 2: Usando os novos métodos de conveniência

// Criar Júpiter
const jupiter = new CelestialBody({
  name: "Júpiter",
  radius: 1.2,
  color: [1.0, 0.6, 0.2, 1.0]
});

// Definir órbita usando método de conveniência
jupiter.setOrbitParent(sol, 20.0, 0.05); // Orbita o Sol com raio 20 e velocidade 0.05

// Criar uma lua de Júpiter
const io = new CelestialBody({
  name: "Io",
  radius: 0.15,
  color: [1.0, 1.0, 0.5, 1.0]
});

// Configurar órbita elíptica em torno de Júpiter
io.setEllipticalOrbit(
  3.0,    // semi-eixo maior
  0.2,    // excentricidade
  0.1,    // inclinação (radianos)
  1.0,    // velocidade orbital
  jupiter // centro orbital (objeto CelestialBody)
);

// Exemplo 3: Verificando propriedades orbitais

console.log("Status orbital dos corpos:");
console.log(`${lua.name} orbita ${lua.hasOrbitParent() ? lua.getOrbitParent().name : "nada"}`);
console.log(`${io.name} orbita ${io.hasOrbitParent() ? io.getOrbitParent().name : "nada"}`);
console.log(`${terra.name} orbita ${terra.hasOrbitParent() ? terra.getOrbitParent().name : "posição fixa"}`);

// Exemplo 4: Função de atualização do sistema
function updateSystem(time) {
  // Atualizar todos os corpos
  sol.update(time);
  terra.update(time);
  lua.update(time);     // A lua seguirá automaticamente a Terra!
  jupiter.update(time);
  io.update(time);      // Io seguirá automaticamente Júpiter!
  
  // Verificar distâncias dinâmicas
  const distanciaLuaTerra = lua.getDistanceFromOrbitCenter();
  const distanciaIoJupiter = io.getDistanceFromOrbitCenter();
  
  console.log(`Distância Lua-Terra: ${distanciaLuaTerra.toFixed(2)}`);
  console.log(`Distância Io-Júpiter: ${distanciaIoJupiter.toFixed(2)}`);
}

// Exemplo 5: Mudando o centro orbital em tempo de execução
function changeOrbitExample() {
  // Criar um asteroide
  const asteroide = new CelestialBody({
    name: "Asteroide",
    radius: 0.1,
    color: [0.5, 0.3, 0.1, 1.0],
    orbitRadius: 1.5,
    orbitSpeed: 2.0
  });
  
  // Inicialmente orbita a Terra
  asteroide.setOrbitParent(terra);
  
  // Depois de algum tempo, pode ser "capturado" por Júpiter
  setTimeout(() => {
    asteroide.setOrbitParent(jupiter, 5.0, 0.8); // Nova órbita em torno de Júpiter
  }, 10000); // Após 10 segundos
}

export { sol, terra, lua, jupiter, io, updateSystem, changeOrbitExample };
