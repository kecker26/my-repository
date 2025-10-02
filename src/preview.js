import { store } from "./state.js";

const PREVIEW_DOCUMENT = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: linear-gradient(140deg, #e0f2fe, #eef2ff);
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: grid;
        place-items: center;
        padding: 2rem;
      }
      .preview-card {
        max-width: 480px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        border-radius: 1.25rem;
        background: #ffffff;
        color: #111827;
        border: 0;
      }
      .preview-card h2 {
        margin: 0;
        font-size: clamp(1.4rem, 3vw, 1.75rem);
      }
      .preview-card p {
        margin: 0;
        color: rgba(15, 23, 42, 0.75);
      }
      .preview-card .actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .preview-card button {
        border: none;
        border-radius: 999px;
        padding: 0.65rem 1.4rem;
        font: inherit;
        cursor: pointer;
      }
      .preview-card button.primary {
        background: linear-gradient(120deg, #4f46e5, #6366f1);
        color: #ffffff;
        box-shadow: 0 14px 32px rgba(99, 102, 241, 0.35);
      }
      .preview-card button.secondary {
        background: rgba(99, 102, 241, 0.1);
        color: #3730a3;
      }
    </style>
  </head>
  <body>
    <article class="preview-card">
      <h2>Produktivität im Fokus</h2>
      <p>Gestalte modulare Komponenten und teste CSS-Kombinationen in Echtzeit.</p>
      <div class="actions">
        <button class="primary">Jetzt starten</button>
        <button class="secondary">Dokumentation</button>
      </div>
    </article>
  </body>
</html>`;

function applyStyles(doc, styles) {
  const element = doc.querySelector(".preview-card");
  if (!element) return;
  element.style.cssText = "";
  Object.entries(styles).forEach(([property, value]) => {
    if (value === undefined || value === null || value === "") {
      element.style.removeProperty(property);
    } else {
      element.style.setProperty(property, value);
    }
  });

  if (styles["border-width"] && styles["border-width"] !== "0px") {
    element.style.setProperty("border-style", "solid");
  } else {
    element.style.removeProperty("border-style");
  }
}

export function initPreview() {
  const iframe = document.getElementById("preview-frame");
  if (!iframe) return;

  iframe.srcdoc = PREVIEW_DOCUMENT;

  const render = (state) => {
    const doc = iframe.contentDocument;
    if (!doc) return;
    applyStyles(doc, state.properties);
  };

  iframe.addEventListener("load", () => {
    render(store.getState());
  });

  store.subscribe(render);
}
