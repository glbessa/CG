# Coordenadas Heliocêntricas na Classe CelestialBody

## Resumo das Novas Funcionalidades

A classe `CelestialBody` foi expandida para suportar **coordenadas heliocêntricas** como forma de especificar posições iniciais. Isso permite posicionamento mais preciso e astronômicamente correto usando:

- **`rad_au`**: Distância radial em Unidades Astronômicas (UA)
- **`hgi_lat`**: Latitude heliográfica em graus
- **`hgi_lon`**: Longitude heliográfica em graus

## Sistema de Coordenadas Heliocêntricas

### Definição
O sistema heliocêntrico tem o **Sol como origem** e usa coordenadas esféricas:

- **Distância Radial (rad_au)**: Distância do Sol em UA (1 UA ≈ 149.6 milhões de km)
- **Latitude Heliográfica (hgi_lat)**: Ângulo vertical em relação ao plano eclíptico (-90° a +90°)
- **Longitude Heliográfica (hgi_lon)**: Ângulo horizontal no plano eclíptico (0° a 360°)

### Conversão para Coordenadas Cartesianas
```
x = rad_au * cos(hgi_lat) * cos(hgi_lon)
y = rad_au * sin(hgi_lat)
z = rad_au * cos(hgi_lat) * sin(hgi_lon)
```

## Novas Propriedades

### `heliocentricCoords`
```javascript
{
  rad_au: number | null,    // Distância em UA
  hgi_lat: number | null,   // Latitude em graus
  hgi_lon: number | null    // Longitude em graus
}
```

## Novos Métodos

### `calculateInitialPosition(options)`
Calcula a posição inicial baseada em coordenadas heliocêntricas ou usa posição fornecida.

**Prioridade:**
1. `options.position` (coordenadas cartesianas explícitas)
2. `options.rad_au`, `options.hgi_lat`, `options.hgi_lon` (coordenadas heliocêntricas)
3. `[0, 0, 0]` (posição padrão)

### `heliocentricToCartesian(rad_au, hgi_lat_deg, hgi_lon_deg)`
Converte coordenadas heliocêntricas para cartesianas.

**Parâmetros:**
- `rad_au`: Distância em UA
- `hgi_lat_deg`: Latitude em graus
- `hgi_lon_deg`: Longitude em graus

**Retorno:** `[x, y, z]` em unidades do mundo (aplicando CONFIG.scale)

### `cartesianToHeliocentric(x, y, z)`
Converte coordenadas cartesianas para heliocêntricas.

**Retorno:**
```javascript
{
  rad_au: number,     // Distância em UA
  hgi_lat: number,    // Latitude em graus
  hgi_lon: number     // Longitude em graus
}
```

### `setHeliocentricPosition(rad_au, hgi_lat_deg, hgi_lon_deg)`
Define a posição atual usando coordenadas heliocêntricas.

### `getCurrentHeliocentricCoords()`
Obtém as coordenadas heliocêntricas da posição atual.

### `getInitialHeliocentricCoords()`
Retorna as coordenadas heliocêntricas iniciais (se foram definidas).

### `hasHeliocentricCoords()`
Verifica se coordenadas heliocêntricas iniciais foram definidas.

**Retorno:** `boolean`

### `logHeliocentricInfo()`
Exibe informações de debug das coordenadas heliocêntricas (inicial e atual).

## Exemplos de Uso

### 1. Posicionamento Básico

```javascript
// Terra a 1 UA do Sol, no plano eclíptico
const terra = new CelestialBody({
  name: "Terra",
  radius: 0.5,
  rad_au: 1.0,      // 1 UA do Sol
  hgi_lat: 0.0,     // No plano eclíptico
  hgi_lon: 0.0      // Longitude inicial 0°
});

// Marte com inclinação orbital
const marte = new CelestialBody({
  name: "Marte",
  radius: 0.3,
  rad_au: 1.52,     // 1.52 UA
  hgi_lat: 1.85,    // Inclinação orbital de 1.85°
  hgi_lon: 90.0     // Posição inicial em 90°
});
```

### 2. Objetos do Sistema Solar Exterior

```javascript
// Júpiter
const jupiter = new CelestialBody({
  name: "Júpiter",
  radius: 1.2,
  rad_au: 5.2,      // 5.2 UA
  hgi_lat: 1.3,     // Pequena inclinação
  hgi_lon: 45.0
});

// Cometa com órbita muito inclinada
const cometa = new CelestialBody({
  name: "Cometa Halley",
  radius: 0.05,
  rad_au: 35.0,     // Afélio distante
  hgi_lat: 162.0,   // Órbita retrógrada
  hgi_lon: 58.0
});
```

### 3. Missões Espaciais e Sondas

