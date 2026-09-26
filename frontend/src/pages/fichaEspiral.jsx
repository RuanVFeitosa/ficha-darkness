import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import {
  ATTRIBUTES,
  RESOURCES,
  GRADES,
  VERTENTES,
  TEMA_PADRAO_ESPIRAL,
  freshSheet,
  integrityMax,
  creationWarnings,
  parseDiceFormula,
  resolveRoll,
} from "../data/espiral";
import "../CSS/FichaEspiral.css";
import "../CSS/InventarioEspiral.css";
import { compressProfileImage } from "../services/imageCompression";
import { buscarPersonagem } from "../services/personagemApi";
import { obterIconeItem } from "../utils/itemIcons";
import { convertDarknessToEspiral } from "../utils/darknessToEspiral";
import { selecionarDialogo, solicitarDialogo } from "../components/DialogoGlobal";
import { APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES, HABILIDADES_ESPIRAL } from "../data/habilidadesEspiral";

const clamp = (value, max) => Math.max(0, Math.min(max, Number(value) || 0));
const randomDie = (sides) => {
  if (!window.crypto?.getRandomValues)
    return Math.floor(Math.random() * sides) + 1;
  const a = new Uint32Array(1);
  const limit = Math.floor(4294967296 / sides) * sides;
  do {
    window.crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return (a[0] % sides) + 1;
};
const DieGlyph = ({ sides, label = true }) => (
  <i className={`es-die-glyph die-d${sides}`} data-sides={sides} aria-label={label ? `d${sides}` : undefined} title={label ? `d${sides}` : undefined} />
);
const uniqueId = () =>
  window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const storedEspiralSheet = (id) => {
  try {
    const current = JSON.parse(localStorage.getItem(`espiral:sheet:v1:${id}`));
    if (current?.version === 1) return { ...freshSheet(), ...current };
    const previous = JSON.parse(localStorage.getItem(`espiral:sheet:v1:darkness-${id}`));
    if (previous?.version === 1) return { ...freshSheet(), ...previous };
  } catch {}
  return null;
};
const isUnlinkedBlankSheet = (sheet) =>
  !sheet?.migratedFrom && !sheet?.name && !sheet?.profileImage &&
  !sheet?.occupation && !sheet?.player && !sheet?.inventory && !sheet?.abilities &&
  !(sheet?.injuries || []).length &&
  Object.values(sheet?.resources || {}).every((grade) => Number(grade) === 0);
const legacyImportsInProgress = new Set();
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
        aria-label={typeof label === "string" ? label : "Bônus / penalidade"}
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
const BODY_REGIONS = [
  "Cabeça",
  "Torso",
  "Braço esquerdo",
  "Braço direito",
  "Perna esquerda",
  "Perna direita",
];
const injuryLevel = {
  Superficial: 1,
  Moderada: 2,
  Grave: 3,
  Crítica: 3,
  "Catastrófica / Fatal": 4,
};
function BodyMap({ injuries, protections, selectedRegion, onSelect }) {
  const levelFor = (region) =>
    Math.max(
      0,
      ...injuries
        .filter((injury) => injury.region === region)
        .map((injury) => injuryLevel[injury.severity] || 0),
    );
  const normalizeRegion = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const protectionsFor = (region) => {
    const target = normalizeRegion(region);
    return protections.filter((protection) => {
      const protectedRegions = normalizeRegion(protection.region);
      if (target.includes("cabeca")) return protectedRegions.includes("cabeca");
      if (target.includes("torso")) return protectedRegions.includes("torso");
      if (target.includes("braco")) return protectedRegions.includes("braco");
      if (target.includes("perna")) return protectedRegions.includes("perna");
      return false;
    });
  };
  const protectionMarks = (region, x, y, textAnchor = "middle") => {
    const equipped = protectionsFor(region);
    if (!equipped.length) return null;
    return (
      <g className="es-body-protection-marks" aria-label={`Proteções de ${region}`}>
        {equipped.map((protection, index) => (
          <text
            key={protection.id || `${region}-${protection.name}-${index}`}
            x={x}
            y={y + index * 19}
            textAnchor={textAnchor}
          >
            <title>{protection.name || "Proteção"}</title>
            PROT {protection.value || "0"}
          </text>
        ))}
      </g>
    );
  };
  const part = (region, shape, labelX, labelY) => (
    <g
      key={region}
      className={`es-body-part level-${levelFor(region)} ${selectedRegion === region ? "selected" : ""}`}
      role="button"
      tabIndex="0"
      aria-label={`Selecionar ${region}${levelFor(region) ? ", lesionado" : ", saudável"}`}
      onClick={() => onSelect(region)}
      onKeyDown={(event) =>
        (event.key === "Enter" || event.key === " ") && onSelect(region)
      }
    >
      {shape}
      <text x={labelX} y={labelY}>
        {region.replace(" esquerdo", " esq.").replace(" direito", " dir.")}
      </text>
    </g>
  );
  return (
    <div className="es-body-map">
      <div className="es-body-map-heading">
        <span>MAPA CORPORAL</span>
        <small>Clique em uma região para registrar uma lesão</small>
      </div>
      <svg
        viewBox="-95 -22 520 594"
        role="img"
        aria-label="Mapa corporal interativo com regiões de lesão"
      >
        {part(
          "Cabeça",
          <ellipse
            className="es-body-shape"
            cx="165"
            cy="58"
            rx="31"
            ry="42"
          />,
          165,
          18,
        )}
        {part(
          "Torso",
          <path
            className="es-body-shape"
            d="M130 104 Q112 113 108 155 L113 292 Q122 337 165 350 Q208 337 217 292 L222 155 Q218 113 200 104 Q165 120 130 104Z"
          />,
          165,
          220,
        )}
        {part(
          "Braço esquerdo",
          <path
            className="es-body-shape"
            d="M119 122 Q98 126 91 156 L73 279 Q70 317 87 345 L103 338 L96 278 L113 178 L130 145Z"
          />,
          48,
          238,
        )}
        {part(
          "Braço direito",
          <path
            className="es-body-shape"
            d="M211 122 Q232 126 239 156 L257 279 Q260 317 243 345 L227 338 L234 278 L217 178 L200 145Z"
          />,
          282,
          238,
        )}
        {part(
          "Perna esquerda",
          <path
            className="es-body-shape"
            d="M130 337 Q119 365 121 425 L126 508 Q127 528 148 529 L158 523 L151 502 L157 414 L164 356Z"
          />,
          88,
          428,
        )}
        {part(
          "Perna direita",
          <path
            className="es-body-shape"
            d="M200 337 Q211 365 209 425 L204 508 Q203 528 182 529 L172 523 L179 502 L173 414 L166 356Z"
          />,
          242,
          428,
        )}
        {protectionMarks("Cabeça", 165, 2)}
        {protectionMarks("Torso", 165, 252)}
        {protectionMarks("Braço esquerdo", 65, 176, "end")}
        {protectionMarks("Braço direito", 265, 176, "start")}
        {protectionMarks("Perna esquerda", 115, 420, "end")}
        {protectionMarks("Perna direita", 215, 420, "start")}
      <div className="es-body-protection-summary" aria-label="Proteções equipadas">
        <span>PROTEÇÕES EQUIPADAS</span>
        {protections.length ? (
          protections.map((protection, index) => (
            <div key={protection.id || `${protection.name}-${index}`}>
              <strong>{protection.name || "Proteção"}</strong>
              <small>{protection.region || "Região não informada"} · PROT {protection.value || "0"}</small>
            </div>
          ))
        ) : (
          <small>Nenhuma proteção equipada.</small>
        )}
      </div>
      </svg>
      <div className="es-body-legend">
        <span>
          <i className="healthy" />
          Saudável
        </span>
        <span>
          <i className="moderate" />
          Moderada
        </span>
        <span>
          <i className="severe" />
          Grave / crítica
        </span>
        <span>
          <i className="fatal" />
          Catastrófica / fatal
        </span>
      </div>
    </div>
  );
}

export default function FichaEspiral() {
  const idFromUrl = new URLSearchParams(window.location.search).get("ficha");
  const id = idFromUrl || "principal";
  const storageKey = `espiral:sheet:v1:${id}`;
  const initialStoredSheet = useRef(storedEspiralSheet(id));
  const [sheet, setSheet] = useState(() => initialStoredSheet.current || freshSheet());
  const [saveState, setSaveState] = useState("Salvando…");
  const [tab, setTab] = useState("Visão geral");
  const [editing, setEditing] = useState(false);
  const [attribute, setAttribute] = useState("sentido");
  const [resource, setResource] = useState("Investigação");
  const [difficulty, setDifficulty] = useState(4);
  const [modifier, setModifier] = useState(0);
  const [extraDiceCount, setExtraDiceCount] = useState(0);
  const [extraDiceSides, setExtraDiceSides] = useState(6);
  const [history, setHistory] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [rollModalOpen, setRollModalOpen] = useState(false);
  const [resourceToRoll, setResourceToRoll] = useState(null);
  const [attributeToRoll, setAttributeToRoll] = useState("sentido");
  const [customFormula, setCustomFormula] = useState("1d20");
  const [formulaError, setFormulaError] = useState("");
  const [region, setRegion] = useState("Torso");
  const [severity, setSeverity] = useState("Moderada");
  const [injuryNote, setInjuryNote] = useState("");
  const fileInput = useRef(null);
  const profileInput = useRef(null);
  const [notice, setNotice] = useState("");
  const maximum = integrityMax(sheet.attributes.pulso, sheet.integrityTable);
  const fichaDarkness = sheet.migratedFrom === "darkness"
    ? sheet.migratedFromId || (id.startsWith("darkness-") ? id.slice("darkness-".length) : "")
    : "";
  const budget = creationWarnings(sheet);
  const defense = sheet.attributes.sentido + 2;
  const weapons = Array.isArray(sheet.weapons) ? sheet.weapons : [];
  const protections = Array.isArray(sheet.protections) ? sheet.protections : [];
  const temporaryBonusesFor = (resourceName, source = sheet) =>
    Array.isArray(source.temporaryResources?.[resourceName])
      ? source.temporaryResources[resourceName].filter(
          (bonus) => Number.isInteger(bonus?.rollsRemaining) && bonus.rollsRemaining > 0,
        )
      : [];
  const temporaryGradeFor = (resourceName, source = sheet) =>
    temporaryBonusesFor(resourceName, source).length;
  const abilityProgress = Array.isArray(sheet.abilityProgress) && sheet.abilityProgress.length === 2
    ? sheet.abilityProgress
    : [{ name: "", detail: "", level: 1 }, { name: "", detail: "", level: 1 }];
  const acquiredAbilities = Array.isArray(sheet.evolution?.abilities)
    ? sheet.evolution.abilities
    : [];
  const update = (key, value) =>
    setSheet((previous) => ({ ...previous, [key]: value }));
  const atualizarTemaFicha = (campo, valor) =>
    setSheet((previous) => ({
      ...previous,
      temaFicha: { ...TEMA_PADRAO_ESPIRAL, ...(previous.temaFicha || {}), [campo]: valor },
    }));
  const restaurarTemaPadrao = () => update("temaFicha", { ...TEMA_PADRAO_ESPIRAL });
  const restaurarCorPadrao = (campo) => atualizarTemaFicha(campo, TEMA_PADRAO_ESPIRAL[campo]);
  const abrirSistemaAnterior = () => {
    window.location.href = fichaDarkness
      ? `/?sistema=darkness&ficha=${encodeURIComponent(fichaDarkness)}&senha=${encodeURIComponent(fichaDarkness)}`
      : "/?sistema=darkness";
  };
  useEffect(() => {
    const shouldImport = idFromUrl &&
      (!initialStoredSheet.current || isUnlinkedBlankSheet(initialStoredSheet.current));
    if (!shouldImport || legacyImportsInProgress.has(id)) return undefined;
    legacyImportsInProgress.add(id);
    const importarDarkness = async () => {
      let legacyCharacter = null;
      try {
        legacyCharacter = await buscarPersonagem(id);
      } catch {
        try {
          legacyCharacter = JSON.parse(localStorage.getItem(`fichaRPG_personagem_${id}`));
        } catch {}
      }
      if (!legacyCharacter) {
        legacyImportsInProgress.delete(id);
        return;
      }
      const hasLegacyData = legacyCharacter.nome ||
        Object.values(legacyCharacter.atributos || {}).some((value) => Number(value) > 0) ||
        (legacyCharacter.inventario || []).length > 0;
      if (!hasLegacyData) {
        legacyImportsInProgress.delete(id);
        return;
      }
      const pulseSource = await selecionarDialogo(
        "Escolha qual atributo antigo define o Pulso desta ficha ESPIRAL.",
        { titulo: "Definir Pulso", valorInicial: "forca", opcoes: [
          { valor: "forca", rotulo: `Força (${legacyCharacter.atributos?.forca || 0})` },
          { valor: "fonitude", rotulo: `Fortitude (${legacyCharacter.atributos?.fonitude || 0})` },
        ] },
      );
      if (!pulseSource) {
        legacyImportsInProgress.delete(id);
        return;
      }
      setSheet(convertDarknessToEspiral({ ...legacyCharacter, fichaId: id }, { pulseSource }));
      setNotice("Ficha Darkness vinculada e adaptada automaticamente.");
    };
    importarDarkness();
  }, [id, idFromUrl]);
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
  const updateEquipment = (key, id, field, value) =>
    update(
      key,
      (Array.isArray(sheet[key]) ? sheet[key] : []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  const removeEquipment = (key, id) =>
    update(
      key,
      (Array.isArray(sheet[key]) ? sheet[key] : []).filter(
        (item) => item.id !== id,
      ),
    );
  async function addTemporaryResourceGrade(resourceName) {
    const answer = await solicitarDialogo(
      `Por quantas rolagens de teste o grau temporário de ${resourceName} ficará ativo?`,
      {
        titulo: `Grau temporário · ${resourceName}`,
        placeholder: "Ex.: 3",
        confirmarTexto: "Aplicar grau",
      },
    );
    if (answer === null) return;
    const rollsRemaining = Number(answer);
    if (!Number.isInteger(rollsRemaining) || rollsRemaining < 1 || rollsRemaining > 99) {
      setNotice("Informe um número inteiro entre 1 e 99 rolagens.");
      return;
    }
    setSheet((previous) => ({
      ...previous,
      temporaryResources: {
        ...(previous.temporaryResources || {}),
        [resourceName]: [
          ...temporaryBonusesFor(resourceName, previous),
          { id: uniqueId(), rollsRemaining },
        ],
      },
    }));
    setNotice(`+1 grau temporário em ${resourceName} por ${rollsRemaining} rolagem(ns).`);
  }
  async function importProfileImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Selecione um arquivo de imagem para o retrato.");
      return;
    }
    try {
      setNotice("Preparando foto de perfil…");
      update("profileImage", await compressProfileImage(file));
      setNotice("Foto de perfil atualizada.");
    } catch (error) {
      setNotice(error?.message || "Não foi possível preparar esta imagem.");
    }
  }
  function roll(resourceOverride = resource, attributeOverride = attribute) {
    if (rolling) return;
    setResource(resourceOverride);
    setAttribute(attributeOverride);
    const sides = sheet.attributes[attributeOverride] * 2 + 2;
    const temporaryGrade = temporaryGradeFor(resourceOverride);
    const count = Math.max(
      1,
      1 + sheet.resources[resourceOverride] + temporaryGrade + modifier,
    );
    const pressureCount =
      sheet.pressure +
      (resourceOverride === "Controle Mental" && sheet.sanity === 0 ? 1 : 0);
    const extra = Array.from({ length: extraDiceCount }, () =>
      randomDie(extraDiceSides),
    );
    const baseResult = resolveRoll(
      Array.from({ length: count }, () => randomDie(sides)),
      Array.from({ length: pressureCount }, () => randomDie(6)),
      sides,
      difficulty,
    );
    const best = Math.max(baseResult.best, ...extra);
    const margin = best - difficulty;
    const result = {
      ...baseResult,
      extra,
      extraSides: extraDiceSides,
      best,
      margin,
      outcome:
        margin <= -3
          ? "Falha grave"
          : margin < 0
            ? "Falha"
            : margin === 0
              ? "Sucesso com consequência"
              : margin < 3
                ? "Sucesso"
                : "Sucesso excepcional",
    };
    setRolling(true);
    setHistory((previous) =>
      [
        {
          ...result,
          label: `${ATTRIBUTES[attributeOverride].name} + ${resourceOverride}`,
          attribute: attributeOverride,
          sides,
          type: "test",
          at: Date.now(),
        },
        ...previous,
      ].slice(0, 12),
    );
    setRollModalOpen(true);
    if (temporaryGrade) {
      setSheet((previous) => {
        const nextBonuses = temporaryBonusesFor(resourceOverride, previous)
          .map((bonus) => ({ ...bonus, rollsRemaining: bonus.rollsRemaining - 1 }))
          .filter((bonus) => bonus.rollsRemaining > 0);
        const temporaryResources = { ...(previous.temporaryResources || {}) };
        if (nextBonuses.length) temporaryResources[resourceOverride] = nextBonuses;
        else delete temporaryResources[resourceOverride];
        return { ...previous, temporaryResources };
      });
    }
    update("pressure", 0);
    window.setTimeout(() => setRolling(false), 650);
  }
  function rollFormula() {
    if (rolling) return;
    const parsed = parseDiceFormula(customFormula);
    if (!parsed) {
      setFormulaError(
        "Use 1d4 a 50d100, com modificador opcional (ex.: 2d6+3).",
      );
      return;
    }
    setFormulaError("");
    const dice = Array.from({ length: parsed.amount }, () =>
      randomDie(parsed.sides),
    );
    setRolling(true);
    setHistory((previous) =>
      [
        {
          type: "formula",
          label: parsed.formula,
          dice,
          sides: parsed.sides,
          pressure: [],
          total: dice.reduce((sum, die) => sum + die, parsed.modifier),
          modifier: parsed.modifier,
          at: Date.now(),
        },
        ...previous,
      ].slice(0, 12),
    );
    window.setTimeout(() => setRolling(false), 650);
  }
  function rollWeaponDamage(weapon) {
    if (rolling) return;
    const parsed = parseDiceFormula(weapon.damage);
    if (!parsed) {
      setNotice(`Dano inválido para ${weapon.name || "a arma"}. Use uma fórmula como 1d8 ou 2d6+2.`);
      return;
    }
    setNotice("");
    const dice = Array.from({ length: parsed.amount }, () => randomDie(parsed.sides));
    setRolling(true);
    setHistory((previous) => [{ type: "formula", label: `${weapon.name || "Dano"} · ${parsed.formula}`, dice, sides: parsed.sides, pressure: [], total: dice.reduce((sum, die) => sum + die, parsed.modifier), modifier: parsed.modifier, at: Date.now() }, ...previous].slice(0, 12));
    setRollModalOpen(true);
    window.setTimeout(() => setRolling(false), 650);
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
        (data.temporaryResources !== undefined &&
          (typeof data.temporaryResources !== "object" ||
            data.temporaryResources === null ||
            !Object.entries(data.temporaryResources).every(
              ([resourceName, bonuses]) =>
                RESOURCES.includes(resourceName) &&
                Array.isArray(bonuses) &&
                bonuses.every(
                  (bonus) =>
                    Number.isInteger(bonus?.rollsRemaining) &&
                    bonus.rollsRemaining > 0 &&
                    bonus.rollsRemaining <= 99,
                ),
            ))) ||
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
        (data.profileImage !== undefined &&
          typeof data.profileImage !== "string") ||
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
  const inventarioVisual = [
    ...(sheet.weapons || []).map((item) => ({ icon: "▰", name: item.name, detail: item.damage || "Arma" })),
    ...(sheet.protections || []).map((item) => ({ icon: "⬡", name: item.name, detail: item.value ? `Proteção ${item.value}` : "Proteção" })),
    ...String(sheet.inventory || "").split("\n").map((item) => item.trim()).filter(Boolean).map((name) => ({ icon: "◆", name, detail: "Equipamento" })),
  ];
  return (
    <div
      className="espiral-app"
      style={{
        "--es-accent": sheet.temaFicha?.primaria,
        "--es-surface": sheet.temaFicha?.secundaria,
        "--es-text": sheet.temaFicha?.texto,
        "--es-bg": sheet.temaFicha?.fundo,
        "--es-line": sheet.temaFicha?.borda,
      }}
    >
      <header className="es-topbar">
        <a href="/" className="es-brand">
          <Spiral small />
          <span>ESPIRAL</span>
          <span className="es-brand-caption">
            {[sheet.pronoun || sheet.player, sheet.name, sheet.vertente]
              .filter(Boolean)
              .join(" · ") || "NOME DO PERSONAGEM"}
          </span>
        </a>
        <span className="es-save" role="status">
          <i />
          {saveState}
        </span>
        <a className="es-store-link" href={`?lojaEspiral=1&ficha=${encodeURIComponent(id)}`}>Loja da Helena</a>
        <a className="es-store-link" href={`?transformacao=1&ficha=${encodeURIComponent(id)}`}>Transformação</a>
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
          <aside className="es-attribute-rail" aria-label="Atributos">
            <div className="es-rail-attributes">
              {Object.entries(ATTRIBUTES).map(([key, attr]) => {
                const stage = sheet.attributes[key];
                return (
                  <label
                    className={`es-rail-attribute ${attribute === key ? "selected" : ""}`}
                    key={key}
                  >
                    <span className="es-rail-name">{attr.name}</span>
                    <select
                      aria-label={`Estágio de ${attr.name}`}
                      value={stage}
                      onChange={(e) =>
                        changeAttribute(key, Number(e.target.value))
                      }
                      onFocus={() => setAttribute(key)}
                    >
                      {attr.stages.map((stage, i) => (
                        <option key={stage} value={i + 1}>
                          {stage} · {i * 2 + 4}
                        </option>
                      ))}
                    </select>
                    <b
                      className={`es-rail-value die-d${stage * 2 + 2}`}
                      aria-hidden="true"
                    >
                      {stage * 2 + 2}
                    </b>
                    <small className="es-rail-stage">ESTÁGIO {stage}</small>
                    <em className="es-rail-detail">
                      {attr.stages[stage - 1]}
                    </em>
                  </label>
                );
              })}
            </div>
          </aside>
          <div className="es-hero-art">
            <Spiral />
            <div className="es-profile-photo-shell">
              <button
                className="es-profile-photo"
                type="button"
                onClick={() => profileInput.current?.click()}
                aria-label="Escolher foto de perfil"
                title="Escolher foto de perfil"
              >
                {sheet.profileImage ? (
                  <img
                    src={sheet.profileImage}
                    alt={`Retrato de ${sheet.name || "personagem"}`}
                  />
                ) : (
                  <span>
                    {(sheet.name || "?").trim().slice(0, 1).toUpperCase()}
                  </span>
                )}
              </button>
              <span className="es-profile-upload" aria-hidden="true">
                Trocar foto
              </span>
              <input
                ref={profileInput}
                id="espiral-profile-photo"
                className="es-profile-input"
                type="file"
                accept="image/*"
                aria-label="Trocar foto"
                onChange={importProfileImage}
              />
            </div>
          </div>
          <div className="es-hero-vitals">
            <div className="hero-vital hero-integrity">
              <div className="hero-integrity-heading">
                <span>INTEGRIDADE</span>
                <strong>
                  <Counter
                    label="Integridade"
                    value={sheet.integrity}
                    max={maximum}
                    onChange={(v) => update("integrity", v)}
                  />{" "}
                  / {maximum}
                </strong>
              </div>
              <div>
                <i style={{ width: `${(sheet.integrity / maximum) * 100}%` }} />
              </div>
            </div>
            <div className="hero-vital hero-sanity">
              <div className="hero-dots">
                <span>SANIDADE</span>
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    type="button"
                    key={i}
                    aria-label={"Sanidade " + (i + 1)}
                    aria-pressed={i < sheet.sanity}
                    className={i < sheet.sanity ? "on" : ""}
                    onClick={() =>
                      update("sanity", i < sheet.sanity ? i : i + 1)
                    }
                  />
                ))}
              </div>
            </div>
            <div className="hero-vital hero-hope">
              <div className="hero-dots">
                <span>ESPERANÇA</span>
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    type="button"
                    key={i}
                    aria-label={"Esperança " + (i + 1)}
                    aria-pressed={i < sheet.hope}
                    className={i < sheet.hope ? "on" : ""}
                    onClick={() => update("hope", i < sheet.hope ? i : i + 1)}
                  />
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
              label="Pronome"
              value={sheet.pronoun || ""}
              onChange={(v) => update("pronoun", v)}
              placeholder="Ex.: ela/dela"
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
            <button
              type="button"
              className="es-profile-upload"
              onClick={() => profileInput.current?.click()}
            >
              {sheet.profileImage
                ? "Trocar foto de perfil"
                : "Adicionar foto de perfil"}
            </button>
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
            "Personalização",
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
                  title="Recursos"
                  aside="O QUE A EXPERIÊNCIA DEIXOU"
                />
                <div className="es-resources">
                  {RESOURCES.map((name, i) => (
                    <div className="es-resource" key={name}>
                      <button
                        type="button"
                        className="es-resource-roll"
                        aria-label={`Rolar ${name}`}
                        title={`Escolher atributo para rolar ${name}`}
                        onClick={() => {
                          setResourceToRoll(name);
                          setAttributeToRoll(attribute);
                        }}
                        disabled={rolling}
                      >
                        <span className="es-resource-die" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                      </button>
                      <button
                        className={`es-resource-name ${resource === name ? "active" : ""}`}
                        onClick={() => setResource(name)}
                      >
                        {name}
                        {i >= 12 && <small>RESISTÊNCIA</small>}
                      </button>
                      {(() => {
                        const permanentGrade = sheet.resources[name];
                        const temporaryGrade = temporaryGradeFor(name);
                        const temporaryRolls = temporaryBonusesFor(name)
                          .map((bonus) => bonus.rollsRemaining)
                          .join(", ");
                        return (
                          <>
                            <button
                              type="button"
                              className="es-resource-grade"
                              aria-label={`Adicionar grau temporário a ${name}`}
                              title="Adicionar +1 grau temporário"
                              onClick={() => addTemporaryResourceGrade(name)}
                            >
                              <span>
                                {["0", "I", "II", "III", "IV"][permanentGrade]} · {GRADES[permanentGrade]}
                              </span>
                              {temporaryGrade > 0 && (
                                <small>
                                  +{temporaryGrade} TEMP. · {temporaryRolls} teste(s)
                                </small>
                              )}
                            </button>
                            <span className="es-resource-dots" aria-hidden="true">
                              {[1, 2, 3, 4].map((n) => (
                                <i
                                  key={n}
                                  className={
                                    n <= permanentGrade
                                      ? "filled"
                                      : n <= permanentGrade + temporaryGrade
                                        ? "temporary"
                                        : ""
                                  }
                                />
                              ))}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
                <section
                  className="es-combat-kit"
                  aria-label="Armas e proteções"
                >
                  <div className="es-equipment-column">
                    <header>
                      <div>
                        <span className="es-eyebrow">ARMAS</span>
                        <small>Armas e dano</small>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          update("weapons", [
                            ...weapons,
                            { id: uniqueId(), name: "", damage: "" },
                          ])
                        }
                      >
                        + Arma
                      </button>
                    </header>
                    {weapons.length === 0 ? (
                      <p className="es-equipment-empty">
                        Nenhuma arma equipada.
                      </p>
                    ) : (
                      weapons.map((weapon) => (
                        <div className="es-equipment-row" key={weapon.id}>
                          {(() => {
                            const iconName = { Carabina: "Fuzil", Rifle: "Fuzil" }[weapon.name] || weapon.name;
                            const icon = obterIconeItem({ nome: iconName, categoria: "armas-fogo" });
                            const isImage = typeof icon === "string" && (icon.includes(".svg") || icon.startsWith("data:image"));
                            return <span className="es-weapon-icon" title={weapon.name || "Arma"}>{isImage ? <img src={icon} alt="" /> : <Icon path={icon} size={0.85} />}</span>;
                          })()}
                          <input
                            aria-label="Nome da arma"
                            value={weapon.name}
                            onChange={(event) =>
                              updateEquipment(
                                "weapons",
                                weapon.id,
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Nome da arma"
                          />
                          <input
                            aria-label="Dano da arma"
                            value={weapon.damage}
                            onChange={(event) =>
                              updateEquipment(
                                "weapons",
                                weapon.id,
                                "damage",
                                event.target.value,
                              )
                            }
                            placeholder="Dano"
                          />
                          <button
                            type="button"
                            className="es-damage-roll"
                            aria-label={`Rolar dano de ${weapon.name || "arma"}`}
                            onClick={() => rollWeaponDamage(weapon)}
                            disabled={rolling}
                          >
                            Rolar
                          </button>
                          <button
                            type="button"
                            aria-label="Remover arma"
                            onClick={() =>
                              removeEquipment("weapons", weapon.id)
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="es-equipment-column">
                    <header>
                      <div>
                        <span className="es-eyebrow">PROTEÇÕES</span>
                        <small>Armaduras e equipamentos defensivos</small>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          update("protections", [
                            ...protections,
                            { id: uniqueId(), name: "", value: "", region: "" },
                          ])
                        }
                      >
                        + Proteção
                      </button>
                    </header>
                    {protections.length === 0 ? (
                      <p className="es-equipment-empty">
                        Nenhuma proteção equipada.
                      </p>
                    ) : (
                      protections.map((protection) => (
                        <div className="es-equipment-row es-protection-row" key={protection.id}>
                          {(() => {
                            const icon = obterIconeItem({
                              nome: protection.name,
                              categoria: "protecao",
                            });
                            const isImage =
                              typeof icon === "string" &&
                              (icon.includes(".svg") || icon.startsWith("data:image"));

                            return (
                              <span
                                className="es-weapon-icon es-protection-icon"
                                title={protection.name || "Proteção"}
                              >
                                {isImage ? (
                                  <img src={icon} alt="" />
                                ) : (
                                  <Icon path={icon} size={0.85} />
                                )}
                              </span>
                            );
                          })()}
                          <input
                            aria-label="Nome da proteção"
                            value={protection.name}
                            onChange={(event) =>
                              updateEquipment(
                                "protections",
                                protection.id,
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Proteção"
                          />
                          <input
                            aria-label="Valor da proteção"
                            value={protection.value}
                            onChange={(event) =>
                              updateEquipment(
                                "protections",
                                protection.id,
                                "value",
                                event.target.value,
                              )
                            }
                            placeholder="Valor"
                          />
                          <button
                            type="button"
                            aria-label="Remover proteção"
                            onClick={() =>
                              removeEquipment("protections", protection.id)
                            }
                          >
                            ×
                          </button>
                          <input
                            aria-label="Região protegida"
                            value={protection.region}
                            onChange={(event) =>
                              updateEquipment(
                                "protections",
                                protection.id,
                                "region",
                                event.target.value,
                              )
                            }
                            placeholder="Região"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </section>
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
                <div className="es-injury-workspace">
                  <BodyMap
                    injuries={sheet.injuries}
                    protections={protections}
                    selectedRegion={region}
                    onSelect={setRegion}
                  />
                  <div className="es-injury-form">
                    <label className="es-field">
                      <span>Região</span>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      >
                        {BODY_REGIONS.map((r) => (
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
                {acquiredAbilities.length > 0 && (
                  <section className="es-acquired-abilities">
                    <div className="es-acquired-heading">
                      <span>TRANSFORMAÇÃO</span>
                      <strong>{acquiredAbilities.length} {acquiredAbilities.length === 1 ? "HABILIDADE ADQUIRIDA" : "HABILIDADES ADQUIRIDAS"}</strong>
                    </div>
                    <div className="es-acquired-grid">
                      {acquiredAbilities.map((ability) => {
                        const source = HABILIDADES_ESPIRAL[ability.category]?.find((item) => item[0] === ability.name);
                        const level = Math.max(1, Math.min(3, Number(ability.level) || 1));
                        const details = APRIMORAMENTOS_HABILIDADES_ESPIRAL[ability.name] || [source?.[2] || "", "", ""];
                        const cost = CUSTOS_ESPERANCA_HABILIDADES[ability.name] || [0, 0];
                        const dots = (amount) => amount ? "૦".repeat(amount) : "—";
                        return (
                          <article className="es-acquired-card" key={ability.id}>
                            <header><span>{ability.category} · AÇÃO {(source?.[1] || "Livre").toUpperCase()}</span><strong>NÍVEL {["I", "II", "III"][level - 1]}</strong></header>
                            <h3>{ability.name}</h3>
                            <div className="es-ability-dots" aria-label={`Nível ${level}`}>{[1, 2, 3].map((itemLevel) => <i className={itemLevel <= level ? "filled" : ""} key={itemLevel} />)}</div>
                            <div className="es-acquired-levels">
                              {details.map((detail, index) => {
                                const detailLevel = index + 1;
                                return (
                                  <section
                                    className={`${detailLevel <= level ? "unlocked" : "locked"} ${detailLevel === level ? "current" : ""}`}
                                    key={`${ability.id}-level-${detailLevel}`}
                                  >
                                    <strong>NÍVEL {["I", "II", "III"][index]}</strong>
                                    <p>{detail}</p>
                                  </section>
                                );
                              })}
                            </div>
                            <footer><span>CUSTO DE ESPERANÇA</span><b>{cost[0] ? `${dots(cost[0])} FRACASSO / ${dots(cost[1])} CONSEQUÊNCIA` : "— SEM CUSTO"}</b></footer>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
                <label className="es-writing">
                  <span>Habilidades escolhidas</span>
                  <p>
                    Comece com duas. Registre nome, nível, ação, efeito e custo
                    de Esperança. Habilidades de legado podem ser adaptadas com
                    o mestre.
                  </p>
                  <div className="es-ability-list">
                    {abilityProgress.map((ability, index) => (
                      <article className="es-ability-card" key={index}>
                        <input
                          aria-label={`Nome da habilidade ${index + 1}`}
                          placeholder={`${String(index + 1).padStart(2, "0")} / Nome da habilidade`}
                          value={ability.name}
                          onChange={(event) => update("abilityProgress", abilityProgress.map((item, i) => i === index ? { ...item, name: event.target.value } : item))}
                        />
                        <div className="es-ability-heading">
                          <span className="es-ability-dots" aria-hidden="true">
                            {[1, 2, 3].map((level) => <i key={level} className={level <= ability.level ? "filled" : ""} />)}
                          </span>
                          <strong>Nível {String(ability.level).toUpperCase()}</strong>
                          <div className="es-ability-levels" aria-label={`Nível da habilidade ${index + 1}`}>
                            {[1, 2, 3].map((level) => (
                              <button type="button" key={level} className={ability.level === level ? "active" : ""} onClick={() => update("abilityProgress", abilityProgress.map((item, i) => i === index ? { ...item, level } : item))}>{level}</button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          aria-label={`Descrição da habilidade ${index + 1}`}
                          placeholder="Ação, custo e efeito da habilidade."
                          value={ability.detail}
                          onChange={(event) => update("abilityProgress", abilityProgress.map((item, i) => i === index ? { ...item, detail: event.target.value } : item))}
                        />
                      </article>
                    ))}
                  </div>
                  <textarea
                    aria-label="Habilidades legadas"
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
                  <div className="es-inventory-items" aria-label="Itens do inventário">
                    {inventarioVisual.length ? inventarioVisual.map((item, index) => (
                      <div className="es-inventory-item" key={`${item.name}-${index}`}>
                        <span className="es-inventory-icon" aria-hidden="true">{item.icon}</span>
                        <div><b>{item.name}</b><small>{item.detail}</small></div>
                      </div>
                    )) : <p className="es-inventory-empty">Nenhum item registrado.</p>}
                  </div>
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
            {tab === "Personalização" && (
              <>
                <SectionTitle
                  number="06"
                  title="Personalização"
                  aside="CORES DA FICHA"
                />
                <section className="es-theme-panel" aria-label="Personalização das cores da ficha">
                  <div>
                    <span className="es-eyebrow">TEMA VISUAL</span>
                    <h3>As cores que acompanham a sua história.</h3>
                    <p>Escolha as cores da ficha. As alterações são salvas somente nesta personagem.</p>
                  </div>
                  <div className="es-theme-grid">
                    {[
                      ["primaria", "Cor primária"],
                      ["secundaria", "Cor secundária"],
                      ["texto", "Cor do texto"],
                      ["fundo", "Cor do fundo"],
                      ["borda", "Cor da borda"],
                    ].map(([campo, rotulo]) => (
                      <label className="es-theme-color" key={campo}>
                        <span>{rotulo}</span>
                        <input
                          type="color"
                          aria-label={rotulo}
                          value={sheet.temaFicha?.[campo] || TEMA_PADRAO_ESPIRAL[campo]}
                          onInput={(event) => atualizarTemaFicha(campo, event.currentTarget.value)}
                          onChange={(event) => atualizarTemaFicha(campo, event.currentTarget.value)}
                        />
                        <button type="button" onClick={() => restaurarCorPadrao(campo)}>
                          Restaurar
                        </button>
                      </label>
                    ))}
                  </div>
                  <button type="button" className="es-theme-reset" onClick={restaurarTemaPadrao}>
                    Restaurar tema padrão
                  </button>
                </section>
              </>
            )}
          </div>
          <aside className="es-sidebar">
            <section className="es-defense-card" aria-label="Defesa">
              <span className="es-eyebrow">DEFESA</span>
              <strong>{defense}</strong>
              <div>
                <b>{ATTRIBUTES.sentido.stages[sheet.attributes.sentido - 1]}</b>
                <small>
                        Sentido <DieGlyph sides={sheet.attributes.sentido * 2 + 2} /> · Defesa base
                </small>
              </div>
            </section>
            <section className="es-roll-panel">
              <div className="es-eyebrow">
                DIANTE DO INCERTO <span>↗</span>
              </div>
              <h2>Faça sua escolha.</h2>
              <p>A intenção vem antes dos dados.</p>

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
                  label={<>Bônus / penalidade <DieGlyph sides={6} /></>}
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
                    <small>Dados adicionais <DieGlyph sides={6} /></small>
                </div>
                <Counter
                  label="Dados de Pressão"
                  value={sheet.pressure}
                  max={20}
                  onChange={(v) => update("pressure", v)}
                />
              </div>
              <div className="es-extra-dice">
                <div>
                  <span>Dados adicionais</span>
                  <small>Entram na reserva desta rolagem</small>
                </div>
                <Counter
                  label="Quantidade de dados adicionais"
                  value={extraDiceCount}
                  max={20}
                  onChange={setExtraDiceCount}
                />
                <label className="es-extra-die-type">
                  <span className="sr-only">Tipo dos dados adicionais</span>
                  <select
                    aria-label="Tipo dos dados adicionais"
                    value={extraDiceSides}
                    onChange={(event) =>
                      setExtraDiceSides(Number(event.target.value))
                    }
                  >
                    {[4, 6, 8, 10, 12].map((sides) => (
                      <option key={sides} value={sides}>
                        {sides}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="es-custom-roll">
                <label className="es-field">
                  <span>Rolagem livre</span>
                  <input
                    aria-label="Fórmula de rolagem livre"
                    value={customFormula}
                    onChange={(event) => setCustomFormula(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && rollFormula()
                    }
                    placeholder="Ex.: 2d6+3"
                  />
                </label>
                <button type="button" onClick={rollFormula} disabled={rolling}>
                  Rolar fórmula
                </button>
                {formulaError && <small role="alert">{formulaError}</small>}
              </div>
              {history[0] && (
                <div className="es-result" role="status">
                  <span className="es-eyebrow">ÚLTIMA ROLAGEM</span>
                  <h3>
                    {history[0].type === "formula"
                      ? history[0].label
                      : history[0].outcome}
                  </h3>
                  <div className="es-result-dice">
                    {history[0].dice.map((d, i) => (
                      <span className={rolling ? "rolling" : ""} key={`d${i}`}>
                        {rolling ? "?" : d}
                      </span>
                    ))}
                    {history[0].pressure.map((d, i) => (
                      <span className="pressure" key={`p${i}`}>
                        {d}
                      </span>
                    ))}
                    {history[0].extra?.map((d, i) => (
                      <span className="extra" key={`e${i}`}>
                        {d}
                      </span>
                    ))}
                  </div>
                  {history[0].type === "formula" ? (
                    <p>
                      Total: {history[0].total}
                      {history[0].modifier
                        ? ` (dados ${history[0].modifier > 0 ? "+" : ""}${history[0].modifier})`
                        : ""}
                    </p>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
              {history.length > 1 && (
                <details className="es-roll-history">
                  <summary>Histórico de rolagens ({history.length})</summary>
                  {history.slice(1).map((entry) => (
                    <p key={entry.at}>
                      <b>{entry.label}</b> ·{" "}
                      {entry.type === "formula"
                        ? `Total ${entry.total}`
                        : `${entry.outcome} (${entry.best})`}
                    </p>
                  ))}
                </details>
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
              <option value="creation">
                30 / 35 / 40 / 45 / 50
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
            <button type="button" onClick={abrirSistemaAnterior}>
              {fichaDarkness ? "Abrir ficha Darkness ↗" : "Ir para tela inicial ↗"}
            </button>
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
      {rollModalOpen && history[0] && (
        <div
          className="es-roll-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !rolling)
              setRollModalOpen(false);
          }}
        >
          <section
            className="es-roll-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="es-roll-modal-title"
          >
            <span className="es-eyebrow">ROLAGEM DE RECURSO</span>
            <h2 id="es-roll-modal-title">{history[0].label}</h2>
            <p>{history[0].attribute ? `Teste de ${ATTRIBUTES[history[0].attribute].name}` : "Rolagem de dano"}</p>
            <code>
              {history[0].dice.length} × <DieGlyph sides={history[0].sides} />
              {history[0].pressure.length
                ? <> + {history[0].pressure.length} × <DieGlyph sides={6} /></>
                : ""}
              {history[0].extra?.length
                ? <> + {history[0].extra.length} × <DieGlyph sides={history[0].extraSides} /></>
                : ""}
            </code>
            <div className="es-roll-modal-dice" aria-label="Dados rolados">
              {history[0].dice.map((die, index) => (
                <span
                  key={`modal-die-${index}`}
                  className={rolling ? "rolling" : ""}
                >
                  {rolling ? "?" : die}
                </span>
              ))}
              {history[0].pressure.map((die, index) => (
                <span
                  key={`modal-pressure-${index}`}
                  className={`pressure ${rolling ? "rolling" : ""}`}
                >
                  {rolling ? "?" : die}
                </span>
              ))}
              {history[0].extra?.map((die, index) => (
                <span
                  key={`modal-extra-${index}`}
                  className={`extra ${rolling ? "rolling" : ""}`}
                >
                  {rolling ? "?" : die}
                </span>
              ))}
            </div>
            {!rolling && (
              <>
                <span className="es-eyebrow">RESULTADO</span>
                {history[0].type === "formula" ? (
                  <>
                    <strong>{history[0].total}</strong>
                    <h3>Dano total</h3>
                    {history[0].modifier ? <p>Modificador {history[0].modifier > 0 ? "+" : ""}{history[0].modifier}</p> : null}
                  </>
                ) : (
                  <>
                    <strong>{history[0].best}</strong>
                    <h3>{history[0].outcome}</h3>
                    <p>Margem {history[0].margin > 0 ? "+" : ""}{history[0].margin}{history[0].mastery ? " · Domínio" : ""}</p>
                  </>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setRollModalOpen(false)}
              disabled={rolling}
            >
              Fechar
            </button>
          </section>
        </div>
      )}
      {resourceToRoll && (
        <div
          className="es-roll-modal-backdrop es-attribute-picker-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setResourceToRoll(null);
          }}
        >
          <section
            className="es-attribute-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="es-attribute-picker-title"
          >
            <span className="es-eyebrow">PREPARAR ROLAGEM</span>
            <h2 id="es-attribute-picker-title">{resourceToRoll}</h2>
            <p>Escolha o Atributo que será usado neste teste.</p>
            <div className="es-attribute-options">
              {Object.entries(ATTRIBUTES).map(([key, item]) => (
                <button
                  type="button"
                  key={key}
                  className={attributeToRoll === key ? "selected" : ""}
                  onClick={() => setAttributeToRoll(key)}
                >
                  <span>{item.name}</span>
                  <small>
                    {item.stages[sheet.attributes[key] - 1]} · d
                    {sheet.attributes[key] * 2 + 2}
                  </small>
                </button>
              ))}
            </div>
            <div className="es-attribute-picker-actions">
              <button type="button" onClick={() => setResourceToRoll(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="confirm"
                onClick={() => {
                  const selectedResource = resourceToRoll;
                  const selectedAttribute = attributeToRoll;
                  setResourceToRoll(null);
                  roll(selectedResource, selectedAttribute);
                }}
              >
                Rolar {ATTRIBUTES[attributeToRoll].name} + {resourceToRoll}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
