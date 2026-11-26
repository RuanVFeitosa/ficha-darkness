import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiArrowTopRight,
  mdiBookOpenPageVariantOutline,
  mdiClose,
  mdiMagnify,
  mdiPackageVariantClosed,
  mdiSword,
} from "@mdi/js";
import { equipmentCatalog } from "../../services/ordemEquipment";
import { powerCatalog } from "../../services/ordemPowerCatalog";
import {
  attributes,
  normalizeOrdem,
  readOrdemSheets,
  rituals,
  STORAGE_KEY,
} from "../../services/ordemSheet";
import { readLocalCampaign } from "../../services/localCampaignStorage";
import OrdemRulebook from "./OrdemRulebook";
import OrdemThreats from "./OrdemThreats";
import ElementSymbol from "../ordem/ElementSymbol";
import ParanormalFilters, {
  paranormalElements as elements,
  ritualCircleLabels,
} from "../ordem/ParanormalFilters";
import "../../styles/OrdemMasterTools.css";

const ritualEntries = rituals.map((ritual, index) => ({
  catalogId: `ritual-${index}`,
  name: ritual.name,
  group: "Rituais",
  element: ritual.element,
  circle: ritual.circle,
  fields: ritual.fields,
  variants: ritual.variants,
  detail: ritual.paragraphs.join("\n\n"),
}));
const elementKey = (value) => normalizeOrdem(value || "").toLowerCase();
const paranormalPowers = powerCatalog
  .filter((entry) => entry.category === "Poderes paranormais")
  .map((entry) => ({ ...entry, element: elements[elementKey(entry.group)] }));
const abilities = powerCatalog.filter(
  (entry) => entry.category !== "Poderes paranormais",
);
const includesText = (text, query) =>
  normalizeOrdem(text).includes(normalizeOrdem(query.trim()));

