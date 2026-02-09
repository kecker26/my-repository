import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager.js';
import { Starfield } from '../scene/Starfield.js';
import { Sun } from '../celestial/Sun.js';
import { Planet } from '../celestial/Planet.js';
import { PLANETS, SPEED_VALUES } from '../data/solarSystemData.js';

export class SolarSystemEngine {
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas element is required for SolarSystemEngine');
        }

        this.canvas = canvas;
        this.sceneManager = null;
        this.textureLoader = new THREE.TextureLoader();
        this.loadingManager = new THREE.LoadingManager();

        this.sun = null;
        this.planets = [];
        this.starfield = null;
        this.orbitLinesGroup = new THREE.Group();

        this.elapsedDays = 0;
        this.timeScale = SPEED_VALUES[2];
        this.isPaused = false;
        this.selectedBody = null;
        this.followedBody = null;
        this.currentFocusName = 'Sonne';
        this.activeTarget = 'sun';
        this.labelsVisible = true;
        this.ready = false;

        this.focusedPlanet = null;
        this.planetFocusModeActive = false;
        this.focusModeThreshold = 8;
        this.simulationEpochMs = Date.UTC(2000, 0, 1, 0, 0, 0);
        this.animationFrameId = null;
        this.disposed = false;

        this.listeners = {
            loading: new Set(),
            state: new Set(),
            ready: new Set(),
            bodySelected: new Set(),
            error: new Set()
        };
    }

    on(eventName, callback) {
        const set = this.listeners[eventName];
        if (!set || typeof callback !== 'function') {
            return () => {};
        }

        set.add(callback);
        return () => {
            set.delete(callback);
        };
    }

    emit(eventName, payload) {
        const set = this.listeners[eventName];
        if (!set) return;
        set.forEach((callback) => {
            try {
                callback(payload);
            } catch (error) {
                console.error(`Listener error for "${eventName}":`, error);
            }
        });
    }

    async start() {
        if (this.ready || this.disposed) return;

        try {
            this.setupLoadingManager();
            await this.createScene();
            await this.createCelestialBodies();
            this.ready = true;
            this.emit('ready', { catalog: this.getBodyCatalog() });
            this.emitState();
            this.startAnimationLoop();
        } catch (error) {
            console.error('Error starting SolarSystemEngine:', error);
            this.emit('error', error);
        }
    }

    setupLoadingManager() {
        this.loadingManager.onProgress = (url, loaded, total) => {
            const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
            this.emit('loading', {
                status: `Lade Texturen... ${percent}%`,
                progress: percent
            });
        };

        this.loadingManager.onError = (url) => {
            console.warn(`Failed to load: ${url}`);
        };

        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    }

    async createScene() {
        this.sceneManager = new SceneManager(this.canvas);
        this.sceneManager.onObjectClick = (bodyData) => this.onBodyClick(bodyData);
        this.sceneManager.onZoomChange = () => this.emitState();
        this.sceneManager.onFollowStateChange = () => this.emitState();

        this.starfield = new Starfield(16000, 420);
        this.sceneManager.add(this.starfield.getMesh());
        this.sceneManager.add(this.orbitLinesGroup);
    }

    async createCelestialBodies() {
        this.emit('loading', { status: 'Erstelle Sonne...', progress: 0 });

        this.sun = new Sun(this.textureLoader);
        await this.sun.create();
        this.sceneManager.add(this.sun.getGroup());

        for (let i = 0; i < PLANETS.length; i++) {
            const planetData = PLANETS[i];
            this.emit('loading', {
                status: `Erstelle ${planetData.name}...`,
                progress: Math.round(((i + 1) / PLANETS.length) * 100)
            });

            const planet = new Planet(planetData, this.textureLoader);
            await planet.create();

            this.planets.push(planet);
            this.sceneManager.add(planet.getGroup());

            const orbitLine = planet.getOrbitLine();
            if (orbitLine) {
                this.orbitLinesGroup.add(orbitLine);
            }
        }

        this.updateAllPositions(0.016);
    }

    startAnimationLoop() {
        const tick = () => {
            if (this.disposed) return;

            this.animationFrameId = requestAnimationFrame(tick);
            const delta = this.sceneManager.update();

            if (!this.isPaused) {
                this.elapsedDays += delta * this.timeScale;
                this.updateAllPositions(delta);
                this.updateSun(delta);
            }

            if (this.starfield) {
                this.starfield.update(performance.now() * 0.00025);
            }

            this.updateMoonVisibility();
            this.updatePlanetFocusMode();
            this.emitState();
        };

        tick();
    }

    updateAllPositions(deltaTime = 0.016) {
        for (const planet of this.planets) {
            planet.update(this.elapsedDays, deltaTime, this.timeScale);
        }
    }

    updateSun(deltaTime) {
        if (this.sun) {
            this.sun.update(deltaTime, this.elapsedDays * 0.01);
        }
    }

    updateMoonVisibility() {
        if (!this.sceneManager) return;

        const cameraDistance = this.sceneManager.getCameraDistance();
        const cameraPosition = this.sceneManager.camera.position;

        for (const planet of this.planets) {
            planet.updateMoonVisibility(cameraDistance, cameraPosition);
        }
    }

    updatePlanetFocusMode() {
        if (!this.focusedPlanet) {
            if (this.planetFocusModeActive) {
                this.setAllBodiesVisible(true);
                this.planetFocusModeActive = false;
            }
            return;
        }

        const cameraPosition = this.sceneManager.camera.position;
        const planetPosition = this.focusedPlanet.getWorldPosition();
        const distanceToPlanet = cameraPosition.distanceTo(planetPosition);
        const shouldActivate = distanceToPlanet < this.focusModeThreshold;

        if (shouldActivate && !this.planetFocusModeActive) {
            this.planetFocusModeActive = true;
            this.setAllBodiesVisible(false);

            this.focusedPlanet.getGroup().visible = true;
            this.focusedPlanet.moonGroup.visible = true;
            for (const orbitLine of this.focusedPlanet.moonOrbitLines) {
                orbitLine.visible = true;
            }
        } else if (!shouldActivate && this.planetFocusModeActive) {
            this.planetFocusModeActive = false;
            this.setAllBodiesVisible(true);
        }
    }

    setAllBodiesVisible(visible) {
        if (this.sun) {
            this.sun.getGroup().visible = visible;
        }

        for (const planet of this.planets) {
            planet.getGroup().visible = visible;
        }

        this.orbitLinesGroup.visible = visible;
    }

    onBodyClick(bodyData) {
        if (!bodyData) return;

        if (bodyData.parentPlanet) {
            this.focusOnMoon(bodyData.parentPlanet, bodyData.nameEn);
        } else {
            this.focusOnBody(bodyData.nameEn);
        }
    }

    focusOnTarget(target) {
        if (!target) return;

        if (target.includes(':')) {
            const [planetNameEn, moonNameEn] = target.split(':');
            this.focusOnMoon(planetNameEn, moonNameEn);
        } else {
            this.focusOnBody(target);
        }
    }

    focusOnBody(nameEn) {
        let body = null;
        let focusDistance = 5;
        let bodyData = null;

        if (nameEn === 'sun') {
            body = this.sun;
            bodyData = this.sun?.getGroup().userData.bodyData;
            focusDistance = 16;
            this.focusedPlanet = null;
            this.activeTarget = 'sun';
        } else {
            const planet = this.planets.find((item) => item.data.nameEn === nameEn);
            if (planet) {
                body = planet;
                bodyData = planet.data;
                focusDistance = Math.max(5, planet.getScaledRadius() * 8);
                this.focusedPlanet = planet;
                this.activeTarget = nameEn;
            }
        }

        if (!body) return;

        this.followedBody = body;
        this.selectedBody = bodyData || null;
        this.currentFocusName = bodyData?.name || nameEn;

        if (this.sceneManager.isFollowLockEnabled()) {
            this.sceneManager.setFollowTarget(body, focusDistance);
        } else {
            this.sceneManager.clearFollowTarget();
        }

        this.sceneManager.focusOn(body.getWorldPosition(), focusDistance);
        this.emit('bodySelected', this.selectedBody);
        this.emitState();
    }

    focusOnMoon(planetNameEn, moonNameEn) {
        const planet = this.planets.find((item) => item.data.nameEn === planetNameEn);
        if (!planet) return;

        const moon = planet.getMoons().find((item) => item.data.nameEn === moonNameEn);
        if (!moon) return;

        this.followedBody = moon;
        this.focusedPlanet = planet;
        this.activeTarget = `${planetNameEn}:${moonNameEn}`;
        this.currentFocusName = moon.data.name || moonNameEn;
        this.selectedBody = moon.group.userData.bodyData;

        if (this.sceneManager.isFollowLockEnabled()) {
            this.sceneManager.setFollowTarget(moon, 1);
        } else {
            this.sceneManager.clearFollowTarget();
        }

        this.sceneManager.focusOn(moon.getWorldPosition(), 1);
        this.emit('bodySelected', this.selectedBody);
        this.emitState();
    }

    resetView() {
        this.followedBody = null;
        this.sceneManager.clearFollowTarget();

        this.focusedPlanet = null;
        this.planetFocusModeActive = false;
        this.setAllBodiesVisible(true);

        this.currentFocusName = 'Sonne';
        this.activeTarget = 'sun';
        this.sceneManager.resetView();
        this.emitState();
    }

    setTimeScale(scale) {
        this.timeScale = scale;
        this.emitState();
    }

    setPaused(paused) {
        this.isPaused = paused;
        this.emitState();
    }

    setOrbitVisibility(visible) {
        this.orbitLinesGroup.visible = visible;
        for (const planet of this.planets) {
            planet.setOrbitVisible(visible);
        }
        this.emitState();
    }

    setLabelVisibility(visible) {
        this.labelsVisible = visible;
        this.sceneManager.setHoverTooltipEnabled(visible);

        if (!visible) {
            const tooltip = document.getElementById('hover-tooltip');
            tooltip?.classList.add('hidden');
        }
        this.emitState();
    }

    setStarfieldVisibility(visible) {
        if (this.starfield?.getMesh()) {
            this.starfield.getMesh().visible = visible;
        }
        this.emitState();
    }

    setFollowLock(enabled) {
        this.sceneManager.setFollowLock(enabled);

        if (!enabled) {
            this.followedBody = null;
        } else if (this.followedBody) {
            if (this.followedBody === this.sun) {
                this.sceneManager.setFollowTarget(this.followedBody, 16);
            } else if (typeof this.followedBody.getScaledRadius === 'function') {
                this.sceneManager.setFollowTarget(
                    this.followedBody,
                    Math.max(5, this.followedBody.getScaledRadius() * 8)
                );
            } else {
                this.sceneManager.setFollowTarget(this.followedBody, 1);
            }
        }

        this.emitState();
    }

    setSimulationDate(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;

        const targetUtcMs = Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            0,
            0,
            0
        );

        this.elapsedDays = (targetUtcMs - this.simulationEpochMs) / (24 * 60 * 60 * 1000);
        this.updateAllPositions(0.016);
        this.emitState();
    }

    getSimulationDate() {
        return new Date(this.simulationEpochMs + this.elapsedDays * 24 * 60 * 60 * 1000);
    }

    getBodyCatalog() {
        const catalog = [{ target: 'sun', name: 'Sonne', type: 'sun' }];

        PLANETS.forEach((planet, index) => {
            const type = index <= 3 ? 'inner' : 'outer';
            catalog.push({
                target: planet.nameEn,
                name: planet.name,
                type
            });

            (planet.moons || []).forEach((moon) => {
                catalog.push({
                    target: `${planet.nameEn}:${moon.nameEn}`,
                    name: moon.name,
                    type: 'moon',
                    parent: planet.name
                });
            });
        });

        return catalog;
    }

    getSnapshot() {
        const cameraDistance = this.sceneManager?.getCameraDistance() ?? 0;
        return {
            ready: this.ready,
            elapsedDays: this.elapsedDays,
            simulationDate: this.getSimulationDate(),
            zoomDistance: cameraDistance,
            fps: this.sceneManager?.getFPS() ?? 60,
            focusName: this.currentFocusName,
            followLockEnabled: this.sceneManager?.isFollowLockEnabled() ?? true,
            isPaused: this.isPaused,
            timeScale: this.timeScale,
            activeTarget: this.activeTarget,
            selectedBody: this.selectedBody
        };
    }

    emitState() {
        this.emit('state', this.getSnapshot());
    }

    dispose() {
        this.disposed = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.listeners.loading.clear();
        this.listeners.state.clear();
        this.listeners.ready.clear();
        this.listeners.bodySelected.clear();
        this.listeners.error.clear();

        if (this.sceneManager) {
            this.sceneManager.dispose();
        }

        this.starfield?.dispose();
        this.sun?.dispose();
        this.planets.forEach((planet) => planet.dispose());
    }
}

export default SolarSystemEngine;
