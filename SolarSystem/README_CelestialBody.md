# Sistema de Corpos Celestes Genérico

## Classe CelestialBody

A classe `CelestialBody` foi criada para representar qualquer objeto celestial (planetas, luas, sol, etc.) de forma genérica e reutilizável.

### Construtor

```javascript
const body = new CelestialBody(options);
```

### Opções disponíveis:

- **name**: Nome do corpo celeste (string)
- **radius**: Raio do objeto (number, padrão: 1.0)
- **position**: Posição inicial [x, y, z] (array, padrão: [0, 0, 0])
- **rotation**: Rotação inicial [x, y, z] (array, padrão: [0, 0, 0])
- **rotationSpeed**: Velocidade de rotação [x, y, z] rad/s (array, padrão: [0, 0, 0])
- **orbitRadius**: Raio da órbita (number, padrão: 0)
- **orbitSpeed**: Velocidade orbital rad/s (number, padrão: 0)
- **orbitCenter**: Centro da órbita [x, y, z] (array, padrão: [0, 0, 0])
- **color**: Cor RGBA [r, g, b, a] (array, padrão: [1, 1, 1, 1])
- **textureUrl**: URL da textura (string, opcional)
- **isEmissive**: Se o objeto emite luz própria (boolean, padrão: false)
- **useTexture**: Se deve usar textura (boolean, padrão: true se textureUrl fornecida)

### Métodos principais:

- **update(time)**: Atualiza a posição e rotação baseado no tempo
- **render(programInfo, viewProjectionMatrix, lightPosition, cameraPosition)**: Renderiza o objeto

### Métodos utilitários:

- **setPosition(x, y, z)**: Define nova posição
- **setRotationSpeed(x, y, z)**: Define nova velocidade de rotação
- **setOrbit(radius, speed, center)**: Define parâmetros orbitais
- **setColor(r, g, b, a)**: Define nova cor
- **getCurrentPosition()**: Retorna posição atual
- **getDistanceFrom(otherBody)**: Calcula distância para outro corpo

## Funções auxiliares globais:

- **addCelestialBody(options)**: Adiciona um novo corpo ao sistema
- **removeCelestialBody(name)**: Remove um corpo pelo nome
- **findCelestialBody(name)**: Encontra um corpo pelo nome

## Exemplos de uso:

### Criando o Sol:
```javascript
const sun = new CelestialBody({
  name: "Sol",
  radius: 2.0,
  rotationSpeed: [0, 0.5, 0],
  textureUrl: 'textures/2k_sun.jpg',
  isEmissive: true
});
```

### Criando um planeta com órbita:
```javascript
const earth = new CelestialBody({
  name: "Terra",
  radius: 1.0,
  orbitRadius: 5.0,
  orbitSpeed: 0.5,
  rotationSpeed: [0, 1.0, 0],
  textureUrl: 'textures/2k_earth_daymap.jpg'
});
```

### Criando uma lua que orbita um planeta:
```javascript
const moon = addCelestialBody({
  name: "Lua",
  radius: 0.3,
  orbitRadius: 2.0,
  orbitSpeed: 2.0,
  color: [0.8, 0.8, 0.8, 1.0]
});

// Fazendo a lua orbitar a Terra em vez do centro
const originalMoonUpdate = moon.update;
moon.update = function(time) {
  const earthPosition = earth.getCurrentPosition();
  this.orbitCenter = earthPosition;
  originalMoonUpdate.call(this, time);
};
```

### Criando planetas apenas com cor:
```javascript
const mars = addCelestialBody({
  name: "Marte",
  radius: 0.8,
  orbitRadius: 8.0,
  orbitSpeed: 0.3,
  color: [0.8, 0.3, 0.1, 1.0],
  useTexture: false
});
```

## Vantagens do sistema:

1. **Reutilização**: Uma classe para todos os tipos de corpos celestes
2. **Flexibilidade**: Facilmente configurável através de opções
3. **Extensibilidade**: Fácil de adicionar novos corpos ou modificar existentes
4. **Manutenibilidade**: Código mais organizado e fácil de manter
5. **Escalabilidade**: Pode facilmente criar sistemas solares complexos

## Gerenciamento automático:

Todos os corpos são automaticamente:
- Atualizados a cada frame
- Renderizados com iluminação adequada
- Gerenciados através do array `celestialBodies`
