import { store } from "./state.js";

function calculateSpecificity(selector) {
  let a = 0;
  let b = 0;
  let c = 0;

  const tokens = selector.split(/\s+/);
  tokens.forEach((token) => {
    const cleaned = token.replace(/[,:+>~]/g, " ").trim();
    if (!cleaned) return;
    cleaned.split(/(?=\.)|(?=#)|\s+/).forEach((part) => {
      if (!part) return;
      if (part.startsWith("#")) {
        a += 1;
      } else if (part.startsWith(".")) {
        b += 1;
      } else if (part.includes("[")) {
        b += 1;
      } else {
        c += 1;
      }
    });
  });

  return { a, b, c, score: `${a},${b},${c}` };
}

function createRuleMarkup(selector, properties) {
  const specificity = calculateSpecificity(selector);
  const lines = Object.entries(properties)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");

  return {
    specificity,
    markup: `${selector} {\n${lines}\n}`,
  };
}

function collectWarnings(state, modified) {
  const warnings = [];
  const display = state.properties.display;

  const usesFlexProps = ["justify-content", "align-items", "flex-direction"].some(
    (prop) => modified[prop]
  );
  if (usesFlexProps && display !== "flex") {
    warnings.push({
      title: "Flex Eigenschaften aktiv",
      description:
        "Aktiviere \"display: flex\", um Flex-Ausrichtungen wirksam werden zu lassen.",
    });
  }

  if (modified["grid-template-columns"] && display !== "grid") {
    warnings.push({
      title: "Grid Template ohne Grid",
      description: "Setze \"display: grid\", damit das Spaltenlayout aktiv ist.",
    });
  }

  if (modified.gap && display === "block") {
    warnings.push({
      title: "Gap ohne Layout-Kontext",
      description: "Gap entfaltet Wirkung nur innerhalb von Flex- oder Grid-Layouts.",
    });
  }

  if (modified["border-width"] && !modified["border-color"]) {
    warnings.push({
      title: "Border ohne Farbe",
      description: "Definiere eine Border-Farbe, um die Kontur sichtbar zu machen.",
    });
  }

  return warnings;
}

function renderRules(list, state, modified) {
  list.innerHTML = "";
  if (Object.keys(modified).length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Keine Abweichungen vom Preset.";
    list.appendChild(empty);
    return;
  }

  const { markup, specificity } = createRuleMarkup(state.selector, modified);
  const item = document.createElement("li");
  item.className = "rule";
  const selectorEl = document.createElement("div");
  selectorEl.className = "rule__selector";
  selectorEl.textContent = state.selector;
  const specificityEl = document.createElement("div");
  specificityEl.className = "rule__specificity";
  specificityEl.textContent = `Specificity: ${specificity.score}`;
  const codeEl = document.createElement("pre");
  codeEl.textContent = markup;
  item.append(selectorEl, specificityEl, codeEl);
  list.appendChild(item);
}

function renderDiff(tableBody, state, modified) {
  tableBody.innerHTML = "";
  if (Object.keys(modified).length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "Noch keine Änderungen.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  Object.entries(modified).forEach(([property, value]) => {
    const row = document.createElement("tr");
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = property;
    const before = document.createElement("td");
    before.textContent = state.baseline[property] ?? "—";
    const after = document.createElement("td");
    after.textContent = value;
    row.append(name, before, after);
    tableBody.appendChild(row);
  });
}

function renderWarnings(list, state, modified) {
  list.innerHTML = "";
  const warnings = collectWarnings(state, modified);
  if (warnings.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Keine Probleme erkannt.";
    list.appendChild(item);
    return;
  }

  warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.className = "warning";
    const title = document.createElement("span");
    title.className = "warning__title";
    title.textContent = warning.title;
    const description = document.createElement("span");
    description.textContent = warning.description;
    item.append(title, description);
    list.appendChild(item);
  });
}

export function initInspector() {
  const ruleList = document.querySelector("[data-rule-list]");
  const diffBody = document.querySelector("[data-diff-body]");
  const warningList = document.querySelector("[data-warning-list]");
  if (!ruleList || !diffBody || !warningList) return;

  store.subscribe((state) => {
    const modified = store.getModifiedProperties();
    renderRules(ruleList, state, modified);
    renderDiff(diffBody, state, modified);
    renderWarnings(warningList, state, modified);
  });
}
