import { create } from 'zustand';
import { SPEED_VALUES } from '../../data/solarSystemData.js';

function formatDateLabel(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '01. Januar 2000';
    }

    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });
}

function formatDateInput(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '2000-01-01';
    }

    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatZoom(distance) {
    if (!Number.isFinite(distance)) return '-';
    if (distance > 120) return `${(distance / 10).toFixed(1)} AU`;
    if (distance > 12) return `${distance.toFixed(1)} AU`;
    return `${Math.max(1, Math.round(distance * 10))} Mio km`;
}

export const useUIStore = create((set, get) => ({
    loading: true,
    loadingStatus: 'Initialisiere Ressourcen...',
    errorMessage: '',
    isReady: false,

    dateLabel: '01. Januar 2000',
    dateInputValue: '2000-01-01',
    elapsedDays: 0,
    zoomLabel: '-',
    fps: 60,
    focusName: 'Sonne',
    followLock: true,
    isPaused: false,
    speedIndex: 2,
    activeTarget: 'sun',
    selectedBody: null,

    showOrbits: true,
    showLabels: true,
    showStarfield: true,
    cinematicMode: false,

    searchTerm: '',
    bodyFilter: 'all',
    catalog: [],

    infoOpen: false,
    helpOpen: false,

    autoTourActive: false,
    autoTourDelaySec: 8,

    toastMessage: '',

    syncFromEngine: (snapshot) => {
        if (!snapshot) return;

        const speedIndex = SPEED_VALUES.indexOf(snapshot.timeScale);
        set({
            isReady: Boolean(snapshot.ready),
            loading: !snapshot.ready,
            elapsedDays: snapshot.elapsedDays ?? 0,
            dateLabel: formatDateLabel(snapshot.simulationDate),
            dateInputValue: formatDateInput(snapshot.simulationDate),
            zoomLabel: formatZoom(snapshot.zoomDistance),
            fps: Math.round(snapshot.fps ?? 60),
            focusName: snapshot.focusName || 'Sonne',
            followLock: Boolean(snapshot.followLockEnabled),
            isPaused: Boolean(snapshot.isPaused),
            speedIndex: speedIndex >= 0 ? speedIndex : get().speedIndex,
            activeTarget: snapshot.activeTarget || get().activeTarget,
            selectedBody: snapshot.selectedBody || get().selectedBody
        });
    },

    setLoadingStatus: (status) => {
        set({ loadingStatus: status || 'Lade...' });
    },

    setErrorMessage: (message) => {
        set({ errorMessage: message || 'Unbekannter Fehler' });
    },

    setCatalog: (catalog) => {
        set({ catalog: Array.isArray(catalog) ? catalog : [] });
    },

    setSelectedBody: (body) => {
        set({
            selectedBody: body || null,
            infoOpen: !!body
        });
    },

    closeInfo: () => {
        set({ infoOpen: false });
    },

    setSpeedIndex: (index) => {
        set({ speedIndex: index });
    },

    setPaused: (paused) => {
        set({ isPaused: paused });
    },

    setFollowLock: (enabled) => {
        set({ followLock: enabled });
    },

    setShowOrbits: (enabled) => {
        set({ showOrbits: enabled });
    },

    setShowLabels: (enabled) => {
        set({ showLabels: enabled });
    },

    setShowStarfield: (enabled) => {
        set({ showStarfield: enabled });
    },

    setCinematicMode: (enabled) => {
        document.body.classList.toggle('cinematic', enabled);
        set({ cinematicMode: enabled });
    },

    setSearchTerm: (value) => {
        set({ searchTerm: value });
    },

    setBodyFilter: (value) => {
        set({ bodyFilter: value });
    },

    setHelpOpen: (open) => {
        set({ helpOpen: open });
    },

    setAutoTourActive: (active) => {
        set({ autoTourActive: active });
    },

    setAutoTourDelaySec: (seconds) => {
        set({ autoTourDelaySec: seconds });
    },

    setToastMessage: (message) => {
        set({ toastMessage: message || '' });
    }
}));

export default useUIStore;