```javascript
// Sonda entre Terra e Marte
const voyager = new CelestialBody({
  name: "Voyager 1",
  radius: 0.01,
  rad_au: 1.3,      // Entre Terra e Marte
  hgi_lat: 5.0,     // Fora do plano eclíptico
  hgi_lon: 22.5
});
```

### 4. Posicionamento Dinâmico

```javascript
// Criar objeto e posicionar depois
const asteroide = new CelestialBody({
  name: "Ceres",
  radius: 0.1
});

// Posicionar no cinturão de asteroides
asteroide.setHeliocentricPosition(2.77, 10.6, 120.0);
```

### 5. Conversão e Análise

```javascript
// Objeto com posição cartesiana
const objeto = new CelestialBody({
  name: "Objeto",
  position: [3.0, 0.5, 1.2]
});

// Converter para heliocêntrico
const coords = objeto.getCurrentHeliocentricCoords();
console.log(`Distância: ${coords.rad_au.toFixed(2)} UA`);
console.log(`Latitude: ${coords.hgi_lat.toFixed(1)}°`);
console.log(`Longitude: ${coords.hgi_lon.toFixed(1)}°`);
```

## Integração com Funcionalidades Existentes

### Compatibilidade
- **Total compatibilidade** com código existente
- Coordenadas heliocêntricas são **opcionais**
- Se não fornecidas, usa `position` ou `[0, 0, 0]`

### Órbitas
As coordenadas heliocêntricas definem apenas a **posição inicial**. O movimento orbital continua sendo controlado por:
- `orbitRadius` e `orbitSpeed` (órbitas circulares)
- `ellipticalOrbit` (órbitas elípticas)
- `orbitParent` (órbitas em torno de outros objetos)

### Escalas
- As coordenadas são automaticamente convertidas usando `CONFIG.scale`
- 1 UA no espaço real = `1 / CONFIG.scale` unidades no mundo virtual

## Casos de Uso Práticos

### 1. Simulações Astronômicas Realistas
```javascript
// Posições planetárias em uma data específica
const planets = [
  { name: "Mercúrio", rad_au: 0.39, hgi_lat: 3.4, hgi_lon: 15.0 },
  { name: "Vênus", rad_au: 0.72, hgi_lat: 3.9, hgi_lon: 75.0 },
  { name: "Terra", rad_au: 1.00, hgi_lat: 0.0, hgi_lon: 135.0 },
  { name: "Marte", rad_au: 1.52, hgi_lat: 1.9, hgi_lon: 200.0 }
];
```

### 2. Missões Espaciais
```javascript
// Trajetória Terra-Marte
const spacecraft = new CelestialBody({
  name: "Mars Mission",
  rad_au: 1.15,     // Posição intermediária
  hgi_lat: 0.8,     // Ligeiramente inclinada
  hgi_lon: 67.5     // Entre Terra e Marte
});
```

### 3. Objetos do Cinturão de Asteroides
```javascript
// Distribuição realista no cinturão
const asteroids = [];
for (let i = 0; i < 10; i++) {
  asteroids.push(new CelestialBody({
    name: `Asteroid ${i}`,
    rad_au: 2.2 + Math.random() * 1.2,  // 2.2-3.4 UA
    hgi_lat: (Math.random() - 0.5) * 20, // ±10°
    hgi_lon: Math.random() * 360          // Distribuição aleatória
  }));
}
```

## Informações de Debug

### `getDetailedInfo()`
Agora inclui seção `heliocentricCoords`:
```javascript
{
  initial: { rad_au, hgi_lat, hgi_lon },
  current: { rad_au, hgi_lat, hgi_lon },
  hasInitialCoords: boolean
}
```

### `logHeliocentricInfo()`
Exibe comparação entre coordenadas iniciais e atuais:
```
Terra - Coordenadas Heliocêntricas: {
  initial: { rad_au: "1.000", hgi_lat: "0.00", hgi_lon: "0.00" },
  current: { rad_au: "1.024", hgi_lat: "2.15", hgi_lon: "45.30" },
  cartesian: { position: ["0.72", "0.04", "0.73"] }
}
```

## Limitações e Considerações

1. **Coordenadas Iniciais**: As coordenadas heliocêntricas definem apenas a posição inicial
2. **Sistema de Referência**: Assume Sol na origem (0, 0, 0)
3. **Escala**: Dependente de CONFIG.scale para conversão visual
4. **Movimento**: Movimento orbital sobrescreve posição inicial durante update()

## Referências Astronômicas

- **UA (Unidade Astronômica)**: 149,597,870.7 km
- **Plano Eclíptico**: Plano da órbita terrestre
- **Latitude Heliográfica**: Medida a partir do plano eclíptico
- **Longitude Heliográfica**: Medida a partir do equinócio vernal
