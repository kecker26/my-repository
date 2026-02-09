import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SPEED_LABELS, SPEED_VALUES } from '../data/solarSystemData.js';
import { SolarSystemEngine } from '../engine/SolarSystemEngine.js';
import { useUIStore } from './store/useUIStore.js';

const EARTH_RADIUS_KM = 6371;
const EARTH_MASS_KG = 5.972e24;

function formatNumber(num, decimals = 2) {
    if (!Number.isFinite(num)) return '-';
    return num.toLocaleString('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatMass(valueKg) {
    if (!Number.isFinite(valueKg)) return '-';
    if (valueKg < 1000000) return `${formatNumber(valueKg, 0)} kg`;

    const exp = valueKg.toExponential(2);
    const [mantissa, exponent] = exp.split('e');
    return `${mantissa} x 10^${Number.parseInt(exponent, 10)} kg`;
}

function getBodyTypeLabel(body, catalog) {
    if (!body) return 'Planet';
    if (body.isSun) return 'Stern';
    if (body.isMoon) {
        if (!body.parentPlanet) return 'Mond';
        const parentEntry = catalog.find((entry) => entry.target === body.parentPlanet);
        return parentEntry ? `Mond von ${parentEntry.name}` : 'Mond';
    }
    return 'Planet';
}

function ratioToBarWidth(ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0) return 4;
    if (ratio >= 1) return Math.min(100, 18 + Math.log10(ratio + 1) * 28);
    return Math.max(4, ratio * 60);
}

function formatRatio(ratio) {
    if (!Number.isFinite(ratio)) return '-';
    if (ratio >= 1000) return ratio.toExponential(2);
    if (ratio >= 10) return ratio.toFixed(1);
    return ratio.toFixed(2);
}

function toggleFullscreen(showToast) {
    return (async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                showToast('Fullscreen aktiv');
            } else {
                await document.exitFullscreen();
                showToast('Fullscreen beendet');
            }
        } catch (error) {
            showToast('Fullscreen nicht verfuegbar');
            console.warn('Fullscreen error:', error);
        }
    })();
}

