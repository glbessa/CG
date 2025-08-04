import CONFIG from './config.js';

async function loadAsset(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download asset: ${response.statusText}`);
    }
    return await response.text();
}

function heliocentricToCartesian(rad_au, hgi_lat_deg, hgi_lon_deg) {
    const hgi_lat = hgi_lat_deg * Math.PI / 180;
    const hgi_lon = hgi_lon_deg * Math.PI / 180;

    const visualDistance = rad_au / CONFIG.distanceScale;

    const x = visualDistance * Math.cos(hgi_lat) * Math.cos(hgi_lon);
    const y = visualDistance * Math.sin(hgi_lat);
    const z = visualDistance * Math.cos(hgi_lat) * Math.sin(hgi_lon);

    return [x, y, z];
}

function cartesianToHeliocentric(x, y, z) {
    const rad_au = Math.sqrt(x * x + y * y + z * z) * CONFIG.distanceScale;
    const hgi_lat_rad = Math.asin(y / (rad_au / CONFIG.distanceScale));
    const hgi_lat_deg = hgi_lat_rad * 180 / Math.PI;
    const hgi_lon_rad = Math.atan2(z, x);
    const hgi_lon_deg = hgi_lon_rad * 180 / Math.PI;

    return {
        rad_au: rad_au,
        hgi_lat: hgi_lat_deg,
        hgi_lon: hgi_lon_deg
    };
}

function solveKeplersEquation(meanAnomaly, eccentricity, maxIterations = 10, tolerance = 1e-6) {
    let E = meanAnomaly;
    
    for (let i = 0; i < maxIterations; i++) {
      const deltaE = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
      E = E - deltaE;
      
      if (Math.abs(deltaE) < tolerance) {
        break;
      }
    }
    
    return E;
}

export { loadAsset, heliocentricToCartesian, cartesianToHeliocentric, solveKeplersEquation };