function RitualReader({ ritual, onClose }) {
  const dialogRef = useRef(null);
  const key = elementKey(ritual.element);
  const roman = ritualCircleLabels[ritual.circle - 1];
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  return <dialog ref={dialogRef} className="om-ritual-reader" data-element={key}
    aria-labelledby="om-ritual-reader-title" onClose={event => { if (!event.currentTarget.open) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
    <div className="om-ritual-document">
      <header className="om-ritual-reader-header" style={{ '--om-element-art': `url("/ordem-texturas/${key}.jpg")` }}>
        <div>
          <div className="om-entry-category"><ElementSymbol element={ritual.element} /> {roman} · {ritual.element}</div>
          <h2 id="om-ritual-reader-title">{ritual.name}</h2>
        </div>
        <button type="button" aria-label="Fechar ritual" onClick={() => dialogRef.current.close()}><Icon path={mdiClose} size={1} /></button>
      </header>
      <div className="om-ritual-reader-body">
        <dl>{ritual.fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
        {ritual.detail && <p>{ritual.detail}</p>}
        {ritual.variants.map(variant => <section key={variant.label}>
          <h3>{variant.label}</h3>
          {variant.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>)}
      </div>
    </div>
  </dialog>;
}

function AgentDossier({ sheet }) {
  const [portrait, setPortrait] = useState("");
  useEffect(() => {
    let active = true;
    readLocalCampaign(`ordem:retrato:${sheet.id}`)
      .then((image) => {
        if (active && typeof image === "string") setPortrait(image);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [sheet.id]);
  const name = sheet.nome || "Agente sem nome";
  return (
    <li>
      <a
        className="om-dossier"
        href={`/?ordem=1&agente=${encodeURIComponent(sheet.id)}`}
        aria-label={`Consultar ficha de ${name}`}
      >
        <div className={`om-portrait${portrait ? "" : " om-portrait-empty"}`}>
          <img
            src={portrait || "/ordem-simbolo-retrato.png"}
            alt=""
            loading="lazy"
          />
          <Icon path={mdiArrowTopRight} size={0.8} />
          <small>NEX {sheet.nex ?? 5}%</small>
        </div>
        <div className="om-dossier-body">
          {sheet.classe && <span className="om-kicker">{sheet.classe}</span>}
          <h3>{name}</h3>
          {[sheet.trilha, sheet.jogador].some(Boolean) && (
            <p>{[sheet.trilha, sheet.jogador].filter(Boolean).join(" · ")}</p>
          )}
          <dl className="om-attributes">
            {Object.entries(attributes).map(([id, label]) => (
              <div key={id} title={label}>
                <dt>{id}</dt>
                <dd>{sheet.attributes?.[id] ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="om-resources">
            {[
              ["pv", "PV"],
              ["san", "Sanidade"],
              ["pe", "PE"],
            ].map(([id, label]) => {
              const resource = sheet.resources?.[id];
              const max = Math.max(0, Number(resource?.max) || 0);
              const current = Math.max(0, Number(resource?.current) || 0);
              return (
                <div key={id}>
                  <span>
                    {label}
                    <b>{resource ? `${current} / ${max}` : "—"}</b>
                  </span>
                  <progress
                    aria-label={label}
                    value={Math.min(current, max)}
                    max={max || 1}
                  />
                </div>
              );
            })}
          </div>
          <footer>
            Consultar ficha <Icon path={mdiArrowTopRight} size={0.65} />
          </footer>
        </div>
      </a>
    </li>
  );
}

function OrdemSheets() {
  const [sheets, setSheets] = useState(readOrdemSheets);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const refresh = (event) => {
      if (event.type !== "storage" || !event.key || event.key === STORAGE_KEY)
        setSheets(readOrdemSheets());
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const matches = sheets.filter((sheet) =>
    includesText(
      `${sheet.nome || ""} ${sheet.jogador || ""} ${sheet.classe || ""}`,
      query,
    ),
  );
  return (
    <section
      className="master-order-panel om-workspace"
      aria-labelledby="ordem-sheet-title"
    >
      <header>
        <div>
          <h2 id="ordem-sheet-title">Fichas de Ordem Paranormal</h2>
          <p>Agentes salvos neste navegador.</p>
        </div>
        <a className="master-order-action" href="/?ordem=1&criar=1">
          Nova ficha
        </a>
      </header>
      <label>
        Buscar agente
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {matches.length === 0 ? (
        <p>
          {query.trim()
            ? "Nenhum agente corresponde à busca."
            : "Nenhuma ficha de Ordem salva neste navegador."}
        </p>
      ) : (
        <ul className="om-dossiers">
          {matches.map((sheet) => (
            <AgentDossier key={sheet.id} sheet={sheet} />
          ))}
        </ul>
      )}
    </section>
  );
}

function OrdemCatalog({
  title,
  entries,
  unit,
  equipment = false,
  paranormal = false,
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [limit, setLimit] = useState(24);
  const [circle, setCircle] = useState(null);
  const [selectedRitual, setSelectedRitual] = useState(null);
  const categoryOf = (entry) =>
    paranormal
      ? elements[elementKey(entry.element)] || "Gerais"
      : entry.category || entry.group;
  const groups = entries.reduce((counts, entry) => {
    const category = categoryOf(entry);
    counts.set(category, (counts.get(category) || 0) + 1);
    return counts;
  }, new Map());
  const hasCircles = entries.some((entry) => entry.circle);
  const matches = entries.filter(
    (entry) =>
      (!group || categoryOf(entry) === group) &&
      (!circle || entry.circle === circle) &&
      includesText(
        `${entry.name} ${entry.group} ${entry.element || ""} ${entry.detail || ""}`,
        query,
      ),
  );
  const icon = equipment
    ? mdiPackageVariantClosed
    : mdiBookOpenPageVariantOutline;
  return (
    <section
      className={`om-workspace om-catalog${paranormal ? " om-catalog-paranormal" : ""}`}
      aria-labelledby="ordem-catalog-title"
    >
      <header className="om-catalog-header">
        <h2 id="ordem-catalog-title">{title}</h2>
        {paranormal && (
          <ParanormalFilters
            options={[...groups.keys()]}
            element={group}
            circle={circle}
            onElementChange={(value) => {
              setGroup(value);
              setLimit(24);
            }}
            onCircleChange={
              hasCircles
                ? (value) => {
                    setCircle(value);
                    setLimit(24);
                  }
                : undefined
            }
          />
        )}
        <span className="om-total">
          <Icon path={icon} size={1.15} />
          <b>{entries.length}</b>
          {unit}
        </span>
      </header>
      <div className="om-catalog-layout">
        {!paranormal && (
          <nav className="om-categories" aria-label="Categorias do catálogo">
            {[["", entries.length], ...groups].map(([name, count]) => (
              <button
                key={name}
                type="button"
                aria-pressed={name === group}
                onClick={() => {
                  setGroup(name);
                  setLimit(24);
                }}
              >
                {name || "Todas"}
                <span>{count}</span>
              </button>
            ))}
          </nav>
        )}
        <div className="om-results">
          <div className="om-search">
            <label>
              <Icon path={mdiMagnify} size={0.9} />
              <span>Buscar no catálogo</span>
              <input
                type="search"
                placeholder="Nome, descrição ou categoria…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(24);
                }}
              />
            </label>
            <small role="status">{matches.length} resultados</small>
          </div>
          {matches.length === 0 ? (
            <p>Nenhum registro encontrado.</p>
          ) : (
            <ul className={`om-entry-grid${hasCircles ? ' om-ritual-grid' : ''}`}>
              {matches.slice(0, limit).map((entry, index) => {
                const key = elementKey(entry.element);
                const element =
                  paranormal && elements[key] ? elements[key] : null;
                const roman = ritualCircleLabels[entry.circle - 1];
                return (
                  <li
                    key={
                      entry.catalogId || `${entry.group}-${entry.name}-${index}`
                    }
                    data-element={
                      paranormal ? (element ? key : "gerais") : undefined
                    }
                    style={
                      element
                        ? {
                            "--om-element-art": `url("/ordem-texturas/${key}.jpg")`,
                          }
                        : undefined
                    }
                  >
                    <div className="om-entry-category">
                      {roman && (
                        <span
                          className="om-ritual-circle"
                          aria-label={`Círculo ${roman}`}
                        >
                          {roman}
                        </span>
                      )}
                      {element ? (
                        <ElementSymbol element={element} />
                      ) : (
                        <Icon
                          path={entry.damage ? mdiSword : icon}
                          size={0.9}
                        />
                      )}
                      <span>
                        {paranormal ? element || "Geral" : entry.group}
                      </span>
                    </div>
                    <h3>{entry.name}</h3>
                    <dl className="om-entry-stats">
                      {entry.damage && (
                        <div>
                          <dt>Dano</dt>
                          <dd>{entry.damage}</dd>
                        </div>
                      )}
                      {entry.skill && (
                        <div>
                          <dt>Perícia</dt>
                          <dd>{entry.skill}</dd>
                        </div>
                      )}
                      {entry.nex && (
                        <div>
                          <dt>NEX</dt>
                          <dd>{entry.nex}%</dd>
                        </div>
                      )}
                      {entry.element && !roman && (
                        <div>
                          <dt>Elemento</dt>
                          <dd>{entry.element}</dd>
                        </div>
                      )}
                      {entry.tag && (
                        <div>
                          <dt>Tipo</dt>
                          <dd>{entry.tag}</dd>
                        </div>
                      )}
                      {equipment &&
                        entry.detail?.match(/Categoria (\S+)/)?.[1] && (
                          <div>
                            <dt>Categoria</dt>
                            <dd>{entry.detail.match(/Categoria (\S+)/)[1]}</dd>
                          </div>
                        )}
                      {entry.fields?.find(
                        (field) => field.label === "Execução",
                      ) && (
                        <div>
                          <dt>Execução</dt>
                          <dd>
                            {
                              entry.fields.find(
                                (field) => field.label === "Execução",
                              ).value
                            }
                          </dd>
                        </div>
                      )}
                    </dl>
                    {roman ? <button className="om-ritual-read-button" type="button" onClick={() => setSelectedRitual(entry)}
                      aria-label={`Consultar ritual ${entry.name}`}>Consultar ritual <Icon path={mdiArrowTopRight} size={0.7} /></button>
                    : (entry.detail || entry.fields?.length) && (
                      <details>
                        <summary>Consultar detalhes</summary>
                        {entry.fields?.map((field) => (
                          <p key={field.label}>
                            <b>{field.label}</b> {field.value}
                          </p>
                        ))}
                        {entry.detail && <p>{entry.detail}</p>}
                        {entry.variants?.map((variant) => (
                          <p key={variant.label}>
                            <b>{variant.label}</b>{" "}
                            {variant.paragraphs.join(" ")}
                          </p>
                        ))}
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {matches.length > limit && (
            <button
              className="master-order-action"
              type="button"
              onClick={() => setLimit((current) => current + 24)}
            >
              Mostrar mais
            </button>
          )}
        </div>
      </div>
      {selectedRitual && <RitualReader ritual={selectedRitual} onClose={() => setSelectedRitual(null)} />}
    </section>
  );
}

function OrdemParanormal() {
  const [area, setArea] = useState("rituais");
  const rituais = area === "rituais";
  return (
    <div className="om-paranormal">
      <nav className="master-areas" aria-label="Catálogos do Paranormal">
        <button
          type="button"
          aria-current={rituais ? "page" : undefined}
          onClick={() => setArea("rituais")}
        >
          Rituais
        </button>
        <button
          type="button"
          aria-current={!rituais ? "page" : undefined}
          onClick={() => setArea("poderes")}
        >
          Poderes Paranormais
        </button>
      </nav>
      <OrdemCatalog
        key={area}
        title={rituais ? "Rituais de Ordem Paranormal" : "Poderes Paranormais"}
        entries={rituais ? ritualEntries : paranormalPowers}
        unit={rituais ? "rituais" : "poderes"}
        paranormal
      />
    </div>
  );
}

export default function OrdemMasterTools({
  abaIntegrada,
  onImagemFundo,
  podeEditarImagem = true,
}) {
  switch (abaIntegrada) {
    case "fichas":
      return <OrdemSheets />;
    case "habilidades":
      return (
        <OrdemCatalog
          key="habilidades"
          title="Habilidades de Ordem Paranormal"
          entries={abilities}
          unit="habilidades"
        />
      );
    case "paranormal":
      return <OrdemParanormal />;
    case "loja":
      return (
        <OrdemCatalog
          key="acervo"
          title="Acervo de Ordem Paranormal"
          entries={equipmentCatalog}
          unit="itens"
          equipment
        />
      );
    case "inimigos":
      return (
        <OrdemThreats
          onImagemFundo={onImagemFundo}
          podeEditarImagem={podeEditarImagem}
        />
      );
    case "regras":
      return <OrdemRulebook key="regras" />;
    default:
      return null;
  }
}
