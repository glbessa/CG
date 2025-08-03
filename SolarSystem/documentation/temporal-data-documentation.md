# Dados Temporais na Classe CelestialBody

## Resumo das Funcionalidades

A classe `CelestialBody` foi expandida para suportar **dados temporais de coordenadas heliocêntricas**, permitindo usar dados astronômicos reais com timestamps específicos. O sistema oferece interpolação automática e fallback para cálculos matemáticos quando dados não estão disponíveis.

## Formato dos Dados Temporais

### Estrutura do Arquivo JSON
```json
[
  {
    "YEAR": 1980,
    "DAY": 1,
    "HR": 0,
    "RAD_AU": 0.9832,
    "HGI_LAT": -2969,
    "HGI_LON": 24064
  },
  {
    "YEAR": 1980,
    "DAY": 2,
    "HR": 0,
    "RAD_AU": 0.9833,
    "HGI_LAT": -3085,
    "HGI_LON": 25078
  }
]
```

### Campos Obrigatórios
- **`YEAR`**: Ano (inteiro)
- **`DAY`**: Dia do ano (1-365)
- **`HR`**: Hora do dia (0-23, pode ser decimal)
- **`RAD_AU`**: Distância em UA (decimal)
- **`HGI_LAT`**: Latitude heliográfica em centésimos de grau (inteiro)
- **`HGI_LON`**: Longitude heliográfica em centésimos de grau (inteiro)

### Formato das Coordenadas
- **Latitude/Longitude**: Valores em centésimos de grau (ex: -2969 = -29.69°)
- **Automaticamente convertidos** para graus decimais pela classe
- **Range**: LAT (-9000 a 9000), LON (0 a 35999)

## Novas Propriedades

### `temporalData`
```javascript
{
  loaded: boolean,           // Se dados foram carregados
  data: Array,              // Array de registros temporais
  currentIndex: number,     // Índice atual nos dados
  interpolation: boolean,   // Se interpolação está ativa
  useTemporalData: boolean  // Se deve usar dados temporais
}
```

### `timeConfig`
```javascript
{
  startYear: number,           // Ano inicial da simulação
  startDay: number,           // Dia inicial da simulação
  startHour: number,          // Hora inicial da simulação
  timeScale: number,          // Fator de escala temporal
  currentSimulationTime: number // Tempo atual da simulação
}
```

## Métodos Principais

### `loadTemporalData(filePath)`
Carrega dados temporais de um arquivo JSON.

**Parâmetros:**
- `filePath`: Caminho para o arquivo JSON

**Retorno:** `Promise<boolean>` - True se carregado com sucesso

**Exemplo:**
```javascript
const earth = new CelestialBody({ name: "Terra" });
const success = await earth.loadTemporalData('./data/earth_1980.json');
```

### `getCoordinatesAtTime(simulationTime)`
Obtém coordenadas para um tempo específico (dados ou cálculo).

**Retorno:**
```javascript
{
  rad_au: number,    // Distância em UA
  hgi_lat: number,   // Latitude em graus
  hgi_lon: number    // Longitude em graus
}
```

### `getCoordinatesAtDate(year, day, hour)`
Obtém coordenadas para uma data específica.

**Parâmetros:**
- `year`: Ano
- `day`: Dia do ano
- `hour`: Hora (pode ser decimal)

## Métodos de Configuração

### `setUseTemporalData(use)`
Ativa/desativa uso de dados temporais.

### `setInterpolation(enabled)`
Ativa/desativa interpolação entre registros.

### `setTimeScale(scale)`
Define escala temporal (1.0 = tempo real).

### `setStartTime(year, day, hour)`
Define data/hora inicial da simulação.

## Interpolação Automática

### Como Funciona
1. **Busca registros** mais próximos ao tempo solicitado
2. **Calcula fator** de interpolação (0-1)
3. **Interpola linearmente** RAD_AU e HGI_LAT
4. **Interpola circularmente** HGI_LON (considerando wrap-around em 360°)

### Configuração
```javascript
const body = new CelestialBody({
  name: "Terra",
  interpolation: true,  // Ativar interpolação (padrão: true)
  useTemporalData: true // Usar dados quando disponíveis (padrão: true)
});
```

