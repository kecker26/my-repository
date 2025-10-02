import { initControls } from "./controls.js";
import { initPreview } from "./preview.js";
import { initInspector } from "./inspector.js";
import { initExportPanel } from "./export.js";
import { store } from "./state.js";
import { presets } from "./presets.js";

function populatePresets(select) {
  if (select.dataset.populated === "true") {
    return;
  }
  presets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    select.appendChild(option);
  });
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Benutzerdefiniert";
  select.appendChild(customOption);
  select.dataset.populated = "true";
}

function initToolbar() {
  const presetSelect = document.getElementById("preset-select");
  const undoButton = document.getElementById("undo-button");
  const redoButton = document.getElementById("redo-button");
  const resetButton = document.getElementById("reset-button");
  if (!presetSelect || !undoButton || !redoButton || !resetButton) return;

  populatePresets(presetSelect);

  presetSelect.addEventListener("change", (event) => {
    const value = event.target.value;
    if (value === "custom") {
      return;
    }
    store.applyPreset(value);
  });

  undoButton.addEventListener("click", () => store.undo());
  redoButton.addEventListener("click", () => store.redo());
  resetButton.addEventListener("click", () => store.resetToBaseline());

  store.subscribe((state) => {
    if (state.activePreset === "custom" && !presetSelect.querySelector('option[value="custom"]')) {
      populatePresets(presetSelect);
    }
    presetSelect.value = state.activePreset;
    undoButton.disabled = !state.canUndo;
    redoButton.disabled = !state.canRedo;
  });
}

function initKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const isUndo = (event.metaKey || event.ctrlKey) && !event.shiftKey && key === "z";
    const isRedo =
      (event.metaKey || event.ctrlKey) && ((event.shiftKey && key === "z") || key === "y");
    if (isUndo) {
      event.preventDefault();
      store.undo();
    } else if (isRedo) {
      event.preventDefault();
      store.redo();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initToolbar();
  initControls();
  initPreview();
  initInspector();
  initExportPanel();
  initKeyboardShortcuts();
});
