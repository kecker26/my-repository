/**
 * Planet - Planet class with moons, rings, and atmosphere support
 */

import * as THREE from 'three';
import { CelestialBody } from './CelestialBody.js';
import { Moon } from './Moon.js';
import { SCALE } from '../data/solarSystemData.js';

export class Planet extends CelestialBody {
    constructor(data, textureLoader) {
        super(data, textureLoader);

        this.moons = [];
        this.moonGroup = new THREE.Group();
        this.rings = null;
        this.atmosphere = null;
        this.moonOrbitLines = [];

        // Moon visibility threshold (camera distance)
        this.moonVisibilityThreshold = 30;
    }

    async create() {
        await this.createMesh();
        this.createOrbitLine();

        if (this.data.hasRings) {
            this.createRings();
        }

        if (this.data.hasAtmosphere) {
            this.createAtmosphere();
        }

        // Create moons
        if (this.data.moons && this.data.moons.length > 0) {
            await this.createMoons();
        }

        this.group.add(this.moonGroup);
    }

    /**
     * Override createMesh for planet-specific features
     */
    async createMesh() {
        const radius = this.getScaledRadius();
        const geometry = new THREE.SphereGeometry(radius, 64, 32);

        // Try to load texture
        let material;
        try {
            const texture = await this.loadTexture(`${this.data.nameEn}.jpg`);
            console.log(`✓ Loaded texture for ${this.data.name}`);

            material = new THREE.MeshLambertMaterial({
                map: texture,
                emissive: new THREE.Color(0x222222),
                emissiveIntensity: 0.3
            });
        } catch (e) {
            console.warn(`✗ Failed to load texture for ${this.data.name}, using color fallback`);
            // Fallback to color with emissive for visibility
            material = new THREE.MeshLambertMaterial({
                color: this.data.color || 0x888888,
                emissive: new THREE.Color(this.data.color || 0x888888),
                emissiveIntensity: 0.4
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
     * Create planetary rings (Saturn, Uranus)
     */
    createRings() {
        const innerRadius = this.getScaledRadius() * this.data.ringInnerRadius;
        const outerRadius = this.getScaledRadius() * this.data.ringOuterRadius;

        // Ring geometry
        const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);

        // Rotate UVs for radial texture mapping
        const pos = geometry.attributes.position;
        const uv = geometry.attributes.uv;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const len = Math.sqrt(x * x + y * y);

            uv.setXY(i, (len - innerRadius) / (outerRadius - innerRadius), 0.5);
        }

        // Ring material with transparency
        const material = new THREE.MeshBasicMaterial({
            color: this.data.ringColor || 0xccaa77,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });

        this.rings = new THREE.Mesh(geometry, material);
        this.rings.rotation.x = Math.PI / 2; // Rotate to lie flat

        // Apply ring tilt (same as planet)
        if (this.data.axialTilt) {
            this.rings.rotation.z = this.data.axialTilt * (Math.PI / 180);
        }

        this.group.add(this.rings);
    }

    /**
     * Create atmospheric glow (Earth)
     */
    createAtmosphere() {
        const radius = this.getScaledRadius() * 1.02;
        const geometry = new THREE.SphereGeometry(radius, 32, 16);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                atmosphereColor: { value: new THREE.Color(this.data.atmosphereColor || 0x88ccff) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPositionNormal;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 atmosphereColor;
                varying vec3 vNormal;
                varying vec3 vPositionNormal;
                
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vPositionNormal), 2.0);
                    gl_FragColor = vec4(atmosphereColor, intensity * 0.5);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });

        this.atmosphere = new THREE.Mesh(geometry, material);
        this.group.add(this.atmosphere);
    }

    /**
     * Create moon objects
     */
    async createMoons() {
        for (const moonData of this.data.moons) {
            const moon = new Moon(moonData, this, this.textureLoader);
            await moon.create();

            this.moons.push(moon);
            this.moonGroup.add(moon.getGroup());

            // Store orbit line
            const orbitLine = moon.getOrbitLine();
            if (orbitLine) {
                this.moonOrbitLines.push(orbitLine);
                this.moonGroup.add(orbitLine);
            }
        }
    }

    /**
     * Update planet and moons
     */
    update(elapsedDays, deltaTime, timeScale) {
        // Update planet position
        this.updatePosition(elapsedDays);

        // Update planet rotation
        this.updateRotation(deltaTime, timeScale);

        // Update ring rotation (subtle)
        if (this.rings) {
            this.rings.rotation.z += deltaTime * 0.001;
        }

        // Update moons
        for (const moon of this.moons) {
            moon.update(elapsedDays, deltaTime, timeScale);
        }
    }

    /**
     * Update moon visibility based on camera distance
     */
    updateMoonVisibility(cameraDistance, cameraPosition) {
        // Calculate distance from camera to planet
        const planetPos = this.getWorldPosition();
        const distToPlanet = cameraPosition.distanceTo(planetPos);

        // Moons become visible when camera is close to the planet
        // They should ALWAYS be visible when close, only fade at extreme distance
        const visible = distToPlanet < this.moonVisibilityThreshold;

        // Opacity: fully visible when close, fade out only at extreme distance
        // When closer than threshold, opacity is 1.0
        // When further than threshold, gradually fade out
        let opacity = 1.0;
        if (distToPlanet > this.moonVisibilityThreshold) {
            opacity = Math.max(0, 1 - ((distToPlanet - this.moonVisibilityThreshold) / this.moonVisibilityThreshold));
        }

        this.moonGroup.visible = visible || opacity > 0.1;

        // Update individual moon opacity for smooth transition
        // But never make moons invisible when very close!
        for (const moon of this.moons) {
            // When close to planet, moons are always fully visible
            moon.setOpacity(Math.max(0.3, opacity));
        }

        // Update orbit line visibility
        for (const orbitLine of this.moonOrbitLines) {
            orbitLine.visible = visible;
            if (orbitLine.material) {
                orbitLine.material.opacity = opacity * 0.3;
            }
        }
    }

    /**
     * Set all orbit lines visibility
     */
    setOrbitVisible(visible) {
        super.setOrbitVisible(visible);

        for (const orbitLine of this.moonOrbitLines) {
            orbitLine.visible = visible && this.moonGroup.visible;
        }
    }

    /**
     * Get all moons
     */
    getMoons() {
        return this.moons;
    }

    /**
     * Get moon orbit lines (for adding to scene)
     */
    getMoonOrbitLines() {
        return this.moonOrbitLines;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        super.dispose();

        if (this.rings) {
            this.rings.geometry.dispose();
            this.rings.material.dispose();
        }

        if (this.atmosphere) {
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }

        for (const moon of this.moons) {
            moon.dispose();
        }

        for (const orbitLine of this.moonOrbitLines) {
            orbitLine.geometry.dispose();
            orbitLine.material.dispose();
        }
    }
}

export default Planet;
