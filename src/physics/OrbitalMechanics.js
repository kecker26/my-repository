/**
 * Orbital Mechanics - Kepler's Laws Implementation
 * Calculates accurate orbital positions for celestial bodies
 */

/**
 * Solve Kepler's equation using Newton-Raphson method
 * E - e*sin(E) = M
 * @param {number} M - Mean anomaly in radians
 * @param {number} e - Eccentricity
 * @returns {number} Eccentric anomaly in radians
 */
export function solveKeplerEquation(M, e, tolerance = 1e-8, maxIterations = 100) {
    // Initial guess
    let E = M;

    for (let i = 0; i < maxIterations; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= dE;

        if (Math.abs(dE) < tolerance) {
            return E;
        }
    }

    return E;
}

/**
 * Calculate true anomaly from eccentric anomaly
 * @param {number} E - Eccentric anomaly in radians
 * @param {number} e - Eccentricity
 * @returns {number} True anomaly in radians
 */
export function calculateTrueAnomaly(E, e) {
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);

    const x = Math.sqrt(1 - e) * Math.cos(E / 2);
    const y = Math.sqrt(1 + e) * Math.sin(E / 2);

    return 2 * Math.atan2(y, x);
}

/**
 * Calculate orbital radius at given true anomaly
 * @param {number} a - Semi-major axis
 * @param {number} e - Eccentricity
 * @param {number} v - True anomaly in radians
 * @returns {number} Orbital radius
 */
export function calculateOrbitalRadius(a, e, v) {
    return a * (1 - e * e) / (1 + e * Math.cos(v));
}

/**
 * Convert orbital elements to Cartesian coordinates
 * @param {Object} params - Orbital parameters
 * @returns {Object} {x, y, z} position
 */
export function orbitalToCartesian({
    semiMajorAxis,
    eccentricity,
    inclination,
    meanAnomaly,
    argumentOfPerihelion = 0,
    longitudeOfAscendingNode = 0
}) {
    // Convert angles to radians
    const M = meanAnomaly * (Math.PI / 180);
    const i = inclination * (Math.PI / 180);
    const omega = argumentOfPerihelion * (Math.PI / 180);
    const Omega = longitudeOfAscendingNode * (Math.PI / 180);

    // Solve for eccentric anomaly
    const E = solveKeplerEquation(M, eccentricity);

    // Calculate true anomaly
    const v = calculateTrueAnomaly(E, eccentricity);

    // Calculate orbital radius
    const r = calculateOrbitalRadius(semiMajorAxis, eccentricity, v);

    // Position in orbital plane
    const xOrbital = r * Math.cos(v);
    const yOrbital = r * Math.sin(v);

    // Rotate by argument of perihelion
    const x1 = xOrbital * Math.cos(omega) - yOrbital * Math.sin(omega);
    const y1 = xOrbital * Math.sin(omega) + yOrbital * Math.cos(omega);

    // Rotate by inclination
    const z2 = y1 * Math.sin(i);
    const y2 = y1 * Math.cos(i);

    // Rotate by longitude of ascending node
    const x = x1 * Math.cos(Omega) - y2 * Math.sin(Omega);
    const y = x1 * Math.sin(Omega) + y2 * Math.cos(Omega);
    const z = z2;

    return { x, y, z };
}

/**
 * Calculate mean anomaly at given time
 * @param {number} initialMeanAnomaly - Mean anomaly at epoch (degrees)
 * @param {number} orbitalPeriod - Orbital period (Earth days)
 * @param {number} elapsedDays - Days since epoch
 * @returns {number} Current mean anomaly (degrees)
 */
export function calculateMeanAnomalyAtTime(initialMeanAnomaly, orbitalPeriod, elapsedDays) {
    const meanMotion = 360 / orbitalPeriod; // degrees per day
    let M = initialMeanAnomaly + meanMotion * elapsedDays;

    // Normalize to 0-360
    M = M % 360;
    if (M < 0) M += 360;

    return M;
}

/**
 * Generate orbit path points for visualization
 * @param {Object} orbitalParams - Orbital parameters
 * @param {number} segments - Number of path segments
 * @returns {Array} Array of {x, y, z} points
 */
export function generateOrbitPath(orbitalParams, segments = 128) {
    const points = [];

    for (let i = 0; i <= segments; i++) {
        const meanAnomaly = (360 / segments) * i;
        const position = orbitalToCartesian({
            ...orbitalParams,
            meanAnomaly
        });
        points.push(position);
    }

    return points;
}

/**
 * Calculate orbital velocity at given position
 * Using vis-viva equation: v² = GM(2/r - 1/a)
 * @param {number} r - Current orbital radius (AU)
 * @param {number} a - Semi-major axis (AU)
 * @param {number} GM - Gravitational parameter (default: Sun's GM = 1 in AU³/day²)
 * @returns {number} Orbital velocity (AU/day)
 */
export function calculateOrbitalVelocity(r, a, GM = 0.0002959) {
    return Math.sqrt(GM * (2 / r - 1 / a));
}

/**
 * Calculate period from semi-major axis using Kepler's 3rd law
 * T² = a³ (in years and AU)
 * @param {number} a - Semi-major axis in AU
 * @returns {number} Orbital period in Earth days
 */
export function calculateOrbitalPeriod(a) {
    return Math.pow(a, 1.5) * 365.25;
}

export default {
    solveKeplerEquation,
    calculateTrueAnomaly,
    calculateOrbitalRadius,
    orbitalToCartesian,
    calculateMeanAnomalyAtTime,
    generateOrbitPath,
    calculateOrbitalVelocity,
    calculateOrbitalPeriod
};
