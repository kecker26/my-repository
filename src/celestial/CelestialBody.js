/**
 * CelestialBody - Base class for all celestial bodies
 */

import * as THREE from 'three';
import { orbitalToCartesian, calculateMeanAnomalyAtTime } from '../physics/OrbitalMechanics.js';
import { SCALE } from '../data/solarSystemData.js';

export class CelestialBody {
    constructor(data, textureLoader) {
        this.data = data;
        this.textureLoader = textureLoader;

        // Three.js objects
        this.group = new THREE.Group();
        this.mesh = null;
        this.orbitLine = null;
        this.label = null;

        // State
        this.currentMeanAnomaly = data.meanAnomaly || 0;
        this.rotation = 0;
        this.visible = true;
        this.orbitVisible = true;

        // Set name for identification
        this.group.name = data.nameEn;
        this.group.userData.bodyData = data;
        this.group.userData.clickable = true;
    }

    /**
     * Create the mesh for this body
     * Override in subclasses for custom appearance
     */
    async createMesh() {
        const radius = this.getScaledRadius();
        const geometry = new THREE.SphereGeometry(radius, 64, 32);

        // Try to load texture, fallback to color
        let material;
        try {
            const texture = await this.loadTexture(`${this.data.nameEn}.jpg`);
            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.8,
                metalness: 0.1
            });
        } catch (e) {
            // Fallback to basic color
            material = new THREE.MeshStandardMaterial({
                color: this.data.color || 0x888888,
                roughness: 0.8,
                metalness: 0.1
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.bodyData = this.data;
        this.mesh.userData.clickable = true;

        // Apply axial tilt
        if (this.data.axialTilt) {
            this.mesh.rotation.z = this.data.axialTilt * (Math.PI / 180);
        }

        this.group.add(this.mesh);
    }

    /**
     * Load a texture with error handling
     */
    loadTexture(filename) {
        return new Promise((resolve, reject) => {
            // Try multiple texture sources
            const paths = [
                `textures/${filename}`,
                `/textures/${filename}`,
                `./textures/${filename}`
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
     * Create orbit visualization line
     */
    createOrbitLine() {
        if (!this.data.semiMajorAxis) return;

        const points = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const meanAnomaly = (360 / segments) * i;
            const position = orbitalToCartesian({
                semiMajorAxis: this.data.semiMajorAxis,
                eccentricity: this.data.eccentricity || 0,
                inclination: this.data.inclination || 0,
                meanAnomaly
            });

            points.push(new THREE.Vector3(
                position.x * SCALE.DISTANCE,
                position.z * SCALE.DISTANCE, // Y-up coordinate system
                position.y * SCALE.DISTANCE
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.data.color || 0x444444,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });

        this.orbitLine = new THREE.Line(geometry, material);
        this.orbitLine.name = `${this.data.nameEn}_orbit`;
    }

    /**
     * Get orbit line (to be added to scene separately)
     */
    getOrbitLine() {
        return this.orbitLine;
    }

    /**
     * Update position based on orbital mechanics
     */
    updatePosition(elapsedDays) {
        if (!this.data.semiMajorAxis) return;

        // Calculate current mean anomaly
        this.currentMeanAnomaly = calculateMeanAnomalyAtTime(
            this.data.meanAnomaly || 0,
            this.data.orbitalPeriod,
            elapsedDays
        );

        // Calculate position
        const position = orbitalToCartesian({
            semiMajorAxis: this.data.semiMajorAxis,
            eccentricity: this.data.eccentricity || 0,
            inclination: this.data.inclination || 0,
            meanAnomaly: this.currentMeanAnomaly
        });

        // Apply scale and convert coordinate system (Y-up)
        this.group.position.set(
            position.x * SCALE.DISTANCE,
            position.z * SCALE.DISTANCE,
            position.y * SCALE.DISTANCE
        );
    }

    /**
     * Update rotation
     */
    updateRotation(deltaTime, timeScale) {
        if (!this.mesh || !this.data.rotationPeriod) return;

        // Calculate rotation speed (radians per real second)
        const rotationSpeed = (2 * Math.PI) / (this.data.rotationPeriod * 24 * 60 * 60);

        // Apply rotation with time scale
        const rotationDelta = rotationSpeed * deltaTime * timeScale * 86400; // Convert to days
        this.mesh.rotation.y += rotationDelta;
    }

    /**
     * Get scaled radius for visualization
     */
    getScaledRadius() {
        // Base earth radius for scaling
        const baseRadius = 0.2;
        return Math.max(this.data.radius * baseRadius * SCALE.SIZE, 0.02);
    }

    /**
     * Set visibility
     */
    setVisible(visible) {
        this.visible = visible;
        this.group.visible = visible;
    }

    /**
     * Set orbit line visibility
     */
    setOrbitVisible(visible) {
        this.orbitVisible = visible;
        if (this.orbitLine) {
            this.orbitLine.visible = visible;
        }
    }

    /**
     * Get the Three.js group
     */
    getGroup() {
        return this.group;
    }

    /**
     * Get current world position
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

export default CelestialBody;
