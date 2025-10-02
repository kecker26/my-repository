import { store } from "./state.js";

function formatValue(value, unit) {
  if (unit === "rem") {
    return `${parseFloat(value).toFixed(2)} rem`;
  }
  if (unit === "px") {
    return `${parseFloat(value)} px`;
  }
  return value;
}

function normaliseValue(input) {
  const property = input.dataset.property;
  let value = input.type === "checkbox" ? input.checked : input.value;

  if (input.type === "range") {
    const unit = input.dataset.unit;
    value = `${input.value}${unit ?? ""}`;
  } else if (input.type === "color") {
    value = input.value;
  } else if (input.type === "checkbox") {
    value = input.checked ? input.dataset.on : input.dataset.off;
  } else if (property === "line-height") {
    value = parseFloat(input.value).toString();
  }

  return value;
}

function setControlValue(input, value) {
  if (input.type === "checkbox") {
    const checkedValue = input.dataset.on;
    input.checked = value === checkedValue;
  } else if (input.type === "color") {
    input.value = value || "#000000";
  } else if (input.type === "range") {
    const unit = input.dataset.unit ?? "";
    let numeric = value;
    if (typeof value === "string" && unit && value.endsWith(unit)) {
      numeric = value.slice(0, value.length - unit.length);
    }
    const parsed = Number.parseFloat(numeric);
    input.value = Number.isNaN(parsed) ? input.min : parsed;
  } else {
    input.value = value;
  }
}

function updateOutputs(form, state) {
  const controls = form.querySelectorAll("[data-property]");
  controls.forEach((input) => {
    const property = input.dataset.property;
    const currentValue = state.properties[property] ?? "";
    setControlValue(input, currentValue);

    const output = form.querySelector(`[data-output-for="${input.id}"]`);
    if (output) {
      let displayValue = currentValue;
      if (input.type === "range") {
        const unit = input.dataset.unit ?? "";
        const numeric = currentValue.endsWith(unit)
          ? currentValue.slice(0, currentValue.length - unit.length)
          : currentValue;
        displayValue = formatValue(numeric, unit);
      }
      if (input.type === "color") {
        displayValue = currentValue;
      }
      output.textContent = displayValue;
    }
  });
}

export function initControls() {
  const form = document.querySelector("[data-controls]");
  if (!form) return;

  const update = (state) => updateOutputs(form, state);
  const unsubscribe = store.subscribe(update);

  const handleEvent = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }
    const property = target.dataset.property;
    if (!property) return;
    const value = normaliseValue(target);
    store.updateProperty(property, value);
  };

  form.addEventListener("input", handleEvent);
  form.addEventListener("change", handleEvent);

  return () => {
    unsubscribe();
    form.removeEventListener("input", handleEvent);
    form.removeEventListener("change", handleEvent);
  };
}
