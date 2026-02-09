/**
 * Solar System Data - NASA-based astronomical parameters
 * All distances in AU (Astronomical Units), 1 AU = 149,597,870.7 km
 * All masses relative to Earth, radii relative to Earth
 */

// Scale factors for visualization
export const SCALE = {
    // 1 AU = this many Three.js units
    DISTANCE: 10,
    // Planet size multiplier (exaggerated for visibility)
    SIZE: 1.5,
    // Time scale: 1 second = this many Earth days
    TIME: 1,
    // Moon orbital speed reduction factor (smaller = slower moons)
    MOON_SPEED: 0.1
};

// Speed labels for UI
export const SPEED_LABELS = ['0.1x', '1x', '100x', '1000x', '10000x'];
export const SPEED_VALUES = [0.1, 1, 100, 1000, 10000];

// Sun data
export const SUN = {
    name: 'Sonne',
    nameEn: 'sun',
    radius: 109.2, // Earth radii
    mass: 333000, // Earth masses
    rotationPeriod: 25.38, // Earth days
    temperature: 5778, // Kelvin (surface)
    color: 0xffdd44,
    emissiveColor: 0xffaa00,
    description: 'Unser Zentralgestirn, ein Gelber Zwerg vom Spektraltyp G2V'
};

// Planet data with accurate orbital parameters
export const PLANETS = [
    {
        name: 'Merkur',
        nameEn: 'mercury',
        radius: 0.383,
        mass: 0.055,
        semiMajorAxis: 0.387, // AU
        eccentricity: 0.2056,
        inclination: 7.0, // degrees
        orbitalPeriod: 87.97, // Earth days
        rotationPeriod: 58.65, // Earth days
        axialTilt: 0.034, // degrees
        meanAnomaly: 174.796, // degrees at J2000
        color: 0x8c8c8c,
        description: 'Kleinster und sonnennächster Planet',
        moonCount: 0, // Actual confirmed moon count
        moons: []
    },
    {
        name: 'Venus',
        nameEn: 'venus',
        radius: 0.949,
        mass: 0.815,
        semiMajorAxis: 0.723,
        eccentricity: 0.0068,
        inclination: 3.39,
        orbitalPeriod: 224.7,
        rotationPeriod: -243.02, // Negative = retrograde rotation
        axialTilt: 177.4,
        meanAnomaly: 50.115,
        color: 0xe6c87a,
        description: 'Heißester Planet mit dichter Atmosphäre',
        moonCount: 0, // Actual confirmed moon count
        moons: []
    },
    {
        name: 'Erde',
        nameEn: 'earth',
        radius: 1.0,
        mass: 1.0,
        semiMajorAxis: 1.0,
        eccentricity: 0.0167,
        inclination: 0.0,
        orbitalPeriod: 365.25,
        rotationPeriod: 1.0,
        axialTilt: 23.44,
        meanAnomaly: 357.517,
        color: 0x6b93d6,
        description: 'Unser Heimatplanet, der einzige mit bekanntem Leben',
        hasAtmosphere: true,
        atmosphereColor: 0x88ccff,
        moonCount: 1, // Actual confirmed moon count
        moons: [
            {
                name: 'Mond',
                nameEn: 'moon',
                radius: 0.273,
                mass: 0.0123,
                semiMajorAxis: 0.00257, // AU from Earth
                eccentricity: 0.0549,
                inclination: 5.145,
                orbitalPeriod: 27.32,
                rotationPeriod: 27.32, // Tidally locked
                color: 0xb8b8b0, // Silvery gray with slight warmth
                description: 'Einziger natürlicher Begleiter der Erde'
            }
        ]
    },
    {
        name: 'Mars',
        nameEn: 'mars',
        radius: 0.532,
        mass: 0.107,
        semiMajorAxis: 1.524,
        eccentricity: 0.0934,
        inclination: 1.85,
        orbitalPeriod: 686.98,
        rotationPeriod: 1.026,
        axialTilt: 25.19,
        meanAnomaly: 19.373,
        color: 0xc1440e,
        description: 'Der Rote Planet mit dem höchsten Vulkan',
        moonCount: 2, // Actual confirmed moon count
        moons: [
            {
                name: 'Phobos',
                nameEn: 'phobos',
                radius: 0.00177,
                mass: 1.78e-9,
                semiMajorAxis: 0.0000628,
                eccentricity: 0.0151,
                inclination: 1.093,
                orbitalPeriod: 0.319,
                rotationPeriod: 0.319,
                color: 0x6b5a4e, // Reddish-brown (carbonaceous)
                description: 'Größerer der beiden Marsmonde'
            },
            {
                name: 'Deimos',
                nameEn: 'deimos',
                radius: 0.00098,
                mass: 2.44e-10,
                semiMajorAxis: 0.000157,
                eccentricity: 0.0002,
                inclination: 0.93,
                orbitalPeriod: 1.263,
                rotationPeriod: 1.263,
                color: 0x7a6b5a, // Slightly lighter reddish-brown
                description: 'Kleinerer der beiden Marsmonde'
            }
        ]
    },
    {
        name: 'Jupiter',
        nameEn: 'jupiter',
        radius: 11.21,
        mass: 317.8,
        semiMajorAxis: 5.203,
        eccentricity: 0.0489,
        inclination: 1.303,
        orbitalPeriod: 4332.59,
        rotationPeriod: 0.414,
        axialTilt: 3.13,
        meanAnomaly: 20.02,
        color: 0xd4a574,
        description: 'Größter Planet mit charakteristischem Großen Roten Fleck',
        moonCount: 95, // Actual confirmed moon count (as of 2024)
        moons: [
            {
                name: 'Io',
                nameEn: 'io',
                radius: 0.286,
                mass: 0.015,
                semiMajorAxis: 0.00282,
                eccentricity: 0.0041,
                inclination: 0.036,
                orbitalPeriod: 1.769,
                rotationPeriod: 1.769,
                color: 0xf5d742, // Sulfur yellow-orange (volcanic)
                description: 'Vulkanisch aktivster Körper im Sonnensystem'
            },
            {
                name: 'Europa',
                nameEn: 'europa',
                radius: 0.245,
                mass: 0.008,
                semiMajorAxis: 0.00449,
                eccentricity: 0.009,
                inclination: 0.466,
                orbitalPeriod: 3.551,
                rotationPeriod: 3.551,
                color: 0xc9d4dc, // Ice blue-white (frozen surface)
                description: 'Eismond mit möglichem unterirdischem Ozean'
            },
            {
                name: 'Ganymed',
                nameEn: 'ganymede',
                radius: 0.413,
                mass: 0.025,
                semiMajorAxis: 0.00716,
                eccentricity: 0.0013,
                inclination: 0.177,
                orbitalPeriod: 7.155,
                rotationPeriod: 7.155,
                color: 0x9a8b7a, // Gray-brown (mixed ice/rock)
                description: 'Größter Mond im Sonnensystem'
            },
            {
                name: 'Kallisto',
                nameEn: 'callisto',
                radius: 0.378,
                mass: 0.018,
                semiMajorAxis: 0.0126,
                eccentricity: 0.0074,
                inclination: 0.192,
                orbitalPeriod: 16.689,
                rotationPeriod: 16.689,
                color: 0x4a4238, // Dark brown (heavily cratered)
                description: 'Stark verkraterter äußerer Galileischer Mond'
            }
        ]
    },
    {
        name: 'Saturn',
        nameEn: 'saturn',
        radius: 9.45,
        mass: 95.16,
        semiMajorAxis: 9.537,
        eccentricity: 0.0565,
        inclination: 2.485,
        orbitalPeriod: 10759.22,
        rotationPeriod: 0.444,
        axialTilt: 26.73,
        meanAnomaly: 317.02,
        color: 0xead6b8,
        description: 'Ringplanet mit ausgeprägtem Ringsystem',
        hasRings: true,
        ringInnerRadius: 1.2,
        ringOuterRadius: 2.3,
        ringColor: 0xc4a882,
        moonCount: 146, // Actual confirmed moon count (as of 2024)
        moons: [
            {
                name: 'Mimas',
                nameEn: 'mimas',
                radius: 0.031,
                mass: 6.3e-6,
                semiMajorAxis: 0.00124,
                eccentricity: 0.0196,
                inclination: 1.574,
                orbitalPeriod: 0.942,
                rotationPeriod: 0.942,
                color: 0xd8d8d8, // Light gray (icy surface)
                description: 'Todesstern-ähnlicher Krater Herschel'
            },
            {
                name: 'Enceladus',
                nameEn: 'enceladus',
                radius: 0.04,
                mass: 1.8e-5,
                semiMajorAxis: 0.00159,
                eccentricity: 0.0047,
                inclination: 0.019,
                orbitalPeriod: 1.37,
                rotationPeriod: 1.37,
                color: 0xf0f5ff, // Brilliant white-blue (most reflective body)
                description: 'Eisgeysire am Südpol'
            },
            {
                name: 'Tethys',
                nameEn: 'tethys',
                radius: 0.083,
                mass: 1.03e-4,
                semiMajorAxis: 0.00197,
                eccentricity: 0.0001,
                inclination: 1.12,
                orbitalPeriod: 1.888,
                rotationPeriod: 1.888,
                color: 0xe0e0e0,
                description: 'Ithaca Chasma durchzieht den Mond'
            },
            {
                name: 'Dione',
                nameEn: 'dione',
                radius: 0.088,
                mass: 1.83e-4,
                semiMajorAxis: 0.00252,
                eccentricity: 0.0022,
                inclination: 0.019,
                orbitalPeriod: 2.737,
                rotationPeriod: 2.737,
                color: 0xd0d0d0,
                description: 'Eisiger Saturnmond'
            },
            {
                name: 'Rhea',
                nameEn: 'rhea',
                radius: 0.12,
                mass: 3.87e-4,
                semiMajorAxis: 0.00352,
                eccentricity: 0.0012,
                inclination: 0.345,
                orbitalPeriod: 4.518,
                rotationPeriod: 4.518,
                color: 0xc8c8c8,
                description: 'Zweitgrößter Saturnmond'
            },
            {
                name: 'Titan',
                nameEn: 'titan',
                radius: 0.404,
                mass: 0.0225,
                semiMajorAxis: 0.00817,
                eccentricity: 0.0288,
                inclination: 0.348,
                orbitalPeriod: 15.945,
                rotationPeriod: 15.945,
                color: 0xe8a832, // Orange-gold (thick atmosphere haze)
                description: 'Einziger Mond mit dichter Atmosphäre'
            },
            {
                name: 'Iapetus',
                nameEn: 'iapetus',
                radius: 0.115,
                mass: 3.02e-4,
                semiMajorAxis: 0.0238,
                eccentricity: 0.0286,
                inclination: 15.47,
                orbitalPeriod: 79.33,
                rotationPeriod: 79.33,
                color: 0x8b7355, // Brown-tan (dark leading hemisphere)
                description: 'Yin-Yang-Mond mit zwei verschiedenen Hemisphären'
            }
        ]
    },
    {
        name: 'Uranus',
        nameEn: 'uranus',
        radius: 4.01,
        mass: 14.54,
        semiMajorAxis: 19.19,
        eccentricity: 0.0457,
        inclination: 0.772,
        orbitalPeriod: 30688.5,
        rotationPeriod: -0.718, // Retrograde
        axialTilt: 97.77,
        meanAnomaly: 142.238,
        color: 0x73d6e6,
        description: 'Eisriese mit extremer Achsenneigung',
        hasRings: true,
        ringInnerRadius: 1.5,
        ringOuterRadius: 2.0,
        ringColor: 0x555555,
        moonCount: 28, // Actual confirmed moon count (as of 2024)
        moons: [
            {
                name: 'Miranda',
                nameEn: 'miranda',
                radius: 0.037,
                mass: 1.1e-5,
                semiMajorAxis: 0.000868,
                eccentricity: 0.0013,
                inclination: 4.338,
                orbitalPeriod: 1.413,
                rotationPeriod: 1.413,
                color: 0x8c8c8c, // Cratered gray with varied terrain
                description: 'Kleinster der großen Uranusmonde mit chaotischer Oberfläche'
            },
            {
                name: 'Ariel',
                nameEn: 'ariel',
                radius: 0.091,
                mass: 2.26e-4,
                semiMajorAxis: 0.00128,
                eccentricity: 0.0012,
                inclination: 0.26,
                orbitalPeriod: 2.52,
                rotationPeriod: 2.52,
                color: 0xd8dce0, // Bright icy white-gray (youngest surface)
                description: 'Hellster Uranusmond mit Eisoberfläche'
            },
            {
                name: 'Umbriel',
                nameEn: 'umbriel',
                radius: 0.092,
                mass: 2.0e-4,
                semiMajorAxis: 0.00178,
                eccentricity: 0.0039,
                inclination: 0.128,
                orbitalPeriod: 4.144,
                rotationPeriod: 4.144,
                color: 0x505050, // Very dark gray (darkest major moon)
                description: 'Dunkelster der großen Uranusmonde'
            },
            {
                name: 'Titania',
                nameEn: 'titania',
                radius: 0.124,
                mass: 5.9e-4,
                semiMajorAxis: 0.00292,
                eccentricity: 0.0011,
                inclination: 0.34,
                orbitalPeriod: 8.706,
                rotationPeriod: 8.706,
                color: 0xa8a0a0, // Grayish with slight reddish tint
                description: 'Größter Uranusmond mit Canyons'
            },
            {
                name: 'Oberon',
                nameEn: 'oberon',
                radius: 0.119,
                mass: 5.05e-4,
                semiMajorAxis: 0.0039,
                eccentricity: 0.0014,
                inclination: 0.058,
                orbitalPeriod: 13.463,
                rotationPeriod: 13.463,
                color: 0x8b7a70, // Reddish-brown tinted gray, heavily cratered
                description: 'Äußerster der großen Uranusmonde, stark verkratert'
            }
        ]
    },
    {
        name: 'Neptun',
        nameEn: 'neptune',
        radius: 3.88,
        mass: 17.15,
        semiMajorAxis: 30.07,
        eccentricity: 0.0113,
        inclination: 1.77,
        orbitalPeriod: 60182,
        rotationPeriod: 0.671,
        axialTilt: 28.32,
        meanAnomaly: 256.228,
        color: 0x3f54ba,
        description: 'Fernster Planet mit den stärksten Winden',
        moonCount: 16, // Actual confirmed moon count (as of 2024)
        moons: [
            {
                name: 'Triton',
                nameEn: 'triton',
                radius: 0.212,
                mass: 0.00358,
                semiMajorAxis: 0.00237,
                eccentricity: 0.000016,
                inclination: 156.865, // Retrograde orbit
                orbitalPeriod: -5.877, // Retrograde
                rotationPeriod: 5.877,
                color: 0xdec8b8, // Pinkish-tan (nitrogen ice with tholins)
                description: 'Größter Neptunmond mit retrograder Umlaufbahn'
            },
            {
                name: 'Proteus',
                nameEn: 'proteus',
                radius: 0.033,
                mass: 7.0e-6,
                semiMajorAxis: 0.000786, // Much closer than Nereid
                eccentricity: 0.00053,
                inclination: 0.524,
                orbitalPeriod: 1.122,
                rotationPeriod: 1.122,
                color: 0x6a6a6a, // Dark gray, irregular shaped
                description: 'Zweitgrößter Neptunmond, unregelmäßig geformt'
            },
            {
                name: 'Nereid',
                nameEn: 'nereid',
                radius: 0.027,
                mass: 5.1e-6,
                semiMajorAxis: 0.005, // Scaled down for visibility (real: 0.0368 AU)
                eccentricity: 0.4, // Reduced from 0.7512 for visibility
                inclination: 7.232,
                orbitalPeriod: 360.14,
                rotationPeriod: 0.48,
                color: 0x9a9a9a, // Neutral gray
                description: 'Mond mit elliptischer Umlaufbahn (Orbit skaliert)'
            }
        ]
    }
];

// Helper function to get planet by English name
export function getPlanetByName(nameEn) {
    return PLANETS.find(p => p.nameEn === nameEn);
}

// Get all celestial bodies (for raycasting)
export function getAllBodies() {
    const bodies = [{ ...SUN, isSun: true }];
    PLANETS.forEach(planet => {
        bodies.push({ ...planet, isPlanet: true });
        planet.moons.forEach(moon => {
            bodies.push({ ...moon, isMoon: true, parentPlanet: planet.nameEn });
        });
    });
    return bodies;
}

// Format numbers with German locale
export function formatNumber(num, decimals = 2) {
    return num.toLocaleString('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format large numbers in scientific notation
export function formatScientific(num) {
    if (num >= 1000 || num <= 0.01) {
        const exp = Math.floor(Math.log10(Math.abs(num)));
        const mantissa = num / Math.pow(10, exp);
        return `${formatNumber(mantissa)} × 10${toSuperscript(exp)}`;
    }
    return formatNumber(num);
}

// Convert number to superscript
function toSuperscript(num) {
    const superscripts = {
        '-': '⁻',
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return String(num).split('').map(c => superscripts[c] || c).join('');
}
