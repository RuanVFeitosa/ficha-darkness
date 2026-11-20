import DarknessAbilities from '../components/mestre/DarknessAbilities';
import DarknessMasterHeader from "../components/mestre/DarknessMasterHeader";
import DarknessEquipment from "../components/mestre/DarknessEquipment";
import { searchMasterSheets } from "../utils/darknessMaster";
import SystemAbilitiesCatalog from '../components/habilidades/SystemAbilitiesCatalog';
import RecriacaoRequests from '../components/jogador/RecriacaoRequests';
import {createSkillTreeSync} from '../utils/skillTreeSync';
import HopeWhispersEditor from '../components/absoluto/HopeWhispersEditor';
import { isEspiralSheet, salvarFichaEspiral, unirFichasEspiral } from '../services/espiralApi';
import useMasterSheetViewer from '../hooks/useMasterSheetViewer';
import NumberInput from '../components/ui/NumberInput';
import { ehAbsolutoV1, REGIOES } from '../data/absolutoV1';
import AbsolutoMedo from '../components/absoluto/AbsolutoMedo';
import AbsolutoAtivosResumo from '../components/absoluto/AbsolutoAtivosResumo';
import AbilityEditDiff from '../components/habilidades/AbilityEditDiff';
import {decidirEdicaoHabilidade} from '../utils/abilityEdits';
import { espiralDie } from '../utils/espiralDice';
import AbsolutoAgentCard from '../components/absoluto/AbsolutoAgentCard';

import AbilityDocument from '../components/habilidades/AbilityDocument';
import TokenAnimationStudio from '../components/tokens/TokenAnimationStudio';
import DarknessEncounters from '../components/espiral/DarknessEncounters';
import EspiralDashboardCatalog from '../components/espiral/EspiralDashboardCatalog';
import { grantEspiralCatalogEntry } from '../utils/espiralCatalogGrant';
import { EspiralAgentCard } from "../components/espiral/EspiralDashboard";
import "../styles/EspiralDashboard.css";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { confirmarDialogo, solicitarDialogo } from "../components/ui/DialogoGlobal";
import Icon from "@mdi/react";
import { mdiArrowLeft, mdiDeleteOutline, mdiRefresh, mdiPencil, mdiPistol, mdiSword, mdiKnifeMilitary, mdiAxe, mdiBowArrow, mdiHammer, mdiBaseballBat, mdiTargetVariant } from "@mdi/js";
import "../styles/DashboardMestre.css";
import "../styles/DashboardMestreEspiral.css";
import '../styles/AbsolutoDashboard.css';
import '../styles/AbsolutoDashboardDossier.css';
import '../styles/DarknessMaster.css';
import '../styles/DarknessDashboardPalette.css';
import { buscarDestinos, salvarDestinos, apagarPersonagem, buscarArvoresHabilidades, buscarCatalogoLoja, listarPersonagens, salvarArvoresHabilidades, salvarCatalogoLoja, buscarPersonagem, salvarPersonagem } from "../services/personagemApi";
import { atualizarDestinoNaFicha } from "../utils/destinos";
import {
  compressBackgroundImage,
  compressProfileImage,
} from "../services/imageCompression";
import "../utils/itemIcons";
import {
  notificarArvoresAtualizadas,
  notificarPersonagemAtualizado,
  ouvirArvoresAtualizadas,
  ouvirPersonagemAtualizado,
} from "../services/syncEvents";
import { SYNC_INTERVALS, iniciarPollingVisivel } from "../services/syncPolicy";
import { estadoInicial } from "./fichaPersonagem";
import {
  carregarArvoresCustom,
  obterTodasArvores,
  salvarArvoresCustom,
} from "../data/Classes/arvoresHabilidades";
import { receitasCriacao as RECEITAS_PADRAO } from "../data/criacao/receitasCriacao";
import CampanhaDashboard from "../components/campanha/CampanhaDashboard";
import {
  CATEGORIAS_LOJA,
  DEFAULT_CATALOGO_LOJA,
  aplicarDefesasAtualizadas,
  catalogoPossuiDanosBalanceados,
  catalogoPossuiDefesasAtualizadas,
  normalizarItemLoja,
} from "../data/catalogoLoja";
import { MODIFICACOES } from "../data/Catalogo/modificacoes";
import {
  calcularGanhoRecursosNivel,
  obterCustosNivel,
} from "../data/evolucaoPersonagem";
import { ATTRIBUTES, integrityMax } from "../data/espiral";

const STORAGE_KEY = "fichaRPG_personagem";
const CATALOGO_STORAGE_KEY = "lojaHelena_catalogo";
const RECEITAS_STORAGE_KEY = "darkness_receitas_criacao";

const isFichaEspiral = (personagem = {}) =>
  personagem?.version === 1 && personagem?.attributes && !personagem?.atributos;

const listarFichasEspiralLocais = () => {
  const prefixo = "espiral:sheet:v1:";
  const fichas = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const chave = localStorage.key(index);
    if (!chave?.startsWith(prefixo)) continue;

    try {
      const personagem = JSON.parse(localStorage.getItem(chave));
      if (isFichaEspiral(personagem)) {
        fichas.push({
          fichaId: `espiral:${chave.slice(prefixo.length)}`,
          espiralId: chave.slice(prefixo.length),
          personagem,
          sistema: "espiral",
        });
      }
    } catch {
      // Uma ficha local incompleta não deve impedir a leitura das demais.
    }
  }

  return fichas.sort((a, b) =>
    String(a.personagem.name || "").localeCompare(String(b.personagem.name || ""), "pt-BR"),
  );
};

const membrosProtegidosPelaDefesa = (item = {}) => {
  const area = `${item.areaDefesa || ""} ${item.entrega || item.detalhes || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (area.includes("conjunto")) {
    return [
      "cabeca",
      "torso",
      "bracoDireito",
      "bracoEsquerdo",
      "pernaDireita",
      "pernaEsquerda",
    ];
  }
  if (area.includes("cabeca") || area.includes("face")) return ["cabeca"];
  if (area.includes("torso")) return ["torso"];
  if (
    area.includes("braco") ||
    area.includes("mao") ||
    area.includes("empunh")
  ) {
    return ["bracoDireito", "bracoEsquerdo"];
  }
  if (area.includes("perna") || area.includes("pes")) {
    return ["pernaDireita", "pernaEsquerda"];
  }
  return [];
};

const ICONES_ARMAS_EXCLUSIVAS = [
  { id: "pistola", nome: "Pistola", icone: mdiPistol },
  { id: "precisao", nome: "Precisão", icone: mdiTargetVariant },
  { id: "espada", nome: "Espada", icone: mdiSword },
  { id: "lamina", nome: "Lâmina", icone: mdiKnifeMilitary },
  { id: "machado", nome: "Machado", icone: mdiAxe },
  { id: "arco", nome: "Arco", icone: mdiBowArrow },
  { id: "martelo", nome: "Martelo", icone: mdiHammer },
  { id: "impacto", nome: "Impacto", icone: mdiBaseballBat },
];

const reaplicarMelhoriasDaArma = (armaStatus, melhoriaArma = {}) => {
  if (!armaStatus) return armaStatus;

  const status = { ...armaStatus };
  const nivel = (chave) => Math.max(0, parseInt(melhoriaArma[chave], 10) || 0);
  const danoExtra = nivel("dano");

  if (danoExtra > 0 && status.dmg) {
    const dano = String(status.dmg).match(/(\d+)d(\d+)([+-]\d+)?/i);
    if (dano) {
      status.dmg = `${Math.min(12, Number(dano[1]) + danoExtra)}d${dano[2]}${dano[3] || ""}`;
    }
  }

  const criticoExtra = nivel("critico");
  if (criticoExtra > 0 && status.rof !== undefined && status.rof !== "") {
    status.rof = Math.max(1, (parseInt(status.rof, 10) || 20) - criticoExtra);
  }

  const incrementarTexto = (texto, quantidade, padrao) => {
    let resultado = String(texto || "").trim();
    for (let index = 0; index < quantidade; index += 1) {
      const bonus = resultado.match(/([+-]\d+)/);
      if (bonus) {
        resultado = resultado.replace(
          /([+-]\d+)/,
          `${parseInt(bonus[1], 10) + 1}`,
        );
      } else {
        resultado = resultado
          ? `${resultado}${resultado.includes("|") ? " " : " | "}+1`
          : `${padrao} | +1`;
      }
    }
    return resultado;
  };

  const precisaoExtra = nivel("precisao");
  if (precisaoExtra > 0) {
    status.precision = incrementarTexto(
      status.precision,
      precisaoExtra,
      "Percepção",
    );
  }

  const controleExtra = nivel("controle");
  if (controleExtra > 0) {
    status.control = incrementarTexto(
      status.control,
      controleExtra,
      "Persistência",
    );
  }

  const velocidadeExtra = nivel("velocidade");
  if (velocidadeExtra > 0) {
    const mobilidade = String(status.mobility || "").trim();
    const alvoAtual =
      parseInt(mobilidade.match(/(\d+)\s*alvos?/i)?.[1], 10) || 1;
    const prefixo = mobilidade.includes("|")
      ? mobilidade.split("|")[0].trim() || "Firmeza"
      : "Firmeza";
    status.mobility = `${prefixo} | ${alvoAtual + velocidadeExtra} alvos`;
  }

  return status;
};

const aplicarAprimoramentosNoStatus = (armaStatus, modificacoes = []) => {
  if (!armaStatus) return armaStatus;

  const status = { ...armaStatus };
  const dano = String(status.dmg || "").match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!dano) return status;

  let quantidade = Number(dano[1]);
  const faces = dano[2];
  let bonus = parseInt(dano[3], 10) || 0;

  const aplicarAjuste = (valor, direcao = 1) => {
    if (typeof valor === "number") {
      bonus += valor * direcao;
      return;
    }

    const texto = String(valor || "").trim();
    const dadosExtras = texto.match(/^(\d+)d$/i);
    if (dadosExtras) {
      quantidade = Math.max(
        1,
        Math.min(12, quantidade + Number(dadosExtras[1]) * direcao),
      );
      return;
    }

    const bonusFixo = texto.match(/^([+-]?\d+)$/);
    if (bonusFixo) bonus += Number(bonusFixo[1]) * direcao;
  };

  modificacoes.forEach((modificacao) => {
    const efeitos = modificacao?.modificacao?.efeitos || {};
    aplicarAjuste(efeitos.bonusDano, 1);
    aplicarAjuste(efeitos.penalidadeDano, -1);
  });

  status.dmg = `${quantidade}d${faces}${bonus ? `${bonus > 0 ? "+" : ""}${bonus}` : ""}`;
  return status;
};

const fichaVazia = {
  nome: "",
  pronome: "Ele",
  classe: "",
  especialidade: "",
};

const itemInventarioVazio = {
  nome: "",
  detalhes: "",
};

const ritoVazio = {
  nome: "",
  custo: "",
};

const itemLojaVazio = {
  id: "",
  nome: "",
  categoria: "armas-fogo",
  preco: 0,
  detalhe: "",
  entrega: "",
  dano: "",
  bonusDano: "",
  defesaBonus: 0,
  resistencia: "",
  resistenciasDano: [],
  tipoArma: "",
  quantidade: 0,
  municaoEspecial: false,
  nivelRito: "iniciante",
  subtipo: "nenhum", // "fogo", "corpo" ou "nenhum" (para armas exclusivas)
  icone: "",
  modificacoesArma: [],
  aprimoramentoCustomizado: null,
  armaStatus: {
    tipo: "",
    dmg: "",
    rof: "",
    mag: "",
    disparosSemDesvantagem: "",
    recarga: "",
    critico: "",
    danoCabeca: "",
    hipfire: "",
    precision: "",
    control: "",
    mobility: "",
  },
};

const membrosFicha = [
  { chave: "cabeca", nome: "Cabeca" },
  { chave: "torso", nome: "Torso" },
  { chave: "bracoDireito", nome: "Braco direito" },
  { chave: "bracoEsquerdo", nome: "Braco esquerdo" },
  { chave: "pernaDireita", nome: "Perna direita" },
  { chave: "pernaEsquerda", nome: "Perna esquerda" },
];

const gerarIdReceita = (nome, categoria) =>
  `${categoria}-${nome}`
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `${Date.now()}`;

const normalizarReceitasPadrao = (receitas = []) =>
  receitas.map((grupo) => ({
    categoria: grupo.categoria || "Outros",
    itens: (grupo.itens || []).map((item, index) => ({
      id: gerarIdReceita(item.nome, grupo.categoria || `grupo-${index}`),
      nome: item.nome || "Receita sem nome",
      icone: item.icone || "",
      tipo: item.tipo || "",
      durabilidade: item.durabilidade || "",
      dano: item.dano || "",
      efeito: item.efeito || "",
      ingredientes: Array.isArray(item.ingredientes)
        ? item.ingredientes.map((ingrediente) => ({
            nome:
              typeof ingrediente === "string"
                ? ingrediente
                : ingrediente.nome || "",
            icone: ingrediente.icone || "",
          }))
        : [],
    })),
  }));

const numeroRomanoDashboard = (numero) => {
  const romanos = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ];

  let n = Math.max(1, parseInt(numero, 10) || 1);
  let resultado = "";

  romanos.forEach(([letra, valor]) => {
    while (n >= valor) {
      resultado += letra;
      n -= valor;
    }
  });

  return resultado;
};

const porcentagemRecurso = (atual = 0, max = 0) =>
  max > 0 ? `${Math.min(100, Math.max(0, (atual / max) * 100))}%` : "0%";

const CampoNumeroEditavel = ({ valor, onConfirmar, ...props }) => {
  const [rascunho, setRascunho] = useState(String(valor ?? ""));

  useEffect(() => {
    setRascunho(String(valor ?? ""));
  }, [valor]);

  return (
    <input
      {...props}
      value={rascunho}
      onChange={(event) => setRascunho(event.target.value)}
      onBlur={() =>
        onConfirmar(
          Number.isFinite(parseInt(rascunho, 10)) ? parseInt(rascunho, 10) : 0,
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
};

const ResourceDots = ({ atual = 0, max = 0, tipo }) => {
  const total = Math.max(0, Math.min(100, Number.parseInt(max, 10) || 0));
  const preenchidos = Math.max(0, Math.min(total, Number.parseInt(atual, 10) || 0));

  return (
    <div className={`mestre-resource-dots ${tipo}`} aria-label={`${preenchidos} de ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <i key={index} className={index < preenchidos ? "ativo" : ""} />
      ))}
    </div>
  );
};

const DashboardFichaCard = memo(({ ficha, tipo = "jogador", onAbrir }) => {
  const personagemCard = ficha.personagem || ficha;
  const fichaEspiral = isFichaEspiral(personagemCard);
  const membros = personagemCard.membros || {};
  const imagem =
    personagemCard.profileImage ||
    personagemCard.fotoPerfil ||
    "https://placehold.co/600x800?text=Sem+Foto";
  const atributosResumo = fichaEspiral
    ? Object.entries(personagemCard.attributes || {}).map(([atributo, valor]) => {
        const estagio = Math.max(1, Math.min(5, Number(valor || 1)));
        return [
          ATTRIBUTES[atributo]?.name || atributo,
          [4, 6, 8, 10, 12][estagio - 1],
          ATTRIBUTES[atributo]?.stages?.[estagio - 1] || "",
        ];
      })
    : Object.entries(personagemCard.atributos || {});
  const integridadeMaxima = fichaEspiral
    ? integrityMax(personagemCard.attributes?.pulso, personagemCard.integrityTable)
    : 0;
  const sanidadeAtual = fichaEspiral
    ? Number(personagemCard.sanity || 0)
    : Number(personagemCard.sanidade?.atual || 0);
  const sanidadeMaxima = fichaEspiral ? 10 : Number(personagemCard.sanidade?.max || 0);
  const esperancaAtual = fichaEspiral
    ? Number(personagemCard.hope || 0)
    : Number(personagemCard.esperanca?.atual || 0);
  const esperancaMaxima = fichaEspiral ? 10 : Number(personagemCard.esperanca?.max || 0);

  if (fichaEspiral) return <EspiralAgentCard ficha={ficha} attributes={atributosResumo} integrityMaximum={integridadeMaxima} onOpen={onAbrir} />;

  return <AbsolutoAgentCard ficha={ficha} tipo={tipo} onAbrir={onAbrir}/>;
});

