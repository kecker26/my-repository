/**
 * SceneManager - Three.js Scene Setup and Management
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();

        // Callbacks
        this.onObjectClick = null;
        this.onZoomChange = null;

        // Follow target - celestial body to track
        this.followTarget = null;
        this.followDistance = 5;
        this.followLockEnabled = true;
        this.onFollowStateChange = null;

        // Performance tracking
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.fps = 60;
        this.hoverTooltipEnabled = true;

        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.setupEventListeners();
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000008);
    }

    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.001, 10000);
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // Configure controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;

        // SWAP MOUSE BUTTONS:
        // Left button (0) = PAN (2D movement)
        // Right button (2) = ROTATE
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };

        // Zoom limits - allow very close zoom for moons
        this.controls.minDistance = 0.05;
        this.controls.maxDistance = 500;

        // Rotation limits (optional - can look at system from any angle)
        this.controls.maxPolarAngle = Math.PI;

        // Pan settings - faster for better control
        this.controls.enablePan = true;
        this.controls.panSpeed = 1.5;

        // Zoom speed
        this.controls.zoomSpeed = 1.5;

        // Listen for zoom changes
        this.controls.addEventListener('change', () => {
            if (this.onZoomChange) {
                const distance = this.camera.position.length();
                this.onZoomChange(distance);
            }
        });
    }

    createLights() {
        // Ambient light for basic visibility - increased for planets
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Hemisphere light for more natural lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        this.scene.add(hemiLight);

        // Note: Sun's point light is added by the Sun class
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Mouse click for object selection
        this.canvas.addEventListener('click', (event) => this.onMouseClick(event));

        // Mouse move for hover effects
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));

        // Left mouse button down - if user tries to pan, break follow mode
        this.canvas.addEventListener('mousedown', (event) => {
            // Left mouse button (0) = pan action
            if (event.button === 0 && this.followTarget) {
                // User is trying to pan while following - break follow mode
                this.clearFollowTarget();
                console.log('Follow mode disabled - free navigation enabled');
            }
        });
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast to find intersected objects
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get only VISIBLE MESHES with clickable = true
        const clickableMeshes = [];
        this.scene.traverse((obj) => {
            if (obj.isMesh && obj.visible && obj.userData && obj.userData.clickable) {
                // Check if parent groups are also visible
                let parentVisible = true;
                let parent = obj.parent;
                while (parent) {
                    if (parent.visible === false) {
                        parentVisible = false;
                        break;
                    }
                    parent = parent.parent;
                }
                if (parentVisible) {
                    clickableMeshes.push(obj);
                }
            }
        });

        // Raycast without recursive (we already collected all meshes)
        const intersects = this.raycaster.intersectObjects(clickableMeshes, false);

        if (intersects.length > 0) {
            // Find the closest intersection with bodyData
            for (const intersection of intersects) {
                const obj = intersection.object;
                if (obj.userData && obj.userData.bodyData) {
                    console.log('Clicked on:', obj.userData.bodyData.name);
                    if (this.onObjectClick) {
                        this.onObjectClick(obj.userData.bodyData);
                    }
                    return; // Stop after first valid hit
                }
            }
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Store screen position for tooltip
        this.mouseScreenX = event.clientX;
        this.mouseScreenY = event.clientY;

        // Check for hover over celestial bodies
        this.checkHover();
    }

    checkHover() {
        const tooltip = document.getElementById('hover-tooltip');
        const canvas = this.canvas;

        if (!tooltip) {
            canvas.classList.remove('hovering');
            this.hoveredObject = null;
            return;
        }

        if (!this.hoverTooltipEnabled) {
            tooltip?.classList.add('hidden');
            canvas.classList.remove('hovering');
            this.hoveredObject = null;
            return;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get only visible meshes
        const clickableMeshes = [];
        this.scene.traverse((obj) => {
            if (obj.isMesh && obj.visible && obj.userData && obj.userData.clickable) {
                let parentVisible = true;
                let parent = obj.parent;
                while (parent) {
                    if (parent.visible === false) {
                        parentVisible = false;
                        break;
                    }
                    parent = parent.parent;
                }
                if (parentVisible) {
                    clickableMeshes.push(obj);
                }
            }
        });

        const intersects = this.raycaster.intersectObjects(clickableMeshes, false);

        if (intersects.length > 0) {
            // Find first object with bodyData
            for (const intersection of intersects) {
                const obj = intersection.object;
                if (obj.userData && obj.userData.bodyData) {
                    const bodyData = obj.userData.bodyData;

                    // Update tooltip content
                    let typeText = 'Planet';
                    if (bodyData.isSun) typeText = 'Stern';
                    else if (bodyData.isMoon) typeText = 'Mond';

                    tooltip.innerHTML = `
                        <div class="tooltip-type">${typeText}</div>
                        <div class="tooltip-name">${bodyData.name}</div>
                        <div class="tooltip-hint">Klicken zum Fokussieren</div>
                    `;

                    // Position tooltip
                    tooltip.style.left = this.mouseScreenX + 'px';
                    tooltip.style.top = this.mouseScreenY + 'px';
                    tooltip.classList.remove('hidden');

                    // Change cursor
                    canvas.classList.add('hovering');

                    // Store hovered object for potential highlight effects
                    this.hoveredObject = obj;
                    return;
                }
            }
        }

        // Hide tooltip if not hovering
        tooltip?.classList.add('hidden');
        canvas.classList.remove('hovering');
        this.hoveredObject = null;
    }

    /**
     * Smoothly focus camera on a target position
     */
    focusOn(target, distance = 5) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        const targetPosition = new THREE.Vector3();
        if (target instanceof THREE.Vector3) {
            targetPosition.copy(target);
        } else if (target.position) {
            targetPosition.copy(target.position);
        }

        // Calculate new camera position
        const direction = new THREE.Vector3()
            .subVectors(this.camera.position, this.controls.target)
            .normalize();
        const endPosition = targetPosition.clone().add(direction.multiplyScalar(distance));

        // Animate transition
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, endPosition, eased);

            // Interpolate controls target
            this.controls.target.lerpVectors(startTarget, targetPosition, eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Reset camera to default view
     */
    resetView() {
        this.focusOn(new THREE.Vector3(0, 0, 0), 100);
    }

    /**
     * Add object to scene
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * Remove object from scene
     */
    remove(object) {
        this.scene.remove(object);
    }

    /**
     * Update and render
     */
    update() {
        const delta = this.clock.getDelta();

        // Update follow target position
        this.updateFollowTarget();

        // Update controls
        this.controls.update();

        // Render scene
        this.renderer.render(this.scene, this.camera);

        // Track FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }

        return delta;
    }

    /**
     * Update camera to follow target - body stays EXACTLY centered
     */
    updateFollowTarget() {
        if (!this.followTarget) {
            // Ensure panning is enabled when not following
            if (!this.controls.enablePan) {
                this.controls.enablePan = true;
            }
            return;
        }

        // Get current position of the followed body
        const bodyPosition = this.followTarget.getWorldPosition();

        // Calculate current offset from camera to target (preserves zoom and rotation)
        const offset = new THREE.Vector3().subVectors(
            this.camera.position,
            this.controls.target
        );

        // Set controls target to body position (body stays exactly centered)
        this.controls.target.copy(bodyPosition);

        // Move camera to maintain the same relative view
        this.camera.position.copy(bodyPosition).add(offset);
    }

    /**
     * Set a target to follow (disables panning to keep body centered)
     */
    setFollowTarget(target, distance = 5) {
        if (!this.followLockEnabled) {
            this.followTarget = null;
            this.controls.enablePan = true;
            this.emitFollowState();
            return;
        }

        this.followTarget = target;
        this.followDistance = distance;

        // Disable panning while following - body must stay exactly centered
        this.controls.enablePan = false;
        this.emitFollowState();
    }

    /**
     * Stop following current target (re-enables panning)
     */
    clearFollowTarget() {
        this.followTarget = null;

        // Re-enable panning for free navigation
        this.controls.enablePan = true;
        this.emitFollowState();
    }

    /**
     * Enable or disable persistent follow behavior.
     */
    setFollowLock(enabled) {
        this.followLockEnabled = enabled;

        if (!enabled) {
            this.clearFollowTarget();
        } else {
            this.emitFollowState();
        }
    }

    /**
     * Whether follow lock is active.
     */
    isFollowLockEnabled() {
        return this.followLockEnabled;
    }

    /**
     * Get current camera distance from origin
     */
    getCameraDistance() {
        return this.camera.position.length();
    }

    /**
     * Current frames per second (refreshed once per second).
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Enable or disable hover tooltip rendering.
     */
    setHoverTooltipEnabled(enabled) {
        this.hoverTooltipEnabled = enabled;

        if (!enabled) {
            const tooltip = document.getElementById('hover-tooltip');
            tooltip?.classList.add('hidden');
            this.canvas.classList.remove('hovering');
            this.hoveredObject = null;
        }
    }

    /**
     * Emit follow-state updates for UI consumers.
     */
    emitFollowState() {
        if (typeof this.onFollowStateChange === 'function') {
            this.onFollowStateChange({
                followLockEnabled: this.followLockEnabled,
                following: !!this.followTarget
            });
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.controls.dispose();
        this.renderer.dispose();

        // Dispose of all geometries and materials
        this.scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }
}

export default SceneManager;