## Fallback para Cálculos Matemáticos

### Ordem de Prioridade
1. **Dados temporais** (se carregados e ativos)
2. **Órbita elíptica** (se configurada)
3. **Órbita circular** (se configurada)
4. **Posição estática**

### Exemplo de Fallback
```javascript
const mars = new CelestialBody({
  name: "Marte",
  // Dados temporais (prioridade 1)
  useTemporalData: true,
  
  // Fallback para órbita elíptica (prioridade 2)
  orbitRadius: 1.52,
  orbitSpeed: 0.05,
  
  // Fallback para posição estática (prioridade 3)
  position: [1.5, 0, 0]
});

await mars.loadTemporalData('./mars_data.json');
// Se arquivo não existir, usará órbita circular
```

## Exemplos de Uso

### 1. Carregamento Básico

```javascript
const earth = new CelestialBody({
  name: "Terra",
  radius: 0.5,
  color: [0.0, 0.5, 1.0, 1.0],
  
  // Configurações temporais
  startYear: 1980,
  startDay: 1,
  timeScale: 24.0,  // 1 hora simulação = 1 dia real
  interpolation: true
});

// Carregar dados
await earth.loadTemporalData('./data/earth_coordinates.json');

// Verificar se carregou
if (earth.hasTemporalData()) {
  console.log("Dados carregados com sucesso!");
  earth.logTemporalDataInfo();
}
```

### 2. Sistema com Múltiplos Corpos

```javascript
const configurations = [
  {
    options: {
      name: "Terra",
      radius: 0.5,
      startYear: 1980,
      timeScale: 24.0
    },
    temporalDataPath: './data/earth_1980.json'
  },
  {
    options: {
      name: "Marte",
      radius: 0.3,
      startYear: 1980,
      timeScale: 24.0,
      // Fallback se dados não disponíveis
      orbitRadius: 1.52,
      orbitSpeed: 0.05
    },
    temporalDataPath: './data/mars_1980.json'
  }
];

const bodies = await CelestialBody.loadMultipleWithTemporalData(configurations);
```

### 3. Controle Temporal Dinâmico

```javascript
const earth = new CelestialBody({ name: "Terra" });
await earth.loadTemporalData('./earth_data.json');

// Configurar simulação
earth.setStartTime(1980, 1, 0);    // Começar em 1/1/1980
earth.setTimeScale(365 * 24);      // 1 hora = 1 ano
earth.setInterpolation(true);      // Ativar interpolação

// Durante a simulação
function updateSimulation(time) {
  earth.update(time);
  
  // Obter coordenadas atuais
  const coords = earth.getCurrentHeliocentricCoords();
  console.log(`Terra: ${coords.rad_au.toFixed(3)} UA`);
}
```

### 4. Análise de Dados

```javascript
const body = new CelestialBody({ name: "Cometa" });
await body.loadTemporalData('./comet_data.json');

// Informações sobre os dados
const info = body.getTemporalDataInfo();
console.log(`Dados: ${info.recordCount} registros`);
console.log(`Período: ${info.timeRange.start.year} a ${info.timeRange.end.year}`);

// Coordenadas em datas específicas
const coords1980 = body.getCoordinatesAtDate(1980, 1, 0);
const coords1981 = body.getCoordinatesAtDate(1981, 1, 0);

console.log("Variação anual:", {
  deltaR: coords1981.rad_au - coords1980.rad_au,
  deltaLat: coords1981.hgi_lat - coords1980.hgi_lat,
  deltaLon: coords1981.hgi_lon - coords1980.hgi_lon
});
```

### 5. Comparação: Dados vs. Cálculos

```javascript
const planet = new CelestialBody({
  name: "Júpiter",
  orbitRadius: 5.2,
  orbitSpeed: 0.02
});

await planet.loadTemporalData('./jupiter_data.json');

function comparePositions(time) {
  // Posição usando dados temporais
  const dataCoords = planet.getCoordinatesAtTime(time);
  
  // Posição usando cálculos matemáticos
  planet.setUseTemporalData(false);
  const mathCoords = planet.calculateMathematicalPosition(time);
  planet.setUseTemporalData(true);
  
  // Calcular diferença
  const difference = {
    rad_au: Math.abs(dataCoords.rad_au - mathCoords.rad_au),
    hgi_lat: Math.abs(dataCoords.hgi_lat - mathCoords.hgi_lat),
    hgi_lon: Math.abs(dataCoords.hgi_lon - mathCoords.hgi_lon)
  };
  
  return { dataCoords, mathCoords, difference };
}
```

