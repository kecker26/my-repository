/**
 * Starfield - Procedurally Generated Star Background
 */

import * as THREE from 'three';

export class Starfield {
    constructor(starCount = 10000, radius = 500) {
        this.starCount = starCount;
        this.radius = radius;
        this.mesh = null;

        this.create();
    }

    create() {
        // Create geometry
        const geometry = new THREE.BufferGeometry();

        // Generate random star positions
        const positions = new Float32Array(this.starCount * 3);
        const colors = new Float32Array(this.starCount * 3);
        const sizes = new Float32Array(this.starCount);

        for (let i = 0; i < this.starCount; i++) {
            const i3 = i * 3;

            // Random position on sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = this.radius * (0.8 + Math.random() * 0.4);

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);

            // Star color - mostly white with some variation
            const colorVariation = Math.random();
            if (colorVariation < 0.1) {
                // Blue-ish stars
                colors[i3] = 0.7 + Math.random() * 0.3;
                colors[i3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i3 + 2] = 1;
            } else if (colorVariation < 0.2) {
                // Yellow-ish stars
                colors[i3] = 1;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 0.6 + Math.random() * 0.3;
            } else if (colorVariation < 0.25) {
                // Red giants
                colors[i3] = 1;
                colors[i3 + 1] = 0.6 + Math.random() * 0.2;
                colors[i3 + 2] = 0.4 + Math.random() * 0.2;
            } else {
                // White stars
                const brightness = 0.8 + Math.random() * 0.2;
                colors[i3] = brightness;
                colors[i3 + 1] = brightness;
                colors[i3 + 2] = brightness;
            }

            // Random sizes - most small, few larger
            const sizeRandom = Math.random();
            if (sizeRandom > 0.99) {
                sizes[i] = 3 + Math.random() * 2; // Bright stars
            } else if (sizeRandom > 0.9) {
                sizes[i] = 1.5 + Math.random() * 1.5;
            } else {
                sizes[i] = 0.5 + Math.random() * 1;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create shader material for points
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                varying float vSize;
                
                void main() {
                    vColor = color;
                    vSize = size;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vSize;
                
                void main() {
                    // Create circular point with soft edge
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // Soft falloff
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    // Add glow for larger stars
                    if (vSize > 2.0) {
                        alpha += (1.0 - smoothstep(0.0, 0.5, dist)) * 0.3;
                    }
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.mesh = new THREE.Points(geometry, material);
        this.mesh.name = 'starfield';
    }

    /**
     * Optional: Add subtle twinkling effect
     */
    update(time) {
        if (this.mesh && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value = time;
        }
    }

    /**
     * Get the mesh to add to scene
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}

export default Starfield;
