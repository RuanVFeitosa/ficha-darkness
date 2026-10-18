import EspiralDice, { EspiralDie, EspiralDiceInput } from '../components/espiral/EspiralDice';
import PlayerPageLink from '../components/jogador/PlayerPageLink';
import EspiralDamage from '../components/espiral/EspiralDamage';
import EspiralDamageResult from '../components/espiral/EspiralDamageResult';
import { INJURY_EFFECTS } from '../utils/espiralInjuries';

import AnimatedTokenImage from '../components/tokens/AnimatedTokenImage';
import { externalizarImagens } from "../services/mediaStorage";
import SceneDifficultySelector from "../components/tabletop/SceneDifficultySelector";
import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiAccountCircleOutline, mdiDiceMultipleOutline, mdiStoreOutline, mdiAutoFix, mdiDownload, mdiHeartPulse } from '@mdi/js';
import {
  ATTRIBUTES,
  RESOURCES,
  GRADES,
  VERTENTES,
  VERTENTE_HABILIDADES,
  TEMA_PADRAO_ESPIRAL,
  freshSheet,
  integrityMax,
  creationWarnings,
  parseDiceFormula,
  resolveRoll,
} from "../data/espiral";
import "../styles/FichaEspiral.css";
import "../styles/InventarioEspiral.css";
import "../styles/FichaEspiralResponsive.css";
import { compressProfileImage, prepareTokenImage } from "../services/imageCompression";
import { buscarPersonagem } from "../services/personagemApi";
import { obterIconeItem } from "../utils/itemIcons";
import AdaptacaoEspiral from "../components/adaptacao/AdaptacaoEspiral";
import { selecionarDialogo, solicitarDialogo } from "../components/ui/DialogoGlobal";
import { APRIMORAMENTOS_HABILIDADES_ESPIRAL, CUSTOS_ESPERANCA_HABILIDADES, HABILIDADES_ESPIRAL } from "../data/habilidadesEspiral";
import { CATALOGO_ESPIRAL } from "../data/catalogoEspiral";

import { listarCampanhasDaFicha } from "../services/mesaApi";
import { TABLETOP_3D_AUTH_KEY } from "../constants/masterAccess";
import { hasEspiralToken, MISSING_ESPIRAL_TOKEN, espiralTabletopUrl } from "../utils/espiralTabletop";
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
  <i className={`es-die-glyph die-d${sides}`} data-sides={sides} aria-label={label ? `Dado de ${sides} faces` : undefined} title={label ? `Dado de ${sides} faces` : undefined} />
);
const uniqueId = () =>
  window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const INVENTORY_CATEGORY_NAMES = {
  armas: "Arma",
  protecoes: "Proteção",
  medicina: "Medicina",
  investigacao: "Investigação",
  tecnica: "Técnica",
  sobrevivencia: "Sobrevivência",
  tecnologia: "Tecnologia",
  infiltracao: "Infiltração",
  comunicacao: "Comunicação",
  visao: "Visão",
  ambiental: "Proteção ambiental",
};
const inventoryCategoryName = (category, fallback = "Equipamento") =>
  INVENTORY_CATEGORY_NAMES[category] || fallback;
const catalogInventoryItem = (name) => CATALOGO_ESPIRAL.find((item) => item.name === name) || {};
function InventoryIcon({ item, size = 1.45 }) {
  const icon = obterIconeItem({
    nome: item.name,
    categoria: item.category || item.kind,
    tipo: item.kind,
    detalhes: item.description,
  });
  const isImage = typeof icon === "string" && (icon.includes(".svg") || icon.startsWith("data:image"));
  return isImage
    ? <img src={icon} alt="" aria-hidden="true" />
    : <Icon path={icon} size={size} aria-hidden="true" />;
}
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
  !sheet?.migratedFrom && !sheet?.name && !sheet?.profileImage && !sheet?.tabletopTokenImage &&
  !sheet?.occupation && !sheet?.player && !sheet?.inventory && !(sheet?.inventoryItems || []).length && !sheet?.abilities &&
  !sheet?.backgroundDescription && !sheet?.backgroundHistory && !sheet?.backgroundConnections &&
  !(sheet?.injuries || []).length &&
  Object.values(sheet?.resources || {}).every((grade) => Number(grade) === 0);
