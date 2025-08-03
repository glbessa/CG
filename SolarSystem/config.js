const CONFIG = {
    // Fator de escala para distâncias orbitais (quanto maior, mais próximos os planetas ficam)
    scale: 0.001, 
    
    // Fator de escala para tamanho dos corpos celestes (quanto maior, menores os planetas ficam)
    // Separado do scale orbital para permitir ajustar tamanhos independentemente das órbitas
    bodyScale: 10000, 
    
    simulationVelocity: 10, // Dias por segundo na simulação
    startDatetime: new Date('1965-01-01T00:00:00Z'), // Data inicial do sistema solar
    endDatetime: new Date('2035-12-30T00:00:00Z'), // Data final do sistema solar
    earthDistance: 149_597_870.7, // Distância média da Terra em km (1 UA)
    sunDiameter: 1_392_700, // Diâmetro do Sol em km
}

export default CONFIG;