import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Icon from "@mdi/react";
import {
  mdiAccountPlusOutline,
  mdiArrowLeft,
  mdiChevronDown,
  mdiChevronRight,
  mdiClose,
  mdiDeleteOutline,
  mdiDiceMultiple,
  mdiFileDocumentMultipleOutline,
  mdiFitToScreenOutline,
  mdiFlashlight,
  mdiFlashlightOff,
  mdiImageOutline,
  mdiLightbulbOnOutline,
  mdiMagnify,
  mdiMagnifyMinusOutline,
  mdiMagnifyPlusOutline,
  mdiMapOutline,
  mdiMusicBoxMultipleOutline,
  mdiNotebookEditOutline,
  mdiOpenInNew,
  mdiPencilOutline,
  mdiPlay,
  mdiPlus,
  mdiRefresh,
  mdiRotateRight,
  mdiShieldCrownOutline,
  mdiSwordCross,
  mdiUploadOutline,
} from "@mdi/js";
import {
  ativarCena,
  atualizarEstadoMusica,
  atualizarInimigoCampanha,
  atualizarModoCampanha,
  atualizarModoCombate,
  atualizarModoInvestigacao,
  atualizarVisibilidadeDocumentoInvestigacao,
  buscarCampanhaPorCodigo,
  definirIniciativa,
  definirRotacaoToken,
  chavePosicaoMapa,
  configurarLanternaToken,
  definirVisibilidadeToken,
  desvincularFicha,
  desvincularInimigo,
  enviarImagemCena,
  excluirCena,
  excluirDocumentoInvestigacao,
  moverToken,
  ouvirCampanha,
  posicionarFichaNoMapa,
  posicionarInimigoNoMapa,
  registrarRolagem,
  removerIniciativa,
  removerTokenDoMapa,
  salvarCena,
  salvarDocumentoInvestigacao,
  validarArquivoImagem,
  validarArquivoInvestigacao,
  vincularFicha,
  vincularInimigo,
} from "../services/mesaApi";
import {
  buscarPersonagem,
  listarPersonagens,
  ouvirPersonagens,
} from "../services/personagemApi";
import { supabaseConfigurado } from "../services/supabase";
import { listarHabilidadesSelecionadas } from "../data/Classes/arvoresHabilidades";
import { condicoes } from "../components/data/condicoes";
import AnotacoesCampanha from "../components/AnotacoesCampanha";
import MusicaTabletop from "../components/MusicaTabletop";
import MapLightingLayer, {
  pontoVisivelPorLuz,
} from "../components/MapLightingLayer";
import "../CSS/Mesa.css";

