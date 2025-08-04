const CONFIG = {
    distanceScale: 0.01, 
    bodyScale: 10000, // Reduzido para tornar os corpos visíveis
    
    simulationVelocity: 1, // Dias por segundo na simulação
    startDatetime: new Date(1965, 0, 1), // Data inicial do sistema solar
    endDatetime: new Date(2035, 11, 30), // Data final do sistema solar
    earthDistance: 149_597_870.7, // Distância média da Terra em km (1 UA)
    sunDiameter: 1_392_700, // Diâmetro do Sol em km
    gravitationalConstant: 6.67430e-11, // Constante gravitacional em m³/(kg·s²)
    celestialBodies: [
        {
            name: 'sun',
            texture: '2k_sun.jpg',
        },
        {
            name: 'mercury',
            texture: '2k_mercury.jpg',
            orbits: 'sun',
        },
        {
            name: 'venus',
            texture: '2k_venus_atmosphere.jpg',
            orbits: 'sun',
        },
        {
            name: 'earth',
            texture: '2k_earth_daymap.jpg',
            orbits: 'sun',
        },
        {
            name: 'moon',
            texture: '2k_moon.jpg',
            orbits: 'earth',
        },
        {
            name: 'mars',
            texture: '2k_mars.jpg',
            orbits: 'sun',
        },
        {
            name: 'jupiter',
            texture: '2k_jupiter.jpg',
            orbits: 'sun',
        },
        {
            name: 'saturn',
            texture: '2k_saturn.jpg',
            orbits: 'sun',
        },
        {
            name: 'uranus',
            texture: '2k_uranus.jpg',
            orbits: 'sun',
        },
        {
            name: 'neptune',
            texture: '2k_neptune.jpg',
            orbits: 'sun',
        },
        {
            name: 'comet_halley',
            orbits: 'sun',
        }
    ],
    texturesFilepath: 'textures/',
    astronomicalData: 'data/astronomical-data.json',
    temporalDataFilepath: 'data/orbital/',
    shaders: {
        vertex: 'shaders/general.vert',
        fragment: 'shaders/general.frag',
        sunFragment: 'shaders/sun.frag',
        cometFragment: 'shaders/comet.frag',
    },
}

export default CONFIG;