import ShieldInitiativeStrip from '../components/tabletop/ShieldInitiativeStrip';
import InlineInitiative from '../components/tabletop/InlineInitiative';
import ParticipantDossiers from '../components/tabletop/ParticipantDossiers';
import {nextCombatTurn} from '../utils/combatTurn';
import CombatTurnControls from '../components/tabletop/CombatTurnControls';
import {initiativeOrder} from '../utils/initiativeOrder';
import PlayerInitiativeBar from '../components/tabletop/PlayerInitiativeBar';
import SurvivalIndicators from '../components/campanha/SurvivalIndicators';
import InitiativeCards from '../components/tabletop/InitiativeCards';
import {specialSceneMediaType} from '../utils/specialSceneMedia';
import {SpecialSceneMedia} from '../components/tabletop/SpecialScene';
import RollNotifications from '../components/tabletop/RollNotifications';
import MasterShield from '../components/tabletop/MasterShield';
import { SpecialMechanicsBanner, SpecialMechanicsDialog } from '../components/tabletop/SpecialMechanics';
import RevoltPlayerHUD, { hasActiveRevolt } from '../components/tabletop/RevoltPlayerHUD';
import NumberInput from '../components/ui/NumberInput';
import AnimatedScene from '../components/tabletop/AnimatedScene';
import TabletopSceneEditor from '../components/tabletop/TabletopSceneEditor';
import AnimatedTokenImage from '../components/tokens/AnimatedTokenImage';
import EspiralEncounterViewer from '../components/espiral/EspiralEncounterViewer';
import { readEspiralEncounters, espiralEncounterForTabletop, ESPIRAL_ENCOUNTERS_CHANGED } from '../utils/espiralEncounters';
import EvidenceImageViewer from "../components/campanha/EvidenceImageViewer";
import { ACEITAR_AUDIO } from "../utils/audioUpload";
import {createPortal} from "react-dom";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Icon from "@mdi/react";
import ReprodutorCassete from "../components/midia/ReprodutorCassete";
import ComputadorModerno from "../components/ui/ComputadorModerno";
import { confirmarDialogo } from "../components/ui/DialogoGlobal";
import { mdiAccountPlusOutline, mdiArrowLeft, mdiChevronDown, mdiChevronRight, mdiClose, mdiDeleteOutline, mdiFileDocumentMultipleOutline, mdiFolderOutline, mdiFitToScreenOutline, mdiFlashlight, mdiFlashlightOff, mdiImageOutline, mdiLightbulbOnOutline, mdiMagnify, mdiMagnifyMinusOutline, mdiMagnifyPlusOutline, mdiMapOutline, mdiMusicBoxMultipleOutline, mdiPencilOutline, mdiPlay, mdiPlus, mdiRefresh, mdiRotateRight, mdiShieldCrownOutline, mdiStoreOutline, mdiViewDashboardOutline, mdiUploadOutline } from "@mdi/js";
import { salvarTurnoCombate, ativarCena, atualizarEstadoMusica, atualizarEstadoSoundpad, atualizarInimigoCampanha, atualizarModoCampanha, atualizarModoCombate, atualizarModoInvestigacao, atualizarRevelacaoDocumentoInvestigacao, atualizarVisibilidadeDocumentoInvestigacao, buscarCampanhaPorCodigo, definirIniciativa, definirRotacaoToken, definirTamanhoToken, chavePosicaoMapa, configurarLanternaToken, definirVisibilidadeToken, desvincularInimigo, enviarImagemCena, excluirCena, excluirDocumentoInvestigacao, moverToken, ouvirCampanha, posicionarFichaNoMapa, posicionarInimigoNoMapa, registrarRolagem, removerIniciativa, removerTokenDoMapa, salvarCena, salvarDocumentoInvestigacao, salvarEvidenciaInterativa, validarArquivoImagem, validarArquivoInvestigacao, vincularFicha, vincularInimigo } from "../services/mesaApi";
import {
  ouvirPersonagens,
} from "../services/personagemApi";
import { listarFichasParaCampanha } from "../services/fichasCampanha";
import { supabaseConfigurado } from "../services/supabase";
import "../data/Classes/arvoresHabilidades";
import { condicoes } from "../data/criacao/condicoes";
import AnotacoesCampanha from "../components/campanha/AnotacoesCampanha";
import MusicaTabletop from "../components/tabletop/MusicaTabletop";
import SoundpadTabletop from "../components/tabletop/SoundpadTabletop";
import MapLightingLayer, {
  pontoVisivelPorLuz,
  pontoVisivelPorObservadores,
} from "../components/tabletop/MapLightingLayer";
import "../styles/Mesa.css";
import "../styles/Mesa2D.css";
import { estiloBordaToken } from "../utils/tokenAppearance";
import { limitarMovimentoToken } from "../utils/tokenCollision";
import { cenaVisivelParaJogador } from "../utils/sceneVisibility";
import {
  SENHA_MESTRE,
  TABLETOP_3D_AUTH_KEY,
} from "../constants/masterAccess";