## Conversão de Tempo

### Simulação para Astronômico
```javascript
const astronomicalTime = body.simulationTimeToAstronomical(simulationTime);
// Retorna: { year, day, hour }
```

### Exemplo de Escala Temporal
```javascript
// timeScale = 1.0: 1 hora simulação = 1 hora real
// timeScale = 24.0: 1 hora simulação = 1 dia real
// timeScale = 365 * 24: 1 hora simulação = 1 ano real

body.setTimeScale(24.0);
// Simulação de 1 hora = dados de 1 dia
```

## Métodos de Debug

### `logTemporalDataInfo()`
Exibe informações detalhadas sobre dados temporais.

### `getTemporalDataInfo()`
Retorna informações programáticas sobre dados temporais.

### Exemplo de Debug
```javascript
body.logTemporalDataInfo();
// Saída:
// Terra - Dados Temporais: {
//   registros: 365,
//   periodo: "1980/1 até 1980/365",
//   interpolacao: "Ativa",
//   usoAtivo: "Sim",
//   tempoAtual: "1980/156 12.5h"
// }
```

## Integração com Update Loop

### Método `update()` Modificado
```javascript
update(time) {
  // 1. Verificar se há dados temporais
  if (this.temporalData.loaded && this.temporalData.useTemporalData) {
    // Usar dados temporais
    const coords = this.getCoordinatesAtTime(time);
    const position = this.heliocentricToCartesian(coords.rad_au, coords.hgi_lat, coords.hgi_lon);
    // Aplicar posição...
  }
  // 2. Fallback para órbita elíptica
  else if (this.ellipticalOrbit.isElliptical) {
    // Usar cálculos de órbita elíptica...
  }
  // 3. Fallback para órbita circular
  else if (this.orbitRadius > 0) {
    // Usar cálculos de órbita circular...
  }
  // 4. Posição estática
  else {
    // Usar posição fixa...
  }
}
```

## Casos de Uso Práticos

### 1. Missões Espaciais Históricas
```javascript
const voyager1 = new CelestialBody({
  name: "Voyager 1",
  startYear: 1977,
  startDay: 244 // 1 de setembro
});
await voyager1.loadTemporalData('./voyager1_trajectory.json');
```

### 2. Cometas com Órbitas Irregulares
```javascript
const halley = new CelestialBody({
  name: "Cometa Halley",
  startYear: 1985,
  timeScale: 365 * 24 // Simulação rápida
});
await halley.loadTemporalData('./halley_orbit_data.json');
```

### 3. Simulações Científicas Precisas
```javascript
const mars = new CelestialBody({
  name: "Marte",
  interpolation: true,
  timeScale: 1.0 // Tempo real
});
await mars.loadTemporalData('./mars_ephemeris_2020.json');
```

## Limitações e Considerações

1. **Tamanho dos Dados**: Arquivos grandes podem afetar performance
2. **Interpolação**: Limitada a interpolação linear/circular
3. **Validação**: Dados devem estar ordenados cronologicamente
4. **Memória**: Todos os dados são carregados na memória
5. **Precisão**: Dependente da qualidade dos dados fonte

## Fontes de Dados Astronômicos

### Recomendadas
- **NASA/JPL Ephemeris**: Dados planetários precisos
- **SPICE Toolkit**: Dados de missões espaciais
- **IAU Minor Planet Center**: Dados de asteroides
- **ESA/Gaia**: Dados estelares e solares

### Formato de Conversão
```javascript
// Converter dados SPICE para formato CelestialBody
function convertSpiceToTemporal(spiceData) {
  return spiceData.map(record => ({
    YEAR: record.year,
    DAY: record.dayOfYear,
    HR: record.hour,
    RAD_AU: record.distance_au,
    HGI_LAT: Math.round(record.latitude_deg * 100),
    HGI_LON: Math.round(record.longitude_deg * 100)
  }));
}
```
