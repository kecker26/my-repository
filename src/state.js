import { presets, getPresetById } from "./presets.js";

const DEFAULT_PRESET_ID = presets[0]?.id ?? "starter";

function clone(object) {
  return JSON.parse(JSON.stringify(object));
}

class Store {
  constructor(initialPresetId = DEFAULT_PRESET_ID) {
    const preset = getPresetById(initialPresetId) ?? presets[0];
    const baseline = clone(preset.properties);

    this.state = {
      selector: ".preview-card",
      properties: clone(preset.properties),
      baseline,
      baselinePresetId: preset.id,
      activePreset: preset.id,
    };

    this.listeners = new Set();
    this.history = [clone(this.state.properties)];
    this.pointer = 0;
  }

  recalculateActivePresetTag() {
    const modified = this.getModifiedProperties();
    if (Object.keys(modified).length === 0) {
      this.state.activePreset = this.state.baselinePresetId;
    } else {
      this.state.activePreset = "custom";
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  getState() {
    return {
      selector: this.state.selector,
      properties: clone(this.state.properties),
      baseline: clone(this.state.baseline),
      baselinePresetId: this.state.baselinePresetId,
      activePreset: this.state.activePreset,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  canUndo() {
    return this.pointer > 0;
  }

  canRedo() {
    return this.pointer < this.history.length - 1;
  }

  commit(newProperties, { replaceHistory = false } = {}) {
    if (replaceHistory) {
      this.history = [clone(newProperties)];
      this.pointer = 0;
    } else {
      const serialized = JSON.stringify(newProperties);
      const currentSerialized = JSON.stringify(this.history[this.pointer]);
      if (serialized === currentSerialized) {
        return;
      }
      this.history = this.history.slice(0, this.pointer + 1);
      this.history.push(clone(newProperties));
      this.pointer = this.history.length - 1;
    }
    this.notify();
  }

  updateProperty(property, value) {
    if (!(property in this.state.properties)) {
      this.state.properties[property] = value;
    } else if (this.state.properties[property] === value) {
      return;
    } else {
      this.state.properties[property] = value;
    }

    this.recalculateActivePresetTag();

    this.commit(this.state.properties);
  }

  applyPreset(presetId) {
    const preset = getPresetById(presetId);
    if (!preset) return;
    this.state.baseline = clone(preset.properties);
    this.state.properties = clone(preset.properties);
    this.state.baselinePresetId = preset.id;
    this.state.activePreset = preset.id;
    this.commit(this.state.properties, { replaceHistory: true });
  }

  resetToBaseline() {
    this.state.properties = clone(this.state.baseline);
    this.state.activePreset = this.state.baselinePresetId;
    this.commit(this.state.properties, { replaceHistory: true });
  }

  undo() {
    if (!this.canUndo()) return;
    this.pointer -= 1;
    this.state.properties = clone(this.history[this.pointer]);
    this.recalculateActivePresetTag();
    this.notify();
  }

  redo() {
    if (!this.canRedo()) return;
    this.pointer += 1;
    this.state.properties = clone(this.history[this.pointer]);
    this.recalculateActivePresetTag();
    this.notify();
  }

  getModifiedProperties() {
    const modified = {};
    for (const [property, value] of Object.entries(this.state.properties)) {
      const baselineValue = this.state.baseline[property] ?? "";
      if (value !== baselineValue) {
        modified[property] = value;
      }
    }
    return modified;
  }
}

export const store = new Store(DEFAULT_PRESET_ID);
