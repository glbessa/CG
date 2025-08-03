// Exemplo de uso de dados temporais na classe CelestialBody
// Este arquivo demonstra como carregar e usar dados astronômicos reais com timestamps

import CelestialBody from './celestial-body.js';

// Exemplo 1: Criando arquivo de dados temporais de exemplo
function createSampleTemporalData() {
  // Exemplo de dados da Terra ao longo de uma semana em 1980
  const earthData = [
    {
      "YEAR": 1980,
      "DAY": 1,
      "HR": 0,
      "RAD_AU": 0.9832,
      "HGI_LAT": -2969,  // Em centésimos de grau (-29.69°)
      "HGI_LON": 24064   // Em centésimos de grau (240.64°)
    },
    {
      "YEAR": 1980,
      "DAY": 2,
      "HR": 0,
      "RAD_AU": 0.9833,
      "HGI_LAT": -3085,
      "HGI_LON": 25078
    },
    {
      "YEAR": 1980,
      "DAY": 3,
      "HR": 0,
      "RAD_AU": 0.9834,
      "HGI_LAT": -3200,
      "HGI_LON": 26091
    },
    {
      "YEAR": 1980,
      "DAY": 4,
      "HR": 0,
      "RAD_AU": 0.9835,
      "HGI_LAT": -3314,
      "HGI_LON": 27105
    },
    {
      "YEAR": 1980,
      "DAY": 5,
      "HR": 0,
      "RAD_AU": 0.9836,
      "HGI_LAT": -3427,
      "HGI_LON": 28118
    }
  ];

  // Exemplo de dados de Marte com timestamps menos frequentes
  const marsData = [
    {
      "YEAR": 1980,
      "DAY": 1,
      "HR": 0,
      "RAD_AU": 1.524,
      "HGI_LAT": 185,    // 1.85°
      "HGI_LON": 35543   // 355.43°
    },
    {
      "YEAR": 1980,
      "DAY": 5,
      "HR": 0,
      "RAD_AU": 1.526,
      "HGI_LAT": 189,
      "HGI_LON": 35987
    },
    {
      "YEAR": 1980,
      "DAY": 10,
      "HR": 0,
      "RAD_AU": 1.528,
      "HGI_LAT": 193,
      "HGI_LON": 36431
    }
  ];

  return { earthData, marsData };
}

// Exemplo 2: Configuração básica com dados temporais
async function createBasicTemporalSystem() {
  const system = {};

  // Sol no centro (sem dados temporais)
  system.sun = new CelestialBody({
    name: "Sol",
    radius: 2.0,
    color: [1.0, 1.0, 0.0, 1.0],
    isEmissive: true,
    position: [0, 0, 0]
  });

  // Terra com dados temporais
  system.earth = new CelestialBody({
    name: "Terra",
    radius: 0.5,
    color: [0.0, 0.5, 1.0, 1.0],
    
    // Configurações de tempo
    startYear: 1980,
    startDay: 1,
    startHour: 0,
    timeScale: 1.0,
    interpolation: true,
    useTemporalData: true,
    
    // Dados de fallback (caso não haja dados temporais)
    orbitRadius: 1.0,
    orbitSpeed: 0.1
  });

  // Carregar dados temporais da Terra
  // Em um caso real, você carregaria de um arquivo:
  // await system.earth.loadTemporalData('./earth_1980.json');
  
  // Para este exemplo, vamos simular o carregamento
  const sampleData = createSampleTemporalData();
  system.earth.temporalData.data = system.earth.validateTemporalData(sampleData.earthData);
  system.earth.temporalData.loaded = true;
  
  console.log("Terra configurada com dados temporais!");

  return system;
}