const cenaVazia = {
  nome: "",
  descricao: "",
  pasta: "Sem pasta",
  imagemUrl: "",
  mapaUrl: "",
  imagensCena: [],
  mapasBatalha: [],
  cenaEspecial: null,
  larguraGrade: 12,
  alturaGrade: 8,
  lojaDisponivel: false,
  visualizarTodos: true,
  jogadoresVisiveis: [],
};
const idMidiaLocal = (tipo = "midia") =>
  `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const extrairYoutubeId = (valor) => {
  try {
    const url = new URL(String(valor || "").trim());
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0];
    if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2];
    return url.searchParams.get("v") || "";
  } catch {
    return String(valor || "").match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1] || "";
  }
};
const midiasDaCena = (cena, tipo) =>
  tipo === "mapa" ? cena?.mapasBatalha || [] : cena?.imagensCena || [];
const urlCena = (cena, tipo, midiaId = null) => {
  const midias = midiasDaCena(cena, tipo);
  const midia = midias.find((item) => item.id === midiaId) || midias[0];
  return (
    midia?.url ||
    (tipo === "mapa"
      ? cena?.mapa_url || cena?.mapaUrl
      : cena?.imagem_url || cena?.imagemUrl)
  );
};
const percentualRecurso = (recurso) =>
  recurso?.max > 0
    ? Math.max(
        0,
        Math.min(100, ((Number(recurso.atual) || 0) / recurso.max) * 100),
      )
    : 0;
const NOMES_MEMBROS_MESA = {
  cabeca: "CAB",
  torso: "TOR",
  bracoDireito: "BD",
  bracoEsquerdo: "BE",
  pernaDireita: "PD",
  pernaEsquerda: "PE",
};
const MEMBROS_INIMIGO_MESA = [
  ["cabeca", "Cabeça"],
  ["torso", "Torso"],
  ["bracoDireito", "Braço direito"],
  ["bracoEsquerdo", "Braço esquerdo"],
  ["pernaDireita", "Perna direita"],
  ["pernaEsquerda", "Perna esquerda"],
];
const ControleVitalInimigo = ({ nome, recurso, aoAlterar, tipo = "" }) => {
  const atual = Number(recurso?.atual) || 0;
  const max = Number(recurso?.max) || 0;
  const [ajuste, setAjuste] = useState("");
  const percentual =
    max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;
  const estado =
    percentual <= 25 ? "critico" : percentual <= 50 ? "ferido" : "saudavel";
  const aplicarAjuste = (operacao) => {
    const quantidade = Math.max(0, Number(ajuste) || 0);
    if (!quantidade) return;
    const resultado =
      operacao === "subtrair" ? atual - quantidade : atual + quantidade;
    aoAlterar(Math.max(0, max ? Math.min(max, resultado) : resultado));
    setAjuste("");
  };
  return (
    <div className={`inimigo-vital ${tipo} ${estado}`}>
      <div>
        <span>{nome}</span>
        <b>
          {atual} / {max}
        </b>
      </div>
      <i>
        <em style={{ width: `${percentual}%` }} />
      </i>
      <div className="inimigo-vital-controles">
        <button
          type="button"
          onClick={() => aplicarAjuste("subtrair")}
          disabled={!Number(ajuste)}
          aria-label={`Subtrair de ${nome}`}
          title={`Subtrair de ${nome}`}
        >
          −
        </button>
        <NumberInput
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="Valor"
          value={ajuste}
          onChange={(event) =>
            setAjuste(event.target.value.replace(/[^0-9]/g, ""))
          }
          aria-label={`Valor para alterar ${nome}`}
        />
        <button
          type="button"
          onClick={() => aplicarAjuste("somar")}
          disabled={!Number(ajuste)}
          aria-label={`Somar em ${nome}`}
          title={`Somar em ${nome}`}
        >
          +
        </button>
      </div>
    </div>
  );
};
const recursosParticipante = (personagem) => {
  if (!personagem) return [];
  const recursos = [
    { id: "sanidade", nome: "SAN", valor: personagem.sanidade },
    { id: "esperanca", nome: "ESP", valor: personagem.esperanca },
  ];
  Object.entries(NOMES_MEMBROS_MESA).forEach(([id, nome]) => {
    const valor = personagem.membros?.[id];
    if (valor) recursos.push({ id: `membro-${id}`, nome, valor, membro: true });
  });
  return recursos;
};
const classeRecursoParticipante = (recurso) => {
  if (!recurso.membro) return recurso.id;
  const percentual = percentualRecurso(recurso.valor);
  const estado =
    percentual <= 25 ? "critico" : percentual <= 50 ? "ferido" : "saudavel";
  return `membro ${estado}`;
};
const nomesCondicoesMesa = Object.fromEntries(
  condicoes.map((condicao) => [condicao.classe, condicao.nome]),
);
const classesCondicoesMesa = (personagem) =>
  (personagem?.condicoesAtivas || []).join(" ");
const ResumoCondicoesParticipante = ({ personagem }) => {
  const ativas = personagem?.condicoesAtivas || [];
  return (
    <div className="participante-condicoes" aria-label="Condicoes atuais">
      {ativas.length ? (
        ativas.map((condicao) => (
          <span key={condicao}>{nomesCondicoesMesa[condicao] || condicao}</span>
        ))
      ) : (
        <span className="sem-condicoes">Sem condições</span>
      )}
    </div>
  );
};
const dataToken = (token) => {
  const tempo = Date.parse(token?.atualizado_em || "");
  return Number.isFinite(tempo) ? tempo : 0;
};
const aceitarTokenRemoto = (atual, remoto) => {
  if (!atual) return true;
  const dataAtual = dataToken(atual);
  const dataRemota = dataToken(remoto);
  if (dataAtual && dataRemota) return dataRemota >= dataAtual;
  return true;
};
const eventoMudaApresentacao = (evento, campanha) => {
  if (evento?.detail?.estado) {
    const estado = evento.detail.estado;
    return (
      estado.cenaAtivaId !== campanha?.cenaAtiva?.id ||
      estado.modo !== campanha?.modo ||
      (estado.midiaAtivaId || null) !== (campanha?.midiaAtivaId || null)
    );
  }
  if (evento?.table !== "campanhas") return false;
  const novo = evento.new || {};
  return (
    (novo.cena_ativa_id != null &&
      novo.cena_ativa_id !== campanha?.cenaAtiva?.id) ||
    (novo.modo != null && novo.modo !== campanha?.modo) ||
    (Object.prototype.hasOwnProperty.call(novo, "midia_ativa_id") &&
      (novo.midia_ativa_id || null) !== (campanha?.midiaAtivaId || null))
  );
};
const corInterfaceDaImagem = (url) =>
  new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("Cena sem imagem"));
      return;
    }
    const imagem = new Image();
    if (/^https?:/i.test(url)) imagem.crossOrigin = "anonymous";
    imagem.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const contexto = canvas.getContext("2d", { willReadFrequently: true });
        contexto.drawImage(imagem, 0, 0, 64, 64);
        const pixels = contexto.getImageData(0, 0, 64, 64).data;
        const grupos = new Map();
        for (let indice = 0; indice < pixels.length; indice += 16) {
          const r = pixels[indice];
          const g = pixels[indice + 1];
          const b = pixels[indice + 2];
          const a = pixels[indice + 3];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const luminosidade = (max + min) / 2;
          if (
            a < 180 ||
            luminosidade < 22 ||
            luminosidade > 238 ||
            max - min < 12
          )
            continue;
          const chave = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
          grupos.set(
            chave,
            (grupos.get(chave) || 0) + 1 + Math.round((max - min) / 45),
          );
        }
        const dominante = [...grupos.entries()].sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0];
        if (!dominante) throw new Error("Sem cor dominante");
        let [r, g, b] = dominante.split(",").map(Number);
        const maior = Math.max(r, g, b);
        if (maior < 150) {
          const escala = 170 / Math.max(maior, 1);
          r *= escala;
          g *= escala;
          b *= escala;
        }
        resolve(
          `rgb(${Math.min(235, Math.round(r))},${Math.min(235, Math.round(g))},${Math.min(235, Math.round(b))})`,
        );
      } catch (error) {
        reject(error);
      }
    };
    imagem.onerror = reject;
    imagem.src = url;
  });

const Mesa = ({embedded=false,requestedTool="",requestVersion=0,tabletopMapId="",documentsOnly=false,shieldTool=""}) => {
  const turnBusyRef=useRef(false);
  const [turnBusy,setTurnBusy]=useState(false);
  const [mechanicsOpen, setMechanicsOpen] = useState(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const codigo = (params.get("campanha") || "DARK26").toUpperCase();
  const mestre = params.get("papel") === "mestre";
  const fichaUrl = params.get("senha") || params.get("ficha") || "";
  const urlRetorno = useMemo(() => {
    if (mestre) return "/?mestre=1";
    const retorno = new URLSearchParams();
    if (params.get("ficha")) retorno.set("ficha", params.get("ficha"));
    if (params.get("senha")) retorno.set("senha", params.get("senha"));
    return retorno.toString() ? `/?${retorno.toString()}` : "/";
  }, [mestre, params]);
  const telaMobileInicial =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 760px)").matches;
  const [campanha, setCampanha] = useState(null);
  const campanhaRef = useRef(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [bibliotecaAberta, setBibliotecaAberta] = useState(
    embedded && mestre && !telaMobileInicial,
  );
  const [midiasRecolhidas, setMidiasRecolhidas] = useState(true);
  const [anotacoesAbertas, setAnotacoesAbertas] = useState(false);
  const [musicaAberta, setMusicaAberta] = useState(false);
  const [soundpadAberto, setSoundpadAberto] = useState(false);
  const [aplicativoMesaAberto, setAplicativoMesaAberto] = useState(null);
  const [senha3DAberta, setSenha3DAberta] = useState(false);
  const [senha3D, setSenha3D] = useState("");
  const [erroSenha3D, setErroSenha3D] = useState("");
  const [editorAberto, setEditorAberto] = useState(false);
  const [editando, setEditando] = useState(cenaVazia);
  const [arquivos, setArquivos] = useState({ cena: [], mapa: [], especial: [], audio: [] });
  const [salvando, setSalvando] = useState(false);
  const [transicao, setTransicao] = useState(false);
  const playerSceneTransition=useRef({revision:0,timer:null,disposed:false});
  useEffect(()=>{playerSceneTransition.current.disposed=false;return ()=>{playerSceneTransition.current.disposed=true;playerSceneTransition.current.revision+=1;clearTimeout(playerSceneTransition.current.timer);};},[]);
  const [escudoAberto,setEscudoAberto]=useState(false);
  const audioCenaEspecialRef = useRef(null);
  const [audioEspecialPronto, setAudioEspecialPronto] = useState(false);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [erroFichas, setErroFichas] = useState("");
  const [fichaParaVincular, setFichaParaVincular] = useState("");
  const [personagens, setPersonagens] = useState({});
  const [, setFichaAberta] = useState(null);
  const [tokenArrastando, setTokenArrastando] = useState(null);
  const movimentoTokenRef = useRef(null);
  const [tokenGirando, setTokenGirando] = useState(null);
  const rotacaoPendenteRef = useRef(null);
  const [menuTokenAberto, setMenuTokenAberto] = useState(null);
  const tokensEmGravacaoRef = useRef(new Set());
  const posicoesTokensPendentesRef = useRef(new Map());
  const [zoomMapa, setZoomMapa] = useState(1);
  const [panMapa, setPanMapa] = useState({ x: 0, y: 0 });
  const [proporcaoMapa, setProporcaoMapa] = useState({ largura: 1, altura: 1 });
  const [mapaArrastando, setMapaArrastando] = useState(false);
  const [editorIluminacaoAberto, setEditorIluminacaoAberto] = useState(false);
  const [configuracaoIluminacao, setConfiguracaoIluminacao] = useState(null);
  const [salvandoIluminacao, setSalvandoIluminacao] = useState(false);
  const salvamentoIluminacaoTimerRef = useRef(null);
  const filaIluminacaoRef = useRef(Promise.resolve());
  const iluminacaoPendenteRef = useRef(null);
  const inicioPanMapaRef = useRef(null);
  const ponteirosMapaRef = useRef(new Map());
  const inicioPincaMapaRef = useRef(null);
  const [abaLateralMestre, setAbaLateralMestre] = useState(
    embedded && !telaMobileInicial ? "participantes" : "",
  );
  const [abaLateralJogador, setAbaLateralJogador] = useState(
    embedded && !telaMobileInicial ? "participantes" : "",
  );
  const [focoVisual, setFocoVisual] = useState(!embedded);
  useEffect(() => {
    if(!embedded || !requestedTool) return;
    setBibliotecaAberta(requestedTool==='scenes');
    setAnotacoesAbertas(requestedTool==='notes');
    setMusicaAberta(requestedTool==='audio');
    setSoundpadAberto(requestedTool==='soundpad');
    const panel=requestedTool==='evidence' ? 'documentos' : requestedTool==='npcs' ? 'inimigos' : ['participants','initiative','combat','investigation'].includes(requestedTool) ? 'participantes' : '';
    setAplicativoMesaAberto(requestedTool==='dashboard' ? 'dashboard' : requestedTool==='shop' ? 'loja' : null);
    if(mestre) setAbaLateralMestre(panel);
    else setAbaLateralJogador(panel);
  },[embedded,requestedTool,requestVersion,mestre]);
  const [catalogoInimigos, setCatalogoInimigos] = useState([]);
  const [inimigoParaAdicionar, setInimigoParaAdicionar] = useState("");
  const [inimigoAberto, setInimigoAberto] = useState(null);
  const [subAbaNpcs, setSubAbaNpcs] = useState("inimigos");
  const [pastasNpcsFechadas, setPastasNpcsFechadas] = useState({});
  const [pastasCenasFechadas, setPastasCenasFechadas] = useState({});
  const [corCena, setCorCena] = useState("");
  const [salvandoCombate, setSalvandoCombate] = useState(false);
  const [salvandoInvestigacao, setSalvandoInvestigacao] = useState(false);
  const [iniciativasRascunho, setIniciativasRascunho] = useState({});
  const [documentoAberto, setDocumentoAberto] = useState(null);
  const [abaEvidenciaInterativa, setAbaEvidenciaInterativa] = useState("terminal");
  const [visibilidadeDocumentoEditando, setVisibilidadeDocumentoEditando] = useState(null);
  const [salvandoVisibilidadeDocumento, setSalvandoVisibilidadeDocumento] = useState(false);
  const [enviandoDocumento, setEnviandoDocumento] = useState(false);
  const [enviandoDocumentoPreparadoId, setEnviandoDocumentoPreparadoId] = useState("");
  const [estadoEnvioDocumento, setEstadoEnvioDocumento] = useState("");
  const [novoDocumento, setNovoDocumento] = useState({
    nome: "",
    descricao: "",
    categoria: "evidencia",
    modeloInterativo: "msdos",
    arquivo: null,
    visualizarTodos: true,
    jogadoresVisiveis: [],
  });
  const arquivoDocumentoRef = useRef(null);
  const [fichaJogadorId, setFichaJogadorId] = useState(
    () =>
      (params.get("sistema")==="espiral" && fichaUrl ? `espiral:${fichaUrl.replace(/^espiral:/,"")}` : fichaUrl) ||
      localStorage.getItem(`darkness_mesa_ficha_${codigo}`) ||
      localStorage.getItem("fichaRPG_ultimaFicha") ||
      "",
  );
  const cenaAtivaVisivel =
    mestre || cenaVisivelParaJogador(campanha?.cenaAtiva, fichaJogadorId)
      ? campanha?.cenaAtiva
      : null;
  const cenaRestrita =
    !mestre && Boolean(campanha?.cenaAtiva) && !cenaAtivaVisivel;
  useEffect(() => {
    if (
      !mestre &&
      aplicativoMesaAberto === "loja" &&
      !cenaAtivaVisivel?.lojaDisponivel
    ) setAplicativoMesaAberto(null);
  }, [aplicativoMesaAberto, cenaAtivaVisivel?.lojaDisponivel, mestre]);
  const modoIniciativaAtivo = Boolean(
    campanha?.combateAtivo || campanha?.investigacaoAtiva,
  );
  // Forca uma remontagem limpa da lateral quando o tipo de modo muda.
  // Isso evita que a arvore anterior de Participantes permaneça visualmente
  // junto da nova arvore de Iniciativa durante a atualizacao em tempo real.
  const chavePainelParticipantes = campanha?.combateAtivo
    ? "combate"
    : campanha?.investigacaoAtiva
      ? "investigacao"
      : "normal";
  const documentosDisponiveis = campanha?.documentosInvestigacao || [];
  const nomeDocumentoExibicao = (documento) => {
    const computadorModerno = String(
      documento?.mimeType || documento?.mime_type || "",
    ).includes("modern-pc");
    if (computadorModerno && (!documento?.nome || documento.nome === "Terminal MS-DOS"))
      return "Computador moderno";
    return documento?.nome || (computadorModerno ? "Computador moderno" : "Documento");
  };
  const documentoVisivelParaFicha = useCallback(
    (documento, fichaId = fichaJogadorId) => {
      if (!documento) return false;
      if (documento.visualizarTodos !== false) return true;
      if (!fichaId) return false;
      return (documento.jogadoresVisiveis || []).some(
        (id) => String(id) === String(fichaId),
      );
    },
    [fichaJogadorId],
  );
  const documentosVisiveisJogador = documentosDisponiveis.filter((documento) =>
    documento.revelada !== false && documentoVisivelParaFicha(documento),
  );
  // Documentos compartilhados pertencem a campanha, nao ao estado temporario
  // da investigacao. A aba deve continuar acessivel antes e depois desse modo.
  const mostrarDocumentosJogador = true;

  useEffect(() => {
    if (mestre || !documentoAberto) return;
    if (!documentoVisivelParaFicha(documentoAberto)) {
      setDocumentoAberto(null);
    }
  }, [mestre, documentoAberto, documentoVisivelParaFicha]);

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const dados = await buscarCampanhaPorCodigo(codigo);
      if(!mestre && !embedded && dados && campanhaRef.current) {
        const previous=campanhaRef.current;
        const changed=previous.cenaAtiva?.id!==dados.cenaAtiva?.id || previous.modo!==dados.modo || (previous.midiaAtivaId || null)!==(dados.midiaAtivaId || null);
        if(changed) {
          const state=playerSceneTransition.current;
          const revision=++state.revision;
          clearTimeout(state.timer);
          setTransicao(true);
          await new Promise(resolve=>setTimeout(resolve,360));
          if(state.disposed || revision!==state.revision)return;
          state.timer=setTimeout(()=>setTransicao(false),700);
        }
      }
      setCampanha((atual) => {
        if (!dados || !atual) return dados;
        const protegidos = new Map(
          atual.tokens
            .filter((token) => tokensEmGravacaoRef.current.has(token.id))
            .map((token) => [token.id, token]),
        );
        const atuais = new Map(
          (atual.tokens || []).map((token) => [token.id, token]),
        );
        const tokens = (dados.tokens || []).map((token) => {
          const protegido = protegidos.get(token.id);
          if (protegido) return protegido;
          const existente = atuais.get(token.id);
          const pendente = posicoesTokensPendentesRef.current.get(token.id);
          if (pendente) {
            const posicaoRemota = token.posicoes?.[pendente.mapaChave] || token;
            const confirmou =
              Math.abs(Number(posicaoRemota.x) - pendente.x) < 0.001 &&
              Math.abs(Number(posicaoRemota.y) - pendente.y) < 0.001;
            if (confirmou) posicoesTokensPendentesRef.current.delete(token.id);
            else return existente || token;
          }
          return aceitarTokenRemoto(existente, token) ? token : existente;
        });
        protegidos.forEach((token, id) => {
          if (!tokens.some((item) => item.id === id)) tokens.push(token);
        });
        return { ...dados, tokens };
      });
      if (!dados) setErro("Campanha nao encontrada.");
    } catch (error) {
      setErro(error.message || "Nao foi possivel carregar a mesa.");
    } finally {
      setCarregando(false);
    }
  }, [codigo,mestre,embedded]);

  useEffect(() => {
    carregar();
  }, [carregar]);
  useEffect(() => {
    campanhaRef.current = campanha;
  }, [campanha]);
  useEffect(
    () =>
      campanha?.id
        ? ouvirCampanha(campanha.id, (evento) => {
            if (evento?.tipo === "tokens_sincronizados") {
              setCampanha((atual) => {
                if (!atual) return atual;
                const mapaChave = chavePosicaoMapa(
                  atual.cenaAtiva?.id,
                  atual.midiaAtivaId,
                );
                const tokens = (evento.tokens || []).map((token) => {
                  const pendente = posicoesTokensPendentesRef.current.get(
                    token.id,
                  );
                  if (pendente) {
                    const posicaoRemota =
                      token.posicoes?.[pendente.mapaChave] || token;
                    const confirmou =
                      Math.abs(Number(posicaoRemota.x) - pendente.x) < 0.001 &&
                      Math.abs(Number(posicaoRemota.y) - pendente.y) < 0.001;
                    if (confirmou)
                      posicoesTokensPendentesRef.current.delete(token.id);
                    else
                      return (
                        atual.tokens.find((item) => item.id === token.id) ||
                        token
                      );
                  }
                  if (tokensEmGravacaoRef.current.has(token.id)) {
                    return (
                      atual.tokens.find((item) => item.id === token.id) || token
                    );
                  }
                  const tokenAtual = atual.tokens.find(
                    (item) => item.id === token.id,
                  );
                  if (!aceitarTokenRemoto(tokenAtual, token)) return tokenAtual;
                  const estadoMapa = {
                    ...(token.posicoes?.[mapaChave] || {}),
                    ...(token.posicoes?.[`__estado:${mapaChave}`] || {}),
                  };
                  return { ...token, ...estadoMapa };
                });
                atual.tokens.forEach((token) => {
                  if (
                    tokensEmGravacaoRef.current.has(token.id) &&
                    !tokens.some((item) => item.id === token.id)
                  )
                    tokens.push(token);
                });
                return { ...atual, tokens };
              });
              return;
            }
            if (evento?.table === "tokens_mapa") {
              const tokenRecebido = evento.new;
              const tokenRemovidoId = evento.old?.id;
              setCampanha((atual) => {
                if (!atual) return atual;
                if (evento.eventType === "DELETE") {
                  if (tokensEmGravacaoRef.current.has(tokenRemovidoId))
                    return atual;
                  return {
                    ...atual,
                    tokens: atual.tokens.filter(
                      (token) => token.id !== tokenRemovidoId,
                    ),
                  };
                }
                if (
                  !tokenRecebido?.id ||
                  tokensEmGravacaoRef.current.has(tokenRecebido.id)
                ) {
                  return atual;
                }
                const pendente = posicoesTokensPendentesRef.current.get(
                  tokenRecebido.id,
                );
                if (pendente) {
                  const posicaoRemota =
                    tokenRecebido.posicoes?.[pendente.mapaChave] ||
                    tokenRecebido;
                  const confirmou =
                    Math.abs(Number(posicaoRemota.x) - pendente.x) < 0.001 &&
                    Math.abs(Number(posicaoRemota.y) - pendente.y) < 0.001;
                  if (!confirmou) return atual;
                  posicoesTokensPendentesRef.current.delete(tokenRecebido.id);
                }
                const tokenAtual = atual.tokens.find(
                  (token) => token.id === tokenRecebido.id,
                );
                if (!aceitarTokenRemoto(tokenAtual, tokenRecebido))
                  return atual;
                const mapaChave = chavePosicaoMapa(
                  atual.cenaAtiva?.id,
                  atual.midiaAtivaId,
                );
                const estadoMapa = {
                  ...(tokenRecebido.posicoes?.[mapaChave] || {}),
                  ...(tokenRecebido.posicoes?.[`__estado:${mapaChave}`] || {}),
                };
                const tokenAtualizado = { ...tokenRecebido, ...estadoMapa };
                const existe = atual.tokens.some(
                  (token) => token.id === tokenRecebido.id,
                );
                return {
                  ...atual,
                  tokens: existe
                    ? atual.tokens.map((token) =>
                        token.id === tokenRecebido.id ? tokenAtualizado : token,
                      )
                    : [...atual.tokens, tokenAtualizado],
                };
              });
              return;
            }
            if (!mestre || !eventoMudaApresentacao(evento, campanhaRef.current)) {
              carregar();
              return;
            }
            setTransicao(true);
            setTimeout(carregar, 320);
            setTimeout(() => setTransicao(false), 1000);
          })
        : undefined,
    [campanha?.id, carregar,mestre],
  );
  useEffect(() => {
    const url = urlCena(
      cenaAtivaVisivel,
      campanha?.modo,
      campanha?.midiaAtivaId,
    );
    let ativo = true;
    if (!url) {
      setCorCena("");
      return undefined;
    }
    corInterfaceDaImagem(url)
      .then((cor) => ativo && setCorCena(cor))
      .catch(() => ativo && setCorCena(""));
    return () => {
      ativo = false;
    };
  }, [cenaAtivaVisivel, campanha?.midiaAtivaId, campanha?.modo]);
  useEffect(() => {
    setAudioEspecialPronto(false);
    if (campanha?.modo !== "especial" || !cenaAtivaVisivel?.cenaEspecial?.audioUrl) return undefined;
    const timer = setTimeout(() => setAudioEspecialPronto(true), Math.max(0, Number(cenaAtivaVisivel.cenaEspecial.atrasoAudio) || 0));
    return () => {
      clearTimeout(timer);
      setAudioEspecialPronto(false);
    };
  }, [cenaAtivaVisivel?.id, cenaAtivaVisivel?.cenaEspecial, campanha?.modo]);
  useEffect(() => {
    const audio = audioCenaEspecialRef.current;
    if (!audio || !audioEspecialPronto) return undefined;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.currentTime = 0; };
  }, [audioEspecialPronto]);
  useEffect(() => {
    if (campanha?.modo !== "mapa") return undefined;
    const url = urlCena(cenaAtivaVisivel, "mapa", campanha?.midiaAtivaId);
    if (!url || specialSceneMediaType({url}) === "video") return undefined;
    let ativo = true;
    const imagem = new Image();
    imagem.onload = () => {
      if (ativo && imagem.naturalWidth > 0 && imagem.naturalHeight > 0) {
        setProporcaoMapa({
          largura: imagem.naturalWidth,
          altura: imagem.naturalHeight,
        });
      }
    };
    imagem.src = url;
    return () => {
      ativo = false;
    };
  }, [cenaAtivaVisivel, campanha?.midiaAtivaId, campanha?.modo]);
  const carregarFichas = useCallback(() => {
    setErroFichas("");
    listarFichasParaCampanha()
      .then((fichas) => {
        setFichasDisponiveis(fichas);
        setPersonagens(current => ({...current,...Object.fromEntries(fichas.map(ficha => [ficha.fichaId,ficha.personagem]))}));
      })
      .catch((error) => {
        setFichasDisponiveis([]);
        setErroFichas(error.message || "Nao foi possivel carregar as fichas.");
      });
  }, []);
  useEffect(() => {
    carregarFichas();
  }, [carregarFichas]);
  useEffect(() => {
    const refresh=event => {
      if(event.type==='storage' && !event.key?.startsWith('espiral:sheet:v1:')) return;
      carregarFichas();
    };
    window.addEventListener('storage',refresh);window.addEventListener('darkness:token-animation-updated',refresh);
    return () => {window.removeEventListener('storage',refresh);window.removeEventListener('darkness:token-animation-updated',refresh);};
  },[carregarFichas]);
  useEffect(() => {
    if (!mestre) return;
    const refresh = () => {
    const records = [];
    try {
      const inimigos = (
        JSON.parse(localStorage.getItem("darkness_inimigos")) || []
      ).map((item) => ({ ...item, tipo: "inimigo" }));
      const npcs = (
        JSON.parse(localStorage.getItem("darkness_npcs")) || []
      ).map((item) => ({ ...item, tipo: "npc" }));
      records.push(...inimigos, ...npcs);
    } catch {}
    try { records.push(...readEspiralEncounters(localStorage).map(espiralEncounterForTabletop)); } catch {}
    setCatalogoInimigos(records);
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener(ESPIRAL_ENCOUNTERS_CHANGED, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(ESPIRAL_ENCOUNTERS_CHANGED, refresh);
    };
  }, [mestre]);
  useEffect(() => {
    const fichasIds = (campanha?.membros || [])
      .map((membro) => membro.ficha_id)
      .filter(id => id && !String(id).startsWith("espiral:") && !String(id).startsWith("custom3d:"));
    if (!fichasIds.length) return undefined;
    return ouvirPersonagens(fichasIds, (fichaId, personagem) => {
      setPersonagens((atuais) => ({ ...atuais, [fichaId]: personagem }));
      setFichaAberta((atual) =>
        atual?.membro?.ficha_id === fichaId ? { ...atual, personagem } : atual,
      );
    });
  }, [campanha?.membros]);
  useEffect(() => {
    if (!campanha?.id || !campanha.membros?.length) return;
    const fichasComToken = new Set(
      (campanha.tokens || []).map((token) => token.ficha_id),
    );
    const semToken = campanha.membros.filter(
      (membro) => membro.ficha_id && !fichasComToken.has(membro.ficha_id),
    );
    if (!semToken.length) return;

    Promise.all(
      semToken.map((membro) =>
        vincularFicha(campanha.id, membro.ficha_id, {
          nome: membro.nome,
        }),
      ),
    )
      .then(carregar)
      .catch((error) => {
        console.error(
          "Nao foi possivel restaurar os tokens da campanha.",
          error,
        );
      });
  }, [campanha?.id, campanha?.membros, campanha?.tokens, carregar]);
  useEffect(() => {
    if (!campanha?.id) return undefined;
    const receberRolagem = async (event) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.tipo !== "darkness:rolagem-tabletop"
      )
        return;
      try {
        const registro = await registrarRolagem(
          campanha.id,
          event.data.autor,
          event.data.rolagem || {},
        );
        setCampanha((atual) => ({
          ...atual,
          rolagens: [
            registro,
            ...(atual.rolagens || []).filter((item) => item.id !== registro.id),
          ].slice(0, 30),
        }));
      } catch (error) {
        console.error(
          "Nao foi possivel enviar a rolagem para o tabletop.",
          error,
        );
      }
    };
    window.addEventListener("message", receberRolagem);
    return () => window.removeEventListener("message", receberRolagem);
  }, [campanha?.id, mestre]);

  const adicionarFicha = async () => {
    const registro = fichasDisponiveis.find(
      (item) => item.fichaId === fichaParaVincular,
    );
    if (!registro) return;
    await vincularFicha(campanha.id, registro.fichaId, registro.personagem);
    setFichaParaVincular("");
    await carregar();
  };

  const adicionarInimigo = async () => {
    const inimigo = catalogoInimigos.find(
      (item) => String(item.id || item.fichaId) === inimigoParaAdicionar,
    );
    if (!inimigo) return;
    try {
      await vincularInimigo(campanha.id, inimigo);
      setInimigoParaAdicionar("");
      await carregar();
    } catch (error) {
      setErro(error.name === 'QuotaExceededError'
        ? 'O armazenamento deste dispositivo está cheio. Não foi possível adicionar o encontro; a campanha anterior foi preservada.'
        : error.message || 'Não foi possível adicionar o encontro à campanha.');
    }
  };
  const removerInimigo = async (inimigo) => {
    if (
      !await confirmarDialogo(
        `Remover ${inimigo.nome || "este inimigo"} desta campanha?`,
        { titulo: "Remover inimigo", confirmarTexto: "Remover", perigo: true },
      )
    )
      return;
    await desvincularInimigo(campanha.id, inimigo.id);
    setInimigoAberto(null);
    await carregar();
  };
  const colocarInimigo3D = async (inimigo) => {
    try {
      await posicionarInimigoNoMapa(campanha.id, { ...inimigo, fotoPerfil: inimigo.tabletopTokenImage || inimigo.fotoPerfil }, 50, 50, tabletopMapId || 'mapa-principal');
      await carregar();
    } catch (error) { setErro(error.message || 'Não foi possível colocar o encontro no mapa 3D.'); }
  };
  const salvarVitalInimigo = async (inimigoAtualizado) => {
    setInimigoAberto(inimigoAtualizado);
    setCampanha((atual) => ({
      ...atual,
      inimigos: (atual.inimigos || []).map((item) =>
        item.id === inimigoAtualizado.id ? inimigoAtualizado : item,
      ),
    }));
    try {
      const salvo = await atualizarInimigoCampanha(
        campanha.id,
        inimigoAtualizado,
      );
      setInimigoAberto((atual) => (atual?.id === salvo.id ? salvo : atual));
      setCampanha((atual) => ({
        ...atual,
        inimigos: (atual.inimigos || []).map((item) =>
          item.id === salvo.id ? salvo : item,
        ),
      }));
    } catch (error) {
      setErro(error.message || "Nao foi possivel atualizar o inimigo.");
      await carregar();
    }
  };
  const alterarSanidadeInimigo = (valor) =>
    salvarVitalInimigo({
      ...inimigoAberto,
      sanidade: { ...(inimigoAberto.sanidade || {}), atual: valor },
    });
  const alterarMembroInimigo = (membro, valor) =>
    salvarVitalInimigo({
      ...inimigoAberto,
      membros: {
        ...(inimigoAberto.membros || {}),
        [membro]: { ...(inimigoAberto.membros?.[membro] || {}), atual: valor },
      },
    });
  const alterarDefesaInimigo = (valor) => {
    const defesa = Math.max(0, Number(valor) || 0);
    if (defesa === (Number(inimigoAberto.defesa) || 0)) return;
    salvarVitalInimigo({ ...inimigoAberto, defesa });
  };

  const alternarModoCombate = async () => {
    if (!mestre || salvandoCombate || salvandoInvestigacao || !campanha?.id) return;
    const novoEstado = !campanha.combateAtivo;
    setSalvandoCombate(true);
    try {
      await atualizarModoCombate(campanha.id, novoEstado, novoEstado && !embedded);
      setCampanha((atual) => ({
        ...atual,
        combateAtivo: novoEstado,
        turnoCombate: null,
        investigacaoAtiva: novoEstado ? false : Boolean(atual.investigacaoAtiva),
        iniciativas: novoEstado && !embedded ? {} : atual.iniciativas || {},
      }));
      if (novoEstado && !embedded) setIniciativasRascunho({});
      setAbaLateralMestre("participantes");
      setInimigoAberto(null);
    } catch (error) {
      setErro(error.message || "Nao foi possivel alterar o modo de combate.");
    } finally {
      setSalvandoCombate(false);
    }
  };

  const alternarModoInvestigacao = async () => {
    if (!mestre || salvandoInvestigacao || salvandoCombate || !campanha?.id) return;
    const novoEstado = !campanha.investigacaoAtiva;
    setSalvandoInvestigacao(true);
    try {
      await atualizarModoInvestigacao(campanha.id, novoEstado, novoEstado);
      setCampanha((atual) => ({
        ...atual,
        investigacaoAtiva: novoEstado,
        turnoCombate: null,
        combateAtivo: novoEstado ? false : Boolean(atual.combateAtivo),
        iniciativas: novoEstado ? {} : atual.iniciativas || {},
      }));
      if (novoEstado) setIniciativasRascunho({});
      setAbaLateralMestre("participantes");
      setInimigoAberto(null);
    } catch (error) {
      setErro(error.message || "Nao foi possivel alterar o modo de investigacao.");
    } finally {
      setSalvandoInvestigacao(false);
    }
  };

  const alternarJogadorDocumento = (fichaId) => {
    const id = String(fichaId || "");
    if (!id) return;
    setNovoDocumento((atual) => {
      const selecionados = new Set((atual.jogadoresVisiveis || []).map(String));
      if (selecionados.has(id)) selecionados.delete(id);
      else selecionados.add(id);
      return {
        ...atual,
        visualizarTodos: false,
        jogadoresVisiveis: [...selecionados],
      };
    });
  };

  const nomesVisibilidadeDocumento = (documento) => {
    if (documento?.visualizarTodos !== false) return "Todos os jogadores";
    const ids = (documento?.jogadoresVisiveis || []).map(String);
    const nomes = ids
      .map((id) => {
        const membro = (campanha?.membros || []).find(
          (item) => String(item.ficha_id) === id,
        );
        return membro ? personagens[membro.ficha_id]?.nome || membro.nome : null;
      })
      .filter(Boolean);
    if (!nomes.length) return "Nenhum jogador";
    if (nomes.length <= 2) return nomes.join(", ");
    return `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}`;
  };

  const abrirEdicaoVisibilidadeDocumento = (documento) => {
    if (!mestre || !documento?.id) return;
    setVisibilidadeDocumentoEditando((atual) => {
      if (atual?.id === documento.id) return null;
      const visualizarTodos = documento.visualizarTodos !== false;
      return {
        id: documento.id,
        visualizarTodos,
        jogadoresVisiveis: visualizarTodos
          ? []
          : [...new Set((documento.jogadoresVisiveis || []).map(String))],
      };
    });
  };

  const alternarJogadorDocumentoExistente = (fichaId) => {
    const id = String(fichaId || "");
    if (!id) return;
    setVisibilidadeDocumentoEditando((atual) => {
      if (!atual) return atual;
      const selecionados = new Set((atual.jogadoresVisiveis || []).map(String));
      if (selecionados.has(id)) selecionados.delete(id);
      else selecionados.add(id);
      return {
        ...atual,
        visualizarTodos: false,
        jogadoresVisiveis: [...selecionados],
      };
    });
  };

  const salvarVisibilidadeDocumentoExistente = async (documento) => {
    if (
      !mestre ||
      !campanha?.id ||
      !documento?.id ||
      !visibilidadeDocumentoEditando ||
      visibilidadeDocumentoEditando.id !== documento.id ||
      salvandoVisibilidadeDocumento
    ) return;

    const visualizarTodos = visibilidadeDocumentoEditando.visualizarTodos !== false;
    const jogadoresVisiveis = visualizarTodos
      ? []
      : [...new Set((visibilidadeDocumentoEditando.jogadoresVisiveis || []).map(String))];

    if (!visualizarTodos && !jogadoresVisiveis.length) {
      setErro("Selecione pelo menos um jogador para visualizar este documento.");
      return;
    }

    setSalvandoVisibilidadeDocumento(true);
    setErro("");
    try {
      const atualizado = await atualizarVisibilidadeDocumentoInvestigacao(
        campanha.id,
        documento.id,
        { visualizarTodos, jogadoresVisiveis },
      );
      setCampanha((atual) => ({
        ...atual,
        documentosInvestigacao: (atual.documentosInvestigacao || []).map((item) =>
          item.id === documento.id ? { ...item, ...atualizado } : item,
        ),
      }));
      setDocumentoAberto((atual) =>
        atual?.id === documento.id ? { ...atual, ...atualizado } : atual,
      );
      setVisibilidadeDocumentoEditando(null);
    } catch (error) {
      setErro(error.message || "Nao foi possivel atualizar a visibilidade do documento.");
    } finally {
      setSalvandoVisibilidadeDocumento(false);
    }
  };

  const enviarDocumentoParaInvestigacao = async (event) => {
    event.preventDefault();
    const prepararSomente =
      event.nativeEvent?.submitter?.value === "preparar";
    const evidenciaInterativa = novoDocumento.categoria === "interativa";
    if (
      !mestre ||
      !campanha?.id ||
      (!evidenciaInterativa && !novoDocumento.arquivo) ||
      enviandoDocumento
    )
      return;
    setEnviandoDocumento(true);
    setEstadoEnvioDocumento(
      prepararSomente ? "Preparando evidencia..." : "Enviando arquivo...",
    );
    setErro("");
    try {
      if (!evidenciaInterativa) validarArquivoInvestigacao(novoDocumento.arquivo);
      const fitaCassete = evidenciaInterativa && novoDocumento.modeloInterativo === "cassete";
      if (fitaCassete && !novoDocumento.arquivo) throw new Error("Selecione um áudio para a fita cassete.");
      const audioUrl = fitaCassete ? await enviarImagemCena(campanha.id, novoDocumento.arquivo, "audio") : "";
      const metadadosDocumento = {
          audioUrl,
          nome:
            novoDocumento.nome ||
            (evidenciaInterativa
              ? novoDocumento.modeloInterativo === "cassete" ? "Fita cassete" : novoDocumento.modeloInterativo === "modern-pc"
                ? "Computador moderno"
                : "Terminal MS-DOS"
              : novoDocumento.arquivo.name.replace(/\.[^.]+$/, "")),
          descricao: novoDocumento.descricao,
          categoria: novoDocumento.categoria,
          modeloInterativo: novoDocumento.modeloInterativo || "msdos",
          revelada: !prepararSomente,
          visualizarTodos: novoDocumento.visualizarTodos,
          jogadoresVisiveis: novoDocumento.visualizarTodos
            ? []
            : novoDocumento.jogadoresVisiveis,
        };
      const salvo = evidenciaInterativa
        ? await salvarEvidenciaInterativa(campanha.id, metadadosDocumento)
        : await salvarDocumentoInvestigacao(
            campanha.id,
            novoDocumento.arquivo,
            metadadosDocumento,
          );
      setCampanha((atual) => ({
        ...atual,
        documentosInvestigacao: [
          salvo,
          ...(atual.documentosInvestigacao || []).filter((item) => item.id !== salvo.id),
        ],
      }));
      setNovoDocumento({
        nome: "",
        descricao: "",
        categoria: "evidencia",
        modeloInterativo: "msdos",
        arquivo: null,
        visualizarTodos: true,
        jogadoresVisiveis: [],
      });
      if (arquivoDocumentoRef.current) arquivoDocumentoRef.current.value = "";
      setEstadoEnvioDocumento(
        prepararSomente
          ? "Evidencia preparada e oculta dos jogadores. Abra-a na lista para revisar ou configurar o conteudo."
          : "Documento compartilhado com sucesso.",
      );
    } catch (error) {
      const mensagem = error.message || "Nao foi possivel compartilhar o documento.";
      setErro(mensagem);
      setEstadoEnvioDocumento(`Erro: ${mensagem}`);
    } finally {
      setEnviandoDocumento(false);
    }
  };

  const enviarEvidenciaPreparada = async (documento) => {
    if (
      !mestre ||
      !campanha?.id ||
      !documento?.id ||
      documento.revelada !== false ||
      enviandoDocumentoPreparadoId
    ) return;

    setEnviandoDocumentoPreparadoId(documento.id);
    setErro("");
    try {
      const atualizado = await atualizarRevelacaoDocumentoInvestigacao(
        campanha.id,
        documento.id,
        true,
      );
      setCampanha((atual) => ({
        ...atual,
        documentosInvestigacao: (atual.documentosInvestigacao || []).map((item) =>
          item.id === documento.id ? { ...item, ...atualizado, revelada: true } : item,
        ),
      }));
      setDocumentoAberto((atual) =>
        atual?.id === documento.id ? { ...atual, ...atualizado, revelada: true } : atual,
      );
      setEstadoEnvioDocumento(
        `Evidencia "${nomeDocumentoExibicao(documento)}" enviada aos jogadores.`,
      );
    } catch (error) {
      const mensagem = error.message || "Nao foi possivel enviar a evidencia preparada.";
      setErro(mensagem);
      setEstadoEnvioDocumento(`Erro: ${mensagem}`);
    } finally {
      setEnviandoDocumentoPreparadoId("");
    }
  };

  const removerDocumentoDaInvestigacao = async (documento) => {
    if (!mestre || !campanha?.id || !documento?.id) return;
    if (!await confirmarDialogo(`Remover "${documento.nome || "este documento"}" do visualizador?`, { titulo: "Remover documento", confirmarTexto: "Remover", perigo: true })) return;
    try {
      await excluirDocumentoInvestigacao(campanha.id, documento);
      setCampanha((atual) => ({
        ...atual,
        documentosInvestigacao: (atual.documentosInvestigacao || []).filter(
          (item) => item.id !== documento.id,
        ),
      }));
      setDocumentoAberto((atual) => (atual?.id === documento.id ? null : atual));
    } catch (error) {
      setErro(error.message || "Nao foi possivel remover o documento.");
    }
  };

  const alterarRascunhoIniciativa = (membro, entrada) => {
    if (!mestre || !modoIniciativaAtivo) return;
    const fichaId = membro.ficha_id;
    const texto = String(entrada ?? "").replace(/[^0-9]/g, "");
    setIniciativasRascunho((atuais) => ({ ...atuais, [fichaId]: texto }));
  };

  const confirmarIniciativaMestre = async (membro) => {
    if (!mestre || !modoIniciativaAtivo || !campanha?.id) return;
    const fichaId = membro.ficha_id;
    const possuiRascunho = Object.prototype.hasOwnProperty.call(
      iniciativasRascunho,
      fichaId,
    );
    if (!possuiRascunho) return;
    const texto = String(iniciativasRascunho[fichaId] ?? "");

    try {
      if (!texto) {
        await removerIniciativa(campanha.id, fichaId);
        setCampanha((estado) => {
          const iniciativas = { ...(estado.iniciativas || {}) };
          delete iniciativas[fichaId];
          return { ...estado, iniciativas };
        });
      } else {
        const valor = Math.max(0, Number(texto) || 0);
        await definirIniciativa(
          campanha.id,
          fichaId,
          valor,
          personagens[fichaId]?.nome || membro.nome,
        );
        setCampanha((estado) => ({
          ...estado,
          iniciativas: { ...(estado.iniciativas || {}), [fichaId]: valor },
        }));
      }

      setIniciativasRascunho((atuais) => {
        if (atuais[fichaId] !== texto) return atuais;
        const proximo = { ...atuais };
        delete proximo[fichaId];
        return proximo;
      });
    } catch (error) {
      setErro(error.message || "Nao foi possivel atualizar a iniciativa.");
    }
  };

  const chaveIniciativaNpc = (npc) => `npc:${npc.id}`;
  const prefixoIniciativaInimigo = (inimigo) => `inimigo:${inimigo.id}:`;
  const chaveRascunhoNovoInimigo = (inimigo) => `novo-inimigo:${inimigo.id}`;

  const alterarRascunhoIniciativaPorChave = (chave, entrada) => {
    if (!mestre || !modoIniciativaAtivo) return;
    const texto = String(entrada ?? "").replace(/[^0-9]/g, "");
    setIniciativasRascunho((atuais) => ({ ...atuais, [chave]: texto }));
  };

  const confirmarIniciativaPorChave = async (chave, nome) => {
    if (!mestre || !modoIniciativaAtivo || !campanha?.id) return;
    const possuiRascunho = Object.prototype.hasOwnProperty.call(
      iniciativasRascunho,
      chave,
    );
    const texto = possuiRascunho
      ? String(iniciativasRascunho[chave] ?? "")
      : String(campanha.iniciativas?.[chave] ?? "");

    try {
      if (!texto) {
        await removerIniciativa(campanha.id, chave);
        setCampanha((estado) => {
          const iniciativas = { ...(estado.iniciativas || {}) };
          delete iniciativas[chave];
          return { ...estado, iniciativas };
        });
      } else {
        const valor = Math.max(0, Number(texto) || 0);
        await definirIniciativa(campanha.id, chave, valor, nome);
        setCampanha((estado) => ({
          ...estado,
          iniciativas: { ...(estado.iniciativas || {}), [chave]: valor },
        }));
      }
      setIniciativasRascunho((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chave];
        return proximo;
      });
    } catch (error) {
      setErro(error.message || "Nao foi possivel atualizar a iniciativa.");
    }
  };

  const removerIniciativaPorChave = async (chave) => {
    if (!mestre || !modoIniciativaAtivo || !campanha?.id) return;
    try {
      await removerIniciativa(campanha.id, chave);
      setCampanha((estado) => {
        const iniciativas = { ...(estado.iniciativas || {}) };
        delete iniciativas[chave];
        return { ...estado, iniciativas };
      });
      setIniciativasRascunho((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chave];
        return proximo;
      });
    } catch (error) {
      setErro(error.message || "Nao foi possivel remover a iniciativa.");
    }
  };

  const adicionarIniciativaInimigo = async (inimigo) => {
    const chaveRascunho = chaveRascunhoNovoInimigo(inimigo);
    const texto = String(iniciativasRascunho[chaveRascunho] ?? "");
    if (!texto) return;
    const chave = `${prefixoIniciativaInimigo(inimigo)}${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const valor = Math.max(0, Number(texto) || 0);
    try {
      await definirIniciativa(campanha.id, chave, valor, inimigo.nome || "Inimigo");
      setCampanha((estado) => ({
        ...estado,
        iniciativas: { ...(estado.iniciativas || {}), [chave]: valor },
      }));
      setIniciativasRascunho((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveRascunho];
        return proximo;
      });
    } catch (error) {
      setErro(error.message || "Nao foi possivel adicionar a iniciativa do inimigo.");
    }
  };

  const adicionarIniciativaNoPainel = async (inimigo, valor, tipo) => {
    if(!mestre || !modoIniciativaAtivo || !campanha?.id || !Number.isInteger(valor) || valor<0) return;
    let registro=inimigo;
    if(tipo!=='npc' && Boolean(inimigo.bossIniciativa || inimigo.dados?.bossIniciativa)!==(tipo==='boss')) {
      registro=await atualizarInimigoCampanha(campanha.id,{...inimigo,bossIniciativa:tipo==='boss'});
      setCampanha(atual=>({...atual,inimigos:(atual.inimigos || []).map(item=>item.id===registro.id?registro:item)}));
    }
    const chave=tipo==='npc' ? chaveIniciativaNpc(registro) : prefixoIniciativaInimigo(registro)+Date.now()+'-'+Math.random().toString(36).slice(2,6);
    await definirIniciativa(campanha.id,chave,valor,registro.nome || 'Personagem');
    setCampanha(atual=>({...atual,iniciativas:{...(atual.iniciativas || {}),[chave]:valor}}));
  };

  const apresentar = async (cena, modo, midia = null) => {
    setTransicao(true);
    await ativarCena(campanha.id, cena.id, modo, midia?.id || null);
    setTimeout(() => {
      setCampanha((atual) => ({
        ...atual,
        cenaAtiva: cena,
        modo,
        midiaAtivaId: midia?.id || null,
      }));
    }, 350);
    setTimeout(() => setTransicao(false), 1050);
  };

  const trocarModo = async (modo) => {
    if (!campanha.cenaAtiva) return;
    setTransicao(true);
    await atualizarModoCampanha(campanha.id, modo);
    setTimeout(() => setCampanha((atual) => ({ ...atual, modo })), 300);
    setTimeout(() => setTransicao(false), 950);
  };

  const abrirEditor = (cena = null) => {
    const larguraGrade = cena?.largura_grade || cena?.larguraGrade || 12;
    const alturaGrade = cena?.altura_grade || cena?.alturaGrade || 8;
    const imagensCena = cena
      ? midiasDaCena(cena, "cena").map((midia, indice) => ({
          ...midia,
          id: midia.id || `cena-${cena.id || "existente"}-${indice + 1}`,
          nome: midia.nome || `Cena ${indice + 1}`,
        }))
      : [];
    const mapasBatalha = cena
      ? midiasDaCena(cena, "mapa").map((midia, indice) => ({
          ...midia,
          id: midia.id || `mapa-${cena.id || "existente"}-${indice + 1}`,
          nome: midia.nome || `Mapa ${indice + 1}`,
          larguraGrade: Number(midia.larguraGrade || larguraGrade),
          alturaGrade: Number(midia.alturaGrade || alturaGrade),
          exibirGrade: midia.exibirGrade !== false,
        }))
      : [];
    setEditando(
      cena
        ? {
            ...cena,
            imagemUrl: urlCena(cena, "cena"),
            mapaUrl: urlCena(cena, "mapa"),
            imagensCena,
            mapasBatalha,
            cenaEspecial: cena.cenaEspecial || null,
            larguraGrade,
            alturaGrade,
          }
        : { ...cenaVazia, imagensCena: [], mapasBatalha: [] },
    );
    setArquivos({ cena: [], mapa: [], especial: [], audio: [] });
    setEditorAberto(true);
  };

  const alternarJogadorCena = (fichaId) => {
    const id = String(fichaId || "");
    setEditando((atual) => {
      const selecionados = new Set((atual.jogadoresVisiveis || []).map(String));
      if (selecionados.has(id)) selecionados.delete(id);
      else selecionados.add(id);
      return { ...atual, jogadoresVisiveis: [...selecionados] };
    });
  };

  const confirmarCena = async (event) => {
    event.preventDefault();
    if (editando.visualizarTodos === false && !editando.jogadoresVisiveis?.length) {
      setErro("Selecione pelo menos um jogador para visualizar esta cena.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const [novasImagens, novosMapas, midiaEspecialUrl, audioEspecialUrl] = await Promise.all([
        Promise.all(
          arquivos.cena.map(async (item) => ({
            id: item.id,
            nome: item.nome || item.arquivo.name,
            tipoMidia: specialSceneMediaType({file:item.arquivo}),
            url: await enviarImagemCena(campanha.id, item.arquivo, "cena"),
          })),
        ),
        Promise.all(
          arquivos.mapa.map(async (item) => ({
            id: item.id,
            nome: item.nome || item.arquivo.name,
            tipoMidia: specialSceneMediaType({file:item.arquivo}),
            url: await enviarImagemCena(campanha.id, item.arquivo, "mapa"),
            larguraGrade: Number(
              item.larguraGrade || editando.larguraGrade || 12,
            ),
            alturaGrade: Number(item.alturaGrade || editando.alturaGrade || 8),
          })),
        ),
        arquivos.especial[0] ? enviarImagemCena(campanha.id, arquivos.especial[0].arquivo, "especial") : null,
        arquivos.audio[0] ? enviarImagemCena(campanha.id, arquivos.audio[0].arquivo, "audio") : null,
      ]);
      let imagensCena = [...(editando.imagensCena || []), ...novasImagens];
      let mapasBatalha = [...(editando.mapasBatalha || []), ...novosMapas];
      if (!imagensCena.length && editando.imagemUrl)
        imagensCena = [
          {
            id: idMidiaLocal("cena-url"),
            nome: "Cena principal",
            url: editando.imagemUrl,
          },
        ];
      if (!mapasBatalha.length && editando.mapaUrl)
        mapasBatalha = [
          {
            id: idMidiaLocal("mapa-url"),
            nome: "Mapa principal",
            url: editando.mapaUrl,
            larguraGrade: Number(editando.larguraGrade || 12),
            alturaGrade: Number(editando.alturaGrade || 8),
          },
        ];
      await salvarCena(campanha.id, {
        ...editando,
        // Mantém os dois formatos sincronizados para evitar que os valores antigos
        // vindos do Supabase sobrescrevam as listas atualizadas durante a edição.
        imagensCena,
        mapasBatalha,
        imagens_cena: imagensCena,
        mapas_batalha: mapasBatalha,
        imagemUrl: imagensCena[0]?.url || "",
        mapaUrl: mapasBatalha[0]?.url || "",
        cenaEspecial: editando.cenaEspecial?.ativo ? {
          ...editando.cenaEspecial,
          midiaUrl: midiaEspecialUrl || editando.cenaEspecial.midiaUrl || "",
          audioUrl: audioEspecialUrl || editando.cenaEspecial.audioUrl || "",
          tipoMidia: editando.cenaEspecial.cutscene ? "cutscene" : specialSceneMediaType({file:arquivos.especial[0]?.arquivo,url:editando.cenaEspecial.midiaUrl,fallback:editando.cenaEspecial.tipoMidia || "imagem"}),
          atrasoAudio: Math.max(0, Number(editando.cenaEspecial.atrasoAudio) || 0),
        } : null,
      });
      await carregar();
      setEditorAberto(false);
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a cena.");
    } finally {
      setSalvando(false);
    }
  };

  const selecionarArquivosCena = (tipo, listaArquivos, input) => {
    const selecionados = Array.from(listaArquivos || []);
    if (!selecionados.length) return;
    try {
      selecionados.forEach((arquivo) => validarArquivoImagem(arquivo, tipo));
      if(tipo==="especial")setEditando(current=>({...current,cenaEspecial:{...current.cenaEspecial,cutscene:undefined,tipoMidia:specialSceneMediaType({file:selecionados[0]})}}));
      setErro("");
      setArquivos((atuais) => ({
        ...atuais,
        [tipo]: [
          ...(tipo === "especial" || tipo === "audio" ? [] : atuais[tipo]),
          ...selecionados.map((arquivo) => ({
            id: idMidiaLocal(tipo),
            nome: arquivo.name.replace(/\.[^.]+$/, ""),
            arquivo,
            ...(tipo === "mapa"
              ? {
                  larguraGrade: Number(editando.larguraGrade || 12),
                  alturaGrade: Number(editando.alturaGrade || 8),
                  exibirGrade: true,
                }
              : {}),
          })),
        ],
      }));
      if (input) input.value = "";
    } catch (error) {
      setErro(error.message);
      if (input) input.value = "";
    }
  };

  const removerMidiaExistente = (tipo, id) => {
    const chave = tipo === "mapa" ? "mapasBatalha" : "imagensCena";
    setEditando((atual) => ({
      ...atual,
      [chave]: (atual[chave] || []).filter((midia) => midia.id !== id),
    }));
  };
  const removerArquivoPendente = (tipo, id) =>
    setArquivos((atuais) => ({
      ...atuais,
      [tipo]: atuais[tipo].filter((item) => item.id !== id),
    }));
  const atualizarMapaPendente = (id, campo, valor) =>
    setArquivos((atuais) => ({
      ...atuais,
      mapa: atuais.mapa.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item,
      ),
    }));
  const atualizarMapaExistente = (id, campo, valor) =>
    setEditando((atual) => ({
      ...atual,
      mapasBatalha: (atual.mapasBatalha || []).map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item,
      ),
    }));

  const removerCena = async (cena) => {
    if (!await confirmarDialogo(`Excluir "${cena.nome}" da biblioteca?`, { titulo: "Excluir cena", confirmarTexto: "Excluir", perigo: true })) return;
    await excluirCena(campanha.id, cena.id);
    await carregar();
  };

  const calcularPosicaoToken = (event) => {
    const area = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((event.clientX - area.left) / area.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((event.clientY - area.top) / area.height) * 100),
    );
    return { x, y };
  };

  const podeMoverToken = (token) =>
    Boolean(token && (mestre || token.ficha_id === fichaJogadorId));
  const mapaChaveAtual = chavePosicaoMapa(
    campanha?.cenaAtiva?.id,
    campanha?.midiaAtivaId,
  );
  const estadoTokenNoMapa = (token, chave = mapaChaveAtual) => ({
    ...(token?.posicoes?.[chave] || {}),
    ...(token?.posicoes?.[`__estado:${chave}`] || {}),
    ...(token?.posicoes?.["__estado:global"] || {}),
  });

  const atualizarEstadoLocalToken = (tokenId, mudanca) => {
    const chaveEstado = `__estado:${mapaChaveAtual}`;
    setCampanha((atual) => ({
      ...atual,
      tokens: atual.tokens.map((item) =>
        item.id === tokenId
          ? {
              ...item,
              posicoes: {
                ...(item.posicoes || {}),
                [chaveEstado]: {
                  ...(item.posicoes?.[chaveEstado] || {}),
                  ...mudanca,
                },
              },
            }
          : item,
      ),
    }));
  };

  const calcularMovimentoToken = (event, token) => {
    const visual = { ...token, ...estadoTokenNoMapa(token) };
    const movimento = movimentoTokenRef.current;
    const origem = movimento?.tokenId === token.id && movimento.mapaChave === mapaChaveAtual
      ? movimento.posicao
      : { x: Number(visual.x) || 0, y: Number(visual.y) || 0 };
    const posicao = limitarMovimentoToken(origem, calcularPosicaoToken(event), configuracaoIluminacao);
    movimentoTokenRef.current = { tokenId: token.id, mapaChave: mapaChaveAtual, posicao };
    return posicao;
  };

  const arrastarToken = (event) => {
    const token = campanha.tokens.find((item) => item.id === tokenArrastando);
    if (!tokenArrastando || !podeMoverToken(token) || campanha.modo !== "mapa")
      return;
    const { x, y } = calcularMovimentoToken(event, token);
    setCampanha((atual) => ({
      ...atual,
      tokens: atual.tokens.map((item) =>
        item.id === tokenArrastando
          ? {
              ...item,
              x,
              y,
              posicoes: {
                ...(item.posicoes || {}),
                [mapaChaveAtual]: { x, y },
              },
            }
          : item,
      ),
    }));
  };

  const girarToken = (event) => {
    if (!tokenGirando) return;
    const token = campanha.tokens.find((item) => item.id === tokenGirando);
    if (!podeMoverToken(token)) return;
    const visual = { ...token, ...estadoTokenNoMapa(token) };
    const area = event.currentTarget.getBoundingClientRect();
    const centroX = area.left + (Number(visual.x) / 100) * area.width;
    const centroY = area.top + (Number(visual.y) / 100) * area.height;
    const anguloPonteiro = Math.atan2(
      event.clientY - centroY,
      event.clientX - centroX,
    );
    const rotacaoAtual = Number(visual.rotacao) || 0;
    const rotacao =
      anguloPonteiro +
      Math.round((rotacaoAtual - anguloPonteiro) / (Math.PI * 2)) *
        Math.PI *
        2;
    const lanterna = visual.lanterna?.ativa
      ? { ...visual.lanterna, direcao: rotacao }
      : visual.lanterna;
    rotacaoPendenteRef.current = { tokenId: token.id, rotacao, lanterna };
    atualizarEstadoLocalToken(token.id, { rotacao, ...(lanterna ? { lanterna } : {}) });
  };

  const finalizarRotacaoToken = async (event) => {
    if (!tokenGirando) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const pendente = rotacaoPendenteRef.current;
    setTokenGirando(null);
    rotacaoPendenteRef.current = null;
    if (!pendente) return;
    try {
      await definirRotacaoToken(pendente.tokenId, pendente.rotacao, mapaChaveAtual);
      if (pendente.lanterna)
        await configurarLanternaToken(
          pendente.tokenId,
          pendente.lanterna,
          mapaChaveAtual,
        );
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a direcao do token.");
      await carregar();
    }
  };

  const soltarToken = async (event) => {
    if (!tokenArrastando) return;
    const tokenId = tokenArrastando;
    if (tokensEmGravacaoRef.current.has(tokenId)) return;
    const token = campanha.tokens.find((item) => item.id === tokenId);
    if (!podeMoverToken(token)) {
      setTokenArrastando(null);
      return;
    }
    const { x, y } = calcularMovimentoToken(event, token);
    movimentoTokenRef.current = null;
    tokensEmGravacaoRef.current.add(tokenId);
    posicoesTokensPendentesRef.current.set(tokenId, {
      x,
      y,
      mapaChave: mapaChaveAtual,
    });
    setTokenArrastando(null);
    setCampanha((atual) => ({
      ...atual,
      tokens: atual.tokens.map((item) =>
        item.id === tokenId ? { ...item, x, y, posicoes: { ...(item.posicoes || {}), [mapaChaveAtual]: { x, y } } } : item,
      ),
    }));
    try {
      const confirmado = await moverToken(tokenId, x, y, mapaChaveAtual);
      if (confirmado) {
        setCampanha((atual) => ({
          ...atual,
          tokens: atual.tokens.map((item) =>
            item.id === tokenId ? { ...item, ...confirmado, x, y } : item,
          ),
        }));
      }
    } catch (error) {
      posicoesTokensPendentesRef.current.delete(tokenId);
      setErro(error.message || "Nao foi possivel salvar a posicao do token.");
    } finally {
      tokensEmGravacaoRef.current.delete(tokenId);
    }
  };

  const alternarVisibilidadeToken = async (token) => {
    if (!mestre || !token) return;
    const oculto = !Boolean(token.oculto);
    setMenuTokenAberto(null);
    setCampanha((atual) => ({
      ...atual,
      tokens: atual.tokens.map((item) =>
        item.id === token.id ? { ...item, oculto, removido: false } : item,
      ),
    }));
    try {
      await definirVisibilidadeToken(token.id, oculto, mapaChaveAtual);
    } catch (error) {
      setErro(
        error.message || "Nao foi possivel alterar a visibilidade do token.",
      );
      await carregar();
    }
  };

  const alterarTamanhoToken = async (token, tamanhoSolicitado) => {
    if (
      !token ||
      (!mestre && String(token.ficha_id) !== String(fichaJogadorId))
    ) return;
    const tamanho = Math.max(
      0.5,
      Math.min(3, Number(Number(tamanhoSolicitado).toFixed(2)) || 1),
    );
    atualizarEstadoLocalToken(token.id, { tamanho });
    try {
      await definirTamanhoToken(token.id, tamanho, mapaChaveAtual);
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar o tamanho do token.");
      await carregar();
    }
  };

  const atualizarLanternaToken = async (token, mudanca) => {
    if (
      !token ||
      (!mestre && String(token.ficha_id) !== String(fichaJogadorId))
    )
      return;
    const lanterna = {
      ativa: Boolean(token.lanterna?.ativa),
      alcance: Number(token.lanterna?.alcance) || 18,
      cor: token.lanterna?.cor || "#f4c76b",
      direcao: Number(token.lanterna?.direcao ?? token.rotacao) || 0,
      abertura: Number(token.lanterna?.abertura) || 70,
      ...mudanca,
    };
    const chaveEstado = `__estado:${mapaChaveAtual}`;
    setCampanha((atual) => ({
      ...atual,
      tokens: atual.tokens.map((item) =>
        item.id === token.id
          ? {
              ...item,
              posicoes: {
                ...(item.posicoes || {}),
                [chaveEstado]: {
                  ...(item.posicoes?.[chaveEstado] || {}),
                  lanterna,
                },
              },
            }
          : item,
      ),
    }));
    try {
      await configurarLanternaToken(token.id, lanterna, mapaChaveAtual);
    } catch (error) {
      setErro(error.message || "Nao foi possivel configurar a lanterna.");
      await carregar();
    }
  };

  const removerTokenAtualDoMapa = async (token) => {
    if (!mestre || !token) return;
    if (
      !await confirmarDialogo(
        `Remover o token de ${token.nome || "este personagem"} de todos os mapas? Ele so voltara quando for colocado novamente.`,
        { titulo: "Remover token", confirmarTexto: "Remover", perigo: true },
      )
    )
      return;
    setMenuTokenAberto(null);
    setCampanha((atual) => ({
      ...atual,
      tokens: atual.tokens.map((item) =>
        item.id === token.id
          ? {
              ...item,
              removido: true,
              posicoes: {
                ...(item.posicoes || {}),
                "__estado:global": {
                  ...(item.posicoes?.["__estado:global"] || {}),
                  removido: true,
                },
              },
            }
          : item,
      ),
    }));
    try {
      await removerTokenDoMapa(token.id);
    } catch (error) {
      setErro(error.message || "Nao foi possivel remover o token dos mapas.");
      await carregar();
    }
  };

  const soltarFichaNoMapa = async (event) => {
    event.preventDefault();
    if (!mestre || campanha.modo !== "mapa") return;
    const fichaId = event.dataTransfer.getData("application/x-darkness-ficha");
    const inimigoId = event.dataTransfer.getData(
      "application/x-darkness-inimigo",
    );
    if (inimigoId) {
      const inimigo = (campanha.inimigos || []).find(
        (item) =>
          String(item.id) === inimigoId ||
          String(item.inimigo_ref) === inimigoId,
      );
      if (!inimigo) return;
      const { x, y } = calcularPosicaoToken(event);
      try {
        const token = await posicionarInimigoNoMapa(
          campanha.id,
          inimigo,
          x,
          y,
          mapaChaveAtual,
        );
        setCampanha((atual) => ({
          ...atual,
          tokens: [
            ...(atual.tokens || []).filter(
              (item) => item.ficha_id !== token.ficha_id,
            ),
            token,
          ],
        }));
      } catch (error) {
        setErro(error.message || "Nao foi possivel colocar o inimigo no mapa.");
      }
      return;
    }
    const membro = campanha.membros.find((item) => item.ficha_id === fichaId);
    if (!membro) return;
    const { x, y } = calcularPosicaoToken(event);
    try {
      const token = await posicionarFichaNoMapa(
        campanha.id,
        fichaId,
        personagens[fichaId] || { nome: membro.nome },
        x,
        y,
        mapaChaveAtual,
      );
      setCampanha((atual) => ({
        ...atual,
        tokens: [
          ...(atual.tokens || []).filter((item) => item.ficha_id !== fichaId),
          token,
        ],
      }));
    } catch (error) {
      setErro(error.message || "Nao foi possivel colocar a ficha no mapa.");
    }
  };

  const iniciarPanMapa = (event) => {
    const navegandoEditor = mestre && editorIluminacaoAberto &&
      (event.button === 1 || event.button === 2);
    if (campanha.modo !== "mapa" || (event.button !== 0 && !navegandoEditor)) return;
    if (!event.target.closest?.(".mesa-token")) setMenuTokenAberto(null);
    if (event.pointerType === "touch") {
      ponteirosMapaRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (ponteirosMapaRef.current.size >= 2) {
        const [primeiro, segundo] = [...ponteirosMapaRef.current.values()];
        const palco = event.currentTarget
          .closest(".mesa-palco")
          ?.getBoundingClientRect();
        const centroPalco = palco
          ? { x: palco.left + palco.width / 2, y: palco.top + palco.height / 2 }
          : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        inicioPincaMapaRef.current = {
          distancia:
            Math.hypot(segundo.x - primeiro.x, segundo.y - primeiro.y) || 1,
          centro: {
            x: (primeiro.x + segundo.x) / 2,
            y: (primeiro.y + segundo.y) / 2,
          },
          centroPalco,
          zoom: zoomMapa,
          pan: { ...panMapa },
        };
        inicioPanMapaRef.current = null;
        setMapaArrastando(false);
        setTokenArrastando(null);
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        return;
      }
    }
    if (
      !navegandoEditor && event.target.closest?.(
        ".mesa-token, .mesa-token-rotacao, .mesa-token-lanterna-toggle",
      )
    )
      return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    inicioPanMapaRef.current = {
      ponteiroX: event.clientX,
      ponteiroY: event.clientY,
      panX: panMapa.x,
      panY: panMapa.y,
    };
    setMapaArrastando(true);
  };

  const moverPanMapa = (event) => {
    if (
      event.pointerType === "touch" &&
      ponteirosMapaRef.current.has(event.pointerId)
    ) {
      ponteirosMapaRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }
    const inicioPinca = inicioPincaMapaRef.current;
    if (inicioPinca && ponteirosMapaRef.current.size >= 2) {
      const [primeiro, segundo] = [...ponteirosMapaRef.current.values()];
      const distancia =
        Math.hypot(segundo.x - primeiro.x, segundo.y - primeiro.y) || 1;
      const centroAtual = {
        x: (primeiro.x + segundo.x) / 2,
        y: (primeiro.y + segundo.y) / 2,
      };
      const zoom = Math.max(
        0.5,
        Math.min(3, inicioPinca.zoom * (distancia / inicioPinca.distancia)),
      );
      const proporcao = zoom / inicioPinca.zoom;
      setZoomMapa(Number(zoom.toFixed(3)));
      setPanMapa({
        x:
          centroAtual.x -
          inicioPinca.centroPalco.x -
          (inicioPinca.centro.x -
            inicioPinca.centroPalco.x -
            inicioPinca.pan.x) *
            proporcao,
        y:
          centroAtual.y -
          inicioPinca.centroPalco.y -
          (inicioPinca.centro.y -
            inicioPinca.centroPalco.y -
            inicioPinca.pan.y) *
            proporcao,
      });
      event.preventDefault();
      return true;
    }
    const inicio = inicioPanMapaRef.current;
    if (!inicio || tokenArrastando) return;
    setPanMapa({
      x: inicio.panX + event.clientX - inicio.ponteiroX,
      y: inicio.panY + event.clientY - inicio.ponteiroY,
    });
    return false;
  };

  const finalizarPanMapa = (event) => {
    if (event.pointerType === "touch") {
      const estavaEmPinca = Boolean(inicioPincaMapaRef.current);
      ponteirosMapaRef.current.delete(event.pointerId);
      if (ponteirosMapaRef.current.size < 2) inicioPincaMapaRef.current = null;
      if (estavaEmPinca) {
        inicioPanMapaRef.current = null;
        setMapaArrastando(false);
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        return true;
      }
    }
    if (!inicioPanMapaRef.current) return;
    inicioPanMapaRef.current = null;
    setMapaArrastando(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    return false;
  };

  const cenaMapaAtual = campanha?.cenaAtiva;
  const mapaAtualIluminacao = cenaMapaAtual
    ? midiasDaCena(cenaMapaAtual, "mapa").find(
        (item) => item.id === campanha?.midiaAtivaId,
      ) || midiasDaCena(cenaMapaAtual, "mapa")[0]
    : null;
  const chaveMapaIluminacao = `${cenaMapaAtual?.id || ""}:${mapaAtualIluminacao?.id || ""}`;
  const assinaturaIluminacaoRemota = JSON.stringify(
    mapaAtualIluminacao?.iluminacao || null,
  );

  useEffect(() => {
    setConfiguracaoIluminacao(
      mapaAtualIluminacao?.iluminacao || {
        paredes: [],
        portas: [],
        luzes: [],
        escuridao: 0,
        periodo: "dia",
      },
    );
    setEditorIluminacaoAberto(false);
    // A chave representa a troca real de mapa; o rascunho nao deve ser
    // reiniciado a cada atualizacao remota de tokens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveMapaIluminacao]);

  useEffect(() => {
    if (editorIluminacaoAberto || salvandoIluminacao || salvamentoIluminacaoTimerRef.current || iluminacaoPendenteRef.current?.chave === chaveMapaIluminacao) return;
    setConfiguracaoIluminacao(
      mapaAtualIluminacao?.iluminacao || {
        paredes: [],
        portas: [],
        luzes: [],
        escuridao: 0,
        periodo: "dia",
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinaturaIluminacaoRemota, editorIluminacaoAberto, salvandoIluminacao]);

  const salvarConfiguracaoIluminacao = async (configuracaoOverride = null) => {
    if (!cenaMapaAtual || !mapaAtualIluminacao) return;
    const configuracaoParaSalvar = Array.isArray(configuracaoOverride?.portas)
      ? configuracaoOverride
      : configuracaoIluminacao;
    setSalvandoIluminacao(true);
    setErro("");
    try {
      const mapasBatalha = midiasDaCena(cenaMapaAtual, "mapa").map((mapa) =>
        mapa.id === mapaAtualIluminacao.id
          ? { ...mapa, iluminacao: configuracaoParaSalvar }
          : mapa,
      );
      await salvarCena(campanha.id, {
        ...cenaMapaAtual,
        mapasBatalha,
        mapas_batalha: mapasBatalha,
      });
      if (iluminacaoPendenteRef.current?.configuracao === configuracaoParaSalvar)
        iluminacaoPendenteRef.current = null;
      setCampanha((atual) => {
        const cenas = atual.cenas.map((item) =>
          item.id === cenaMapaAtual.id
            ? { ...item, mapasBatalha, mapas_batalha: mapasBatalha }
            : item,
        );
        return {
          ...atual,
          cenas,
          cenaAtiva: cenas.find((item) => item.id === atual.cenaAtiva?.id),
        };
      });
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a iluminacao do mapa.");
    } finally {
      setSalvandoIluminacao(false);
    }
  };

  const alterarConfiguracaoIluminacao = (proxima) => {
    iluminacaoPendenteRef.current = { chave: chaveMapaIluminacao, configuracao: proxima };
    setConfiguracaoIluminacao(proxima);
    if (salvamentoIluminacaoTimerRef.current)
      clearTimeout(salvamentoIluminacaoTimerRef.current);
    salvamentoIluminacaoTimerRef.current = setTimeout(() => {
      salvamentoIluminacaoTimerRef.current = null;
      filaIluminacaoRef.current = filaIluminacaoRef.current.then(() =>
        salvarConfiguracaoIluminacao(proxima),
      );
    }, 450);
  };

  useEffect(
    () => () => {
      if (salvamentoIluminacaoTimerRef.current)
        clearTimeout(salvamentoIluminacaoTimerRef.current);
    },
    [],
  );

  if (carregando) return <main className="mesa-estado">Abrindo a mesa...</main>;
  if (erro && !campanha)
    return (
      <main className="mesa-estado">
        <p>{erro}</p>
        <a href="/">Voltar</a>
      </main>
    );

  const adicionarParticipanteEscudo = async (record) => {
    await vincularInimigo(campanha.id,record);
    await carregar();
  };
  const salvarParticipanteEscudo = async (record) => {
    const saved = await atualizarInimigoCampanha(campanha.id, record);
    setCampanha(current => ({...current, inimigos:(current.inimigos || []).map(item=>item.id===saved.id ? saved:item)}));
    setInimigoAberto(current=>current?.id===saved.id ? saved:current);
    return saved;
  };
  const salvarDificuldadeCena = async (patch) => {
    if (!mestre || !campanha?.cenaAtiva) return;
    const cena = {...campanha.cenaAtiva, dificuldades: {ambiente:4, combateAmbiente:4, conflitos:4, ...campanha.cenaAtiva.dificuldades, ...patch}};
    try {
      await salvarCena(campanha.id, cena);
      setCampanha(atual => ({...atual, cenaAtiva: atual.cenaAtiva?.id === cena.id ? cena : atual.cenaAtiva, cenas: (atual.cenas || []).map(item => item.id === cena.id ? cena : item)}));
    } catch (error) {
      setErro(error.message || "Não foi possível salvar a dificuldade da cena.");
    }
  };

  const cena = cenaAtivaVisivel;
  const palcoUrl = urlCena(cena, campanha.modo, campanha.midiaAtivaId);
  const mediaAnimada = campanha?.modo === "cena" ? (cena?.imagensCena || []).find(m=>m.id===campanha.midiaAtivaId) || cena?.imagensCena?.[0] : null;
  const midiaAtiva =
    midiasDaCena(cena, campanha.modo).find(
      (item) => item.id === campanha.midiaAtivaId,
    ) || midiasDaCena(cena, campanha.modo)[0];
  const palcoVideo = specialSceneMediaType({url:palcoUrl,fallback:midiaAtiva?.tipoMidia}) === 'video';
  const colunas =
    midiaAtiva?.larguraGrade || cena?.largura_grade || cena?.larguraGrade || 12;
  const linhas =
    midiaAtiva?.alturaGrade || cena?.altura_grade || cena?.alturaGrade || 8;
  const membroJogador = campanha.membros.find(
    (membro) => membro.ficha_id === fichaJogadorId,
  );
  const personagemJogador = membroJogador
    ? personagens[membroJogador.ficha_id]
    : null;
  const luzesDosTokens = (campanha.tokens || [])
    .map((token) => ({ ...token, ...estadoTokenNoMapa(token) }))
    .filter(
      (token) =>
        token.lanterna?.ativa &&
        !token.removido &&
        !token.oculto,
    )
    .map((token) => ({
      id: `lanterna-${token.id}`,
      tokenId: token.id,
      x: Number(token.x) || 0,
      y: Number(token.y) || 0,
      alcance: Number(token.lanterna.alcance) || 18,
      cor: token.lanterna.cor || "#f4c76b",
      tipo: "cone",
      direcao: Number(token.lanterna.direcao) || 0,
      abertura: Number(token.lanterna.abertura) || 70,
    }));
  const configuracaoVisao = configuracaoIluminacao || {};
  const periodoMapa =
    configuracaoVisao.periodo ||
    (Number(configuracaoVisao.escuridao) > 0 ? "noite" : "dia");
  const bloqueadoresVisao = [
    ...(configuracaoVisao.paredes || []),
    ...(configuracaoVisao.portas || []).filter((porta) => !porta.aberta),
  ];
  const observadoresJogador = (campanha.tokens || [])
    .filter((token) => fichaJogadorId != null && String(token.ficha_id) === String(fichaJogadorId))
    .map((token) => ({ ...token, ...estadoTokenNoMapa(token) }))
    .filter((token) => !token.removido && !token.oculto);
  const tokenVisivelParaJogador = (token) => {
    if (mestre) return true;
    if (fichaJogadorId != null && String(token.ficha_id) === String(fichaJogadorId)) return true;
    if (!pontoVisivelPorObservadores(observadoresJogador, token, bloqueadoresVisao)) return false;
    if (periodoMapa !== "noite") return true;
    return [...(configuracaoVisao.luzes || []), ...luzesDosTokens]
      .some((luz) => pontoVisivelPorLuz(luz, token, bloqueadoresVisao));
  };

  const membrosOrdenados = [...(campanha.membros || [])].sort((a, b) => {
    if (!modoIniciativaAtivo) return 0;
    const iniciativaA = campanha.iniciativas?.[a.ficha_id];
    const iniciativaB = campanha.iniciativas?.[b.ficha_id];
    const temA = iniciativaA != null;
    const temB = iniciativaB != null;
    if (temA && !temB) return -1;
    if (!temA && temB) return 1;
    if (temA && temB && Number(iniciativaB) !== Number(iniciativaA))
      return Number(iniciativaB) - Number(iniciativaA);
    return campanha.membros.indexOf(a) - campanha.membros.indexOf(b);
  });
  const tituloParticipantes = modoIniciativaAtivo
    ? "Iniciativa"
    : "Participantes";

  const ordemCombate = modoIniciativaAtivo ? initiativeOrder(campanha,personagens) : [];

  const controlarTurno = async (action,target) => {
    if(!mestre || !campanha?.combateAtivo || turnBusyRef.current) return;
    turnBusyRef.current=true;setTurnBusy(true);
    try {
      const next=nextCombatTurn(campanha.turnoCombate,ordemCombate,action,target);
      const saved=await salvarTurnoCombate(campanha.id,next,campanha.turnoCombate?.revision || 0);
      setCampanha(current=>({...current,turnoCombate:saved}));
    } catch(error) {setErro(error.message || 'Não foi possível atualizar o turno.');}
    finally {turnBusyRef.current=false;setTurnBusy(false);}
  };

  const agruparPorPastaNpc = (itens) => {
    const grupos = new Map();
    itens.forEach((item) => {
      const pasta = String(item.pasta || "Sem pasta").trim() || "Sem pasta";
      if (!grupos.has(pasta)) grupos.set(pasta, []);
      grupos.get(pasta).push(item);
    });

    return [...grupos.entries()].sort(([a], [b]) => {
      if (a === "Sem pasta") return 1;
      if (b === "Sem pasta") return -1;
      return a.localeCompare(b, "pt-BR");
    });
  };

  const gruposCenas = (() => {
    const grupos = new Map();
    (campanha?.cenas || []).forEach((item) => {
      const pasta = String(item.pasta || "Sem pasta").trim() || "Sem pasta";
      if (!grupos.has(pasta)) grupos.set(pasta, []);
      grupos.get(pasta).push(item);
    });
    return [...grupos.entries()].sort(([a], [b]) => {
      if (a === "Sem pasta") return 1;
      if (b === "Sem pasta") return -1;
      return a.localeCompare(b, "pt-BR");
    });
  })();
  const nomesPastasCenas = gruposCenas.map(([pasta]) => pasta).filter((pasta) => pasta !== "Sem pasta");
  const alternarPastaCena = (pasta) =>
    setPastasCenasFechadas((atual) => ({ ...atual, [pasta]: !atual[pasta] }));
  const catalogoAtualNpc = catalogoInimigos.filter((item) =>
    subAbaNpcs === "npcs" ? item.tipo === "npc" : item.tipo !== "npc",
  );

  const catalogoDisponivelNpc = catalogoAtualNpc.filter(
    (item) =>
      !(campanha?.inimigos || []).some(
        (vinculado) =>
          String(vinculado.inimigo_ref) === String(item.id || item.fichaId),
      ),
  );

  const inimigosVinculadosDaAba = (campanha?.inimigos || []).filter((item) =>
    subAbaNpcs === "npcs"
      ? (item.tipo || item.dados?.tipo) === "npc"
      : (item.tipo || item.dados?.tipo || "inimigo") !== "npc",
  );

  const gruposInimigosVinculados = agruparPorPastaNpc(inimigosVinculadosDaAba);

  const alternarPastaNpc = (pasta) => {
    const chave = `${subAbaNpcs}:${pasta}`;
    setPastasNpcsFechadas((atual) => ({ ...atual, [chave]: !atual[chave] }));
  };

  const renderMidiasCenaBiblioteca = (item) => {
    const midias = [
      ...(item.imagensCena || []).map((midia) => ({
        ...midia,
        tipo: "cena",
        rotulo: "Cena estatica",
      })),
      ...(item.mapasBatalha || []).map((midia) => ({
        ...midia,
        tipo: "mapa",
        rotulo: "Mapa de batalha",
      })),
    ];
    const primeiraDoModo = midias.find(
      (midia) => midia.tipo === campanha.modo,
    )?.id;
    return midias.length ? (
<section
            className={`biblioteca-midias-ativas ${midiasRecolhidas ? "recolhida" : ""}`}
          >
            <button
              className="biblioteca-midias-toggle"
              onClick={() => setMidiasRecolhidas((valor) => !valor)}
              aria-expanded={!midiasRecolhidas}
            >
              <Icon
                path={midiasRecolhidas ? mdiChevronRight : mdiChevronDown}
                size={0.62}
              />
              <span>Imagens da cena atual</span>
              <b>{midias.length}</b>
            </button>
            {!midiasRecolhidas && (
              <div>
                {midias.map((midia) => (
                  <button
                    key={`${midia.tipo}-${midia.id}`}
                    className={
                      campanha.modo === midia.tipo &&
                      (campanha.midiaAtivaId === midia.id ||
                        (!campanha.midiaAtivaId && primeiraDoModo === midia.id))
                        ? "ativo"
                        : ""
                    }
                    onClick={() => apresentar(item, midia.tipo, midia)}
                    title={`Exibir ${midia.nome}`}
                  >
                    <i style={{ backgroundImage: `url(${midia.url})` }}>
                      <Icon
                        path={
                          midia.tipo === "mapa"
                            ? mdiMapOutline
                            : mdiImageOutline
                        }
                        size={0.62}
                      />
                    </i>
                    <span>
                      <small>{midia.rotulo}</small>
                      <strong>{midia.nome}</strong>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
    ) : <p>Nenhuma imagem ou mapa nesta cena.</p>;
  };
  const renderizarCenaBiblioteca = (item, showFolder=false) => {
    const selecionada = item.id === cena?.id;
    return (
      <div className="biblioteca-scene-card" key={item.id}>
        {showFolder && <div className="biblioteca-scene-folder"><Icon path={mdiFolderOutline} size={0.6}/><span>{item.pasta || 'Sem pasta'}</span></div>}
        <article
          className={selecionada ? "selecionado" : ""}
          style={{
            backgroundImage: `url(${urlCena(item, "cena") || urlCena(item, "mapa")})`,
          }}
        >
          <div className="biblioteca-item-conteudo">
            <span>{selecionada ? "No ar" : "Cena salva"}</span>
            <strong>{item.nome}</strong>
            <small>
              {item.visualizarTodos === false
                ? `${item.jogadoresVisiveis?.length || 0} jogador(es) podem ver`
                : urlCena(item, "mapa") ? "Mapa preparado" : "Sem mapa"}
            </small>
          </div>
          <div className="biblioteca-item-acoes">
            <button
              onClick={() => apresentar(item, "cena")}
              title="Exibir cena"
            >
              <Icon path={mdiPlay} size={0.72} />
            </button>
            {urlCena(item, "mapa") && (
              <button
                onClick={() => apresentar(item, "mapa")}
                title="Abrir mapa"
              >
                <Icon path={mdiMapOutline} size={0.72} />
              </button>
            )}
            {item.cenaEspecial?.ativo && item.cenaEspecial?.midiaUrl && (
              <button onClick={() => apresentar(item, "especial")} title="Exibir cena especial">
                <Icon path={mdiMusicBoxMultipleOutline} size={0.72} />
              </button>
            )}
            <button onClick={() => abrirEditor(item)} title="Editar">
              <Icon path={mdiPencilOutline} size={0.72} />
            </button>
            <button onClick={() => removerCena(item)} title="Excluir">
              <Icon path={mdiDeleteOutline} size={0.72} />
            </button>
          </div>
        </article>
        {!showFolder && selecionada && renderMidiasCenaBiblioteca(item)}
      </div>
    );
  };
  const renderDocumentosMestre = () => (
<aside className="mesa-documentos-painel">
          <div className="mesa-lateral-titulo">
            <Icon path={mdiFileDocumentMultipleOutline} size={0.8} />
            <span>Visualizador de documentos</span>
            <b>{documentosDisponiveis.length}</b>
          </div>
          <form className="documentos-envio" onSubmit={enviarDocumentoParaInvestigacao}>
            <div className="documentos-envio-titulo">
              <strong>Compartilhar evidencia ou item</strong>
              <small>PDF ou imagem · max. 12 MB</small>
            </div>
            <div className="documentos-envio-campos">
              <select
                value={novoDocumento.categoria}
                onChange={(event) =>
                  setNovoDocumento((atual) => ({
                    ...atual,
                    categoria: event.target.value,
                  }))
                }
                aria-label="Tipo do documento"
              >
                <option value="evidencia">Evidencia</option>
                <option value="item">Item</option>
                <option value="interativa">Evidencia interativa</option>
              </select>
              <input
                type="text"
                placeholder="Nome da evidencia"
                value={novoDocumento.nome}
                onChange={(event) =>
                  setNovoDocumento((atual) => ({
                    ...atual,
                    nome: event.target.value,
                  }))
                }
              />
            </div>
            <textarea
              rows="2"
              placeholder="Descricao opcional"
              value={novoDocumento.descricao}
              onChange={(event) =>
                setNovoDocumento((atual) => ({
                  ...atual,
                  descricao: event.target.value,
                }))
              }
            />
            <div className="documentos-visibilidade">
              <div className="documentos-visibilidade-cabecalho">
                <div>
                  <strong>Quem pode visualizar?</strong>
                  <small>
                    {novoDocumento.visualizarTodos
                      ? "A evidencia ficara disponivel para todos."
                      : "Selecione os jogadores que receberao a evidencia."}
                  </small>
                </div>
                <button
                  type="button"
                  className={novoDocumento.visualizarTodos ? "ativo" : ""}
                  aria-pressed={novoDocumento.visualizarTodos}
                  onClick={() =>
                    setNovoDocumento((atual) => ({
                      ...atual,
                      visualizarTodos: !atual.visualizarTodos,
                      jogadoresVisiveis: !atual.visualizarTodos
                        ? []
                        : atual.jogadoresVisiveis,
                    }))
                  }
                >
                  Visualizar para todos
                </button>
              </div>
              {!novoDocumento.visualizarTodos && (
                <div className="documentos-visibilidade-jogadores">
                  {(campanha.membros || []).map((membro) => {
                    const fichaId = String(membro.ficha_id || "");
                    const selecionado = (novoDocumento.jogadoresVisiveis || [])
                      .map(String)
                      .includes(fichaId);
                    const personagem = personagens[membro.ficha_id];
                    return (
                      <label
                        className={selecionado ? "selecionado" : ""}
                        key={membro.id || fichaId}
                      >
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => alternarJogadorDocumento(fichaId)}
                        />
                        <span>
                          {personagem?.fotoPerfil ? (
                            <img src={personagem.fotoPerfil} alt="" />
                          ) : (
                            (personagem?.nome || membro.nome || "?").slice(0, 2)
                          )}
                        </span>
                        <b>{personagem?.nome || membro.nome}</b>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={`documentos-envio-acoes ${novoDocumento.categoria === "interativa" ? "interativa" : ""}`}>
              {novoDocumento.categoria === "interativa" ? (
                <div className="evidencia-interativa-configuracao">
                  <div className="evidencia-modelos-titulo"><span>FORMATO DA EVIDÊNCIA</span><small>Escolha uma experiência</small></div>
                <div className="evidencia-interativa-modelos">
                  <button type="button" aria-pressed={novoDocumento.modeloInterativo === "cassete"} className={novoDocumento.modeloInterativo === "cassete" ? "ativo" : ""} onClick={() => setNovoDocumento((atual) => ({ ...atual, modeloInterativo: "cassete", arquivo: null }))}>
                    <b>◉◉</b><span><strong>Fita cassete</strong><small>Áudio e rebobinamento</small></span>
                  </button>

                  <button type="button" aria-pressed={novoDocumento.modeloInterativo === "msdos"} className={novoDocumento.modeloInterativo === "msdos" ? "ativo" : ""} onClick={() => setNovoDocumento((atual) => ({ ...atual, modeloInterativo: "msdos" }))}>
                    <b>C:\&gt;</b><span><strong>MS-DOS 6.13</strong><small>Terminal classico</small></span>
                  </button>
                  <button type="button" aria-pressed={novoDocumento.modeloInterativo === "modern-pc"} className={novoDocumento.modeloInterativo === "modern-pc" ? "ativo" : ""} onClick={() => setNovoDocumento((atual) => ({ ...atual, modeloInterativo: "modern-pc" }))}>
                    <b>PC</b><span><strong>Computador moderno</strong><small>Internet, mensagens e arquivos</small></span>
                  </button>
                </div>
                  {novoDocumento.modeloInterativo === "cassete" && <label className={`cassete-upload ${novoDocumento.arquivo ? "selecionado" : ""}`}><span className="cassete-upload-icone"><Icon path={mdiUploadOutline} size={0.9} /></span><span className="cassete-upload-texto"><strong>{novoDocumento.arquivo?.name || "Selecione o áudio da fita"}</strong><small>MP3, OGG, WAV ou M4A · até 20 MB</small></span><span className="cassete-upload-acao">{novoDocumento.arquivo ? "Trocar" : "Escolher"}</span><input aria-label="Selecionar áudio da fita" type="file" accept={ACEITAR_AUDIO} onChange={(event) => {
                    const arquivo = event.target.files?.[0] || null;
                    try { if (arquivo) validarArquivoImagem(arquivo, "audio"); setNovoDocumento((atual) => ({ ...atual, arquivo })); setErro(""); }
                    catch (error) { event.target.value = ""; setNovoDocumento((atual) => ({ ...atual, arquivo: null })); setErro(error.message); }
                  }} /></label>}
                </div>
              ) : (
              <label className={`documento-arquivo-seletor ${novoDocumento.arquivo ? "selecionado" : ""}`}>
                <Icon path={mdiFileDocumentMultipleOutline} size={0.68} />
                <span>{novoDocumento.arquivo?.name || "Selecionar arquivo"}</span>
                <input
                  ref={arquivoDocumentoRef}
                  type="file"
                  accept="application/pdf,image/webp,image/jpeg,image/png,image/avif"
                  onChange={(event) => {
                    const arquivo = event.target.files?.[0] || null;
                    if (!arquivo) {
                      setNovoDocumento((atual) => ({ ...atual, arquivo: null }));
                      return;
                    }
                    try {
                      validarArquivoInvestigacao(arquivo);
                      setNovoDocumento((atual) => ({ ...atual, arquivo }));
                      setErro("");
                      setEstadoEnvioDocumento("");
                    } catch (error) {
                      event.target.value = "";
                      setNovoDocumento((atual) => ({ ...atual, arquivo: null }));
                      setErro(error.message || "Arquivo invalido.");
                      setEstadoEnvioDocumento(`Erro: ${error.message || "Arquivo invalido."}`);
                    }
                  }}
                />
              </label>
              )}
              <div className="documentos-envio-botoes">
                <button
                  type="submit"
                  name="acaoDocumento"
                  value="preparar"
                  className="secundario"
                  disabled={
                    (novoDocumento.categoria !== "interativa" && !novoDocumento.arquivo) ||
                    enviandoDocumento ||
                    (!novoDocumento.visualizarTodos &&
                      !(novoDocumento.jogadoresVisiveis || []).length)
                  }
                >
                  Preparar evidencia
                </button>
                <button
                  type="submit"
                  name="acaoDocumento"
                  value="enviar"
                  disabled={
                    (novoDocumento.categoria !== "interativa" && !novoDocumento.arquivo) ||
                    enviandoDocumento ||
                    (!novoDocumento.visualizarTodos &&
                      !(novoDocumento.jogadoresVisiveis || []).length)
                  }
                >
                  <Icon path={mdiUploadOutline} size={0.68} />
                  {enviandoDocumento
                    ? "Salvando..."
                    : novoDocumento.categoria === "interativa"
                      ? novoDocumento.modeloInterativo === "cassete" ? "Compartilhar fita cassete" : "Disponibilizar sistema"
                      : "Enviar aos jogadores"}
                </button>
              </div>
            </div>
            {estadoEnvioDocumento && (
              <p
                className={`documentos-envio-estado ${estadoEnvioDocumento.startsWith("Erro:") ? "erro" : ""}`}
                role="status"
              >
                {estadoEnvioDocumento}
              </p>
            )}
          </form>
          <div className="documentos-lista">
            {documentosDisponiveis.length ? (
              documentosDisponiveis.map((documento) => {
                const editandoVisibilidade =
                  visibilidadeDocumentoEditando?.id === documento.id;
                const visualizarTodosEditando =
                  editandoVisibilidade
                    ? visibilidadeDocumentoEditando.visualizarTodos !== false
                    : documento.visualizarTodos !== false;
                const jogadoresEditando = editandoVisibilidade
                  ? visibilidadeDocumentoEditando.jogadoresVisiveis || []
                  : documento.jogadoresVisiveis || [];
                return (
                  <article
                    className={`documento-card ${editandoVisibilidade ? "editando-visibilidade" : ""}`}
                    key={documento.id}
                  >
                    <button
                      type="button"
                      className="documento-card-abrir"
                      onClick={() => {
                        setAbaEvidenciaInterativa("terminal");
                        setDocumentoAberto(documento);
                      }}
                    >
                      <div className="documento-card-preview">
                        {documento.categoria === "interativa" ? (
                          <span>{String(documento.mimeType || documento.mime_type).includes("modern-pc") ? "PC" : "DOS"}</span>
                        ) : String(documento.mimeType || documento.mime_type || "").startsWith("image/") ? (
                          <img src={documento.url} alt="" />
                        ) : (
                          <span>PDF</span>
                        )}
                      </div>
                      <div>
                        <small>{documento.categoria === "interativa" ? "Evidencia interativa" : documento.categoria === "item" ? "Item" : "Evidencia"}</small>
                        <strong>{nomeDocumentoExibicao(documento)}</strong>
                        <p>{documento.descricao || documento.arquivoNome || documento.arquivo_nome || "Clique para visualizar"}</p>
                        <em className="documento-visibilidade-resumo">
                          {nomesVisibilidadeDocumento(documento)}
                        </em>
                      </div>
                    </button>
                    {documento.revelada === false && (
                      <div className="documento-card-preparado-acoes">
                        <span>Preparada · invisivel aos jogadores</span>
                        <button
                          type="button"
                          onClick={() => enviarEvidenciaPreparada(documento)}
                          disabled={Boolean(enviandoDocumentoPreparadoId)}
                        >
                          <Icon path={mdiUploadOutline} size={0.62} />
                          {enviandoDocumentoPreparadoId === documento.id
                            ? "Enviando..."
                            : "Enviar evidencia preparada"}
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className={`documento-card-editar ${editandoVisibilidade ? "ativo" : ""}`}
                      onClick={() => abrirEdicaoVisibilidadeDocumento(documento)}
                      title="Editar quem pode visualizar"
                      aria-label={`Editar visibilidade de ${documento.nome}`}
                    >
                      <Icon path={mdiPencilOutline} size={0.64} />
                    </button>
                    <button
                      type="button"
                      className="documento-card-remover"
                      onClick={() => removerDocumentoDaInvestigacao(documento)}
                      title="Remover do visualizador"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                    {editandoVisibilidade && (
                      <div className="documentos-visibilidade documento-visibilidade-existente">
                        <div className="documentos-visibilidade-cabecalho">
                          <div>
                            <strong>Quem pode visualizar?</strong>
                            <small>
                              {visualizarTodosEditando
                                ? "Este documento esta disponivel para todos."
                                : "Escolha quais jogadores podem consultar este documento."}
                            </small>
                          </div>
                          <button
                            type="button"
                            className={visualizarTodosEditando ? "ativo" : ""}
                            aria-pressed={visualizarTodosEditando}
                            onClick={() =>
                              setVisibilidadeDocumentoEditando((atual) => ({
                                ...atual,
                                visualizarTodos: !atual.visualizarTodos,
                                jogadoresVisiveis: !atual.visualizarTodos
                                  ? []
                                  : atual.jogadoresVisiveis,
                              }))
                            }
                          >
                            Visualizar para todos
                          </button>
                        </div>
                        {!visualizarTodosEditando && (
                          <div className="documentos-visibilidade-jogadores">
                            {(campanha.membros || []).map((membro) => {
                              const fichaId = String(membro.ficha_id || "");
                              const selecionado = jogadoresEditando
                                .map(String)
                                .includes(fichaId);
                              const personagem = personagens[membro.ficha_id];
                              return (
                                <label
                                  className={selecionado ? "selecionado" : ""}
                                  key={membro.id || fichaId}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selecionado}
                                    onChange={() => alternarJogadorDocumentoExistente(fichaId)}
                                  />
                                  <span>
                                    {personagem?.fotoPerfil ? (
                                      <img src={personagem.fotoPerfil} alt="" />
                                    ) : (
                                      (personagem?.nome || membro.nome || "?").slice(0, 2)
                                    )}
                                  </span>
                                  <b>{personagem?.nome || membro.nome}</b>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        <div className="documento-visibilidade-edicao-acoes">
                          <button
                            type="button"
                            className="secundario"
                            onClick={() => setVisibilidadeDocumentoEditando(null)}
                            disabled={salvandoVisibilidadeDocumento}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => salvarVisibilidadeDocumentoExistente(documento)}
                            disabled={
                              salvandoVisibilidadeDocumento ||
                              (!visualizarTodosEditando && !jogadoresEditando.length)
                            }
                          >
                            {salvandoVisibilidadeDocumento ? "Salvando..." : "Salvar visibilidade"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="documentos-vazio">
                <Icon path={mdiFileDocumentMultipleOutline} size={1.2} />
                <strong>Nenhum documento compartilhado</strong>
                <p>Envie uma evidencia ou item para que todos os jogadores possam consultar.</p>
              </div>
            )}
          </div>
        </aside>
  );
  const renderVisualizadorDocumento = () => documentoAberto ? createPortal((<div className="mesa-shell shield-document-viewer-host">
<div className="documento-visualizador-fundo">
          <section
            className={`documento-visualizador ${documentoAberto.categoria === "interativa" ? "interativo" : ""}`}
            role="dialog"
            aria-label={`Visualizador de ${nomeDocumentoExibicao(documentoAberto)}`}
          >
            <header>
              <div>
                <small>{documentoAberto.categoria === "interativa" ? "Evidencia interativa" : documentoAberto.categoria === "item" ? "Item" : "Evidencia"}</small>
                <strong>{nomeDocumentoExibicao(documentoAberto)}</strong>
              </div>
              {mestre && documentoAberto.categoria === "interativa" && !String(documentoAberto.mimeType || documentoAberto.mime_type).includes("cassete") && (
                <nav className="evidencia-interativa-abas" aria-label="Visualizacao da evidencia interativa">
                  <button
                    type="button"
                    className={abaEvidenciaInterativa === "terminal" ? "ativo" : ""}
                    onClick={() => setAbaEvidenciaInterativa("terminal")}
                  >
                    {String(documentoAberto.mimeType || documentoAberto.mime_type).includes("modern-pc") ? "Computador" : "Terminal"}
                  </button>
                  <button
                    type="button"
                    className={abaEvidenciaInterativa === "conteudo" ? "ativo" : ""}
                    onClick={() => setAbaEvidenciaInterativa("conteudo")}
                  >
                    Conteudo
                  </button>
                </nav>
              )}
              <button
                type="button"
                onClick={() => setDocumentoAberto(null)}
                title="Fechar documento"
              >
                <Icon path={mdiClose} size={0.82} />
              </button>
            </header>
            <div className="documento-visualizador-conteudo">
              {String(documentoAberto.mimeType || documentoAberto.mime_type).includes("cassete") ? (
                <ReprodutorCassete key={documentoAberto.id} documento={documentoAberto} />
              ) : String(documentoAberto.mimeType || documentoAberto.mime_type).includes("modern-pc") ? (
                <ComputadorModerno key={`${documentoAberto.id}-${abaEvidenciaInterativa}`} campanhaId={campanha.id} documento={documentoAberto} admin={mestre && abaEvidenciaInterativa === "conteudo"} />
              ) : documentoAberto.categoria === "interativa" ? (
                <iframe
                  className="evidencia-interativa-frame"
                  title={documentoAberto.nome || "Computador interativo"}
                  src={
                    String(documentoAberto.mimeType || documentoAberto.mime_type).includes("modern-pc")
                      ? `/interactive/modern-pc/index.html${mestre && abaEvidenciaInterativa === "conteudo" ? "?admin=1" : ""}`
                      : mestre && abaEvidenciaInterativa === "conteudo"
                        ? "/interactive/ms-dos/index.html#/admin-secreto-123"
                        : documentoAberto.url || "/interactive/ms-dos/index.html"
                  }
                  allow="autoplay"
                />
              ) : String(documentoAberto.mimeType || documentoAberto.mime_type || "").startsWith("image/") ? (
                <EvidenceImageViewer key={documentoAberto.id} src={documentoAberto.url} alt={documentoAberto.nome || "Evidência"} />
              ) : String(documentoAberto.mimeType || documentoAberto.mime_type || "") === "application/pdf" ? (
                <iframe
                  title={documentoAberto.nome || "Documento PDF"}
                  src={documentoAberto.url}
                />
              ) : (
                <div className="documento-sem-preview">
                  <Icon path={mdiFileDocumentMultipleOutline} size={2} />
                  <strong>Visualizacao indisponivel</strong>
                  <p>Este arquivo nao possui uma visualizacao integrada.</p>
                </div>
              )}
            </div>
            {documentoAberto.descricao && (
              <p className="documento-visualizador-descricao">
                {documentoAberto.descricao}
              </p>
            )}
          </section>
        </div>
  </div>), document.body) : null;
  const renderShieldScenes = (flat=false) => (
<aside className={`mesa-biblioteca ${flat ? "shield-scenes-layout" : ""}`}>
          <div className="biblioteca-cabecalho">
            <div>
              <span>Direcao da sessao</span>
              <h2>Cenas e mapas</h2>
            </div>
          {flat && <aside className="shield-scene-media" aria-label="Mídias da cena atual"><h3>{cena?.nome || 'Cena atual'}</h3>{cena ? renderMidiasCenaBiblioteca(cena) : <p>Selecione uma cena para consultar suas imagens e mapas.</p>}</aside>}
            <button onClick={() => abrirEditor()} title="Nova cena">
              <Icon path={mdiPlus} size={0.9} />
            </button>
          </div>
          {!flat && <div className="biblioteca-fichas">
            <span>Fichas da campanha</span>
            <div>
              <select
                value={fichaParaVincular}
                onChange={(e) => setFichaParaVincular(e.target.value)}
              >
                <option value="">Selecionar ficha...</option>
                {fichasDisponiveis
                  .filter(
                    (item) =>
                      !campanha.membros.some(
                        (membro) => membro.ficha_id === item.fichaId,
                      ),
                  )
                  .map((item) => (
                    <option key={item.fichaId} value={item.fichaId}>
                      {item.personagem?.nome || item.fichaId}
                    </option>
                  ))}
              </select>
              <button
                onClick={adicionarFicha}
                disabled={!fichaParaVincular}
                title="Vincular ficha"
              >
                <Icon path={mdiAccountPlusOutline} size={0.78} />
              </button>
            </div>
            {erroFichas && (
              <div className="biblioteca-fichas-erro">
                <span>{erroFichas}</span>
                <button onClick={carregarFichas}>Tentar novamente</button>
              </div>
            )}
            {!erroFichas && fichasDisponiveis.length === 0 && (
              <small>Nenhuma ficha cadastrada foi encontrada.</small>
            )}
          </div>}
          <div className={`biblioteca-lista biblioteca-cenas-organizadas ${flat ? "biblioteca-cenas-grid" : ""}`}>
            {flat ? gruposCenas.flatMap(([,cenas])=>cenas.map(item=>renderizarCenaBiblioteca(item,true))) : gruposCenas.map(([pasta, cenas]) => {
              const fechada = Boolean(pastasCenasFechadas[pasta]);
              return (
                <section className="biblioteca-pasta-cenas" key={pasta}>
                  <button type="button" className="biblioteca-pasta-cabecalho" onClick={() => alternarPastaCena(pasta)} aria-expanded={!fechada}>
                    <Icon path={fechada ? mdiChevronRight : mdiChevronDown} size={0.68} />
                    <Icon path={mdiFolderOutline} size={0.74} />
                    <strong>{pasta}</strong>
                    <span>{cenas.length}</span>
                  </button>
                  {!fechada && cenas.map(item=>renderizarCenaBiblioteca(item))}
                </section>
              );
            })}
          </div>
        </aside>
  );
  const renderShieldParticipants = (integrated=false) => (
<section
          key={`mestre-participantes-${chavePainelParticipantes}`}
          className={integrated ? "shield-session-participants" : "mesa-lateral"}
        >
          <>
            <div className="mesa-lateral-titulo">
              <Icon path={mdiShieldCrownOutline} size={0.8} />
              <span>{tituloParticipantes}</span>
              <b>{modoIniciativaAtivo ? ordemCombate.length : campanha.membros.length}</b>
            </div>
            {campanha.combateAtivo && <CombatTurnControls entries={ordemCombate} turn={campanha.turnoCombate} busy={turnBusy} onAction={controlarTurno}/>}
            <div className="mesa-membros">
              {modoIniciativaAtivo ? (
                <InitiativeCards turn={campanha.combateAtivo?campanha.turnoCombate:null} entries={ordemCombate} master onSaveEnemy={salvarParticipanteEscudo} candidates={campanha.inimigos || []} onAdd={integrated ? undefined : adicionarIniciativaNoPainel} system={campanha.sistema} drafts={iniciativasRascunho} onChange={alterarRascunhoIniciativa} onConfirm={confirmarIniciativaMestre} onEntryChange={alterarRascunhoIniciativaPorChave} onEntryConfirm={confirmarIniciativaPorChave} onRemove={removerIniciativaPorChave} onOpen={entrada=>{
                  if(entrada.tipo==='jogador') setFichaAberta({membro:entrada.membro,personagem:entrada.personagem});
                  else if(entrada.inimigo) {setAbaLateralMestre('inimigos');setSubAbaNpcs(entrada.tipo==='npc'?'npcs':'inimigos');setInimigoAberto(entrada.inimigo);}
                }}/>
              ) : (
                <>
                  {campanha.membros.length ? (
                <ParticipantDossiers members={membrosOrdenados} characters={personagens} master onOpen={(membro,personagem)=>setFichaAberta({membro,personagem})}/>
              ) : (
                <p>Nenhuma ficha vinculada ainda.</p>
                  )}
                </>
              )}
            </div>
          </>
        </section>
  );
  const renderShieldSceneEditor = () => editorAberto ? createPortal(<div className="mesa-shell shield-scene-editor-host"> <TabletopSceneEditor key={editando.id || 'nova'} editando={editando} setEditando={setEditando} arquivos={arquivos} campanha={campanha} nomesPastasCenas={nomesPastasCenas} selecionarArquivosCena={selecionarArquivosCena} alternarJogadorCena={alternarJogadorCena} removerMidiaExistente={removerMidiaExistente} removerArquivoPendente={removerArquivoPendente} atualizarMapaExistente={atualizarMapaExistente} atualizarMapaPendente={atualizarMapaPendente} confirmarCena={confirmarCena} salvando={salvando} erro={erro} onClose={()=>setEditorAberto(false)}/></div>,document.body) : null;
  const renderShieldTool = (tool) => {
    if(tool==='scenes') return renderShieldScenes(true);
    if(tool==='notes') return <AnotacoesCampanha campanhaId={campanha.id}/>;
    if(tool==='audio') return <MusicaTabletop campanhaId={campanha.id} musicasCampanha={campanha.musicas || []} estadoRemoto={campanha.musicaEstado} aoAlterarEstado={estado=>atualizarEstadoMusica(campanha.id,estado)}/>;
    if(tool==='soundpad') return <SoundpadTabletop sons={campanha.soundpad || []} estadoRemoto={campanha.soundpadEstado} aoAlterarEstado={estado=>atualizarEstadoSoundpad(campanha.id,estado)}/>;
    if(tool==='players') return <ParticipantDossiers members={membrosOrdenados} characters={personagens} master/>;
    if(tool==='dashboard') return <iframe className="shield-dashboard-frame" title="Dashboard do mestre" src="/?mestre=1&embutido=1"/>;
    if(tool.startsWith('enemyInitiative:')) {
      const record=(campanha.inimigos || []).find(item=>String(item.id)===tool.slice('enemyInitiative:'.length));
      if(!modoIniciativaAtivo || !record) return null;
      const turns=ordemCombate.filter(entry=>String(entry.inimigo?.id)===String(record.id));
      return <InlineInitiative record={record} turns={turns} drafts={iniciativasRascunho} onChange={alterarRascunhoIniciativaPorChave} onConfirm={confirmarIniciativaPorChave} onAdd={adicionarIniciativaNoPainel}/>;
    }
    if(tool==='sessionModes') return <div className="shield-session-mode-buttons"><button type="button" disabled={salvandoCombate || salvandoInvestigacao} onClick={alternarModoCombate}>{campanha.combateAtivo?'Encerrar combate':'Iniciar combate'}</button><button type="button" disabled={salvandoCombate || salvandoInvestigacao} onClick={alternarModoInvestigacao}>{campanha.investigacaoAtiva?'Encerrar investigação':'Iniciar investigação'}</button></div>;
    if(tool==='initiative') return (campanha.combateAtivo || campanha.investigacaoAtiva) ? renderShieldParticipants(true) : null;
    if(tool==='combat' || tool==='investigation') return <><button type="button" disabled={salvandoCombate || salvandoInvestigacao} onClick={tool==='combat'?alternarModoCombate:alternarModoInvestigacao}>{tool==='combat' ? (campanha.combateAtivo?'Encerrar combate':'Iniciar combate'):(campanha.investigacaoAtiva?'Encerrar investigação':'Iniciar investigação')}</button></>;
    if(tool==='lighting') return mapaAtualIluminacao ? <div className="shield-lighting-map"><img src={mapaAtualIluminacao.url} alt="Mapa para editar iluminação"/><MapLightingLayer key={chaveMapaIluminacao} mapaUrl={mapaAtualIluminacao.url} configuracao={configuracaoIluminacao} luzesTokens={luzesDosTokens} observadores={null} editando aoAlterar={alterarConfiguracaoIluminacao} salvando={salvandoIluminacao}/></div> : <p>Selecione um mapa de batalha na aba Cenas para configurar a iluminação.</p>;
    return null;
  };
  if(shieldTool) return mestre ? <div className="mesa-shell visao-mestre shield-tools-host">{erro && <p role="alert">{erro}</p>}{renderShieldTool(shieldTool)}{renderShieldSceneEditor()}</div> : <p>Ferramentas disponíveis apenas para o mestre.</p>;
  if (documentsOnly) return mestre ? <div className="mesa-shell visao-mestre shield-documents-host">{erro && <p role="alert">{erro}</p>}{renderDocumentosMestre()}{renderVisualizadorDocumento()}</div> : <p>Documentos disponíveis apenas para o mestre.</p>;

  return (
    <main
      data-document-open={embedded && Boolean(documentoAberto) ? "true" : undefined}
      className={`mesa-shell ${embedded ? "mesa-embedded" : "mesa-2d"} ${!embedded && mestre && escudoAberto ? "mesa-escudo-aberto" : ""} ${focoVisual ? 'mesa-foco-visual' : ''} ${mestre ? "visao-mestre" : "visao-jogador"} ${!mestre && abaLateralJogador === "ficha" ? "jogador-ficha-ativa" : ""} ${!(mestre ? abaLateralMestre : abaLateralJogador) ? "painel-lateral-fechado" : ""} modo-atual-${campanha.modo} ${bibliotecaAberta ? "com-biblioteca" : ""}`}
      style={{
        "--mesa-acento":
          corCena || personagemJogador?.temaFicha?.primaria || "#d4af37",
        "--mesa-secundaria":
          corCena || personagemJogador?.temaFicha?.secundaria || "#8b4513",
        "--mesa-texto": personagemJogador?.temaFicha?.texto || "#fff8ea",
        "--mesa-fundo": personagemJogador?.temaFicha?.fundo || "#080808",
        "--mesa-borda": corCena
          ? `color-mix(in srgb,${corCena} 45%,transparent)`
          : personagemJogador?.temaFicha?.borda || "rgba(212,175,55,.35)",
      }}
    >
      {!embedded && (mestre || !hasActiveRevolt(campanha.mecanicasEspeciais)) && <SpecialMechanicsBanner state={campanha.mecanicasEspeciais} onOpen={() => setMechanicsOpen(true)}/>}
      {!embedded && !mestre && !mechanicsOpen && <RevoltPlayerHUD campaign={campanha} playerId={fichaJogadorId} onOpen={() => setMechanicsOpen(true)} onState={state => setCampanha(current => ({ ...current, mecanicasEspeciais: state }))}/>}
      {mechanicsOpen && <SpecialMechanicsDialog campaign={campanha} master={mestre} playerId={fichaJogadorId} onClose={() => setMechanicsOpen(false)} onState={state => setCampanha(current => ({ ...current, mecanicasEspeciais: state }))}/>}
      <div className={`mesa-transicao ${transicao ? "ativa" : ""}`}>
        <img className="mesa-transicao-simbolo" src="/simbolo-darkness.png" alt=""/>
        <span>
          {campanha.modo === "especial" ? "Iniciando cena especial" : campanha.modo === "mapa" ? "Preparando o mapa" : "Voltando a cena"}
        </span>
      </div>

      {embedded && mestre && ['initiative','investigation'].includes(requestedTool) && <div className="tt3-session-mode"><p>{requestedTool==='initiative' ? 'Organize os turnos e acompanhe os participantes.' : 'Acompanhe a investigação e a iniciativa.'}</p><button type="button" className="tt3-primary" disabled={salvandoCombate || salvandoInvestigacao} onClick={requestedTool==='initiative' ? alternarModoCombate : alternarModoInvestigacao}>{requestedTool==='initiative' ? (campanha.combateAtivo ? 'Encerrar combate' : 'Iniciar combate') : (campanha.investigacaoAtiva ? 'Encerrar investigação' : 'Iniciar investigação')}</button></div>}
<header className="mesa-topo">
        <a
          href={urlRetorno}
          title={mestre ? "Voltar ao dashboard" : "Voltar para a ficha"}
        >
          <Icon path={mdiArrowLeft} size={0.9} />
        </a>
        <div>
          <span>Campanha {campanha.codigo}</span>
          <strong>{campanha.nome}</strong>
        </div>
        <div className="mesa-status">
          <i />
          {supabaseConfigurado ? "Ao vivo" : "Demonstracao"}
        </div>
        <button type="button" className="mesa-cenas-botao" onClick={() => setMechanicsOpen(true)}>Mecânicas especiais</button>
        {mestre && (
          <div className="mesa-ferramentas-mestre">
            <button type="button" className={`mesa-cenas-botao mesa-escudo-topo ${escudoAberto?'ativo':''}`} aria-pressed={escudoAberto} onClick={()=>{setEscudoAberto(aberto=>!aberto);setAbaLateralMestre('');setInimigoAberto(null);}} title="Abrir escudo do mestre"><Icon path={mdiShieldCrownOutline} size={0.85}/>Escudo do mestre</button>
            {campanha.modo === "mapa" && (
              <button
                className={`mesa-cenas-botao ${editorIluminacaoAberto ? "ativo" : ""}`}
                onClick={() => {
                  setEditorIluminacaoAberto((aberto) => !aberto);
                  if (!mapaAtualIluminacao?.iluminacao) {
                    setConfiguracaoIluminacao({
                      paredes: [],
                      portas: [],
                      luzes: [],
                      escuridao: 0.82,
                      periodo: "dia",
                    });
                  }
                }}
                disabled={!mapaAtualIluminacao}
                title="Editar paredes, luzes e visao"
              >
                <Icon path={mdiLightbulbOnOutline} size={0.78} />
                Iluminacao
              </button>
            )}
            <div className="mesa-modos" aria-label="Modo da mesa">
              <button
                className={campanha.modo === "cena" ? "ativo" : ""}
                onClick={() => trocarModo("cena")}
                title="Exibir cena"
              >
                <Icon path={mdiImageOutline} size={0.82} />
              </button>
              <button
                className={campanha.modo === "mapa" ? "ativo" : ""}
                onClick={() => trocarModo("mapa")}
                title="Exibir mapa"
              >
                <Icon path={mdiMapOutline} size={0.82} />
              </button>
            </div>
          </div>
        )}
        {!mestre && cena?.lojaDisponivel && (
          <div className="mesa-ferramentas-jogador">
            <button
              className={`mesa-cenas-botao ${aplicativoMesaAberto === "loja" ? "ativo" : ""}`}
              onClick={() => setAplicativoMesaAberto((atual) => atual === "loja" ? null : "loja")}
              title="Abrir loja desta cena"
            >
              <Icon path={mdiStoreOutline} size={0.78} />
              Loja
            </button>
          </div>
        )}
        <button
          type="button"
          className="mesa-cenas-botao mesa-3d-botao"
          onClick={() => {
            setSenha3D("");
            setErroSenha3D("");
            setSenha3DAberta(true);
          }}
          title="Abrir mapa 3D experimental"
        >
          Experimental
        </button>
        <button className="mesa-atualizar" onClick={carregar} title="Atualizar">
          <Icon path={mdiRefresh} size={0.82} />
        </button>
      </header>
      {!embedded && <>
        <div className="mesa-contexto-visual" aria-label="Cena atual">
          <Icon path={campanha.modo === 'mapa' ? mdiMapOutline : mdiImageOutline} size={0.85} aria-hidden="true" />
          <div><span>{campanha.modo === 'mapa' ? 'Mapa de batalha' : campanha.modo === 'especial' ? 'Cena especial' : 'Cena narrativa'}</span><strong>{cena?.nome || campanha.nome}</strong></div>
          {campanha.combateAtivo && <b>Combate</b>}
        </div>
        {<button type="button" className="mesa-foco-botao" aria-pressed={focoVisual} aria-label={focoVisual ? 'Mostrar interface' : 'Focar no mapa e cena'} title={focoVisual ? 'Mostrar interface' : 'Focar no mapa e cena'} onClick={() => setFocoVisual(value => !value)}><Icon path={focoVisual ? mdiViewDashboardOutline : mdiFitToScreenOutline} size={0.9} aria-hidden="true" /><span>{focoVisual ? 'Mostrar interface' : 'Foco'}</span></button>}
        {(mestre ? abaLateralMestre : abaLateralJogador) && <button type="button" className="mesa-fechar-painel" aria-label="Recolher painel lateral" title="Recolher painel lateral" onClick={() => mestre ? setAbaLateralMestre('') : setAbaLateralJogador('')}><Icon path={mdiClose} size={0.8} /></button>}
      </>}
      {senha3DAberta && (
        <div
          className="mesa-3d-senha-overlay"
          onClick={() => setSenha3DAberta(false)}
        >
          <form
            className="mesa-3d-senha-painel"
            aria-label="Senha do mapa 3D experimental"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={(evento) => {
              evento.preventDefault();
              if (senha3D !== SENHA_MESTRE) {
                setErroSenha3D("Senha incorreta.");
                setSenha3D("");
                return;
              }
              sessionStorage.setItem(TABLETOP_3D_AUTH_KEY, "true");
              const destino = new URLSearchParams(window.location.search);
              destino.set("tabletop3d", "1");
              window.location.href = `?${destino.toString()}`;
            }}
          >
            <header>
              <Icon path={mdiMapOutline} size={1} />
              <div>
                <span>Acesso restrito</span>
                <h2>Mapa 3D Experimental</h2>
              </div>
              <button
                type="button"
                onClick={() => setSenha3DAberta(false)}
                title="Fechar"
              >
                <Icon path={mdiClose} size={0.8} />
              </button>
            </header>
            <label htmlFor="senha-tabletop-3d">Senha do mestre</label>
            <input
              id="senha-tabletop-3d"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={SENHA_MESTRE.length}
              value={senha3D}
              onChange={(evento) => {
                setSenha3D(evento.target.value.replace(/\D/g, ""));
                setErroSenha3D("");
              }}
            />
            {erroSenha3D && <p role="alert">{erroSenha3D}</p>}
            <button type="submit" className="mesa-3d-senha-confirmar">
              Desbloquear 3D
            </button>
          </form>
        </div>
      )}
      {mestre && bibliotecaAberta && !escudoAberto && renderShieldScenes()}
      {mestre && !escudoAberto && anotacoesAbertas && (
        <aside className="mesa-anotacoes-painel">
          <header>
            <div>
              <span>Arquivo do mestre</span>
              <strong>Anotacoes da campanha</strong>
            </div>
            <button
              onClick={() => setAnotacoesAbertas(false)}
              title="Fechar anotacoes"
            >
              <Icon path={mdiClose} size={0.85} />
            </button>
          </header>
          <AnotacoesCampanha campanhaId={campanha.id} />
        </aside>
      )}
      {mestre && !escudoAberto && (
        <aside
          className={`mesa-musica-painel ${musicaAberta ? "aberto" : "fechado"}`}
          aria-hidden={!musicaAberta}
        >
          <header>
            <div>
              <span>Trilha da sessao</span>
              <strong>Playlist da campanha</strong>
            </div>
            <button
              onClick={() => setMusicaAberta(false)}
              title="Fechar musica"
            >
              <Icon path={mdiClose} size={0.85} />
            </button>
          </header>
          <MusicaTabletop
            campanhaId={campanha.id}
            musicasCampanha={campanha.musicas || []}
            estadoRemoto={campanha.musicaEstado}
            aoAlterarEstado={(estado) =>
              atualizarEstadoMusica(campanha.id, estado)
            }
          />
        </aside>
      )}
      {!mestre && campanha.musicas?.length > 0 && (
        <aside className="mesa-musica-ouvinte">
          <MusicaTabletop
            campanhaId={campanha.id}
            musicasCampanha={campanha.musicas}
            estadoRemoto={campanha.musicaEstado}
            controlavel={false}
          />
        </aside>
      )}
      {mestre && !escudoAberto && (
        <aside className={`mesa-soundpad-painel ${soundpadAberto ? "aberto" : "fechado"}`} aria-hidden={!soundpadAberto}>
          <header><div><span>Efeitos rapidos</span><strong>Soundpad da campanha</strong></div><button onClick={() => setSoundpadAberto(false)} title="Fechar soundpad"><Icon path={mdiClose} size={0.85} /></button></header>
          <SoundpadTabletop sons={campanha.soundpad || []} estadoRemoto={campanha.soundpadEstado} aoAlterarEstado={(estado) => atualizarEstadoSoundpad(campanha.id, estado)} />
        </aside>
      )}
      {!mestre && campanha.soundpad?.length > 0 && (
        <SoundpadTabletop sons={campanha.soundpad} estadoRemoto={campanha.soundpadEstado} controlavel={false} />
      )}

      {!embedded && campanha.modo === "especial" && cena?.cenaEspecial?.midiaUrl && (
        <section className={`cena-especial cena-especial-${cena.cenaEspecial.transicao || "cinema"}`} aria-label={`Cena especial: ${cena.nome}`}>
          <SpecialSceneMedia special={cena.cenaEspecial} name={cena.nome} controls={mestre}/>
          <div className="cena-especial-vinheta" />
          {!cena.cenaEspecial.cutscene && cena.cenaEspecial.exibirTitulo !== false && (
            <div className="cena-especial-titulo"><span>{cena.descricao}</span><strong>{cena.nome}</strong></div>
          )}
          {!cena.cenaEspecial.cutscene && audioEspecialPronto && extrairYoutubeId(cena.cenaEspecial.audioUrl) ? (
            <iframe
              className="cena-especial-youtube"
              title="Musica da cena especial"
              src={`https://www.youtube.com/embed/${extrairYoutubeId(cena.cenaEspecial.audioUrl)}?autoplay=1&controls=0&loop=${cena.cenaEspecial.loopAudio !== false ? 1 : 0}&playlist=${extrairYoutubeId(cena.cenaEspecial.audioUrl)}&playsinline=1&rel=0`}
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : !cena.cenaEspecial.cutscene && audioEspecialPronto && cena.cenaEspecial.audioUrl ? <audio ref={audioCenaEspecialRef} src={cena.cenaEspecial.audioUrl} loop={cena.cenaEspecial.loopAudio !== false} autoPlay preload="auto" /> : null}
          {mestre && <button className="cena-especial-sair" onClick={() => trocarModo("cena")}><Icon path={mdiClose} size={0.8} />Encerrar</button>}
        </section>
      )}

      {!embedded && !mestre && <PlayerInitiativeBar campaign={campanha} entries={ordemCombate}/>}
      {!embedded && !mestre && abaLateralJogador!=='ficha' && <SurvivalIndicators campaign={campanha} playerId={fichaJogadorId} compact/>}
      <section className={`mesa-palco modo-${campanha.modo} ${cenaRestrita ? "cena-restrita" : ""}`}>
        {cenaRestrita && (
          <div className="mesa-cena-restrita" role="status">
            <span>Cena reservada</span>
            <strong>Aguarde as próximas instruções do mestre</strong>
          </div>
        )}
        <div
          className={`mesa-imagem ${tokenArrastando ? "arrastando-token" : ""} ${mapaArrastando ? "arrastando-mapa" : ""}`}
          style={{
            backgroundImage: palcoVideo ? "none" : `url(${palcoUrl})`,
            "--mapa-proporcao": proporcaoMapa.largura / proporcaoMapa.altura,
            "--mapa-proporcao-inversa":
              proporcaoMapa.altura / proporcaoMapa.largura,
            transform:
              campanha.modo === "mapa"
                ? `translate(${panMapa.x}px, ${panMapa.y}px) scale(${zoomMapa})`
                : "none",
          }}
          onWheel={(event) => {
            if (campanha.modo !== "mapa") return;
            event.preventDefault();
            setZoomMapa((zoom) =>
              Math.max(
                0.5,
                Math.min(
                  3,
                  Number((zoom + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(2)),
                ),
              ),
            );
          }}
          onDragOver={(event) => {
            if (mestre && campanha.modo === "mapa") {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={soltarFichaNoMapa}
          onPointerDown={iniciarPanMapa}
          onPointerDownCapture={(event) => {
            if (campanha.modo === "mapa" && mestre && editorIluminacaoAberto &&
                (event.button === 1 || event.button === 2)) {
              event.stopPropagation();
              iniciarPanMapa(event);
            }
          }}
          onContextMenu={(event) => {
            if (campanha.modo === "mapa" && mestre && editorIluminacaoAberto)
              event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (tokenGirando) {
              girarToken(event);
              return;
            }
            const usandoPinca = moverPanMapa(event);
            if (!usandoPinca) arrastarToken(event);
          }}
          onPointerUp={(event) => {
            if (tokenGirando) {
              finalizarRotacaoToken(event);
              return;
            }
            const usandoPinca = finalizarPanMapa(event);
            if (tokenArrastando && !usandoPinca) soltarToken(event);
          }}
          onPointerCancel={(event) => {
            setTokenArrastando(null);
            if (tokenGirando) finalizarRotacaoToken(event);
            finalizarPanMapa(event);
          }}
          onPointerLeave={(event) => tokenArrastando && soltarToken(event)}
        >
          {palcoVideo && <video key={palcoUrl} src={palcoUrl} autoPlay muted loop playsInline aria-label={cena?.nome || 'Cena'} onLoadedMetadata={e => {if(campanha.modo==='mapa') setProporcaoMapa({largura:e.currentTarget.videoWidth || 1,altura:e.currentTarget.videoHeight || 1});}} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:campanha.modo==='mapa'?'fill':'contain',pointerEvents:'none'}}/>}
          {!palcoVideo && mediaAnimada?.animation?.enabled && <AnimatedScene media={mediaAnimada} id={`${cena.id}:${mediaAnimada.id}`} alt={mediaAnimada.nome || cena.nome}/> }
          {cena && campanha.modo === "mapa" && mapaAtualIluminacao?.exibirGrade !== false && (
            <div
              className="mesa-grade"
              style={{ backgroundSize: `${100 / colunas}% ${100 / linhas}%` }}
            />
          )}
          {cena && campanha.modo === "mapa" && configuracaoIluminacao && (
            <MapLightingLayer
              key={chaveMapaIluminacao}
              mapaUrl={mapaAtualIluminacao?.url}
              configuracao={configuracaoIluminacao}
              luzesTokens={luzesDosTokens}
              observadores={mestre ? null : observadoresJogador}
              editando={mestre && editorIluminacaoAberto}
              aoAlterar={alterarConfiguracaoIluminacao}
              salvando={salvandoIluminacao}
            />
          )}
          {cena && campanha.modo === "mapa" &&
            campanha.tokens
              .filter((token) => {
                const estado = estadoTokenNoMapa(token);
                if (estado.removido) return false;
                if (!mestre && estado.oculto) return false;
                if (!tokenVisivelParaJogador({ ...token, ...estado }))
                  return false;
                return true;
              })
              .map((token) => {
                const estado = estadoTokenNoMapa(token);
                const tokenVisual = { ...token, ...estado };
                return (
                  <React.Fragment key={token.id}>
                    <button
                      className={`mesa-token ${podeMoverToken(tokenVisual) ? "movivel" : "bloqueado"} ${tokenArrastando === token.id ? "arrastando" : ""} ${tokenGirando === token.id ? "girando" : ""}`}
                      style={{
                        left: `${tokenVisual.x}%`,
                        top: `${tokenVisual.y}%`,
                        width: `${46 * (Number(tokenVisual.tamanho) || 1)}px`,
                        rotate: `${Number(tokenVisual.rotacao) || 0}rad`,
                        ...estiloBordaToken(personagens[tokenVisual.ficha_id]?.coresToken),
                        ...(mestre && tokenVisual.oculto
                          ? {
                              opacity: 0.38,
                              filter: "grayscale(.8)",
                              outline: "2px dashed rgba(255,255,255,.65)",
                            }
                          : {}),
                      }}
                      title={
                        mestre
                          ? `${tokenVisual.nome} — clique direito para opcoes`
                          : podeMoverToken(tokenVisual)
                            ? `Mover ${tokenVisual.nome}`
                            : tokenVisual.nome
                      }
                      onContextMenu={(event) => {
                        if (
                          !mestre &&
                          String(tokenVisual.ficha_id) !== String(fichaJogadorId)
                        ) return;
                        event.preventDefault();
                        event.stopPropagation();
                        setMenuTokenAberto((atual) =>
                          atual === token.id ? null : token.id,
                        );
                      }}
                      onPointerDown={(event) => {
                        if (!podeMoverToken(tokenVisual)) return;
                        event.preventDefault();
                        event.currentTarget.setPointerCapture?.(
                          event.pointerId,
                        );
                        setMenuTokenAberto(null);
                        movimentoTokenRef.current = null;
                        setTokenArrastando(token.id);
                      }}
                    >
                      {tokenVisual.imagem_url ||
                      personagens[tokenVisual.ficha_id]?.fotoPerfil ? (
                        <AnimatedTokenImage animation={personagens[tokenVisual.ficha_id]?.profileTokenAnimation}
                          src={
                            personagens[tokenVisual.ficha_id]?.fotoPerfil ||
                            tokenVisual.imagem_url
                          }
                          alt=""
                          draggable="false"
                        />
                      ) : (
                        tokenVisual.nome?.slice(0, 2)
                      )}
                      {mestre && tokenVisual.lanterna?.ativa && (
                        <span
                          className="mesa-token-direcao"
                        />
                      )}
                    </button>
                    {podeMoverToken(tokenVisual) && !editorIluminacaoAberto && (
                      <button
                        type="button"
                        className={`mesa-token-rotacao ${tokenGirando === token.id ? "girando" : ""}`}
                        style={{
                          left: `${tokenVisual.x}%`,
                          top: `${tokenVisual.y}%`,
                          transform: `translate(calc(-50% + ${Math.cos(Number(tokenVisual.rotacao) || 0) * (23 * (Number(tokenVisual.tamanho) || 1) + 11)}px), calc(-50% + ${Math.sin(Number(tokenVisual.rotacao) || 0) * (23 * (Number(tokenVisual.tamanho) || 1) + 11)}px))`,
                        }}
                        title={`Girar ${tokenVisual.nome}`}
                        aria-label={`Girar ${tokenVisual.nome}`}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          event.currentTarget.setPointerCapture?.(event.pointerId);
                          setTokenArrastando(null);
                          setTokenGirando(token.id);
                        }}
                      >
                        <Icon path={mdiRotateRight} size={0.6} />
                      </button>
                    )}
                    {!mestre &&
                      podeMoverToken(tokenVisual) &&
                      !editorIluminacaoAberto && (
                        <button
                          type="button"
                          className={`mesa-token-lanterna-toggle ${tokenVisual.lanterna?.ativa ? "ativa" : ""}`}
                          style={{
                            left: `${tokenVisual.x}%`,
                            top: `${tokenVisual.y}%`,
                          }}
                          title={
                            tokenVisual.lanterna?.ativa
                              ? "Desligar lanterna"
                              : "Ligar lanterna"
                          }
                          aria-label={
                            tokenVisual.lanterna?.ativa
                              ? "Desligar lanterna"
                              : "Ligar lanterna"
                          }
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            atualizarLanternaToken(tokenVisual, {
                              ativa: !tokenVisual.lanterna?.ativa,
                            });
                          }}
                        >
                          <Icon
                            path={
                              tokenVisual.lanterna?.ativa
                                ? mdiFlashlight
                                : mdiFlashlightOff
                            }
                            size={0.62}
                          />
                        </button>
                      )}
                    {(mestre || String(tokenVisual.ficha_id) === String(fichaJogadorId)) && menuTokenAberto === token.id && (
                      <div
                        role="menu"
                        aria-label={`Opcoes do token ${tokenVisual.nome || "token"}`}
                        onPointerDown={(event) => event.stopPropagation()}
                        onContextMenu={(event) => event.preventDefault()}
                        style={{
                          position: "absolute",
                          left: `${tokenVisual.x}%`,
                          top: `${tokenVisual.y}%`,
                          transform: "translate(28px, 18px)",
                          zIndex: 80,
                          minWidth: 150,
                          padding: 6,
                          border: "1px solid rgba(255,255,255,.22)",
                          borderRadius: 8,
                          background: "rgba(8,8,8,.96)",
                          boxShadow: "0 10px 28px rgba(0,0,0,.45)",
                          display: "grid",
                          gap: 4,
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          hidden={!mestre}
                          onClick={() => alternarVisibilidadeToken(tokenVisual)}
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            border: 0,
                            borderRadius: 5,
                            background: "rgba(255,255,255,.07)",
                            color: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          {tokenVisual.oculto
                            ? "Mostrar token"
                            : "Ocultar token"}
                        </button>
                        <div className="mesa-token-tamanho-controles">
                          <span>Tamanho <b>{Math.round((Number(tokenVisual.tamanho) || 1) * 100)}%</b></span>
                          <div>
                            <button type="button" onClick={() => alterarTamanhoToken(tokenVisual, (Number(tokenVisual.tamanho) || 1) - 0.25)} disabled={(Number(tokenVisual.tamanho) || 1) <= 0.5} title="Diminuir token">−</button>
                            <button type="button" onClick={() => alterarTamanhoToken(tokenVisual, 1)} title="Restaurar tamanho">1:1</button>
                            <button type="button" onClick={() => alterarTamanhoToken(tokenVisual, (Number(tokenVisual.tamanho) || 1) + 0.25)} disabled={(Number(tokenVisual.tamanho) || 1) >= 3} title="Aumentar token">+</button>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="menuitem"
                          hidden={!mestre}
                          onClick={() =>
                            atualizarLanternaToken(tokenVisual, {
                              ativa: !tokenVisual.lanterna?.ativa,
                            })
                          }
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            border: "1px solid rgba(244,199,107,.18)",
                            borderRadius: 5,
                            background: tokenVisual.lanterna?.ativa
                              ? "rgba(244,199,107,.2)"
                              : "rgba(255,255,255,.07)",
                            color: tokenVisual.lanterna?.ativa
                              ? "#ffe3a0"
                              : "inherit",
                            cursor: "pointer",
                          }}
                        >
                          {tokenVisual.lanterna?.ativa
                            ? "Apagar lanterna"
                            : "Acender lanterna"}
                        </button>
                        {mestre && tokenVisual.lanterna?.ativa && (
                          <div className="mesa-token-lanterna-controles">
                            <label className="mesa-token-lanterna-alcance">
                              <span>
                                Alcance
                                <b>{Number(tokenVisual.lanterna?.alcance) || 18}</b>
                              </span>
                              <input
                                type="range"
                                min="4"
                                max="60"
                                step="1"
                                value={Number(tokenVisual.lanterna?.alcance) || 18}
                                onChange={(event) =>
                                  atualizarLanternaToken(tokenVisual, {
                                    alcance: Number(event.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="mesa-token-lanterna-alcance">
                              <span>
                                Abertura
                                <b>{Number(tokenVisual.lanterna?.abertura) || 70}°</b>
                              </span>
                              <input
                                type="range"
                                min="20"
                                max="140"
                                step="5"
                                value={Number(tokenVisual.lanterna?.abertura) || 70}
                                onChange={(event) =>
                                  atualizarLanternaToken(tokenVisual, {
                                    abertura: Number(event.target.value),
                                  })
                                }
                              />
                            </label>
                          </div>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          hidden={!mestre}
                          onClick={() => removerTokenAtualDoMapa(tokenVisual)}
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            border: 0,
                            borderRadius: 5,
                            background: "rgba(180,35,35,.18)",
                            color: "#ffb4b4",
                            cursor: "pointer",
                          }}
                        >
                          Remover do mapa
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
        </div>
        {campanha.modo === "mapa" && (
          <div className="mesa-zoom-controles">
            <button
              type="button"
              onClick={() =>
                setZoomMapa((zoom) =>
                  Math.max(0.5, Number((zoom - 0.2).toFixed(2))),
                )
              }
              title="Diminuir zoom"
            >
              <Icon path={mdiMagnifyMinusOutline} size={0.82} />
            </button>
            <span>{Math.round(zoomMapa * 100)}%</span>
            <button
              type="button"
              onClick={() =>
                setZoomMapa((zoom) =>
                  Math.min(3, Number((zoom + 0.2).toFixed(2))),
                )
              }
              title="Aumentar zoom"
            >
              <Icon path={mdiMagnifyPlusOutline} size={0.82} />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomMapa(1);
                setPanMapa({ x: 0, y: 0 });
              }}
              title="Restaurar zoom e posicao"
            >
              <Icon path={mdiFitToScreenOutline} size={0.82} />
            </button>
          </div>
        )}
      </section>
      {mestre&&escudoAberto&&<aside className="mesa-master-shield-panel" aria-label="Escudo do mestre" onKeyDown={event=>{if(event.key==="Escape")setEscudoAberto(false);}}><header><strong>Escudo do mestre</strong><ShieldInitiativeStrip campaign={campanha} onCampaignChange={setCampanha} onRefresh={carregar}/><button type="button" onClick={()=>setEscudoAberto(false)} aria-label="Fechar escudo do mestre">Fechar ×</button></header><MasterShield organized extraTools={[["players","Jogadores"],["lighting","Iluminação"]]} campaign={campanha} onOptionalState={state=>setCampanha(current=>({...current,mecanicasEspeciais:state}))} members={campanha.membros || []} campaignSystem={campanha.sistema || "absoluto"} campaignId={campanha.id} scene={campanha.cenaAtiva} combat={campanha.combateAtivo} investigation={campanha.investigacaoAtiva} enemies={campanha.inimigos || []} onSaveDifficulty={salvarDificuldadeCena} onSaveEnemy={salvarParticipanteEscudo} onAddEnemy={adicionarParticipanteEscudo} onRemoveEnemy={removerInimigo} documents={renderDocumentosMestre()} renderTool={renderShieldTool}/></aside>}
      {!mestre && (
        <nav
          className={`mesa-lateral-navegacao mesa-jogador-navegacao ${mostrarDocumentosJogador ? "com-documentos" : ""}`}
          aria-label="Conteudo do jogador"
        >
          
          {mostrarDocumentosJogador && (
            <button className={abaLateralJogador === 'documentos' ? 'ativo' : ''} onClick={()=>setAbaLateralJogador(aba=>aba==='documentos'?'':'documentos')}>
              <Icon path={mdiFileDocumentMultipleOutline} size={0.85}/><span>Documentos</span> <b>{documentosVisiveisJogador.length}</b>
            </button>
          )}
          <button
            className={abaLateralJogador === "ficha" ? "ativo" : ""}
            onClick={() =>
              setAbaLateralJogador((aba) => (aba === "ficha" ? "" : "ficha"))
            }
          >
            <Icon path={mdiViewDashboardOutline} size={0.85}/><span>Minha ficha</span>
          </button>
        </nav>
      )}
      {!mestre && abaLateralJogador === "participantes" && (
        <aside
          key={`jogador-participantes-${chavePainelParticipantes}`}
          className="mesa-jogador-participantes"
        >
          <div className="mesa-lateral-titulo">
            <Icon path={mdiShieldCrownOutline} size={0.8} />
            <span>{tituloParticipantes}</span>
            <b>{modoIniciativaAtivo ? ordemCombate.length : campanha.membros.length}</b>
          </div>
          <div className="mesa-membros">
            {modoIniciativaAtivo ? (
              <InitiativeCards entries={ordemCombate} system={campanha.sistema}/>
            ) : campanha.membros.length ? (
              <ParticipantDossiers members={membrosOrdenados} characters={personagens}/>
            ) : (
              <p>Nenhuma ficha vinculada ainda.</p>
            )}
          </div>
        </aside>
      )}
      {mestre && !escudoAberto && abaLateralMestre === "documentos" && renderDocumentosMestre()}
      {!mestre && abaLateralJogador === "documentos" && (
        <aside className="mesa-documentos-painel mesa-documentos-jogador">
          <div className="mesa-lateral-titulo">
            <Icon path={mdiFileDocumentMultipleOutline} size={0.8} />
            <span>Documentos encontrados</span>
            <b>{documentosVisiveisJogador.length}</b>
          </div>
          <div className="documentos-lista">
            {documentosVisiveisJogador.length ? (
              documentosVisiveisJogador.map((documento) => (
                <article className="documento-card" key={documento.id}>
                  <button
                    type="button"
                    className="documento-card-abrir"
                    onClick={() => {
                      setAbaEvidenciaInterativa("terminal");
                      setDocumentoAberto(documento);
                    }}
                  >
                    <div className="documento-card-preview">
                      {documento.categoria === "interativa" ? (
                        <span>{String(documento.mimeType || documento.mime_type).includes("modern-pc") ? "PC" : "DOS"}</span>
                      ) : String(documento.mimeType || documento.mime_type || "").startsWith("image/") ? (
                        <img src={documento.url} alt="" />
                      ) : (
                        <span>PDF</span>
                      )}
                    </div>
                    <div>
                      <small>{documento.categoria === "interativa" ? "Evidencia interativa" : documento.categoria === "item" ? "Item" : "Evidencia"}</small>
                      <strong>{nomeDocumentoExibicao(documento)}</strong>
                      <p>{documento.descricao || "Clique para examinar"}</p>
                    </div>
                  </button>
                </article>
              ))
            ) : (
              <div className="documentos-vazio">
                <Icon path={mdiFileDocumentMultipleOutline} size={1.2} />
                <strong>Nenhuma evidencia revelada</strong>
                <p>Os documentos compartilhados pelo mestre aparecerao aqui.</p>
              </div>
            )}
          </div>
        </aside>
      )}
      {!mestre && abaLateralJogador === "ficha" && personagemJogador && (
        <section
          className="ficha-tablet-mesa"
          role="dialog"
          aria-label={`Ficha de ${personagemJogador.nome}`}
        >
          <header>
            <div>
              <span>Ficha no tabletop</span>
              <strong>{personagemJogador.nome}</strong>
            </div>
            <button
              onClick={() => setAbaLateralJogador(embedded ? "participantes" : "")}
              title="Fechar ficha"
            >
              <Icon path={mdiClose} size={0.9} />
            </button>
          </header>
          <iframe
            title={`Ficha de ${personagemJogador.nome}`}
            src={membroJogador.ficha_id.startsWith("espiral:") ? `/?sistema=espiral&ficha=${encodeURIComponent(membroJogador.ficha_id.slice("espiral:".length))}&embed=mesa&campanhaTeste=${encodeURIComponent(campanha.codigo)}` : `/?sistema=darkness&ficha=${encodeURIComponent(personagemJogador.nome || membroJogador.ficha_id)}&senha=${encodeURIComponent(membroJogador.ficha_id)}&embed=mesa&campanhaTeste=${encodeURIComponent(campanha.codigo)}`}
          />
        </section>
      )}
      {!mestre && abaLateralJogador === "ficha" && !personagemJogador && (
        <aside className="mesa-jogador-participantes">
          <div className="jogador-escolher-ficha">
            <strong>Qual e a sua ficha?</strong>
            <p>Escolha uma ficha vinculada para abri-la na mesa.</p>
            <select
              value={fichaJogadorId}
              onChange={(event) => {
                const id = event.target.value;
                setFichaJogadorId(id);
                localStorage.setItem(`darkness_mesa_ficha_${codigo}`, id);
              }}
            >
              <option value="">Selecionar ficha...</option>
              {campanha.membros.map((membro) => (
                <option key={membro.id} value={membro.ficha_id}>
                  {personagens[membro.ficha_id]?.nome || membro.nome}
                </option>
              ))}
            </select>
          </div>
        </aside>
      )}
      {mestre && abaLateralMestre === "inimigos" && (
        <aside className="mesa-inimigos-lateral">
          <div className="mesa-npc-subabas">
            <button
              className={subAbaNpcs === "inimigos" ? "ativo" : ""}
              onClick={() => {
                setSubAbaNpcs("inimigos");
                setInimigoAberto(null);
              }}
            >
              Inimigos{" "}
              <b>
                {
                  (campanha.inimigos || []).filter(
                    (item) =>
                      (item.tipo || item.dados?.tipo || "inimigo") !== "npc",
                  ).length
                }
              </b>
            </button>
            <button
              className={subAbaNpcs === "npcs" ? "ativo" : ""}
              onClick={() => {
                setSubAbaNpcs("npcs");
                setInimigoAberto(null);
              }}
            >
              NPCs do mestre{" "}
              <b>
                {
                  (campanha.inimigos || []).filter(
                    (item) => (item.tipo || item.dados?.tipo) === "npc",
                  ).length
                }
              </b>
            </button>
          </div>
          {inimigoAberto ? (
            <div className="mesa-inimigo-ficha">
              <header>
                <button onClick={() => setInimigoAberto(null)}>
                  <Icon path={mdiArrowLeft} size={0.7} />
                </button>
                <span>
                  Ficha do {inimigoAberto.tipo === "npc" ? "NPC" : "inimigo"}
                </span>
                <button
                  onClick={() => removerInimigo(inimigoAberto)}
                  title="Remover da campanha"
                >
                  <Icon path={mdiDeleteOutline} size={0.7} />
                </button>
              </header>
              {(inimigoAberto.sistema || inimigoAberto.dados?.sistema) === 'espiral' ? <EspiralEncounterViewer record={inimigoAberto} onChange={salvarVitalInimigo} /> : <>
              <div className="mesa-inimigo-identidade">
                {inimigoAberto.fotoPerfil ? (
                  <img src={inimigoAberto.fotoPerfil} alt="" />
                ) : (
                  <span>{inimigoAberto.nome?.slice(0, 2)}</span>
                )}
                <div>
                  <strong>{inimigoAberto.nome}</strong>
                  <small>
                    Nivel {inimigoAberto.nivel || 1} ·{" "}
                    {inimigoAberto.classe ||
                      (inimigoAberto.tipo === "npc" ? "NPC" : "Inimigo")}
                  </small>
                </div>
              </div>
              <div className="mesa-inimigo-recursos">
                <ControleVitalInimigo
                  nome="Sanidade"
                  tipo="sanidade"
                  recurso={inimigoAberto.sanidade}
                  aoAlterar={alterarSanidadeInimigo}
                />
                <label className="inimigo-defesa-resumo">
                  <span>Defesa</span>
                  <NumberInput
                    key={inimigoAberto.defesa}
                    type="number"
                    min="0"
                    defaultValue={inimigoAberto.defesa || 0}
                    onBlur={(event) => alterarDefesaInimigo(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && event.currentTarget.blur()
                    }
                    aria-label="Defesa"
                  />
                </label>
              </div>
              <section className="mesa-inimigo-corpo">
                <h3>Integridade dos membros</h3>
                <div className="mesa-inimigo-membros">
                  {MEMBROS_INIMIGO_MESA.map(([chave, nome]) => (
                    <ControleVitalInimigo
                      key={chave}
                      nome={nome}
                      recurso={inimigoAberto.membros?.[chave]}
                      aoAlterar={(valor) => alterarMembroInimigo(chave, valor)}
                    />
                  ))}
                </div>
              </section>
              <section>
                <h3>Atributos</h3>
                <div className="mesa-inimigo-atributos">
                  {Object.entries(inimigoAberto.atributos || {}).map(
                    ([nome, valor]) => (
                      <div key={nome}>
                        <span>{nome}</span>
                        <b>{valor}</b>
                      </div>
                    ),
                  )}
                </div>
              </section>
              <section>
                <h3>Habilidades e ataques</h3>
                <div className="mesa-inimigo-habilidades">
                  {[
                    ...(inimigoAberto.habilidades || []),
                    ...(inimigoAberto.ataques || []),
                  ].length ? (
                    [
                      ...(inimigoAberto.habilidades || []),
                      ...(inimigoAberto.ataques || []),
                    ].map((item, index) => (
                      <article key={item.id || index}>
                        <strong>
                          {item.nome || item.titulo || `Acao ${index + 1}`}
                        </strong>
                        <p>
                          {item.descricao ||
                            item.efeito ||
                            item.dano ||
                            "Sem descricao"}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p>Nenhuma habilidade cadastrada.</p>
                  )}
                </div>
              </section>
              </>}
            </div>
          ) : (
            <>
              <div className="mesa-inimigo-adicionar">
                <select
                  value={inimigoParaAdicionar}
                  onChange={(event) =>
                    setInimigoParaAdicionar(event.target.value)
                  }
                >
                  <option value="">
                    Selecionar {subAbaNpcs === "npcs" ? "NPC" : "inimigo"}...
                  </option>
                  {agruparPorPastaNpc(catalogoDisponivelNpc).map(
                    ([pasta, itens]) => (
                      <optgroup key={pasta} label={pasta}>
                        {itens.map((item) => (
                          <option
                            key={item.id || item.fichaId}
                            value={item.id || item.fichaId}
                          >
                            {item.nome}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
                <button
                  onClick={adicionarInimigo}
                  disabled={!inimigoParaAdicionar}
                >
                  <Icon path={mdiPlus} size={0.72} />
                </button>
              </div>

              <div className="mesa-inimigos-lista mesa-inimigos-pastas">
                {gruposInimigosVinculados.length ? (
                  gruposInimigosVinculados.map(([pasta, itens]) => {
                    const chavePasta = `${subAbaNpcs}:${pasta}`;
                    const fechada = Boolean(pastasNpcsFechadas[chavePasta]);

                    return (
                      <section className="mesa-inimigo-pasta" key={chavePasta}>
                        <button
                          type="button"
                          className="mesa-inimigo-pasta-titulo"
                          onClick={() => alternarPastaNpc(pasta)}
                          aria-expanded={!fechada}
                        >
                          <Icon
                            path={fechada ? mdiChevronRight : mdiChevronDown}
                            size={0.58}
                          />
                          <span>{pasta}</span>
                          <b>{itens.length}</b>
                        </button>

                        {!fechada && (
                          <div className="mesa-inimigo-pasta-itens">
                            {itens.map((inimigo) => {
                              const tokenNoMapa = (campanha.tokens || []).find(token =>
                                token.ficha_id === `inimigo:${inimigo.inimigo_ref || inimigo.id}` && !token.removido,
                              );
                              const ehNpc = (inimigo.tipo || inimigo.dados?.tipo) === "npc";
                              const chaveNpc = chaveIniciativaNpc(inimigo);
                              const prefixo = prefixoIniciativaInimigo(inimigo);
                              const turnosInimigo = Object.entries(campanha.iniciativas || {})
                                .filter(([chave]) => chave.startsWith(prefixo))
                                .sort(([, a], [, b]) => Number(b) - Number(a));
                              const chaveNovo = chaveRascunhoNovoInimigo(inimigo);
                              return (
                                <div className="mesa-inimigo-item-wrap" key={inimigo.id}>
                                  <button
                                    className="mesa-inimigo-item-principal"
                                    draggable
                                    title="Arraste para o mapa para criar ou mover o token"
                                    onDragStart={(event) => {
                                      event.dataTransfer.effectAllowed = "copy";
                                      event.dataTransfer.setData(
                                        "application/x-darkness-inimigo",
                                        String(inimigo.inimigo_ref || inimigo.id),
                                      );
                                    }}
                                    onClick={() => setInimigoAberto(inimigo)}
                                  >
                                    {inimigo.fotoPerfil ? (
                                      <img src={inimigo.fotoPerfil} alt="" />
                                    ) : (
                                      <span>{inimigo.nome?.slice(0, 2)}</span>
                                    )}
                                    <div>
                                      <strong>{inimigo.nome}</strong>
                                      <small>
                                        Nivel {inimigo.nivel || 1} · Defesa {inimigo.defesa || 0}
                                      </small>
                                      <em>
                                        {inimigo.sanidade?.atual || 0}/{inimigo.sanidade?.max || 0} SAN
                                      </em>
                                    </div>
                                  </button>

                                  {embedded && <button type="button" onClick={() => colocarInimigo3D(inimigo)} aria-label={`Colocar ${inimigo.nome} no mapa 3D`}>Colocar no mapa 3D</button>}
                                  {embedded && tokenNoMapa && <button type="button" onClick={() => removerTokenAtualDoMapa(tokenNoMapa)} aria-label={`Remover ${inimigo.nome} do mapa 3D`}>Remover do mapa 3D</button>}
                                  {modoIniciativaAtivo && (
                                    <div className="npc-iniciativa-controles">
                                      {ehNpc ? (
                                        <div className="npc-iniciativa-linha">
                                          <span>Iniciativa</span>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="—"
                                            value={
                                              Object.prototype.hasOwnProperty.call(iniciativasRascunho, chaveNpc)
                                                ? iniciativasRascunho[chaveNpc]
                                                : (campanha.iniciativas?.[chaveNpc] ?? "")
                                            }
                                            onChange={(event) =>
                                              alterarRascunhoIniciativaPorChave(chaveNpc, event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter") {
                                                event.preventDefault();
                                                confirmarIniciativaPorChave(chaveNpc, inimigo.nome || "NPC");
                                              }
                                            }}
                                            aria-label={`Iniciativa de ${inimigo.nome}`}
                                          />
                                          <button
                                            type="button"
                                            className="npc-iniciativa-confirmar"
                                            onClick={() => confirmarIniciativaPorChave(chaveNpc, inimigo.nome || "NPC")}
                                            title="Confirmar iniciativa"
                                          >
                                            ✓
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          {turnosInimigo.map(([chave, valor]) => (
                                            <div className="npc-iniciativa-linha" key={chave}>
                                              <span>Turno</span>
                                              <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={
                                                  Object.prototype.hasOwnProperty.call(iniciativasRascunho, chave)
                                                    ? iniciativasRascunho[chave]
                                                    : valor
                                                }
                                                onChange={(event) =>
                                                  alterarRascunhoIniciativaPorChave(chave, event.target.value)
                                                }
                                                onKeyDown={(event) => {
                                                  if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    confirmarIniciativaPorChave(chave, inimigo.nome || "Inimigo");
                                                  }
                                                }}
                                                aria-label={`Iniciativa de ${inimigo.nome}`}
                                              />
                                              <button
                                                type="button"
                                                className="npc-iniciativa-confirmar"
                                                onClick={() => confirmarIniciativaPorChave(chave, inimigo.nome || "Inimigo")}
                                                title="Confirmar"
                                              >
                                                ✓
                                              </button>
                                              <button
                                                type="button"
                                                className="npc-iniciativa-remover"
                                                onClick={() => removerIniciativaPorChave(chave)}
                                                title="Remover este turno"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))}
                                          <div className="npc-iniciativa-linha nova">
                                            <span>Novo turno</span>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              placeholder="+"
                                              value={iniciativasRascunho[chaveNovo] ?? ""}
                                              onChange={(event) =>
                                                alterarRascunhoIniciativaPorChave(chaveNovo, event.target.value)
                                              }
                                              onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                  event.preventDefault();
                                                  adicionarIniciativaInimigo(inimigo);
                                                }
                                              }}
                                              aria-label={`Nova iniciativa de ${inimigo.nome}`}
                                            />
                                            <button
                                              type="button"
                                              className="npc-iniciativa-adicionar"
                                              onClick={() => adicionarIniciativaInimigo(inimigo)}
                                              disabled={!iniciativasRascunho[chaveNovo]}
                                              title="Adicionar outro turno"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })
                ) : (
                  <p>
                    Nenhum {subAbaNpcs === "npcs" ? "NPC" : "inimigo"} nesta
                    campanha.
                  </p>
                )}
              </div>
            </>
          )}
        </aside>
      )}
      {/* A lateral principal existe uma unica vez: no mestre ela aparece apenas na aba Participantes/Iniciativa. */}
      {mestre && abaLateralMestre === "participantes" && !escudoAberto && renderShieldParticipants()}
      {renderVisualizadorDocumento()}
      {aplicativoMesaAberto && (
        <section className="mesa-aplicativo-painel" role="dialog" aria-label={aplicativoMesaAberto === "dashboard" ? "Dashboard do mestre" : "Loja da cena"}>
          <header>
            <div>
              <span>{aplicativoMesaAberto === "dashboard" ? "Ferramentas do mestre" : "Disponivel nesta cena"}</span>
              <strong>{aplicativoMesaAberto === "dashboard" ? "Dashboard" : "Loja"}</strong>
            </div>
            <button type="button" onClick={() => setAplicativoMesaAberto(null)} title="Fechar">
              <Icon path={mdiClose} size={0.82} />
            </button>
          </header>
          <iframe
            title={aplicativoMesaAberto === "dashboard" ? "Dashboard do mestre" : "Loja"}
            src={aplicativoMesaAberto === "dashboard" ? "/?mestre=1&embutido=1" : `/?loja=1&senha=${encodeURIComponent(fichaJogadorId)}&embutido=1`}
          />
        </section>
      )}
{!embedded && <RollNotifications key={campanha.id} rolls={campanha.rolagens || []} mechanics={campanha.mecanicasEspeciais}/>}

      {renderShieldSceneEditor()}
    </main>
  );
};
export default Mesa;