const ModalFichaEspiral = ({ ficha, onClose, onSalvar }) => {
  const sheet = ficha?.personagem || ficha;
  const [novoItem, setNovoItem] = useState("");
  const [novaHabilidade, setNovaHabilidade] = useState("");
  const [evolucaoDelta, setEvolucaoDelta] = useState(1);
  const maxIntegrity = integrityMax(sheet.attributes?.pulso, sheet.integrityTable);
  const atributos = Object.entries(sheet.attributes || {});
  const recursos = Object.entries(sheet.resources || {}).filter(([, grau]) => Number(grau) > 0);
  const inventario = String(sheet.inventory || "").split("\n").map((item) => item.trim()).filter(Boolean);
  const habilidades = String(sheet.abilities || "").split("\n").map((item) => item.trim()).filter(Boolean);
  const alterarLista = (campo, lista) => onSalvar({ [campo]: lista.join("\n") });
  const alterarPontosEvolucao = () => {
    const delta = parseInt(evolucaoDelta, 10) || 0;
    const atuais = Math.max(0, Number(sheet.evolution?.points) || 0);
    const proximo = Math.max(0, atuais + delta);
    if (!delta || proximo === atuais) return;
    onSalvar({ evolution: { ...(sheet.evolution || {}), points: proximo } });
  };

  return (
    <div className="mestre-modal-overlay espiral-leitura-overlay" onClick={onClose}>
      <section className="mestre-modal-ficha espiral-leitura" onClick={(event) => event.stopPropagation()}>
        <header className="espiral-leitura-cabecalho">
          <div>
            <span>Arquivo Darkness // agente</span>
            <h2>{sheet.name || "Sem nome"}</h2>
            <p>{[sheet.pronoun, sheet.occupation, sheet.vertente].filter(Boolean).join(" · ") || "Sem identificação"}</p>
          </div>
          <div className="espiral-leitura-acoes">
            <button type="button" className="espiral-abrir-ficha" onClick={() => { const id = ficha.espiralId || ficha.fichaId?.replace(/^espiral[:_]/, '') || sheet.espiralId; if (id) window.open(`/?sistema=espiral&ficha=${encodeURIComponent(id)}`, "_blank", "noopener,noreferrer"); }}>Abrir ficha completa</button>
            <button type="button" className="mestre-modal-fechar" onClick={onClose} aria-label="Fechar ficha">×</button>
          </div>
        </header>

        <div className="espiral-leitura-corpo">
          <img className="espiral-leitura-retrato" src={sheet.profileImage || "https://placehold.co/300x300?text=Sem+Foto"} alt={`Retrato de ${sheet.name || "agente"}`} />
          <section className="espiral-leitura-atributos">
            <span>ATRIBUTOS</span>
            {atributos.map(([id, nivel]) => {
              const estagio = Math.max(1, Math.min(5, Number(nivel || 1)));
              return <div key={id}><b>{ATTRIBUTES[id]?.name || id}</b><small>{ATTRIBUTES[id]?.stages?.[estagio - 1]}</small><strong>{espiralDie([4, 6, 8, 10, 12][estagio - 1])}</strong></div>;
            })}
          </section>
          <section className="espiral-leitura-status">
            <span>STATUS ATUAL</span>
            <div><label>INTEGRIDADE</label><i className="integrity"><i style={{ width: porcentagemRecurso(sheet.integrity, maxIntegrity) }} /></i><b>{sheet.integrity || 0} / {maxIntegrity}</b></div>
            <div><label>SANIDADE</label><i className="points sanity" style={{ "--points": Math.max(0, Math.min(10, Number(sheet.sanity || 0))) }} /><b>{sheet.sanity || 0} / 10</b></div>
            <div><label>ESPERANÇA</label><i className="points hope" style={{ "--points": Math.max(0, Math.min(10, Number(sheet.hope || 0))) }} /><b>{sheet.hope || 0} / 10</b></div>
          </section>
        </div>
        <section className="espiral-leitura-recursos"><span>RECURSOS</span>{recursos.length ? recursos.map(([nome, grau]) => <div key={nome}><b>{nome}</b><small>GRAU {Number(grau) + 1}</small></div>) : <p>Nenhum recurso treinado.</p>}</section>
        <section className="espiral-leitura-edicao">
          <div className="espiral-edicao-bloco espiral-evolucao-mestre"><span>PONTOS DE EVOLUÇÃO <em>{Math.max(0, Number(sheet.evolution?.points) || 0)}</em></span><p>Concedidos pelo Mestre para a Transformação.</p><div className="espiral-evolucao-controles"><NumberInput type="number" value={evolucaoDelta} onChange={(event) => setEvolucaoDelta(event.target.value)} step="1" aria-label="Quantidade de pontos de evolução" /><button type="button" onClick={alterarPontosEvolucao}>{Number(evolucaoDelta) >= 0 ? "Conceder" : "Remover"}</button></div></div>
          <div className="espiral-edicao-bloco"><span>INVENTÁRIO <em>{inventario.length}</em></span><div className="espiral-edicao-lista">{inventario.length ? inventario.map((item, index) => <div key={`${item}-${index}`}><b>{item}</b><button type="button" aria-label={`Remover ${item}`} onClick={() => alterarLista("inventory", inventario.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>) : <small>Nenhum item no inventário.</small>}</div><form onSubmit={(event) => { event.preventDefault(); if (novoItem.trim()) { alterarLista("inventory", [...inventario, novoItem.trim()]); setNovoItem(""); } }}><input value={novoItem} onChange={(event) => setNovoItem(event.target.value)} placeholder="Adicionar item" /><button type="submit">Dar item</button></form></div>
          <div className="espiral-edicao-bloco"><span>HABILIDADES <em>{habilidades.length}</em></span><div className="espiral-edicao-lista">{habilidades.length ? habilidades.map((item, index) => <div key={`${item}-${index}`}><b>{item}</b><button type="button" aria-label={`Remover ${item}`} onClick={() => alterarLista("abilities", habilidades.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>) : <small>Nenhuma habilidade registrada.</small>}</div><form onSubmit={(event) => { event.preventDefault(); if (novaHabilidade.trim()) { alterarLista("abilities", [...habilidades, novaHabilidade.trim()]); setNovaHabilidade(""); } }}><input value={novaHabilidade} onChange={(event) => setNovaHabilidade(event.target.value)} placeholder="Adicionar habilidade" /><button type="submit">Dar habilidade</button></form></div>
        </section>
      </section>
    </div>
  );
};

const listarFichasLocais = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(`${STORAGE_KEY}_`))
    .map((key) => {
      const fichaId = key.replace(`${STORAGE_KEY}_`, "");
      try {
        return {
          fichaId,
          personagem: JSON.parse(localStorage.getItem(key)),
          updatedAt: null,
        };
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.fichaId.localeCompare(b.fichaId));

const salvarFichaLocal = (fichaId, personagem) => {
  const chave = `${STORAGE_KEY}_${fichaId}`;

  try {
    localStorage.setItem(chave, JSON.stringify(personagem));
  } catch (error) {
    console.warn("LocalStorage cheio. Salvando sem foto de perfil.", error);

    const personagemSemFoto = {
      ...personagem,
      fotoPerfil: "",
    };

    try {
      localStorage.setItem(chave, JSON.stringify(personagemSemFoto));
    } catch (novoErro) {
      console.warn("Nao foi possivel salvar localmente.", novoErro);
    }
  }
};

const DashboardMestre = () => {
  useEffect(() => {
    const previous = document.body.getAttribute('data-darkness-dashboard');
    document.body.setAttribute('data-darkness-dashboard', 'true');
    return () => {
      if (previous === null) document.body.removeAttribute('data-darkness-dashboard');
      else document.body.setAttribute('data-darkness-dashboard', previous);
    };
  }, []);
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState("");
  const [personagem, setPersonagem] = useState(null);
  useState(fichaVazia);
  useState(itemInventarioVazio);
  useState(ritoVazio);
  const [creditosDelta, setCreditosDelta] = useState(100);
  const [ritosCreditosDelta, setRitosCreditosDelta] = useState(100);
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO_LOJA);
  const [itemLojaSelecionadoId, setItemLojaSelecionadoId] = useState("");
  const [balasEntrega,setBalasEntrega] = useState({});
  const [menuHamburguerAberto, setMenuHamburguerAberto] = useState(false);
  const [receitasCriacaoDashboard, setReceitasCriacaoDashboard] =
    useState(RECEITAS_PADRAO);
  const [receitaEditor] = useState({
    id: "",
    categoria: "Armas Aprimoráveis",
    nome: "",
    icone: "",
    tipo: "",
    durabilidade: "",
    dano: "",
    efeito: "",
    ingredientesTexto: "",
  });

  const [, setCardExpandidoId] = useState(null);
  useState(null);
  const [novoItemLoja, setNovoItemLoja] = useState(itemLojaVazio);
  const [categoriaLojaAtiva, setCategoriaLojaAtiva] = useState("defesas");
  useState("perfil");
  const [aba, setAba] = useState(() => ["animacoes","campanha"].includes(new URLSearchParams(window.location.search).get("aba")) ? new URLSearchParams(window.location.search).get("aba") : "fichas");
  const [buscaEspiral, setBuscaEspiral] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [abaLojaEditor, setAbaLojaEditor] = useState("armas-fogo");
  const [itemEditandoId, setItemEditandoId] = useState(null);
  const [itemEditandoDados, setItemEditandoDados] = useState(null);
  const [mostrarFormNovoItem, setMostrarFormNovoItem] = useState(false);
  const [nivelRitoDashboard, setNivelRitoDashboard] = useState("iniciante");
  const [tipoMunicaoEditor, setTipoMunicaoEditor] = useState("pistola");
  const [editandoDashboard] = useState(false);
  const { modalFichaAberto, setModalFichaAberto, fichaEspiralAberta, setFichaEspiralAberta } = useMasterSheetViewer();
  const [salvandoNivel, setSalvandoNivel] = useState(false);
  const fichasEmGravacaoRef = useRef(new Set());

  const [arvoresEditor, setArvoresEditor] = useState({});
  const arvoresSync=useRef(null);
  if(!arvoresSync.current)arvoresSync.current=createSkillTreeSync(salvarArvoresHabilidades);
  const [salvandoArvores,setSalvandoArvores]=useState(false);
  const [classeArvoreAtiva, setClasseArvoreAtiva] = useState("aniquilador");
  const [tipoHabilidadeEditor, setTipoHabilidadeEditor] = useState("absolutas");
  const [especialidadeEditorId, setEspecialidadeEditorId] = useState("");
  const [habilidadeEditando, setHabilidadeEditando] = useState(null);
  const [habilidadeEditandoCardId, setHabilidadeEditandoCardId] =
    useState(null);
  const [habilidadeEditandoDados, setHabilidadeEditandoDados] = useState(null);
  const [mostrarFormHabilidade, setMostrarFormHabilidade] = useState(false);

  const [personagemSelecionado, setPersonagemSelecionado] = useState(null); // objeto completo do personagem
  const [marcas, setMarcas] = useState(() => {
    try { const dados = JSON.parse(localStorage.getItem("darkness_marcas")); return Array.isArray(dados) ? dados : []; }
    catch { return []; }
  });
  const marcasGravandoRef = useRef(false);
  const [marcasCarregadas, setMarcasCarregadas] = useState(false);
  const [marcaEditando, setMarcaEditando] = useState(null);
  const [formMarca, setFormMarca] = useState({
    nome: "",
    descricao: "",
    beneficios: "",
    penalidades: "",
    habilidades: [],
    corLinhas: "#111111",
    imagemFundo: "",
  });
  const [personagemSelecionadoId, setPersonagemSelecionadoId] = useState("");
  const [marcaSelecionadaId, setMarcaSelecionadaId] = useState("");

  const STORAGE_INIMIGOS = "darkness_inimigos";

  const [inimigos, setInimigos] = useState([]);
  const [inimigoEditando, setInimigoEditando] = useState(null);
  const [pastasInimigos, setPastasInimigos] = useState([]);
  const [pastaInimigosAtiva, setPastaInimigosAtiva] = useState("todas");

  const STORAGE_NPCS = "darkness_npcs";

  const [subAbaNpcs, setSubAbaNpcs] = useState("inimigos");
  const [npcs, setNpcs] = useState([]);
  const [npcEditando, setNpcEditando] = useState(null);
  const [pastasNpcs, setPastasNpcs] = useState([]);
  const [pastaNpcsAtiva, setPastaNpcsAtiva] = useState("todas");

  const [rolagensMestre, setRolagensMestre] = useState([]);
  const [painelRolagensAberto, setPainelRolagensAberto] = useState(true);
  const [evolucaoDelta, setEvolucaoDelta] = useState(1);

  const [popup, setPopup] = useState(null);

  const recriacoesPendentes=fichas.filter(ficha=>ficha.personagem?.recriacaoPendente).length;
  const habilidadesPendentes = useMemo(
    () =>
      fichas.flatMap((ficha) =>
        (ficha.personagem?.habilidadesCriadas || [])
          .filter(
            (habilidade) => (habilidade.status || "pendente") === "pendente" || Boolean(habilidade.edicaoPendente),
          )
          .map((habilidade) => ({ ficha, habilidade })),
      ),
    [fichas],
  );

  const analisarHabilidadeCriada = async (ficha, habilidadeId, aprovar,edicaoId) => {
    if(edicaoId){
      try{
        const base=await buscarPersonagem(ficha.fichaId);
        if(!base)throw new Error('Ficha indisponível.');
        const next=decidirEdicaoHabilidade(base,habilidadeId,aprovar,edicaoId);
        const salvo=await salvarPersonagem(ficha.fichaId,next)||next;
        salvarFichaLocal(ficha.fichaId,salvo);
        notificarPersonagemAtualizado(ficha.fichaId,salvo);
        setFichas(atuais=>atuais.map(item=>item.fichaId===ficha.fichaId?{...item,personagem:salvo}:item));
        if(fichaSelecionada===ficha.fichaId)setPersonagem(salvo);
        setMensagem(aprovar?'Edição aprovada. A nova versão está ativa.':'Edição recusada. A versão anterior e os recursos foram mantidos.');
      }catch(error){setMensagem(error.message||'Não foi possível analisar a edição. Tente novamente.');}
      return;
    }
    let personagemBase = ficha.personagem || {};
    try {
      personagemBase =
        (await buscarPersonagem(ficha.fichaId)) || personagemBase;
    } catch {
      // Sem conexão, mantém a cópia já carregada no Dashboard.
    }
    const habilidade = (personagemBase.habilidadesCriadas || []).find(
      (item) => item.id === habilidadeId,
    );
    if (!habilidade) {
      setMensagem("Esta habilidade já não está mais na ficha.");
      return;
    }

    if(habilidade.edicaoPendente || (habilidade.status || 'pendente')!=='pendente'){
      setMensagem('Esta solicitação mudou ou já foi analisada. Atualize o painel antes de continuar.');
      return;
    }
    const personagemAtualizado = structuredClone(personagemBase);
    personagemAtualizado.habilidadesCriadas = aprovar
      ? (personagemAtualizado.habilidadesCriadas || []).map((item) =>
          item.id === habilidadeId
            ? {
                ...item,
                status: "aprovada",
                analisadaEm: new Date().toISOString(),
              }
            : item,
        )
      : (personagemAtualizado.habilidadesCriadas || []).filter(
          (item) => item.id !== habilidadeId,
        );
    if (aprovar && habilidade.tipo === "rito") {
      personagemAtualizado.rituais = [
        ...(personagemAtualizado.rituais || []),
        {
          id: habilidade.id,
          nome: habilidade.nome,
          descricao: habilidade.descricao,
          ...(habilidade.paginas ? {paginas:habilidade.paginas} : {}),
          custo: `${habilidade.custo} SAN`,
          nivelRito: "Personalizado",
          criadoPeloJogador: true,
        },
      ];
    }
    if (aprovar && habilidade.tipo === "poderAbsoluto") {
      personagemAtualizado.poderesAbsolutos = [
        ...(personagemAtualizado.poderesAbsolutos || []),
        {
          id: habilidade.id,
          nome: habilidade.nome,
          descricao: habilidade.descricao,
          ...(habilidade.paginas ? {paginas:habilidade.paginas} : {}),
          custo: `${habilidade.custo} SAN`,
          icone: "✦",
          criadoPeloJogador: true,
        },
      ];
    }
    if (!aprovar) {
      const custo = parseInt(habilidade.custo, 10) || 0;
      if (habilidade.recurso === "evolucao") {
        personagemAtualizado.pontosEvolucao = {
          ...(personagemAtualizado.pontosEvolucao || {}),
          disponiveis:
            (parseInt(personagemAtualizado.pontosEvolucao?.disponiveis, 10) ||
              0) + custo,
        };
      } else if (
        habilidade.recurso === "esperanca" ||
        habilidade.recurso === "sanidade"
      ) {
        const recurso = habilidade.recurso;
        const novoMaximo =
          (parseInt(personagemAtualizado[recurso]?.max, 10) || 0) + custo;
        personagemAtualizado[recurso] = {
          ...(personagemAtualizado[recurso] || {}),
          max: novoMaximo,
          atual: Math.min(
            novoMaximo,
            Math.max(
              parseInt(personagemAtualizado[recurso]?.atual, 10) || 0,
              parseInt(habilidade.recursoAtualAntes, 10) || 0,
            ),
          ),
        };
      }
    }

    salvarFichaLocal(ficha.fichaId, personagemAtualizado);
    notificarPersonagemAtualizado(ficha.fichaId, personagemAtualizado);
    setFichas((atuais) =>
      atuais.map((item) =>
        item.fichaId === ficha.fichaId
          ? { ...item, personagem: personagemAtualizado }
          : item,
      ),
    );
    if (fichaSelecionada === ficha.fichaId) setPersonagem(personagemAtualizado);
    try {
      await salvarPersonagem(ficha.fichaId, personagemAtualizado);
      setMensagem(
        aprovar
          ? "Habilidade aprovada."
          : "Habilidade recusada e custo devolvido.",
      );
    } catch (error) {
      setMensagem(
        aprovar
          ? "Habilidade aprovada localmente."
          : "Habilidade recusada e custo devolvido localmente.",
      );
    }
  };

  const fichasJogadores = useMemo(
    () =>
      fichas.filter((ficha) => {
        const personagem = ficha.personagem || ficha;

        return personagem.tipo !== "npc";
      }),
    [fichas],
  );

  const fichasDaSubAba = fichasJogadores;
  const fichasModernas = useMemo(() => fichasJogadores.filter(ficha => isFichaEspiral(ficha.personagem || ficha)), [fichasJogadores]);
  const fichasExibidas = useMemo(() => searchMasterSheets(fichasJogadores, buscaEspiral), [fichasJogadores, buscaEspiral]);

  const abrirPopup = ({
    tipo = "info",
    titulo,
    mensagem,
    confirmarTexto = "Confirmar",
    onConfirmar,
  }) => {
    setPopup({
      tipo,
      titulo,
      mensagem,
      confirmarTexto,
      onConfirmar,
    });
  };

  const fecharPopup = () => setPopup(null);

  const confirmarPopup = () => {
    const acao = popup?.onConfirmar;

    fecharPopup();

    setTimeout(() => {
      if (acao) acao();
    }, 0);
  };

  const [formHabilidade, setFormHabilidade] = useState({
    id: "",
    nome: "",
    custo: "",
    descricao: "",
  });

  const fichaAtual = useMemo(
    () => fichas.find((ficha) => ficha.fichaId === fichaSelecionada),
    [fichaSelecionada, fichas],
  );

  // Lista completa de categorias (inclui a exclusiva)
  const CATEGORIAS_LOJA_COMPLETA = useMemo(() => {
    const base = CATEGORIAS_LOJA.filter(cat => !["armas-fogo", "armas-corpo", "armas-arremessaveis", "armas-exclusivas", "municoes-especiais"].includes(cat.id));

    return base;
  }, []);

  // Usado nos filtros de entrega (aparece para o mestre)
  const categoriasFiltroLoja = CATEGORIAS_LOJA_COMPLETA;

  // Abas do editor da loja (ordem definida)
  const abasEditorLoja = useMemo(() => {
    const ordem = [
      "armas-fogo",
      "municoes-especiais",
      "armas-corpo",
      "defesas",
      "itens",
      "ritos",
      "poderes",
      "armas-exclusivas",
    ];
    const mapa = {
      "armas-fogo": "Armas de fogo",
      "municoes-especiais": "Munições Especiais",
      "armas-corpo": "Armas brancas",
      defesas: "Defesas",
      itens: "Itens",
      ritos: "Ritos Absolutos",
      poderes: "Poderes Absolutos",
      "armas-exclusivas": "Armas Exclusivas",
    };
    return ordem.filter(id => !["armas-fogo", "armas-corpo", "armas-exclusivas", "municoes-especiais"].includes(id)).map((id) => ({ id, nome: mapa[id] }));
  }, []);

  useMemo(
    () => receitasCriacaoDashboard.map((grupo) => grupo.categoria),
    [receitasCriacaoDashboard],
  );

  const receitasPorCategoria = useMemo(
    () =>
      receitasCriacaoDashboard.reduce((acc, grupo) => {
        acc[grupo.categoria] = grupo.itens || [];
        return acc;
      }, {}),
    [receitasCriacaoDashboard],
  );

  useMemo(
    () => receitasPorCategoria[receitaEditor.categoria] || [],
    [receitasPorCategoria, receitaEditor.categoria],
  );

  const catalogoFiltrado = useMemo(() => {
    if (categoriaLojaAtiva === "todos") {
      return catalogo.filter(item => !["armas-fogo", "armas-corpo", "armas-arremessaveis", "armas-exclusivas", "municoes-especiais"].includes(item.categoria));
    }

    return catalogo.filter((item) => item.categoria === categoriaLojaAtiva);
  }, [catalogo, categoriaLojaAtiva]);

  const STORAGE_MARCAS = "darkness_marcas";

  useEffect(() => {
    let ativo = true;
    buscarDestinos().then(async (remotos) => {
      let locais = [];
      try { locais = localStorage.getItem("darkness_marcas_migradas") ? [] : JSON.parse(localStorage.getItem(STORAGE_MARCAS)) || []; } catch {}
      const faltantes = Array.isArray(locais) ? locais.filter((m) => !remotos.some((r) => r.id === m.id)) : [];
      const lista = [...remotos, ...faltantes];
      if (faltantes.length) await salvarDestinos(lista);
      try { localStorage.setItem("darkness_marcas_migradas", "true"); } catch {}
      if (ativo) {
        setMarcas(lista);
        setMarcasCarregadas(true);
        try { localStorage.setItem(STORAGE_MARCAS, JSON.stringify(lista)); } catch {}
      }
    }).catch(() => {
      if (ativo) setMensagem("Não foi possível carregar os Destinos online. A cópia deste navegador foi preservada.");
    });
    return () => { ativo = false; };
  }, []);

  const salvarMarcas = async (novaLista) => {
    await salvarDestinos(novaLista);
    setMarcas(novaLista);
    try { localStorage.setItem(STORAGE_MARCAS, JSON.stringify(novaLista)); } catch {}
  };

  const executarOperacaoMarca = async (operacao) => {
    if (marcasGravandoRef.current) return;
    if (!marcasCarregadas) { setMensagem("Destinos online indisponíveis ou carregando. Aguarde ou recarregue a página para tentar novamente."); return; }
    marcasGravandoRef.current = true;
    try { await operacao(); }
    catch (error) { setMensagem("Não foi possível concluir a operação do Destino. " + error.message); }
    finally { marcasGravandoRef.current = false; }
  };

  const receitasPadraoNormalizadas = useMemo(
    () => normalizarReceitasPadrao(RECEITAS_PADRAO),
    [],
  );

  const receitasCriacaoLocais = useMemo(() => {
    try {
      const raw = localStorage.getItem(RECEITAS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizarReceitasPadrao(parsed);
      }
    } catch {
      // ignore
    }

    return receitasPadraoNormalizadas;
  }, [receitasPadraoNormalizadas]);

  const carregarTudo = async () => {
    const versaoArvores=arvoresSync.current.revision;
    setCarregando(true);
    setMensagem("");

    try {
      const [fichasApi, catalogoApi, arvoresApi] = await Promise.all([
        listarPersonagens(),
        buscarCatalogoLoja(),
        buscarArvoresHabilidades(),
      ]);

      const fichasNormalizadas = fichasApi.map((ficha) => isEspiralSheet(ficha.personagem) ? ficha : ({
        ...ficha,
        personagem: {
          ...estadoInicial,
          ...(ficha.personagem || {}),
          lojaCreditos: ficha.personagem?.lojaCreditos ?? 900,
        },
      }));
      const categoriasObrigatorias = [
        "armas-fogo",
        "armas-corpo",
        "defesas",
        "itens",
        "ritos",
        "poderes",
      ];

      const catalogoApiAtualizado =
        Array.isArray(catalogoApi) &&
        categoriasObrigatorias.every((categoria) =>
          catalogoApi.some((item) => item.categoria === categoria),
        );

      // O catálogo hospedado pode ter sido criado antes de uma categoria nova.
      // Nunca descartamos seus itens personalizados (principalmente armas
      // exclusivas) só porque alguma categoria padrão ainda não existe nele.
      const itensRemotos = Array.isArray(catalogoApi)
        ? catalogoApi.map(normalizarItemLoja)
        : [];
      // Se uma publicacao retornar apenas o catalogo padrao, preserva as armas
      // exclusivas ainda existentes neste navegador para poder republica-las.
      // Isso nao sobrescreve o catalogo remoto quando ele ja possui exclusivas.
      let exclusivasLocais = [];
      try {
        const catalogoLocalSalvo = JSON.parse(
          localStorage.getItem(CATALOGO_STORAGE_KEY) || "[]",
        );
        if (Array.isArray(catalogoLocalSalvo)) {
          exclusivasLocais = catalogoLocalSalvo
            .map(normalizarItemLoja)
            .filter((item) => item.categoria === "armas-exclusivas");
        }
      } catch {
        exclusivasLocais = [];
      }
      const remotoPossuiExclusivas = itensRemotos.some(
        (item) => item.categoria === "armas-exclusivas",
      );
      const recuperarExclusivasLocais =
        itensRemotos.length > 0 &&
        !remotoPossuiExclusivas &&
        exclusivasLocais.length > 0;
      const idsRemotos = new Set(itensRemotos.map((item) => item.id));
      const catalogoBase =
        itensRemotos.length > 0
          ? [
              ...DEFAULT_CATALOGO_LOJA.filter(
                (item) => !idsRemotos.has(normalizarItemLoja(item).id),
              ).map(normalizarItemLoja),
              ...itensRemotos,
              ...(recuperarExclusivasLocais
                ? exclusivasLocais.filter((item) => !idsRemotos.has(item.id))
                : []),
            ]
          : DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja);
      const catalogoNormalizado =
        aplicarDefesasAtualizadas(catalogoBase).map(normalizarItemLoja);

      const arvoresLocais = carregarArvoresCustom();
      const arvoresCompartilhadas =
        Object.keys(arvoresApi || {}).length > 0 ? arvoresApi : arvoresLocais;

      const fichasEspiral = listarFichasEspiralLocais();
      const fichasCompletas = unirFichasEspiral(fichasEspiral, fichasNormalizadas);
      setFichas(fichasCompletas);
      setCatalogo(catalogoNormalizado);
      setReceitasCriacaoDashboard(receitasCriacaoLocais);
      if(arvoresSync.current.canApplyRemote(versaoArvores)){
        salvarArvoresCustom(arvoresCompartilhadas);
        setArvoresEditor(obterTodasArvores());
      }

      if (
        arvoresSync.current.canApplyRemote(versaoArvores) && Object.keys(arvoresApi || {}).length === 0 &&
        Object.keys(arvoresLocais).length > 0
      ) {
        arvoresSync.current.enqueue(arvoresLocais).catch((error) => {
          console.warn("Nao foi possivel publicar arvores locais.", error);
        });
      }

      localStorage.setItem(
        CATALOGO_STORAGE_KEY,
        JSON.stringify(catalogoNormalizado),
      );

      if (
        !catalogoApiAtualizado ||
        !catalogoPossuiDefesasAtualizadas(catalogoBase) ||
        !catalogoPossuiDanosBalanceados(catalogoBase) ||
        recuperarExclusivasLocais
      ) {
        salvarCatalogoLoja(catalogoNormalizado).catch((error) => {
          console.warn("Não foi possível atualizar o catálogo da loja.", error);
        });
      }

      if (fichasCompletas.length > 0 && !fichaSelecionada) {
        setFichaSelecionada(fichasCompletas[0].fichaId);
        setPersonagem(fichasCompletas[0].personagem);
      }
    } catch (error) {
      const fichasLocais = [
        ...listarFichasEspiralLocais(),
        ...listarFichasLocais(),
      ];
      const catalogoLocal = localStorage.getItem(CATALOGO_STORAGE_KEY);
      setArvoresEditor(obterTodasArvores());

      if (catalogoLocal) {
        try {
          const catalogoParseado = JSON.parse(catalogoLocal);

          if (Array.isArray(catalogoParseado) && catalogoParseado.length > 0) {
            const itensLocais = catalogoParseado.map(normalizarItemLoja);
            const idsLocais = new Set(itensLocais.map((item) => item.id));
            setCatalogo(
              aplicarDefesasAtualizadas([
                ...DEFAULT_CATALOGO_LOJA.filter(
                  (item) => !idsLocais.has(normalizarItemLoja(item).id),
                ),
                ...itensLocais,
              ]).map(normalizarItemLoja),
            );
          } else {
            localStorage.removeItem(CATALOGO_STORAGE_KEY);
            setCatalogo(DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja));
          }
        } catch {
          localStorage.removeItem(CATALOGO_STORAGE_KEY);
          setCatalogo(DEFAULT_CATALOGO_LOJA.map(normalizarItemLoja));
        }
      }

      setFichas(fichasLocais);
      setReceitasCriacaoDashboard(receitasCriacaoLocais);
      if (fichasLocais.length > 0 && !fichaSelecionada) {
        setFichaSelecionada(fichasLocais[0].fichaId);
        setPersonagem({
          ...estadoInicial,
          ...fichasLocais[0].personagem,
          lojaCreditos: fichasLocais[0].personagem?.lojaCreditos ?? 900,
        });
      }

      console.warn("Sincronizacao online indisponivel; usando dados locais.", error);
      setMensagem(
        "Modo local temporario: suas alteracoes ficam somente neste navegador ate a conexao online voltar.",
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      setPastasInimigos(
        JSON.parse(localStorage.getItem("darkness_pastas_inimigos")) || [],
      );
    } catch {
      setPastasInimigos([]);
    }
    try {
      setPastasNpcs(
        JSON.parse(localStorage.getItem("darkness_pastas_npcs")) || [],
      );
    } catch {
      setPastasNpcs([]);
    }
  }, []);

  const criarPastaCatalogo = async (tipo) => {
    const nome = (await solicitarDialogo(
      `Nome da pasta de ${tipo === "npc" ? "NPCs" : "inimigos"}:`,
      { titulo: "Nova pasta", confirmarTexto: "Criar", placeholder: "Nome da pasta" },
    ))?.trim();
    if (!nome) return;
    const atuais = tipo === "npc" ? pastasNpcs : pastasInimigos;
    if (
      atuais.some(
        (pasta) =>
          pasta.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"),
      )
    )
      return;
    const novas = [...atuais, nome].sort((a, b) => a.localeCompare(b, "pt-BR"));
    localStorage.setItem(
      tipo === "npc" ? "darkness_pastas_npcs" : "darkness_pastas_inimigos",
      JSON.stringify(novas),
    );
    if (tipo === "npc") {
      setPastasNpcs(novas);
      setPastaNpcsAtiva(nome);
    } else {
      setPastasInimigos(novas);
      setPastaInimigosAtiva(nome);
    }
  };

  const excluirPastaCatalogo = async (tipo, pasta) => {
    if (!pasta) return;

    const itensNaPasta =
      tipo === "npc"
        ? npcs.filter((item) => item.pasta === pasta).length
        : inimigos.filter((item) => item.pasta === pasta).length;

    const descricaoItens =
      itensNaPasta > 0
        ? `\n\n${itensNaPasta} ${tipo === "npc" ? "NPC(s)" : "inimigo(s)"} desta pasta serão movidos para "Sem pasta".`
        : "";

    if (
      !await confirmarDialogo(
        `Excluir a pasta "${pasta}"?${descricaoItens}`,
        { titulo: "Excluir pasta", confirmarTexto: "Excluir", perigo: true },
      )
    ) {
      return;
    }

    if (tipo === "npc") {
      const novasPastas = pastasNpcs.filter((item) => item !== pasta);
      const novosNpcs = npcs.map((npc) =>
        npc.pasta === pasta ? { ...npc, pasta: "" } : npc,
      );

      localStorage.setItem(
        "darkness_pastas_npcs",
        JSON.stringify(novasPastas),
      );
      salvarListaNpcs(novosNpcs);
      setPastasNpcs(novasPastas);

      if (pastaNpcsAtiva === pasta) {
        setPastaNpcsAtiva("todas");
      }
    } else {
      const novasPastas = pastasInimigos.filter((item) => item !== pasta);
      const novosInimigos = inimigos.map((inimigo) =>
        inimigo.pasta === pasta ? { ...inimigo, pasta: "" } : inimigo,
      );

      localStorage.setItem(
        "darkness_pastas_inimigos",
        JSON.stringify(novasPastas),
      );
      salvarListaInimigos(novosInimigos);
      setPastasInimigos(novasPastas);

      if (pastaInimigosAtiva === pasta) {
        setPastaInimigosAtiva("todas");
      }
    }

    abrirPopup({
      titulo: "Pasta excluída",
      mensagem:
        itensNaPasta > 0
          ? `A pasta "${pasta}" foi excluída e seus itens foram movidos para "Sem pasta".`
          : `A pasta "${pasta}" foi excluída.`,
    });
  };

  useEffect(() => {
    if (!fichaSelecionada || fichaSelecionada.startsWith("espiral:")) return;
    let active = true;

    const sincronizarFichaSelecionada = async ({
      fichaId: fichaAtualizada,
    } = {}) => {
      if (fichaAtualizada && fichaAtualizada !== fichaSelecionada) return;
      if (editandoDashboard) return;
      if (fichasEmGravacaoRef.current.has(fichaSelecionada)) return;

      try {
        const personagemAtualizado = await buscarPersonagem(fichaSelecionada);

        if (!active || !personagemAtualizado) return;

        const personagemFinal = {
          ...estadoInicial,
          ...personagemAtualizado,
          lojaCreditos: personagemAtualizado.lojaCreditos ?? 900,
        };

        setPersonagem(personagemFinal);

        setFichas((atuais) =>
          atuais.map((ficha) =>
            ficha.fichaId === fichaSelecionada
              ? { ...ficha, personagem: personagemFinal }
              : ficha,
          ),
        );
      } catch (error) {
        console.warn(
          "Nao foi possivel atualizar a ficha em tempo real.",
          error,
        );
      }
    };

    const pararPersonagem = ouvirPersonagemAtualizado(
      sincronizarFichaSelecionada,
    );
    const pararPolling = iniciarPollingVisivel(
      sincronizarFichaSelecionada,
      SYNC_INTERVALS.dashboardFicha,
    );

    return () => {
      active = false;
      pararPersonagem();
      pararPolling();
    };
  }, [fichaSelecionada, editandoDashboard]);

  useEffect(() => {
    const chave = "darkness_rolagens_mestre";

    try {
      setRolagensMestre(JSON.parse(localStorage.getItem(chave)) || []);
    } catch {
      setRolagensMestre([]);
    }

    const aoReceberRolagem = (event) => {
      setRolagensMestre((prev) => [event.detail, ...prev].slice(0, 3));
    };

    const aoAtualizarStorage = (event) => {
      if (event.key !== "darkness_rolagens_mestre") return;

      try {
        setRolagensMestre(JSON.parse(event.newValue) || []);
      } catch {
        setRolagensMestre([]);
      }
    };

    window.addEventListener("storage", aoAtualizarStorage);

    window.addEventListener("darkness:nova-rolagem", aoReceberRolagem);
    window.addEventListener("storage", aoAtualizarStorage);

    return () => {
      window.removeEventListener("darkness:nova-rolagem", aoReceberRolagem);
      window.removeEventListener("storage", aoAtualizarStorage);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    const sincronizarListas = async () => {
      if (fichasEmGravacaoRef.current.size > 0) return;
      const versaoArvores=arvoresSync.current.revision;

      try {
        const [fichasApi, arvoresApi] = await Promise.all([
          listarPersonagens(),
          buscarArvoresHabilidades().catch(() => null),
        ]);

        if (cancelado) return;

        const fichasDarkness = fichasApi.map((ficha) => isEspiralSheet(ficha.personagem) ? ficha : ({
            ...ficha,
            personagem: {
              ...estadoInicial,
              ...(ficha.personagem || {}),
              lojaCreditos: ficha.personagem?.lojaCreditos ?? 900,
            },
          }));

        // Combina as fichas compartilhadas com as cópias locais, sem duplicatas.
        setFichas(unirFichasEspiral(listarFichasEspiralLocais(), fichasDarkness));

        if (arvoresSync.current.canApplyRemote(versaoArvores) && arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
          setArvoresEditor(obterTodasArvores());
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar o dashboard.", error);
      }
    };

    const sincronizarArvores = async ({ arvores } = {}) => {
      const versaoArvores=arvoresSync.current.revision;
      if(!arvoresSync.current.canApplyRemote(versaoArvores))return;
      if (arvores && Object.keys(arvores).length > 0) {
        salvarArvoresCustom(arvores);
        setArvoresEditor(obterTodasArvores());
        return;
      }

      try {
        const arvoresApi = await buscarArvoresHabilidades();
        if (!cancelado && arvoresSync.current.canApplyRemote(versaoArvores) && arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
          setArvoresEditor(obterTodasArvores());
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar arvores.", error);
      }
    };

    const pararPersonagem = ouvirPersonagemAtualizado(sincronizarListas);
    const pararArvores = ouvirArvoresAtualizadas(sincronizarArvores);
    const pararPolling = iniciarPollingVisivel(
      sincronizarListas,
      SYNC_INTERVALS.dashboardListas,
    );

    return () => {
      cancelado = true;
      pararPersonagem();
      pararArvores();
      pararPolling();
    };
  }, []);

  useEffect(() => {
    const atualizarFichasEspiral = (event) => {
      if (event.key && !event.key.startsWith("espiral:sheet:v1:")) return;

      setFichas((atuais) => unirFichasEspiral(listarFichasEspiralLocais(), atuais));
    };

    window.addEventListener("storage", atualizarFichasEspiral);
    return () => window.removeEventListener("storage", atualizarFichasEspiral);
  }, []);

  useEffect(() => {
    if (fichaAtual) {
      setPersonagem({
        ...estadoInicial,
        ...fichaAtual.personagem,
        lojaCreditos: fichaAtual.personagem?.lojaCreditos ?? 900,
      });
    }
  }, [fichaAtual]);

  const criarMarca = (e) => {
    e.preventDefault();
    return executarOperacaoMarca(async () => {
      if (!formMarca.nome.trim()) {
        setMensagem("Informe o nome do Destino.");
        return;
      }
      const nova = {
        id: crypto.randomUUID(),
        ...formMarca,
        habilidades: formMarca.habilidades || [],
        atribuidaA: [],
        createdAt: Date.now(),
      };
      await salvarMarcas([...marcas, nova]);
      limparFormMarca();
      setMensagem(`Destino "${nova.nome}" criado.`);
    });
  };

  const adicionarHabilidadeMarca = () => {
    if (formMarca.habilidades.length >= 3) {
      setMensagem("Limite de 3 habilidades por Destino.");
      return;
    }
    setFormMarca((prev) => ({
      ...prev,
      habilidades: [...prev.habilidades, { nome: "", descricao: "" }],
    }));
  };

  const removerHabilidadeMarca = (index) => {
    setFormMarca((prev) => ({
      ...prev,
      habilidades: prev.habilidades.filter((_, i) => i !== index),
    }));
  };

  const atualizarHabilidadeMarca = (index, campo, valor) => {
    setFormMarca((prev) => {
      const novasHabilidades = [...prev.habilidades];
      novasHabilidades[index] = { ...novasHabilidades[index], [campo]: valor };
      return { ...prev, habilidades: novasHabilidades };
    });
  };

  const editarMarca = (marca) => {
    setMarcaEditando(marca.id);
    setFormMarca({
      nome: marca.nome,
      descricao: marca.descricao,
      beneficios: marca.beneficios,
      penalidades: marca.penalidades,
      habilidades: marca.habilidades || [],
      corLinhas: marca.corLinhas || "#111111",
      imagemFundo: marca.imagemFundo || "",
    });
  };

  const selecionarImagemFundoMarca = async (event) => {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;
    try {
      setMensagem("Preparando imagem do Destino...");
      const imagemFundo = await compressBackgroundImage(arquivo);
      setFormMarca((atual) => ({ ...atual, imagemFundo }));
      setMensagem("Imagem de fundo preparada.");
    } catch (error) {
      setMensagem(error.message || "Não foi possível preparar a imagem.");
    }
  };

  const salvarEdicaoMarca = (e) => {
    e.preventDefault();
    return executarOperacaoMarca(async () => {
      if (!formMarca.nome.trim()) { setMensagem("Informe o nome do Destino."); return; }
      const anterior = marcas.find((m) => m.id === marcaEditando);
      if (!anterior) throw new Error("Destino não encontrado.");
      const atualizada = { ...anterior, ...formMarca };
      const fichasAtuais = await listarPersonagens();
      for (const ficha of fichasAtuais) {
        if (!(ficha.personagem.marcas || []).some((m) => m.id === atualizada.id)) continue;
        const recente = await buscarPersonagem(ficha.fichaId);
        const novasMarcas = atualizarDestinoNaFicha(recente.marcas || [], anterior, atualizada);
        await salvarFichaSelecionada({ marcas: novasMarcas }, null, ficha.fichaId, true);
      }
      await salvarMarcas(marcas.map((m) => m.id === atualizada.id ? atualizada : m));
      limparFormMarca();
      setMensagem("Destino atualizado nas fichas e na lista.");
    });
  };

  const excluirMarca = (id) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir Destino",
      mensagem: "Deseja remover este Destino permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: () => executarOperacaoMarca(async () => {
        await salvarMarcas(marcas.filter((m) => m.id !== id));
        if (marcaEditando === id) limparFormMarca();
        setMensagem("Destino removido.");
      }),
    });
  };

  const limparFormMarca = () => {
    setFormMarca({
      nome: "",
      descricao: "",
      beneficios: "",
      penalidades: "",
      habilidades: [],
      corLinhas: "#111111",
      imagemFundo: "",
    });
    setMarcaEditando(null);
  };

  const atribuirMarca = () => executarOperacaoMarca(async () => {
    if (!personagemSelecionadoId || !marcaSelecionadaId) {
      setMensagem("Selecione um personagem e um Destino.");
      return;
    }
    const personagem = fichas.find(
      (f) => f.fichaId === personagemSelecionadoId,
    );
    if (!personagem) {
      setMensagem("Personagem não encontrado.");
      return;
    }
    const marca = marcas.find((m) => m.id === marcaSelecionadaId);
    if (!marca) {
      setMensagem("Destino não encontrado.");
      return;
    }

    const recente = await buscarPersonagem(personagemSelecionadoId);
    if ((recente.marcas || []).some((m) => m.id === marca.id)) {
      setMensagem(`${personagem.personagem.nome} já possui este Destino.`);
      return;
    }

    const marcaParaAdicionar = {
      ...marca,
      tipo: "marca",
      aceita: false,
    };

    const personagemAtualizado = {
      marcas: [...(recente.marcas || []), marcaParaAdicionar],
    };

    const marcaAtualizada = {
      ...marca,
      atribuidaA: [
        ...(marca.atribuidaA || []).filter((f) => f.fichaId !== personagemSelecionadoId),
        {
          fichaId: personagemSelecionadoId,
          nome: personagem.personagem.nome || personagemSelecionadoId,
          fotoPerfil: personagem.personagem.fotoPerfil || "",
        },
      ],
    };
    const novaListaMarcas = marcas.map((m) =>
      m.id === marcaSelecionadaId ? marcaAtualizada : m,
    );
    await salvarMarcas(novaListaMarcas);

    // Chama salvarFichaSelecionada passando o ID do personagem alvo
    await salvarFichaSelecionada(
      personagemAtualizado,
      `Destino "${marca.nome}" atribuído a ${personagem.personagem.nome}.`,
      personagemSelecionadoId,
      true,
    );

    // Resetar seleção
    setPersonagemSelecionadoId("");
    setPersonagemSelecionado(null);
    setMarcaSelecionadaId("");
  });

  const removerMarcaDoPersonagem = (marca, vinculo) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Remover Destino do jogador",
      mensagem: `Remover "${marca.nome}" da ficha de ${vinculo.nome || vinculo.fichaId}?`,
      confirmarTexto: "Remover",
      onConfirmar: () => executarOperacaoMarca(async () => {
        const recente = await buscarPersonagem(vinculo.fichaId);
        const marcasDaFicha = (recente.marcas || []).filter(
          (destino) => destino.id !== marca.id,
        );

        await salvarFichaSelecionada(
          { marcas: marcasDaFicha },
          null,
          vinculo.fichaId,
          true,
        );

        const marcasAtualizadas = marcas.map((destino) =>
          destino.id === marca.id
            ? {
                ...destino,
                atribuidaA: (destino.atribuidaA || []).filter(
                  (jogador) => jogador.fichaId !== vinculo.fichaId,
                ),
              }
            : destino,
        );
        await salvarMarcas(marcasAtualizadas);
        setMensagem(
          `Destino "${marca.nome}" removido de ${vinculo.nome || vinculo.fichaId}.`,
        );
      }),
    });
  };

  const handlePersonagemChange = (fichaId) => {
    setPersonagemSelecionadoId(fichaId);
    const ficha = fichas.find((f) => f.fichaId === fichaId);
    setPersonagemSelecionado(ficha?.personagem || null);
  };

  const gerarIdHabilidade = (nome) =>
    String(nome || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const salvarArvoresEditor = async (novasArvores) => {
    setArvoresEditor(novasArvores);
    salvarArvoresCustom(novasArvores);
    setSalvandoArvores(true);
    setMensagem('Salvando alterações das habilidades no servidor…');
    try {
      const {data,latest}=await arvoresSync.current.enqueue(novasArvores);
      if(latest){
        salvarArvoresCustom(data || novasArvores);
        setArvoresEditor(obterTodasArvores());
        notificarArvoresAtualizadas(data || novasArvores);
        setMensagem('Habilidades salvas no servidor.');
      }
      return latest;
    } catch(error){
      setMensagem(`Não foi possível salvar online: ${error.message}. A edição foi mantida neste navegador; tente salvar novamente.`);
      return false;
    } finally{setSalvandoArvores(arvoresSync.current.pending>0);}
  };

  const limparFormHabilidade = () => {
    setFormHabilidade({
      id: "",
      nome: "",
      custo: "",
      descricao: "",
    });
    setHabilidadeEditando(null);
  };

  const salvarHabilidadeEditor = async (event) => {
    event.preventDefault();

    if (!formHabilidade.nome.trim()) {
      setMensagem("Informe o nome da habilidade.");
      return;
    }

    const arvoreAtual = arvoresEditor[classeArvoreAtiva];

    if (!arvoreAtual) return;

    const novaHabilidade = {
      editadoPeloMestre:true,
      id: formHabilidade.id || gerarIdHabilidade(formHabilidade.nome),
      nome: formHabilidade.nome.trim(),
      custo: formHabilidade.custo.trim(),
      descricao: formHabilidade.descricao.trim(),
    };

    const novasArvores = { ...arvoresEditor };

    if (tipoHabilidadeEditor === "especialidade") {
      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        especialidades: (arvoreAtual.especialidades || []).map((esp) => {
          if (esp.id !== especialidadeEditorId) return esp;

          const habilidades = esp.habilidades || [];

          return {
            ...esp,
            habilidades: habilidadeEditando
              ? habilidades.map((hab) =>
                  hab.id === habilidadeEditando ? novaHabilidade : hab,
                )
              : [...habilidades, novaHabilidade],
          };
        }),
      };
    } else {
      const lista = arvoreAtual[tipoHabilidadeEditor] || [];

      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        [tipoHabilidadeEditor]: habilidadeEditando
          ? lista.map((hab) =>
              hab.id === habilidadeEditando ? novaHabilidade : hab,
            )
          : [...lista, novaHabilidade],
      };
    }

    if(!await salvarArvoresEditor(novasArvores))return;
    limparFormHabilidade();
    setMostrarFormHabilidade(false);
  };

  const iniciarEdicaoHabilidadeCard = (habilidade) => {
    setHabilidadeEditandoCardId(habilidade.id);
    setHabilidadeEditandoDados({
      id: habilidade.id,
      nome: habilidade.nome || "",
      custo: habilidade.custo || "",
      descricao: habilidade.descricao || "",
    });
  };

  const cancelarEdicaoHabilidadeCard = () => {
    setHabilidadeEditandoCardId(null);
    setHabilidadeEditandoDados(null);
  };

  const salvarEdicaoHabilidadeCard = async () => {
    if (!habilidadeEditandoDados?.nome.trim()) {
      setMensagem("Informe o nome da habilidade.");
      return;
    }

    const arvoreAtual = arvoresEditor[classeArvoreAtiva];
    if (!arvoreAtual) return;

    const habilidadeAtualizada = {
      ...habilidadeEditandoDados,
      editadoPeloMestre:true,
      nome: habilidadeEditandoDados.nome.trim(),
      custo: habilidadeEditandoDados.custo.trim(),
      descricao: habilidadeEditandoDados.descricao.trim(),
    };
    const novasArvores = { ...arvoresEditor };

    if (tipoHabilidadeEditor === "especialidade") {
      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        especialidades: (arvoreAtual.especialidades || []).map((esp) =>
          esp.id === especialidadeEditorId
            ? {
                ...esp,
                habilidades: (esp.habilidades || []).map((habilidade) =>
                  habilidade.id === habilidadeEditandoCardId
                    ? habilidadeAtualizada
                    : habilidade,
                ),
              }
            : esp,
        ),
      };
    } else {
      novasArvores[classeArvoreAtiva] = {
        ...arvoreAtual,
        [tipoHabilidadeEditor]: (arvoreAtual[tipoHabilidadeEditor] || []).map(
          (habilidade) =>
            habilidade.id === habilidadeEditandoCardId
              ? habilidadeAtualizada
              : habilidade,
        ),
      };
    }

    if(!await salvarArvoresEditor(novasArvores))return;
    cancelarEdicaoHabilidadeCard();
  };

  const excluirHabilidadeEditor = (habilidadeId) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir habilidade",
      mensagem: "Deseja excluir esta habilidade permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: async () => {
        const arvoreAtual = arvoresEditor[classeArvoreAtiva];
        const novasArvores = { ...arvoresEditor };

        if (tipoHabilidadeEditor === "especialidade") {
          novasArvores[classeArvoreAtiva] = {
            ...arvoreAtual,
            especialidades: (arvoreAtual.especialidades || []).map((esp) =>
              esp.id === especialidadeEditorId
                ? {
                    ...esp,
                    habilidades: (esp.habilidades || []).filter(
                      (hab) => hab.id !== habilidadeId,
                    ),
                  }
                : esp,
            ),
          };
        } else {
          novasArvores[classeArvoreAtiva] = {
            ...arvoreAtual,
            [tipoHabilidadeEditor]: (
              arvoreAtual[tipoHabilidadeEditor] || []
            ).filter((hab) => hab.id !== habilidadeId),
          };
        }

        if(!await salvarArvoresEditor(novasArvores))return;
        abrirPopup({
          titulo: "Habilidade excluída",
          mensagem: "A habilidade foi removida com sucesso.",
        });
      },
    });

  };

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_INIMIGOS)) || [];
      setInimigos(dados);
    } catch {
      setInimigos([]);
    }
  }, []);

  useEffect(() => {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_NPCS)) || [];
      setNpcs(dados);
    } catch {
      setNpcs([]);
    }
  }, []);

  const salvarListaNpcs = (novaLista) => {
    setNpcs(novaLista);
    localStorage.setItem(STORAGE_NPCS, JSON.stringify(novaLista));
  };

  const criarNovoNpc = () => {
    const novo = {
      id: crypto.randomUUID(),
      nome: "Novo NPC",
      classe: "NPC",
      tipo: "npc",
      pasta: pastaNpcsAtiva === "todas" ? "" : pastaNpcsAtiva,
      nivel: 1,

      atributos: {
        forca: 0,
        fortitude: 0,
        inteligencia: 0,
        vontade: 0,
        reflexos: 0,
      },

      defesa: 10,

      membros: {
        cabeca: { atual: 100, max: 100, defesa: 0 },
        torso: { atual: 500, max: 500, defesa: 0 },
        bracoDireito: { atual: 500, max: 500, defesa: 0 },
        bracoEsquerdo: { atual: 500, max: 500, defesa: 0 },
        pernaDireita: { atual: 500, max: 500, defesa: 0 },
        pernaEsquerda: { atual: 500, max: 500, defesa: 0 },
      },

      sanidade: {
        atual: 10,
        max: 10,
      },

      ataques: [],
      habilidades: [],
      inventario: [],
      rituais: [],
      descricao: "",
    };

    salvarListaNpcs([...npcs, novo]);
    setNpcEditando(novo.id);
  };

  const excluirNpc = (id) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir NPC",
      mensagem: "Deseja excluir este NPC permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: () => {
        salvarListaNpcs(npcs.filter((npc) => npc.id !== id));
        setNpcEditando(null);

        abrirPopup({
          titulo: "NPC excluído",
          mensagem: "O NPC foi removido com sucesso.",
        });
      },
    });
  };

  const duplicarNpc = (npc) => {
    const copia = {
      ...structuredClone(npc),
      id: crypto.randomUUID(),
      nome: `${npc.nome} (Cópia)`,
    };

    salvarListaNpcs([...npcs, copia]);

    abrirPopup({
      titulo: "NPC duplicado",
      mensagem: `${copia.nome} foi criado com base no NPC original.`,
    });
  };

  const atualizarNpc = (id, dados) => {
    salvarListaNpcs(
      npcs.map((npc) =>
        npc.id === id
          ? {
              ...npc,
              ...dados,
            }
          : npc,
      ),
    );
  };

  const salvarListaInimigos = (novaLista) => {
    setInimigos(novaLista);
    localStorage.setItem(STORAGE_INIMIGOS, JSON.stringify(novaLista));
  };

  const criarNovoInimigo = () => {
    const novo = {
      id: crypto.randomUUID(),

      nome: "Novo Inimigo",
      tipo: "inimigo",
      pasta: pastaInimigosAtiva === "todas" ? "" : pastaInimigosAtiva,

      classe: "aniquilador",

      nivel: 1,

      atributos: {
        forca: 0,
        fortitude: 0,
        inteligencia: 0,
        vontade: 0,
        reflexos: 0,
      },

      habilidadesClasse: {},

      inventario: [],

      vida: {
        atual: 10,
        max: 10,
      },

      sanidade: {
        atual: 10,
        max: 10,
      },

      energia: {
        atual: 10,
        max: 10,
      },
    };

    const novaLista = [...inimigos, novo];

    salvarListaInimigos(novaLista);

    setInimigoEditando(novo.id);
  };

  const excluirInimigo = (id) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir inimigo",
      mensagem: "Deseja eliminar este inimigo permanentemente?",
      confirmarTexto: "Excluir",

      onConfirmar: () => {
        const novaLista = inimigos.filter((inimigo) => inimigo.id !== id);

        salvarListaInimigos(novaLista);
        setInimigoEditando(null);

        abrirPopup({
          titulo: "MORTO",
          mensagem: "O inimigo foi eliminado com sucesso.",
        });
      },
    });
  };

  const duplicarInimigo = (inimigo) => {
    const copia = {
      ...structuredClone(inimigo),

      id: crypto.randomUUID(),

      nome: `${inimigo.nome} (Cópia)`,
    };

    const novaLista = [...inimigos, copia];

    salvarListaInimigos(novaLista);
    abrirPopup({
      titulo: "Inimigo duplicado",
      mensagem: `${copia.nome} foi criado com base no inimigo original.`,
    });
  };

  const atualizarInimigo = (id, dados) => {
    const novaLista = inimigos.map((inimigo) =>
      inimigo.id === id
        ? {
            ...inimigo,
            ...dados,
          }
        : inimigo,
    );

    salvarListaInimigos(novaLista);
  };

  const salvarFichaSelecionada = async (
    personagemAtualizado = personagem,
    mensagemCustom = null,
    fichaIdOverride = null,
    exigirOnline = false,
  ) => {
    const idParaSalvar = fichaIdOverride || fichaSelecionada;
    if (!idParaSalvar || !personagemAtualizado) return;

    fichasEmGravacaoRef.current.add(idParaSalvar);

    try {
      let fichaMaisRecente = {};

      try {
        const doBackend = await buscarPersonagem(idParaSalvar);
        if (doBackend) fichaMaisRecente = doBackend;
      } catch (error) {
        if (exigirOnline) throw error;
        try {
          const local = localStorage.getItem(`${STORAGE_KEY}_${idParaSalvar}`);
          if (local) fichaMaisRecente = JSON.parse(local);
        } catch {}
      }

      const personagemFinal = {
        ...fichaMaisRecente,
        ...personagemAtualizado,
      };

      if (!personagemFinal.marcas) personagemFinal.marcas = [];

      if (exigirOnline) await salvarPersonagem(idParaSalvar, personagemFinal);
      salvarFichaLocal(idParaSalvar, personagemFinal);
      notificarPersonagemAtualizado(idParaSalvar, personagemFinal);

      // Atualiza o personagem apenas se o ID corresponder ao atualmente selecionado
      if (idParaSalvar === fichaSelecionada) {
        setPersonagem(personagemFinal);
      }

      setFichas((atuais) =>
        atuais.map((ficha) =>
          ficha.fichaId === idParaSalvar
            ? { ...ficha, personagem: personagemFinal }
            : ficha,
        ),
      );

      const personagemSalvo = exigirOnline ? personagemFinal : await salvarPersonagem(
        idParaSalvar,
        personagemFinal,
      );
      notificarPersonagemAtualizado(
        idParaSalvar,
        personagemSalvo || personagemFinal,
      );
      setMensagem(
        mensagemCustom || "Ficha salva. Alterações do jogador preservadas.",
      );
      return personagemSalvo || personagemFinal;
    } catch (error) {
      if (exigirOnline) throw error;
      setMensagem(
        mensagemCustom ||
          "Ficha salva localmente sem foto. Backend indisponivel.",
      );
      return personagemAtualizado;
    } finally {
      fichasEmGravacaoRef.current.delete(idParaSalvar);
    }
  };

  const apagarFichaSelecionada = async () => {
    if (!fichaSelecionada) return;

    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir ficha",
      mensagem: "Deseja remover este personagem permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: async () => {
        localStorage.removeItem(`${STORAGE_KEY}_${fichaSelecionada}`);

        try {
          await apagarPersonagem(fichaSelecionada);
        } catch (error) {
          setMensagem("Ficha removida localmente. Backend indisponivel.");
        }

        const restantes = fichas.filter(
          (ficha) => ficha.fichaId !== fichaSelecionada,
        );

        setFichas(restantes);
        setFichaSelecionada(restantes[0]?.fichaId || "");
        setPersonagem(restantes[0]?.personagem || null);
        setModalFichaAberto(false);

        abrirPopup({
          titulo: "INIEXISTIDO",
          mensagem: "O personagem não existe mais....",
        });
      },
    });

    localStorage.removeItem(`${STORAGE_KEY}_${fichaSelecionada}`);
  };

  const adicionarCreditos = () => {
    const delta = parseInt(creditosDelta, 10) || 0;
    const atualizado = {
      ...personagem,
      lojaCreditos: Math.max(
        0,
        (parseInt(personagem.lojaCreditos, 10) || 0) + delta,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const adicionarRitosCreditos = () => {
    const delta = parseInt(ritosCreditosDelta, 10) || 0;

    const atualizado = {
      ...personagem,
      ritosCreditos: Math.max(
        0,
        (parseInt(personagem.ritosCreditos, 10) || 0) + delta,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
  };

  const entregarItemLojaAoJogador = () => {
    if (!personagem || !itemLojaSelecionadoId) {
      setMensagem("Selecione um item da loja para entregar.");
      return;
    }

    const itemCatalogo = catalogo.find(
      (item) => item.id === itemLojaSelecionadoId,
    );

    if (!itemCatalogo) {
      setMensagem("Item da loja não encontrado.");
      return;
    }

    if (itemCatalogo.categoria === "defesas") {
      const membrosAlvo = membrosProtegidosPelaDefesa(itemCatalogo);
      const defesaConflitante = (personagem.inventario || []).find((item) => {
        const ehDefesa =
          item.categoria === "defesas" ||
          item.tipo === "Defesa" ||
          Number(item.defesaBonus) > 0;
        const membrosProtegidos = item.membrosProtegidos?.length
          ? item.membrosProtegidos
          : membrosProtegidosPelaDefesa(item);
        return (
          ehDefesa &&
          membrosAlvo.some((membro) => membrosProtegidos.includes(membro))
        );
      });

      if (defesaConflitante) {
        setMensagem(
          `${personagem.nome || "O personagem"} já possui ${defesaConflitante.nome} protegendo essa área.`,
        );
        return;
      }
    }

    const itemParaInventario = {
      nome: itemCatalogo.nome,
      detalhes:
        itemCatalogo.detalhe ||
        itemCatalogo.entrega ||
        itemCatalogo.categoria ||
        "Item entregue",
      tipo: itemCatalogo.categoria || "item",
      descricao: itemCatalogo.detalhe || "",
      custo: itemCatalogo.preco,
      categoria: itemCatalogo.categoria,
      entrega: itemCatalogo.entrega,
      icone: itemCatalogo.icone || "",
      defesaBonus: itemCatalogo.defesaBonus || 0,
      resistencia: itemCatalogo.resistencia || "",
      resistenciasDano: itemCatalogo.resistenciasDano || [],
      membrosProtegidos:
        itemCatalogo.categoria === "defesas"
          ? membrosProtegidosPelaDefesa(itemCatalogo)
          : [],
      dano: itemCatalogo.dano || "",
      cura: itemCatalogo.cura || "",
      bonusDano: itemCatalogo.bonusDano || "",
      bonusTeste: itemCatalogo.bonusTeste || "",
      efeito: itemCatalogo.efeito || "",
      usos: itemCatalogo.usos || "",
      tipoArma: itemCatalogo.tipoArma || "",
      quantidade: itemCatalogo.quantidade || 0,
      municaoEspecial: Boolean(itemCatalogo.municaoEspecial),
      armaStatus: itemCatalogo.armaStatus || null,
      ...(Number(itemCatalogo.armaStatus?.mag)>0 ? {municaoAtual:Math.max(0,Math.min(Number(itemCatalogo.armaStatus.mag),Math.floor(Number(balasEntrega[itemCatalogo.id] ?? itemCatalogo.armaStatus.mag) || 0))),municaoReserva:0} : {}),
      modificacoesArma: itemCatalogo.modificacoesArma || [],
      aprimoramentoCustomizado: itemCatalogo.aprimoramentoCustomizado || null,
      nivelRito: itemCatalogo.nivelRito || "",
      idLoja: itemCatalogo.id,
    };

    const ehRito = itemCatalogo.categoria === "ritos";
    const bonusDefesaEntregue =
      itemCatalogo.categoria === "defesas"
        ? Number(itemCatalogo.defesaBonus) || 0
        : 0;
    const resistenciasAtuais = String(personagem.resistencias || "")
      .split(" | ")
      .map((resistencia) => resistencia.trim())
      .filter(Boolean);
    const resistenciasAtualizadas = itemCatalogo.resistencia
      ? [...new Set([...resistenciasAtuais, itemCatalogo.resistencia])].join(
          " | ",
        )
      : personagem.resistencias || "";
    const atualizado = {
      ...personagem,
      ...(ehRito
        ? {
            rituais: [
              ...(personagem.rituais || []),
              {
                nome: itemCatalogo.nome,
                custo: itemCatalogo.entrega || "",
                descricao: itemCatalogo.detalhe || "",
                detalhe: itemCatalogo.detalhe || "",
                nivel: itemCatalogo.nivelRito || "iniciante",
                nivelRito: itemCatalogo.nivelRito || "iniciante",
                acao: itemCatalogo.acao || "",
                distancia: itemCatalogo.distancia || "",
                duracao: itemCatalogo.duracao || "",
                requisitos: itemCatalogo.requisitos || "",
                alvo: itemCatalogo.alvo || "",
                efeito: itemCatalogo.efeito || itemCatalogo.detalhe || "",
                idLoja: itemCatalogo.id,
              },
            ],
          }
        : {
            inventario: [...(personagem.inventario || []), itemParaInventario],
            ...(bonusDefesaEntregue > 0 || itemCatalogo.resistencia
              ? {
                  bonusDefesa:
                    (Number(personagem.bonusDefesa) || 0) + bonusDefesaEntregue,
                  resistencias: resistenciasAtualizadas,
                  resistenciasDano: [
                    ...(personagem.resistenciasDano || []),
                    ...(itemCatalogo.resistenciasDano || []).map(
                      (resistencia) => ({
                        ...resistencia,
                        membros: membrosProtegidosPelaDefesa(itemCatalogo),
                      }),
                    ),
                  ],
                  membros: membrosProtegidosPelaDefesa(itemCatalogo).reduce(
                    (membros, membro) => ({
                      ...membros,
                      [membro]: {
                        ...(membros[membro] || {}),
                        defesa:
                          (Number(membros[membro]?.defesa) || 0) +
                          bonusDefesaEntregue,
                      },
                    }),
                    { ...(personagem.membros || {}) },
                  ),
                }
              : {}),
          }),
    };

    setPersonagem(atualizado);
    setItemLojaSelecionadoId("");
    salvarFichaSelecionada(
      atualizado,
      `${itemCatalogo.nome} foi entregue para ${personagem.nome || "o personagem"}.`,
    );
  };

  const adicionarPontosEvolucao = () => {
    const delta = parseInt(evolucaoDelta, 10) || 0;

    if (delta === 0) {
      setMensagem("Informe um valor diferente de zero.");
      return;
    }

    const disponiveisAtuais = personagem.pontosEvolucao?.disponiveis || 0;
    const acumuladosAtuais = personagem.pontosEvolucao?.acumulados || 0;
    const novosDisponiveis = Math.max(0, disponiveisAtuais + delta);
    const novosAcumulados = Math.max(0, acumuladosAtuais + delta);

    // Se não houve mudança (tentou remover mais do que tem), avisa
    if (novosDisponiveis === disponiveisAtuais && delta < 0) {
      setMensagem("O personagem não tem pontos suficientes para remover.");
      return;
    }

    const atualizado = {
      ...personagem,
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || { disponiveis: 0, acumulados: 0 }),
        disponiveis: novosDisponiveis,
        acumulados: novosAcumulados,
      },
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(
      atualizado,
      delta > 0
        ? `+${delta} PE adicionados. Total: ${novosDisponiveis}`
        : `${Math.abs(delta)} PE removidos. Restam: ${novosDisponiveis}`,
    );
  };

  const subirNivelJogador = async () => {
    if (salvandoNivel) return;

    const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
    const proximoNivel = Math.min(10, nivelAtual + 1);
    const pontosGanhos = ehAbsolutoV1(personagem) ? 0 : obterCustosNivel(proximoNivel).acumulado;
    const recursosGanhos = calcularGanhoRecursosNivel(personagem);

    if (nivelAtual >= 10) {
      setMensagem("Este personagem ja esta no NV10.");
      return;
    }

    const atualizado = {
      ...personagem,
      nivel: proximoNivel,
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || {}),
        disponiveis:
          (parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0) +
          pontosGanhos,
        acumulados:
          (parseInt(personagem.pontosEvolucao?.acumulados, 10) || 0) +
          pontosGanhos,
      },
      sanidade: {
        ...(personagem.sanidade || {}),
        atual:
          (parseInt(personagem.sanidade?.atual, 10) || 0) +
          recursosGanhos.sanidade,
        max:
          (parseInt(personagem.sanidade?.max, 10) || 0) +
          recursosGanhos.sanidade,
      },
      esperanca: {
        ...(personagem.esperanca || {}),
        atual:
          (parseInt(personagem.esperanca?.atual, 10) || 0) +
          recursosGanhos.esperanca,
        max:
          (parseInt(personagem.esperanca?.max, 10) || 0) +
          recursosGanhos.esperanca,
      },
    };

    setPersonagem(atualizado);
    setSalvandoNivel(true);
    try {
      await salvarFichaSelecionada(
        atualizado,
        `Jogador subiu para NV${proximoNivel}, recebeu ${pontosGanhos} pontos, +${recursosGanhos.sanidade} SAN e +${recursosGanhos.esperanca} PE.`,
      );
    } finally {
      setSalvandoNivel(false);
    }
  };

  const diminuirNivelJogador = async () => {
    if (salvandoNivel) return;

    const nivelAtual = Math.max(1, parseInt(personagem.nivel, 10) || 1);
    const proximoNivel = Math.max(1, nivelAtual - 1);
    const pontosRemovidos = ehAbsolutoV1(personagem) ? 0 : obterCustosNivel(nivelAtual).acumulado;
    const recursosRemovidos = calcularGanhoRecursosNivel(personagem);

    if (nivelAtual <= 1) {
      setMensagem("Este personagem ja esta no NV1.");
      return;
    }

    const sanidadeMaxAtual = parseInt(personagem.sanidade?.max, 10) || 0;
    const esperancaMaxAtual = parseInt(personagem.esperanca?.max, 10) || 0;
    const sanidadeNovoMax = Math.max(
      0,
      sanidadeMaxAtual - recursosRemovidos.sanidade,
    );
    const esperancaNovoMax = Math.max(
      0,
      esperancaMaxAtual - recursosRemovidos.esperanca,
    );

    const atualizado = {
      ...personagem,
      nivel: proximoNivel,
      pontosEvolucao: {
        ...(personagem.pontosEvolucao || {}),
        disponiveis: Math.max(
          0,
          (parseInt(personagem.pontosEvolucao?.disponiveis, 10) || 0) -
            pontosRemovidos,
        ),
        acumulados: Math.max(
          0,
          (parseInt(personagem.pontosEvolucao?.acumulados, 10) || 0) -
            pontosRemovidos,
        ),
      },
      sanidade: {
        ...(personagem.sanidade || {}),
        atual: Math.min(
          sanidadeNovoMax,
          Math.max(
            0,
            (parseInt(personagem.sanidade?.atual, 10) || 0) -
              recursosRemovidos.sanidade,
          ),
        ),
        max: sanidadeNovoMax,
      },
      esperanca: {
        ...(personagem.esperanca || {}),
        atual: Math.min(
          esperancaNovoMax,
          Math.max(
            0,
            (parseInt(personagem.esperanca?.atual, 10) || 0) -
              recursosRemovidos.esperanca,
          ),
        ),
        max: esperancaNovoMax,
      },
    };

    setPersonagem(atualizado);
    setSalvandoNivel(true);
    try {
      await salvarFichaSelecionada(
        atualizado,
        `Jogador voltou para NV${proximoNivel}, perdeu ${pontosRemovidos} pontos, -${recursosRemovidos.sanidade} SAN e -${recursosRemovidos.esperanca} PE.`,
      );
    } finally {
      setSalvandoNivel(false);
    }
  };

  const removerItemInventario = (index) => {
    const itemRemovido = (personagem.inventario || [])[index];
    if (!itemRemovido) return;

    const inventario = (personagem.inventario || []).filter(
      (_, itemIndex) => itemIndex !== index,
    );
    const ehDefesa =
      itemRemovido.categoria === "defesas" ||
      itemRemovido.tipo === "Defesa" ||
      Number(itemRemovido.defesaBonus) > 0;

    const atualizado = {
      ...personagem,
      inventario,
    };

    if (ehDefesa) {
      const bonusDefesa = Number(itemRemovido.defesaBonus) || 0;
      const membrosProtegidos = itemRemovido.membrosProtegidos?.length
        ? itemRemovido.membrosProtegidos
        : membrosProtegidosPelaDefesa(itemRemovido);
      const membros = { ...(personagem.membros || {}) };

      membrosProtegidos.forEach((membro) => {
        membros[membro] = {
          ...(membros[membro] || {}),
          defesa: Math.max(
            0,
            (Number(membros[membro]?.defesa) || 0) - bonusDefesa,
          ),
        };
      });

      const reducoesParaRemover = [
        ...(itemRemovido.resistenciasDano || []),
      ].map((resistencia) => ({
        tipo: resistencia.tipo,
        reducao: Number(resistencia.reducao) || 0,
        membros: membrosProtegidos,
      }));
      const resistenciasDano = (personagem.resistenciasDano || []).filter(
        (resistencia) => {
          const indice = reducoesParaRemover.findIndex(
            (reducao) =>
              reducao.tipo === resistencia.tipo &&
              reducao.reducao === (Number(resistencia.reducao) || 0) &&
              JSON.stringify(reducao.membros || []) ===
                JSON.stringify(resistencia.membros || []),
          );

          if (indice < 0) return true;
          reducoesParaRemover.splice(indice, 1);
          return false;
        },
      );
      const outraDefesaComMesmaResistencia = inventario.some(
        (item) =>
          item.resistencia && item.resistencia === itemRemovido.resistencia,
      );
      const resistencias = outraDefesaComMesmaResistencia
        ? personagem.resistencias || ""
        : String(personagem.resistencias || "")
            .split(" | ")
            .filter(
              (resistencia) => resistencia.trim() !== itemRemovido.resistencia,
            )
            .join(" | ");

      atualizado.bonusDefesa = Math.max(
        0,
        (Number(personagem.bonusDefesa) || 0) - bonusDefesa,
      );
      atualizado.membros = membros;
      atualizado.resistenciasDano = resistenciasDano;
      atualizado.resistencias = resistencias;
    }

    setPersonagem(atualizado);
    salvarFichaSelecionada(
      atualizado,
      `${itemRemovido.nome || "Item"} foi removido da ficha.`,
    );
  };

  const salvarCatalogo = async (catalogoAtualizado) => {
    const normalizado = catalogoAtualizado.map(normalizarItemLoja);
    setCatalogo(normalizado);
    localStorage.setItem(CATALOGO_STORAGE_KEY, JSON.stringify(normalizado));

    try {
      await salvarCatalogoLoja(normalizado);
      setMensagem("Catalogo da loja salvo.");
    } catch (error) {
      setMensagem("Catalogo salvo localmente. Backend indisponivel.");
    }
  };

  const sincronizarArmaExclusivaNasFichas = async (
    armaAnterior,
    armaAtualizada,
  ) => {
    const resultados = await Promise.all(
      fichas.map(async (ficha) => {
        let personagemAtual = ficha.personagem;

        try {
          personagemAtual =
            (await buscarPersonagem(ficha.fichaId)) || personagemAtual;
        } catch {
          // Sem backend, a cópia carregada no dashboard continua sendo usada.
        }

        const inventario = personagemAtual?.inventario || [];
        const possuiArma = inventario.some(
          (item) =>
            item.idLoja === armaAnterior.id ||
            item.id === armaAnterior.id ||
            item.nome === armaAnterior.nome,
        );

        if (!possuiArma) {
          return { ficha, personagem: personagemAtual, alterada: false };
        }

        const personagemAtualizado = {
          ...personagemAtual,
          inventario: inventario.map((item) => {
            const ehMesmaArma =
              item.idLoja === armaAnterior.id ||
              item.id === armaAnterior.id ||
              item.nome === armaAnterior.nome;

            if (!ehMesmaArma) return item;

            return {
              ...item,
              ...armaAtualizada,
              idLoja: armaAtualizada.id,
              armaStatus: reaplicarMelhoriasDaArma(
                armaAtualizada.armaStatus,
                item.melhoriaArma,
              ),
              melhoriaArma: item.melhoriaArma,
              municaoCarregada: item.municaoCarregada,
              durabilidade: item.durabilidade,
            };
          }),
        };

        salvarFichaLocal(ficha.fichaId, personagemAtualizado);

        try {
          const personagemSalvo = await salvarPersonagem(
            ficha.fichaId,
            personagemAtualizado,
          );
          const personagemFinal = personagemSalvo || personagemAtualizado;
          salvarFichaLocal(ficha.fichaId, personagemFinal);
          notificarPersonagemAtualizado(ficha.fichaId, personagemFinal);
          return {
            ficha,
            personagem: personagemFinal,
            alterada: true,
          };
        } catch {
          notificarPersonagemAtualizado(ficha.fichaId, personagemAtualizado);
          return { ficha, personagem: personagemAtualizado, alterada: true };
        }
      }),
    );

    setFichas(
      resultados.map(({ ficha, personagem }) => ({ ...ficha, personagem })),
    );

    const fichaAtualizada = resultados.find(
      ({ ficha, alterada }) => alterada && ficha.fichaId === fichaSelecionada,
    );
    if (fichaAtualizada) setPersonagem(fichaAtualizada.personagem);

    return resultados.filter(({ alterada }) => alterada).length;
  };

  const removerItemLoja = (id) => {
    salvarCatalogo(catalogo.filter((item) => item.id !== id));
  };

  // const abasEditorLoja = [
  //   { id: "armas-fogo", nome: "Armas de fogo" },
  //   { id: "armas-corpo", nome: "Armas brancas" },
  //   { id: "itens", nome: "Itens" },
  //   { id: "ritos", nome: "Ritos Absolutos" },
  //   { id: "poderes", nome: "Poderes Absolutos" },
  // ];

  const itensEditorLoja = catalogo.filter((item) => {
    if (item.categoria !== abaLojaEditor) {
      return false;
    }

    if (abaLojaEditor === "ritos") {
      return (item.nivelRito || "iniciante") === nivelRitoDashboard;
    }

    if (abaLojaEditor === "municoes-especiais") {
      return item.tipoArma === tipoMunicaoEditor;
    }

    return true;
  });

  const gerarIdItemLoja = (nome, categoria) =>
    `${categoria}-${nome}`
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const limparEditorLoja = () => {
    setNovoItemLoja({
      ...itemLojaVazio,
      categoria: abaLojaEditor,
      nivelRito: abaLojaEditor === "ritos" ? nivelRitoDashboard : "iniciante",
      tipoArma: abaLojaEditor === "municoes-especiais" ? tipoMunicaoEditor : "",
      subtipo: "nenhum",
    });
    setMostrarFormNovoItem(false);
  };

  const atualizarCampoLoja = (campo, valor) => {
    setNovoItemLoja((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const atualizarArmaStatusLoja = (campo, valor) => {
    setNovoItemLoja((atual) => ({
      ...atual,
      armaStatus: {
        ...(atual.armaStatus || {}),
        [campo]: valor,
      },
    }));
  };

  const alternarModificacaoArmaExclusiva = (modificacao) => {
    setNovoItemLoja((atual) => {
      const atuais = atual.modificacoesArma || [];
      const jaSelecionada = atuais.some((item) => item.id === modificacao.id);

      if (jaSelecionada) {
        return {
          ...atual,
          modificacoesArma: atuais.filter((item) => item.id !== modificacao.id),
        };
      }

      if (atuais.length >= 3) {
        setMensagem("Uma arma pode receber no máximo 3 aprimoramentos.");
        return atual;
      }

      return {
        ...atual,
        modificacoesArma: [...atuais, modificacao],
      };
    });
  };

  const alternarModificacaoArmaExclusivaEmEdicao = (modificacao) => {
    setItemEditandoDados((atual) => {
      if (!atual) return atual;

      const atuais = atual.modificacoesArma || [];
      const jaSelecionada = atuais.some((item) => item.id === modificacao.id);

      if (jaSelecionada) {
        const modificacoesArma = atuais.filter(
          (item) => item.id !== modificacao.id,
        );
        return {
          ...atual,
          modificacoesArma,
          armaStatus: aplicarAprimoramentosNoStatus(
            atual.armaStatusBase || atual.armaStatus,
            modificacoesArma,
          ),
        };
      }

      if (atuais.length >= 3) {
        setMensagem("Uma arma pode receber no máximo 3 aprimoramentos.");
        return atual;
      }

      const modificacoesArma = [...atuais, modificacao];
      return {
        ...atual,
        modificacoesArma,
        armaStatus: aplicarAprimoramentosNoStatus(
          atual.armaStatusBase || atual.armaStatus,
          modificacoesArma,
        ),
      };
    });
  };

  // =========================================================
  // EDIÇÃO IN‑PLACE PARA ITENS DA LOJA
  // =========================================================

  const editarItemLojaInPlace = (item) => {
    setItemEditandoId(item.id);
    const armaStatusBase = item.armaStatusBase || item.armaStatus || null;
    setItemEditandoDados({
      ...item,
      subtipo: item.subtipo || "nenhum",
      armaStatusBase,
      armaStatus: aplicarAprimoramentosNoStatus(
        armaStatusBase,
        item.modificacoesArma || [],
      ),
    });
  };

  const cancelarEdicaoInPlace = () => {
    setItemEditandoId(null);
    setItemEditandoDados(null);
  };

  const salvarEdicaoInPlace = async () => {
    if (!itemEditandoDados || !itemEditandoDados.nome.trim()) {
      setMensagem("Informe o nome do item.");
      return;
    }

    const itemAnterior = catalogo.find((item) => item.id === itemEditandoId);
    const armaStatusBase =
      itemEditandoDados.armaStatusBase || itemEditandoDados.armaStatus || null;
    const itemNormalizado = normalizarItemLoja({
      ...itemEditandoDados,
      armaStatusBase,
      armaStatus: aplicarAprimoramentosNoStatus(
        armaStatusBase,
        itemEditandoDados.modificacoesArma || [],
      ),
    });
    const catalogoAtualizado = catalogo.map((item) =>
      item.id === itemEditandoId ? itemNormalizado : item,
    );
    await salvarCatalogo(catalogoAtualizado);

    const fichasSincronizadas =
      itemAnterior?.categoria === "armas-exclusivas"
        ? await sincronizarArmaExclusivaNasFichas(itemAnterior, itemNormalizado)
        : 0;

    setItemEditandoId(null);
    setItemEditandoDados(null);
    setMensagem(
      itemAnterior?.categoria === "armas-exclusivas"
        ? `Arma exclusiva atualizada em ${fichasSincronizadas} ficha(s).`
        : "Item atualizado!",
    );
  };

  const salvarItemLojaEditor = (event) => {
    event.preventDefault();

    if (!novoItemLoja.nome.trim()) {
      setMensagem("Informe o nome do item.");
      return;
    }

    const idFinal = gerarIdItemLoja(novoItemLoja.nome, abaLojaEditor);

    let itemBase = {
      ...novoItemLoja,
      id: idFinal,
      categoria: abaLojaEditor,
      preco: Math.max(0, parseInt(novoItemLoja.preco, 10) || 0),
      dano: String(novoItemLoja.dano || "").trim(),
      bonusDano: String(novoItemLoja.bonusDano || "").trim(),
      defesaBonus:
        abaLojaEditor === "defesas"
          ? Math.max(0, parseInt(novoItemLoja.defesaBonus, 10) || 0)
          : 0,
      resistencia:
        abaLojaEditor === "defesas"
          ? String(novoItemLoja.resistencia || "").trim()
          : "",
      resistenciasDano:
        abaLojaEditor === "defesas" ? novoItemLoja.resistenciasDano || [] : [],
      tipoArma:
        abaLojaEditor === "municoes-especiais"
          ? String(novoItemLoja.tipoArma || "").trim()
          : "",
      quantidade:
        abaLojaEditor === "municoes-especiais"
          ? Math.max(1, parseInt(novoItemLoja.quantidade, 10) || 1)
          : 0,
      municaoEspecial: abaLojaEditor === "municoes-especiais",
      efeito: String(novoItemLoja.efeito || "").trim(),
      subtipo: novoItemLoja.subtipo || "nenhum",
      modificacoesArma:
        abaLojaEditor === "armas-exclusivas"
          ? novoItemLoja.modificacoesArma || []
          : [],
      aprimoramentoCustomizado:
        abaLojaEditor === "armas-exclusivas" &&
        novoItemLoja.aprimoramentoCustomizado?.nome?.trim()
          ? {
              nome: novoItemLoja.aprimoramentoCustomizado.nome.trim(),
              detalhe: String(
                novoItemLoja.aprimoramentoCustomizado.detalhe || "",
              ).trim(),
              exclusivo: true,
            }
          : null,
    };

    // Se for armas exclusivas, tratar subtipo
    if (abaLojaEditor === "armas-exclusivas") {
      if (novoItemLoja.subtipo === "fogo") {
        itemBase.armaStatus = {
          tipo: novoItemLoja.armaStatus?.tipo || "",
          dmg: novoItemLoja.armaStatus?.dmg || "",
          rof: novoItemLoja.armaStatus?.rof || "",
          mag: novoItemLoja.armaStatus?.mag || "",
          disparosSemDesvantagem:
            novoItemLoja.armaStatus?.disparosSemDesvantagem || "",
          recarga: novoItemLoja.armaStatus?.recarga || "",
          critico: novoItemLoja.armaStatus?.critico || "",
          danoCabeca: novoItemLoja.armaStatus?.danoCabeca || "",
          hipfire: novoItemLoja.armaStatus?.hipfire || "",
          precision: novoItemLoja.armaStatus?.precision || "",
          control: novoItemLoja.armaStatus?.control || "",
          mobility: novoItemLoja.armaStatus?.mobility || "",
        };
      } else if (novoItemLoja.subtipo === "corpo") {
        itemBase.armaStatus = {
          tipo: "Corpo a Corpo",
          dmg: novoItemLoja.dano || "",
          critico: novoItemLoja.critico || "1x...",
          danoCabeca: novoItemLoja.danoCabeca || "0",
        };
      } else {
        itemBase.armaStatus = null;
      }
    } else {
      // Para outras categorias, manter comportamento anterior
      if (
        abaLojaEditor !== "armas-fogo" &&
        abaLojaEditor !== "ritos" &&
        abaLojaEditor !== "poderes"
      ) {
        if (!itemBase.armaStatus) {
          itemBase.armaStatus = {};
        }
        if (itemBase.dano) {
          itemBase.armaStatus.dmg = itemBase.dano;
        }
        itemBase.armaStatus.critico = itemBase.critico || "1x...";
        itemBase.armaStatus.danoCabeca = itemBase.danoCabeca || "0";
      }
      if (
        abaLojaEditor === "armas-corpo" ||
        abaLojaEditor === "armas-arremessaveis"
      ) {
        itemBase.armaStatus = {
          ...(itemBase.armaStatus || {}),
          dmg: itemBase.dano || "1d4",
          critico: itemBase.critico || "1x...",
          danoCabeca: itemBase.danoCabeca || "0",
          tipo: "Corpo a Corpo",
        };
      }
    }

    const armaStatusBase =
      abaLojaEditor === "armas-exclusivas" ? itemBase.armaStatus : null;
    const itemFinal = {
      ...itemBase,
      armaStatusBase,
      armaStatus:
        abaLojaEditor === "armas-exclusivas"
          ? aplicarAprimoramentosNoStatus(
              armaStatusBase,
              itemBase.modificacoesArma || [],
            )
          : itemBase.armaStatus || null,
      nivelRito:
        abaLojaEditor === "ritos" ? itemBase.nivelRito || "iniciante" : "",
    };

    const itemNormalizado = normalizarItemLoja(itemFinal);
    const catalogoAtualizado = [...catalogo, itemNormalizado];

    salvarCatalogo(catalogoAtualizado);
    limparEditorLoja();
    setMensagem("Item adicionado!");
  };

  const abrirCardFicha = useCallback((ficha, tipo = "jogador") => {
    const personagemCard = ficha.personagem || ficha;

    if (tipo === "jogador") {
      if (ficha.sistema === "espiral" || isFichaEspiral(personagemCard)) {
        setFichaEspiralAberta(ficha);
        return;
      }
      setFichaSelecionada(ficha.fichaId);
      setPersonagem({
        ...estadoInicial,
        ...personagemCard,
        lojaCreditos: personagemCard.lojaCreditos ?? 900,
      });
      setModalFichaAberto(true);
      return;
    }

    if (tipo === "npc") {
      setNpcEditando(personagemCard.id);
      return;
    }

    setInimigoEditando(personagemCard.id);
  }, []);

  const salvarFichaEspiralDoMestre = useCallback(async (ficha, alteracoes) => {
    const id = ficha?.espiralId;
    if (!id) return;
    const chave = `espiral:sheet:v1:${id}`;
    const atualizada = { ...(ficha.personagem || ficha), ...alteracoes };
    try {
      await salvarFichaEspiral(ficha.espiralId, atualizada);
      localStorage.setItem(chave, JSON.stringify(atualizada));
      const proxima = { ...ficha, personagem: atualizada };
      setFichaEspiralAberta(proxima);
      setFichas((atuais) => atuais.map((item) => item.fichaId === ficha.fichaId ? proxima : item));
      setMensagem("Ficha Darkness atualizada e compartilhada.");
    } catch (error) {
      setMensagem("Não foi possível salvar a ficha Darkness.");
    }
  }, []);

  const salvarAnimacaoTokenDaFicha = async (ficha,patch) => {
    if(isFichaEspiral(ficha.personagem)) {
      const chave=`espiral:sheet:v1:${ficha.espiralId}`;
      const atual=JSON.parse(localStorage.getItem(chave) || 'null') || ficha.personagem;
      if(!atual) throw new Error('A ficha Darkness não está disponível neste navegador.');
      const personagemAtualizado={...atual,...patch};
      await salvarFichaEspiral(ficha.espiralId, personagemAtualizado);
      localStorage.setItem(chave,JSON.stringify(personagemAtualizado));
      const proxima={...ficha,personagem:personagemAtualizado};
      setFichas(atuais => atuais.map(item => item.fichaId===ficha.fichaId ? proxima : item));
      setFichaEspiralAberta(aberta => aberta?.fichaId===ficha.fichaId ? proxima : aberta);
    } else {
      await salvarFichaSelecionada(patch,'Animação de token salva na ficha.',ficha.fichaId,true);
    }
    window.dispatchEvent(new CustomEvent('darkness:token-animation-updated',{detail:{fichaId:ficha.fichaId,patch}}));
  };
  const concederEntradaEspiral = async (ficha, entrada) => {
    try {
      const chave = 'espiral:sheet:v1:' + ficha.espiralId;
      const atual = JSON.parse(localStorage.getItem(chave) || 'null') || ficha.personagem;
      if (!atual || atual.version !== 1) return false;
      const alteracoes = grantEspiralCatalogEntry(atual, entrada, entrada.id + '-' + Date.now() + '-' + Math.random());
      const atualizada = { ...atual, ...alteracoes };
      await salvarFichaEspiral(ficha.espiralId, atualizada);
      localStorage.setItem(chave, JSON.stringify(atualizada));
      const proxima = { ...ficha, personagem: atualizada };
      setFichas(atuais => atuais.map(item => item.fichaId === ficha.fichaId ? proxima : item));
      setFichaEspiralAberta(aberta => aberta?.fichaId === ficha.fichaId ? proxima : aberta);
      return true;
    } catch {
      return false;
    }
  };

  // Mantido temporariamente para comparar o card antigo durante a migração de performance.
  // eslint-disable-next-line no-unused-vars
  const renderCardFicha = (ficha, tipo = "jogador") => {
    const personagemCard = ficha.personagem || ficha;
    const membros = personagemCard.membros || {};
    const imagem =
      personagemCard.fotoPerfil || "https://placehold.co/600x800?text=Sem+Foto";

    return (
      <article
        key={ficha.fichaId || ficha.id}
        className="mestre-card-personagem"
        onClick={() => {
          if (tipo === "jogador") {
            setFichaSelecionada(ficha.fichaId);
            setPersonagem({
              ...estadoInicial,
              ...personagemCard,
              lojaCreditos: personagemCard.lojaCreditos ?? 900,
            });
            setModalFichaAberto(true);
          } else if (tipo === "npc") {
            setNpcEditando(personagemCard.id);
          } else {
            setInimigoEditando(personagemCard.id);
          }
        }}
        style={{ backgroundImage: `url(${imagem})` }}
      >
        <div className="mestre-card-overlay" />

        <div className="mestre-card-conteudo">
          <div className="mestre-card-info"><img className="abs-dashboard-portrait" src={imagem} alt="" loading="lazy"/>
            <small>
              NV{" "}
              {tipo === "inimigo"
                ? numeroRomanoDashboard(personagemCard.nivel)
                : personagemCard.nivel || 1}
            </small>{" "}
            {personagemCard.nomeJogador && (
              <em className="mestre-card-jogador">
                {personagemCard.nomeJogador}
              </em>
            )}
            <h3>{personagemCard.nome || "Sem nome"}</h3>
            <span>{personagemCard.classe || "Sem classe"}</span>
          </div>

          <div className="mestre-card-atributos">
            {Object.entries(personagemCard.atributos || {})
              .slice(0, 5)
              .map(([atributo, valor]) => (
                <div key={atributo}>
                  <span>{atributo.slice(0, 3).toUpperCase()}</span>
                  <strong>{valor}</strong>
                </div>
              ))}
          </div>

          <div className="mestre-card-barras">
            <div className="mestre-card-membros">
              <label>INTEGRIDADE</label>

              {membrosFicha.map(({ chave, nome }) => {
                const dados = membros[chave] || { atual: 0, max: 0 };
                const porcentagem =
                  dados.max > 0 ? (dados.atual / dados.max) * 100 : 0;

                return (
                  <div key={chave} className="mestre-card-membro-mini">
                    <span>{nome}</span>

                    <div className="barra vermelho">
                      <span
                        style={{
                          width: `${Math.min(100, Math.max(0, porcentagem))}%`,
                        }}
                      />
                    </div>

                    <small>
                      {dados.atual || 0} / {dados.max || 0}
                    </small>
                  </div>
                );
              })}
            </div>

            <div>
              <label>SANIDADE</label>
              <div className="barra roxo">
                <span
                  style={{
                    width: `${
                      personagemCard.sanidade?.max > 0
                        ? (personagemCard.sanidade.atual /
                            personagemCard.sanidade.max) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <small>
                {personagemCard.sanidade?.atual || 0} /{" "}
                {personagemCard.sanidade?.max || 0}
              </small>
            </div>

            {tipo === "jogador" && (
              <div>
                <label>ESPERANÇA</label>
                <div className="barra dourado">
                  <span
                    style={{
                      width: `${
                        personagemCard.esperanca?.max > 0
                          ? (personagemCard.esperanca.atual /
                              personagemCard.esperanca.max) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <small>
                  {personagemCard.esperanca?.atual || 0} /{" "}
                  {personagemCard.esperanca?.max || 0}
                </small>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="mestre-page darkness-master">
      <DarknessMasterHeader agents={fichasJogadores.length} pending={habilidadesPendentes.length + recriacoesPendentes} loading={carregando} onRefresh={carregarTudo} onNavigate={setAba} onMenu={() => setMenuHamburguerAberto(!menuHamburguerAberto)} />
      {menuHamburguerAberto && (
        <div className="mestre-hamburguer-menu">
          <button
            className="mestre-refresh"
            onClick={carregarTudo}
            disabled={carregando}
          >
            <Icon path={mdiRefresh} size={0.9} />
            {carregando ? "Carregando" : "Atualizar"}
          </button>
          <button
            className="mestre-hamburguer-item"
            onClick={() => {
              localStorage.removeItem(RECEITAS_STORAGE_KEY);
              setReceitasCriacaoDashboard(
                normalizarReceitasPadrao(RECEITAS_PADRAO),
              );
              setMensagem("Receitas padrão restauradas.");
              setMenuHamburguerAberto(false);
            }}
          >
            🔄 Restaurar Receitas Padrão
          </button>
          <button
            className="mestre-hamburguer-item"
            onClick={() => {
              // Exemplo: recarregar dados
              carregarTudo();
              setMenuHamburguerAberto(false);
            }}
          >
            🔄 Recarregar Dados
          </button>
        </div>
      )}

      {mensagem && <p className="mestre-mensagem">{mensagem}</p>}

      <nav className="mestre-tabs" aria-label="Áreas do arquivo do mestre"><button className={aba === "animacoes" ? "ativa" : ""} onClick={() => setAba("animacoes")}>Estúdio de Tokens</button>
        <button
          className={aba === "campanha" ? "ativa" : ""}
          onClick={() => setAba("campanha")}
        >
          Campanhas
        </button>
        <button
          className={aba === "fichas" ? "ativa" : ""}
          onClick={() => setAba("fichas")}
        >
          Personagens
        </button>
        <button
          className={aba === "inimigos" ? "ativa" : ""}
          onClick={() => setAba("inimigos")}
        >
          Encontros
        </button>
        <button
          className={aba === "loja" ? "ativa" : ""}
          onClick={() => setAba("loja")}
        >
          Acervo
        </button>
        <button
          className={aba === "habilidades" ? "ativa" : ""}
          onClick={() => setAba("habilidades")}
        >
          Habilidades
        </button>
        <button
          className={aba === "analises" ? "ativa" : ""}
          onClick={() => setAba("analises")}
        >
          Solicitações{" "}
          {habilidadesPendentes.length+recriacoesPendentes
            ? `(${habilidadesPendentes.length+recriacoesPendentes})`
            : ""}
        </button>
        { <button
          className={aba === "marcas" ? "ativa" : ""}
          onClick={() => setAba("marcas")}
        >
          Marcas
        </button>}
      </nav>

      {false && <section className="mestre-dashboard-full"></section>}
      <div className="mestre-layout-com-rolagens">
        <div className="mestre-conteudo-principal">
          {aba === "campanha" && <CampanhaDashboard />}{aba === "animacoes" && <TokenAnimationStudio fichas={fichasJogadores} onSaveSheetAnimation={salvarAnimacaoTokenDaFicha} />}
          {aba === "fichas" && (
            <section className="mestre-dashboard-full">
              { <div className="ed-section-heading"><div><span className="ed-eyebrow">01 / ARQUIVO DE PERSONAGENS</span><h2>Quem faz parte da história.</h2><p>Abra um dossiê para consultar recursos, conceder evolução e acompanhar as marcas.</p></div><a href="/?criar=1&sistema=darkness">Novo personagem <span>↗</span></a></div>}
              { <div className="ed-agents-toolbar"><span>{fichasExibidas.length} {fichasExibidas.length === 1 ? "personagem" : "personagens"}<small> / {fichasDaSubAba.length} no arquivo</small></span><label><span className="ed-search-symbol" aria-hidden="true">⌕</span><input type="search" aria-label="Buscar personagens Darkness" placeholder="Nome, jogador, classe ou ocupação" value={buscaEspiral} onChange={event => setBuscaEspiral(event.target.value)} /></label></div>}
              <div className="mestre-subtabs-fichas" role="status">
                Arquivo Darkness
                <small>{fichasDaSubAba.length} ficha(s)</small>
              </div>

              <div className="mestre-dashboard-cards ad-agent-card-grid">
                  {fichasExibidas.length > 0 ? (
                    fichasExibidas.map((ficha) => (
                      <DashboardFichaCard
                        key={ficha.fichaId || ficha.id}
                        ficha={ficha}
                        tipo="jogador"
                        onAbrir={abrirCardFicha}
                      />
                    ))
                  ) : (
                    <div className="mestre-vazio">
                      <strong>{buscaEspiral ? "Nenhum personagem encontrado." : "Seu arquivo começa aqui."}</strong><p>{buscaEspiral ? "Busque por nome, jogador, classe ou ocupação." : "Crie um personagem Darkness para começar sua história."}</p>{buscaEspiral ? <button type="button" onClick={() => setBuscaEspiral("")}>Limpar busca</button> : <a href="/?criar=1&sistema=darkness">Criar personagem ↗</a>}

                    </div>
                  )}
                </div>

              {fichaEspiralAberta && (
                <ModalFichaEspiral
                  key={fichaEspiralAberta.fichaId || fichaEspiralAberta.espiralId}
                  ficha={fichaEspiralAberta}
                  onClose={() => setFichaEspiralAberta(null)}
                  onSalvar={(alteracoes) => salvarFichaEspiralDoMestre(fichaEspiralAberta, alteracoes)}
                />
              )}

              {modalFichaAberto && personagem && (
                <div
                  className="mestre-modal-overlay"
                  onClick={() => setModalFichaAberto(false)}
                >
                  <section
                    className="mestre-modal-ficha minimalista mestre-modal-personagem"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Dossiê de ${personagem.nome || 'personagem'}`}
                    onKeyDown={(event) => { if (event.key === 'Escape') setModalFichaAberto(false); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="ad-dossier-toolbar"><span>ARQUIVO ABSOLUTO <i>/</i> DOSSIÊ DO PERSONAGEM</span><button type="button" autoFocus onClick={() => setModalFichaAberto(false)} aria-label="Fechar dossiê">Fechar <span aria-hidden="true">×</span></button></div>
                    <header className="mestre-modal-header">
                      <div className="mestre-modal-header-esquerda">
                        <img
                          src={
                            personagem.fotoPerfil ||
                            "https://placehold.co/300x300"
                          }
                          alt={personagem.nome}
                          className="mestre-modal-foto"
                        />

                        <div className="mestre-modal-identidade">
                          <span>REGISTRO DE CAMPO · PERSONAGEM</span>
                          <h2>{personagem.nome || "Sem Nome"}</h2>
                          <small>
                            {personagem.classe || "Sem Classe"} • NV{" "}
                            {personagem.nivel || 1}
                          </small>
                          {/* MARCAS ATRIBUÍDAS */}
                          {personagem.marcas &&
                            personagem.marcas.length > 0 && (
                              <div className="mestre-modal-marcas">
                                <div className="mestre-modal-marcas-lista">
                                  {personagem.marcas.map((marca, index) => (
                                    <span
                                      key={index}
                                      className="mestre-modal-marca-tag"
                                    >
                                      {marca.nome}
                                      {!marca.aceita && (
                                        <span className="marca-pendente">
                                          {" "}
                                          (pendente)
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          <div className="mestre-personagem-recursos">
                            <span>
                              Créditos: {personagem.lojaCreditos || 0}
                            </span>
                            <span>
                              Mementos: {personagem.ritosCreditos || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mestre-modal-header-acoes">
                        <div className="mestre-header-admin">
                          <div className="mestre-admin-grid">
                            {/* Créditos */}
                            <div className="mestre-admin-grupo creditos">
                              <label>Créditos</label>
                              <div className="mestre-admin-controles">
                                <NumberInput
                                  type="number"
                                  value={creditosDelta}
                                  onChange={(e) =>
                                    setCreditosDelta(e.target.value)
                                  }
                                  step="100"
                                />
                                <button onClick={adicionarCreditos}>+</button>
                              </div>
                            </div>

                            {/* Mementos */}
                            <div className="mestre-admin-grupo mementos">
                              <label>Mementos</label>
                              <div className="mestre-admin-controles">
                                <NumberInput
                                  type="number"
                                  value={ritosCreditosDelta}
                                  onChange={(e) =>
                                    setRitosCreditosDelta(e.target.value)
                                  }
                                  step="10"
                                />
                                <button onClick={adicionarRitosCreditos}>
                                  +
                                </button>
                              </div>
                            </div>

                            {/* PE */}
                            <div className="mestre-admin-grupo pe">
                              <label>PE · Evolução</label>
                              <div className="mestre-admin-controles">
                                <NumberInput
                                  type="number"
                                  value={evolucaoDelta}
                                  onChange={(e) =>
                                    setEvolucaoDelta(e.target.value)
                                  }
                                  step="1"
                                />
                                <button onClick={adicionarPontosEvolucao}>
                                  {parseInt(evolucaoDelta, 10) >= 0 ? "+" : "−"}
                                </button>
                              </div>
                            </div>

                            {/* Nível */}
                            <div className="mestre-admin-grupo nivel">
                              <label>Nível</label>
                              <div className="mestre-admin-controles">
                                <button
                                  className="mestre-btn-nivel"
                                  onClick={diminuirNivelJogador}
                                  disabled={salvandoNivel}
                                >
                                  −
                                </button>
                                <span className="mestre-nivel-atual">
                                  {personagem?.nivel || 1}
                                </span>
                                <button
                                  className="mestre-btn-nivel"
                                  onClick={subirNivelJogador}
                                  disabled={salvandoNivel}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Linha divisória opcional */}
                          <hr className="mestre-admin-divisor" />
                        </div>

                        <button
                          className="mestre-btn-apagar"
                          onClick={apagarFichaSelecionada}
                        >
                          Apagar Personagem
                        </button>

                        <button
                          className="mestre-modal-fechar mestre-modal-fechar-ficha"
                          aria-label="Fechar ficha"
                          onClick={() => setModalFichaAberto(false)}
                        >
                          x
                        </button>
                      </div>
                    </header>

                    {/* ATRIBUTOS */}
                    <section className="mestre-modal-bloco full">
                      <HopeWhispersEditor key={fichaSelecionada} messages={personagem.esperancaMensagens} onSave={messages=>salvarFichaSelecionada({esperancaMensagens:messages},'Mensagens de Esperança salvas.',null,true)}/>
                    </section>
                    <section className="mestre-modal-bloco full">
                      <div className="mestre-modal-linha-topo">
                        <span>Atributos</span>

                        <button
                          className="mestre-abrir-ficha"
                          onClick={() => {
                            window.open(
                              `/?sistema=darkness&ficha=${encodeURIComponent(fichaSelecionada)}`,
                              "_blank",
                            );
                          }}
                        >
                          Abrir ficha
                        </button>
                      </div>

                      <div className="mestre-modal-atributos linha">
                        {Object.entries(personagem.atributos || {}).map(
                          ([atributo, valor]) => (
                            <div key={atributo}>
                              <small>{atributo}</small>
                              <strong>{valor}</strong>
                            </div>
                          ),
                        )}
                      </div>
                    </section>

                    {/* SANIDADE + ESPERANÇA */}
                    <div className="mestre-status-layout">
                      <div className="mestre-modal-bloco">
                        <span>Integridade Corporal</span>

                        <div className="mestre-corpo-grid novo">
                          {(ehAbsolutoV1(personagem) ? Object.entries(REGIOES).map(([chave,r]) => ({chave,nome:r.nome})) : membrosFicha).map((membro) => {
                            const dados = personagem?.membros?.[membro.chave];

                            return (
                              <div
                                key={membro.chave}
                                className="mestre-corpo-item"
                              >
                                <small>{membro.nome}</small>

                                <div className="mestre-barra vermelho">
                                  <span
                                    style={{
                                      width: `${
                                        ((dados?.atual || 0) /
                                          (dados?.max || 1)) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>

                                <strong>
                                  {dados?.atual || 0} / {dados?.max || 0}
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mestre-status-lateral">
                        <div className="mestre-modal-bloco">
                          <span>Sanidade</span>

                          <div className="mestre-barra-container">
                            <div className="mestre-barra roxo">
                              <span
                                style={{
                                  width: `${
                                    ((personagem?.sanidade?.atual || 0) /
                                      (personagem?.sanidade?.max || 1)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>

                            <div className="mestre-recurso-editor">
                              <CampoNumeroEditavel
                                type="number"
                                valor={personagem?.sanidade?.atual ?? 0}
                                onConfirmar={(valor) => {
                                  const atualizado = {
                                    ...personagem,
                                    sanidade: {
                                      ...(personagem.sanidade || {}),
                                      atual: Math.max(0, valor),
                                    },
                                  };

                                  setPersonagem(atualizado);
                                  salvarFichaSelecionada(atualizado);
                                }}
                              />

                              <span>/</span>

                              <CampoNumeroEditavel
                                type="number"
                                valor={personagem?.sanidade?.max ?? 0}
                                onConfirmar={(valor) => {
                                  const atualizado = {
                                    ...personagem,
                                    sanidade: {
                                      ...(personagem.sanidade || {}),
                                      max: Math.max(0, valor),
                                    },
                                  };

                                  setPersonagem(atualizado);
                                  salvarFichaSelecionada(atualizado);
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mestre-modal-bloco">
                          <span>Esperança</span>

                          <div className="mestre-barra-container">
                            <div className="mestre-barra dourado">
                              <span
                                style={{
                                  width: `${
                                    ((personagem?.esperanca?.atual || 0) /
                                      (personagem?.esperanca?.max || 1)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>

                            <div className="mestre-recurso-editor">
                              <CampoNumeroEditavel
                                type="number"
                                valor={personagem?.esperanca?.atual ?? 0}
                                onConfirmar={(valor) => {
                                  const atualizado = {
                                    ...personagem,
                                    esperanca: {
                                      ...(personagem.esperanca || {}),
                                      atual: Math.max(0, valor),
                                    },
                                  };

                                  setPersonagem(atualizado);
                                  salvarFichaSelecionada(atualizado);
                                }}
                              />

                              <span>/</span>

                              <CampoNumeroEditavel
                                type="number"
                                valor={personagem?.esperanca?.max ?? 0}
                                onConfirmar={(valor) => {
                                  const atualizado = {
                                    ...personagem,
                                    esperanca: {
                                      ...(personagem.esperanca || {}),
                                      max: Math.max(0, valor),
                                    },
                                  };

                                  setPersonagem(atualizado);
                                  salvarFichaSelecionada(atualizado);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AbsolutoAtivosResumo personagem={personagem} />
                    {ehAbsolutoV1(personagem) && <section className="mestre-modal-bloco full"><AbsolutoMedo personagem={personagem} setPersonagem={next => {
                      const atualizado = typeof next === 'function' ? next(personagem) : next;
                      setPersonagem(atualizado); salvarFichaSelecionada(atualizado);
                    }} /></section>}

                    {/* INVENTÁRIO */}
                    <section className="mestre-modal-bloco full">
                      <span>Inventário</span>

                      <div className="mestre-inventario-grid">
                        {(personagem.inventario || []).length === 0 && <p className="ad-dossier-empty">Nenhum item no inventário.</p>}
                        {(personagem.inventario || []).map((item, index) => (
                          <div
                            key={`${item.nome}-${index}`}
                            className="mestre-item-card"
                          >
                            <strong>{item.nome}</strong>

                            <small>{item.tipo}</small>
                            <button
                              type="button"
                              className="mestre-btn-apagar"
                              onClick={() => removerItemInventario(index)}
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* RITOS */}
                    <section className="mestre-modal-bloco full">
                      <span>Ritos</span>

                      <div className="mestre-inventario-grid">
                        {(personagem.rituais || []).length === 0 && <p className="ad-dossier-empty">Nenhum rito registrado.</p>}
                        {(personagem.rituais || []).map((rito, index) => (
                          <div
                            key={`${rito.nome}-${index}`}
                            className={`mestre-item-card ${
                              rito.ativo ? "ativo" : ""
                            }`}
                          >
                            <strong>{rito.nome}</strong>

                            <small>{rito.nivel}</small>
                          </div>
                        ))}
                      </div>
                    </section>
                  </section>
                </div>
              )}
            </section>
          )}

          {aba === "inimigos" &&  <DarknessEncounters legacyRecords={[...npcs.map(item => ({ ...item, tipo: "npc" })), ...inimigos.map(item => ({ ...item, tipo: "inimigo" }))]} />}
          {aba === "loja" && <DarknessEquipment fichas={fichasModernas} onGrant={concederEntradaEspiral} />}
          {aba === "habilidades" && <DarknessAbilities fichas={fichasModernas} onGrant={concederEntradaEspiral} />}

          {aba === "analises" && (
            <section className="mestre-analises"><RecriacaoRequests fichas={fichas} onSaved={(ficha,saved)=>{setFichas(current=>current.map(item=>item.fichaId===ficha.fichaId?{...item,personagem:saved}:item));setMensagem("Solicitação de recriação analisada.");}}/>
              <div className="mestre-analises-topo">
                <div>
                  <span>Habilidades criadas pelos jogadores</span>
                  <h2>Fila de análise</h2>
                </div>
                <strong>{habilidadesPendentes.length} pendente(s)</strong>
              </div>
              {habilidadesPendentes.length ? (
                <div className="mestre-analises-lista">
                  {habilidadesPendentes.map(({ ficha, habilidade }) => (
                    <article
                      key={`${ficha.fichaId}:${habilidade.id}`} 
                      className="mestre-analise-card"
                    >
                      <div className="mestre-analise-meta">
                        <span>{ficha.personagem?.nome || ficha.fichaId}</span>
                        <b>
                          {habilidade.custo}{" "}
                          {habilidade.recurso === "evolucao"
                            ? "Pontos de Evolução"
                            : habilidade.recurso}
                        </b>
                      </div>
                      <h3>{habilidade.edicaoPendente ? 'Solicitação de edição: '+habilidade.edicaoPendente.nome : habilidade.nome}</h3>
                      {habilidade.edicaoPendente ? <AbilityEditDiff current={habilidade} proposal={habilidade.edicaoPendente}/> : <AbilityDocument habilidade={habilidade}/>}
                      <div className="mestre-analise-acoes">
                        <button
                          type="button"
                          className="aprovar"
                          onClick={() =>
                            analisarHabilidadeCriada(ficha, habilidade.id, true,habilidade.edicaoPendente?.id)
                          }
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          className="recusar"
                          onClick={() =>
                            analisarHabilidadeCriada(
                              ficha,
                              habilidade.id,
                              false,
                              habilidade.edicaoPendente?.id,
                            )
                          }
                        >
                          {habilidade.edicaoPendente ? "Recusar edição" : "Recusar e devolver custo"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mestre-analises-vazia">
                  Não há habilidades aguardando análise.
                </p>
              )}
            </section>
          )}
          { aba === "marcas" && (
            <section className="marcas-wrapper">
              {/* LAYOUT PRINCIPAL: FORM + LISTA */}
              <div className="marcas-layout">
                {/* FORMULÁRIO */}
                <form
                  className="marcas-form"
                  onSubmit={marcaEditando ? salvarEdicaoMarca : criarMarca}
                >
                  <h3>{marcaEditando ? "Editar Destino" : "Novo Destino"}</h3>

                  <label>
                    Nome
                    <input
                      value={formMarca.nome}
                      onChange={(e) =>
                        setFormMarca({ ...formMarca, nome: e.target.value })
                      }
                      placeholder="Ex: O Herdeiro da Guerra"
                    />
                  </label>

                  <label>
                    Descrição (narrativa)
                    <textarea
                      value={formMarca.descricao}
                      onChange={(e) =>
                        setFormMarca({
                          ...formMarca,
                          descricao: e.target.value,
                        })
                      }
                      placeholder="Descreva a essência do Destino..."
                      rows="2"
                    />
                  </label>

                  <label>
                    Benefícios
                    <textarea
                      value={formMarca.beneficios}
                      onChange={(e) =>
                        setFormMarca({
                          ...formMarca,
                          beneficios: e.target.value,
                        })
                      }
                      placeholder="Liste os ganhos (ex: +5 dados de dano)"
                      rows="2"
                    />
                  </label>

                  <label>
                    Penalidades
                    <textarea
                      value={formMarca.penalidades}
                      onChange={(e) =>
                        setFormMarca({
                          ...formMarca,
                          penalidades: e.target.value,
                        })
                      }
                      placeholder="Liste as desvantagens"
                      rows="2"
                    />
                  </label>

                  <section className="marcas-aparencia-editor">
                    <div className="marcas-aparencia-topo">
                      <div>
                        <strong>Aparência da conexão</strong>
                        <small>Personalize a tela que o jogador verá ao abrir este Destino.</small>
                      </div>
                      <label className="marcas-cor-linhas">
                        Cor das linhas
                        <span>
                          <input
                            type="color"
                            value={formMarca.corLinhas || "#111111"}
                            onChange={(e) => setFormMarca({
                              ...formMarca,
                              corLinhas: e.target.value,
                            })}
                          />
                          <input
                            type="text"
                            value={formMarca.corLinhas || "#111111"}
                            readOnly
                            aria-label="Código da cor das linhas"
                          />
                        </span>
                      </label>
                    </div>
                    <label className="marcas-imagem-fundo">
                      Imagem de fundo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={selecionarImagemFundoMarca}
                      />
                      <span>
                        {formMarca.imagemFundo
                          ? "Trocar imagem"
                          : "Escolher imagem"}
                      </span>
                    </label>
                    {formMarca.imagemFundo && (
                      <div className="marcas-imagem-preview">
                        <img src={formMarca.imagemFundo} alt="Prévia do fundo do Destino" />
                        <button
                          type="button"
                          onClick={() => setFormMarca({ ...formMarca, imagemFundo: "" })}
                        >
                          Remover imagem
                        </button>
                      </div>
                    )}
                  </section>

                  <div className="marcas-habilidades-container">
                    <label>Habilidades opcionais (máx. 3)</label>

                    {formMarca.habilidades.map((hab, index) => (
                      <div
                        key={index}
                        className="marcas-habilidade-input-group"
                      >
                        <input
                          type="text"
                          placeholder="Nome da habilidade"
                          value={hab.nome}
                          onChange={(e) =>
                            atualizarHabilidadeMarca(
                              index,
                              "nome",
                              e.target.value,
                            )
                          }
                        />
                        <textarea
                          placeholder="Descrição da habilidade"
                          value={hab.descricao}
                          onChange={(e) =>
                            atualizarHabilidadeMarca(
                              index,
                              "descricao",
                              e.target.value,
                            )
                          }
                          rows="2"
                        />
                        <button
                          type="button"
                          className="marcas-remover-habilidade"
                          onClick={() => removerHabilidadeMarca(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {formMarca.habilidades.length < 3 && (
                      <button
                        type="button"
                        className="marcas-adicionar-habilidade"
                        onClick={adicionarHabilidadeMarca}
                      >
                        + Adicionar Habilidade
                      </button>
                    )}
                  </div>

                  <div className="marcas-form-acoes">
                    <button type="submit">
                      {marcaEditando ? "Salvar" : "Criar"}
                    </button>
                    {marcaEditando && (
                      <button
                        type="button"
                        className="secundario"
                        onClick={limparFormMarca}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>

                {/* LISTA DE MARCAS */}
                <div className="marcas-lista">
                  {/* SEÇÃO DE ATRIBUIÇÃO */}
                  <div className="marcas-atribuicao">
                    <h3>Atribuir Destino a um Jogador</h3>

                    <div className="marcas-atribuicao-grid">
                      <label>
                        Personagem
                        <select
                          value={personagemSelecionadoId}
                          onChange={(e) =>
                            handlePersonagemChange(e.target.value)
                          }
                        >
                          <option value="">Selecione</option>
                          {fichas.map((f) => (
                            <option key={f.fichaId} value={f.fichaId}>
                              {f.personagem?.nome || f.fichaId}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Destino
                        <select
                          value={marcaSelecionadaId}
                          onChange={(e) =>
                            setMarcaSelecionadaId(e.target.value)
                          }
                        >
                          <option value="">Selecione</option>
                          {marcas.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nome}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        onClick={atribuirMarca}
                        disabled={
                          !personagemSelecionadoId || !marcaSelecionadaId
                        }
                      >
                        Atribuir
                      </button>
                    </div>

                    {/* PREVIEW DO PERSONAGEM SELECIONADO */}
                    {personagemSelecionado && (
                      <div className="marcas-personagem-preview">
                        <img
                          src={
                            personagemSelecionado.fotoPerfil ||
                            "https://placehold.co/52x52"
                          }
                          alt={personagemSelecionado.nome}
                          onError={(e) => {
                            e.target.src = "https://placehold.co/52x52";
                          }}
                        />
                        <div>
                          <strong>
                            {personagemSelecionado.nome || "Sem nome"}
                          </strong>
                          <small>
                            {personagemSelecionado.classe || "Sem classe"} • NV{" "}
                            {personagemSelecionado.nivel || 1}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="marcas-lista-header">
                    <span>Destinos existentes ({marcas.length})</span>
                  </div>
                  <div className="marcas-lista-grid">
                    {marcas.length === 0 && (
                      <div
                        style={{
                          color: "#888",
                          textAlign: "center",
                          padding: "30px 0",
                        }}
                      >
                        Nenhum Destino criado ainda.
                      </div>
                    )}
                    {marcas.map((marca) => (
                      <div key={marca.id} className="marcas-card">
                        <div className="marcas-card-topo">
                          <div>
                            <span className="marcas-tag">DESTINO</span>
                            <h4>{marca.nome}</h4>
                          </div>
                          <div className="marcas-card-acoes">
                            <button
                              onClick={() => editarMarca(marca)}
                              title="Editar"
                            >
                              <Icon path={mdiPencil} size={0.8} />
                            </button>
                            <button
                              className="perigo"
                              onClick={() => excluirMarca(marca.id)}
                              title="Excluir"
                            >
                              <Icon path={mdiDeleteOutline} size={0.8} />
                            </button>
                          </div>
                        </div>

                        <p className="marcas-card-desc">{marca.descricao}</p>

                        <div className="marcas-card-detalhes">
                          <small>
                            <strong>Benefícios:</strong> {marca.beneficios}
                          </small>
                          <small>
                            <strong>Penalidades:</strong> {marca.penalidades}
                          </small>
                          {marca.habilidades?.length > 0 && (
                            <small>
                              <strong>Habilidades:</strong>{" "}
                              {marca.habilidades.map((h) => h.nome).join(", ")}
                            </small>
                          )}
                        </div>

                        {/* PERSONAGENS VINCULADOS */}
                        {marca.atribuidaA && marca.atribuidaA.length > 0 && (
                          <div className="marcas-card-personagens">
                            {marca.atribuidaA.map((p) => (
                              <div
                                key={p.fichaId}
                                className="marcas-personagem-chip"
                              >
                                <img
                                  src={
                                    p.fotoPerfil || "https://placehold.co/40x40"
                                  }
                                  alt={p.nome}
                                  onError={(e) => {
                                    e.target.src = "https://placehold.co/40x40";
                                  }}
                                />
                                <span>{p.nome}</span>
                                <button
                                  type="button"
                                  onClick={() => removerMarcaDoPersonagem(marca, p)}
                                  title={`Remover ${marca.nome} de ${p.nome}`}
                                  aria-label={`Remover ${marca.nome} de ${p.nome}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="mestre-rolagens-lateral">
          <section className="painel-rolagens-mestre">
            <div className="painel-rolagens-topo">
              <div>
                <span>Canal de escuta // tempo real</span>
                <h3>Rolagens de campo</h3>
              </div>

              <div className="painel-rolagens-acoes">
                <button
                  type="button"
                  onClick={() => setPainelRolagensAberto((prev) => !prev)}
                >
                  {painelRolagensAberto ? "Ocultar" : "Mostrar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("darkness_rolagens_mestre");
                    setRolagensMestre([]);
                  }}
                >
                  Limpar
                </button>
              </div>
            </div>

            {painelRolagensAberto && (
              <div className="lista-rolagens-mestre">
                {rolagensMestre.length > 0 ? (
                  rolagensMestre.map((rolagem) => (
                    <article className="rolagem-mestre-card" key={rolagem.id}>
                      <header>
                        <strong>{rolagem.jogador}</strong>
                      </header>

                      <h4>{rolagem.titulo}</h4>
                      <p>{rolagem.modo}</p>

                      <div className="rolagem-mestre-formula">
                        {rolagem.formula}
                      </div>

                      <div className="rolagem-mestre-dados">
                        {(
                          rolagem.dadosDetalhados ||
                          (rolagem.dados || []).map((valor) => ({
                            valor,
                            faces: rolagem.faces,
                          }))
                        ).map((dado, index) => (
                          <span key={index}>
                            {espiralDie(dado.faces)}: {dado.valor}
                          </span>
                        ))}
                      </div>

                      {rolagem.finais > 0 && (
                        <small>
                          Finais: {rolagem.finais} | Bônus: +
                          {rolagem.bonusFinais || 0}
                        </small>
                      )}

                      <footer>
                        <span>
                          {rolagem.tipo === "dano" ? "Dano" : "Resultado"}
                        </span>
                        <strong>{rolagem.total}</strong>
                      </footer>
                    </article>
                  ))
                ) : (
                  <div className="rolagem-mestre-vazio">
                    Nenhuma rolagem recebida ainda.
                  </div>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>

      {popup &&
        createPortal(
          <div className="mestre-popup-overlay" onClick={fecharPopup}>
            <section
              className={`mestre-popup ${popup.tipo === "perigo" ? "perigo" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>
                {popup.tipo === "perigo" ? "CONFIRMAÇÃO" : "ABSOLUTO"}
              </span>

              <h2>{popup.titulo}</h2>

              <p>{popup.mensagem}</p>

              <div className="mestre-popup-acoes">
                {popup.onConfirmar && (
                  <button type="button" onClick={fecharPopup}>
                    Cancelar
                  </button>
                )}

                <button
                  type="button"
                  className={popup.tipo === "perigo" ? "perigo" : "primario"}
                  onClick={popup.onConfirmar ? confirmarPopup : fecharPopup}
                >
                  {popup.onConfirmar ? popup.confirmarTexto : "Ok"}
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </main>
  );
};

export default DashboardMestre;




