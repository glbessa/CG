# Adaptações da Classe CelestialBody

## Resumo das Mudanças

A classe `CelestialBody` foi adaptada para suportar tanto **posições fixas** quanto **objetos CelestialBody** como centro orbital. Isso permite criar sistemas hierárquicos mais realistas, como planetas orbitando estrelas e luas orbitando planetas.

## Novas Propriedades

### `orbitParent`
- **Tipo**: `CelestialBody | null`
- **Descrição**: Referência para o objeto CelestialBody que serve como centro orbital
- **Valor padrão**: `null`

### `orbitCenter` (modificado)
- **Tipo**: `Array[3]`
- **Descrição**: Coordenadas do centro orbital (usado quando não há orbitParent)
- **Valor padrão**: `[0, 0, 0]`

## Novos Métodos

### `setOrbitCenter(center)`
Define o centro orbital, aceitando tanto coordenadas quanto objetos CelestialBody.

**Parâmetros:**
- `center`: `Array[3] | CelestialBody` - Coordenadas ou objeto para orbitar

**Exemplo:**
```javascript
// Usando coordenadas
planet.setOrbitCenter([0, 0, 0]);

// Usando objeto CelestialBody
moon.setOrbitCenter(planet);
```

### `getCurrentOrbitCenter()`
Retorna a posição atual do centro orbital.

**Retorno:** `Array[3]` - Coordenadas [x, y, z] do centro orbital

**Exemplo:**
```javascript
const center = moon.getCurrentOrbitCenter(); // Posição atual do planeta que a lua orbita
```

### `setOrbitParent(parentBody, orbitRadius?, orbitSpeed?)`
Método de conveniência para definir um objeto como pai orbital.

**Parâmetros:**
- `parentBody`: `CelestialBody` - Objeto para orbitar
- `orbitRadius`: `number` (opcional) - Raio da órbita
- `orbitSpeed`: `number` (opcional) - Velocidade orbital

**Exemplo:**
```javascript
moon.setOrbitParent(earth, 5.0, 0.3);
```

### `hasOrbitParent()`
Verifica se o objeto possui um pai orbital.

**Retorno:** `boolean`

### `getOrbitParent()`
Retorna o objeto pai orbital (se houver).

**Retorno:** `CelestialBody | null`

### `getDistanceFromOrbitCenter()`
Calcula a distância atual do centro orbital.

**Retorno:** `number` - Distância em unidades do mundo

## Métodos Modificados

### `setOrbit(radius, speed, center)`
Agora aceita tanto coordenadas quanto objetos CelestialBody para o parâmetro `center`.

### `setEllipticalOrbit(semiMajorAxis, eccentricity, inclination, speed, center)`
O parâmetro `center` agora aceita objetos CelestialBody.

### `update(time)`
Atualizado para usar `getCurrentOrbitCenter()` em vez de `orbitCenter` diretamente.

## Exemplos de Uso

### 1. Sistema Solar Básico

```javascript
// Sol no centro
const sun = new CelestialBody({
  name: "Sol",
  radius: 2.0,
  isEmissive: true,
  position: [0, 0, 0]
});

// Terra orbitando o Sol
const earth = new CelestialBody({
  name: "Terra",
  radius: 0.5,
  orbitRadius: 10.0,
  orbitSpeed: 0.1,
  orbitCenter: [0, 0, 0] // Posição do Sol
});

// Lua orbitando a Terra
const moon = new CelestialBody({
  name: "Lua",
  radius: 0.2,
  orbitRadius: 2.0,
  orbitSpeed: 0.5,
  orbitParent: earth // Objeto Terra
});
```

### 2. Sistema de Júpiter com Luas

```javascript
const jupiter = new CelestialBody({
  name: "Júpiter",
  radius: 1.2,
  orbitRadius: 20.0,
  orbitSpeed: 0.05,
  orbitCenter: [0, 0, 0] // Orbita o Sol
});

// Io com órbita elíptica
const io = new CelestialBody({
  name: "Io",
  radius: 0.15
});

io.setEllipticalOrbit(
  3.0,     // semi-eixo maior
  0.2,     // excentricidade
  0.1,     // inclinação
  1.0,     // velocidade
  jupiter  // orbita Júpiter
);
```

### 3. Mudança Dinâmica de Órbita

```javascript
// Asteroide inicialmente orbitando a Terra
const asteroid = new CelestialBody({
  name: "Asteroide",
  radius: 0.1,
  orbitRadius: 3.0,
  orbitSpeed: 1.0
});

asteroid.setOrbitParent(earth);

// Mais tarde, é "capturado" por Júpiter
asteroid.setOrbitParent(jupiter, 8.0, 0.3);
```

## Vantagens da Nova Implementação

1. **Hierarquia Realista**: Luas seguem automaticamente seus planetas
2. **Flexibilidade**: Suporte tanto para coordenadas fixas quanto objetos dinâmicos
3. **Facilidade de Uso**: Métodos de conveniência simplificam configurações
4. **Compatibilidade**: Código antigo continua funcionando
5. **Dinâmico**: Permite mudanças de órbita em tempo de execução

## Comportamento Orbital

- Quando `orbitParent` está definido, o centro orbital é atualizado automaticamente a cada frame
- O objeto filho acompanha todos os movimentos do objeto pai
- Órbitas elípticas e circulares funcionam com ambos os sistemas
- Inclinações orbitais são preservadas

## Notas de Compatibilidade

- Todo código existente que usa `orbitCenter` como Array continuará funcionando
- A adição de `orbitParent` é totalmente opcional
- Os cálculos de física orbital permanecem inalterados
- Performance: overhead mínimo para objetos sem pai orbital
