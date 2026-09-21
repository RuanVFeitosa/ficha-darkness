import React, { useEffect, useRef, useState } from "react";
import {
  ATTRIBUTES,
  RESOURCES,
  GRADES,
  VERTENTES,
  freshSheet,
  integrityMax,
  creationWarnings,
  resolveRoll,
} from "../data/espiral";
import "../CSS/FichaEspiral.css";

const clamp = (value, max) => Math.max(0, Math.min(max, Number(value) || 0));
const DICE_SYMBOLS = ["△", "⬡", "◇", "⬟", "⬢"];
const randomDie = (sides) => {
  const a = new Uint32Array(1);
  const limit = Math.floor(4294967296 / sides) * sides;
  do {
    window.crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return (a[0] % sides) + 1;
};
function Spiral({ small = false }) {
  const points = Array.from({ length: 500 }, (_, i) => {
    const t = (i / 499) * Math.PI * 9;
    const r = 3 + (i / 499) * 84;
    return `${100 + Math.cos(t) * r},${100 + Math.sin(t) * r}`;
  }).join(" ");
  return (
    <svg
      className={small ? "es-mark" : "es-spiral"}
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={small ? 5 : 0.7}
      />
    </svg>
  );
}
function Field({ label, value, onChange, ...props }) {
  return (
    <label className="es-field">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </label>
  );
}
function Counter({ label, value, max, onChange }) {
  return (
    <div className="es-counter">
      <button
        aria-label={`Diminuir ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <input
        aria-label={label}
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(e.target.value, max))}
      />
      <button
        aria-label={`Aumentar ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
function SectionTitle({ number, title, aside }) {
  return (
    <div className="es-section-title">
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      {aside && <span>{aside}</span>}
    </div>
  );
}

export default function FichaEspiral() {
  const id =
    new URLSearchParams(window.location.search).get("ficha") || "principal";
  const storageKey = `espiral:sheet:v1:${id}`;
  const [sheet, setSheet] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored?.version === 1) return { ...freshSheet(), ...stored };
    } catch {}
    return freshSheet();
  });
  const [saveState, setSaveState] = useState("Salvando…");
  const [tab, setTab] = useState("Visão geral");
  const [editing, setEditing] = useState(false);
  const [attribute, setAttribute] = useState("sentido");
  const [resource, setResource] = useState("Investigação");
  const [difficulty, setDifficulty] = useState(4);
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState([]);
  const [region, setRegion] = useState("Torso");
  const [severity, setSeverity] = useState("Moderada");
  const [injuryNote, setInjuryNote] = useState("");
  const fileInput = useRef(null);
  const [notice, setNotice] = useState("");
  const maximum = integrityMax(sheet.attributes.pulso, sheet.integrityTable);
  const budget = creationWarnings(sheet);
  const update = (key, value) =>
    setSheet((previous) => ({ ...previous, [key]: value }));
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sheet));
      setSaveState("Salvo neste dispositivo");
    } catch {
      setSaveState("Não foi possível salvar. Exporte uma cópia.");
    }
  }, [sheet, storageKey]);
  useEffect(() => {
    document.title = `${sheet.name || "Ficha de personagem"} · ESPIRAL`;
  }, [sheet.name]);
  function changeAttribute(key, stage) {
    setSheet((previous) => {
      const oldMax = integrityMax(
        previous.attributes.pulso,
        previous.integrityTable,
      );
      const nextMax = integrityMax(
        key === "pulso" ? stage : previous.attributes.pulso,
        previous.integrityTable,
      );
      return {
        ...previous,
        attributes: { ...previous.attributes, [key]: stage },
        integrity: clamp(previous.integrity + nextMax - oldMax, nextMax),
      };
    });
  }
  function roll() {
    const sides = sheet.attributes[attribute] * 2 + 2;
    const count = Math.max(1, 1 + sheet.resources[resource] + modifier);
    const pressureCount =
      sheet.pressure +
      (resource === "Controle Mental" && sheet.sanity === 0 ? 1 : 0);
    const result = resolveRoll(
      Array.from({ length: count }, () => randomDie(sides)),
      Array.from({ length: pressureCount }, () => randomDie(6)),
      sides,
      difficulty,
    );
    setHistory((previous) =>
      [
        {
          ...result,
          label: `${ATTRIBUTES[attribute].name} + ${resource}`,
          sides,
        },
        ...previous,
      ].slice(0, 8),
    );
    update("pressure", 0);
  }
  function exportSheet() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(sheet, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `espiral-${id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  async function importSheet(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (
        data.version !== 1 ||
        !Object.keys(ATTRIBUTES).every(
          (k) =>
            Number.isInteger(data.attributes?.[k]) &&
            data.attributes[k] >= 1 &&
            data.attributes[k] <= 5,
        ) ||
        !RESOURCES.every(
          (k) =>
            Number.isInteger(data.resources?.[k]) &&
            data.resources[k] >= 0 &&
            data.resources[k] <= 4,
        ) ||
        !Object.keys(VERTENTES).includes(data.vertente) ||
        !["later", "creation"].includes(data.integrityTable) ||
        ![
          "name",
          "occupation",
          "player",
          "age",
          "purpose",
          "notes",
          "inventory",
          "abilities",
        ].every((k) => typeof data[k] === "string") ||
        !["integrity", "sanity", "hope", "pressure", "failures"].every(
          (k) => Number.isInteger(data[k]) && data[k] >= 0,
        ) ||
        data.integrity >
          integrityMax(data.attributes.pulso, data.integrityTable) ||
        data.sanity > 10 ||
        data.hope > 10 ||
        data.pressure > 20 ||
        data.failures > 3 ||
        !Array.isArray(data.injuries) ||
        !data.injuries.every(
          (i) =>
            typeof i.id === "string" &&
            typeof i.region === "string" &&
            typeof i.severity === "string" &&
            typeof i.note === "string",
        )
      )
        throw new Error();
      setSheet({ ...freshSheet(), ...data });
      setHistory([]);
      setNotice("Ficha importada e salva neste dispositivo.");
    } catch {
      setNotice(
        "Arquivo inválido. Selecione uma ficha JSON exportada pelo ESPIRAL.",
      );
    }
    event.target.value = "";
  }
  const status =
    sheet.failures >= 3
      ? "Morte registrada"
      : sheet.integrity === 0
        ? "Estado crítico"
        : sheet.sanity === 0
          ? "Colapso psicológico"
          : "Em jogo";
  return (
    <div className="espiral-app">
      <header className="es-topbar">
        <a href="/" className="es-brand">
          <Spiral small />
          <span>ESPIRAL</span>
          <span className="es-brand-caption">ARQUIVO DE PERSONAGEM</span>
        </a>
        <span className="es-save" role="status">
          <i />
          {saveState}
        </span>
        <button
          className="es-icon-button"
          onClick={exportSheet}
          title="Exportar ficha JSON"
          aria-label="Exportar ficha JSON"
        >
          ↗
        </button>
      </header>
      <main className="es-main">
        <div className="es-breadcrumb">
          ARQUIVO PESSOAL <span>/</span> {id === "principal" ? "001" : id}{" "}
          <span>/</span> FICHA
        </div>
        <section className="es-hero">
           <div className="es-hero-art">
            <Spiral />
            <span>O QUE RESTA DE VOCÊ?</span>
          </div>

         
          <div className="es-hero-vitals">
            <div className="hero-vital hero-integrity">
              <span>INTEGRIDADE</span>
              <strong>
                {sheet.integrity} / {maximum}
              </strong>
              <div>
                <i style={{ width: `${(sheet.integrity / maximum) * 100}%` }} />
              </div>
            </div>
            <div className="hero-vital hero-sanity">
              <span>SANIDADE</span>
              <div className="hero-dots">
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} className={i < sheet.sanity ? "on" : ""} />
                ))}
              </div>
            </div>
            <div className="hero-vital hero-hope">
              <span>ESPERANÇA</span>
              <div className="hero-dots">
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} className={i < sheet.hope ? "on" : ""} />
                ))}
              </div>
            </div>
          </div>
          <button className="es-edit" onClick={() => setEditing(!editing)}>
            {editing ? "Fechar edição" : "Editar identidade"} <span>↗</span>
          </button>
        </section>
        {editing && (
          <section className="es-editor">
            <Field
              label="Nome do personagem"
              value={sheet.name}
              onChange={(v) => update("name", v)}
              placeholder="Como você se chama?"
            />
            <Field
              label="Ocupação"
              value={sheet.occupation}
              onChange={(v) => update("occupation", v)}
            />
            <Field
              label="Jogador"
              value={sheet.player}
              onChange={(v) => update("player", v)}
            />
            <Field
              label="Idade"
              value={sheet.age}
              onChange={(v) => update("age", v)}
            />
            <label className="es-field">
              <span>Vertente</span>
              <select
                value={sheet.vertente}
                onChange={(e) => update("vertente", e.target.value)}
              >
                {Object.keys(VERTENTES).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="es-field">
              <span>Momento da ficha</span>
              <select
                value={sheet.phase}
                onChange={(e) => update("phase", e.target.value)}
              >
                <option value="creation">Criação</option>
                <option value="campaign">Campanha / adaptação</option>
              </select>
            </label>
          </section>
        )}
        <nav className="es-tabs" aria-label="Seções da ficha">
          {[
            "Visão geral",
            "Corpo & marcas",
            "Habilidades",
            "Inventário",
            "Anotações",
          ].map((name, i) => (
            <button
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              <span>0{i + 1}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="es-layout">
          <div className="es-content">
            {tab === "Visão geral" && (
              <>
                <SectionTitle
                  number="01"
                  title="O que ainda resiste"
                  aside="ESTADO ATUAL"
                />
                <div className="es-vitals">
                  {[
                    ["integrity", "Integridade", maximum, "O corpo persiste."],
                  ].map(([key, label, max, hint]) => (
                    <section key={key} className={`es-vital es-${key}`}>
                      <div className="es-vital-label">
                        {label}
                        <span>↳</span>
                      </div>
                      <div className="es-vital-value">
                        <strong>{String(sheet[key]).padStart(2, "0")}</strong>
                        <span>/ {max}</span>
                      </div>
                      <div className="es-meter">
                        <span
                          style={{ width: `${(sheet[key] / max) * 100}%` }}
                        />
                      </div>
                      <div className="es-vital-bottom">
                        <small>{hint}</small>
                        <Counter
                          label={label}
                          value={sheet[key]}
                          max={max}
                          onChange={(v) => update(key, v)}
                        />
                      </div>
                    </section>
                  ))}
                  {[
                    ["sanity", "Sanidade"],
                    ["hope", "Esperança"],
                  ].map(([key, label]) => (
                    <section
                      key={key}
                      className={`es-vital es-${key} es-vital-dots`}
                    >
                      <div className="es-vital-label">
                        {label}
                        <span>{key === "sanity" ? "◈" : "✳"}</span>
                      </div>
                      <div className="es-dot-line">
                        {Array.from({ length: 10 }, (_, index) => (
                          <button
                            type="button"
                            key={index}
                            aria-label={`${label} ${index + 1}`}
                            className={index < sheet[key] ? "filled" : ""}
                            onClick={() =>
                              update(
                                key,
                                index < sheet[key] ? index : index + 1,
                              )
                            }
                          />
                        ))}
                      </div>
                      <div className="es-vital-bottom">
                        <small>10 pontos</small>
                        <strong>{sheet[key]}/10</strong>
                      </div>
                    </section>
                  ))}
                </div>
                {(sheet.integrity === 0 ||
                  sheet.sanity === 0 ||
                  sheet.hope === 0) && (
                  <p className="es-alert">
                    {sheet.integrity === 0 &&
                      "Estado crítico: teste Pulso + Propósito ao fim da rodada. "}
                    {sheet.sanity === 0 &&
                      "Sanidade zero: Ruptura imediata; Controle Mental recebe +1d6 de Pressão. "}
                    {sheet.hope === 0 &&
                      "Esperança esgotada: consulte as consequências com o mestre."}
                  </p>
                )}
                <SectionTitle
                  number="02"
                  title="Atributos"
                  aside="COMO VOCÊ ENFRENTA O MUNDO"
                />
                <div className="es-attributes">
                  {Object.entries(ATTRIBUTES).map(([key, attr], index) => (
                    <div
                      className={`es-attribute ${attribute === key ? "selected" : ""}`}
                      key={key}
                    >
                      <div className="es-attribute-top">
                        <span>0{index + 1}</span>
                        <button
                          onClick={() => setAttribute(key)}
                          aria-label={`Usar ${attr.name} na rolagem`}
                        >
                          ↗
                        </button>
                      </div>
                      <h3>{attr.name}</h3>
                      <div className="es-die">
                        <i>{DICE_SYMBOLS[sheet.attributes[key] - 1]}</i>
                        <strong>d{sheet.attributes[key] * 2 + 2}</strong>
                      </div>
                      <select
                        aria-label={`Estágio de ${attr.name}`}
                        value={sheet.attributes[key]}
                        onChange={(e) =>
                          changeAttribute(key, Number(e.target.value))
                        }
                      >
                        {attr.stages.map((stage, i) => (
                          <option key={stage} value={i + 1}>
                            {stage} · d{i * 2 + 4}
                          </option>
                        ))}
                      </select>
                      <p>{attr.hint}</p>
                    </div>
                  ))}
                </div>
                <SectionTitle
                  number="03"
                  title="Recursos"
                  aside="O QUE A EXPERIÊNCIA DEIXOU"
                />
                <div className="es-resources">
                  {RESOURCES.map((name, i) => (
                    <div className="es-resource" key={name}>
                      <button
                        className={resource === name ? "active" : ""}
                        onClick={() => setResource(name)}
                      >
                        {name}
                        {i >= 12 && <small>RESISTÊNCIA</small>}
                      </button>
                      <select
                        aria-label={`Grau de ${name}`}
                        value={sheet.resources[name]}
                        onChange={(e) =>
                          update("resources", {
                            ...sheet.resources,
                            [name]: Number(e.target.value),
                          })
                        }
                      >
                        {GRADES.map((g, grade) => (
                          <option value={grade} key={g}>
                            {["0", "I", "II", "III", "IV"][grade]} · {g}
                          </option>
                        ))}
                      </select>
                      <span className="es-resource-dots" aria-hidden="true">
                        {[1, 2, 3, 4].map((n) => (
                          <i
                            key={n}
                            className={
                              n <= sheet.resources[name] ? "filled" : ""
                            }
                          />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
                {sheet.phase === "creation" && (
                  <details className="es-rules">
                    <summary>
                      Distribuição inicial{" "}
                      <span>
                        {budget.spent}/6 atributos · {budget.resourceSpent}/10
                        recursos
                      </span>
                    </summary>
                    {budget.messages.map((m) => (
                      <p key={m}>{m}</p>
                    ))}
                    <p>
                      Escolha duas habilidades. Controle Mental e Propósito
                      ficam fora dos 10 pontos convencionais; o livro não define
                      claramente seu orçamento inicial. Combine os graus com o
                      mestre.
                    </p>
                  </details>
                )}
              </>
            )}
            {tab === "Corpo & marcas" && (
              <>
                <SectionTitle
                  number="04"
                  title="O corpo lembra"
                  aside="LESÕES & SOBREVIVÊNCIA"
                />
                <p className="es-description">
                  Integridade mede o que você ainda suporta. Lesões registram o
                  que aconteceu.
                </p>
                <div className="es-injury-form">
                  <label className="es-field">
                    <span>Região</span>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      {[
                        "Cabeça",
                        "Torso",
                        "Braço esquerdo",
                        "Braço direito",
                        "Perna esquerda",
                        "Perna direita",
                      ].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label className="es-field">
                    <span>Gravidade</span>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      {[
                        "Superficial",
                        "Moderada",
                        "Grave",
                        "Crítica",
                        "Catastrófica / Fatal",
                      ].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Descrição da lesão"
                    value={injuryNote}
                    onChange={setInjuryNote}
                    placeholder="O que deixou essa marca?"
                  />
                  <button
                    className="es-primary"
                    onClick={() => {
                      update("injuries", [
                        ...sheet.injuries,
                        {
                          id: window.crypto.randomUUID(),
                          region,
                          severity,
                          note: injuryNote,
                        },
                      ]);
                      setInjuryNote("");
                    }}
                  >
                    Registrar lesão +
                  </button>
                </div>
                <p className="es-help">
                  Impacto: 1–3 superficial · 4–6 moderada · 7–9 grave · 10–12
                  crítica · 13+ catastrófica / fatal. Ajuste a Integridade pelo
                  impacto recebido.
                </p>
                {sheet.injuries.length === 0 ? (
                  <div className="es-empty">
                    Nenhuma lesão registrada.
                    <small>Por enquanto, seu corpo guarda silêncio.</small>
                  </div>
                ) : (
                  sheet.injuries.map((injury) => (
                    <div className="es-injury" key={injury.id}>
                      <div>
                        <span>
                          {injury.region} / {injury.severity}
                        </span>
                        <p>{injury.note || "Sem descrição."}</p>
                      </div>
                      <button
                        aria-label={`Remover lesão em ${injury.region}`}
                        onClick={() =>
                          update(
                            "injuries",
                            sheet.injuries.filter((i) => i.id !== injury.id),
                          )
                        }
                      >
                        Remover
                      </button>
                    </div>
                  ))
                )}
                <div className="es-rule-card">
                  <h3>Falhas de sobrevivência</h3>
                  <Counter
                    label="Falhas de sobrevivência"
                    value={sheet.failures}
                    max={3}
                    onChange={(v) => update("failures", v)}
                  />
                  <p>
                    Ao acumular 3 falhas, o personagem morre. Um sucesso comum
                    não remove o estado crítico.
                  </p>
                </div>
              </>
            )}
            {tab === "Habilidades" && (
              <>
                <SectionTitle
                  number="04"
                  title="O que você aprendeu"
                  aside="VERTENTE & HABILIDADES"
                />
                <div className="es-rule-card">
                  <span className="es-eyebrow">{sheet.vertente} · NÍVEL I</span>
                  <h3>{VERTENTES[sheet.vertente][0]}</h3>
                  <p>{VERTENTES[sheet.vertente][1]}</p>
                </div>
                <label className="es-writing">
                  <span>Habilidades escolhidas</span>
                  <p>
                    Comece com duas. Registre nome, nível, ação, efeito e custo
                    de Esperança. Habilidades de legado podem ser adaptadas com
                    o mestre.
                  </p>
                  <textarea
                    value={sheet.abilities}
                    onChange={(e) => update("abilities", e.target.value)}
                    placeholder="01 / Nome da habilidade — Nível I\nAção: …\nEfeito: …\nCusto: …\n\n02 / Nome da habilidade — Nível I"
                  />
                </label>
                <p className="es-help">
                  Quando houver custo, o teste de Propósito determina a perda de
                  Esperança: primeiro valor na falha, segundo no sucesso com
                  consequência, zero no sucesso. A habilidade acontece
                  independentemente do resultado.
                </p>
              </>
            )}
            {tab === "Inventário" && (
              <>
                <SectionTitle
                  number="04"
                  title="O que você carrega"
                  aside="EQUIPAMENTO & PERTENCES"
                />
                <label className="es-writing">
                  <span>Inventário pessoal</span>
                  <p>
                    Registre armas, dano, munição, proteção, ferramentas e
                    objetos importantes.
                  </p>
                  <textarea
                    value={sheet.inventory}
                    onChange={(e) => update("inventory", e.target.value)}
                    placeholder="O essencial. O que pesa. O que você não consegue deixar para trás."
                  />
                </label>
              </>
            )}
            {tab === "Anotações" && (
              <>
                <SectionTitle
                  number="04"
                  title="Para não esquecer"
                  aside="MEMÓRIA & IDENTIDADE"
                />
                <label className="es-writing">
                  <span>Seu motivo para continuar</span>
                  <textarea
                    className="es-short-text"
                    value={sheet.purpose}
                    onChange={(e) => update("purpose", e.target.value)}
                    placeholder="Quem ou o que ainda faz você seguir em frente?"
                  />
                </label>
                <label className="es-writing">
                  <span>Notas da história</span>
                  <textarea
                    value={sheet.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Vínculos, pistas, perdas. As coisas que permanecem."
                  />
                </label>
              </>
            )}
          </div>
          <aside className="es-sidebar">
            <section className="es-roll-panel">
              <div className="es-eyebrow">
                DIANTE DO INCERTO <span>↗</span>
              </div>
              <h2>Faça sua escolha.</h2>
              <p>A intenção vem antes dos dados.</p>
              <label className="es-field">
                <span>Atributo</span>
                <select
                  value={attribute}
                  onChange={(e) => setAttribute(e.target.value)}
                >
                  {Object.entries(ATTRIBUTES).map(([k, a]) => (
                    <option key={k} value={k}>
                      {a.name} · d{sheet.attributes[k] * 2 + 2}
                    </option>
                  ))}
                </select>
              </label>
              <label className="es-field">
                <span>Recurso</span>
                <select
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                >
                  {RESOURCES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="es-roll-numbers">
                <Field
                  label="Dificuldade"
                  type="number"
                  min="2"
                  max="30"
                  value={difficulty}
                  onChange={(v) => setDifficulty(Math.max(2, clamp(v, 30)))}
                />
                <Field
                  label="Bônus / penalidade"
                  type="number"
                  min="-10"
                  max="10"
                  value={modifier}
                  onChange={(v) =>
                    setModifier(Math.max(-10, Math.min(10, Number(v) || 0)))
                  }
                />
              </div>
              <div className="es-pressure">
                <div>
                  <span>Pressão</span>
                  <small>Dados d6 adicionais</small>
                </div>
                <Counter
                  label="Dados de Pressão"
                  value={sheet.pressure}
                  max={20}
                  onChange={(v) => update("pressure", v)}
                />
              </div>
              <div className="es-pool">
                <span>RESERVA</span>
                <strong>
                  {Math.max(1, 1 + sheet.resources[resource] + modifier)}d
                  {sheet.attributes[attribute] * 2 + 2}
                  {sheet.pressure > 0 && <em> + {sheet.pressure}d6</em>}
                </strong>
              </div>
              <button className="es-primary" onClick={roll}>
                Rolar os dados <span>↗</span>
              </button>
              <small className="es-roll-help">
                O maior dado define o resultado.
                <br />A Pressão é consumida ao rolar.
              </small>
              {history[0] && (
                <div className="es-result" role="status">
                  <span className="es-eyebrow">ÚLTIMA ROLAGEM</span>
                  <h3>{history[0].outcome}</h3>
                  <div className="es-result-dice">
                    {history[0].dice.map((d, i) => (
                      <span key={`d${i}`}>{d}</span>
                    ))}
                    {history[0].pressure.map((d, i) => (
                      <span className="pressure" key={`p${i}`}>
                        {d}
                      </span>
                    ))}
                  </div>
                  <p>
                    Maior: {history[0].best} · Margem:{" "}
                    {history[0].margin > 0 ? "+" : ""}
                    {history[0].margin}
                  </p>
                  <p>
                    {history[0].stress}
                    {history[0].mastery ? " · Domínio" : ""}
                  </p>
                  {history[0].stress !== "Controle" && (
                    <small>
                      Resolva a consequência de{" "}
                      {history[0].stress.toLowerCase()} com o mestre. Em
                      Ruptura, retire 2 de Sanidade ou Esperança.
                    </small>
                  )}
                </div>
              )}
            </section>
            <section className="es-purpose">
              <span className="es-eyebrow">UM FIO AINDA TE PRENDE.</span>
              <p>
                {sheet.purpose ||
                  "O que faz você continuar quando tudo pede para parar?"}
              </p>
              <button onClick={() => setTab("Anotações")}>
                {sheet.purpose
                  ? "Revisitar seu propósito"
                  : "Escrever meu propósito"}{" "}
                ↗
              </button>
            </section>
          </aside>
        </div>
        <details className="es-rules es-settings">
          <summary>
            Referência de regras & arquivo{" "}
            <span>ESPIRAL / PRIMEIRA EDIÇÃO DA FICHA</span>
          </summary>
          <p>
            Atributos e recursos: pp. 7–38. Lesões: pp. 39–48. Vertentes e
            habilidades: pp. 49–75. Pressão: pp. 145–155.
          </p>
          <label className="es-field">
            <span>
              Tabela de Integridade (o livro apresenta valores divergentes)
            </span>
            <select
              value={sheet.integrityTable}
              onChange={(e) => {
                const table = e.target.value;
                const next = integrityMax(sheet.attributes.pulso, table);
                setSheet((p) => ({
                  ...p,
                  integrityTable: table,
                  integrity: clamp(p.integrity + next - maximum, next),
                }));
              }}
            >
              <option value="later">
                12 / 15 / 18 / 21 / 24 — progressão, p. 163
              </option>
              <option value="creation">
                30 / 35 / 40 / 45 / 50 — criação, p. 40
              </option>
            </select>
          </label>
          <p>
            Salvamento local por identificador de ficha. Use a exportação para
            guardar ou transferir seus dados. Os registros do Darkness continuam
            separados.
          </p>
          <div className="es-file-actions">
            <button onClick={exportSheet}>Exportar JSON ↗</button>
            <button onClick={() => fileInput.current.click()}>
              Importar JSON ↙
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={importSheet}
            />
            <a href="?sistema=darkness">Abrir sistema anterior ↗</a>
          </div>
          <p role="status">{notice}</p>
        </details>
        <footer className="es-footer">
          <span>
            ESPIRAL <b>/</b> REGISTRO {id === "principal" ? "001" : id}
          </span>
          <span>VOCÊ AINDA ESTÁ AQUI.</span>
        </footer>
      </main>
    </div>
  );
}