export function App() {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const autoTourIndexRef = useRef(-1);
    const toastTimerRef = useRef(null);
    const dateInputFocusedRef = useRef(false);

    const [collapsedSections, setCollapsedSections] = useState({
        time: false,
        explorer: false,
        view: false,
        tour: false
    });

    const {
        loading,
        loadingStatus,
        errorMessage,
        dateLabel,
        dateInputValue,
        zoomLabel,
        fps,
        focusName,
        followLock,
        isPaused,
        speedIndex,
        activeTarget,
        selectedBody,
        showOrbits,
        showLabels,
        showStarfield,
        cinematicMode,
        searchTerm,
        bodyFilter,
        catalog,
        infoOpen,
        helpOpen,
        autoTourActive,
        autoTourDelaySec,
        toastMessage,
        syncFromEngine,
        setLoadingStatus,
        setErrorMessage,
        setCatalog,
        setSelectedBody,
        closeInfo,
        setSpeedIndex,
        setPaused,
        setFollowLock,
        setShowOrbits,
        setShowLabels,
        setShowStarfield,
        setCinematicMode,
        setSearchTerm,
        setBodyFilter,
        setHelpOpen,
        setAutoTourActive,
        setAutoTourDelaySec,
        setToastMessage
    } = useUIStore();

    const [dateDraft, setDateDraft] = useState(dateInputValue);

    const showToast = useCallback((message) => {
        setToastMessage(message);
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = setTimeout(() => {
            setToastMessage('');
        }, 1800);
    }, [setToastMessage]);

    useEffect(() => {
        if (dateInputFocusedRef.current) return;
        setDateDraft(dateInputValue);
    }, [dateInputValue]);

    useEffect(() => {
        if (!canvasRef.current || engineRef.current) return undefined;

        const engine = new SolarSystemEngine(canvasRef.current);
        engineRef.current = engine;

        const offState = engine.on('state', (snapshot) => {
            syncFromEngine(snapshot);
        });

        const offLoading = engine.on('loading', ({ status }) => {
            setLoadingStatus(status);
        });

        const offReady = engine.on('ready', ({ catalog: bodyCatalog }) => {
            setCatalog(bodyCatalog);
            setLoadingStatus('Szene bereit');
        });

        const offBody = engine.on('bodySelected', (body) => {
            setSelectedBody(body);
        });

        const offError = engine.on('error', (error) => {
            setErrorMessage(error?.message || String(error));
        });

        engine.start();

        return () => {
            offState();
            offLoading();
            offReady();
            offBody();
            offError();
            engine.dispose();
            engineRef.current = null;
        };
    }, [setCatalog, setErrorMessage, setLoadingStatus, setSelectedBody, syncFromEngine]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const targetTag = event.target?.tagName || '';
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag);
            if (isTyping && event.key !== 'Escape') return;

            const engine = engineRef.current;
            if (!engine) return;
            const state = useUIStore.getState();

            switch (event.key.toLowerCase()) {
                case ' ':
                    event.preventDefault();
                    {
                        const paused = !state.isPaused;
                        setPaused(paused);
                        engine.setPaused(paused);
                        showToast(paused ? 'Simulation pausiert' : 'Simulation laeuft');
                    }
                    break;
                case 'r':
                    engine.resetView();
                    showToast('Ansicht zurueckgesetzt');
                    break;
                case 'o':
                    {
                        const next = !state.showOrbits;
                        setShowOrbits(next);
                        engine.setOrbitVisibility(next);
                        showToast(`Orbitlinien ${next ? 'an' : 'aus'}`);
                    }
                    break;
                case 'f':
                    toggleFullscreen(showToast);
                    break;
                case 't':
                    setAutoTourActive(!state.autoTourActive);
                    break;
                case 'c':
                    setCinematicMode(!state.cinematicMode);
                    showToast(!state.cinematicMode ? 'Cinematic Mode an' : 'Cinematic Mode aus');
                    break;
                case 'h':
                case '?':
                    setHelpOpen(!state.helpOpen);
                    break;
                case '=':
                case '+':
                    event.preventDefault();
                    {
                        const next = Math.max(0, Math.min(SPEED_VALUES.length - 1, state.speedIndex + 1));
                        setSpeedIndex(next);
                        engine.setTimeScale(SPEED_VALUES[next]);
                        showToast(`Geschwindigkeit ${SPEED_LABELS[next]}`);
                    }
                    break;
                case '-':
                case '_':
                    event.preventDefault();
                    {
                        const next = Math.max(0, Math.min(SPEED_VALUES.length - 1, state.speedIndex - 1));
                        setSpeedIndex(next);
                        engine.setTimeScale(SPEED_VALUES[next]);
                        showToast(`Geschwindigkeit ${SPEED_LABELS[next]}`);
                    }
                    break;
                case 'g':
                    {
                        const candidates = state.catalog.filter((entry) => {
                            if (state.bodyFilter === 'inner' && entry.type !== 'inner') return false;
                            if (state.bodyFilter === 'outer' && entry.type !== 'outer') return false;
                            if (state.bodyFilter === 'moons' && entry.type !== 'moon') return false;

                            const q = state.searchTerm.trim().toLowerCase();
                            if (!q) return true;

                            const haystack = [entry.name, entry.target, entry.parent]
                                .filter(Boolean)
                                .join(' ')
                                .toLowerCase();
                            return haystack.includes(q);
                        });

                        if (candidates.length > 0) {
                            const random = candidates[Math.floor(Math.random() * candidates.length)];
                            if (state.autoTourActive) {
                                setAutoTourActive(false);
                            }
                            engine.focusOnTarget(random.target);
                            showToast(`Fokus: ${random.name || random.target}`);
                        }
                    }
                    break;
                case 'escape':
                    setHelpOpen(false);
                    break;
                default:
                    if (/^[0-9]$/.test(event.key)) {
                        const number = Number.parseInt(event.key, 10);
                        if (number === 0) {
                            if (state.autoTourActive) {
                                setAutoTourActive(false);
                            }
                            engine.focusOnTarget('sun');
                        } else {
                            const planets = state.catalog.filter((entry) => entry.type === 'inner' || entry.type === 'outer');
                            const planet = planets[number - 1];
                            if (planet) {
                                if (state.autoTourActive) {
                                    setAutoTourActive(false);
                                }
                                engine.focusOnTarget(planet.target);
                            }
                        }
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setAutoTourActive, setCinematicMode, setHelpOpen, setPaused, setShowOrbits, showToast]);

    useEffect(() => {
        if (!autoTourActive) return undefined;
        const engine = engineRef.current;
        if (!engine) return undefined;

        const targets = catalog.filter((entry) => entry.type !== 'moon').map((entry) => entry.target);
        if (targets.length === 0) {
            setAutoTourActive(false);
            return undefined;
        }

        const advance = () => {
            autoTourIndexRef.current = (autoTourIndexRef.current + 1) % targets.length;
            engine.focusOnTarget(targets[autoTourIndexRef.current]);
        };

        advance();
        showToast('Auto Tour gestartet');

        const intervalId = setInterval(() => {
            advance();
        }, Math.max(4, autoTourDelaySec) * 1000);

        return () => {
            clearInterval(intervalId);
            autoTourIndexRef.current = -1;
            showToast('Auto Tour beendet');
        };
    }, [autoTourActive, autoTourDelaySec, catalog, setAutoTourActive, showToast]);

    const filteredCatalog = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return catalog.filter((entry) => {
            if (bodyFilter === 'inner' && entry.type !== 'inner') return false;
            if (bodyFilter === 'outer' && entry.type !== 'outer') return false;
            if (bodyFilter === 'moons' && entry.type !== 'moon') return false;

            if (!q) return true;

            const haystack = [entry.name, entry.target, entry.parent]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [bodyFilter, catalog, searchTerm]);

    const moonEntries = useMemo(() => {
        if (!selectedBody || selectedBody.isMoon || selectedBody.isSun) return [];
        return Array.isArray(selectedBody.moons) ? selectedBody.moons : [];
    }, [selectedBody]);

    const bodyTypeLabel = useMemo(
        () => getBodyTypeLabel(selectedBody, catalog),
        [selectedBody, catalog]
    );

    const comparisonData = useMemo(() => {
        const radiusRatio = selectedBody?.isSun ? 109.2 : (selectedBody?.radius || 0);
        const massRatio = selectedBody?.isSun ? 333000 : (selectedBody?.mass || 0);
        return {
            radiusWidth: ratioToBarWidth(radiusRatio),
            massWidth: ratioToBarWidth(massRatio),
            radiusLabel: `${formatRatio(radiusRatio)}x`,
            massLabel: `${formatRatio(massRatio)}x`
        };
    }, [selectedBody]);

    const applySpeedIndex = (index) => {
        const engine = engineRef.current;
        if (!engine) return;

        const next = Math.max(0, Math.min(SPEED_VALUES.length - 1, index));
        setSpeedIndex(next);
        engine.setTimeScale(SPEED_VALUES[next]);
        showToast(`Geschwindigkeit ${SPEED_LABELS[next]}`);
    };

    const focusTarget = (target) => {
        const engine = engineRef.current;
        if (!engine) return;

        if (autoTourActive) {
            setAutoTourActive(false);
        }
        engine.focusOnTarget(target);
    };

    const focusRandomTarget = () => {
        if (filteredCatalog.length === 0) return;
        const randomTarget = filteredCatalog[Math.floor(Math.random() * filteredCatalog.length)].target;
        focusTarget(randomTarget);
        const entry = catalog.find((item) => item.target === randomTarget);
        showToast(`Fokus: ${entry?.name || randomTarget}`);
    };

    const toggleCollapsed = (section) => {
        setCollapsedSections((prev) => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const jumpToDate = () => {
        const engine = engineRef.current;
        if (!engine) return;

        if (!dateDraft) {
            showToast('Bitte ein Datum auswaehlen');
            return;
        }

        const date = new Date(`${dateDraft}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) {
            showToast('Datum konnte nicht gelesen werden');
            return;
        }

        engine.setSimulationDate(date);
        showToast(`Gesprungen zu ${date.toLocaleDateString('de-DE', { timeZone: 'UTC' })}`);
    };

    const jumpToToday = () => {
        const engine = engineRef.current;
        if (!engine) return;
        engine.setSimulationDate(new Date());
        showToast('Auf heutiges Datum gesetzt');
    };

    const togglePause = () => {
        const engine = engineRef.current;
        if (!engine) return;
        const next = !isPaused;
        setPaused(next);
        engine.setPaused(next);
    };

    const handleOrbitToggle = (checked) => {
        const engine = engineRef.current;
        setShowOrbits(checked);
        engine?.setOrbitVisibility(checked);
    };

    const handleLabelsToggle = (checked) => {
        const engine = engineRef.current;
        setShowLabels(checked);
        engine?.setLabelVisibility(checked);
    };

    const handleStarfieldToggle = (checked) => {
        const engine = engineRef.current;
        setShowStarfield(checked);
        engine?.setStarfieldVisibility(checked);
    };

    const handleFollowLockToggle = (checked) => {
        const engine = engineRef.current;
        setFollowLock(checked);
        engine?.setFollowLock(checked);
    };

    const handleCinematicToggle = (checked) => {
        setCinematicMode(checked);
        showToast(checked ? 'Cinematic Mode an' : 'Cinematic Mode aus');
    };

    const handleAutoTourButton = () => {
        setAutoTourActive(!autoTourActive);
    };

    const handleScreenshot = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const link = document.createElement('a');
            link.download = `sonnensystem-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('Screenshot gespeichert');
        } catch (error) {
            showToast('Screenshot fehlgeschlagen');
            console.warn('Screenshot error:', error);
        }
    };

    const isInfoHidden = !infoOpen || !selectedBody;
    const showMoonList = moonEntries.length > 0;

    const radiusText = useMemo(() => {
        if (!selectedBody) return '-';
        const radiusKm = selectedBody.isSun ? 696340 : (selectedBody.radius || 0) * EARTH_RADIUS_KM;
        return `${formatNumber(radiusKm, radiusKm > 1000 ? 0 : 1)} km`;
    }, [selectedBody]);

    const massText = useMemo(() => {
        if (!selectedBody) return '-';
        if (selectedBody.isSun) return '1.989 x 10^30 kg';
        if (!selectedBody.mass) return '-';
        return formatMass(selectedBody.mass * EARTH_MASS_KG);
    }, [selectedBody]);

    const distanceLabel = selectedBody?.isSun
        ? 'Entfernung'
        : selectedBody?.isMoon
            ? 'Distanz zum Planeten'
            : 'Entfernung zur Sonne';

    const distanceText = useMemo(() => {
        if (!selectedBody || selectedBody.isSun) return '-';
        if (selectedBody.isMoon) {
            const distanceKm = (selectedBody.semiMajorAxis || 0) * 149597870.7;
            return `${formatNumber(distanceKm, 0)} km`;
        }
        return `${formatNumber(selectedBody.semiMajorAxis || 0, 3)} AU`;
    }, [selectedBody]);

    const orbitalPeriodText = useMemo(() => {
        if (!selectedBody || selectedBody.isSun || !selectedBody.orbitalPeriod) return '-';
        const days = Math.abs(selectedBody.orbitalPeriod);
        if (days >= 365) return `${formatNumber(days / 365.25, 2)} Jahre`;
        if (days >= 1) return `${formatNumber(days, 2)} Tage`;
        return `${formatNumber(days * 24, 2)} Stunden`;
    }, [selectedBody]);

    const dayLengthText = useMemo(() => {
        if (!selectedBody || !selectedBody.rotationPeriod) return '-';
        const days = Math.abs(selectedBody.rotationPeriod);
        const retro = selectedBody.rotationPeriod < 0 ? ' (retrograd)' : '';
        if (days >= 1) return `${formatNumber(days, 2)} Tage${retro}`;
        return `${formatNumber(days * 24, 2)} Stunden${retro}`;
    }, [selectedBody]);

    const moonCountText = useMemo(() => {
        if (!selectedBody || selectedBody.isSun || selectedBody.isMoon) return '-';
        if (typeof selectedBody.moonCount === 'number') return String(selectedBody.moonCount);
        return String((selectedBody.moons || []).length);
    }, [selectedBody]);

    return (
        <div id="app">
            <canvas id="solar-system-canvas" ref={canvasRef}></canvas>
            <div id="hover-tooltip" className="hidden"></div>

            <div id="ui-overlay">
                <header id="header" className="glass-panel">
                    <div className="headline">
                        <p className="eyebrow">Interactive Observatory</p>
                        <h1>Sonnensystem Navigator</h1>
                    </div>
                    <div id="time-display">
                        <span className="meta-label">Simulationsdatum</span>
                        <strong id="simulation-date">{dateLabel}</strong>
                    </div>
                </header>

                <aside id="controls-panel" className="glass-panel">
                    <div className="panel-head">
                        <h2>Kontrolle</h2>
                        <div className="status-row">
                            <span className="status-pill">FPS <strong id="fps-value">{fps}</strong></span>
                            <span className="status-pill">Fokus <strong id="focus-value">{focusName}</strong></span>
                            <span className="status-pill">Follow <strong id="follow-state">{followLock ? 'AN' : 'AUS'}</strong></span>
                        </div>
                    </div>

                    <section className={`panel-section ${collapsedSections.time ? 'collapsed' : ''}`} data-collapsible="true">
                        <h3 onClick={() => toggleCollapsed('time')}>Zeit</h3>
                        <div className="panel-section-content">
                            <div className="time-toolbar">
                                <button id="btn-pause" className="control-btn primary" onClick={togglePause}>
                                    <span className="icon">{isPaused ? '>' : 'II'}</span>
                                    <span className="btn-label">{isPaused ? 'Weiter' : 'Pause'}</span>
                                </button>
                                <button
                                    id="btn-reset-view"
                                    className="control-btn"
                                    onClick={() => {
                                        engineRef.current?.resetView();
                                        showToast('Ansicht zurueckgesetzt');
                                    }}
                                >
                                    <span className="icon">R</span>
                                    <span className="btn-label">Reset View</span>
                                </button>
                            </div>

                            <div className="field-group">
                                <label htmlFor="time-scale">Geschwindigkeit</label>
                                <input
                                    type="range"
                                    id="time-scale"
                                    min="0"
                                    max={SPEED_VALUES.length - 1}
                                    step="1"
                                    value={speedIndex}
                                    onChange={(event) => applySpeedIndex(Number.parseInt(event.target.value, 10))}
                                />
                                <strong id="speed-label">{SPEED_LABELS[speedIndex]}</strong>
                            </div>

                            <div id="speed-presets" className="chip-row">
                                {SPEED_LABELS.map((label, index) => (
                                    <button
                                        key={label}
                                        type="button"
                                        className={`chip-btn ${index === speedIndex ? 'active' : ''}`}
                                        data-speed-index={index}
                                        onClick={() => applySpeedIndex(index)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="date-jump-grid">
                                <label htmlFor="date-jump-input">Direkt zu Datum springen</label>
                                <input
                                    id="date-jump-input"
                                    type="date"
                                    value={dateDraft}
                                    onFocus={() => {
                                        dateInputFocusedRef.current = true;
                                    }}
                                    onBlur={() => {
                                        dateInputFocusedRef.current = false;
                                    }}
                                    onChange={(event) => setDateDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            jumpToDate();
                                        }
                                    }}
                                />
                                <div className="inline-actions">
                                    <button id="btn-date-apply" className="control-btn small" onClick={jumpToDate}>Anwenden</button>
                                    <button id="btn-date-now" className="control-btn small" onClick={jumpToToday}>Heute</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={`panel-section ${collapsedSections.explorer ? 'collapsed' : ''}`} data-collapsible="true">
                        <h3 onClick={() => toggleCollapsed('explorer')}>Explorer</h3>
                        <div className="panel-section-content">
                            <div className="field-group">
                                <label htmlFor="body-search">Koerper suchen</label>
                                <input
                                    id="body-search"
                                    type="search"
                                    placeholder="z.B. Europa, Mars, Titan"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>

                            <div id="body-filters" className="chip-row">
                                {[
                                    { key: 'all', label: 'Alle' },
                                    { key: 'inner', label: 'Innere' },
                                    { key: 'outer', label: 'Aeussere' },
                                    { key: 'moons', label: 'Monde' }
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={`chip-btn filter-chip ${bodyFilter === item.key ? 'active' : ''}`}
                                        data-filter={item.key}
                                        onClick={() => setBodyFilter(item.key)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <ul id="planet-list">
                                {filteredCatalog.map((entry) => (
                                    <li
                                        key={entry.target}
                                        data-target={entry.target}
                                        data-type={entry.type}
                                        className={`planet-item ${entry.target === activeTarget ? 'active' : ''}`}
                                        onClick={() => focusTarget(entry.target)}
                                    >
                                        <span className="marker"></span>
                                        <span className="label">{entry.name}</span>
                                        <span className="meta">
                                            {entry.type === 'sun'
                                                ? 'Stern'
                                                : entry.type === 'moon'
                                                    ? (entry.parent ? `Mond - ${entry.parent}` : 'Mond')
                                                    : 'Planet'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section className={`panel-section ${collapsedSections.view ? 'collapsed' : ''}`} data-collapsible="true">
                        <h3 onClick={() => toggleCollapsed('view')}>Darstellung</h3>
                        <div className="panel-section-content">
                            <div className="toggle-grid">
                                <label className="toggle-item">
                                    <input
                                        id="show-orbits"
                                        type="checkbox"
                                        checked={showOrbits}
                                        onChange={(event) => handleOrbitToggle(event.target.checked)}
                                    />
                                    <span>Orbitlinien</span>
                                </label>
                                <label className="toggle-item">
                                    <input
                                        id="show-labels"
                                        type="checkbox"
                                        checked={showLabels}
                                        onChange={(event) => handleLabelsToggle(event.target.checked)}
                                    />
                                    <span>Labels</span>
                                </label>
                                <label className="toggle-item">
                                    <input
                                        id="show-starfield"
                                        type="checkbox"
                                        checked={showStarfield}
                                        onChange={(event) => handleStarfieldToggle(event.target.checked)}
                                    />
                                    <span>Sternfeld</span>
                                </label>
                                <label className="toggle-item">
                                    <input
                                        id="follow-lock"
                                        type="checkbox"
                                        checked={followLock}
                                        onChange={(event) => handleFollowLockToggle(event.target.checked)}
                                    />
                                    <span>Follow-Lock</span>
                                </label>
                                <label className="toggle-item">
                                    <input
                                        id="cinematic-mode"
                                        type="checkbox"
                                        checked={cinematicMode}
                                        onChange={(event) => handleCinematicToggle(event.target.checked)}
                                    />
                                    <span>Cinematic Mode</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className={`panel-section ${collapsedSections.tour ? 'collapsed' : ''}`} data-collapsible="true">
                        <h3 onClick={() => toggleCollapsed('tour')}>Auto Tour</h3>
                        <div className="panel-section-content">
                            <button id="btn-auto-tour" className={`control-btn full-width ${autoTourActive ? 'primary' : ''}`} onClick={handleAutoTourButton}>
                                <span className="icon">{autoTourActive ? '||' : '>'}</span>
                                <span className="btn-label">{autoTourActive ? 'Auto Tour Stoppen' : 'Auto Tour Starten'}</span>
                            </button>
                            <div className="field-group">
                                <label htmlFor="auto-tour-delay">Intervall pro Ziel</label>
                                <input
                                    id="auto-tour-delay"
                                    type="range"
                                    min="4"
                                    max="20"
                                    step="1"
                                    value={autoTourDelaySec}
                                    onChange={(event) => setAutoTourDelaySec(Number.parseInt(event.target.value, 10))}
                                />
                                <span id="auto-tour-delay-label">{autoTourDelaySec}s</span>
                            </div>
                        </div>
                    </section>
                </aside>

                <aside id="info-panel" className={`glass-panel ${isInfoHidden ? 'hidden' : ''}`}>
                    <button id="close-info" className="close-btn" aria-label="Info schliessen" onClick={() => closeInfo()}>X</button>
                    <div id="info-content">
                        <div className="info-header">
                            <p id="info-type" className="info-type">{bodyTypeLabel}</p>
                            <h2 id="info-name">{selectedBody?.name || 'Kein Objekt gewaehlt'}</h2>
                            <p id="info-description">
                                {selectedBody?.description || 'Klicke auf ein Objekt im 3D-Raum oder waehle es links im Explorer.'}
                            </p>
                        </div>

                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Radius</span>
                                <span id="info-radius" className="value">{radiusText}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Masse</span>
                                <span id="info-mass" className="value">{massText}</span>
                            </div>
                            <div className="info-item">
                                <span id="info-distance-label" className="label">{distanceLabel}</span>
                                <span id="info-distance" className="value">{distanceText}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Umlaufzeit</span>
                                <span id="info-orbital-period" className="value">{orbitalPeriodText}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Tageslaenge</span>
                                <span id="info-day-length" className="value">{dayLengthText}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Monde</span>
                                <span id="info-moons" className="value">{moonCountText}</span>
                            </div>
                        </div>

                        <div className="comparison-block">
                            <h3>Vergleich mit Erde</h3>
                            <div className="comparison-row">
                                <span>Radius</span>
                                <div className="comparison-track">
                                    <div id="comparison-radius" className="comparison-fill" style={{ width: `${comparisonData.radiusWidth}%` }}></div>
                                </div>
                                <strong id="comparison-radius-value">{comparisonData.radiusLabel}</strong>
                            </div>
                            <div className="comparison-row">
                                <span>Masse</span>
                                <div className="comparison-track">
                                    <div id="comparison-mass" className="comparison-fill" style={{ width: `${comparisonData.massWidth}%` }}></div>
                                </div>
                                <strong id="comparison-mass-value">{comparisonData.massLabel}</strong>
                            </div>
                        </div>

                        <div id="moon-list-container" className={!showMoonList ? 'hidden' : ''}>
                            <h3>Monde</h3>
                            <ul id="moon-list">
                                {moonEntries.map((moon) => (
                                    <li key={moon.nameEn} onClick={() => focusTarget(`${selectedBody.nameEn}:${moon.nameEn}`)}>
                                        {moon.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </aside>

                <div id="zoom-indicator" className="glass-panel">
                    <span className="meta-label">Zoom</span>
                    <strong id="zoom-level">{zoomLabel}</strong>
                </div>

                <div className="quick-actions">
                    <button className="quick-action-btn" id="quick-screenshot" data-tooltip="Screenshot" onClick={handleScreenshot}>SC</button>
                    <button className="quick-action-btn" id="quick-fullscreen" data-tooltip="Fullscreen" onClick={() => toggleFullscreen(showToast)}>FS</button>
                    <button className="quick-action-btn" id="quick-random" data-tooltip="Random Fokus" onClick={focusRandomTarget}>RD</button>
                </div>

                <button id="help-btn" title="Hilfe" onClick={() => setHelpOpen(true)}>?</button>

                <div id="help-modal" className={helpOpen ? '' : 'hidden'} onClick={(event) => {
                    if (event.target.id === 'help-modal') setHelpOpen(false);
                }}>
                    <div className="modal-content glass-panel">
                        <button className="close-btn" id="close-help" aria-label="Hilfe schliessen" onClick={() => setHelpOpen(false)}>X</button>
                        <h2>Shortcuts</h2>
                        <ul className="help-list">
                            <li><kbd>Space</kbd> Pause / Play</li>
                            <li><kbd>R</kbd> Kamera zuruecksetzen</li>
                            <li><kbd>O</kbd> Orbitlinien an/aus</li>
                            <li><kbd>T</kbd> Auto Tour an/aus</li>
                            <li><kbd>F</kbd> Fullscreen an/aus</li>
                            <li><kbd>C</kbd> Cinematic Mode</li>
                            <li><kbd>0-9</kbd> Sonne und Planeten springen</li>
                            <li><kbd>H</kbd> Hilfe anzeigen</li>
                        </ul>
                    </div>
                </div>

                <div id="keyboard-hints">
                    <span className="key-hint"><kbd>Space</kbd>Pause</span>
                    <span className="key-hint"><kbd>R</kbd>Reset</span>
                    <span className="key-hint"><kbd>T</kbd>Tour</span>
                    <span className="key-hint"><kbd>C</kbd>Cinematic</span>
                </div>

                <div id="shortcut-toast" className={`shortcut-toast ${toastMessage ? 'show' : ''}`}>
                    {toastMessage}
                </div>

                <div id="loading-screen" className={loading ? '' : 'hidden'}>
                    <div className="loader">
                        <div className="spinner"></div>
                        <p>Lade Sonnensystem</p>
                        <p id="loading-status">{errorMessage ? `Fehler: ${errorMessage}` : loadingStatus}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