// Exemplo 3: Sistema com múltiplos corpos usando dados temporais
async function createAdvancedTemporalSystem() {
  const configurations = [
    {
      options: {
        name: "Sol",
        radius: 2.0,
        color: [1.0, 1.0, 0.0, 1.0],
        isEmissive: true,
        position: [0, 0, 0]
      }
      // Sol não tem dados temporais
    },
    {
      options: {
        name: "Terra",
        radius: 0.5,
        color: [0.0, 0.5, 1.0, 1.0],
        startYear: 1980,
        startDay: 1,
        timeScale: 24.0, // 1 hora de simulação = 1 dia real
        interpolation: true
      },
      temporalDataPath: './data/earth_coordinates.json' // Arquivo hipotético
    },
    {
      options: {
        name: "Marte",
        radius: 0.3,
        color: [1.0, 0.4, 0.2, 1.0],
        startYear: 1980,
        startDay: 1,
        timeScale: 24.0,
        interpolation: true,
        
        // Dados de fallback para quando não há dados temporais
        orbitRadius: 1.52,
        orbitSpeed: 0.05
      },
      temporalDataPath: './data/mars_coordinates.json' // Arquivo hipotético
    }
  ];

  // Este método carregaria os corpos e seus dados automaticamente
  // const bodies = await CelestialBody.loadMultipleWithTemporalData(configurations);
  
  // Para este exemplo, vamos criar manualmente
  const system = {};
  
  system.sun = new CelestialBody(configurations[0].options);
  
  system.earth = new CelestialBody(configurations[1].options);
  const sampleData = createSampleTemporalData();
  system.earth.temporalData.data = system.earth.validateTemporalData(sampleData.earthData);
  system.earth.temporalData.loaded = true;
  
  system.mars = new CelestialBody(configurations[2].options);
  system.mars.temporalData.data = system.mars.validateTemporalData(sampleData.marsData);
  system.mars.temporalData.loaded = true;

  return system;
}

// Exemplo 4: Análise e debug de dados temporais
async function analyzeTemporalData() {
  const system = await createAdvancedTemporalSystem();
  
  console.log("=== ANÁLISE DE DADOS TEMPORAIS ===\n");
  
  Object.values(system).forEach(body => {
    if (body instanceof CelestialBody) {
      console.log(`--- ${body.name} ---`);
      
      if (body.hasTemporalData()) {
        body.logTemporalDataInfo();
        
        // Testar coordenadas em datas específicas
        console.log("Coordenadas em datas específicas:");
        
        const testDates = [
          { year: 1980, day: 1, hour: 0 },
          { year: 1980, day: 3, hour: 12 },
          { year: 1980, day: 5, hour: 0 }
        ];
        
        testDates.forEach(date => {
          const coords = body.getCoordinatesAtDate(date.year, date.day, date.hour);
          if (coords) {
            console.log(`  ${date.year}/${date.day} ${date.hour}h: ` +
                       `${coords.rad_au.toFixed(3)} UA, ` +
                       `lat=${coords.hgi_lat.toFixed(2)}°, ` +
                       `lon=${coords.hgi_lon.toFixed(2)}°`);
          }
        });
      } else {
        console.log("Sem dados temporais - usando cálculos matemáticos");
      }
      
      console.log("");
    }
  });
}

// Exemplo 5: Simulação temporal com comparação de métodos
function simulateWithComparison(system, duration) {
  console.log("=== SIMULAÇÃO COM COMPARAÇÃO ===\n");
  console.log("Comparando posições: dados temporais vs. cálculos matemáticos\n");
  
  const timeSteps = [0, duration * 0.25, duration * 0.5, duration * 0.75, duration];
  
  timeSteps.forEach(time => {
    console.log(`Tempo: ${time.toFixed(1)}`);
    
    Object.values(system).forEach(body => {
      if (body.hasTemporalData()) {
        // Obter posição usando dados temporais
        const temporalCoords = body.getCoordinatesAtTime(time);
        
        // Temporariamente desativar dados temporais para comparação
        body.setUseTemporalData(false);
        const mathCoords = body.calculateMathematicalPosition(time);
        body.setUseTemporalData(true);
        
        console.log(`  ${body.name}:`);
        console.log(`    Temporal: ${temporalCoords.rad_au.toFixed(3)} UA, ` +
                   `lat=${temporalCoords.hgi_lat.toFixed(2)}°, ` +
                   `lon=${temporalCoords.hgi_lon.toFixed(2)}°`);
        console.log(`    Matemático: ${mathCoords.rad_au.toFixed(3)} UA, ` +
                   `lat=${mathCoords.hgi_lat.toFixed(2)}°, ` +
                   `lon=${mathCoords.hgi_lon.toFixed(2)}°`);
        
        // Calcular diferença
        const radDiff = Math.abs(temporalCoords.rad_au - mathCoords.rad_au);
        const latDiff = Math.abs(temporalCoords.hgi_lat - mathCoords.hgi_lat);
        const lonDiff = Math.abs(temporalCoords.hgi_lon - mathCoords.hgi_lon);
        
        console.log(`    Diferença: ${radDiff.toFixed(4)} UA, ` +
                   `lat=${latDiff.toFixed(2)}°, ` +
                   `lon=${lonDiff.toFixed(2)}°`);
      }
    });
    
    console.log("");
  });
}

