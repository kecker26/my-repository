/**
 * Moon - Satellite orbiting a planet
 */

import * as THREE from 'three';
import { orbitalToCartesian, calculateMeanAnomalyAtTime } from '../physics/OrbitalMechanics.js';
import { SCALE } from '../data/solarSystemData.js';

export class Moon {
    constructor(data, parentPlanet, textureLoader) {
        this.data = data;
        this.parentPlanet = parentPlanet;
        this.textureLoader = textureLoader;

        this.group = new THREE.Group();
        this.mesh = null;
        this.orbitLine = null;

        // Current state
        this.currentMeanAnomaly = 0;
        this.opacity = 1;

        // Set name and click data
        this.group.name = data.nameEn;
        this.group.userData.bodyData = {
            ...data,
            isMoon: true,
            parentPlanet: parentPlanet.data.nameEn
        };
        this.group.userData.clickable = true;
    }

    async create() {
        await this.createMesh();
        this.createOrbitLine();
    }

    async createMesh() {
        // Moon radius scaling - make visible but proportional
        const radius = this.getScaledRadius();
        const geometry = new THREE.SphereGeometry(radius, 32, 16);

        // Try to load texture
        let material;
        try {
            const texture = await this.loadTexture(`${this.data.nameEn}.jpg`);
            console.log(`✓ Loaded moon texture for ${this.data.name}`);
            material = new THREE.MeshLambertMaterial({
                map: texture,
                emissive: new THREE.Color(0x222222),
                emissiveIntensity: 0.3
            });
        } catch (e) {
            // Fallback to color with emissive for visibility
            material = new THREE.MeshLambertMaterial({
                color: this.data.color || 0xaaaaaa,
                emissive: new THREE.Color(this.data.color || 0xaaaaaa),
                emissiveIntensity: 0.4
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.bodyData = this.group.userData.bodyData;
        this.mesh.userData.clickable = true;

        this.group.add(this.mesh);
    }

    loadTexture(filename) {
        return new Promise((resolve, reject) => {
            // Try multiple paths and extensions
            const baseName = filename.replace(/\.[^.]+$/, ''); // Remove extension
            const paths = [
                `textures/moons/${baseName}.jpg`,
                `textures/moons/${baseName}.png`,
                `textures/${baseName}.jpg`,
                `textures/${baseName}.png`,
                `/textures/moons/${baseName}.jpg`,
                `/textures/moons/${baseName}.png`,
                `/textures/${baseName}.jpg`,
                `/textures/${baseName}.png`
            ];

            let attemptIndex = 0;

            const tryLoad = () => {
                if (attemptIndex >= paths.length) {
                    reject(new Error(`Texture not found: ${filename}`));
                    return;
                }

                this.textureLoader.load(
                    paths[attemptIndex],
                    (texture) => {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        resolve(texture);
                    },
                    undefined,
                    () => {
                        attemptIndex++;
                        tryLoad();
                    }
                );
            };

            tryLoad();
        });
    }

    /**
     * Create orbit line around parent planet
     */
    createOrbitLine() {
        if (!this.data.semiMajorAxis) return;

        const points = [];
        const segments = 64;

        // Scale for moon orbits (must match update() scale)
        const orbitScale = SCALE.DISTANCE * 200;

        // Get parent radius for minimum orbit distance
        const parentRadius = this.parentPlanet ? this.parentPlanet.getScaledRadius() : 0.5;
        const minOrbitDistance = parentRadius * 2.5;

        for (let i = 0; i <= segments; i++) {
            const meanAnomaly = (360 / segments) * i;
            const position = orbitalToCartesian({
                semiMajorAxis: this.data.semiMajorAxis,
                eccentricity: this.data.eccentricity || 0,
                inclination: this.data.inclination || 0,
                meanAnomaly
            });

            let x = position.x * orbitScale;
            let y = position.z * orbitScale;
            let z = position.y * orbitScale;

            // Apply minimum orbit distance
            const currentDistance = Math.sqrt(x * x + y * y + z * z);
            if (currentDistance < minOrbitDistance && currentDistance > 0) {
                const scaleFactor = minOrbitDistance / currentDistance;
                x *= scaleFactor;
                y *= scaleFactor;
                z *= scaleFactor;
            }

            points.push(new THREE.Vector3(x, y, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });

        this.orbitLine = new THREE.Line(geometry, material);
        this.orbitLine.name = `${this.data.nameEn}_orbit`;
    }

    /**
     * Get scaled radius
     */
    getScaledRadius() {
        // Make moons visible but proportional
        // Larger base size and minimum for better visibility
        const baseSize = 0.6;
        return Math.max(this.data.radius * baseSize * SCALE.SIZE, 0.05);
    }

    /**
     * Update moon position and rotation
     */
    update(elapsedDays, deltaTime, timeScale) {
        if (!this.data.semiMajorAxis) return;

        // Apply moon speed reduction for better observation
        const adjustedElapsedDays = elapsedDays * (SCALE.MOON_SPEED || 1);

        // Calculate current mean anomaly
        const orbitalPeriod = Math.abs(this.data.orbitalPeriod);
        this.currentMeanAnomaly = calculateMeanAnomalyAtTime(
            0,
            orbitalPeriod,
            adjustedElapsedDays
        );

        // Retrograde orbit handling
        if (this.data.orbitalPeriod < 0) {
            this.currentMeanAnomaly = 360 - this.currentMeanAnomaly;
        }

        // Calculate position relative to planet
        const position = orbitalToCartesian({
            semiMajorAxis: this.data.semiMajorAxis,
            eccentricity: this.data.eccentricity || 0,
            inclination: this.data.inclination || 0,
            meanAnomaly: this.currentMeanAnomaly
        });

        // Scale and apply position (exaggerated for visibility)
        // Use higher scale for very close moons (like Mars' moons)
        const orbitScale = SCALE.DISTANCE * 200;

        // Calculate orbit distance from planet center
        let orbitX = position.x * orbitScale;
        let orbitY = position.z * orbitScale;
        let orbitZ = position.y * orbitScale;

        // Ensure minimum orbit distance from planet (prevents clipping)
        const parentRadius = this.parentPlanet ? this.parentPlanet.getScaledRadius() : 0.5;
        const minOrbitDistance = parentRadius * 2.5; // At least 2.5x planet radius
        const currentDistance = Math.sqrt(orbitX * orbitX + orbitY * orbitY + orbitZ * orbitZ);

        if (currentDistance < minOrbitDistance && currentDistance > 0) {
            const scaleFactor = minOrbitDistance / currentDistance;
            orbitX *= scaleFactor;
            orbitY *= scaleFactor;
            orbitZ *= scaleFactor;
        }

        this.group.position.set(orbitX, orbitY, orbitZ);

        // Update rotation (tidally locked moons face their planet)
        if (this.mesh && this.data.rotationPeriod) {
            // For tidally locked moons, rotation = orbital period
            const rotationSpeed = (2 * Math.PI) / (Math.abs(this.data.rotationPeriod) * 24 * 60 * 60);
            this.mesh.rotation.y += rotationSpeed * deltaTime * timeScale * 86400 * (SCALE.MOON_SPEED || 1);
        }
    }

    /**
     * Set opacity for fade in/out effect
     */
    setOpacity(opacity) {
        this.opacity = opacity;

        if (this.mesh && this.mesh.material) {
            // Only modify if we have transparency control
            this.mesh.material.transparent = opacity < 1;
            this.mesh.material.opacity = opacity;
        }
    }

    /**
     * Get the Three.js group
     */
    getGroup() {
        return this.group;
    }

    /**
     * Get orbit line
     */
    getOrbitLine() {
        return this.orbitLine;
    }

    /**
     * Get world position
     */
    getWorldPosition() {
        const pos = new THREE.Vector3();
        this.group.getWorldPosition(pos);
        return pos;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.material.map) {
                this.mesh.material.map.dispose();
            }
            this.mesh.material.dispose();
        }

        if (this.orbitLine) {
            this.orbitLine.geometry.dispose();
            this.orbitLine.material.dispose();
        }
    }
}

export default Moon;
