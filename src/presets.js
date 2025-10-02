export const presets = [
  {
    id: "starter",
    label: "Starter Card",
    description: "Grundlayout für Kartenkomponenten.",
    properties: {
      display: "flex",
      "flex-direction": "column",
      "justify-content": "flex-start",
      "align-items": "stretch",
      gap: "1rem",
      padding: "1.5rem",
      "grid-template-columns": "",
      "box-shadow": "0 24px 48px rgba(15, 23, 42, 0.16)",
      "font-size": "1.05rem",
      "font-weight": "500",
      "line-height": "1.5",
      "background-color": "#ffffff",
      color: "#111827",
      "border-radius": "1.25rem",
      "border-width": "0px",
      "border-color": "#e2e8f0"
    }
  },
  {
    id: "hero",
    label: "Hero Banner",
    description: "Breites Layout mit großzügiger Typografie.",
    properties: {
      display: "flex",
      "flex-direction": "row",
      "justify-content": "space-between",
      "align-items": "center",
      gap: "1.5rem",
      padding: "2.5rem",
      "grid-template-columns": "",
      "box-shadow": "none",
      "font-size": "1.35rem",
      "font-weight": "600",
      "line-height": "1.35",
      "background-color": "#0f172a",
      color: "#f8fafc",
      "border-radius": "1.5rem",
      "border-width": "0px",
      "border-color": "#1f2937"
    }
  },
  {
    id: "feature-grid",
    label: "Feature Grid",
    description: "Grid-Basierte Darstellung mehrerer Kacheln.",
    properties: {
      display: "grid",
      "flex-direction": "column",
      "justify-content": "flex-start",
      "align-items": "stretch",
      gap: "1.5rem",
      padding: "2rem",
      "grid-template-columns": "repeat(auto-fit, minmax(160px, 1fr))",
      "box-shadow": "0 12px 32px rgba(30, 64, 175, 0.2)",
      "font-size": "1rem",
      "font-weight": "500",
      "line-height": "1.45",
      "background-color": "#f8fafc",
      color: "#0f172a",
      "border-radius": "1rem",
      "border-width": "1px",
      "border-color": "#93c5fd"
    }
  }
];

export function getPresetById(id) {
  return presets.find((preset) => preset.id === id);
}
