import React, { lazy, Suspense } from "react";
const toolTitles = {
  audio: "Músicas",
  soundpad: "Soundpad",
  evidence: "Evidências",
  initiative: "Iniciativa",
  participants: "Participantes",
  npcs: "NPCs",
  scenes: "Cenas e mapas",
  notes: "Anotações",
  combat: "Combate",
  investigation: "Investigação",
  dashboard: "Dashboard",
  shop: "Loja",
};
const Mesa = lazy(() => import("../../pages/mesa"));
export default function TabletopSessionTools({
  open,
  tool,
  requestVersion,
  onClose,
}) {
  return (
    <section
      className={`tt3-session-tools tt3-tool-${tool || "participants"} ${open ? "is-open" : ""}`}
      aria-hidden={!open}
      inert={!open}
      role={open ? "complementary" : undefined}
      aria-label="Ferramentas da sessão"
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") onClose();
      }}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <header className="tt3-session-tools-header">
        <div>
          <span>TABLETOP 3D</span>
          <strong>{toolTitles[tool] || "Participantes"}</strong>
        </div>
        <button type="button" onClick={onClose}>
          Fechar painel ×
        </button>
      </header>
      <div className="tt3-session-tools-body">
        <Suspense
          fallback={<p role="status">Carregando ferramentas da sessão…</p>}
        >
          <Mesa embedded requestedTool={tool} requestVersion={requestVersion} />
        </Suspense>
      </div>
    </section>
  );
}
