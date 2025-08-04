import CelestialBody from "./celestial-body.js";

class System {
    constructor({
        celestialBodies = [],
    }) {
        this.celestialBodies = celestialBodies;
    }

    update(time) {
        this.celestialBodies.forEach(body => {
            body.update(time);
        });
    }

    render(viewProjectionMatrix, lightPosition, cameraPosition) {
        this.celestialBodies.forEach(body => {
            body.render(viewProjectionMatrix, lightPosition, cameraPosition);
        });
    }

    async load({
        celestialBodiesData = [],
        texturesFilepath = 'textures/',
        astronomicalDataFilepath = 'data/astronomical-data.json',
        temporalDataFilepath = 'data/orbital/',
    }) {
        let astronomicalData;
        try {
            astronomicalData = await fetch(astronomicalDataFilepath).then(response => response.json());
        } catch (error) {
            console.error("Failed to load astronomical data:", error);
            return;
        }

        const temporalData = [];
        for (const bodyData of celestialBodiesData) {
            try {
                const temporalDataFile = `${temporalDataFilepath}${bodyData.name}.json`;
                const data = await fetch(temporalDataFile).then(response => response.json());
                const processedData = this._processTemporalData(data);
                temporalData.push({ name: bodyData.name, data: processedData });
            } catch (error) {
                console.error(`Failed to load temporal data for ${bodyData.name}:`, error);
            }
        }

        for (const bodyData of celestialBodiesData) {
            const astroData = astronomicalData[bodyData.name] || {};
            console.log(`Carregando ${bodyData.name}:`, {
                bodyData,
                astroData,
                temporalDataExists: temporalData.find(item => item.name === bodyData.name)?.data ? "yes" : "no"
            });
            
            const bodyOptions = {
                ...bodyData,
                physicalData: astroData,
                diameter: astroData.diameter,
                rotationPeriod: astroData.rotationPeriod,
                distanceFromSun: astroData.distanceFromSun,
                orbitalPeriod: astroData.orbitalPeriod,
                orbitalInclination: astroData.orbitalInclination,
                orbitalEccentricity: astroData.orbitalEccentricity,
                textureUrl: bodyData.texture ? texturesFilepath + bodyData.texture : null,
                temporalData: temporalData.find(item => item.name === bodyData.name)?.data || {},
            };
            
            console.log(`Opções finais para ${bodyData.name}:`, bodyOptions);
            const body = new CelestialBody(bodyOptions);
            this.celestialBodies.push(body);
        }
    }

    _processTemporalData(data) {
        const dataByDate = {};
        for (const entry of data) {
            let date = new Date(entry.YEAR, 0, 0);
            date.setTime(date.getTime() + entry.DAY * 24 * 60 * 60 * 1000);
            const dateString = date.toISOString().split('T')[0];
            dataByDate[dateString] = {
                RAD_AU: entry.RAD_AU,
                HGI_LAT: entry.HGI_LAT,
                HGI_LON: entry.HGI_LON,
            };
        }
        return dataByDate;
    }
}

export default System;