const cenaVazia = {
  nome: "",
  descricao: "",
  imagemUrl: "",
  mapaUrl: "",
  imagensCena: [],
  mapasBatalha: [],
  larguraGrade: 12,
  alturaGrade: 8,
};
const idMidiaLocal = (tipo = "midia") =>
  `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
        <input
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
const facesDaRolagem = (rolagem) => {
  const detalhes = rolagem?.detalhes || {};
  const facesDetalhes = Number(
    detalhes.faces ||
      detalhes.dano?.faces ||
      detalhes.dadosDetalhados?.[0]?.faces,
  );
  if (facesDetalhes > 0) return facesDetalhes;
  return (
    Number(
      String(rolagem?.expressao || detalhes.formula || "").match(
        /d(\d+)/i,
      )?.[1],
    ) || 20
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

const Mesa = () => {
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
    mestre && !telaMobileInicial,
  );
  const [midiasRecolhidas, setMidiasRecolhidas] = useState(true);
  const [anotacoesAbertas, setAnotacoesAbertas] = useState(false);
  const [musicaAberta, setMusicaAberta] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [editando, setEditando] = useState(cenaVazia);
  const [arquivos, setArquivos] = useState({ cena: [], mapa: [] });
  const [salvando, setSalvando] = useState(false);
  const [transicao, setTransicao] = useState(false);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [erroFichas, setErroFichas] = useState("");
  const [fichaParaVincular, setFichaParaVincular] = useState("");
  const [personagens, setPersonagens] = useState({});
  const [fichaAberta, setFichaAberta] = useState(null);
  const [tokenArrastando, setTokenArrastando] = useState(null);
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
  const inicioPanMapaRef = useRef(null);
  const ponteirosMapaRef = useRef(new Map());
  const inicioPincaMapaRef = useRef(null);
  const [abaLateralMestre, setAbaLateralMestre] = useState(
    telaMobileInicial ? "" : "participantes",
  );
  const [abaLateralJogador, setAbaLateralJogador] = useState(
    telaMobileInicial ? "" : "participantes",
  );
  const [catalogoInimigos, setCatalogoInimigos] = useState([]);
  const [inimigoParaAdicionar, setInimigoParaAdicionar] = useState("");
  const [inimigoAberto, setInimigoAberto] = useState(null);
  const [subAbaNpcs, setSubAbaNpcs] = useState("inimigos");
  const [pastasNpcsFechadas, setPastasNpcsFechadas] = useState({});
  const [corCena, setCorCena] = useState("");
  const [salvandoCombate, setSalvandoCombate] = useState(false);
  const [salvandoInvestigacao, setSalvandoInvestigacao] = useState(false);
  const [iniciativasRascunho, setIniciativasRascunho] = useState({});
  const [documentoAberto, setDocumentoAberto] = useState(null);
  const [visibilidadeDocumentoEditando, setVisibilidadeDocumentoEditando] = useState(null);
  const [salvandoVisibilidadeDocumento, setSalvandoVisibilidadeDocumento] = useState(false);
  const [enviandoDocumento, setEnviandoDocumento] = useState(false);
  const [novoDocumento, setNovoDocumento] = useState({
    nome: "",
    descricao: "",
    categoria: "evidencia",
    arquivo: null,
    visualizarTodos: true,
    jogadoresVisiveis: [],
  });
  const arquivoDocumentoRef = useRef(null);
  const [fichaJogadorId, setFichaJogadorId] = useState(
    () =>
      fichaUrl ||
      localStorage.getItem(`darkness_mesa_ficha_${codigo}`) ||
      localStorage.getItem("fichaRPG_ultimaFicha") ||
      "",
  );
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
    documentoVisivelParaFicha(documento),
  );
  const mostrarDocumentosJogador =
    Boolean(campanha?.investigacaoAtiva) || documentosVisiveisJogador.length > 0;

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
  }, [codigo]);

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
            if (!eventoMudaApresentacao(evento, campanhaRef.current)) {
              carregar();
              return;
            }
            setTransicao(true);
            setTimeout(carregar, 320);
            setTimeout(() => setTransicao(false), 1000);
          })
        : undefined,
    [campanha?.id, carregar],
  );
  useEffect(() => {
    const url = urlCena(
      campanha?.cenaAtiva,
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
  }, [campanha?.cenaAtiva, campanha?.midiaAtivaId, campanha?.modo]);
  useEffect(() => {
    if (campanha?.modo !== "mapa") return undefined;
    const url = urlCena(campanha?.cenaAtiva, "mapa", campanha?.midiaAtivaId);
    if (!url) return undefined;
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
  }, [campanha?.cenaAtiva, campanha?.midiaAtivaId, campanha?.modo]);
  const carregarFichas = useCallback(() => {
    setErroFichas("");
    listarPersonagens()
      .then((fichas) => setFichasDisponiveis(fichas))
      .catch((error) => {
        setFichasDisponiveis([]);
        setErroFichas(error.message || "Nao foi possivel carregar as fichas.");
      });
  }, []);
  useEffect(() => {
    carregarFichas();
  }, [carregarFichas]);
  useEffect(() => {
    if (!mestre) return;
    try {
      const inimigos = (
        JSON.parse(localStorage.getItem("darkness_inimigos")) || []
      ).map((item) => ({ ...item, tipo: "inimigo" }));
      const npcs = (
        JSON.parse(localStorage.getItem("darkness_npcs")) || []
      ).map((item) => ({ ...item, tipo: "npc" }));
      setCatalogoInimigos([...inimigos, ...npcs]);
    } catch {
      setCatalogoInimigos([]);
    }
  }, [mestre]);
  useEffect(() => {
    if (!campanha?.membros?.length) return;
    Promise.all(
      campanha.membros.map(async (membro) => {
        try {
          return [membro.ficha_id, await buscarPersonagem(membro.ficha_id)];
        } catch {
          return [membro.ficha_id, null];
        }
      }),
    ).then((entradas) => setPersonagens(Object.fromEntries(entradas)));
  }, [campanha?.membros]);
  useEffect(() => {
    const fichasIds = (campanha?.membros || [])
      .map((membro) => membro.ficha_id)
      .filter(Boolean);
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
    if (mestre || !campanha?.id) return undefined;
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

  const removerFicha = async (fichaId) => {
    if (!window.confirm("Remover esta ficha da mesa e apagar seu token?"))
      return;
    await desvincularFicha(campanha.id, fichaId);
    setFichaAberta(null);
    await carregar();
  };
  const adicionarInimigo = async () => {
    const inimigo = catalogoInimigos.find(
      (item) => String(item.id || item.fichaId) === inimigoParaAdicionar,
    );
    if (!inimigo) return;
    await vincularInimigo(campanha.id, inimigo);
    setInimigoParaAdicionar("");
    await carregar();
  };
  const removerInimigo = async (inimigo) => {
    if (
      !window.confirm(
        `Remover ${inimigo.nome || "este inimigo"} desta campanha?`,
      )
    )
      return;
    await desvincularInimigo(campanha.id, inimigo.id);
    setInimigoAberto(null);
    await carregar();
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
      await atualizarModoCombate(campanha.id, novoEstado, novoEstado);
      setCampanha((atual) => ({
        ...atual,
        combateAtivo: novoEstado,
        investigacaoAtiva: novoEstado ? false : Boolean(atual.investigacaoAtiva),
        iniciativas: novoEstado ? {} : atual.iniciativas || {},
      }));
      if (novoEstado) setIniciativasRascunho({});
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
    if (!mestre || !campanha?.id || !novoDocumento.arquivo || enviandoDocumento) return;
    setEnviandoDocumento(true);
    setErro("");
    try {
      validarArquivoInvestigacao(novoDocumento.arquivo);
      const salvo = await salvarDocumentoInvestigacao(
        campanha.id,
        novoDocumento.arquivo,
        {
          nome: novoDocumento.nome || novoDocumento.arquivo.name.replace(/\.[^.]+$/, ""),
          descricao: novoDocumento.descricao,
          categoria: novoDocumento.categoria,
          visualizarTodos: novoDocumento.visualizarTodos,
          jogadoresVisiveis: novoDocumento.visualizarTodos
            ? []
            : novoDocumento.jogadoresVisiveis,
        },
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
        arquivo: null,
        visualizarTodos: true,
        jogadoresVisiveis: [],
      });
      if (arquivoDocumentoRef.current) arquivoDocumentoRef.current.value = "";
    } catch (error) {
      setErro(error.message || "Nao foi possivel compartilhar o documento.");
    } finally {
      setEnviandoDocumento(false);
    }
  };

  const removerDocumentoDaInvestigacao = async (documento) => {
    if (!mestre || !campanha?.id || !documento?.id) return;
    if (!window.confirm(`Remover "${documento.nome || "este documento"}" do visualizador?`)) return;
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
    const texto = possuiRascunho
      ? String(iniciativasRascunho[fichaId] ?? "")
      : String(campanha.iniciativas?.[fichaId] ?? "");

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
            larguraGrade,
            alturaGrade,
          }
        : { ...cenaVazia, imagensCena: [], mapasBatalha: [] },
    );
    setArquivos({ cena: [], mapa: [] });
    setEditorAberto(true);
  };

  const confirmarCena = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const [novasImagens, novosMapas] = await Promise.all([
        Promise.all(
          arquivos.cena.map(async (item) => ({
            id: item.id,
            nome: item.nome || item.arquivo.name,
            url: await enviarImagemCena(campanha.id, item.arquivo, "cena"),
          })),
        ),
        Promise.all(
          arquivos.mapa.map(async (item) => ({
            id: item.id,
            nome: item.nome || item.arquivo.name,
            url: await enviarImagemCena(campanha.id, item.arquivo, "mapa"),
            larguraGrade: Number(
              item.larguraGrade || editando.larguraGrade || 12,
            ),
            alturaGrade: Number(item.alturaGrade || editando.alturaGrade || 8),
          })),
        ),
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
      setErro("");
      setArquivos((atuais) => ({
        ...atuais,
        [tipo]: [
          ...atuais[tipo],
          ...selecionados.map((arquivo) => ({
            id: idMidiaLocal(tipo),
            nome: arquivo.name.replace(/\.[^.]+$/, ""),
            arquivo,
            ...(tipo === "mapa"
              ? {
                  larguraGrade: Number(editando.larguraGrade || 12),
                  alturaGrade: Number(editando.alturaGrade || 8),
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
    if (!window.confirm(`Excluir "${cena.nome}" da biblioteca?`)) return;
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

  const arrastarToken = (event) => {
    const token = campanha.tokens.find((item) => item.id === tokenArrastando);
    if (!tokenArrastando || !podeMoverToken(token) || campanha.modo !== "mapa")
      return;
    const { x, y } = calcularPosicaoToken(event);
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
    const { x, y } = calcularPosicaoToken(event);
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
        item.id === tokenId ? { ...item, x, y } : item,
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
      !window.confirm(
        `Remover o token de ${token.nome || "este personagem"} deste mapa?`,
      )
    )
      return;
    setMenuTokenAberto(null);
    setCampanha((atual) => ({
      ...atual,
      tokens: atual.tokens.map((item) =>
        item.id === token.id ? { ...item, removido: true } : item,
      ),
    }));
    try {
      await removerTokenDoMapa(token.id, mapaChaveAtual);
    } catch (error) {
      setErro(error.message || "Nao foi possivel remover o token deste mapa.");
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
    if (campanha.modo !== "mapa" || event.button !== 0) return;
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
      event.target.closest?.(
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
    if (editorIluminacaoAberto) return;
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
  }, [assinaturaIluminacaoRemota, editorIluminacaoAberto]);

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
      setCampanha((atual) => {
        const cenas = atual.cenas.map((item) =>
          item.id === cenaMapaAtual.id
            ? { ...item, mapasBatalha, mapas_batalha: mapasBatalha }
            : item,
        );
        return {
          ...atual,
          cenas,
          cenaAtiva: cenas.find((item) => item.id === cenaMapaAtual.id),
        };
      });
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a iluminacao do mapa.");
    } finally {
      setSalvandoIluminacao(false);
    }
  };

  const alterarConfiguracaoIluminacao = (proxima) => {
    setConfiguracaoIluminacao(proxima);
    if (salvamentoIluminacaoTimerRef.current)
      clearTimeout(salvamentoIluminacaoTimerRef.current);
    salvamentoIluminacaoTimerRef.current = setTimeout(() => {
      salvamentoIluminacaoTimerRef.current = null;
      salvarConfiguracaoIluminacao(proxima);
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

  const cena = campanha.cenaAtiva;
  const midiaAtiva =
    midiasDaCena(cena, campanha.modo).find(
      (item) => item.id === campanha.midiaAtivaId,
    ) || midiasDaCena(cena, campanha.modo)[0];
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
        !token.oculto &&
        (mestre || String(token.ficha_id) === String(fichaJogadorId)),
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
  const luzDoJogador = !mestre
    ? luzesDosTokens.find(
        (luz) =>
          String(
            campanha.tokens.find((token) => token.id === luz.tokenId)?.ficha_id,
          ) === String(fichaJogadorId),
      )
    : null;
  const tokenVisivelParaJogador = (token) => {
    if (mestre || periodoMapa !== "noite") return true;
    if (String(token.ficha_id) === String(fichaJogadorId)) return true;
    if (!luzDoJogador) return false;
    return pontoVisivelPorLuz(luzDoJogador, token, bloqueadoresVisao);
  };
  const personagemFichaAberta = fichaAberta?.personagem;
  const habilidadesFichaAberta = personagemFichaAberta
    ? listarHabilidadesSelecionadas(personagemFichaAberta)
    : [];
  const passivosFichaAberta = personagemFichaAberta
    ? Object.entries(personagemFichaAberta.habilidadesPassivas || {}).filter(
        ([, valor]) => Number(valor) > 0,
      )
    : [];
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

  const inimigosPorId = new Map(
    (campanha.inimigos || []).map((item) => [String(item.id), item]),
  );

  const ordemCombate = (() => {
    if (!modoIniciativaAtivo) return [];
    const entradas = (campanha.membros || []).map((membro, indice) => {
      const personagem = personagens[membro.ficha_id];
      return {
        chave: membro.ficha_id,
        tipo: "jogador",
        valor: campanha.iniciativas?.[membro.ficha_id],
        nome: personagem?.nome || membro.nome,
        subtitulo: personagem
          ? `Nivel ${personagem.nivel || 1} · ${personagem.classe || "Sem classe"}`
          : membro.papel,
        foto: personagem?.fotoPerfil,
        membro,
        personagem,
        ordemOriginal: indice,
      };
    });

    Object.entries(campanha.iniciativas || {}).forEach(([chave, valor]) => {
      if (chave.startsWith("npc:")) {
        const id = chave.slice(4);
        const npc = inimigosPorId.get(id);
        if (!npc) return;
        entradas.push({
          chave,
          tipo: "npc",
          valor,
          nome: npc.nome || "NPC",
          subtitulo: `Nivel ${npc.nivel || 1} · ${npc.classe || "NPC"}`,
          foto: npc.fotoPerfil,
          inimigo: npc,
          ordemOriginal: 10000,
        });
      } else if (chave.startsWith("inimigo:")) {
        const resto = chave.slice("inimigo:".length);
        const separador = resto.lastIndexOf(":");
        const id = separador >= 0 ? resto.slice(0, separador) : resto;
        const inimigo = inimigosPorId.get(id);
        if (!inimigo) return;
        entradas.push({
          chave,
          tipo: "inimigo",
          valor,
          nome: inimigo.nome || "Inimigo",
          subtitulo: `Nivel ${inimigo.nivel || 1} · ${inimigo.classe || "Inimigo"}`,
          foto: inimigo.fotoPerfil,
          inimigo,
          ordemOriginal: 20000,
        });
      }
    });

    return entradas.sort((a, b) => {
      const temA = a.valor != null;
      const temB = b.valor != null;
      if (temA && !temB) return -1;
      if (!temA && temB) return 1;
      if (temA && temB && Number(b.valor) !== Number(a.valor))
        return Number(b.valor) - Number(a.valor);
      return a.ordemOriginal - b.ordemOriginal;
    });
  })();

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

  const renderizarCenaBiblioteca = (item) => {
    const selecionada = item.id === cena?.id;
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
    return (
      <React.Fragment key={item.id}>
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
              {urlCena(item, "mapa") ? "Mapa preparado" : "Sem mapa"}
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
            <button onClick={() => abrirEditor(item)} title="Editar">
              <Icon path={mdiPencilOutline} size={0.72} />
            </button>
            <button onClick={() => removerCena(item)} title="Excluir">
              <Icon path={mdiDeleteOutline} size={0.72} />
            </button>
          </div>
        </article>
        {selecionada && midias.length > 0 && (
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
        )}
      </React.Fragment>
    );
  };
  return (
    <main
      className={`mesa-shell ${mestre ? "visao-mestre" : "visao-jogador"} ${!mestre && abaLateralJogador === "ficha" ? "jogador-ficha-ativa" : ""} ${!(mestre ? abaLateralMestre : abaLateralJogador) ? "painel-lateral-fechado" : ""} modo-atual-${campanha.modo} ${bibliotecaAberta ? "com-biblioteca" : ""}`}
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
      <div className={`mesa-transicao ${transicao ? "ativa" : ""}`}>
        <span>
          {campanha.modo === "mapa" ? "Voltando a cena" : "Preparando o mapa"}
        </span>
      </div>
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
        {mestre && (
          <div className="mesa-ferramentas-mestre">
            <button
              className={`mesa-cenas-botao ${bibliotecaAberta ? "ativo" : ""}`}
              onClick={() => {
                setBibliotecaAberta((valor) => !valor);
                setAnotacoesAbertas(false);
                setMusicaAberta(false);
              }}
            >
              <Icon path={mdiImageOutline} size={0.78} />
              Cenas
            </button>
            <button
              className={`mesa-cenas-botao ${anotacoesAbertas ? "ativo" : ""}`}
              onClick={() => {
                setAnotacoesAbertas((valor) => !valor);
                setBibliotecaAberta(false);
                setMusicaAberta(false);
              }}
            >
              <Icon path={mdiNotebookEditOutline} size={0.78} />
              Anotacoes
            </button>
            <button
              className={`mesa-cenas-botao ${musicaAberta ? "ativo" : ""}`}
              onClick={() => {
                setMusicaAberta((valor) => !valor);
                setBibliotecaAberta(false);
                setAnotacoesAbertas(false);
              }}
            >
              <Icon path={mdiMusicBoxMultipleOutline} size={0.78} />
              Musica
            </button>
            <button
              className={`mesa-cenas-botao mesa-combate-botao ${campanha.combateAtivo ? "ativo" : ""}`}
              onClick={alternarModoCombate}
              disabled={salvandoCombate || salvandoInvestigacao}
              title={
                campanha.combateAtivo ? "Encerrar combate" : "Iniciar combate"
              }
            >
              <Icon path={mdiSwordCross} size={0.78} />
              {campanha.combateAtivo ? "Encerrar" : "Combate"}
            </button>
            <button
              className={`mesa-cenas-botao mesa-investigacao-botao ${campanha.investigacaoAtiva ? "ativo" : ""}`}
              onClick={alternarModoInvestigacao}
              disabled={salvandoInvestigacao || salvandoCombate}
              title={
                campanha.investigacaoAtiva
                  ? "Encerrar modo investigacao"
                  : "Iniciar modo investigacao"
              }
            >
              <Icon path={mdiMagnify} size={0.78} />
              {campanha.investigacaoAtiva ? "Encerrar" : "Investigacao"}
            </button>
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
        <button className="mesa-atualizar" onClick={carregar} title="Atualizar">
          <Icon path={mdiRefresh} size={0.82} />
        </button>
      </header>
      {mestre && bibliotecaAberta && (
        <aside className="mesa-biblioteca">
          <div className="biblioteca-cabecalho">
            <div>
              <span>Direcao da sessao</span>
              <h2>Cenas e mapas</h2>
            </div>
            <button onClick={() => abrirEditor()} title="Nova cena">
              <Icon path={mdiPlus} size={0.9} />
            </button>
          </div>
          <div className="biblioteca-fichas">
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
          </div>
          <div className="biblioteca-lista">
            {campanha.cenas.map(renderizarCenaBiblioteca)}
          </div>
        </aside>
      )}
      {mestre && anotacoesAbertas && (
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
      {mestre && (
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

      <section className={`mesa-palco modo-${campanha.modo}`}>
        <div
          className={`mesa-imagem ${tokenArrastando ? "arrastando-token" : ""} ${mapaArrastando ? "arrastando-mapa" : ""}`}
          style={{
            backgroundImage: `url(${urlCena(cena, campanha.modo, campanha.midiaAtivaId)})`,
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
          {campanha.modo === "mapa" && (
            <div
              className="mesa-grade"
              style={{ backgroundSize: `${100 / colunas}% ${100 / linhas}%` }}
            />
          )}
          {campanha.modo === "mapa" && configuracaoIluminacao && (
            <MapLightingLayer
              configuracao={configuracaoIluminacao}
              luzesTokens={luzesDosTokens}
              editando={mestre && editorIluminacaoAberto}
              aoAlterar={alterarConfiguracaoIluminacao}
              salvando={salvandoIluminacao}
            />
          )}
          {campanha.modo === "mapa" &&
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
                        rotate: `${Number(tokenVisual.rotacao) || 0}rad`,
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
                        if (!mestre) return;
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
                        setTokenArrastando(token.id);
                      }}
                    >
                      {tokenVisual.imagem_url ||
                      personagens[tokenVisual.ficha_id]?.fotoPerfil ? (
                        <img
                          src={
                            tokenVisual.imagem_url ||
                            personagens[tokenVisual.ficha_id]?.fotoPerfil
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
                          transform: `translate(calc(-50% + ${Math.cos(Number(tokenVisual.rotacao) || 0) * 34}px), calc(-50% + ${Math.sin(Number(tokenVisual.rotacao) || 0) * 34}px))`,
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
                    {mestre && menuTokenAberto === token.id && (
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
                        <button
                          type="button"
                          role="menuitem"
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
                        {tokenVisual.lanterna?.ativa && (
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
      {mestre && (
        <nav
          className={`mesa-lateral-navegacao ${campanha.investigacaoAtiva || documentosDisponiveis.length ? "com-documentos" : ""}`}
          aria-label="Conteudo da lateral"
        >
          <button
            className={abaLateralMestre === "participantes" ? "ativo" : ""}
            onClick={() => {
              setAbaLateralMestre((aba) =>
                aba === "participantes" ? "" : "participantes",
              );
              setInimigoAberto(null);
            }}
          >
            {tituloParticipantes} <b>{modoIniciativaAtivo ? ordemCombate.length : campanha.membros.length}</b>
          </button>
          {(campanha.investigacaoAtiva || documentosDisponiveis.length > 0) && (
            <button
              className={abaLateralMestre === "documentos" ? "ativo" : ""}
              onClick={() => {
                setAbaLateralMestre((aba) =>
                  aba === "documentos" ? "" : "documentos",
                );
                setInimigoAberto(null);
              }}
            >
              Documentos <b>{documentosDisponiveis.length}</b>
            </button>
          )}
          <button
            className={abaLateralMestre === "inimigos" ? "ativo" : ""}
            onClick={() =>
              setAbaLateralMestre((aba) =>
                aba === "inimigos" ? "" : "inimigos",
              )
            }
          >
            NPCs <b>{campanha.inimigos?.length || 0}</b>
          </button>
        </nav>
      )}
      {!mestre && (
        <nav
          className={`mesa-lateral-navegacao mesa-jogador-navegacao ${mostrarDocumentosJogador ? "com-documentos" : ""}`}
          aria-label="Conteudo do jogador"
        >
          <button
            className={abaLateralJogador === "participantes" ? "ativo" : ""}
            onClick={() =>
              setAbaLateralJogador((aba) =>
                aba === "participantes" ? "" : "participantes",
              )
            }
          >
            {tituloParticipantes} <b>{modoIniciativaAtivo ? ordemCombate.length : campanha.membros.length}</b>
          </button>
          {mostrarDocumentosJogador && (
            <button
              className={abaLateralJogador === "documentos" ? "ativo" : ""}
              onClick={() =>
                setAbaLateralJogador((aba) =>
                  aba === "documentos" ? "" : "documentos",
                )
              }
            >
              Documentos <b>{documentosVisiveisJogador.length}</b>
            </button>
          )}
          <button
            className={abaLateralJogador === "ficha" ? "ativo" : ""}
            onClick={() =>
              setAbaLateralJogador((aba) => (aba === "ficha" ? "" : "ficha"))
            }
          >
            Ficha
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
              ordemCombate.length ? (
                ordemCombate.map((entrada) => (
                  <div
                    className={`mesa-jogador-participante combatente-iniciativa ${entrada.tipo === "jogador" ? classesCondicoesMesa(entrada.personagem) : "combatente-npc"} ${entrada.tipo === "jogador" && entrada.membro?.ficha_id === fichaJogadorId ? "eu" : ""}`}
                    key={entrada.chave}
                  >
                    <span>
                      {entrada.foto ? (
                        <img src={entrada.foto} alt="" />
                      ) : (
                        entrada.nome?.slice(0, 2)
                      )}
                      <em className={`participante-iniciativa ${entrada.valor == null ? "aguardando" : ""}`}>
                        {entrada.valor ?? "—"}
                      </em>
                    </span>
                    <div>
                      <strong>{entrada.nome}</strong>
                      <small>{entrada.subtitulo}</small>
                      {entrada.tipo === "jogador" && (
                        <>
                          <ResumoCondicoesParticipante personagem={entrada.personagem} />
                          {recursosParticipante(entrada.personagem).length > 0 && (
                            <div className="membro-recursos">
                              {recursosParticipante(entrada.personagem).map((recurso) => (
                                <div
                                  className={`membro-recurso ${classeRecursoParticipante(recurso)}`}
                                  key={recurso.id}
                                >
                                  <span>{recurso.nome}</span>
                                  <i>
                                    <em style={{ width: `${percentualRecurso(recurso.valor)}%` }} />
                                  </i>
                                  <b>{recurso.valor?.atual || 0}/{recurso.valor?.max || 0}</b>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhuma iniciativa definida.</p>
              )
            ) : campanha.membros.length ? (
              membrosOrdenados.map((membro) => {
                const personagem = personagens[membro.ficha_id];
                const recursos = recursosParticipante(personagem);
                return (
                  <div
                    className={`mesa-jogador-participante ${membro.ficha_id === fichaJogadorId ? "eu" : ""} ${classesCondicoesMesa(personagem)}`}
                    key={membro.id}
                  >
                    <span>
                      {personagem?.fotoPerfil ? (
                        <img src={personagem.fotoPerfil} alt="" />
                      ) : (
                        membro.nome?.slice(0, 2)
                      )}
                    </span>
                    <div>
                      <strong>{personagem?.nome || membro.nome}</strong>
                      <small>
                        {personagem
                          ? `Nivel ${personagem.nivel || 1} · ${personagem.classe || "Sem classe"}`
                          : membro.papel}
                      </small>
                      <ResumoCondicoesParticipante personagem={personagem} />
                      {recursos.length > 0 && (
                        <div className="membro-recursos">
                          {recursos.map((recurso) => (
                            <div
                              className={`membro-recurso ${classeRecursoParticipante(recurso)}`}
                              key={recurso.id}
                            >
                              <span>{recurso.nome}</span>
                              <i>
                                <em style={{ width: `${percentualRecurso(recurso.valor)}%` }} />
                              </i>
                              <b>{recurso.valor?.atual || 0}/{recurso.valor?.max || 0}</b>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>Nenhuma ficha vinculada ainda.</p>
            )}
          </div>
        </aside>
      )}
      {mestre && abaLateralMestre === "documentos" && (
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
            <div className="documentos-envio-acoes">
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
                    } catch (error) {
                      event.target.value = "";
                      setNovoDocumento((atual) => ({ ...atual, arquivo: null }));
                      setErro(error.message || "Arquivo invalido.");
                    }
                  }}
                />
              </label>
              <button
                type="submit"
                disabled={
                  !novoDocumento.arquivo ||
                  enviandoDocumento ||
                  (!novoDocumento.visualizarTodos &&
                    !(novoDocumento.jogadoresVisiveis || []).length)
                }
              >
                <Icon path={mdiUploadOutline} size={0.68} />
                {enviandoDocumento ? "Enviando..." : "Enviar aos jogadores"}
              </button>
            </div>
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
                      onClick={() => setDocumentoAberto(documento)}
                    >
                      <div className="documento-card-preview">
                        {String(documento.mimeType || documento.mime_type || "").startsWith("image/") ? (
                          <img src={documento.url} alt="" />
                        ) : (
                          <span>PDF</span>
                        )}
                      </div>
                      <div>
                        <small>{documento.categoria === "item" ? "Item" : "Evidencia"}</small>
                        <strong>{documento.nome}</strong>
                        <p>{documento.descricao || documento.arquivoNome || documento.arquivo_nome || "Clique para visualizar"}</p>
                        <em className="documento-visibilidade-resumo">
                          {nomesVisibilidadeDocumento(documento)}
                        </em>
                      </div>
                    </button>
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
      )}
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
                    onClick={() => setDocumentoAberto(documento)}
                  >
                    <div className="documento-card-preview">
                      {String(documento.mimeType || documento.mime_type || "").startsWith("image/") ? (
                        <img src={documento.url} alt="" />
                      ) : (
                        <span>PDF</span>
                      )}
                    </div>
                    <div>
                      <small>{documento.categoria === "item" ? "Item" : "Evidencia"}</small>
                      <strong>{documento.nome}</strong>
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
              onClick={() => setAbaLateralJogador("participantes")}
              title="Fechar ficha"
            >
              <Icon path={mdiClose} size={0.9} />
            </button>
          </header>
          <iframe
            title={`Ficha de ${personagemJogador.nome}`}
            src={`/?ficha=${encodeURIComponent(personagemJogador.nome || membroJogador.ficha_id)}&senha=${encodeURIComponent(membroJogador.ficha_id)}&embed=mesa`}
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
                  <input
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
      {mestre && abaLateralMestre === "participantes" && (
        <aside
          key={`mestre-participantes-${chavePainelParticipantes}`}
          className="mesa-lateral"
        >
          <>
            <div className="mesa-lateral-titulo">
              <Icon path={mdiShieldCrownOutline} size={0.8} />
              <span>{tituloParticipantes}</span>
              <b>{modoIniciativaAtivo ? ordemCombate.length : campanha.membros.length}</b>
            </div>
            <div className="mesa-membros">
              {modoIniciativaAtivo ? (
                ordemCombate.length ? (
                  ordemCombate.map((entrada) => {
                    const ehJogador = entrada.tipo === "jogador";
                    return (
                      <div
                        className={`participante-condicionado combatente-iniciativa mestre ${ehJogador ? classesCondicoesMesa(entrada.personagem) : "combatente-npc"}`}
                        key={entrada.chave}
                        onClick={() => {
                          if (!ehJogador && entrada.inimigo) {
                            setAbaLateralMestre("inimigos");
                            setSubAbaNpcs(entrada.tipo === "npc" ? "npcs" : "inimigos");
                            setInimigoAberto(entrada.inimigo);
                          } else if (ehJogador) {
                            setFichaAberta({ membro: entrada.membro, personagem: entrada.personagem });
                          }
                        }}
                      >
                        <span>
                          {entrada.foto ? <img src={entrada.foto} alt="" /> : entrada.nome?.slice(0, 2)}
                        </span>
                        {ehJogador ? (
                          <div
                            className="participante-iniciativa-edicao"
                            onClick={(event) => event.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                          >
                            <input
                              className="participante-iniciativa-input"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="—"
                              value={
                                Object.prototype.hasOwnProperty.call(iniciativasRascunho, entrada.chave)
                                  ? iniciativasRascunho[entrada.chave]
                                  : (entrada.valor ?? "")
                              }
                              onChange={(event) =>
                                alterarRascunhoIniciativa(entrada.membro, event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  confirmarIniciativaMestre(entrada.membro);
                                }
                              }}
                              aria-label={`Iniciativa de ${entrada.nome}`}
                            />
                          </div>
                        ) : (
                          <div className="participante-iniciativa-valor">{entrada.valor}</div>
                        )}
                        <div>
                          <strong>{entrada.nome}</strong>
                          <small>{entrada.subtitulo}</small>
                          {ehJogador && (
                            <>
                              <ResumoCondicoesParticipante personagem={entrada.personagem} />
                              {recursosParticipante(entrada.personagem).length > 0 && (
                                <div className="membro-recursos">
                                  {recursosParticipante(entrada.personagem).map((recurso) => (
                                    <div
                                      className={`membro-recurso ${classeRecursoParticipante(recurso)}`}
                                      key={recurso.id}
                                    >
                                      <span>{recurso.nome}</span>
                                      <i>
                                        <em style={{ width: `${percentualRecurso(recurso.valor)}%` }} />
                                      </i>
                                      <b>{recurso.valor?.atual || 0}/{recurso.valor?.max || 0}</b>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>Nenhuma iniciativa definida.</p>
                )
              ) : (
                <>
                  {campanha.membros.length ? (
                membrosOrdenados.map((membro) => {
                  const personagem = personagens[membro.ficha_id];
                  const recursos = recursosParticipante(personagem);
                  return (
                    <div
                      className={`participante-condicionado ${classesCondicoesMesa(personagem)}`}
                      key={membro.id}
                      draggable
                      title="Arraste para o mapa para criar ou mover o token"
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData(
                          "application/x-darkness-ficha",
                          membro.ficha_id,
                        );
                      }}
                      onClick={() => setFichaAberta({ membro, personagem })}
                    >
                      <span>
                        {personagem?.fotoPerfil ? (
                          <img src={personagem.fotoPerfil} alt="" />
                        ) : (
                          membro.nome?.slice(0, 2)
                        )}
                      </span>
                      {modoIniciativaAtivo && (
                        <div
                          className="participante-iniciativa-edicao"
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          <input
                            className="participante-iniciativa-input"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="—"
                            value={
                              Object.prototype.hasOwnProperty.call(
                                iniciativasRascunho,
                                membro.ficha_id,
                              )
                                ? iniciativasRascunho[membro.ficha_id]
                                : (campanha.iniciativas?.[membro.ficha_id] ??
                                  "")
                            }
                            aria-label={`Iniciativa de ${personagem?.nome || membro.nome}`}
                            title="Digite a iniciativa e confirme"
                            onDragStart={(event) => event.preventDefault()}
                            onChange={(event) =>
                              alterarRascunhoIniciativa(
                                membro,
                                event.target.value,
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                confirmarIniciativaMestre(membro);
                              }
                            }}
                          />
                         
                        </div>
                      )}
                      <div>
                        <strong>{personagem?.nome || membro.nome}</strong>
                        <small>
                          {personagem
                            ? `Nivel ${personagem.nivel || 1} · ${personagem.classe || "Sem classe"}`
                            : membro.papel}
                        </small>
                        <ResumoCondicoesParticipante personagem={personagem} />
                        {recursos.length > 0 && (
                          <div className="membro-recursos">
                            {recursos.map((recurso) => (
                              <div
                                className={`membro-recurso ${classeRecursoParticipante(recurso)}`}
                                key={recurso.id}
                              >
                                <span>{recurso.nome}</span>
                                <i>
                                  <em
                                    style={{
                                      width: `${percentualRecurso(recurso.valor)}%`,
                                    }}
                                  />
                                </i>
                                <b>
                                  {recurso.valor?.atual || 0}/
                                  {recurso.valor?.max || 0}
                                </b>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>Nenhuma ficha vinculada ainda.</p>
                  )}
                </>
              )}
            </div>
          </>
        </aside>
      )}
      {documentoAberto && (
        <div className="documento-visualizador-fundo">
          <section
            className="documento-visualizador"
            role="dialog"
            aria-label={`Visualizador de ${documentoAberto.nome || "documento"}`}
          >
            <header>
              <div>
                <small>{documentoAberto.categoria === "item" ? "Item" : "Evidencia"}</small>
                <strong>{documentoAberto.nome}</strong>
              </div>
              <button
                type="button"
                onClick={() => setDocumentoAberto(null)}
                title="Fechar documento"
              >
                <Icon path={mdiClose} size={0.82} />
              </button>
            </header>
            <div className="documento-visualizador-conteudo">
              {String(documentoAberto.mimeType || documentoAberto.mime_type || "").startsWith("image/") ? (
                <img src={documentoAberto.url} alt={documentoAberto.nome || "Evidencia"} />
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
      )}
      <footer className="mesa-rodape">
        <div className="mesa-rolagens-titulo">
          <Icon path={mdiDiceMultiple} size={0.85} />
          <span>Rolagens</span>
        </div>
        <div className="mesa-rolagens">
          {campanha.rolagens.length ? (
            campanha.rolagens.map((rolagem) => {
              const faces = facesDaRolagem(rolagem);
              return (
                <div key={rolagem.id}>
                  <span>{rolagem.autor_nome}</span>
                  <b
                    className={`mesa-resultado-dado d${faces}`}
                    title={`Resultado ${rolagem.resultado} em d${faces}`}
                  >
                    <i>{rolagem.resultado}</i>
                  </b>
                  <small>{rolagem.expressao}</small>
                </div>
              );
            })
          ) : (
            <p>As rolagens da sessao aparecerao aqui.</p>
          )}
        </div>
      </footer>

      {editorAberto && (
        <div
          className="cena-editor-fundo"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditorAberto(false)
          }
        >
          <form className="cena-editor" onSubmit={confirmarCena}>
            <header>
              <div>
                <span>Biblioteca</span>
                <h2>{editando.id ? "Editar cena" : "Nova cena"}</h2>
              </div>
              <button type="button" onClick={() => setEditorAberto(false)}>
                <Icon path={mdiClose} size={0.85} />
              </button>
            </header>
            <label>
              Nome
              <input
                required
                value={editando.nome || ""}
                onChange={(e) =>
                  setEditando({ ...editando, nome: e.target.value })
                }
              />
            </label>
            <label>
              Descricao
              <textarea
                rows="3"
                value={editando.descricao || ""}
                onChange={(e) =>
                  setEditando({ ...editando, descricao: e.target.value })
                }
              />
            </label>
            <div className="cena-editor-midias">
              <label>
                Imagens da cena · max. 2 MB cada
                <input
                  type="file"
                  multiple
                  accept="image/webp,image/jpeg,image/png,image/avif"
                  onChange={(e) =>
                    selecionarArquivosCena("cena", e.target.files, e.target)
                  }
                />
                <small>Selecione uma ou varias imagens.</small>
              </label>
              <label>
                Mapas de batalha · max. 5 MB cada
                <input
                  type="file"
                  multiple
                  accept="image/webp,image/jpeg,image/png,image/avif"
                  onChange={(e) =>
                    selecionarArquivosCena("mapa", e.target.files, e.target)
                  }
                />
                <small>Selecione um ou varios mapas.</small>
              </label>
            </div>
            {(editando.imagensCena?.length > 0 || arquivos.cena.length > 0) && (
              <div className="cena-editor-lista-midias">
                <strong>
                  Imagens estaticas (
                  {(editando.imagensCena?.length || 0) + arquivos.cena.length})
                </strong>
                {(editando.imagensCena || []).map((midia, indice) => (
                  <div className="cena-editor-midia-item" key={midia.id}>
                    <span>{midia.nome || `Cena ${indice + 1}`}</span>
                    <button
                      type="button"
                      onClick={() => removerMidiaExistente("cena", midia.id)}
                      title="Remover imagem"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
                {arquivos.cena.map((item) => (
                  <div className="cena-editor-midia-item" key={item.id}>
                    <span>
                      {item.nome} <small>novo</small>
                    </span>
                    <button
                      type="button"
                      onClick={() => removerArquivoPendente("cena", item.id)}
                      title="Remover imagem"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(editando.mapasBatalha?.length > 0 ||
              arquivos.mapa.length > 0) && (
              <div className="cena-editor-lista-midias">
                <strong>
                  Mapas de batalha (
                  {(editando.mapasBatalha?.length || 0) + arquivos.mapa.length})
                </strong>
                {(editando.mapasBatalha || []).map((midia, indice) => (
                  <div
                    className="cena-editor-midia-item cena-editor-mapa-item"
                    key={midia.id}
                  >
                    <span>{midia.nome || `Mapa ${indice + 1}`}</span>
                    <label>
                      Colunas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={midia.larguraGrade || 12}
                        onChange={(e) =>
                          atualizarMapaExistente(
                            midia.id,
                            "larguraGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      Linhas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={midia.alturaGrade || 8}
                        onChange={(e) =>
                          atualizarMapaExistente(
                            midia.id,
                            "alturaGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removerMidiaExistente("mapa", midia.id)}
                      title="Remover mapa"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
                {arquivos.mapa.map((item) => (
                  <div
                    className="cena-editor-midia-item cena-editor-mapa-item"
                    key={item.id}
                  >
                    <span>
                      {item.nome} <small>novo</small>
                    </span>
                    <label>
                      Colunas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.larguraGrade}
                        onChange={(e) =>
                          atualizarMapaPendente(
                            item.id,
                            "larguraGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      Linhas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.alturaGrade}
                        onChange={(e) =>
                          atualizarMapaPendente(
                            item.id,
                            "alturaGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removerArquivoPendente("mapa", item.id)}
                      title="Remover mapa"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <details>
              <summary>Usar URLs em vez de arquivos</summary>
              <label>
                URL da cena
                <input
                  value={editando.imagemUrl || ""}
                  onChange={(e) =>
                    setEditando({ ...editando, imagemUrl: e.target.value })
                  }
                />
              </label>
              <label>
                URL do mapa
                <input
                  value={editando.mapaUrl || ""}
                  onChange={(e) =>
                    setEditando({ ...editando, mapaUrl: e.target.value })
                  }
                />
              </label>
              <small>
                As URLs sao usadas como midia principal apenas quando nao houver
                arquivos cadastrados daquele tipo.
              </small>
            </details>
            <div className="cena-editor-grade">
              <label>
                Colunas padrao
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editando.larguraGrade}
                  onChange={(e) =>
                    setEditando({ ...editando, larguraGrade: e.target.value })
                  }
                />
              </label>
              <label>
                Linhas padrao
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editando.alturaGrade}
                  onChange={(e) =>
                    setEditando({ ...editando, alturaGrade: e.target.value })
                  }
                />
              </label>
            </div>
            {erro && <p className="cena-editor-erro">{erro}</p>}
            <footer>
              <button type="button" onClick={() => setEditorAberto(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar na biblioteca"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
};
export default Mesa;