// Exemplo 6: Controle de configurações temporais
function demonstrateTemporalControls() {
  console.log("=== CONTROLES TEMPORAIS ===\n");
  
  const earth = new CelestialBody({
    name: "Terra",
    radius: 0.5,
    startYear: 1980,
    startDay: 1
  });
  
  // Simular carregamento de dados
  const sampleData = createSampleTemporalData();
  earth.temporalData.data = earth.validateTemporalData(sampleData.earthData);
  earth.temporalData.loaded = true;
  
  console.log("Configurações iniciais:");
  earth.logTemporalDataInfo();
  
  // Alterar escala temporal
  console.log("\nAlterando escala temporal para 2x:");
  earth.setTimeScale(2.0);
  earth.logTemporalDataInfo();
  
  // Desativar interpolação
  console.log("\nDesativando interpolação:");
  earth.setInterpolation(false);
  const info = earth.getTemporalDataInfo();
  console.log(`Interpolação: ${info.interpolation ? "Ativa" : "Inativa"}`);
  
  // Alterar data inicial
  console.log("\nAlterando data inicial para 1981/50:");
  earth.setStartTime(1981, 50, 12);
  earth.logTemporalDataInfo();
}

// Exemplo 7: Função principal de demonstração
async function demonstrateTemporalFeatures() {
  console.log("🚀 DEMONSTRAÇÃO: Dados Temporais na CelestialBody\n");
  
  try {
    // 1. Sistema básico
    console.log("1. Criando sistema básico com dados temporais...");
    const basicSystem = await createBasicTemporalSystem();
    
    // 2. Análise de dados
    console.log("\n2. Analisando dados temporais carregados...");
    await analyzeTemporalData();
    
    // 3. Simulação com comparação
    console.log("\n3. Executando simulação com comparação...");
    const advancedSystem = await createAdvancedTemporalSystem();
    simulateWithComparison(advancedSystem, 10.0);
    
    // 4. Demonstrar controles
    console.log("\n4. Demonstrando controles temporais...");
    demonstrateTemporalControls();
    
    console.log("\n✅ Demonstração concluída com sucesso!");
    
    return { basicSystem, advancedSystem };
    
  } catch (error) {
    console.error("❌ Erro na demonstração:", error);
  }
}

// Exemplo 8: Função utilitária para criar arquivo de dados temporais
function generateTemporalDataFile(bodyName, startYear, startDay, numDays, filename) {
  const data = [];
  
  for (let day = 0; day < numDays; day++) {
    // Simular dados astronômicos (em aplicação real, estes viriam de fontes científicas)
    const currentDay = startDay + day;
    const angle = (day / numDays) * 2 * Math.PI;
    
    data.push({
      YEAR: startYear,
      DAY: currentDay,
      HR: 0,
      RAD_AU: 1.0 + 0.1 * Math.cos(angle), // Variação orbital simulada
      HGI_LAT: Math.floor((Math.sin(angle * 0.1) * 500)), // Em centésimos de grau
      HGI_LON: Math.floor((angle * 180 / Math.PI + day * 0.98) * 100) % 36000 // Rotação
    });
  }
  
  console.log(`Dados temporais gerados para ${bodyName}:`);
  console.log(`Período: ${startYear}/${startDay} a ${startYear}/${startDay + numDays - 1}`);
  console.log(`Total de registros: ${data.length}`);
  console.log(`Arquivo sugerido: ${filename}`);
  
  return data;
}

// Exportar para uso externo
export {
  createSampleTemporalData,
  createBasicTemporalSystem,
  createAdvancedTemporalSystem,
  analyzeTemporalData,
  simulateWithComparison,
  demonstrateTemporalControls,
  demonstrateTemporalFeatures,
  generateTemporalDataFile
};
