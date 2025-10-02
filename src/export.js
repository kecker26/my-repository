import { store } from "./state.js";

function buildInlineCode(selector, properties, modified) {
  if (Object.keys(modified).length === 0) {
    return `<!-- Keine Änderungen gegenüber dem Preset für ${selector} -->`;
  }
  const declarations = Object.entries(modified)
    .map(([property, value]) => `${property}: ${value};`)
    .join(" ");
  const primarySelector = selector.split(",")[0].trim();
  const className = primarySelector.startsWith(".")
    ? primarySelector.slice(1)
    : primarySelector.replace(/[^a-z0-9_-]/gi, "-");
  return `<div class="${className}" style="${declarations}">…</div>`;
}

function buildScopedCode(selector, properties, modified) {
  if (Object.keys(modified).length === 0) {
    return `/* Keine Differenzen zum aktuellen Preset */`;
  }
  const lines = Object.entries(modified)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `.preview-sandbox ${selector} {\n${lines}\n}`;
}

function buildGlobalCode(selector, properties, modified) {
  if (Object.keys(modified).length === 0) {
    return `/* Verwende das Preset unverändert */`;
  }
  const lines = Object.entries(modified)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `${selector} {\n${lines}\n}`;
}

function buildCode(mode, selector, properties, modified) {
  switch (mode) {
    case "inline":
      return buildInlineCode(selector, properties, modified);
    case "scoped":
      return buildScopedCode(selector, properties, modified);
    case "global":
    default:
      return buildGlobalCode(selector, properties, modified);
  }
}

export function initExportPanel() {
  const select = document.getElementById("export-mode");
  const codeBlock = document.querySelector("[data-code-output]");
  if (!select || !codeBlock) return;

  const render = (state) => {
    const modified = store.getModifiedProperties();
    const mode = select.value;
    const code = buildCode(mode, state.selector, state.properties, modified);
    codeBlock.textContent = code;
    codeBlock.classList.toggle("code-output__placeholder", Object.keys(modified).length === 0);
  };

  select.addEventListener("change", () => render(store.getState()));
  store.subscribe(render);
}
