import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@mdi/react";
import {
  mdiAccountPlus,
  mdiArrowLeft,
  mdiCashPlus,
  mdiDeleteOutline,
  mdiTrendingUp,
  mdiOpenInNew,
  mdiPackageVariantClosedPlus,
  mdiRefresh,
  mdiStoreCogOutline,
  mdiPencil,
  mdiContentCopy,
  mdiPistol,
  mdiSword,
  mdiKnifeMilitary,
  mdiAxe,
  mdiBowArrow,
  mdiHammer,
  mdiBaseballBat,
  mdiTargetVariant,
} from "@mdi/js";
import "../CSS/DashboardMestre.css";
import {
  apagarPersonagem,
  buscarArvoresHabilidades,
  buscarCatalogoLoja,
  criarPersonagem,
  listarPersonagens,
  salvarArvoresHabilidades,
  salvarCatalogoLoja,
  buscarPersonagem,
  salvarPersonagem,
} from "../services/personagemApi";
import { compressProfileImage } from "../services/imageCompression";
import { obterIconeItem } from "../utils/itemIcons";
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
import { receitasCriacao as RECEITAS_PADRAO } from "../components/data/receitasCriacao";
import CampanhaDashboard from "../components/CampanhaDashboard";
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

const STORAGE_KEY = "fichaRPG_personagem";
const CATALOGO_STORAGE_KEY = "lojaHelena_catalogo";
const RECEITAS_STORAGE_KEY = "darkness_receitas_criacao";

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
  if (area.includes("braco") || area.includes("mao") || area.includes("empunh")) {
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
        resultado = resultado.replace(/([+-]\d+)/, `${parseInt(bonus[1], 10) + 1}`);
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
    status.precision = incrementarTexto(status.precision, precisaoExtra, "Percepção");
  }

  const controleExtra = nivel("controle");
  if (controleExtra > 0) {
    status.control = incrementarTexto(status.control, controleExtra, "Persistência");
  }

  const velocidadeExtra = nivel("velocidade");
  if (velocidadeExtra > 0) {
    const mobilidade = String(status.mobility || "").trim();
    const alvoAtual = parseInt(mobilidade.match(/(\d+)\s*alvos?/i)?.[1], 10) || 1;
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
      quantidade = Math.max(1, Math.min(12, quantidade + Number(dadosExtras[1]) * direcao));
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

const abasFicha = [
  { id: "perfil", nome: "Perfil" },
  { id: "ativos", nome: "Ativos" },
  { id: "passivos", nome: "Passivos" },
  { id: "ritos", nome: "Ritos" },
  { id: "inventario", nome: "Inventario" },
  { id: "corpo", nome: "Corpo" },
  { id: "descricao", nome: "Descricao" },
];

const ativosFicha = [
  { chave: "razao", nome: "Razao" },
  { chave: "firmeza", nome: "Firmeza" },
  { chave: "intuicao", nome: "Intuicao" },
  { chave: "violencia", nome: "Violencia" },
  { chave: "percepcao", nome: "Percepcao" },
  { chave: "carisma", nome: "Carisma" },
  { chave: "persistencia", nome: "Persistencia" },
  { chave: "resistencia", nome: "Resistencia" },
];

const passivosFicha = [
  { chave: "enganacao", nome: "Enganacao" },
  { chave: "raciocinioLogico", nome: "Raciocinio Logico" },
  { chave: "investigacao", nome: "Investigacao" },
  { chave: "instinto", nome: "Instinto" },
  { chave: "sensibilidade", nome: "Sensibilidade" },
  { chave: "instintoSobrevivencia", nome: "Instinto de Sobrevivencia" },
  { chave: "coragem", nome: "Coragem" },
  { chave: "diplomacia", nome: "Diplomacia" },
  { chave: "disciplina", nome: "Disciplina" },
  { chave: "autocontrole", nome: "Autocontrole" },
  { chave: "intimidacaoPassiva", nome: "Intimidacao Passiva" },
  { chave: "presenca", nome: "Presenca" },
  { chave: "memoria", nome: "Memoria" },
  { chave: "empatia", nome: "Empatia" },
  { chave: "lealdade", nome: "Lealdade" },
  { chave: "fe", nome: "Fe" },
  { chave: "vitalidade", nome: "Vitalidade" },
  { chave: "folego", nome: "Folego" },
  { chave: "equilibrio", nome: "Equilibrio" },
  { chave: "velocidade", nome: "Velocidade" },
  { chave: "precisao", nome: "Precisao" },
  { chave: "lutar", nome: "Lutar" },
  { chave: "resistenciaFisica", nome: "Resistencia Fisica" },
  { chave: "primeirosSocorros", nome: "Primeiros Socorros" },
  { chave: "furtividade", nome: "Furtividade" },
  { chave: "conhecimentoMedico", nome: "Conhecimento Medico" },
  { chave: "conhecimentoTecnico", nome: "Conhecimento Tecnico" },
  { chave: "conhecimentoHistorico", nome: "Conhecimento Historico" },
  { chave: "conhecimentoOculto", nome: "Conhecimento Oculto" },
  { chave: "tecnologia", nome: "Tecnologia" },
  { chave: "tatica", nome: "Tatica" },
  { chave: "percepcaoAuditiva", nome: "Percepcao Auditiva" },
  { chave: "percepcaoVisual", nome: "Percepcao Visual" },
  { chave: "percepcaoOlfativa", nome: "Percepcao Olfativa" },
  { chave: "crime", nome: "Crime" },
  { chave: "manipulacao", nome: "Manipulacao" },
  { chave: "intimidacao", nome: "Intimidacao" },
  { chave: "seducao", nome: "Seducao" },
  { chave: "resistenciaMental", nome: "Resistencia Mental" },
];

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
    .replace(/[ --]/g, "")
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

const DashboardFichaCard = memo(({ ficha, tipo = "jogador", onAbrir }) => {
  const personagemCard = ficha.personagem || ficha;
  const membros = personagemCard.membros || {};
  const imagem =
    personagemCard.fotoPerfil || "https://placehold.co/600x800?text=Sem+Foto";

  return (
    <article
      className="mestre-card-personagem"
      onClick={() => onAbrir(ficha, tipo)}
      style={{ backgroundImage: `url(${imagem})` }}
    >
      <div className="mestre-card-overlay" />

      <div className="mestre-card-conteudo">
        <div className="mestre-card-info">
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

              return (
                <div key={chave} className="mestre-card-membro-mini">
                  <span>{nome}</span>

                  <div className="barra vermelho">
                    <span
                      style={{
                        width: porcentagemRecurso(dados.atual, dados.max),
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
                  width: porcentagemRecurso(
                    personagemCard.sanidade?.atual,
                    personagemCard.sanidade?.max,
                  ),
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
              <label>ESPERANCA</label>
              <div className="barra dourado">
                <span
                  style={{
                    width: porcentagemRecurso(
                      personagemCard.esperanca?.atual,
                      personagemCard.esperanca?.max,
                    ),
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
});

const normalizarFichaId = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

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
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState("");
  const [personagem, setPersonagem] = useState(null);
  const [novaFicha, setNovaFicha] = useState(fichaVazia);
  const [itemInventario, setItemInventario] = useState(itemInventarioVazio);
  const [novoRito, setNovoRito] = useState(ritoVazio);
  const [creditosDelta, setCreditosDelta] = useState(100);
  const [ritosCreditosDelta, setRitosCreditosDelta] = useState(100);
  const [catalogo, setCatalogo] = useState(DEFAULT_CATALOGO_LOJA);
  const [itemLojaSelecionadoId, setItemLojaSelecionadoId] = useState("");
  const [menuHamburguerAberto, setMenuHamburguerAberto] = useState(false);
  const [receitasCriacaoDashboard, setReceitasCriacaoDashboard] =
    useState(RECEITAS_PADRAO);
  const [receitaEditor, setReceitaEditor] = useState({
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

  const [cardExpandidoId, setCardExpandidoId] = useState(null);
  const [receitaEditandoId, setReceitaEditandoId] = useState(null);
  const [novoItemLoja, setNovoItemLoja] = useState(itemLojaVazio);
  const [categoriaLojaAtiva, setCategoriaLojaAtiva] = useState("armas-fogo");
  const [abaFicha, setAbaFicha] = useState("perfil");
  const [aba, setAba] = useState("fichas");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [abaLojaEditor, setAbaLojaEditor] = useState("armas-fogo");
  const [itemEditandoId, setItemEditandoId] = useState(null);
  const [itemEditandoDados, setItemEditandoDados] = useState(null);
  const [mostrarFormNovoItem, setMostrarFormNovoItem] = useState(false);
  const [nivelRitoDashboard, setNivelRitoDashboard] = useState("iniciante");
  const [tipoMunicaoEditor, setTipoMunicaoEditor] = useState("pistola");
  const [editandoDashboard, setEditandoDashboard] = useState(false);
  const [modalFichaAberto, setModalFichaAberto] = useState(false);
  const [salvandoNivel, setSalvandoNivel] = useState(false);
  const fichasEmGravacaoRef = useRef(new Set());

  const [arvoresEditor, setArvoresEditor] = useState({});
  const [classeArvoreAtiva, setClasseArvoreAtiva] = useState("aniquilador");
  const [tipoHabilidadeEditor, setTipoHabilidadeEditor] = useState("absolutas");
  const [especialidadeEditorId, setEspecialidadeEditorId] = useState("");
  const [habilidadeEditando, setHabilidadeEditando] = useState(null);
  const [habilidadeEditandoCardId, setHabilidadeEditandoCardId] = useState(null);
  const [habilidadeEditandoDados, setHabilidadeEditandoDados] = useState(null);
  const [mostrarFormHabilidade, setMostrarFormHabilidade] = useState(false);

  const [personagemSelecionado, setPersonagemSelecionado] = useState(null); // objeto completo do personagem
  const [marcas, setMarcas] = useState([]);
  const [marcaEditando, setMarcaEditando] = useState(null);
  const [formMarca, setFormMarca] = useState({
    nome: "",
    descricao: "",
    beneficios: "",
    penalidades: "",
    habilidades: [],
  });
  const [personagemSelecionadoId, setPersonagemSelecionadoId] = useState("");
  const [marcaSelecionadaId, setMarcaSelecionadaId] = useState("");

  const STORAGE_INIMIGOS = "darkness_inimigos";

  const [inimigos, setInimigos] = useState([]);
  const [inimigoEditando, setInimigoEditando] = useState(null);

  const STORAGE_NPCS = "darkness_npcs";

  const [subAbaFichas, setSubAbaFichas] = useState("jogadores");
  const [npcs, setNpcs] = useState([]);
  const [npcEditando, setNpcEditando] = useState(null);

  const [rolagensMestre, setRolagensMestre] = useState([]);
  const [painelRolagensAberto, setPainelRolagensAberto] = useState(true);
  const [evolucaoDelta, setEvolucaoDelta] = useState(1);

  const [popup, setPopup] = useState(null);

  const habilidadesPendentes = useMemo(
    () =>
      fichas.flatMap((ficha) =>
        (ficha.personagem?.habilidadesCriadas || [])
          .filter(
            (habilidade) => (habilidade.status || "pendente") === "pendente",
          )
          .map((habilidade) => ({ ficha, habilidade })),
      ),
    [fichas],
  );

  const analisarHabilidadeCriada = async (ficha, habilidadeId, aprovar) => {
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
    const base = [...CATEGORIAS_LOJA];
    if (!base.some((cat) => cat.id === "armas-exclusivas")) {
      base.push({ id: "armas-exclusivas", nome: "Armas Exclusivas" });
    }
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
    return ordem.map((id) => ({ id, nome: mapa[id] }));
  }, []);

  const categoriasReceitas = useMemo(
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

  const receitasFiltradas = useMemo(
    () => receitasPorCategoria[receitaEditor.categoria] || [],
    [receitasPorCategoria, receitaEditor.categoria],
  );

  const catalogoFiltrado = useMemo(() => {
    if (categoriaLojaAtiva === "todos") {
      return catalogo;
    }

    return catalogo.filter((item) => item.categoria === categoriaLojaAtiva);
  }, [catalogo, categoriaLojaAtiva]);

  const persistirReceitasCriacao = (receitas) => {
    try {
      localStorage.setItem(RECEITAS_STORAGE_KEY, JSON.stringify(receitas));
    } catch {
      // ignore localStorage errors
    }
  };

  const STORAGE_MARCAS = "darkness_marcas";

  const carregarMarcas = () => {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_MARCAS)) || [];
      setMarcas(dados);
    } catch {
      setMarcas([]);
    }
  };

  const salvarMarcas = (novaLista) => {
    setMarcas(novaLista);
    localStorage.setItem(STORAGE_MARCAS, JSON.stringify(novaLista));
  };

  const limparReceitaEditor = () => {
    setReceitaEditor({
      id: "",
      categoria: categoriasReceitas[0] || "Armas Aprimoráveis",
      nome: "",
      icone: "",
      tipo: "",
      durabilidade: "",
      dano: "",
      efeito: "",
      ingredientesTexto: "",
    });
    setReceitaEditandoId(null);
  };

  const editarReceitaEditor = (receita) => {
    // receita já tem categoria e id
    setReceitaEditandoId(receita.id);
    const ingredientesTexto = (receita.ingredientes || [])
      .map((ingrediente) => {
        if (typeof ingrediente === "string") return ingrediente;
        return `${ingrediente.icone || ""} ${ingrediente.nome || ""}`.trim();
      })
      .filter(Boolean)
      .join(", ");

    setReceitaEditor({
      id: receita.id,
      categoria: receita.categoria || "Munições Fabricadas",
      nome: receita.nome || "",
      icone: receita.icone || "",
      tipo: receita.tipo || "",
      durabilidade: receita.durabilidade || "",
      dano: receita.dano || "",
      efeito: receita.efeito || "",
      ingredientesTexto,
    });
  };

  const excluirReceitaEditor = (id, categoria) => {
    const receitasAtualizadas = receitasCriacaoDashboard.map((grupo) => {
      if (grupo.categoria !== categoria) return grupo;
      return {
        ...grupo,
        itens: grupo.itens.filter((item) => item.id !== id),
      };
    });

    setReceitasCriacaoDashboard(receitasAtualizadas);
    persistirReceitasCriacao(receitasAtualizadas);
    setMensagem("Receita removida.");

    if (receitaEditandoId === id) {
      limparReceitaEditor();
    }
  };

  const salvarReceitaEditor = (event) => {
    event.preventDefault();

    if (!receitaEditor.nome.trim()) {
      setMensagem("Informe um nome para a receita.");
      return;
    }

    const categoria = receitaEditor.categoria || "Munições Fabricadas";
    const idFinal =
      receitaEditandoId || gerarIdReceita(receitaEditor.nome.trim(), categoria);

    // 🔥 EXTRAI SOMENTE DO CAMPO ingredientesTexto
    const ingredientes = receitaEditor.ingredientesTexto
      .split(",")
      .map((ingrediente) => ingrediente.trim())
      .filter(Boolean)
      .map((ingrediente) => {
        const match = ingrediente.match(/^(.+?)\s*[-:]\s*(.+)$/);
        if (match) {
          return { icone: match[1].trim(), nome: match[2].trim() };
        }
        return { nome: ingrediente, icone: "" };
      });

    const novaReceita = {
      id: idFinal,
      nome: receitaEditor.nome.trim(),
      icone: receitaEditor.icone.trim(),
      tipo: receitaEditor.tipo.trim(),
      durabilidade: receitaEditor.durabilidade.trim(),
      dano: receitaEditor.dano.trim(), // ✅ ISOLADO, NÃO INTERFERE
      efeito: receitaEditor.efeito.trim(),
      ingredientes, // agora sempre array, nunca string
      categoria,
    };

    // Atualiza o array de receitas
    let receitasAtualizadas = [...receitasCriacaoDashboard];
    const categoriaIndex = receitasAtualizadas.findIndex(
      (g) => g.categoria === categoria,
    );

    if (categoriaIndex === -1) {
      // cria nova categoria
      receitasAtualizadas.push({ categoria, itens: [novaReceita] });
    } else {
      const grupo = receitasAtualizadas[categoriaIndex];
      if (receitaEditandoId) {
        // edita item existente
        const itemIndex = grupo.itens.findIndex(
          (item) => item.id === receitaEditandoId,
        );
        if (itemIndex !== -1) {
          grupo.itens[itemIndex] = novaReceita;
        } else {
          // fallback: se não encontrar, adiciona (não deve ocorrer)
          grupo.itens.push(novaReceita);
        }
      } else {
        // adiciona novo
        grupo.itens.push(novaReceita);
      }
      receitasAtualizadas[categoriaIndex] = grupo;
    }

    setReceitasCriacaoDashboard(receitasAtualizadas);
    persistirReceitasCriacao(receitasAtualizadas);
    setMensagem(receitaEditandoId ? "Receita atualizada." : "Receita criada.");
    limparReceitaEditor();
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
    setCarregando(true);
    setMensagem("");

    try {
      const [fichasApi, catalogoApi, arvoresApi] = await Promise.all([
        listarPersonagens(),
        buscarCatalogoLoja(),
        buscarArvoresHabilidades(),
      ]);

      const novo = {
        ...estadoInicial,
        id: crypto.randomUUID(),
        nome: "Novo Inimigo",
        classe: "Inimigo",
        nivel: 1,
        defesa: 10,
        ataques: [],
        habilidades: [],
      };

      const fichasNormalizadas = fichasApi.map((ficha) => ({
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
      const catalogoNormalizado = aplicarDefesasAtualizadas(catalogoBase).map(
        normalizarItemLoja,
      );

      const arvoresLocais = carregarArvoresCustom();
      const arvoresCompartilhadas =
        Object.keys(arvoresApi || {}).length > 0 ? arvoresApi : arvoresLocais;

      setFichas(fichasNormalizadas);
      setCatalogo(catalogoNormalizado);
      setReceitasCriacaoDashboard(receitasCriacaoLocais);
      salvarArvoresCustom(arvoresCompartilhadas);
      setArvoresEditor(obterTodasArvores());

      if (
        Object.keys(arvoresApi || {}).length === 0 &&
        Object.keys(arvoresLocais).length > 0
      ) {
        salvarArvoresHabilidades(arvoresLocais).catch((error) => {
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

      if (fichasNormalizadas.length > 0 && !fichaSelecionada) {
        setFichaSelecionada(fichasNormalizadas[0].fichaId);
        setPersonagem(fichasNormalizadas[0].personagem);
      }
    } catch (error) {
      const fichasLocais = listarFichasLocais();
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

      setMensagem(
        `Backend indisponivel: ${error?.message || "erro desconhecido"}. Mostrando dados locais deste navegador.`,
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
    if (!fichaSelecionada) return;

    const sincronizarFichaSelecionada = async ({
      fichaId: fichaAtualizada,
    } = {}) => {
      if (fichaAtualizada && fichaAtualizada !== fichaSelecionada) return;
      if (editandoDashboard) return;
      if (fichasEmGravacaoRef.current.has(fichaSelecionada)) return;

      try {
        const personagemAtualizado = await buscarPersonagem(fichaSelecionada);

        if (!personagemAtualizado) return;

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

      try {
        const [fichasApi, arvoresApi] = await Promise.all([
          listarPersonagens(),
          buscarArvoresHabilidades().catch(() => null),
        ]);

        if (cancelado) return;

        setFichas(
          fichasApi.map((ficha) => ({
            ...ficha,
            personagem: {
              ...estadoInicial,
              ...(ficha.personagem || {}),
              lojaCreditos: ficha.personagem?.lojaCreditos ?? 900,
            },
          })),
        );

        if (arvoresApi && Object.keys(arvoresApi).length > 0) {
          salvarArvoresCustom(arvoresApi);
          setArvoresEditor(obterTodasArvores());
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar o dashboard.", error);
      }
    };

    const sincronizarArvores = async ({ arvores } = {}) => {
      if (arvores && Object.keys(arvores).length > 0) {
        salvarArvoresCustom(arvores);
        setArvoresEditor(obterTodasArvores());
        return;
      }

      try {
        const arvoresApi = await buscarArvoresHabilidades();
        if (!cancelado && arvoresApi && Object.keys(arvoresApi).length > 0) {
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
    if (fichaAtual) {
      setPersonagem({
        ...estadoInicial,
        ...fichaAtual.personagem,
        lojaCreditos: fichaAtual.personagem?.lojaCreditos ?? 900,
      });
    }
  }, [fichaAtual]);

  const atualizarPersonagem = (campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const atualizarGrupoFicha = (grupo, chave, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      [grupo]: {
        ...(atual?.[grupo] || {}),
        [chave]: parseInt(valor, 10) || 0,
      },
    }));
  };

  const atualizarMembro = (membro, campo, valor) => {
    setPersonagem((atual) => {
      const membroAtual = atual?.membros?.[membro] || {
        atual: 0,
        max: 0,
        ferido: false,
        grave: false,
      };
      const atualizado = {
        ...membroAtual,
        [campo]: Math.max(0, parseInt(valor, 10) || 0),
      };
      const proporcao =
        atualizado.max > 0 ? atualizado.atual / atualizado.max : 0;

      return {
        ...atual,
        membros: {
          ...(atual?.membros || {}),
          [membro]: {
            ...atualizado,
            ferido: atualizado.atual < atualizado.max && proporcao < 0.5,
            grave: proporcao <= 0.1,
          },
        },
      };
    });
  };
  const criarMarca = (e) => {
    e.preventDefault();
    if (!formMarca.nome.trim()) {
      setMensagem("Informe o nome da marca.");
      return;
    }
    const nova = {
      id: crypto.randomUUID(),
      ...formMarca,
      habilidades: formMarca.habilidades || [],
      atribuidaA: [],
      createdAt: Date.now(),
    };
    salvarMarcas([...marcas, nova]);
    limparFormMarca();
    setMensagem(`Marca "${nova.nome}" criada.`);
  };

  const adicionarHabilidadeMarca = () => {
    if (formMarca.habilidades.length >= 3) {
      setMensagem("Limite de 3 habilidades por marca.");
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
    });
  };

  const salvarEdicaoMarca = (e) => {
    e.preventDefault();
    const atualizada = {
      ...formMarca,
      id: marcaEditando,
      atribuidaA: marcas.find((m) => m.id === marcaEditando)?.atribuidaA || [],
    };
    const novaLista = marcas.map((m) =>
      m.id === marcaEditando ? atualizada : m,
    );
    salvarMarcas(novaLista);
    limparFormMarca();
    setMensagem("Marca atualizada.");
  };

  const excluirMarca = (id) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir Marca",
      mensagem: "Deseja remover esta marca permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: () => {
        salvarMarcas(marcas.filter((m) => m.id !== id));
        if (marcaEditando === id) limparFormMarca();
        setMensagem("Marca removida.");
      },
    });
  };

  const limparFormMarca = () => {
    setFormMarca({
      nome: "",
      descricao: "",
      beneficios: "",
      penalidades: "",
      habilidades: [],
    });
    setMarcaEditando(null);
  };

  const atribuirMarca = async () => {
    if (!personagemSelecionadoId || !marcaSelecionadaId) {
      setMensagem("Selecione um personagem e uma marca.");
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
      setMensagem("Marca não encontrada.");
      return;
    }

    if ((personagem.personagem.marcas || []).some((m) => m.id === marca.id)) {
      setMensagem(`${personagem.personagem.nome} já possui esta marca.`);
      return;
    }

    const marcaParaAdicionar = {
      ...marca,
      tipo: "marca",
      aceita: false,
    };

    const personagemAtualizado = {
      ...personagem.personagem,
      marcas: [...(personagem.personagem.marcas || []), marcaParaAdicionar],
    };

    const marcaAtualizada = {
      ...marca,
      atribuidaA: [
        ...(marca.atribuidaA || []),
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
    salvarMarcas(novaListaMarcas);

    // Chama salvarFichaSelecionada passando o ID do personagem alvo
    await salvarFichaSelecionada(
      personagemAtualizado,
      `Marca "${marca.nome}" atribuída a ${personagem.personagem.nome}.`,
      personagemSelecionadoId,
    );

    // Resetar seleção
    setPersonagemSelecionadoId("");
    setPersonagemSelecionado(null);
    setMarcaSelecionadaId("");
  };

  const handlePersonagemChange = (fichaId) => {
    setPersonagemSelecionadoId(fichaId);
    const ficha = fichas.find((f) => f.fichaId === fichaId);
    setPersonagemSelecionado(ficha?.personagem || null);
  };

  const atualizarItemInventario = (index, campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      inventario: (atual.inventario || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [campo]: valor } : item,
      ),
    }));
  };

  const atualizarRito = (index, campo, valor) => {
    setPersonagem((atual) => ({
      ...atual,
      rituais: (atual.rituais || []).map((rito, ritoIndex) =>
        ritoIndex === index ? { ...rito, [campo]: valor } : rito,
      ),
    }));
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

  const salvarArvoresEditor = (novasArvores) => {
    setArvoresEditor(novasArvores);
    salvarArvoresCustom(novasArvores);
    notificarArvoresAtualizadas(novasArvores);
    salvarArvoresHabilidades(novasArvores)
      .then((arvoresSalvas) => {
        notificarArvoresAtualizadas(arvoresSalvas || novasArvores);
      })
      .catch((error) => {
        console.warn("Backend indisponivel. Arvore salva localmente.", error);
        setMensagem("Arvore salva localmente. Backend indisponivel.");
      });
    setMensagem("Árvore de habilidades salva.");
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

  const salvarHabilidadeEditor = (event) => {
    event.preventDefault();

    if (!formHabilidade.nome.trim()) {
      setMensagem("Informe o nome da habilidade.");
      return;
    }

    const arvoreAtual = arvoresEditor[classeArvoreAtiva];

    if (!arvoreAtual) return;

    const novaHabilidade = {
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

    salvarArvoresEditor(novasArvores);
    limparFormHabilidade();
    setMostrarFormHabilidade(false);
  };

  const editarHabilidadeEditor = (habilidade) => {
    setHabilidadeEditando(habilidade.id);
    setFormHabilidade({
      id: habilidade.id,
      nome: habilidade.nome || "",
      custo: habilidade.custo || "",
      descricao: habilidade.descricao || "",
    });
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

  const salvarEdicaoHabilidadeCard = () => {
    if (!habilidadeEditandoDados?.nome.trim()) {
      setMensagem("Informe o nome da habilidade.");
      return;
    }

    const arvoreAtual = arvoresEditor[classeArvoreAtiva];
    if (!arvoreAtual) return;

    const habilidadeAtualizada = {
      ...habilidadeEditandoDados,
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

    salvarArvoresEditor(novasArvores);
    cancelarEdicaoHabilidadeCard();
  };

  const excluirHabilidadeEditor = (habilidadeId) => {
    abrirPopup({
      tipo: "perigo",
      titulo: "Excluir habilidade",
      mensagem: "Deseja excluir esta habilidade permanentemente?",
      confirmarTexto: "Excluir",
      onConfirmar: () => {
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

        salvarArvoresEditor(novasArvores);
        abrirPopup({
          titulo: "Habilidade excluída",
          mensagem: "A habilidade foi removida com sucesso.",
        });
      },
    });

    return;

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

    salvarArvoresEditor(novasArvores);
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
  ) => {
    const idParaSalvar = fichaIdOverride || fichaSelecionada;
    if (!idParaSalvar || !personagemAtualizado) return;

    fichasEmGravacaoRef.current.add(idParaSalvar);

    try {
      let fichaMaisRecente = {};

      try {
        const doBackend = await buscarPersonagem(idParaSalvar);
        if (doBackend) fichaMaisRecente = doBackend;
      } catch {
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

      const personagemSalvo = await salvarPersonagem(
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
    } catch {
      setMensagem(
        mensagemCustom ||
          "Ficha salva localmente sem foto. Backend indisponivel.",
      );
      return personagemAtualizado;
    } finally {
      fichasEmGravacaoRef.current.delete(idParaSalvar);
    }
  };

  const criarNovaFicha = async (event) => {
    event.preventDefault();

    if (!novaFicha.nome.trim()) {
      setMensagem("Informe um nome para criar a ficha.");
      return;
    }

    const personagemCriado = {
      ...estadoInicial,
      ...novaFicha,
      nome: novaFicha.nome.trim(),
      classe: novaFicha.classe.trim(),
      especialidade: novaFicha.especialidade.trim(),
      lojaCreditos: 0,
      rituais: [],
      inventario: [],
    };

    try {
      const { fichaId, personagem: salvo } =
        await criarPersonagem(personagemCriado);
      salvarFichaLocal(fichaId, salvo);
      await carregarTudo();
      setFichaSelecionada(fichaId);
      setPersonagem(salvo);
      setNovaFicha(fichaVazia);
      setMensagem(`Ficha ${fichaId} criada.`);
    } catch (error) {
      const fichaId = normalizarFichaId(novaFicha.nome);
      salvarFichaLocal(fichaId, personagemCriado);
      setFichas((atuais) => [
        ...atuais,
        { fichaId, personagem: personagemCriado },
      ]);
      setFichaSelecionada(fichaId);
      setPersonagem(personagemCriado);
      setNovaFicha(fichaVazia);
      setMensagem("Ficha criada localmente. Backend indisponivel.");
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
        return ehDefesa && membrosAlvo.some((membro) => membrosProtegidos.includes(membro));
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
      ? [...new Set([...resistenciasAtuais, itemCatalogo.resistencia])].join(" | ")
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
                    (Number(personagem.bonusDefesa) || 0) +
                    bonusDefesaEntregue,
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
    const pontosGanhos = obterCustosNivel(proximoNivel).acumulado;
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
    const pontosRemovidos = obterCustosNivel(nivelAtual).acumulado;
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

  const adicionarItemInventario = (event) => {
    event.preventDefault();

    if (!itemInventario.nome.trim()) {
      setMensagem("Informe o nome do item.");
      return;
    }

    const atualizado = {
      ...personagem,
      inventario: [
        ...(personagem.inventario || []),
        {
          nome: itemInventario.nome.trim(),
          detalhes: itemInventario.detalhes.trim(),
        },
      ],
    };

    setPersonagem(atualizado);
    setItemInventario(itemInventarioVazio);
    salvarFichaSelecionada(atualizado);
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

  const adicionarRito = (event) => {
    event.preventDefault();

    if (!novoRito.nome.trim()) {
      setMensagem("Informe o nome do Rito.");
      return;
    }

    const atualizado = {
      ...personagem,
      rituais: [
        ...(personagem.rituais || []),
        {
          nome: novoRito.nome.trim(),
          custo: novoRito.custo.trim(),
        },
      ],
    };

    setPersonagem(atualizado);
    setNovoRito(ritoVazio);
    salvarFichaSelecionada(atualizado);
  };

  const removerRito = (index) => {
    const atualizado = {
      ...personagem,
      rituais: (personagem.rituais || []).filter(
        (_, ritoIndex) => ritoIndex !== index,
      ),
    };

    setPersonagem(atualizado);
    salvarFichaSelecionada(atualizado);
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
          personagemAtual = (await buscarPersonagem(ficha.fichaId)) || personagemAtual;
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

    setFichas(resultados.map(({ ficha, personagem }) => ({ ...ficha, personagem })));

    const fichaAtualizada = resultados.find(
      ({ ficha, alterada }) => alterada && ficha.fichaId === fichaSelecionada,
    );
    if (fichaAtualizada) setPersonagem(fichaAtualizada.personagem);

    return resultados.filter(({ alterada }) => alterada).length;
  };

  const adicionarItemLoja = (event) => {
    event.preventDefault();

    if (!novoItemLoja.nome.trim()) {
      setMensagem("Informe o nome do item da loja.");
      return;
    }

    salvarCatalogo([
      ...catalogo,
      normalizarItemLoja(novoItemLoja, catalogo.length),
    ]);
    setNovoItemLoja(itemLojaVazio);
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
      tipoArma:
        abaLojaEditor === "municoes-especiais" ? tipoMunicaoEditor : "",
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
        const modificacoesArma = atuais.filter((item) => item.id !== modificacao.id);
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

  const editarItemLoja = (item) => {
    console.log("🛠 Editando item:", item);

    setItemEditandoId(item.id);
    setAbaLojaEditor(item.categoria);

    if (item.categoria === "ritos") {
      setNivelRitoDashboard(item.nivelRito || "iniciante");
    }

    const armaStatus = item.armaStatus || itemLojaVazio.armaStatus;

    setNovoItemLoja({
      ...itemLojaVazio,
      ...item,
      id: item.id, // 🔥 GARANTA QUE O ID SEJA PRESERVADO
      armaStatus: {
        ...itemLojaVazio.armaStatus,
        ...armaStatus,
      },
      preco: item.preco ?? 0,
      dano: item.dano ?? "",
      bonusDano: item.bonusDano ?? "",
      detalhe: item.detalhe ?? "",
      entrega: item.entrega ?? "",
      nivelRito: item.nivelRito ?? "iniciante",
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
        abaLojaEditor === "defesas"
          ? novoItemLoja.resistenciasDano || []
          : [],
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
          <div className="mestre-card-info">
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

  const deveMostrarPartyLateral = !["loja", "habilidades"].includes(aba);
  return (
    <main className="mestre-page">
      <header className="mestre-header">
        <button
          className="mestre-voltar"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <Icon path={mdiArrowLeft} size={0.9} />
          Inicio
        </button>
        <div>
          <span>Controle do narrador</span>
          <h1>Dashboard do Mestre</h1>
        </div>
        <button
          className="mestre-hamburguer"
          onClick={() => setMenuHamburguerAberto(!menuHamburguerAberto)}
          aria-label="Menu rápido"
        >
          <span className="hamburguer-linha"></span>
          <span className="hamburguer-linha"></span>
          <span className="hamburguer-linha"></span>
        </button>
      </header>

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

      <nav className="mestre-tabs" aria-label="Areas do dashboard">
        <button
          className={aba === "campanha" ? "ativa" : ""}
          onClick={() => setAba("campanha")}
        >
          Campanha
        </button>
        <button
          className={aba === "fichas" ? "ativa" : ""}
          onClick={() => setAba("fichas")}
        >
          Fichas
        </button>
        <button
          className={aba === "inimigos" ? "ativa" : ""}
          onClick={() => setAba("inimigos")}
        >
          Inimigos
        </button>
        <button
          className={aba === "loja" ? "ativa" : ""}
          onClick={() => setAba("loja")}
        >
          Loja
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
          Análises{" "}
          {habilidadesPendentes.length
            ? `(${habilidadesPendentes.length})`
            : ""}
        </button>
        <button
          className={aba === "marcas" ? "ativa" : ""}
          onClick={() => setAba("marcas")}
        >
          Marcas
        </button>
      </nav>

      {false && <section className="mestre-dashboard-full"></section>}
      <div className="mestre-layout-com-rolagens">
        <div className="mestre-conteudo-principal">
          {aba === "campanha" && <CampanhaDashboard />}
          {aba === "fichas" && (
            <section className="mestre-dashboard-full">
              <div className="mestre-subtabs">
                <button
                  type="button"
                  className={subAbaFichas === "jogadores" ? "ativa" : ""}
                  onClick={() => setSubAbaFichas("jogadores")}
                >
                  Jogadores
                </button>

                <button
                  type="button"
                  className={subAbaFichas === "npcs" ? "ativa" : ""}
                  onClick={() => setSubAbaFichas("npcs")}
                >
                  NPCs
                </button>

                {subAbaFichas === "npcs" && (
                  <button type="button" onClick={criarNovoNpc}>
                    Criar NPC
                  </button>
                )}
              </div>

              {subAbaFichas === "jogadores" && (
                <div className="mestre-dashboard-cards">
                  {fichas.length > 0 ? (
                    fichas.map((ficha) => (
                      <DashboardFichaCard
                        key={ficha.fichaId || ficha.id}
                        ficha={ficha}
                        tipo="jogador"
                        onAbrir={abrirCardFicha}
                      />
                    ))
                  ) : (
                    <div className="mestre-vazio">
                      Nenhuma ficha encontrada.
                    </div>
                  )}
                </div>
              )}

              {subAbaFichas === "npcs" && (
                <div className="mestre-dashboard-cards">
                  {npcs.length > 0 ? (
                    npcs.map((npc) => (
                      <DashboardFichaCard
                        key={npc.fichaId || npc.id}
                        ficha={npc}
                        tipo="npc"
                        onAbrir={abrirCardFicha}
                      />
                    ))
                  ) : (
                    <div className="mestre-vazio">Nenhum NPC criado.</div>
                  )}
                </div>
              )}

              {modalFichaAberto && personagem && (
                <div
                  className="mestre-modal-overlay"
                  onClick={() => setModalFichaAberto(false)}
                >
                  <section
                    className="mestre-modal-ficha minimalista"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                          <span>PERSONAGEM</span>
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
                              <label>💳 Créditos</label>
                              <div className="mestre-admin-controles">
                                <input
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
                              <label>🔮 Mementos</label>
                              <div className="mestre-admin-controles">
                                <input
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
                              <label>⭐ PE (Evolução)</label>
                              <div className="mestre-admin-controles">
                                <input
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
                              <label>📈 Nível</label>
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
                      <div className="mestre-modal-linha-topo">
                        <span>Atributos</span>

                        <button
                          className="mestre-abrir-ficha"
                          onClick={() => {
                            window.open(
                              `/?ficha=${encodeURIComponent(fichaSelecionada)}`,
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
                          {membrosFicha.map((membro) => {
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

                    {/* PASSIVAS */}
                    <section className="mestre-modal-bloco full">
                      <span>Passivas</span>

                      <div className="mestre-passivas-grid">
                        {Object.entries(
                          personagem.habilidadesPassivas || {},
                        ).map(([nome, valor]) => (
                          <div key={nome} className="mestre-passiva-item">
                            <small>{nome}</small>
                            <strong>{valor}</strong>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="mestre-modal-bloco full">
                      <div className="mestre-entrega-cabecalho">
                        <div>
                          <span>Entrega do catálogo</span>
                          <h3>Entregar item ao jogador</h3>
                          <p>Escolha uma categoria, selecione o item e confirme a entrega.</p>
                        </div>
                        <strong>{catalogoFiltrado.length} disponível(is)</strong>
                      </div>

                      <div className="mestre-entrega-filtro">
                        {categoriasFiltroLoja.map((categoria) => (
                          <button
                            key={categoria.id}
                            type="button"
                            className={
                              categoriaLojaAtiva === categoria.id ? "ativa" : ""
                            }
                            onClick={() => setCategoriaLojaAtiva(categoria.id)}
                          >
                            {categoria.nome}
                          </button>
                        ))}
                      </div>

                      <div className="mestre-entrega-cards">
                        {catalogoFiltrado.length === 0 ? (
                          <div className="mestre-vazio">
                            Selecione a aba de categoria para ver os itens
                            disponíveis.
                          </div>
                        ) : (
                          catalogoFiltrado.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={`mestre-entrega-card ${
                                itemLojaSelecionadoId === item.id
                                  ? "selecionado"
                                  : ""
                              }`}
                              onClick={() => setItemLojaSelecionadoId(item.id)}
                            >
                              <div className="mestre-entrega-card-topo">
                                <span className="mestre-entrega-card-categoria">
                                  {categoriasFiltroLoja.find(
                                    (categoria) => categoria.id === item.categoria,
                                  )?.nome || item.categoria}
                                </span>
                                <span className="mestre-entrega-card-preco">
                                  {item.preco} cr
                                </span>
                              </div>
                              <strong>{item.nome}</strong>
                              <small>{item.detalhe || item.entrega || "Sem descrição."}</small>
                              <div className="mestre-entrega-card-dados">
                                {item.armaStatus?.dmg && <span>DMG {item.armaStatus.dmg}</span>}
                                {item.defesaBonus > 0 && <span>DEF +{item.defesaBonus}</span>}
                                {item.resistenciasDano?.[0]?.reducao > 0 && (
                                  <span>RD {item.resistenciasDano[0].reducao}</span>
                                )}
                                {item.bonusDano && <span>+ {item.bonusDano}</span>}
                              </div>
                              <em>
                                {itemLojaSelecionadoId === item.id
                                  ? "✓ Item selecionado"
                                  : "Selecionar item"}
                              </em>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="mestre-entrega-loja">
                        <div className="mestre-entrega-info">
                          <span>Categoria ativa</span>
                          <strong>
                            {categoriasFiltroLoja.find(
                              (categoria) => categoria.id === categoriaLojaAtiva,
                            )?.nome || "Armas de Fogo"}
                          </strong>
                          <small>
                            {catalogo.find((item) => item.id === itemLojaSelecionadoId)?.nome ||
                              "Nenhum item selecionado"}
                          </small>
                        </div>
                        <button
                          type="button"
                          onClick={entregarItemLojaAoJogador}
                          disabled={!itemLojaSelecionadoId}
                        >
                          Entregar ao jogador →
                        </button>
                      </div>
                    </section>

                    {/* INVENTÁRIO */}
                    <section className="mestre-modal-bloco full">
                      <span>Inventário</span>

                      <div className="mestre-inventario-grid">
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
              {npcEditando && (
                <div
                  className="mestre-modal-overlay"
                  onClick={() => setNpcEditando(null)}
                >
                  <section
                    className="mestre-modal-ficha minimalista"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const npc = npcs.find((item) => item.id === npcEditando);

                      if (!npc) return null;

                      const atualizarCampoNpc = (campo, valor) => {
                        atualizarNpc(npc.id, {
                          [campo]: valor,
                        });
                      };

                      const atualizarGrupoNpc = (grupo, chave, valor) => {
                        atualizarNpc(npc.id, {
                          [grupo]: {
                            ...(npc[grupo] || {}),
                            [chave]: parseInt(valor, 10) || 0,
                          },
                        });
                      };

                      const atualizarMembroNpc = (membro, campo, valor) => {
                        atualizarNpc(npc.id, {
                          membros: {
                            ...(npc.membros || {}),
                            [membro]: {
                              ...(npc.membros?.[membro] || {}),
                              [campo]: Math.max(0, parseInt(valor, 10) || 0),
                            },
                          },
                        });
                      };

                      const adicionarAtaqueNpc = () => {
                        atualizarNpc(npc.id, {
                          ataques: [
                            ...(npc.ataques || []),
                            {
                              id: crypto.randomUUID(),
                              nome: "Novo Ataque",
                              dano: "",
                              descricao: "",
                            },
                          ],
                        });
                      };

                      const atualizarAtaqueNpc = (ataqueId, campo, valor) => {
                        atualizarNpc(npc.id, {
                          ataques: (npc.ataques || []).map((ataque) =>
                            ataque.id === ataqueId
                              ? {
                                  ...ataque,
                                  [campo]: valor,
                                }
                              : ataque,
                          ),
                        });
                      };

                      const removerAtaqueNpc = (ataqueId) => {
                        atualizarNpc(npc.id, {
                          ataques: (npc.ataques || []).filter(
                            (ataque) => ataque.id !== ataqueId,
                          ),
                        });
                      };

                      const adicionarHabilidadeNpc = () => {
                        atualizarNpc(npc.id, {
                          habilidades: [
                            ...(npc.habilidades || []),
                            {
                              id: crypto.randomUUID(),
                              nome: "Nova Habilidade",
                              descricao: "",
                            },
                          ],
                        });
                      };

                      const atualizarHabilidadeNpc = (
                        habilidadeId,
                        campo,
                        valor,
                      ) => {
                        atualizarNpc(npc.id, {
                          habilidades: (npc.habilidades || []).map(
                            (habilidade) =>
                              habilidade.id === habilidadeId
                                ? {
                                    ...habilidade,
                                    [campo]: valor,
                                  }
                                : habilidade,
                          ),
                        });
                      };

                      const removerHabilidadeNpc = (habilidadeId) => {
                        atualizarNpc(npc.id, {
                          habilidades: (npc.habilidades || []).filter(
                            (habilidade) => habilidade.id !== habilidadeId,
                          ),
                        });
                      };

                      return (
                        <>
                          <header className="inimigo-ficha-header">
                            <label className="inimigo-foto-editavel">
                              <img
                                src={
                                  npc.fotoPerfil ||
                                  "https://placehold.co/300x300"
                                }
                                alt={npc.nome}
                              />

                              <span>Editar imagem</span>

                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (event) => {
                                  const arquivo = event.target.files?.[0];

                                  if (!arquivo) return;

                                  try {
                                    const fotoComprimida =
                                      await compressProfileImage(arquivo);
                                    atualizarCampoNpc(
                                      "fotoPerfil",
                                      fotoComprimida,
                                    );
                                  } catch (error) {
                                    setMensagem(
                                      error.message ||
                                        "Nao foi possivel carregar a imagem.",
                                    );
                                  }

                                  event.target.value = "";
                                }}
                              />
                            </label>

                            <div className="inimigo-identidade">
                              <label>
                                NV
                                <input
                                  type="number"
                                  value={npc.nivel || 1}
                                  onChange={(e) =>
                                    atualizarCampoNpc(
                                      "nivel",
                                      parseInt(e.target.value, 10) || 1,
                                    )
                                  }
                                />
                              </label>

                              <input
                                className="inimigo-nome-input"
                                value={npc.nome || ""}
                                onChange={(e) =>
                                  atualizarCampoNpc("nome", e.target.value)
                                }
                              />
                            </div>

                            <div className="mestre-modal-header-acoes">
                              <button
                                className="duplicarButton"
                                onClick={() => duplicarNpc(npc)}
                              >
                                Duplicar
                              </button>

                              <button
                                className="mestre-btn-apagar"
                                onClick={() => excluirNpc(npc.id)}
                              >
                                Apagar
                              </button>

                              <button
                                className="mestre-modal-fechar"
                                onClick={() => setNpcEditando(null)}
                              >
                                ×
                              </button>
                            </div>
                          </header>

                          <section className="mestre-modal-bloco full">
                            <span>Atributos</span>

                            <div className="mestre-modal-atributos linha">
                              {Object.entries(npc.atributos || {}).map(
                                ([atributo, valor]) => (
                                  <label key={atributo}>
                                    {atributo}
                                    <input
                                      type="number"
                                      value={valor || 0}
                                      onChange={(e) =>
                                        atualizarGrupoNpc(
                                          "atributos",
                                          atributo,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                ),
                              )}
                            </div>
                          </section>

                          <section className="mestre-modal-bloco full">
                            <span>Sanidade</span>

                            <div className="mestre-duplo">
                              <label>
                                Atual
                                <input
                                  type="number"
                                  value={npc.sanidade?.atual || 0}
                                  onChange={(e) =>
                                    atualizarCampoNpc("sanidade", {
                                      ...(npc.sanidade || {}),
                                      atual: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                />
                              </label>

                              <label>
                                Máxima
                                <input
                                  type="number"
                                  value={npc.sanidade?.max || 0}
                                  onChange={(e) =>
                                    atualizarCampoNpc("sanidade", {
                                      ...(npc.sanidade || {}),
                                      max: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                />
                              </label>
                            </div>
                          </section>

                          <section className="mestre-modal-bloco full">
                            <span>Defesa</span>

                            <input
                              type="number"
                              value={npc.defesa || 0}
                              onChange={(e) =>
                                atualizarCampoNpc(
                                  "defesa",
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                            />
                          </section>

                          <section className="mestre-modal-bloco full">
                            <span>Membros</span>

                            <div className="mestre-corpo-grid">
                              {membrosFicha.map((membro) => {
                                const dados = npc.membros?.[membro.chave] || {
                                  atual: 0,
                                  max: 0,
                                  defesa: 0,
                                };

                                return (
                                  <div
                                    key={membro.chave}
                                    className="mestre-membro"
                                  >
                                    <strong>{membro.nome}</strong>

                                    <label>
                                      Atual
                                      <input
                                        type="number"
                                        value={dados.atual || 0}
                                        onChange={(e) =>
                                          atualizarMembroNpc(
                                            membro.chave,
                                            "atual",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </label>

                                    <label>
                                      Máx
                                      <input
                                        type="number"
                                        value={dados.max || 0}
                                        onChange={(e) =>
                                          atualizarMembroNpc(
                                            membro.chave,
                                            "max",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </label>

                                    <label>
                                      Def
                                      <input
                                        type="number"
                                        value={dados.defesa || 0}
                                        onChange={(e) =>
                                          atualizarMembroNpc(
                                            membro.chave,
                                            "defesa",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </section>

                          <section className="mestre-modal-bloco full">
                            <div className="mestre-modal-linha-topo">
                              <span>Ataques</span>

                              <button
                                type="button"
                                onClick={adicionarAtaqueNpc}
                              >
                                + Ataque
                              </button>
                            </div>

                            <div className="mestre-edit-lista">
                              {(npc.ataques || []).map((ataque) => (
                                <div key={ataque.id}>
                                  <input
                                    value={ataque.nome || ""}
                                    onChange={(e) =>
                                      atualizarAtaqueNpc(
                                        ataque.id,
                                        "nome",
                                        e.target.value,
                                      )
                                    }
                                  />

                                  <input
                                    value={ataque.dano || ""}
                                    onChange={(e) =>
                                      atualizarAtaqueNpc(
                                        ataque.id,
                                        "dano",
                                        e.target.value,
                                      )
                                    }
                                  />

                                  <button
                                    onClick={() => removerAtaqueNpc(ataque.id)}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section className="mestre-modal-bloco full">
                            <div className="mestre-modal-linha-topo">
                              <span>Habilidades</span>

                              <button
                                type="button"
                                onClick={adicionarHabilidadeNpc}
                              >
                                + Habilidade
                              </button>
                            </div>

                            <div className="mestre-edit-lista">
                              {(npc.habilidades || []).map((habilidade) => (
                                <div key={habilidade.id}>
                                  <input
                                    value={habilidade.nome || ""}
                                    onChange={(e) =>
                                      atualizarHabilidadeNpc(
                                        habilidade.id,
                                        "nome",
                                        e.target.value,
                                      )
                                    }
                                  />

                                  <input
                                    value={habilidade.descricao || ""}
                                    onChange={(e) =>
                                      atualizarHabilidadeNpc(
                                        habilidade.id,
                                        "descricao",
                                        e.target.value,
                                      )
                                    }
                                  />

                                  <button
                                    onClick={() =>
                                      removerHabilidadeNpc(habilidade.id)
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </section>
                        </>
                      );
                    })()}
                  </section>
                </div>
              )}
            </section>
          )}

          {aba === "inimigos" && (
            <section className="mestre-dashboard-full">
              <div className="mestre-modal-linha-topo">
                <h2>Inimigos</h2>

                <button
                  className="criarInimigo-button"
                  type="button"
                  onClick={criarNovoInimigo}
                >
                  Criar inimigo
                </button>
              </div>

              <div className="mestre-fichas-com-party">
                <div className="mestre-dashboard-cards">
                  {inimigos.map((inimigo) => (
                    <DashboardFichaCard
                      key={inimigo.fichaId || inimigo.id}
                      ficha={inimigo}
                      tipo="inimigo"
                      onAbrir={abrirCardFicha}
                    />
                  ))}
                </div>
                {inimigoEditando && (
                  <div
                    className="mestre-modal-overlay"
                    onClick={() => setInimigoEditando(null)}
                  >
                    <section
                      className="mestre-modal-ficha minimalista"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const inimigo = inimigos.find(
                          (i) => i.id === inimigoEditando,
                        );

                        if (!inimigo) return null;

                        const atualizarCampoInimigo = (campo, valor) => {
                          atualizarInimigo(inimigo.id, {
                            [campo]: valor,
                          });
                        };

                        const atualizarGrupoInimigo = (grupo, chave, valor) => {
                          atualizarInimigo(inimigo.id, {
                            [grupo]: {
                              ...(inimigo[grupo] || {}),
                              [chave]: parseInt(valor, 10) || 0,
                            },
                          });
                        };

                        return (
                          <>
                            <header className="inimigo-ficha-header">
                              <label className="inimigo-foto-editavel">
                                <img
                                  src={
                                    inimigo.fotoPerfil ||
                                    "https://placehold.co/300x300"
                                  }
                                  alt={inimigo.nome}
                                />

                                <span>Editar imagem</span>

                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (event) => {
                                    const arquivo = event.target.files?.[0];
                                    if (!arquivo) return;

                                    try {
                                      const fotoComprimida =
                                        await compressProfileImage(arquivo);
                                      atualizarCampoInimigo(
                                        "fotoPerfil",
                                        fotoComprimida,
                                      );
                                    } catch (error) {
                                      setMensagem(
                                        error.message ||
                                          "Nao foi possivel carregar a imagem.",
                                      );
                                    }

                                    event.target.value = "";
                                  }}
                                />
                              </label>

                              <div className="inimigo-identidade">
                                <label>
                                  NV
                                  <input
                                    type="number"
                                    value={inimigo.nivel || 1}
                                    onChange={(e) =>
                                      atualizarCampoInimigo(
                                        "nivel",
                                        parseInt(e.target.value, 10) || 1,
                                      )
                                    }
                                  />
                                </label>

                                <input
                                  className="inimigo-nome-input"
                                  value={inimigo.nome || ""}
                                  onChange={(e) =>
                                    atualizarCampoInimigo(
                                      "nome",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="mestre-modal-header-acoes">
                                <button
                                  className="duplicarButton"
                                  onClick={() => duplicarInimigo(inimigo)}
                                >
                                  Duplicar
                                </button>

                                <button
                                  className="mestre-btn-apagar"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    excluirInimigo(inimigo.id);
                                  }}
                                >
                                  Apagar
                                </button>

                                <button
                                  className="mestre-modal-fechar"
                                  onClick={() => setInimigoEditando(null)}
                                >
                                  ×
                                </button>
                              </div>
                            </header>

                            <section className="mestre-modal-bloco full">
                              <span>Atributos</span>

                              <div className="mestre-modal-atributos linha">
                                {Object.entries(inimigo.atributos || {}).map(
                                  ([atributo, valor]) => (
                                    <label key={atributo}>
                                      {atributo}

                                      <input
                                        type="number"
                                        value={valor}
                                        onChange={(e) =>
                                          atualizarGrupoInimigo(
                                            "atributos",
                                            atributo,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </label>
                                  ),
                                )}
                              </div>
                            </section>
                            {/* SANIDADE */}
                            <section className="inimigo-ficha-bloco">
                              <h3>Sanidade</h3>

                              <div className="mestre-form-grid">
                                <label>
                                  Atual
                                  <input
                                    type="number"
                                    value={inimigo.sanidade?.atual || 0}
                                    onChange={(e) =>
                                      atualizarCampoInimigo("sanidade", {
                                        ...(inimigo.sanidade || {}),
                                        atual:
                                          parseInt(e.target.value, 10) || 0,
                                      })
                                    }
                                  />
                                </label>

                                <label>
                                  Máxima
                                  <input
                                    type="number"
                                    value={inimigo.sanidade?.max || 0}
                                    onChange={(e) =>
                                      atualizarCampoInimigo("sanidade", {
                                        ...(inimigo.sanidade || {}),
                                        max: parseInt(e.target.value, 10) || 0,
                                      })
                                    }
                                  />
                                </label>
                              </div>
                            </section>

                            {/* DEFESA */}
                            <section className="inimigo-ficha-bloco">
                              <h3>Defesa</h3>

                              <input
                                type="number"
                                value={inimigo.defesa || 0}
                                onChange={(e) =>
                                  atualizarCampoInimigo(
                                    "defesa",
                                    parseInt(e.target.value, 10) || 0,
                                  )
                                }
                              />
                            </section>

                            {/* MEMBROS */}
                            <section className="inimigo-ficha-bloco">
                              <h3>Membros</h3>

                              <div className="mestre-corpo-grid">
                                {membrosFicha.map(({ chave, nome }) => {
                                  const dados = inimigo.membros?.[chave] || {
                                    atual: 0,
                                    max: 0,
                                    defesa: 0,
                                  };

                                  const atualizarMembroInimigo = (
                                    campo,
                                    valor,
                                  ) => {
                                    atualizarCampoInimigo("membros", {
                                      ...(inimigo.membros || {}),
                                      [chave]: {
                                        ...dados,
                                        [campo]: Math.max(
                                          0,
                                          parseInt(valor, 10) || 0,
                                        ),
                                      },
                                    });
                                  };

                                  return (
                                    <div
                                      key={chave}
                                      className="mestre-corpo-item"
                                    >
                                      <strong>{nome}</strong>

                                      <label>
                                        Atual
                                        <input
                                          type="number"
                                          value={dados.atual || 0}
                                          onChange={(e) =>
                                            atualizarMembroInimigo(
                                              "atual",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label>
                                        Máx
                                        <input
                                          type="number"
                                          value={dados.max || 0}
                                          onChange={(e) =>
                                            atualizarMembroInimigo(
                                              "max",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label>
                                        DEF
                                        <input
                                          type="number"
                                          value={dados.defesa || 0}
                                          onChange={(e) =>
                                            atualizarMembroInimigo(
                                              "defesa",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </section>

                            {/* ATAQUES */}
                            <section className="inimigo-ficha-bloco">
                              <div className="inimigo-bloco-topo">
                                <h3>Ataques</h3>

                                <button
                                  className="ataqueButton"
                                  type="button"
                                  onClick={() =>
                                    atualizarCampoInimigo("ataques", [
                                      ...(inimigo.ataques || []),
                                      {
                                        nome: "Novo Ataque",
                                        alcance: "Corpo a Corpo",
                                        dano: "1d6",
                                        efeito: "",
                                      },
                                    ])
                                  }
                                >
                                  + Ataque
                                </button>
                              </div>

                              {(inimigo.ataques || []).map((ataque, index) => (
                                <div
                                  key={index}
                                  className="inimigo-ataque-card"
                                >
                                  <input
                                    value={ataque.nome || ""}
                                    placeholder="Nome do ataque"
                                    onChange={(e) => {
                                      const ataques = [
                                        ...(inimigo.ataques || []),
                                      ];
                                      ataques[index] = {
                                        ...ataque,
                                        nome: e.target.value,
                                      };
                                      atualizarCampoInimigo("ataques", ataques);
                                    }}
                                  />

                                  <input
                                    value={ataque.alcance || ""}
                                    placeholder="Alcance"
                                    onChange={(e) => {
                                      const ataques = [
                                        ...(inimigo.ataques || []),
                                      ];
                                      ataques[index] = {
                                        ...ataque,
                                        alcance: e.target.value,
                                      };
                                      atualizarCampoInimigo("ataques", ataques);
                                    }}
                                  />

                                  <input
                                    value={ataque.dano || ""}
                                    placeholder="Dano: 2d6 + 3"
                                    onChange={(e) => {
                                      const ataques = [
                                        ...(inimigo.ataques || []),
                                      ];
                                      ataques[index] = {
                                        ...ataque,
                                        dano: e.target.value,
                                      };
                                      atualizarCampoInimigo("ataques", ataques);
                                    }}
                                  />

                                  <textarea
                                    value={ataque.efeito || ""}
                                    placeholder="Efeito do ataque"
                                    onChange={(e) => {
                                      const ataques = [
                                        ...(inimigo.ataques || []),
                                      ];
                                      ataques[index] = {
                                        ...ataque,
                                        efeito: e.target.value,
                                      };
                                      atualizarCampoInimigo("ataques", ataques);
                                    }}
                                  />

                                  <button
                                    type="button"
                                    className="mestre-btn-apagar"
                                    onClick={() =>
                                      atualizarCampoInimigo(
                                        "ataques",
                                        (inimigo.ataques || []).filter(
                                          (_, i) => i !== index,
                                        ),
                                      )
                                    }
                                  >
                                    Remover
                                  </button>
                                </div>
                              ))}
                            </section>

                            {/* HABILIDADES */}
                            <section className="inimigo-ficha-bloco">
                              <div className="inimigo-bloco-topo">
                                <h3>Habilidades</h3>

                                <button
                                  className="habilidadeButton"
                                  type="button"
                                  onClick={() =>
                                    atualizarCampoInimigo("habilidades", [
                                      ...(inimigo.habilidades || []),
                                      {
                                        nome: "Nova Habilidade",
                                        descricao: "",
                                      },
                                    ])
                                  }
                                >
                                  + Habilidade
                                </button>
                              </div>

                              {(inimigo.habilidades || []).map(
                                (habilidade, index) => (
                                  <div
                                    key={index}
                                    className="inimigo-ataque-card"
                                  >
                                    <input
                                      value={habilidade.nome || ""}
                                      placeholder="Nome da habilidade"
                                      onChange={(e) => {
                                        const habilidades = [
                                          ...(inimigo.habilidades || []),
                                        ];
                                        habilidades[index] = {
                                          ...habilidade,
                                          nome: e.target.value,
                                        };
                                        atualizarCampoInimigo(
                                          "habilidades",
                                          habilidades,
                                        );
                                      }}
                                    />

                                    <textarea
                                      value={habilidade.descricao || ""}
                                      placeholder="Descrição da habilidade"
                                      onChange={(e) => {
                                        const habilidades = [
                                          ...(inimigo.habilidades || []),
                                        ];
                                        habilidades[index] = {
                                          ...habilidade,
                                          descricao: e.target.value,
                                        };
                                        atualizarCampoInimigo(
                                          "habilidades",
                                          habilidades,
                                        );
                                      }}
                                    />

                                    <button
                                      type="button"
                                      className="mestre-btn-apagar"
                                      onClick={() =>
                                        atualizarCampoInimigo(
                                          "habilidades",
                                          (inimigo.habilidades || []).filter(
                                            (_, i) => i !== index,
                                          ),
                                        )
                                      }
                                    >
                                      Remover
                                    </button>
                                  </div>
                                ),
                              )}
                            </section>
                          </>
                        );
                      })()}
                    </section>
                  </div>
                )}
              </div>
            </section>
          )}

          {aba === "loja" && (
            <section className="mestre-loja">
              <div className="mestre-loja-editor-topo">
                <div>
                  <h2>
                    <Icon path={mdiStoreCogOutline} size={0.95} />
                    Editor da Loja
                  </h2>
                  <p>Edite armas e ritos diretamente nos cards do catálogo.</p>
                </div>
                <button
                  type="button"
                  className="mestre-btn-novo-item-loja"
                  onClick={() => {
                    setItemEditandoId(null);
                    setItemEditandoDados(null);
                    setNovoItemLoja({
                      ...itemLojaVazio,
                      categoria: abaLojaEditor,
                      nivelRito:
                        abaLojaEditor === "ritos"
                          ? nivelRitoDashboard
                          : "iniciante",
                      tipoArma:
                        abaLojaEditor === "municoes-especiais"
                          ? tipoMunicaoEditor
                          : "",
                    });
                    setMostrarFormNovoItem((atual) => !atual);
                  }}
                >
                  + Adicionar item
                </button>
              </div>

              <nav className="mestre-ficha-tabs">
                {abasEditorLoja.map((abaItem) => (
                  <button
                    key={abaItem.id}
                    className={abaLojaEditor === abaItem.id ? "ativa" : ""}
                    onClick={() => {
                      setAbaLojaEditor(abaItem.id);

                      setNovoItemLoja({
                        ...itemLojaVazio,
                        categoria: abaItem.id,
                        nivelRito:
                          abaItem.id === "ritos"
                            ? nivelRitoDashboard
                            : "iniciante",
                        tipoArma:
                          abaItem.id === "municoes-especiais"
                            ? tipoMunicaoEditor
                            : "",
                      });

                      setItemEditandoId(null);
                      setItemEditandoDados(null);
                      setMostrarFormNovoItem(false);
                    }}
                  >
                    {abaItem.nome}
                  </button>
                ))}
              </nav>

              {abaLojaEditor === "ritos" && !mostrarFormNovoItem && (
                <nav className="mestre-ritos-niveis-tabs" aria-label="Níveis dos ritos">
                  {[
                    { id: "iniciante", nome: "I — Iniciante" },
                    { id: "intermediario", nome: "II — Intermediário" },
                    { id: "avancado", nome: "III — Avançado" },
                    { id: "experiente", nome: "IV — Experiente" },
                  ].map((nivel) => (
                    <button
                      key={nivel.id}
                      type="button"
                      className={
                        nivelRitoDashboard === nivel.id ? "ativa" : ""
                      }
                      onClick={() => {
                        setNivelRitoDashboard(nivel.id);
                        setItemEditandoId(null);
                        setItemEditandoDados(null);
                      }}
                    >
                      {nivel.nome}
                    </button>
                  ))}
                </nav>
              )}

              {abaLojaEditor === "municoes-especiais" && !mostrarFormNovoItem && (
                <nav
                  className="mestre-ritos-niveis-tabs"
                  aria-label="Tipos de arma para munições especiais"
                >
                  {[
                    { id: "pistola", nome: "Pistola" },
                    { id: "escopeta", nome: "Escopeta" },
                    { id: "rifle", nome: "Rifle" },
                    { id: "fuzil", nome: "Fuzil" },
                    { id: "arco", nome: "Arco" },
                  ].map((tipo) => (
                    <button
                      key={tipo.id}
                      type="button"
                      className={tipoMunicaoEditor === tipo.id ? "ativa" : ""}
                      onClick={() => {
                        setTipoMunicaoEditor(tipo.id);
                        setNovoItemLoja((atual) => ({
                          ...atual,
                          categoria: "municoes-especiais",
                          tipoArma: tipo.id,
                        }));
                        setItemEditandoId(null);
                        setItemEditandoDados(null);
                      }}
                    >
                      {tipo.nome}
                    </button>
                  ))}
                </nav>
              )}

              {mostrarFormNovoItem && (
  <form className="mestre-loja-form mestre-loja-form-novo" onSubmit={salvarItemLojaEditor}>
    <h3>
      Novo {abasEditorLoja.find((a) => a.id === abaLojaEditor)?.nome}
    </h3>

    {/* ===== CAMPO NOME – SEMPRE VISÍVEL ===== */}
    <label style={{ marginBottom: '8px' }}>
      Nome do item
      <input
        value={novoItemLoja.nome}
        onChange={(event) => atualizarCampoLoja("nome", event.target.value)}
        placeholder="Ex: Fuzil de Precisão, Adaga Envenenada..."
        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
      />
    </label>

    {/* ===== GRID PARA PREÇO E OUTROS CAMPOS GERAIS ===== */}
    <div className="mestre-form-grid">
      <label>
        Preço
        <input
          type="number"
          min="0"
          value={novoItemLoja.preco}
          onChange={(event) => atualizarCampoLoja("preco", event.target.value)}
        />
      </label>

      {abaLojaEditor === "ritos" && (
        <nav className="mestre-ritos-niveis-tabs">
          <label>Níveis do Absoluto</label>
          {[
            { id: "iniciante", nome: "I — Iniciante" },
            { id: "intermediario", nome: "II — Intermediário" },
            { id: "avancado", nome: "III — Avançado" },
            { id: "experiente", nome: "IV — Experiente" },
          ].map((nivel) => (
            <button
              key={nivel.id}
              type="button"
              className={nivelRitoDashboard === nivel.id ? "ativa" : ""}
              onClick={() => {
                setNivelRitoDashboard(nivel.id);
                setNovoItemLoja((atual) => ({
                  ...atual,
                  categoria: "ritos",
                  nivelRito: nivel.id,
                }));
                setItemEditandoId(null);
              }}
            >
              {nivel.nome}
            </button>
          ))}
        </nav>
      )}
    </div>

    {/* ===== DESCRIÇÃO / DETALHE ===== */}
    <label>
      Descrição / Detalhe
      <textarea
        value={novoItemLoja.detalhe}
        onChange={(event) => atualizarCampoLoja("detalhe", event.target.value)}
      />
    </label>

    {abaLojaEditor === "defesas" && (
      <section className="mestre-arma-status-editor">
        <h4>Proteção concedida</h4>
        <div className="mestre-form-grid">
          <label>
            Parte do corpo protegida
            <select
              value={novoItemLoja.entrega || ""}
              onChange={(event) => atualizarCampoLoja("entrega", event.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Cabeça">Cabeça</option>
              <option value="Face">Face</option>
              <option value="Torso">Torso</option>
              <option value="Braços">Braços</option>
              <option value="Mãos">Mãos</option>
              <option value="Empunhado">Empunhado</option>
              <option value="Pernas">Pernas</option>
              <option value="Pés">Pés</option>
              <option value="Conjunto">Conjunto completo</option>
            </select>
          </label>
          <label>
            Defesa concedida
            <input
              type="number"
              min="0"
              value={novoItemLoja.defesaBonus || 0}
              onChange={(event) => atualizarCampoLoja("defesaBonus", event.target.value)}
            />
          </label>
          <label>
            Tipo de resistência
            <input
              value={novoItemLoja.resistenciasDano?.[0]?.tipo || ""}
              onChange={(event) =>
                atualizarCampoLoja("resistenciasDano", [
                  {
                    tipo: event.target.value,
                    reducao: novoItemLoja.resistenciasDano?.[0]?.reducao || 0,
                  },
                ])
              }
              placeholder="Ex: projetil, impacto, corte"
            />
          </label>
          <label>
            Redução de dano
            <input
              type="number"
              min="0"
              value={novoItemLoja.resistenciasDano?.[0]?.reducao || 0}
              onChange={(event) =>
                atualizarCampoLoja("resistenciasDano", [
                  {
                    tipo: novoItemLoja.resistenciasDano?.[0]?.tipo || "",
                    reducao: event.target.value,
                  },
                ])
              }
            />
          </label>
          <label>
            Texto de resistência
            <input
              value={novoItemLoja.resistencia || ""}
              onChange={(event) => atualizarCampoLoja("resistencia", event.target.value)}
              placeholder="Ex: Projéteis −10"
            />
          </label>
        </div>
      </section>
    )}

    {abaLojaEditor === "municoes-especiais" && (
      <section className="mestre-arma-status-editor">
        <h4>Características da munição</h4>
        <div className="mestre-form-grid">
          <label>
            Arma compatível
            <select
              value={novoItemLoja.tipoArma || ""}
              onChange={(event) => atualizarCampoLoja("tipoArma", event.target.value)}
            >
              <option value="">Selecione</option>
              <option value="pistola">Pistola</option>
              <option value="escopeta">Escopeta</option>
              <option value="rifle">Rifle</option>
              <option value="fuzil">Fuzil</option>
              <option value="arco">Arco</option>
            </select>
          </label>
          <label>
            Quantidade por compra
            <input
              type="number"
              min="1"
              value={novoItemLoja.quantidade || 0}
              onChange={(event) => atualizarCampoLoja("quantidade", event.target.value)}
            />
          </label>
          <label>
            Bônus de dano
            <input
              value={novoItemLoja.bonusDano || ""}
              onChange={(event) => atualizarCampoLoja("bonusDano", event.target.value)}
              placeholder="Ex: 1d6"
            />
          </label>
          <label>
            Efeito especial
            <input
              value={novoItemLoja.efeito || ""}
              onChange={(event) => atualizarCampoLoja("efeito", event.target.value)}
              placeholder="Ex: Incendeia o alvo"
            />
          </label>
        </div>
      </section>
    )}

    {/* ===== CAMPOS ESPECÍFICOS PARA ARMAS EXCLUSIVAS ===== */}
    {abaLojaEditor === "armas-exclusivas" && (
      <>
        <label>
          Tipo de Item
          <select
            value={novoItemLoja.subtipo || "nenhum"}
            onChange={(e) => atualizarCampoLoja("subtipo", e.target.value)}
          >
            <option value="nenhum">Item Comum</option>
            <option value="fogo">Arma de Fogo</option>
            <option value="corpo">Arma Corpo a Corpo</option>
          </select>
        </label>

        <label className="mestre-icone-arma-exclusiva">
          Ícone da arma
          <div className="mestre-icone-arma-exclusiva-opcoes">
            {ICONES_ARMAS_EXCLUSIVAS.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                title={opcao.nome}
                aria-label={`Usar ícone de ${opcao.nome}`}
                className={novoItemLoja.icone === opcao.icone ? "selecionado" : ""}
                onClick={() => atualizarCampoLoja("icone", opcao.icone)}
              >
                <Icon path={opcao.icone} size={0.95} />
              </button>
            ))}
          </div>
          <small>Escolha um dos ícones minimalistas disponíveis.</small>
        </label>

        {novoItemLoja.subtipo === "fogo" && (
          <div className="mestre-arma-status-editor">
            <h4>Características da arma de fogo</h4>
            <div className="mestre-form-grid">
              <label>Tipo <input value={novoItemLoja.armaStatus?.tipo || ""} onChange={(e) => atualizarArmaStatusLoja("tipo", e.target.value)} placeholder="Ex: Automática" /></label>
              <label>DMG <input value={novoItemLoja.armaStatus?.dmg || ""} onChange={(e) => atualizarArmaStatusLoja("dmg", e.target.value)} placeholder="Ex: 2d6" /></label>
              <label>ROF <input value={novoItemLoja.armaStatus?.rof || ""} onChange={(e) => atualizarArmaStatusLoja("rof", e.target.value)} placeholder="Ex: 3" /></label>
              <label>MAG <input value={novoItemLoja.armaStatus?.mag || ""} onChange={(e) => atualizarArmaStatusLoja("mag", e.target.value)} placeholder="Ex: 12" /></label>
              <label>Disparos sem desvantagem <input value={novoItemLoja.armaStatus?.disparosSemDesvantagem || ""} onChange={(e) => atualizarArmaStatusLoja("disparosSemDesvantagem", e.target.value)} placeholder="Ex: 3" /></label>
              <label>Recarga <input value={novoItemLoja.armaStatus?.recarga || ""} onChange={(e) => atualizarArmaStatusLoja("recarga", e.target.value)} placeholder="Ex: Ação completa" /></label>
              <label>Crítico <input value={novoItemLoja.armaStatus?.critico || ""} onChange={(e) => atualizarArmaStatusLoja("critico", e.target.value)} placeholder="Ex: 2x" /></label>
              <label>Dano Cabeça <input value={novoItemLoja.armaStatus?.danoCabeca || ""} onChange={(e) => atualizarArmaStatusLoja("danoCabeca", e.target.value)} placeholder="Ex: 2" /></label>
              <label>Hipfire <input value={novoItemLoja.armaStatus?.hipfire || ""} onChange={(e) => atualizarArmaStatusLoja("hipfire", e.target.value)} placeholder="Ex: +1" /></label>
              <label>Precision <input value={novoItemLoja.armaStatus?.precision || ""} onChange={(e) => atualizarArmaStatusLoja("precision", e.target.value)} placeholder="Ex: -2" /></label>
              <label>Control <input value={novoItemLoja.armaStatus?.control || ""} onChange={(e) => atualizarArmaStatusLoja("control", e.target.value)} placeholder="Ex: +3" /></label>
              <label>Mobility <input value={novoItemLoja.armaStatus?.mobility || ""} onChange={(e) => atualizarArmaStatusLoja("mobility", e.target.value)} placeholder="Ex: -1" /></label>
            </div>
          </div>
        )}

        {novoItemLoja.subtipo === "corpo" && (
          <div className="mestre-arma-status-editor">
            <h4>Características da arma corpo a corpo</h4>
            <div className="mestre-form-grid">
              <label>Dano <input value={novoItemLoja.dano || ""} onChange={(e) => atualizarCampoLoja("dano", e.target.value)} placeholder="Ex: 1d8+4" /></label>
              <label>Crítico <input value={novoItemLoja.critico || "1x..."} onChange={(e) => atualizarCampoLoja("critico", e.target.value)} placeholder="Ex: 2x" /></label>
              <label>Dano Cabeça <input value={novoItemLoja.danoCabeca || "0"} onChange={(e) => atualizarCampoLoja("danoCabeca", e.target.value)} placeholder="Ex: 2" /></label>
            </div>
          </div>
        )}

        {novoItemLoja.subtipo !== "nenhum" && (
          <details className="mestre-aprimoramentos-exclusiva">
            <summary>
              Aprimoramentos da arma ({(novoItemLoja.modificacoesArma || []).length}/3)
            </summary>
            <p>Selecione até três aprimoramentos disponíveis na loja.</p>
            <div className="mestre-aprimoramentos-lista">
              {MODIFICACOES.filter(
                (modificacao) =>
                  modificacao.aplicavel ===
                    (novoItemLoja.subtipo === "fogo"
                      ? "arma-fogo"
                      : "arma-corpo") ||
                  modificacao.aplicavel === "ambos",
              ).map((modificacao) => {
                const selecionada = (novoItemLoja.modificacoesArma || []).some(
                  (item) => item.id === modificacao.id,
                );

                return (
                  <label key={modificacao.id} className="mestre-aprimoramento-opcao">
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={() => alternarModificacaoArmaExclusiva(modificacao)}
                    />
                    <span>
                      <strong>{modificacao.nome}</strong>
                      <small>{modificacao.detalhe}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </details>
        )}

        {novoItemLoja.subtipo !== "nenhum" && (
          <section className="mestre-aprimoramento-customizado">
            <div className="mestre-aprimoramento-customizado-topo">
              <div>
                <span>Exclusivo</span>
                <h4>Aprimoramento Customizado</h4>
                <p>Um aprimoramento único, vinculado somente a esta arma.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNovoItemLoja((atual) => ({
                    ...atual,
                    aprimoramentoCustomizado: atual.aprimoramentoCustomizado
                      ? null
                      : { nome: "", detalhe: "" },
                  }))
                }
              >
                {novoItemLoja.aprimoramentoCustomizado
                  ? "Remover"
                  : "+ Criar exclusivo"}
              </button>
            </div>

            {novoItemLoja.aprimoramentoCustomizado && (
              <div className="mestre-aprimoramento-customizado-form">
                <label>
                  Nome do aprimoramento
                  <input
                    value={novoItemLoja.aprimoramentoCustomizado.nome}
                    placeholder="Ex: Núcleo de Ruptura"
                    onChange={(event) =>
                      setNovoItemLoja((atual) => ({
                        ...atual,
                        aprimoramentoCustomizado: {
                          ...atual.aprimoramentoCustomizado,
                          nome: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  Efeito exclusivo
                  <textarea
                    value={novoItemLoja.aprimoramentoCustomizado.detalhe}
                    placeholder="Descreva o efeito, limite de uso e qualquer condição."
                    onChange={(event) =>
                      setNovoItemLoja((atual) => ({
                        ...atual,
                        aprimoramentoCustomizado: {
                          ...atual.aprimoramentoCustomizado,
                          detalhe: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
            )}
          </section>
        )}
      </>
    )}

    {/* ===== CAMPOS PARA OUTRAS CATEGORIAS (ARMAS-FOGO, ETC.) ===== */}
    {abaLojaEditor !== "ritos" && abaLojaEditor !== "poderes" && abaLojaEditor !== "armas-exclusivas" && (
      <>
        <label>
          Dano
          <input
            value={novoItemLoja.dano}
            onChange={(event) => atualizarCampoLoja("dano", event.target.value)}
            placeholder="Ex: 1d8+4"
          />
        </label>
        <label>
          Bônus de dano
          <input
            value={novoItemLoja.bonusDano}
            onChange={(event) => atualizarCampoLoja("bonusDano", event.target.value)}
            placeholder="Ex: +2 de dano"
          />
        </label>
      </>
    )}

    {abaLojaEditor === "poderes" && (
      <label>
        Absolutismo
        <textarea
          value={novoItemLoja.entrega}
          onChange={(event) => atualizarCampoLoja("entrega", event.target.value)}
          placeholder="Absolutismo: ..."
        />
      </label>
    )}

    {abaLojaEditor === "armas-fogo" && (
      <div className="mestre-arma-status-editor">
        <h4>Características da arma</h4>
        <div className="mestre-form-grid">
          <label>Tipo <input value={novoItemLoja.armaStatus?.tipo || ""} onChange={(e) => atualizarArmaStatusLoja("tipo", e.target.value)} /></label>
          <label>DMG <input value={novoItemLoja.armaStatus?.dmg || ""} onChange={(e) => atualizarArmaStatusLoja("dmg", e.target.value)} placeholder="2d6" /></label>
          <label>ROF <input value={novoItemLoja.armaStatus?.rof || ""} onChange={(e) => atualizarArmaStatusLoja("rof", e.target.value)} /></label>
          <label>MAG <input value={novoItemLoja.armaStatus?.mag || ""} onChange={(e) => atualizarArmaStatusLoja("mag", e.target.value)} /></label>
          <label>Disparos sem desvantagem <input value={novoItemLoja.armaStatus?.disparosSemDesvantagem || ""} onChange={(e) => atualizarArmaStatusLoja("disparosSemDesvantagem", e.target.value)} /></label>
          <label>Recarga <input value={novoItemLoja.armaStatus?.recarga || ""} onChange={(e) => atualizarArmaStatusLoja("recarga", e.target.value)} /></label>
          <label>Crítico <input value={novoItemLoja.armaStatus?.critico || ""} onChange={(e) => atualizarArmaStatusLoja("critico", e.target.value)} /></label>
          <label>Dano Cabeça <input value={novoItemLoja.armaStatus?.danoCabeca || ""} onChange={(e) => atualizarArmaStatusLoja("danoCabeca", e.target.value)} /></label>
          <label>Hipfire <input value={novoItemLoja.armaStatus?.hipfire || ""} onChange={(e) => atualizarArmaStatusLoja("hipfire", e.target.value)} /></label>
          <label>Precision <input value={novoItemLoja.armaStatus?.precision || ""} onChange={(e) => atualizarArmaStatusLoja("precision", e.target.value)} /></label>
          <label>Control <input value={novoItemLoja.armaStatus?.control || ""} onChange={(e) => atualizarArmaStatusLoja("control", e.target.value)} /></label>
          <label>Mobility <input value={novoItemLoja.armaStatus?.mobility || ""} onChange={(e) => atualizarArmaStatusLoja("mobility", e.target.value)} /></label>
        </div>
      </div>
    )}

    {/* ===== BOTÕES ===== */}
    <div className="mestre-loja-form-acoes">
      <button type="submit">Adicionar ao catálogo</button>
      <button type="button" onClick={limparEditorLoja}>Cancelar</button>
    </div>
  </form>
)}

              <div className="mestre-catalogo-area">
                <div className="mestre-catalogo">
                  {itensEditorLoja.length === 0 ? (
                    <div className="mestre-catalogo-vazio">
                      Nenhum item nesta categoria.
                    </div>
                  ) : (
                    itensEditorLoja.map((item) => {
                      const isEditing = itemEditandoId === item.id;
                      const dados = isEditing ? itemEditandoDados : item;

                      const handleChange = (campo, valor) => {
                        setItemEditandoDados((prev) => ({
                          ...prev,
                          [campo]: valor,
                        }));
                      };

                      const handleArmaStatusChange = (campo, valor) => {
                        setItemEditandoDados((prev) => {
                          const armaStatusBase = {
                            ...(prev.armaStatusBase || prev.armaStatus || {}),
                            [campo]: valor,
                          };
                          return {
                            ...prev,
                            armaStatusBase,
                            armaStatus: aplicarAprimoramentosNoStatus(
                              armaStatusBase,
                              prev.modificacoesArma || [],
                            ),
                          };
                        });
                      };

                      return (
                        <article
                          key={item.id}
                          className={`loja-item ${dados.armaStatus ? "loja-arma" : ""} ${isEditing ? "editando" : ""}`}
                          onClick={() => setCardExpandidoId(item.id)}
                          style={{
                            cursor: "pointer",
                            borderLeft: `3px solid ${dados.categoria === "ritos" ? "#9fc5ff" : dados.categoria === "defesas" ? "#8ee7b0" : "#8b4513"}`,
                          }}
                        >
                          <div>
                            <div className="loja-item-topo">
                              <span
                                className={`loja-item-tipo ${dados.categoria}`}
                              >
                                {dados.categoria === "ritos"
                                  ? `Rito — ${
                                      {
                                        iniciante: "I — Iniciante",
                                        intermediario: "II — Intermediário",
                                        avancado: "III — Avançado",
                                        experiente: "IV — Experiente",
                                      }[dados.nivelRito || "iniciante"] ||
                                      "I — Iniciante"
                                    }`
                                  : dados.armaStatus?.tipo || dados.categoria}
                              </span>
                            </div>

                            {isEditing ? (
                              <input
                                value={dados.nome}
                                onChange={(e) =>
                                  handleChange("nome", e.target.value)
                                }
                                style={{
                                  fontSize: "1.05rem",
                                  fontWeight: "bold",
                                  background: "transparent",
                                  border: "1px solid #fff",
                                  color: "#fff",
                                  padding: "4px 6px",
                                  borderRadius: "4px",
                                  width: "100%",
                                }}
                              />
                            ) : (
                              <h2>{dados.nome}</h2>
                            )}

                            {isEditing ? (
                              <textarea
                                value={dados.detalhe || ""}
                                onChange={(e) =>
                                  handleChange("detalhe", e.target.value)
                                }
                                style={{
                                  width: "100%",
                                  background: "transparent",
                                  border: "1px solid #fff",
                                  color: "#aaa",
                                  padding: "4px 6px",
                                  borderRadius: "4px",
                                  minHeight: "60px",
                                }}
                              />
                            ) : (
                              <p>{dados.detalhe}</p>
                            )}

                            {dados.armaStatus && (
                              <div className="arma-status-card">
                                {dados.categoria === "armas-corpo" ||
                                dados.armaStatus?.tipo === "Corpo a Corpo" ? (
                                  <div className="arma-status-corpo">
                                    <div>
                                      <span>Tipo:</span>
                                      {isEditing ? (
                                        <input
                                          value={
                                            dados.armaStatus.tipo ||
                                            "Corpo a Corpo"
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "tipo",
                                              e.target.value,
                                            )
                                          }
                                          style={{
                                            background: "transparent",
                                            border: "1px solid #fff",
                                            color: "#fff",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        <strong>{dados.armaStatus.tipo}</strong>
                                      )}
                                    </div>
                                    <div>
                                      <span>Dano Padrão:</span>
                                      {isEditing ? (
                                        <input
                                          value={dados.armaStatus.dmg || ""}
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "dmg",
                                              e.target.value,
                                            )
                                          }
                                          style={{
                                            background: "transparent",
                                            border: "1px solid #fff",
                                            color: "#fff",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        <strong>{dados.armaStatus.dmg}</strong>
                                      )}
                                    </div>
                                    <div>
                                      <span>Crítico:</span>
                                      {isEditing ? (
                                        <input
                                          value={dados.armaStatus.critico || ""}
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "critico",
                                              e.target.value,
                                            )
                                          }
                                          style={{
                                            background: "transparent",
                                            border: "1px solid #fff",
                                            color: "#fff",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        <strong>
                                          {dados.armaStatus.critico}
                                        </strong>
                                      )}
                                    </div>
                                    <div>
                                      <span>Dano Cabeça:</span>
                                      {isEditing ? (
                                        <input
                                          value={
                                            dados.armaStatus.danoCabeca || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "danoCabeca",
                                              e.target.value,
                                            )
                                          }
                                          style={{
                                            background: "transparent",
                                            border: "1px solid #fff",
                                            color: "#fff",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                          }}
                                        />
                                      ) : (
                                        <strong>
                                          {dados.armaStatus.danoCabeca}
                                        </strong>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="arma-status-principais">
                                      <div>
                                        <span>DMG</span>
                                        {isEditing ? (
                                          <input
                                            value={dados.armaStatus.dmg || ""}
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "dmg",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "60px",
                                            }}
                                          />
                                        ) : (
                                          <strong>
                                            {dados.armaStatus.dmg}
                                          </strong>
                                        )}
                                      </div>
                                      <div>
                                        <span>ROF</span>
                                        {isEditing ? (
                                          <input
                                            value={dados.armaStatus.rof || ""}
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "rof",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "60px",
                                            }}
                                          />
                                        ) : (
                                          <strong>
                                            {dados.armaStatus.rof}
                                          </strong>
                                        )}
                                      </div>
                                      <div>
                                        <span>MAG</span>
                                        {isEditing ? (
                                          <input
                                            value={dados.armaStatus.mag || ""}
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "mag",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "60px",
                                            }}
                                          />
                                        ) : (
                                          <strong>
                                            {dados.armaStatus.mag}
                                          </strong>
                                        )}
                                      </div>
                                    </div>
                                    <div className="arma-status-modos">
                                      <div>
                                        <span>HIPFIRE</span>
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus.hipfire || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "hipfire",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "100%",
                                            }}
                                          />
                                        ) : (
                                          <strong>
                                            {dados.armaStatus.hipfire}
                                          </strong>
                                        )}
                                      </div>
                                      <div>
                                        <span>PRECISION</span>
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus.precision || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "precision",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "100%",
                                            }}
                                          />
                                        ) : (
                                          <strong>
                                            {dados.armaStatus.precision}
                                          </strong>
                                        )}
                                      </div>
                                      <div>
                                        <span>CONTROL</span>
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus.control || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "control",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "100%",
                                            }}
                                          />
                                        ) : (
                                          <strong>
                                            {dados.armaStatus.control}
                                          </strong>
                                        )}
                                      </div>
                                      <div>
                                        <span>MOBILITY</span>
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus.mobility || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "mobility",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "100%",
                                            }}
                                          />
                                        ) : (
                                          <strong>
                                            {dados.armaStatus.mobility}
                                          </strong>
                                        )}
                                      </div>
                                    </div>
                                    <div className="arma-status-extra">
                                      <span>
                                        Disparos:{" "}
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus
                                                .disparosSemDesvantagem || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "disparosSemDesvantagem",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "50px",
                                            }}
                                          />
                                        ) : (
                                          dados.armaStatus
                                            .disparosSemDesvantagem
                                        )}
                                      </span>
                                      <span>
                                        Recarga:{" "}
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus.recarga || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "recarga",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "70px",
                                            }}
                                          />
                                        ) : (
                                          dados.armaStatus.recarga
                                        )}
                                      </span>
                                      <span>
                                        Crítico:{" "}
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus.critico || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "critico",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "60px",
                                            }}
                                          />
                                        ) : (
                                          dados.armaStatus.critico
                                        )}
                                      </span>
                                      <span>
                                        Cabeça:{" "}
                                        {isEditing ? (
                                          <input
                                            value={
                                              dados.armaStatus.danoCabeca || ""
                                            }
                                            onChange={(e) =>
                                              handleArmaStatusChange(
                                                "danoCabeca",
                                                e.target.value,
                                              )
                                            }
                                            style={{
                                              background: "transparent",
                                              border: "1px solid #fff",
                                              color: "#fff",
                                              padding: "2px 4px",
                                              borderRadius: "4px",
                                              width: "50px",
                                            }}
                                          />
                                        ) : (
                                          dados.armaStatus.danoCabeca
                                        )}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Dentro do card, na parte de edição (isEditing) */}
                            {abaLojaEditor === "armas-exclusivas" && (
                              <>
                                <select
                                  value={dados.subtipo || "nenhum"}
                                  onChange={(e) =>
                                    handleChange("subtipo", e.target.value)
                                  }
                                  style={{
                                    width: "100%",
                                    background: "transparent",
                                    border: "1px solid #fff",
                                    color: "#fff",
                                    padding: "4px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  <option value="nenhum">Item Comum</option>
                                  <option value="fogo">Arma de Fogo</option>
                                  <option value="corpo">
                                    Arma Corpo a Corpo
                                  </option>
                                </select>

                                {dados.subtipo === "fogo" && !dados.armaStatus && (
                                  <div
                                    className="mestre-arma-status-editor"
                                    style={{
                                      marginTop: "8px",
                                      borderTop:
                                        "1px solid rgba(255,255,255,0.1)",
                                      paddingTop: "8px",
                                    }}
                                  >
                                    <h4
                                      style={{
                                        fontSize: "0.8rem",
                                        color: "#d4af37",
                                      }}
                                    >
                                      Características (Fogo)
                                    </h4>
                                    <div
                                      className="mestre-form-grid"
                                      style={{
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "6px",
                                      }}
                                    >
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Tipo{" "}
                                        <input
                                          value={dados.armaStatus?.tipo || ""}
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "tipo",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        DMG{" "}
                                        <input
                                          value={dados.armaStatus?.dmg || ""}
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "dmg",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        ROF{" "}
                                        <input
                                          value={dados.armaStatus?.rof || ""}
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "rof",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        MAG{" "}
                                        <input
                                          value={dados.armaStatus?.mag || ""}
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "mag",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Disparos{" "}
                                        <input
                                          value={
                                            dados.armaStatus
                                              ?.disparosSemDesvantagem || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "disparosSemDesvantagem",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Recarga{" "}
                                        <input
                                          value={
                                            dados.armaStatus?.recarga || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "recarga",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Crítico{" "}
                                        <input
                                          value={
                                            dados.armaStatus?.critico || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "critico",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Dano Cabeça{" "}
                                        <input
                                          value={
                                            dados.armaStatus?.danoCabeca || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "danoCabeca",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Hipfire{" "}
                                        <input
                                          value={
                                            dados.armaStatus?.hipfire || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "hipfire",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Precision{" "}
                                        <input
                                          value={
                                            dados.armaStatus?.precision || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "precision",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Control{" "}
                                        <input
                                          value={
                                            dados.armaStatus?.control || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "control",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Mobility{" "}
                                        <input
                                          value={
                                            dados.armaStatus?.mobility || ""
                                          }
                                          onChange={(e) =>
                                            handleArmaStatusChange(
                                              "mobility",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}

                                {dados.subtipo === "corpo" && !dados.armaStatus && (
                                  <div
                                    className="mestre-arma-status-editor"
                                    style={{
                                      marginTop: "8px",
                                      borderTop:
                                        "1px solid rgba(255,255,255,0.1)",
                                      paddingTop: "8px",
                                    }}
                                  >
                                    <h4
                                      style={{
                                        fontSize: "0.8rem",
                                        color: "#d4af37",
                                      }}
                                    >
                                      Características (Corpo a Corpo)
                                    </h4>
                                    <div
                                      className="mestre-form-grid"
                                      style={{
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "6px",
                                      }}
                                    >
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Dano{" "}
                                        <input
                                          value={dados.dano || ""}
                                          onChange={(e) =>
                                            handleChange("dano", e.target.value)
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Crítico{" "}
                                        <input
                                          value={dados.critico || "1x..."}
                                          onChange={(e) =>
                                            handleChange(
                                              "critico",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <label
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#aaa",
                                        }}
                                      >
                                        Dano Cabeça{" "}
                                        <input
                                          value={dados.danoCabeca || "0"}
                                          onChange={(e) =>
                                            handleChange(
                                              "danoCabeca",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {isEditing &&
                              dados.categoria === "armas-exclusivas" &&
                              dados.subtipo !== "nenhum" && (
                                <>
                                  <details className="mestre-aprimoramentos-exclusiva" open>
                                    <summary>
                                      Aprimoramentos da arma ({(dados.modificacoesArma || []).length}/3)
                                    </summary>
                                    <p>Adicione, remova ou substitua os aprimoramentos desta arma exclusiva.</p>
                                    <div className="mestre-aprimoramentos-lista">
                                      {MODIFICACOES.filter(
                                        (modificacao) =>
                                          modificacao.aplicavel ===
                                            (dados.subtipo === "fogo"
                                              ? "arma-fogo"
                                              : "arma-corpo") ||
                                          modificacao.aplicavel === "ambos",
                                      ).map((modificacao) => {
                                        const selecionada = (dados.modificacoesArma || []).some(
                                          (aprimoramento) => aprimoramento.id === modificacao.id,
                                        );

                                        return (
                                          <label key={modificacao.id} className="mestre-aprimoramento-opcao">
                                            <input
                                              type="checkbox"
                                              checked={selecionada}
                                              onChange={() =>
                                                alternarModificacaoArmaExclusivaEmEdicao(modificacao)
                                              }
                                            />
                                            <span>
                                              <strong>{modificacao.nome}</strong>
                                              <small>{modificacao.detalhe}</small>
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </details>

                                  <section className="mestre-aprimoramento-customizado">
                                    <div className="mestre-aprimoramento-customizado-topo">
                                      <div>
                                        <span>Exclusivo</span>
                                        <h4>Aprimoramento Customizado</h4>
                                        <p>Edite ou crie o efeito único desta arma.</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setItemEditandoDados((atual) => ({
                                            ...atual,
                                            aprimoramentoCustomizado:
                                              atual.aprimoramentoCustomizado
                                                ? null
                                                : { nome: "", detalhe: "" },
                                          }))
                                        }
                                      >
                                        {dados.aprimoramentoCustomizado
                                          ? "Remover"
                                          : "+ Criar exclusivo"}
                                      </button>
                                    </div>

                                    {dados.aprimoramentoCustomizado && (
                                      <div className="mestre-aprimoramento-customizado-form">
                                        <label>
                                          Nome do aprimoramento
                                          <input
                                            value={dados.aprimoramentoCustomizado.nome || ""}
                                            onChange={(event) =>
                                              setItemEditandoDados((atual) => ({
                                                ...atual,
                                                aprimoramentoCustomizado: {
                                                  ...atual.aprimoramentoCustomizado,
                                                  nome: event.target.value,
                                                },
                                              }))
                                            }
                                          />
                                        </label>
                                        <label>
                                          Efeito exclusivo
                                          <textarea
                                            value={dados.aprimoramentoCustomizado.detalhe || ""}
                                            onChange={(event) =>
                                              setItemEditandoDados((atual) => ({
                                                ...atual,
                                                aprimoramentoCustomizado: {
                                                  ...atual.aprimoramentoCustomizado,
                                                  detalhe: event.target.value,
                                                },
                                              }))
                                            }
                                          />
                                        </label>
                                      </div>
                                    )}
                                  </section>
                                </>
                              )}

                            {isEditing && abaLojaEditor === "defesas" && (
                              <div className="mestre-arma-status-editor" style={{ marginTop: "10px" }}>
                                <h4>Proteção concedida</h4>
                                <div className="mestre-form-grid">
                                  <label>
                                    Parte protegida
                                    <select
                                      value={dados.entrega || ""}
                                      onChange={(e) => handleChange("entrega", e.target.value)}
                                    >
                                      <option value="Cabeça">Cabeça</option>
                                      <option value="Face">Face</option>
                                      <option value="Torso">Torso</option>
                                      <option value="Braços">Braços</option>
                                      <option value="Mãos">Mãos</option>
                                      <option value="Empunhado">Empunhado</option>
                                      <option value="Pernas">Pernas</option>
                                      <option value="Pés">Pés</option>
                                      <option value="Conjunto">Conjunto completo</option>
                                    </select>
                                  </label>
                                  <label>
                                    Defesa concedida
                                    <input type="number" min="0" value={dados.defesaBonus || 0} onChange={(e) => handleChange("defesaBonus", e.target.value)} />
                                  </label>
                                  <label>
                                    Tipo de resistência
                                    <input
                                      value={dados.resistenciasDano?.[0]?.tipo || ""}
                                      onChange={(e) => handleChange("resistenciasDano", [{ tipo: e.target.value, reducao: dados.resistenciasDano?.[0]?.reducao || 0 }])}
                                      placeholder="Ex: projetil"
                                    />
                                  </label>
                                  <label>
                                    Redução de dano
                                    <input
                                      type="number"
                                      min="0"
                                      value={dados.resistenciasDano?.[0]?.reducao || 0}
                                      onChange={(e) => handleChange("resistenciasDano", [{ tipo: dados.resistenciasDano?.[0]?.tipo || "", reducao: e.target.value }])}
                                    />
                                  </label>
                                  <label>
                                    Texto de resistência
                                    <input value={dados.resistencia || ""} onChange={(e) => handleChange("resistencia", e.target.value)} />
                                  </label>
                                </div>
                              </div>
                            )}

                            {isEditing && abaLojaEditor === "municoes-especiais" && (
                              <div className="mestre-arma-status-editor" style={{ marginTop: "10px" }}>
                                <h4>Características da munição</h4>
                                <div className="mestre-form-grid">
                                  <label>
                                    Arma compatível
                                    <select value={dados.tipoArma || ""} onChange={(e) => handleChange("tipoArma", e.target.value)}>
                                      <option value="pistola">Pistola</option>
                                      <option value="escopeta">Escopeta</option>
                                      <option value="rifle">Rifle</option>
                                      <option value="fuzil">Fuzil</option>
                                      <option value="arco">Arco</option>
                                    </select>
                                  </label>
                                  <label>
                                    Quantidade por compra
                                    <input type="number" min="1" value={dados.quantidade || 0} onChange={(e) => handleChange("quantidade", e.target.value)} />
                                  </label>
                                  <label>
                                    Bônus de dano
                                    <input value={dados.bonusDano || ""} onChange={(e) => handleChange("bonusDano", e.target.value)} placeholder="Ex: 1d6" />
                                  </label>
                                  <label>
                                    Efeito especial
                                    <input value={dados.efeito || ""} onChange={(e) => handleChange("efeito", e.target.value)} />
                                  </label>
                                </div>
                              </div>
                            )}

                            <div className="loja-item-footer">
                              <span className="loja-preco">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={dados.preco}
                                    onChange={(e) =>
                                      handleChange(
                                        "preco",
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                    style={{
                                      width: "80px",
                                      background: "transparent",
                                      border: "1px solid #fff",
                                      color: "#d4af37",
                                      padding: "4px",
                                      borderRadius: "4px",
                                      fontWeight: "bold",
                                    }}
                                  />
                                ) : (
                                  `${dados.preco} cr`
                                )}
                              </span>

                              {isEditing ? (
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    onClick={salvarEdicaoInPlace}
                                    className="salvar"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={cancelarEdicaoInPlace}
                                    className="cancelar"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editarItemLojaInPlace(item);
                                    }}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removerItemLoja(item.id);
                                    }}
                                    className="perigo"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          )}

         

          {aba === "habilidades" && (
            <section className="mestre-loja">
              <div className="mestre-loja-editor-topo">
                <div>
                  <h2>Editor de Habilidades</h2>
                  <p>Organize e edite as habilidades de cada classe.</p>
                </div>
                <button
                  type="button"
                  className="mestre-btn-novo-item-loja"
                  onClick={() => {
                    limparFormHabilidade();
                    setMostrarFormHabilidade((atual) => !atual);
                  }}
                >
                  {mostrarFormHabilidade ? "Fechar formulário" : "+ Adicionar habilidade"}
                </button>
              </div>

              <nav className="mestre-ficha-tabs" aria-label="Classes de habilidades">
                {Object.entries(arvoresEditor).map(([id, arvore]) => (
                  <button
                    key={id}
                    type="button"
                    className={classeArvoreAtiva === id ? "ativa" : ""}
                    onClick={() => {
                      setClasseArvoreAtiva(id);
                      setEspecialidadeEditorId(
                        tipoHabilidadeEditor === "especialidade"
                          ? arvore.especialidades?.[0]?.id || ""
                          : "",
                      );
                      limparFormHabilidade();
                      cancelarEdicaoHabilidadeCard();
                    }}
                  >
                    {arvore.classe || id}
                  </button>
                ))}
              </nav>

              <nav className="mestre-ficha-tabs mestre-habilidades-subabas" aria-label="Categorias de habilidades">
                {[
                  { id: "absolutas", nome: "Habilidades Absolutas" },
                  { id: "aptidoes", nome: "Aptidões" },
                  { id: "especialidade", nome: "Especialidades" },
                ].map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    className={tipoHabilidadeEditor === tipo.id ? "ativa" : ""}
                    onClick={() => {
                      setTipoHabilidadeEditor(tipo.id);
                      setEspecialidadeEditorId(
                        tipo.id === "especialidade"
                          ? arvoresEditor[classeArvoreAtiva]
                              ?.especialidades?.[0]?.id || ""
                          : "",
                      );
                      limparFormHabilidade();
                      cancelarEdicaoHabilidadeCard();
                    }}
                  >
                    {tipo.nome}
                  </button>
                ))}
              </nav>

              {tipoHabilidadeEditor === "especialidade" && (
                <nav
                  className="mestre-ficha-tabs mestre-habilidades-subabas"
                  aria-label="Especialidades"
                >
                  {(arvoresEditor[classeArvoreAtiva]?.especialidades || []).map(
                    (especialidade) => (
                      <button
                        key={especialidade.id}
                        type="button"
                        className={
                          especialidadeEditorId === especialidade.id
                            ? "ativa"
                            : ""
                        }
                        onClick={() => {
                          setEspecialidadeEditorId(especialidade.id);
                          cancelarEdicaoHabilidadeCard();
                        }}
                      >
                        {especialidade.nome}
                      </button>
                    ),
                  )}
                </nav>
              )}

              {mostrarFormHabilidade && (
              <form
                className="mestre-loja-form"
                onSubmit={salvarHabilidadeEditor}
              >
                <h3>
                  {habilidadeEditando
                    ? "Editando habilidade"
                    : "Nova habilidade"}
                </h3>

                <label className="mestre-habilidade-contexto">
                  Classe
                  <select
                    value={classeArvoreAtiva}
                    onChange={(e) => {
                      setClasseArvoreAtiva(e.target.value);
                      setEspecialidadeEditorId("");
                      limparFormHabilidade();
                    }}
                  >
                    {Object.entries(arvoresEditor).map(([id, arvore]) => (
                      <option key={id} value={id}>
                        {arvore.classe || id}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mestre-habilidade-contexto">
                  Tipo
                  <select
                    value={tipoHabilidadeEditor}
                    onChange={(e) => {
                      setTipoHabilidadeEditor(e.target.value);
                      limparFormHabilidade();
                    }}
                  >
                    <option value="absolutas">Habilidades Absolutas</option>
                    <option value="aptidoes">Aptidões</option>
                    <option value="especialidade">
                      Habilidades de Especialidade
                    </option>
                  </select>
                </label>

                {tipoHabilidadeEditor === "especialidade" && (
                  <label className="mestre-habilidade-contexto">
                    Especialidade
                    <select
                      value={especialidadeEditorId}
                      onChange={(e) => setEspecialidadeEditorId(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {(
                        arvoresEditor[classeArvoreAtiva]?.especialidades || []
                      ).map((esp) => (
                        <option key={esp.id} value={esp.id}>
                          {esp.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Nome
                  <input
                    value={formHabilidade.nome}
                    onChange={(e) =>
                      setFormHabilidade((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Custo
                  <input
                    value={formHabilidade.custo}
                    onChange={(e) =>
                      setFormHabilidade((prev) => ({
                        ...prev,
                        custo: e.target.value,
                      }))
                    }
                    placeholder="Ex: 2 PE, Passiva, Reação..."
                  />
                </label>

                <label>
                  Descrição
                  <textarea
                    value={formHabilidade.descricao}
                    onChange={(e) =>
                      setFormHabilidade((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                  />
                </label>

                <div className="mestre-loja-form-acoes">
                  <button type="submit">
                    {habilidadeEditando
                      ? "Salvar alteração"
                      : "Criar habilidade"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      limparFormHabilidade();
                      setMostrarFormHabilidade(false);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
              )}

              <div className="mestre-catalogo-area">
                <div className="mestre-catalogo">
                  {(() => {
                    const arvoreAtual = arvoresEditor[classeArvoreAtiva] || {};

                    const lista =
                      tipoHabilidadeEditor === "especialidade"
                        ? (arvoreAtual.especialidades || []).find(
                            (esp) => esp.id === especialidadeEditorId,
                          )?.habilidades || []
                        : arvoreAtual[tipoHabilidadeEditor] || [];

                    return lista.map((habilidade) => {
                      const editando =
                        habilidadeEditandoCardId === habilidade.id;
                      const dados = editando
                        ? habilidadeEditandoDados
                        : habilidade;

                      return (
                        <article
                          key={habilidade.id}
                          className={`mestre-habilidade-card ${editando ? "editando" : ""}`}
                        >
                          <div className="mestre-habilidade-card-topo">
                            <span>{tipoHabilidadeEditor}</span>
                            <div className="mestre-habilidade-card-acoes">
                              {editando ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={salvarEdicaoHabilidadeCard}
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelarEdicaoHabilidadeCard}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="mestre-botao-editar"
                                    onClick={() =>
                                      iniciarEdicaoHabilidadeCard(habilidade)
                                    }
                                    aria-label={`Editar ${habilidade.nome}`}
                                  >
                                    <Icon path={mdiPencil} size={0.8} />
                                  </button>
                                  <button
                                    type="button"
                                    className="perigo"
                                    onClick={() =>
                                      excluirHabilidadeEditor(habilidade.id)
                                    }
                                    aria-label={`Excluir ${habilidade.nome}`}
                                  >
                                    <Icon path={mdiDeleteOutline} size={0.8} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {editando ? (
                            <div className="mestre-habilidade-card-form">
                              <label>
                                Nome
                                <input
                                  value={dados?.nome || ""}
                                  onChange={(event) =>
                                    setHabilidadeEditandoDados((atual) => ({
                                      ...atual,
                                      nome: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                Custo
                                <input
                                  value={dados?.custo || ""}
                                  onChange={(event) =>
                                    setHabilidadeEditandoDados((atual) => ({
                                      ...atual,
                                      custo: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                Descrição
                                <textarea
                                  value={dados?.descricao || ""}
                                  onChange={(event) =>
                                    setHabilidadeEditandoDados((atual) => ({
                                      ...atual,
                                      descricao: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                            </div>
                          ) : (
                            <>
                              <h3>{dados.nome}</h3>
                              <p>{dados.descricao || "Sem descrição."}</p>
                              {dados.custo && (
                                <small className="mestre-habilidade-custo">
                                  {dados.custo}
                                </small>
                              )}
                            </>
                          )}
                        </article>
                      );
                    });
                  })()}
                </div>
              </div>
            </section>
          )}
          {aba === "analises" && (
            <section className="mestre-analises">
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
                      key={habilidade.id}
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
                      <h3>{habilidade.nome}</h3>
                      <p>{habilidade.descricao}</p>
                      <div className="mestre-analise-acoes">
                        <button
                          type="button"
                          className="aprovar"
                          onClick={() =>
                            analisarHabilidadeCriada(ficha, habilidade.id, true)
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
                            )
                          }
                        >
                          Recusar e devolver custo
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
          {aba === "marcas" && (
            <section className="marcas-wrapper">
              {/* LAYOUT PRINCIPAL: FORM + LISTA */}
              <div className="marcas-layout">
                {/* FORMULÁRIO */}
                <form
                  className="marcas-form"
                  onSubmit={marcaEditando ? salvarEdicaoMarca : criarMarca}
                >
                  <h3>{marcaEditando ? "Editar Marca" : "Nova Marca"}</h3>

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
                      placeholder="Descreva a essência da marca..."
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
                    <h3>Atribuir Marca a um Jogador</h3>

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
                        Marca
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
                    <span>Marcas existentes ({marcas.length})</span>
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
                        Nenhuma marca criada ainda.
                      </div>
                    )}
                    {marcas.map((marca) => (
                      <div key={marca.id} className="marcas-card">
                        <div className="marcas-card-topo">
                          <div>
                            <span className="marcas-tag">MARCA</span>
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
                <span>Tempo real</span>
                <h3>Rolagens dos Jogadores</h3>
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
                            d{dado.faces}: {dado.valor}
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
