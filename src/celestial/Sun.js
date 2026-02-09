/**
 * Sun - Central star with glow effect
 */

import * as THREE from 'three';
import { SUN, SCALE } from '../data/solarSystemData.js';

export class Sun {
    constructor(textureLoader) {
        this.data = SUN;
        this.textureLoader = textureLoader;

        this.group = new THREE.Group();
        this.mesh = null;
        this.glowMesh = null;
        this.coronaMesh = null;
        this.pointLight = null;

        this.group.name = 'sun';
        this.group.userData.bodyData = { ...SUN, isSun: true };
        this.group.userData.clickable = true;
    }

    async create() {
        await this.createMesh();
        this.createGlow();
        this.createCorona();
        this.createLight();
    }

    async createMesh() {
        // Sun is much larger, but we scale it down for visibility
        const radius = 5; // Fixed size for visibility (larger for better proportions)
        const geometry = new THREE.SphereGeometry(radius, 64, 32);

        // Try to load sun texture
        let material;
        try {
            const texture = await this.loadTexture('sun.jpg');
            material = new THREE.MeshBasicMaterial({
                map: texture,
                emissive: new THREE.Color(SUN.emissiveColor),
                emissiveIntensity: 0.5
            });
        } catch (e) {
            // Fallback to emissive material
            material = new THREE.MeshBasicMaterial({
                color: SUN.color,
                emissive: new THREE.Color(SUN.emissiveColor),
                emissiveIntensity: 1
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData.bodyData = this.data;
        this.mesh.userData.clickable = true;
        this.group.add(this.mesh);
    }

    loadTexture(filename) {
        return new Promise((resolve, reject) => {
            // Try multiple paths
            const paths = [
                `/textures/${filename}`,
                `textures/${filename}`,
                `./textures/${filename}`
            ];

            let attemptIndex = 0;

            const tryLoad = () => {
                if (attemptIndex >= paths.length) {
                    console.warn(`Failed to load sun texture: ${filename}`);
                    reject(new Error(`Texture not found: ${filename}`));
                    return;
                }

                this.textureLoader.load(
                    paths[attemptIndex],
                    (texture) => {
                        console.log(`✓ Loaded sun texture from ${paths[attemptIndex]}`);
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
     * Create outer glow effect
     */
    createGlow() {
        const glowGeometry = new THREE.SphereGeometry(3.5, 32, 16);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xffdd44) },
                viewVector: { value: new THREE.Vector3() }
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
                uniform vec3 glowColor;
                varying vec3 vNormal;
                varying vec3 vPositionNormal;
                
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vPositionNormal), 2.0);
                    gl_FragColor = vec4(glowColor, intensity * 0.8);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.group.add(this.glowMesh);
    }

    /**
     * Create corona effect (extended glow)
     */
    createCorona() {
        const coronaGeometry = new THREE.SphereGeometry(5, 32, 16);
        const coronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                coronaColor: { value: new THREE.Color(0xff8800) },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPositionNormal;
                varying vec2 vUv;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 coronaColor;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPositionNormal;
                varying vec2 vUv;
                
                void main() {
                    float intensity = pow(0.5 - dot(vNormal, vPositionNormal), 2.0);
                    
                    // Add subtle animation
                    float noise = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time) * 0.1;
                    intensity += noise;
                    
                    gl_FragColor = vec4(coronaColor, intensity * 0.4);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });

        this.coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.group.add(this.coronaMesh);
    }

    /**
     * Create point light for illuminating planets
     */
    createLight() {
        // Increased intensity for better planet visibility
        this.pointLight = new THREE.PointLight(0xffffee, 5, 2000);
        this.pointLight.castShadow = true;
        this.pointLight.shadow.mapSize.width = 2048;
        this.pointLight.shadow.mapSize.height = 2048;
        this.pointLight.shadow.camera.near = 0.1;
        this.pointLight.shadow.camera.far = 500;

        this.group.add(this.pointLight);
    }

    /**
     * Update animation
     */
    update(deltaTime, elapsedTime) {
        // Rotate sun
        if (this.mesh) {
            this.mesh.rotation.y += deltaTime * 0.02;
        }

        // Animate corona
        if (this.coronaMesh && this.coronaMesh.material.uniforms) {
            this.coronaMesh.material.uniforms.time.value = elapsedTime;
        }
    }

    /**
     * Get the group
     */
    getGroup() {
        return this.group;
    }

    /**
     * Get current position
     */
    getWorldPosition() {
        return new THREE.Vector3(0, 0, 0);
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.glowMesh) {
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }
        if (this.coronaMesh) {
            this.coronaMesh.geometry.dispose();
            this.coronaMesh.material.dispose();
        }
    }
}

export default Sun;
