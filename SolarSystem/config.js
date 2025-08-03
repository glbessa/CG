const CONFIG = {
    scale: 100_000, // Fator de escala para o sistema solar
    simulationVelocity: 10, // Dias por segundo na simulação
    startDatetime: new Date('1980-01-01T00:00:00Z'), // Data inicial do sistema solar
    endDatetime: new Date('2020-01-01T00:00:00Z'), // Data final do sistema solar
    earthDistance: 149_597_870.7, // Distância média da Terra
    sunDiameter: 1_392_700, // Diâmetro do Sol em km
}

export default CONFIG;