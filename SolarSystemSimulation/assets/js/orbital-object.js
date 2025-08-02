import { mat4 } from '../static/gl-matrix/gl-matrix-min.js';

class OrbitalObject {
    constructor(name, semiMajorAxis, eccentricity, radius, orbitSpeed, color) {
        this.name = name;
        this.semiMajorAxis = semiMajorAxis; // in AU
        this.eccentricity = eccentricity; // 0 for circular, 1 for parabolic
        this.radius = radius; // in km
        this.orbitSpeed = orbitSpeed; // in AU/day
        this.color = color; // RGB array [r, g, b]
    }

    getOrbitRadius() {
        // Calculate the orbit radius based on the semi-major axis and eccentricity
        return this.semiMajorAxis * (1 - this.eccentricity);
    }

    getPosition(time) {
        const angle = time * this.orbitSpeed;

        const x = this.semiMajorAxis * Math.cos(angle);
        const y = this.semiMajorAxis * Math.sin(angle) * Math.sqrt(1 - this.eccentricity * this.eccentricity);
        const z = 0;

        return { x, y, z };
    }

    getMatrix(time) {
        const angle = time * this.orbitSpeed;
        const x = this.semiMajorAxis * Math.cos(angle);
        const z = this.semiMinorAxis * Math.sin(angle);

        const matrix = mat4.create();
        mat4.translate(matrix, matrix, [x, 0, z]);
        mat4.scale(matrix, matrix, [this.radius, this.radius, this.radius]);

        return matrix;
    }
}

export default OrbitalObject;