const legacyImportsInProgress = new Set();
function Spiral({ small = false, className = "" }) {
  const points = Array.from({ length: 500 }, (_, i) => {
    const t = (i / 499) * Math.PI * 9;
    const r = 3 + (i / 499) * 84;
    return `${100 + Math.cos(t) * r},${100 + Math.sin(t) * r}`;
  }).join(" ");
  return (
    <svg
      className={`${small ? "es-mark" : "es-spiral"} ${className}`.trim()}
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
  Catastrófica: 4,
  Fatal: 4,
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
      </svg>
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

export default function FichaEspiral({tabletopAccessError="",sheetId=null,embedded=false,scene=null,sceneEnemies=[],rollContext=null,difficultyLocked=false,onRollContextChange,onSheetChange,onRoll}) {
  const idFromUrl = sheetId || new URLSearchParams(window.location.search).get("ficha");
  const id = idFromUrl || "principal";
  const storageKey = `espiral:sheet:v1:${id}`;
  const initialStoredSheet = useRef(storedEspiralSheet(id));
  const [sheet, setSheet] = useState(() => initialStoredSheet.current || freshSheet());
  const [adaptacaoPendente, setAdaptacaoPendente] = useState(null);
  const [saveState, setSaveState] = useState("Salvando…");
  const [tab, setTab] = useState("Visão geral");
  const [selectedInventoryKey, setSelectedInventoryKey] = useState(null);
  const [editing, setEditing] = useState(false);
  const [attribute, setAttribute] = useState("sentido");
  const [temporaryAttributeDice, setTemporaryAttributeDice] = useState({});
  const [resource, setResource] = useState("Investigação");
  const [difficulty, setDifficulty] = useState(4);
  const contextDifficulty=rollContext?.value;
  const contextId=rollContext?.id;
  useEffect(()=>{if(contextDifficulty != null)setDifficulty(contextDifficulty);},[contextId,contextDifficulty]);
  const [modifier, setModifier] = useState(0);
  const [extraDiceCount, setExtraDiceCount] = useState(0);
  const [extraDiceSides, setExtraDiceSides] = useState(6);
  const [history, setHistory] = useState([]);
  const [rolling, setRolling] = useState(false);
  const lastSharedRoll=useRef(null);
  useEffect(() => {
    const latest=history[0];
    if(!latest || lastSharedRoll.current===latest) return;
    lastSharedRoll.current=latest;
    onRoll?.(latest,sheet.name || "Jogador");
  },[history,onRoll,sheet.name]);
  const [rollModalOpen, setRollModalOpen] = useState(false);
  const [resourceToRoll, setResourceToRoll] = useState(null);
  const [attributeToRoll, setAttributeToRoll] = useState("sentido");
  const [customFormula, setCustomFormula] = useState("1d20");
  const [formulaError, setFormulaError] = useState("");
  const [region, setRegion] = useState("Torso");
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [selectedProtection, setSelectedProtection] = useState(null);
  const [severity, setSeverity] = useState("Moderada");
  const [injuryNote, setInjuryNote] = useState("");
  const fileInput = useRef(null);
  const profileInput = useRef(null);
  const tabletopTokenInput = useRef(null);
  const [notice, setNotice] = useState("");
  const [tabletopOpen,setTabletopOpen]=useState(false);
  const [tabletopCampaigns,setTabletopCampaigns]=useState([]);
  const [tabletopLoading,setTabletopLoading]=useState(false);
  const [tabletopError,setTabletopError]=useState(tabletopAccessError);
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
  const vertenteAbility = VERTENTE_HABILIDADES[sheet.vertente] || VERTENTE_HABILIDADES.Metódica;
  const vertenteLevel = sheet.evolution?.vertente?.nome === sheet.vertente
    ? Math.max(1, Math.min(3, Number(sheet.evolution?.vertente?.nivel) || 1))
    : 1;
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
      setAdaptacaoPendente({ ...legacyCharacter, fichaId: id });
    };
    importarDarkness();
  }, [id, idFromUrl]);
  useEffect(() => {
    if (adaptacaoPendente) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(sheet));
      setSaveState("Salvo neste dispositivo");
      onSheetChange?.(id,sheet);
    } catch {
      setSaveState("Não foi possível salvar. Exporte uma cópia.");
    }
  }, [sheet, storageKey, id, onSheetChange, adaptacaoPendente]);
  useEffect(() => {
    const updateAnimation=event => {
      if(event.type==='storage' && event.key!==storageKey) return;
      if(event.type!=='storage' && event.detail?.fichaId!==`espiral:${id}`) return;
      try {const latest=event.type==='storage' ? JSON.parse(event.newValue || 'null') : event.detail?.patch;
        if(latest) setSheet(previous => {
 const profileTokenAnimation=latest.profileTokenAnimation ?? previous.profileTokenAnimation,tabletopTokenAnimation=latest.tabletopTokenAnimation ?? previous.tabletopTokenAnimation;
 if(JSON.stringify([profileTokenAnimation,tabletopTokenAnimation])===JSON.stringify([previous.profileTokenAnimation,previous.tabletopTokenAnimation])) return previous;
 return {...previous,profileTokenAnimation,tabletopTokenAnimation};
});
      } catch {}
    };
    window.addEventListener('storage',updateAnimation);window.addEventListener('darkness:token-animation-updated',updateAnimation);
    return () => {window.removeEventListener('storage',updateAnimation);window.removeEventListener('darkness:token-animation-updated',updateAnimation);};
  },[storageKey,id]);  useEffect(() => {
    if(!embedded) document.title = sheet.name || "Ficha de personagem";
  }, [sheet.name,embedded]);
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
  async function openTabletop() {
    setTabletopOpen(true);
    setTabletopError("");
    if(!hasEspiralToken(sheet)) {
      setTabletopError(MISSING_ESPIRAL_TOKEN);
      return;
    }
    setTabletopLoading(true);
    try {
      const ids=[...new Set([`espiral:${id}`,id,fichaDarkness].filter(Boolean))];
      const lists=await Promise.all(ids.map(fichaId => listarCampanhasDaFicha(fichaId)));
      const campaigns=[...new Map(lists.flat().filter(c => c?.tabletop_tipo==="3d").map(c => [c.id || c.codigo,c])).values()];
      setTabletopCampaigns(campaigns);
    } catch(error) {
      setTabletopError(error.message || "Não foi possível carregar suas campanhas.");
    } finally { setTabletopLoading(false); }
  }
  function enterTabletop(campaign) {
    if(!hasEspiralToken(sheet)) {setTabletopError(MISSING_ESPIRAL_TOKEN);return;}
    try {
      localStorage.setItem(storageKey,JSON.stringify(sheet));
      sessionStorage.setItem(TABLETOP_3D_AUTH_KEY,"true");
      window.location.href=espiralTabletopUrl(id,campaign);
    } catch {setTabletopError("Não foi possível salvar a imagem do personagem. Libere espaço neste dispositivo e tente novamente.");}
  }
  async function importTabletopToken(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setNotice("Preparando imagem do personagem…");
      const prepared = await prepareTokenImage(file);
      let image = prepared;
      let localOnly = false;
      try {
        image = await externalizarImagens(prepared);
      } catch {
        localOnly = true;
      }
      const nextSheet = { ...sheet, tabletopTokenImage: image };
      // Confirme a gravação antes de mostrar que a imagem foi atualizada.
      localStorage.setItem(storageKey, JSON.stringify(nextSheet));
      setSheet(nextSheet);
      setNotice(localOnly
        ? "Imagem salva neste dispositivo. O envio ao armazenamento remoto não foi concluído."
        : "Imagem do personagem atualizada.");
    } catch (error) {
      setNotice(error?.message || "Não foi possível preparar a imagem.");
    }
  }
  function roll(resourceOverride = resource, attributeOverride = attribute) {
    if (rolling) return;
    setResource(resourceOverride);
    setAttribute(attributeOverride);
    const sides = sheet.attributes[attributeOverride] * 2 + 2;
    setTemporaryAttributeDice(previous => ({...previous,[attributeOverride]:0}));
    const temporaryGrade = temporaryGradeFor(resourceOverride);
    const count = Math.max(
      1,
      1 + sheet.resources[resourceOverride] + temporaryGrade + modifier + (temporaryAttributeDice[attributeOverride] || 0),
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
    const survival = resourceOverride === 'Propósito' && attributeOverride === 'pulso' && Number(sheet.integrity) === 0;
    if (survival) {
      setSheet(previous => ({ ...previous, failures: Math.max(0, Math.min(3, (Number(previous.failures) || 0) + (margin < 0 ? 1 : -1))) }));
    }
    setRolling(true);
    setHistory((previous) =>
      [
        {
          ...result,
          survival,
          difficulty,
          context:rollContext?.label,
          category:rollContext?.category,
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
  function rollAttribute(key) {
    if (rolling) return;
    const stage = sheet.attributes[key];
    const sides = stage * 2 + 2;
    const dice = Array.from({length:1+(temporaryAttributeDice[key] || 0)},()=>randomDie(sides));
    setAttribute(key);
    setTemporaryAttributeDice(previous => ({...previous,[key]:0}));
    setRolling(true);
    setHistory(previous => [{type:'formula',attributeOnly:true,label:ATTRIBUTES[key].name+' · somente atributo',dice,sides,pressure:[],modifier:0,total:Math.max(...dice),at:Date.now()},...previous].slice(0,12));
    setRollModalOpen(true);
    window.setTimeout(() => setRolling(false),650);
  }
  function rollFormula() {
    if (rolling) return;
    const parsed = parseDiceFormula(customFormula);
    if (!parsed) {
      setFormulaError(
        "Use 1d4 a 50d100, com modificador opcional (ex.: 2⬡6+3).",
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
      setNotice(`Dano inválido para ${weapon.name || "a arma"}. Use uma fórmula como 1◇8 ou 2⬡6+2.`);
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
        (data.tabletopTokenImage !== undefined &&
          typeof data.tabletopTokenImage !== "string") ||
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

  // Unifica itens estruturados e entradas antigas no inventário exibido.
  const structuredInventory = Array.isArray(sheet.inventoryItems) ? sheet.inventoryItems : [];
  const structuredNames = new Set(structuredInventory.map((item) => String(item.name || "").trim().toLocaleLowerCase("pt-BR")));
  const inventarioVisual = [
    ...weapons.map((item, index) => {
      const catalogItem = catalogInventoryItem(item.name);
      const weaponGroup = item.weaponGroup || catalogItem.weaponGroup;
      return {
        key: `weapon-${item.id || index}`,
        name: item.name || "Arma sem nome",
        kind: "Arma",
        category: item.category || catalogItem.category || "armas",
        summary: item.damage ? `Dano ${item.damage}` : "Arma",
        description: item.detail || catalogItem.detail || "Arma registrada no equipamento do personagem.",
        properties: [
          { label: "Dano", value: item.damage || catalogItem.damage || "Não informado" },
          { label: "Munição", value: item.ammo || "Não registrada" },
          { label: "Grupo", value: weaponGroup === "fogo" ? "Arma de fogo" : weaponGroup === "brancas" ? "Arma branca" : "Não informado" },
        ],
      };
    }),
    ...protections.map((item, index) => {
      const catalogItem = catalogInventoryItem(item.name);
      return {
        key: `protection-${item.id || index}`,
        name: item.name || "Proteção sem nome",
        kind: "Proteção",
        category: item.category || catalogItem.category || "protecoes",
        summary: item.value ? `Proteção ${item.value}` : "Proteção",
        description: item.detail || catalogItem.detail || "Proteção registrada no equipamento do personagem.",
        properties: [
          { label: "Proteção", value: item.value || catalogItem.value || "Não informada" },
          { label: "Região", value: item.region || catalogItem.region || "Não informada" },
        ],
      };
    }),
    ...structuredInventory.map((item, index) => {
      const catalogItem = catalogInventoryItem(item.name);
      const category = item.category || catalogItem.category;
      return {
        key: `item-${item.id || index}`,
        name: item.name || "Item sem nome",
        kind: "Equipamento",
        category,
        summary: inventoryCategoryName(category),
        description: item.detail || catalogItem.detail || "Equipamento registrado no inventário do personagem.",
        quantity: Number(item.quantity) || 1,
        properties: [
          { label: "Categoria", value: inventoryCategoryName(category) },
          { label: "Quantidade", value: Number(item.quantity) || 1 },
        ],
      };
    }),
    ...String(sheet.inventory || "").split("\n").map((item) => item.trim()).filter(Boolean)
      .filter((name) => !structuredNames.has(name.toLocaleLowerCase("pt-BR")))
      .map((name, index) => {
        const catalogItem = catalogInventoryItem(name);
        return {
          key: `legacy-${index}-${name}`,
          name,
          kind: "Equipamento",
          category: catalogItem.category || "",
          summary: inventoryCategoryName(catalogItem.category),
          description: catalogItem.detail || "Item pessoal registrado no inventário do personagem.",
          properties: catalogItem.category
            ? [{ label: "Categoria", value: inventoryCategoryName(catalogItem.category) }]
            : [{ label: "Tipo", value: "Item pessoal" }],
        };
      }),
  ];
  const selectedInventoryItem = inventarioVisual.find((item) => item.key === selectedInventoryKey) || inventarioVisual[0] || null;
  const inventorySlotCount = Math.max(20, Math.ceil(inventarioVisual.length / 5) * 5);
  return (
    <div
      className={`espiral-app ${embedded ? "es-embedded" : ""}`}
      style={{
        "--es-accent": sheet.temaFicha?.primaria,
        "--es-surface": sheet.temaFicha?.secundaria,
        "--es-text": sheet.temaFicha?.texto,
        "--es-bg": sheet.temaFicha?.fundo,
        "--es-line": sheet.temaFicha?.borda,
      }}
    >
      <header className="es-topbar">
        <a href="/" className="es-brand" onClick={event => {if(embedded) event.preventDefault();}}>
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
        <nav className="es-top-actions" aria-label="Ações da ficha">
        {!embedded && <PlayerPageLink className="es-icon-button" id={id} sistema="espiral" aria-label="Página do Jogador" title="Página do Jogador"><Icon path={mdiAccountCircleOutline} size={0.9} aria-hidden="true" /></PlayerPageLink>}
        {!embedded && <button type="button" className="es-icon-button" aria-label="Entrar no tabletop" title="Entrar no tabletop" onClick={openTabletop}><Icon path={mdiDiceMultipleOutline} size={0.9} aria-hidden="true" /></button>}
        <a className="es-icon-button" aria-label="Loja da Helena" title="Loja da Helena" href={`?sistema=espiral&lojaEspiral=1&ficha=${encodeURIComponent(id)}`}><Icon path={mdiStoreOutline} size={0.9} aria-hidden="true" /></a>
        <a className="es-icon-button" aria-label="Transformação" title="Transformação" href={`?sistema=espiral&transformacao=1&ficha=${encodeURIComponent(id)}`}><Icon path={mdiAutoFix} size={0.9} aria-hidden="true" /></a>
        <button
          className="es-icon-button"
          onClick={exportSheet}
          title="Exportar ficha JSON"
          aria-label="Exportar ficha JSON"
        >
          <Icon path={mdiDownload} size={0.9} aria-hidden="true" />
        </button>
        </nav>
      </header>
      {tabletopAccessError && !hasEspiralToken(sheet) && <p role="alert">{MISSING_ESPIRAL_TOKEN}</p>}
      {adaptacaoPendente && <AdaptacaoEspiral verificarExistente={false} personagem={adaptacaoPendente} fichaId={id} onClose={() => { setAdaptacaoPendente(null); legacyImportsInProgress.delete(id); }} onConcluir={adaptada => { setSheet(adaptada); setAdaptacaoPendente(null); setNotice("Adaptação concluída com suas escolhas."); }} />}
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
                  <div
                    className={`es-rail-attribute ${attribute === key ? "selected" : ""}`}
                    key={key}
                  >
                    <span className="es-rail-name">{attr.name}</span>
                    <div className="es-attribute-dice-controls">
                      <button type="button" className="es-attribute-roll" disabled={rolling} onClick={() => rollAttribute(key)} aria-label={'Rolar somente '+attr.name} title={'Rolar '+(1+(temporaryAttributeDice[key] || 0))+' dado(s) de '+attr.name}><EspiralDie sides={stage * 2 + 2}/></button>
                      <button type="button" className="es-attribute-add" disabled={rolling || (temporaryAttributeDice[key] || 0)>=49} onClick={() => setTemporaryAttributeDice(previous => ({...previous,[key]:(previous[key] || 0)+1}))} aria-label={'Adicionar dado temporário de '+attr.name} title="Adicionar um dado à próxima rolagem">+</button>
                      {temporaryAttributeDice[key] > 0 && <button type="button" className="es-attribute-quantity" onClick={() => setTemporaryAttributeDice(previous => ({...previous,[key]:0}))} aria-label={'Restaurar um dado de '+attr.name} title="Restaurar 1 dado">×{1+temporaryAttributeDice[key]}</button>}
                    </div>
                    <small className="es-rail-stage">ESTÁGIO {stage}</small>
                    <em className="es-rail-detail">
                      {attr.stages[stage - 1]}
                    </em>
                  </div>
                );
              })}
            </div>
          </aside>
          <div className="es-hero-art" data-sanity-active={Number(sheet.sanity) <= 5} data-hope-active={Number(sheet.hope) <= 5}
            style={{ '--es-sanity-turn': `${Number(sheet.sanity) === 0 ? 2 : Number(sheet.sanity) < 5 ? 6 : 12}s`, '--es-hope-turn': `${Number(sheet.hope) === 0 ? 2 : Number(sheet.hope) < 5 ? 6 : 12}s` }}>
            <Spiral />
            {Number(sheet.hope) <= 5 && <Spiral className="es-hope-spiral" />}
            <div className="es-profile-photo-shell"
              data-sanity={sheet.sanity === 0 ? 'empty' : sheet.sanity < 5 ? 'low' : sheet.sanity === 5 ? 'half' : 'stable'}
              data-hope={sheet.hope === 0 ? 'empty' : sheet.hope < 5 ? 'low' : sheet.hope === 5 ? 'half' : 'stable'}>
              <button
                className="es-profile-photo"
                type="button"
                onClick={() => profileInput.current?.click()}
                aria-label="Escolher foto de perfil"
                title="Escolher foto de perfil"
              >
                {sheet.profileImage ? (
                  <AnimatedTokenImage
                    animation={sheet.profileTokenAnimation} src={sheet.profileImage}
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
            <div className={`es-integrity-status ${Number(sheet.integrity) === 0 ? 'is-critical' : ''}`}>
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
            {Number(sheet.integrity) === 0 && <div className="es-survival-failures" aria-label="Falhas de sobrevivência">
              <span>Falhas de sobrevivência</span>
              <Counter label="Falhas de sobrevivência" value={sheet.failures} max={3} onChange={v => update('failures', v)} />
              <button type="button" className="es-survival-roll" aria-label="Rolar sobrevivência: Pulso + Propósito" title="Tentar continuar vivo · Pulso + Propósito" disabled={rolling || Number(sheet.failures) >= 3} onClick={() => roll('Propósito', 'pulso')}><Icon path={mdiHeartPulse} size={0.85} aria-hidden="true" /></button>
              <small>{Number(sheet.failures) >= 3 ? '3 falhas: o personagem morre.' : `${sheet.failures}/3 · Estado crítico`}</small>
            </div>}
            </div>
            <div className="hero-vital hero-sanity" data-state={sheet.sanity === 0 ? 'empty' : sheet.sanity < 5 ? 'low' : sheet.sanity === 5 ? 'half' : 'stable'}>
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
            <div className="hero-vital hero-hope" data-state={sheet.hope === 0 ? 'empty' : sheet.hope < 5 ? 'low' : sheet.hope === 5 ? 'half' : 'stable'}>
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
        <input ref={tabletopTokenInput} type="file" aria-label="Enviar imagem de corpo inteiro" accept="image/png,image/jpeg,image/webp,image/gif" onChange={importTabletopToken} hidden />
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
            <div className="es-tabletop-token-field">
              <div>
                <span>Imagem de corpo inteiro</span>
                <small>Retrato vertical do personagem. Prefira PNG com fundo transparente.</small>
              </div>
              <button type="button" className="es-tabletop-token-preview" onClick={() => tabletopTokenInput.current?.click()}>
                {sheet.tabletopTokenImage ? <img src={sheet.tabletopTokenImage} alt="Personagem de corpo inteiro"/> : <span>Adicionar imagem</span>}
              </button>
              <div className="es-tabletop-token-actions">
                <button type="button" onClick={() => tabletopTokenInput.current?.click()}>{sheet.tabletopTokenImage ? "Trocar imagem" : "Escolher imagem"}</button>
                {sheet.tabletopTokenImage && <button type="button" onClick={() => update("tabletopTokenImage","")}>Remover</button>}
              </div>

            </div>
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
            "Background",
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
        <div className={`es-layout ${tab === "Background" ? "es-layout-background" : ""}`}>
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
                      "Sanidade zero: Ruptura imediata; Controle Mental recebe +1⬡6 de Pressão. "}
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
                        <span className="es-eyebrow">ARMAS <span className="es-kit-count">{weapons.length}</span></span>
                        <small>Seu arsenal · dano por ataque</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => { const item = { id: uniqueId(), name: "", damage: "" }; update("weapons", [...weapons, item]); setSelectedWeapon(item.id); }}
                      >
                        + Arma
                      </button>
                    </header>
                    <div className="es-kit-icons" aria-label="Armas equipadas">
                      {weapons.map((weapon, index) => <button type="button" key={weapon.id} aria-label={`Ver arma ${weapon.name || 'sem nome'} ${index + 1}`} title={weapon.name || 'Arma sem nome'} aria-pressed={selectedWeapon === weapon.id} onClick={() => setSelectedWeapon(selectedWeapon === weapon.id ? null : weapon.id)}><InventoryIcon item={{ ...weapon, category: 'armas-fogo' }} /></button>)}
                    </div>
                    {weapons.length === 0 ? (
                      <p className="es-equipment-empty">
                        Nenhuma arma equipada.
                      </p>
                    ) : (
                      weapons.map((weapon) => (
                        <div className={`es-kit-reveal ${selectedWeapon === weapon.id ? "is-open" : ""}`} key={weapon.id} aria-hidden={selectedWeapon !== weapon.id} inert={selectedWeapon !== weapon.id}><div className="es-kit-reveal-clip"><div className="es-equipment-row">
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
                          <label className="es-kit-damage"><span>DANO</span><EspiralDiceInput
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
                          /></label>
                          <button
                            type="button"
                            className="es-damage-roll"
                            aria-label={`Rolar dano de ${weapon.name || "arma"}`}
                            onClick={() => rollWeaponDamage(weapon)}
                            disabled={rolling}
                          >
                            Rolar dano
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
                        </div></div></div>
                      ))
                    )}
                  </div>
                  <div className="es-equipment-column">
                    <header>
                      <div>
                        <span className="es-eyebrow">PROTEÇÕES <span className="es-kit-count">{protections.length}</span></span>
                        <small>Defesa equipada · cobertura por região</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => { const item = { id: uniqueId(), name: "", value: "", region: "" }; update("protections", [...protections, item]); setSelectedProtection(item.id); }}
                      >
                        + Proteção
                      </button>
                    </header>
                    <div className="es-kit-icons" aria-label="Proteções equipadas na ficha">
                      {protections.map((protection, index) => <button type="button" key={protection.id} aria-label={`Ver proteção ${protection.name || 'sem nome'} ${index + 1}`} title={protection.name || 'Proteção sem nome'} aria-pressed={selectedProtection === protection.id} onClick={() => setSelectedProtection(selectedProtection === protection.id ? null : protection.id)}><InventoryIcon item={{ ...protection, category: 'protecao' }} /></button>)}
                    </div>
                    {protections.length === 0 ? (
                      <p className="es-equipment-empty">
                        Nenhuma proteção equipada.
                      </p>
                    ) : (
                      protections.map((protection) => (
                        <div className={`es-kit-reveal ${selectedProtection === protection.id ? "is-open" : ""}`} key={protection.id} aria-hidden={selectedProtection !== protection.id} inert={selectedProtection !== protection.id}><div className="es-kit-reveal-clip"><div className="es-equipment-row es-protection-row">
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
                          <label className="es-kit-protection"><span>PROTEÇÃO</span><input
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
                          /></label>
                          <button
                            type="button"
                            aria-label="Remover proteção"
                            onClick={() =>
                              removeEquipment("protections", protection.id)
                            }
                          >
                            ×
                          </button>
                          <datalist id={"es-regions-" + protection.id}>{[...BODY_REGIONS, "Braços", "Pernas", "Corpo inteiro"].map(name => <option key={name} value={name} />)}</datalist><label className="es-kit-region"><span>REGIÃO PROTEGIDA</span><input
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
                            placeholder="Ex.: Torso, cabeça, pernas" list={"es-regions-" + protection.id}
                          /></label>
                        </div></div></div>
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
                    <EspiralDamage key={region} region={region} onApply={(injury) => {
                      if (!injury.impact) return;
                      setSheet(previous => ({
                        ...previous,
                        integrity: Math.max(0, (Number(previous.integrity) || 0) - injury.impact),
                        injuries: [...previous.injuries, { ...injury, id: uniqueId() }],
                      }));
                    }} />
                    <details className="es-manual-injury">
                    <summary>Registro manual de lesão</summary>
                    <div className="es-manual-injury-fields">
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
                          "Catastrófica",
                          "Fatal",
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
                            id: uniqueId(),
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
                    </details>
                  </div>
                </div>
                <p className="es-help">
                  Impacto: 1–3 superficial · 4–6 moderada · 7–9 grave · 10–12
                  crítica · 13+ catastrófica / fatal. Ajuste a Integridade pelo
                  impacto recebido apenas no registro manual. Ao aplicar dano,
                  o desconto é automático. O Impacto combina potência, localização,
                  penetração e circunstâncias.
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
                        {injury.impact != null && <p>Impacto {injury.impact} · Dano {injury.damage} − Proteção {injury.protection} − Outros efeitos {injury.reduction}</p>}
                        <p>{INJURY_EFFECTS[injury.severity]}</p>
                        {injury.bleeding && <strong>Sangramento</strong>}
                        <small>Remover o registro não recupera Integridade.</small>
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
                  <span className="es-eyebrow">{sheet.vertente} · NÍVEL {["I", "II", "III"][vertenteLevel - 1]}</span>
                  <h3>{vertenteAbility.nome}</h3>
                  <p>{vertenteAbility.niveis[vertenteLevel - 1]}</p>
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
                <section className="es-inventory" aria-label="Inventário pessoal">
                  <header className="es-inventory-heading">
                    <div><span>Inventário pessoal</span><p>Selecione um item para consultar todos os dados disponíveis.</p></div>
                    <strong>{inventarioVisual.length} / {inventorySlotCount}</strong>
                  </header>
                  <div className="es-inventory-grid" aria-label="Itens do inventário">
                    {Array.from({ length: inventorySlotCount }, (_, index) => {
                      const item = inventarioVisual[index];
                      if (!item) return <span className="es-inventory-slot es-inventory-slot-empty" aria-hidden="true" key={`empty-${index}`}><i /></span>;
                      const selected = selectedInventoryItem?.key === item.key;
                      return (
                        <button
                          type="button"
                          className={`es-inventory-slot ${selected ? "is-selected" : ""}`}
                          aria-label={`${item.name}, ${item.summary}`}
                          aria-pressed={selected}
                          onClick={() => setSelectedInventoryKey(item.key)}
                          key={item.key}
                        >
                          <span className="es-inventory-slot-icon"><InventoryIcon item={item} /></span>
                          <span className="es-inventory-slot-name">{item.name}</span>
                          {item.quantity > 1 && <small>{item.quantity}</small>}
                        </button>
                      );
                    })}
                  </div>
                  <article className="es-inventory-detail" aria-live="polite">
                    {selectedInventoryItem ? <>
                      <header>
                        <span className="es-inventory-detail-icon"><InventoryIcon item={selectedInventoryItem} size={1.75} /></span>
                        <div><small>{inventoryCategoryName(selectedInventoryItem.category, selectedInventoryItem.kind)}</small><h3>{selectedInventoryItem.name}</h3></div>
                      </header>
                      <p>{selectedInventoryItem.description}</p>
                      {selectedInventoryItem.properties.length > 0 && <dl>
                        {selectedInventoryItem.properties.map((property) => <div key={property.label}><dt>{property.label}</dt><dd>{<EspiralDice value={property.value} />}</dd></div>)}
                      </dl>}
                    </> : <div className="es-inventory-detail-empty"><span>Nenhum item carregado</span><p>Itens adicionados pela Loja da Helena aparecerão aqui com seus detalhes.</p></div>}
                  </article>
                </section>
              </>
            )}
            {tab === "Background" && (
              <section className="es-background-page" aria-label="Background do personagem">
                <div className="es-background-copy">
                  <header>
                    <span className="es-eyebrow">ARQUIVO PESSOAL · BACKGROUND</span>
                    <h2>{sheet.name || "Quem era você antes de tudo mudar?"}</h2>
                    <p>Registre a pessoa por trás da ficha: sua história, suas marcas e aquilo que ainda a conecta ao mundo.</p>
                  </header>
                  <div className="es-background-facts" aria-label="Informações do personagem">
                    <div><span>Ocupação</span><strong>{sheet.occupation || "Não definida"}</strong></div>
                    <div><span>Vertente</span><strong>{sheet.vertente || "Não definida"}</strong></div>
                    <div><span>Idade</span><strong>{sheet.age || "Não definida"}</strong></div>
                    <div><span>Pronomes</span><strong>{sheet.pronoun || "Não definidos"}</strong></div>
                  </div>
                  <label className="es-background-field">
                    <span>Quem é esta pessoa?</span>
                    <textarea
                      value={sheet.backgroundDescription || ""}
                      onChange={(event) => update("backgroundDescription", event.target.value)}
                      placeholder="Aparência, personalidade, hábitos, medos e a impressão que deixa nos outros."
                    />
                  </label>
                  <label className="es-background-field es-background-field-long">
                    <span>O que aconteceu antes?</span>
                    <textarea
                      value={sheet.backgroundHistory || ""}
                      onChange={(event) => update("backgroundHistory", event.target.value)}
                      placeholder="Conte os acontecimentos, perdas e escolhas que trouxeram o personagem até aqui."
                    />
                  </label>
                  <label className="es-background-field">
                    <span>Vínculos importantes</span>
                    <textarea
                      value={sheet.backgroundConnections || ""}
                      onChange={(event) => update("backgroundConnections", event.target.value)}
                      placeholder="Pessoas, lugares, promessas e dívidas que ainda importam."
                    />
                  </label>
                </div>
                <aside className="es-background-portrait">
                  <div className="es-background-portrait-heading">
                    <span className="es-eyebrow">IMAGEM DO PERSONAGEM</span>
                    <strong>Corpo inteiro</strong>
                  </div>
                  <button
                    type="button"
                    className={`es-background-portrait-frame ${sheet.tabletopTokenImage ? "has-image" : ""}`}
                    onClick={() => tabletopTokenInput.current?.click()}
                    aria-label={sheet.tabletopTokenImage ? "Trocar imagem de corpo inteiro" : "Adicionar imagem de corpo inteiro"}
                  >
                    {sheet.tabletopTokenImage ? (
                      <img src={sheet.tabletopTokenImage} alt={`Corpo inteiro de ${sheet.name || "personagem"}`} />
                    ) : (
                      <span><b>Adicionar imagem</b><small>PNG com fundo transparente funciona melhor</small></span>
                    )}
                  </button>
                  <div className="es-background-portrait-actions">
                    <button type="button" onClick={() => tabletopTokenInput.current?.click()}>
                      {sheet.tabletopTokenImage ? "Trocar imagem" : "Escolher imagem"}
                    </button>
                    {sheet.tabletopTokenImage && (
                      <button type="button" onClick={() => update("tabletopTokenImage", "")}>Remover</button>
                    )}
                  </div>

                  <p>Use uma composição vertical, de preferência mostrando o personagem dos pés à cabeça.</p>
                </aside>
              </section>
            )}
            {tab === "Anotações" && (
              <>
                <SectionTitle
                  number="06"
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
                  number="07"
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
          {tab !== "Background" && <aside className="es-sidebar">
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

              {!difficultyLocked && scene && rollContext && <SceneDifficultySelector scene={scene} enemies={sceneEnemies} selected={rollContext.id} readOnly={difficultyLocked} onChange={onRollContextChange}/>}
              <div className="es-roll-numbers">
                {!difficultyLocked && !rollContext && <>
                <Field
                  label="Dificuldade"
                  type="number"
                  min="2"
                  max="30"
                  value={difficulty}
                  onChange={(v) => setDifficulty(Math.max(2, clamp(v, 30)))}
                />
                </>}
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
                    placeholder="Ex.: 2⬡6+3"
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
                      ? <EspiralDice value={history[0].label} />
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
                        Maior: {history[0].best}{!difficultyLocked && <> · Margem: {history[0].margin > 0 ? "+" : ""}{history[0].margin}</>}
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
                      <b>{<EspiralDice value={entry.label} />}</b> ·{" "}
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
          </aside>}
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
            {!embedded && <button type="button" onClick={abrirSistemaAnterior}>
              {fichaDarkness ? "Abrir ficha Darkness ↗" : "Ir para tela inicial ↗"}
            </button>}
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
      {tabletopOpen && <div className="es-roll-modal-backdrop" onMouseDown={event => {if(event.target===event.currentTarget) setTabletopOpen(false);}}>
        <section className="es-roll-modal" role="dialog" aria-modal="true" aria-label="Entrar no tabletop">
          <button type="button" onClick={() => setTabletopOpen(false)} aria-label="Fechar seleção de campanha">×</button>
          <h2>Entrar no tabletop</h2>
          {tabletopError && <p role="alert">{tabletopError}</p>}
          {!hasEspiralToken(sheet) ? <button type="button" onClick={() => {setTabletopOpen(false);setEditing(false);setTab("Background");}}>Adicionar imagem de corpo inteiro</button> : <>
            <p>A imagem de corpo inteiro da sua ficha será usada como token.</p>
            {tabletopLoading ? <p role="status">Carregando campanhas…</p> : tabletopCampaigns.length ? tabletopCampaigns.map(campaign => <button type="button" key={campaign.id || campaign.codigo} onClick={() => enterTabletop(campaign)}>{campaign.nome}</button>) : !tabletopError && <p>Esta ficha ainda não está vinculada a uma campanha com tabletop 3D. Peça ao mestre para adicioná-la.</p>}
          </>}
        </section>
      </div>}
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
            className={`es-roll-modal ${!rolling && history[0].survival ? history[0].margin < 0 ? `es-survival-failed ${history[0].outcome === 'Falha grave' ? 'es-survival-rupture' : ''}` : 'es-survival-success' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="es-roll-modal-title"
          >
            <span className="es-eyebrow">{history[0].attributeOnly ? "ROLAGEM DE ATRIBUTO" : "ROLAGEM DE RECURSO"}</span>
            <h2 id="es-roll-modal-title">{<EspiralDice value={history[0].label} />}</h2>
            <p>{history[0].attribute ? `Teste de ${ATTRIBUTES[history[0].attribute].name}` : history[0].attributeOnly ? "Rolagem somente do atributo" : "Rolagem de dano"}</p>
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
                    <h3>{history[0].attributeOnly ? "Maior dado" : "Dano total"}</h3>
                    {!history[0].attributeOnly && <EspiralDamageResult damage={history[0].total} />}
                    {history[0].modifier ? <p>Modificador {history[0].modifier > 0 ? "+" : ""}{history[0].modifier}</p> : null}
                  </>
                ) : (
                  <>
                    <strong>{history[0].best}</strong>
                    <h3>{history[0].outcome}</h3>
                    {history[0].survival && history[0].margin < 0 && <p>+1 falha de sobrevivência · {sheet.failures}/3</p>}
                    {history[0].survival && history[0].margin >= 0 && <p>Uma falha de sobrevivência removida, se houver · {sheet.failures}/3</p>}
                    {!difficultyLocked && <p>Margem {history[0].margin > 0 ? "+" : ""}{history[0].margin}{history[0].mastery ? " · Domínio" : ""}</p>}
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






