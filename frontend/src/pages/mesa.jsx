import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiAccountPlusOutline, mdiArrowLeft, mdiChevronDown, mdiChevronRight, mdiClose, mdiDeleteOutline, mdiDiceMultiple, mdiFitToScreenOutline, mdiImageOutline, mdiMagnifyMinusOutline, mdiMagnifyPlusOutline, mdiMapOutline, mdiMusicBoxMultipleOutline, mdiNotebookEditOutline, mdiOpenInNew, mdiPencilOutline, mdiPlay, mdiPlus, mdiRefresh, mdiShieldCrownOutline } from "@mdi/js";
import { ativarCena, atualizarEstadoMusica, atualizarModoCampanha, buscarCampanhaPorCodigo, chavePosicaoMapa, desvincularFicha, desvincularInimigo, enviarImagemCena, excluirCena, moverToken, ouvirCampanha, posicionarFichaNoMapa, posicionarInimigoNoMapa, registrarRolagem, salvarCena, validarArquivoImagem, vincularFicha, vincularInimigo } from "../services/mesaApi";
import { buscarPersonagem, listarPersonagens, ouvirPersonagens } from "../services/personagemApi";
import { supabaseConfigurado } from "../services/supabase";
import { listarHabilidadesSelecionadas } from "../data/Classes/arvoresHabilidades";
import { condicoes } from "../components/data/condicoes";
import AnotacoesCampanha from "../components/AnotacoesCampanha";
import MusicaTabletop from "../components/MusicaTabletop";
import "../CSS/Mesa.css";

const cenaVazia = { nome: "", descricao: "", imagemUrl: "", mapaUrl: "", larguraGrade: 12, alturaGrade: 8 };
const midiasDaCena = (cena, tipo) => tipo === "mapa" ? (cena?.mapasBatalha || []) : (cena?.imagensCena || []);
const urlCena = (cena, tipo, midiaId = null) => {
  const midias = midiasDaCena(cena, tipo);
  const midia = midias.find((item) => item.id === midiaId) || midias[0];
  return midia?.url || (tipo === "mapa" ? cena?.mapa_url || cena?.mapaUrl : cena?.imagem_url || cena?.imagemUrl);
};
const calcularIntegridade = (personagem) => Object.values(personagem?.membros || {}).reduce(
  (total, membro) => ({
    atual: total.atual + (Number(membro?.atual) || 0),
    max: total.max + (Number(membro?.max) || 0),
  }),
  { atual: 0, max: 0 },
);
const percentualRecurso = (recurso) => recurso?.max > 0
  ? Math.max(0, Math.min(100, ((Number(recurso.atual) || 0) / recurso.max) * 100))
  : 0;
const NOMES_MEMBROS_MESA = {
  cabeca: "CAB",
  torso: "TOR",
  bracoDireito: "BD",
  bracoEsquerdo: "BE",
  pernaDireita: "PD",
  pernaEsquerda: "PE",
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
  const estado = percentual <= 25 ? "critico" : percentual <= 50 ? "ferido" : "saudavel";
  return `membro ${estado}`;
};
const nomesCondicoesMesa = Object.fromEntries(condicoes.map((condicao) => [condicao.classe, condicao.nome]));
const classesCondicoesMesa = (personagem) => (personagem?.condicoesAtivas || []).join(" ");
const ResumoCondicoesParticipante = ({ personagem }) => {
  const ativas = personagem?.condicoesAtivas || [];
  return (
    <div className="participante-condicoes" aria-label="Condicoes atuais">
      {ativas.length
        ? ativas.map((condicao) => <span key={condicao}>{nomesCondicoesMesa[condicao] || condicao}</span>)
        : <span className="sem-condicoes">Sem condições</span>}
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
    return estado.cenaAtivaId !== campanha?.cenaAtiva?.id
      || estado.modo !== campanha?.modo
      || (estado.midiaAtivaId || null) !== (campanha?.midiaAtivaId || null);
  }
  if (evento?.table !== "campanhas") return false;
  const novo = evento.new || {};
  return (novo.cena_ativa_id != null && novo.cena_ativa_id !== campanha?.cenaAtiva?.id)
    || (novo.modo != null && novo.modo !== campanha?.modo)
    || (Object.prototype.hasOwnProperty.call(novo, "midia_ativa_id")
      && (novo.midia_ativa_id || null) !== (campanha?.midiaAtivaId || null));
};
const facesDaRolagem = (rolagem) => {
  const detalhes = rolagem?.detalhes || {};
  const facesDetalhes = Number(detalhes.faces || detalhes.dano?.faces || detalhes.dadosDetalhados?.[0]?.faces);
  if (facesDetalhes > 0) return facesDetalhes;
  return Number(String(rolagem?.expressao || detalhes.formula || "").match(/d(\d+)/i)?.[1]) || 20;
};
const corInterfaceDaImagem = (url) => new Promise((resolve, reject) => {
  if (!url) { reject(new Error("Cena sem imagem")); return; }
  const imagem = new Image();
  if (/^https?:/i.test(url)) imagem.crossOrigin = "anonymous";
  imagem.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 64;
      const contexto = canvas.getContext("2d", { willReadFrequently: true });
      contexto.drawImage(imagem, 0, 0, 64, 64);
      const pixels = contexto.getImageData(0, 0, 64, 64).data;
      const grupos = new Map();
      for (let indice = 0; indice < pixels.length; indice += 16) {
        const r = pixels[indice]; const g = pixels[indice + 1]; const b = pixels[indice + 2]; const a = pixels[indice + 3];
        const max = Math.max(r, g, b); const min = Math.min(r, g, b); const luminosidade = (max + min) / 2;
        if (a < 180 || luminosidade < 22 || luminosidade > 238 || max - min < 12) continue;
        const chave = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        grupos.set(chave, (grupos.get(chave) || 0) + 1 + Math.round((max - min) / 45));
      }
      const dominante = [...grupos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (!dominante) throw new Error("Sem cor dominante");
      let [r, g, b] = dominante.split(",").map(Number);
      const maior = Math.max(r, g, b);
      if (maior < 150) { const escala = 170 / Math.max(maior, 1); r *= escala; g *= escala; b *= escala; }
      resolve(`rgb(${Math.min(235, Math.round(r))},${Math.min(235, Math.round(g))},${Math.min(235, Math.round(b))})`);
    } catch (error) { reject(error); }
  };
  imagem.onerror = reject;
  imagem.src = url;
});

const Mesa = () => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const codigo = (params.get("campanha") || "DARK26").toUpperCase();
  const mestre = params.get("papel") === "mestre";
  const fichaUrl = params.get("senha") || params.get("ficha") || "";
  const telaMobileInicial = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
  const [campanha, setCampanha] = useState(null);
  const campanhaRef = useRef(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [bibliotecaAberta, setBibliotecaAberta] = useState(mestre && !telaMobileInicial);
  const [midiasRecolhidas, setMidiasRecolhidas] = useState(true);
  const [anotacoesAbertas, setAnotacoesAbertas] = useState(false);
  const [musicaAberta, setMusicaAberta] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [editando, setEditando] = useState(cenaVazia);
  const [arquivos, setArquivos] = useState({ cena: null, mapa: null });
  const [salvando, setSalvando] = useState(false);
  const [transicao, setTransicao] = useState(false);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [erroFichas, setErroFichas] = useState("");
  const [fichaParaVincular, setFichaParaVincular] = useState("");
  const [personagens, setPersonagens] = useState({});
  const [fichaAberta, setFichaAberta] = useState(null);
  const [tokenArrastando, setTokenArrastando] = useState(null);
  const tokensEmGravacaoRef = useRef(new Set());
  const posicoesTokensPendentesRef = useRef(new Map());
  const [zoomMapa, setZoomMapa] = useState(1);
  const [panMapa, setPanMapa] = useState({ x: 0, y: 0 });
  const [mapaArrastando, setMapaArrastando] = useState(false);
  const inicioPanMapaRef = useRef(null);
  const [abaLateralMestre, setAbaLateralMestre] = useState(telaMobileInicial ? "" : "participantes");
  const [abaLateralJogador, setAbaLateralJogador] = useState(telaMobileInicial ? "" : "participantes");
  const [catalogoInimigos, setCatalogoInimigos] = useState([]);
  const [inimigoParaAdicionar, setInimigoParaAdicionar] = useState("");
  const [inimigoAberto, setInimigoAberto] = useState(null);
  const [corCena, setCorCena] = useState("");
  const [fichaJogadorId, setFichaJogadorId] = useState(() => fichaUrl || localStorage.getItem(`darkness_mesa_ficha_${codigo}`) || localStorage.getItem("fichaRPG_ultimaFicha") || "");

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
        const atuais = new Map((atual.tokens || []).map((token) => [token.id, token]));
        const tokens = (dados.tokens || []).map((token) => {
          const protegido = protegidos.get(token.id);
          if (protegido) return protegido;
          const existente = atuais.get(token.id);
          const pendente = posicoesTokensPendentesRef.current.get(token.id);
          if (pendente) {
            const posicaoRemota = token.posicoes?.[pendente.mapaChave] || token;
            const confirmou = Math.abs(Number(posicaoRemota.x) - pendente.x) < 0.001
              && Math.abs(Number(posicaoRemota.y) - pendente.y) < 0.001;
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
    } catch (error) { setErro(error.message || "Nao foi possivel carregar a mesa."); }
    finally { setCarregando(false); }
  }, [codigo]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { campanhaRef.current = campanha; }, [campanha]);
  useEffect(() => campanha?.id ? ouvirCampanha(campanha.id, (evento) => {
    if (evento?.tipo === "tokens_sincronizados") {
      setCampanha((atual) => {
        if (!atual) return atual;
        const mapaChave = chavePosicaoMapa(atual.cenaAtiva?.id, atual.midiaAtivaId);
        const tokens = (evento.tokens || []).map((token) => {
          const pendente = posicoesTokensPendentesRef.current.get(token.id);
          if (pendente) {
            const posicaoRemota = token.posicoes?.[pendente.mapaChave] || token;
            const confirmou = Math.abs(Number(posicaoRemota.x) - pendente.x) < 0.001
              && Math.abs(Number(posicaoRemota.y) - pendente.y) < 0.001;
            if (confirmou) posicoesTokensPendentesRef.current.delete(token.id);
            else return atual.tokens.find((item) => item.id === token.id) || token;
          }
          if (tokensEmGravacaoRef.current.has(token.id)) {
            return atual.tokens.find((item) => item.id === token.id) || token;
          }
          const tokenAtual = atual.tokens.find((item) => item.id === token.id);
          if (!aceitarTokenRemoto(tokenAtual, token)) return tokenAtual;
          const posicao = token.posicoes?.[mapaChave];
          return posicao ? { ...token, x: posicao.x, y: posicao.y } : token;
        });
        atual.tokens.forEach((token) => {
          if (tokensEmGravacaoRef.current.has(token.id) && !tokens.some((item) => item.id === token.id)) tokens.push(token);
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
          if (tokensEmGravacaoRef.current.has(tokenRemovidoId)) return atual;
          return {
            ...atual,
            tokens: atual.tokens.filter((token) => token.id !== tokenRemovidoId),
          };
        }
        if (!tokenRecebido?.id || tokensEmGravacaoRef.current.has(tokenRecebido.id)) {
          return atual;
        }
        const pendente = posicoesTokensPendentesRef.current.get(tokenRecebido.id);
        if (pendente) {
          const posicaoRemota = tokenRecebido.posicoes?.[pendente.mapaChave] || tokenRecebido;
          const confirmou = Math.abs(Number(posicaoRemota.x) - pendente.x) < 0.001
            && Math.abs(Number(posicaoRemota.y) - pendente.y) < 0.001;
          if (!confirmou) return atual;
          posicoesTokensPendentesRef.current.delete(tokenRecebido.id);
        }
        const tokenAtual = atual.tokens.find((token) => token.id === tokenRecebido.id);
        if (!aceitarTokenRemoto(tokenAtual, tokenRecebido)) return atual;
        const mapaChave = chavePosicaoMapa(atual.cenaAtiva?.id, atual.midiaAtivaId);
        const posicao = tokenRecebido.posicoes?.[mapaChave];
        const tokenAtualizado = posicao
          ? { ...tokenRecebido, x: posicao.x, y: posicao.y }
          : tokenRecebido;
        const existe = atual.tokens.some((token) => token.id === tokenRecebido.id);
        return {
          ...atual,
          tokens: existe
            ? atual.tokens.map((token) => token.id === tokenRecebido.id ? tokenAtualizado : token)
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
  }) : undefined, [campanha?.id, carregar]);
  useEffect(() => {
    const url = urlCena(campanha?.cenaAtiva, campanha?.modo, campanha?.midiaAtivaId);
    let ativo = true;
    if (!url) { setCorCena(""); return undefined; }
    corInterfaceDaImagem(url).then((cor) => ativo && setCorCena(cor)).catch(() => ativo && setCorCena(""));
    return () => { ativo = false; };
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
  useEffect(() => { carregarFichas(); }, [carregarFichas]);
  useEffect(() => {
    if (!mestre) return;
    try { setCatalogoInimigos(JSON.parse(localStorage.getItem("darkness_inimigos")) || []); }
    catch { setCatalogoInimigos([]); }
  }, [mestre]);
  useEffect(() => {
    if (!campanha?.membros?.length) return;
    Promise.all(campanha.membros.map(async (membro) => {
      try { return [membro.ficha_id, await buscarPersonagem(membro.ficha_id)]; }
      catch { return [membro.ficha_id, null]; }
    })).then((entradas) => setPersonagens(Object.fromEntries(entradas)));
  }, [campanha?.membros]);
  useEffect(() => {
    const fichasIds = (campanha?.membros || []).map((membro) => membro.ficha_id).filter(Boolean);
    if (!fichasIds.length) return undefined;
    return ouvirPersonagens(fichasIds, (fichaId, personagem) => {
      setPersonagens((atuais) => ({ ...atuais, [fichaId]: personagem }));
      setFichaAberta((atual) => atual?.membro?.ficha_id === fichaId
        ? { ...atual, personagem }
        : atual);
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
    ).then(carregar).catch((error) => {
      console.error("Nao foi possivel restaurar os tokens da campanha.", error);
    });
  }, [campanha?.id, campanha?.membros, campanha?.tokens, carregar]);
  useEffect(() => {
    if (mestre || !campanha?.id) return undefined;
    const receberRolagem = async (event) => {
      if (event.origin !== window.location.origin || event.data?.tipo !== "darkness:rolagem-tabletop") return;
      try {
        const registro = await registrarRolagem(campanha.id, event.data.autor, event.data.rolagem || {});
        setCampanha((atual) => ({ ...atual, rolagens: [registro, ...(atual.rolagens || []).filter((item) => item.id !== registro.id)].slice(0, 30) }));
      } catch (error) {
        console.error("Nao foi possivel enviar a rolagem para o tabletop.", error);
      }
    };
    window.addEventListener("message", receberRolagem);
    return () => window.removeEventListener("message", receberRolagem);
  }, [campanha?.id, mestre]);

  const adicionarFicha = async () => {
    const registro = fichasDisponiveis.find((item) => item.fichaId === fichaParaVincular);
    if (!registro) return;
    await vincularFicha(campanha.id, registro.fichaId, registro.personagem);
    setFichaParaVincular(""); await carregar();
  };

  const removerFicha = async (fichaId) => {
    if (!window.confirm("Remover esta ficha da mesa e apagar seu token?")) return;
    await desvincularFicha(campanha.id, fichaId); setFichaAberta(null); await carregar();
  };
  const adicionarInimigo = async () => {
    const inimigo = catalogoInimigos.find((item) => String(item.id || item.fichaId) === inimigoParaAdicionar);
    if (!inimigo) return;
    await vincularInimigo(campanha.id, inimigo);
    setInimigoParaAdicionar("");
    await carregar();
  };
  const removerInimigo = async (inimigo) => {
    if (!window.confirm(`Remover ${inimigo.nome || "este inimigo"} desta campanha?`)) return;
    await desvincularInimigo(campanha.id, inimigo.id);
    setInimigoAberto(null);
    await carregar();
  };

  const apresentar = async (cena, modo, midia = null) => {
    setTransicao(true);
    await ativarCena(campanha.id, cena.id, modo, midia?.id || null);
    setTimeout(() => { setCampanha((atual) => ({ ...atual, cenaAtiva: cena, modo, midiaAtivaId: midia?.id || null })); }, 350);
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
    setEditando(cena ? { ...cena, imagemUrl: urlCena(cena, "cena"), mapaUrl: urlCena(cena, "mapa"), larguraGrade: cena.largura_grade || cena.larguraGrade || 12, alturaGrade: cena.altura_grade || cena.alturaGrade || 8 } : cenaVazia);
    setArquivos({ cena: null, mapa: null }); setEditorAberto(true);
  };

  const confirmarCena = async (event) => {
    event.preventDefault(); setSalvando(true); setErro("");
    try {
      const [imagemUrl, mapaUrl] = await Promise.all([
        arquivos.cena ? enviarImagemCena(campanha.id, arquivos.cena, "cena") : editando.imagemUrl,
        arquivos.mapa ? enviarImagemCena(campanha.id, arquivos.mapa, "mapa") : editando.mapaUrl,
      ]);
      await salvarCena(campanha.id, { ...editando, imagemUrl, mapaUrl });
      await carregar(); setEditorAberto(false);
    } catch (error) { setErro(error.message || "Nao foi possivel salvar a cena."); }
    finally { setSalvando(false); }
  };
  const selecionarArquivoCena = (tipo, arquivo, input) => {
    try { validarArquivoImagem(arquivo, tipo); setErro(""); setArquivos((atuais) => ({ ...atuais, [tipo]: arquivo })); }
    catch (error) { setErro(error.message); if (input) input.value = ""; }
  };

  const removerCena = async (cena) => {
    if (!window.confirm(`Excluir "${cena.nome}" da biblioteca?`)) return;
    await excluirCena(campanha.id, cena.id); await carregar();
  };

  const calcularPosicaoToken = (event) => {
    const area = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - area.left) / area.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - area.top) / area.height) * 100));
    return { x, y };
  };

  const podeMoverToken = (token) => Boolean(token && (mestre || token.ficha_id === fichaJogadorId));
  const mapaChaveAtual = chavePosicaoMapa(campanha?.cenaAtiva?.id, campanha?.midiaAtivaId);

  const arrastarToken = (event) => {
    const token = campanha.tokens.find((item) => item.id === tokenArrastando);
    if (!tokenArrastando || !podeMoverToken(token) || campanha.modo !== "mapa") return;
    const { x, y } = calcularPosicaoToken(event);
    setCampanha((atual) => ({ ...atual, tokens: atual.tokens.map((item) => item.id === tokenArrastando ? { ...item, x, y } : item) }));
  };

  const soltarToken = async (event) => {
    if (!tokenArrastando) return;
    const tokenId = tokenArrastando;
    if (tokensEmGravacaoRef.current.has(tokenId)) return;
    const token = campanha.tokens.find((item) => item.id === tokenId);
    if (!podeMoverToken(token)) { setTokenArrastando(null); return; }
    const { x, y } = calcularPosicaoToken(event);
    tokensEmGravacaoRef.current.add(tokenId);
    posicoesTokensPendentesRef.current.set(tokenId, { x, y, mapaChave: mapaChaveAtual });
    setTokenArrastando(null);
    setCampanha((atual) => ({ ...atual, tokens: atual.tokens.map((item) => item.id === tokenId ? { ...item, x, y } : item) }));
    try {
      const confirmado = await moverToken(tokenId, x, y, mapaChaveAtual);
      if (confirmado) {
        setCampanha((atual) => ({ ...atual, tokens: atual.tokens.map((item) => item.id === tokenId ? { ...item, ...confirmado, x, y } : item) }));
      }
    } catch (error) {
      posicoesTokensPendentesRef.current.delete(tokenId);
      setErro(error.message || "Nao foi possivel salvar a posicao do token.");
    } finally {
      tokensEmGravacaoRef.current.delete(tokenId);
    }
  };

  const soltarFichaNoMapa = async (event) => {
    event.preventDefault();
    if (!mestre || campanha.modo !== "mapa") return;
    const fichaId = event.dataTransfer.getData("application/x-darkness-ficha");
    const inimigoId = event.dataTransfer.getData("application/x-darkness-inimigo");
    if (inimigoId) {
      const inimigo = (campanha.inimigos || []).find(
        (item) => String(item.id) === inimigoId || String(item.inimigo_ref) === inimigoId,
      );
      if (!inimigo) return;
      const { x, y } = calcularPosicaoToken(event);
      try {
        const token = await posicionarInimigoNoMapa(campanha.id, inimigo, x, y, mapaChaveAtual);
        setCampanha((atual) => ({
          ...atual,
          tokens: [...(atual.tokens || []).filter((item) => item.ficha_id !== token.ficha_id), token],
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
        tokens: [...(atual.tokens || []).filter((item) => item.ficha_id !== fichaId), token],
      }));
    } catch (error) {
      setErro(error.message || "Nao foi possivel colocar a ficha no mapa.");
    }
  };

  const iniciarPanMapa = (event) => {
    if (campanha.modo !== "mapa" || event.button !== 0) return;
    if (event.target.closest?.(".mesa-token")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    inicioPanMapaRef.current = { ponteiroX: event.clientX, ponteiroY: event.clientY, panX: panMapa.x, panY: panMapa.y };
    setMapaArrastando(true);
  };

  const moverPanMapa = (event) => {
    const inicio = inicioPanMapaRef.current;
    if (!inicio || tokenArrastando) return;
    setPanMapa({ x: inicio.panX + event.clientX - inicio.ponteiroX, y: inicio.panY + event.clientY - inicio.ponteiroY });
  };

  const finalizarPanMapa = (event) => {
    if (!inicioPanMapaRef.current) return;
    inicioPanMapaRef.current = null;
    setMapaArrastando(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  if (carregando) return <main className="mesa-estado">Abrindo a mesa...</main>;
  if (erro && !campanha) return <main className="mesa-estado"><p>{erro}</p><a href="/">Voltar</a></main>;

  const cena = campanha.cenaAtiva;
  const midiaAtiva = midiasDaCena(cena, campanha.modo).find((item) => item.id === campanha.midiaAtivaId) || midiasDaCena(cena, campanha.modo)[0];
  const colunas = midiaAtiva?.larguraGrade || cena?.largura_grade || cena?.larguraGrade || 12;
  const linhas = midiaAtiva?.alturaGrade || cena?.altura_grade || cena?.alturaGrade || 8;
  const membroJogador = campanha.membros.find((membro) => membro.ficha_id === fichaJogadorId);
  const personagemJogador = membroJogador ? personagens[membroJogador.ficha_id] : null;
  const habilidadesJogador = personagemJogador ? listarHabilidadesSelecionadas(personagemJogador) : [];
  const passivosJogador = personagemJogador ? Object.entries(personagemJogador.habilidadesPassivas || {}).filter(([, valor]) => Number(valor) > 0) : [];
  const personagemFichaAberta = fichaAberta?.personagem;
  const habilidadesFichaAberta = personagemFichaAberta ? listarHabilidadesSelecionadas(personagemFichaAberta) : [];
  const passivosFichaAberta = personagemFichaAberta ? Object.entries(personagemFichaAberta.habilidadesPassivas || {}).filter(([, valor]) => Number(valor) > 0) : [];
  const renderizarCenaBiblioteca = (item) => {
    const selecionada = item.id === cena?.id;
    const midias = [...(item.imagensCena || []).map((midia) => ({ ...midia, tipo: "cena", rotulo: "Cena estatica" })), ...(item.mapasBatalha || []).map((midia) => ({ ...midia, tipo: "mapa", rotulo: "Mapa de batalha" }))];
    const primeiraDoModo = midias.find((midia) => midia.tipo === campanha.modo)?.id;
    return <React.Fragment key={item.id}><article className={selecionada ? "selecionado" : ""} style={{ backgroundImage: `url(${urlCena(item, "cena") || urlCena(item, "mapa")})` }}><div className="biblioteca-item-conteudo"><span>{selecionada ? "No ar" : "Cena salva"}</span><strong>{item.nome}</strong><small>{urlCena(item, "mapa") ? "Mapa preparado" : "Sem mapa"}</small></div><div className="biblioteca-item-acoes"><button onClick={() => apresentar(item, "cena")} title="Exibir cena"><Icon path={mdiPlay} size={.72} /></button>{urlCena(item, "mapa") && <button onClick={() => apresentar(item, "mapa")} title="Abrir mapa"><Icon path={mdiMapOutline} size={.72} /></button>}<button onClick={() => abrirEditor(item)} title="Editar"><Icon path={mdiPencilOutline} size={.72} /></button><button onClick={() => removerCena(item)} title="Excluir"><Icon path={mdiDeleteOutline} size={.72} /></button></div></article>{selecionada && midias.length > 0 && <section className={`biblioteca-midias-ativas ${midiasRecolhidas ? "recolhida" : ""}`}><button className="biblioteca-midias-toggle" onClick={() => setMidiasRecolhidas((valor) => !valor)} aria-expanded={!midiasRecolhidas}><Icon path={midiasRecolhidas ? mdiChevronRight : mdiChevronDown} size={.62} /><span>Imagens da cena atual</span><b>{midias.length}</b></button>{!midiasRecolhidas && <div>{midias.map((midia) => <button key={`${midia.tipo}-${midia.id}`} className={campanha.modo === midia.tipo && (campanha.midiaAtivaId === midia.id || (!campanha.midiaAtivaId && primeiraDoModo === midia.id)) ? "ativo" : ""} onClick={() => apresentar(item, midia.tipo, midia)} title={`Exibir ${midia.nome}`}><i style={{ backgroundImage: `url(${midia.url})` }}><Icon path={midia.tipo === "mapa" ? mdiMapOutline : mdiImageOutline} size={.62} /></i><span><small>{midia.rotulo}</small><strong>{midia.nome}</strong></span></button>)}</div>}</section>}</React.Fragment>;
  };
  return <main className={`mesa-shell ${mestre ? "visao-mestre" : "visao-jogador"} ${!mestre && abaLateralJogador === "ficha" ? "jogador-ficha-ativa" : ""} ${!(mestre ? abaLateralMestre : abaLateralJogador) ? "painel-lateral-fechado" : ""} modo-atual-${campanha.modo} ${bibliotecaAberta ? "com-biblioteca" : ""}`} style={{ "--mesa-acento": corCena || personagemJogador?.temaFicha?.primaria || "#d4af37", "--mesa-secundaria": corCena || personagemJogador?.temaFicha?.secundaria || "#8b4513", "--mesa-texto": personagemJogador?.temaFicha?.texto || "#fff8ea", "--mesa-fundo": personagemJogador?.temaFicha?.fundo || "#080808", "--mesa-borda": corCena ? `color-mix(in srgb,${corCena} 45%,transparent)` : (personagemJogador?.temaFicha?.borda || "rgba(212,175,55,.35)") }}>
    <div className={`mesa-transicao ${transicao ? "ativa" : ""}`}><span>{campanha.modo === "mapa" ? "Voltando a cena" : "Preparando o mapa"}</span></div>
    <header className="mesa-topo">
      <a href="/" title="Sair da mesa"><Icon path={mdiArrowLeft} size={0.9} /></a>
      <div><span>Campanha {campanha.codigo}</span><strong>{campanha.nome}</strong></div>
      <div className="mesa-status"><i />{supabaseConfigurado ? "Ao vivo" : "Demonstracao"}</div>
      {mestre && <div className="mesa-ferramentas-mestre"><button className={`mesa-cenas-botao ${bibliotecaAberta ? "ativo" : ""}`} onClick={() => { setBibliotecaAberta((valor) => !valor); setAnotacoesAbertas(false); setMusicaAberta(false); }}><Icon path={mdiImageOutline} size={0.78} />Cenas</button><button className={`mesa-cenas-botao ${anotacoesAbertas ? "ativo" : ""}`} onClick={() => { setAnotacoesAbertas((valor) => !valor); setBibliotecaAberta(false); setMusicaAberta(false); }}><Icon path={mdiNotebookEditOutline} size={0.78} />Anotacoes</button><button className={`mesa-cenas-botao ${musicaAberta ? "ativo" : ""}`} onClick={() => { setMusicaAberta((valor) => !valor); setBibliotecaAberta(false); setAnotacoesAbertas(false); }}><Icon path={mdiMusicBoxMultipleOutline} size={0.78} />Musica</button><div className="mesa-modos" aria-label="Modo da mesa"><button className={campanha.modo === "cena" ? "ativo" : ""} onClick={() => trocarModo("cena")} title="Exibir cena"><Icon path={mdiImageOutline} size={0.82} /></button><button className={campanha.modo === "mapa" ? "ativo" : ""} onClick={() => trocarModo("mapa")} title="Exibir mapa"><Icon path={mdiMapOutline} size={0.82} /></button></div></div>}
      <button className="mesa-atualizar" onClick={carregar} title="Atualizar"><Icon path={mdiRefresh} size={0.82} /></button>
    </header>
    {mestre && bibliotecaAberta && <aside className="mesa-biblioteca"><div className="biblioteca-cabecalho"><div><span>Direcao da sessao</span><h2>Cenas e mapas</h2></div><button onClick={() => abrirEditor()} title="Nova cena"><Icon path={mdiPlus} size={.9} /></button></div><div className="biblioteca-fichas"><span>Fichas da campanha</span><div><select value={fichaParaVincular} onChange={(e) => setFichaParaVincular(e.target.value)}><option value="">Selecionar ficha...</option>{fichasDisponiveis.filter((item) => !campanha.membros.some((membro) => membro.ficha_id === item.fichaId)).map((item) => <option key={item.fichaId} value={item.fichaId}>{item.personagem?.nome || item.fichaId}</option>)}</select><button onClick={adicionarFicha} disabled={!fichaParaVincular} title="Vincular ficha"><Icon path={mdiAccountPlusOutline} size={.78} /></button></div>{erroFichas && <div className="biblioteca-fichas-erro"><span>{erroFichas}</span><button onClick={carregarFichas}>Tentar novamente</button></div>}{!erroFichas && fichasDisponiveis.length === 0 && <small>Nenhuma ficha cadastrada foi encontrada.</small>}</div><div className="biblioteca-lista">{campanha.cenas.map(renderizarCenaBiblioteca)}</div></aside>}
    {mestre && anotacoesAbertas && <aside className="mesa-anotacoes-painel"><header><div><span>Arquivo do mestre</span><strong>Anotacoes da campanha</strong></div><button onClick={() => setAnotacoesAbertas(false)} title="Fechar anotacoes"><Icon path={mdiClose} size={.85} /></button></header><AnotacoesCampanha campanhaId={campanha.id} /></aside>}
    {mestre && musicaAberta && <aside className="mesa-musica-painel"><header><div><span>Trilha da sessao</span><strong>Playlist da campanha</strong></div><button onClick={() => setMusicaAberta(false)} title="Fechar musica"><Icon path={mdiClose} size={.85} /></button></header><MusicaTabletop campanhaId={campanha.id} musicasCampanha={campanha.musicas || []} estadoRemoto={campanha.musicaEstado} aoAlterarEstado={(estado) => atualizarEstadoMusica(campanha.id, estado)} /></aside>}
    {!mestre && campanha.musicas?.length > 0 && <aside className="mesa-musica-ouvinte"><MusicaTabletop campanhaId={campanha.id} musicasCampanha={campanha.musicas} estadoRemoto={campanha.musicaEstado} controlavel={false} /></aside>}

    <section className={`mesa-palco modo-${campanha.modo}`}><div className={`mesa-imagem ${tokenArrastando ? "arrastando-token" : ""} ${mapaArrastando ? "arrastando-mapa" : ""}`} style={{ backgroundImage: `url(${urlCena(cena, campanha.modo, campanha.midiaAtivaId)})`, transform: campanha.modo === "mapa" ? `translate(${panMapa.x}px, ${panMapa.y}px) scale(${zoomMapa})` : "none" }} onWheel={(event) => { if (campanha.modo !== "mapa") return; event.preventDefault(); setZoomMapa((zoom) => Math.max(0.5, Math.min(3, Number((zoom + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))))); }} onDragOver={(event) => { if (mestre && campanha.modo === "mapa") { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }} onDrop={soltarFichaNoMapa} onPointerDown={iniciarPanMapa} onPointerMove={(event) => { arrastarToken(event); moverPanMapa(event); }} onPointerUp={(event) => { if (tokenArrastando) soltarToken(event); finalizarPanMapa(event); }} onPointerCancel={(event) => { setTokenArrastando(null); finalizarPanMapa(event); }} onPointerLeave={(event) => tokenArrastando && soltarToken(event)}>
      {campanha.modo === "mapa" && <div className="mesa-grade" style={{ backgroundSize: `${100 / colunas}% ${100 / linhas}%` }} />}
      {campanha.modo === "mapa" && campanha.tokens.map((token) => <button key={token.id} className={`mesa-token ${podeMoverToken(token) ? "movivel" : "bloqueado"} ${tokenArrastando === token.id ? "arrastando" : ""}`} style={{ left: `${token.x}%`, top: `${token.y}%` }} title={podeMoverToken(token) ? `Mover ${token.nome}` : token.nome} onPointerDown={(event) => { if (!podeMoverToken(token)) return; event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); setTokenArrastando(token.id); }}>{token.imagem_url || personagens[token.ficha_id]?.fotoPerfil ? <img src={token.imagem_url || personagens[token.ficha_id]?.fotoPerfil} alt="" draggable="false" /> : token.nome?.slice(0, 2)}</button>)}
    </div>{campanha.modo === "mapa" && <div className="mesa-zoom-controles"><button type="button" onClick={() => setZoomMapa((zoom) => Math.max(.5, Number((zoom - .2).toFixed(2))))} title="Diminuir zoom"><Icon path={mdiMagnifyMinusOutline} size={.82} /></button><span>{Math.round(zoomMapa * 100)}%</span><button type="button" onClick={() => setZoomMapa((zoom) => Math.min(3, Number((zoom + .2).toFixed(2))))} title="Aumentar zoom"><Icon path={mdiMagnifyPlusOutline} size={.82} /></button><button type="button" onClick={() => { setZoomMapa(1); setPanMapa({ x: 0, y: 0 }); }} title="Restaurar zoom e posicao"><Icon path={mdiFitToScreenOutline} size={.82} /></button></div>}</section>
    {mestre && <nav className="mesa-lateral-navegacao" aria-label="Conteudo da lateral"><button className={abaLateralMestre === "participantes" ? "ativo" : ""} onClick={() => { setAbaLateralMestre((aba) => aba === "participantes" ? "" : "participantes"); setInimigoAberto(null); }}>Participantes <b>{campanha.membros.length}</b></button><button className={abaLateralMestre === "inimigos" ? "ativo" : ""} onClick={() => setAbaLateralMestre((aba) => aba === "inimigos" ? "" : "inimigos")}>Inimigos <b>{campanha.inimigos?.length || 0}</b></button></nav>}
    {!mestre && <nav className="mesa-lateral-navegacao mesa-jogador-navegacao" aria-label="Conteudo do jogador"><button className={abaLateralJogador === "participantes" ? "ativo" : ""} onClick={() => setAbaLateralJogador((aba) => aba === "participantes" ? "" : "participantes")}>Participantes <b>{campanha.membros.length}</b></button><button className={abaLateralJogador === "ficha" ? "ativo" : ""} onClick={() => setAbaLateralJogador((aba) => aba === "ficha" ? "" : "ficha")}>Ficha</button></nav>}
    {!mestre && abaLateralJogador === "participantes" && <aside className="mesa-jogador-participantes"><div className="mesa-lateral-titulo"><Icon path={mdiShieldCrownOutline} size={0.8} /><span>Participantes</span><b>{campanha.membros.length}</b></div><div className="mesa-membros">{campanha.membros.length ? campanha.membros.map((membro) => { const personagem = personagens[membro.ficha_id]; const recursos = recursosParticipante(personagem); return <div className={`mesa-jogador-participante ${membro.ficha_id === fichaJogadorId ? "eu" : ""} ${classesCondicoesMesa(personagem)}`} key={membro.id}><span>{personagem?.fotoPerfil ? <img src={personagem.fotoPerfil} alt="" /> : membro.nome?.slice(0, 2)}</span><div><strong>{personagem?.nome || membro.nome}</strong><small>{personagem ? `Nivel ${personagem.nivel || 1} · ${personagem.classe || "Sem classe"}` : membro.papel}</small><ResumoCondicoesParticipante personagem={personagem} />{recursos.length > 0 && <div className="membro-recursos">{recursos.map((recurso) => <div className={`membro-recurso ${classeRecursoParticipante(recurso)}`} key={recurso.id}><span>{recurso.nome}</span><i><em style={{ width: `${percentualRecurso(recurso.valor)}%` }} /></i><b>{recurso.valor?.atual || 0}/{recurso.valor?.max || 0}</b></div>)}</div>}</div></div>; }) : <p>Nenhuma ficha vinculada ainda.</p>}</div></aside>}
    {!mestre && abaLateralJogador === "ficha" && personagemJogador && <section className="ficha-tablet-mesa" role="dialog" aria-label={`Ficha de ${personagemJogador.nome}`}><header><div><span>Ficha no tabletop</span><strong>{personagemJogador.nome}</strong></div><button onClick={() => setAbaLateralJogador("participantes")} title="Fechar ficha"><Icon path={mdiClose} size={.9} /></button></header><iframe title={`Ficha de ${personagemJogador.nome}`} src={`/?ficha=${encodeURIComponent(personagemJogador.nome || membroJogador.ficha_id)}&senha=${encodeURIComponent(membroJogador.ficha_id)}&embed=mesa`} /></section>}
    {!mestre && abaLateralJogador === "ficha" && !personagemJogador && <aside className="mesa-jogador-participantes"><div className="jogador-escolher-ficha"><strong>Ficha indisponivel</strong><p>Selecione uma ficha vinculada para abri-la na mesa.</p></div></aside>}
    {mestre && abaLateralMestre === "inimigos" && <aside className="mesa-inimigos-lateral"><div className="mesa-lateral-abas"><button onClick={() => { setAbaLateralMestre("participantes"); setInimigoAberto(null); }}>Participantes</button><button className="ativo">Inimigos <b>{campanha.inimigos?.length || 0}</b></button></div>{inimigoAberto ? <div className="mesa-inimigo-ficha"><header><button onClick={() => setInimigoAberto(null)}><Icon path={mdiArrowLeft} size={.7} /></button><span>Ficha do inimigo</span><button onClick={() => removerInimigo(inimigoAberto)} title="Remover da campanha"><Icon path={mdiDeleteOutline} size={.7} /></button></header><div className="mesa-inimigo-identidade">{inimigoAberto.fotoPerfil ? <img src={inimigoAberto.fotoPerfil} alt="" /> : <span>{inimigoAberto.nome?.slice(0, 2)}</span>}<div><strong>{inimigoAberto.nome}</strong><small>Nivel {inimigoAberto.nivel || 1} · {inimigoAberto.classe || "Inimigo"}</small></div></div><div className="mesa-inimigo-recursos"><div><span>Sanidade</span><b>{inimigoAberto.sanidade?.atual || 0}/{inimigoAberto.sanidade?.max || 0}</b></div><div><span>Defesa</span><b>{inimigoAberto.defesa || 0}</b></div><div><span>Integridade</span><b>{calcularIntegridade(inimigoAberto).atual}/{calcularIntegridade(inimigoAberto).max}</b></div></div><section><h3>Atributos</h3><div className="mesa-inimigo-atributos">{Object.entries(inimigoAberto.atributos || {}).map(([nome, valor]) => <div key={nome}><span>{nome}</span><b>{valor}</b></div>)}</div></section><section><h3>Habilidades e ataques</h3><div className="mesa-inimigo-habilidades">{[...(inimigoAberto.habilidades || []), ...(inimigoAberto.ataques || [])].length ? [...(inimigoAberto.habilidades || []), ...(inimigoAberto.ataques || [])].map((item, index) => <article key={item.id || index}><strong>{item.nome || item.titulo || `Acao ${index + 1}`}</strong><p>{item.descricao || item.efeito || item.dano || "Sem descricao"}</p></article>) : <p>Nenhuma habilidade cadastrada.</p>}</div></section></div> : <><div className="mesa-inimigo-adicionar"><select value={inimigoParaAdicionar} onChange={(event) => setInimigoParaAdicionar(event.target.value)}><option value="">Selecionar inimigo...</option>{catalogoInimigos.filter((item) => !(campanha.inimigos || []).some((vinculado) => String(vinculado.inimigo_ref) === String(item.id || item.fichaId))).map((item) => <option key={item.id || item.fichaId} value={item.id || item.fichaId}>{item.nome}</option>)}</select><button onClick={adicionarInimigo} disabled={!inimigoParaAdicionar}><Icon path={mdiPlus} size={.72} /></button></div><div className="mesa-inimigos-lista">{campanha.inimigos?.length ? campanha.inimigos.map((inimigo) => <button key={inimigo.id} draggable title="Arraste para o mapa para criar ou mover o token" onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("application/x-darkness-inimigo", String(inimigo.inimigo_ref || inimigo.id)); }} onClick={() => setInimigoAberto(inimigo)}>{inimigo.fotoPerfil ? <img src={inimigo.fotoPerfil} alt="" /> : <span>{inimigo.nome?.slice(0, 2)}</span>}<div><strong>{inimigo.nome}</strong><small>Nivel {inimigo.nivel || 1} · Defesa {inimigo.defesa || 0}</small><em>{inimigo.sanidade?.atual || 0}/{inimigo.sanidade?.max || 0} SAN</em></div></button>) : <p>Nenhum inimigo nesta campanha.</p>}</div></>}</aside>}
    {/* Plano B ativo. O painel detalhado do jogador abaixo foi preservado e esta apenas oculto por CSS. */}
    <aside className={`mesa-lateral ${mestre ? "" : "mesa-ficha-jogador"}`}>{mestre ? <><div className="mesa-lateral-titulo"><Icon path={mdiShieldCrownOutline} size={0.8} /><span>Participantes</span><b>{campanha.membros.length}</b></div><div className="mesa-membros">{campanha.membros.length ? campanha.membros.map((membro) => { const personagem = personagens[membro.ficha_id]; const recursos = recursosParticipante(personagem); return <button className={`participante-condicionado ${classesCondicoesMesa(personagem)}`} key={membro.id} draggable title="Arraste para o mapa para criar ou mover o token" onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("application/x-darkness-ficha", membro.ficha_id); }} onClick={() => setFichaAberta({ membro, personagem })}><span>{personagem?.fotoPerfil ? <img src={personagem.fotoPerfil} alt="" /> : membro.nome?.slice(0, 2)}</span><div><strong>{personagem?.nome || membro.nome}</strong><small>{personagem ? `Nivel ${personagem.nivel || 1} · ${personagem.classe || "Sem classe"}` : membro.papel}</small><ResumoCondicoesParticipante personagem={personagem} />{recursos.length > 0 && <div className="membro-recursos">{recursos.map((recurso) => <div className={`membro-recurso ${classeRecursoParticipante(recurso)}`} key={recurso.id}><span>{recurso.nome}</span><i><em style={{ width: `${percentualRecurso(recurso.valor)}%` }} /></i><b>{recurso.valor?.atual || 0}/{recurso.valor?.max || 0}</b></div>)}</div>}</div></button>; }) : <p>Nenhuma ficha vinculada ainda.</p>}</div></> : personagemJogador ? <><div className="mesa-lateral-titulo"><Icon path={mdiShieldCrownOutline} size={0.8} /><span>Minha ficha</span></div><div className="jogador-ficha-identidade">{personagemJogador.fotoPerfil && <img src={personagemJogador.fotoPerfil} alt="" />}<div><strong>{personagemJogador.nome}</strong><small>Nivel {personagemJogador.nivel || 1} · {personagemJogador.classe || "Sem classe"}</small></div></div><div className="jogador-ficha-recursos">{[["SAN", personagemJogador.sanidade], ["ESP", personagemJogador.esperanca], ["INT", calcularIntegridade(personagemJogador)]].map(([nome, recurso]) => <div key={nome}><span>{nome}</span><i><em style={{ width: `${percentualRecurso(recurso)}%` }} /></i><b>{recurso?.atual || 0}/{recurso?.max || 0}</b></div>)}</div><div className="jogador-ficha-listas"><section><h3>Habilidades</h3>{habilidadesJogador.length ? habilidadesJogador.map((item) => <article key={`${item.grupo}-${item.id}`}><strong>{item.nome}</strong><span>{item.grupo}{item.especialidade ? ` · ${item.especialidade}` : ""}</span><p>{item.descricao || item.efeito}</p></article>) : <p>Nenhuma habilidade selecionada.</p>}</section><section><h3>Passivos</h3>{passivosJogador.length ? passivosJogador.map(([nome, valor]) => <div className="jogador-ficha-passivo" key={nome}><span>{nome.replace(/([A-Z])/g, " $1")}</span><b>{valor}</b></div>) : <p>Nenhum passivo adquirido.</p>}</section><section><h3>Rituais e ativos</h3>{personagemJogador.rituais?.length ? personagemJogador.rituais.map((item, index) => <article key={item.id || index}><strong>{item.nome || `Ritual ${index + 1}`}</strong><p>{item.descricao || item.efeito}</p></article>) : <p>Nenhum ritual ou ativo registrado.</p>}</section></div><button className="jogador-abrir-ficha" onClick={() => setFichaAberta({ membro: membroJogador, personagem: personagemJogador })}>Abrir ficha</button></> : <div className="jogador-escolher-ficha"><strong>Qual e a sua ficha?</strong><p>Escolha a ficha vinculada a este jogador.</p><select value={fichaJogadorId} onChange={(event) => { const id = event.target.value; setFichaJogadorId(id); localStorage.setItem(`darkness_mesa_ficha_${codigo}`, id); }}><option value="">Selecionar ficha...</option>{campanha.membros.map((membro) => <option key={membro.id} value={membro.ficha_id}>{personagens[membro.ficha_id]?.nome || membro.nome}</option>)}</select></div>}</aside>
    <footer className="mesa-rodape"><div className="mesa-rolagens-titulo"><Icon path={mdiDiceMultiple} size={0.85} /><span>Rolagens</span></div><div className="mesa-rolagens">{campanha.rolagens.length ? campanha.rolagens.map((rolagem) => { const faces = facesDaRolagem(rolagem); return <div key={rolagem.id}><span>{rolagem.autor_nome}</span><b className={`mesa-resultado-dado d${faces}`} title={`Resultado ${rolagem.resultado} em d${faces}`}><i>{rolagem.resultado}</i></b><small>{rolagem.expressao}</small></div>; }) : <p>As rolagens da sessao aparecerao aqui.</p>}</div></footer>

    {editorAberto && <div className="cena-editor-fundo" onMouseDown={(event) => event.target === event.currentTarget && setEditorAberto(false)}><form className="cena-editor" onSubmit={confirmarCena}><header><div><span>Biblioteca</span><h2>{editando.id ? "Editar cena" : "Nova cena"}</h2></div><button type="button" onClick={() => setEditorAberto(false)}><Icon path={mdiClose} size={.85} /></button></header><label>Nome<input required value={editando.nome || ""} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} /></label><label>Descricao<textarea rows="3" value={editando.descricao || ""} onChange={(e) => setEditando({ ...editando, descricao: e.target.value })} /></label><div className="cena-editor-midias"><label>Imagem da cena · max. 2 MB<input type="file" accept="image/webp,image/jpeg,image/png,image/avif" onChange={(e) => selecionarArquivoCena("cena", e.target.files[0], e.target)} /><small>{arquivos.cena?.name || editando.imagemUrl || "Escolha uma imagem"}</small></label><label>Mapa de batalha · max. 5 MB<input type="file" accept="image/webp,image/jpeg,image/png,image/avif" onChange={(e) => selecionarArquivoCena("mapa", e.target.files[0], e.target)} /><small>{arquivos.mapa?.name || editando.mapaUrl || "Opcional"}</small></label></div><details><summary>Usar URLs em vez de arquivos</summary><label>URL da cena<input value={editando.imagemUrl || ""} onChange={(e) => setEditando({ ...editando, imagemUrl: e.target.value })} /></label><label>URL do mapa<input value={editando.mapaUrl || ""} onChange={(e) => setEditando({ ...editando, mapaUrl: e.target.value })} /></label></details><div className="cena-editor-grade"><label>Colunas<input type="number" min="1" max="100" value={editando.larguraGrade} onChange={(e) => setEditando({ ...editando, larguraGrade: e.target.value })} /></label><label>Linhas<input type="number" min="1" max="100" value={editando.alturaGrade} onChange={(e) => setEditando({ ...editando, alturaGrade: e.target.value })} /></label></div>{erro && <p className="cena-editor-erro">{erro}</p>}<footer><button type="button" onClick={() => setEditorAberto(false)}>Cancelar</button><button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar na biblioteca"}</button></footer></form></div>}
    {fichaAberta && <div className="ficha-mesa-fundo" onMouseDown={(e) => e.target === e.currentTarget && setFichaAberta(null)}><section className={`ficha-mesa-resumo ${mestre ? "plano-a" : ""}`}><header><div><span>Ficha integrada</span><h2>{fichaAberta.personagem?.nome || fichaAberta.membro.nome}</h2></div><button onClick={() => setFichaAberta(null)}><Icon path={mdiClose} size={.85} /></button></header>{fichaAberta.personagem ? <><div className="ficha-mesa-identidade">{fichaAberta.personagem.fotoPerfil ? <img src={fichaAberta.personagem.fotoPerfil} alt="" /> : <span>{fichaAberta.personagem.nome?.slice(0, 2)}</span>}<div><strong>{fichaAberta.personagem.classe || "Sem classe"}</strong><small>Nivel {fichaAberta.personagem.nivel || 1}</small></div></div><div className="ficha-mesa-recursos">{[["Sanidade", fichaAberta.personagem.sanidade], ["Esperanca", fichaAberta.personagem.esperanca], ["Integridade", calcularIntegridade(fichaAberta.personagem)]].map(([nome, recurso]) => <div key={nome}><span>{nome}</span><strong>{recurso?.atual ?? 0}{recurso?.max ? ` / ${recurso.max}` : ""}</strong>{recurso?.max > 0 && <i><em style={{ width: `${percentualRecurso(recurso)}%` }} /></i>}</div>)}</div>{mestre && <div className="ficha-mesa-detalhes"><section><h3>Atributos</h3><div className="ficha-mesa-atributos">{Object.entries(personagemFichaAberta.atributos || {}).map(([nome, valor]) => <div key={nome}><span>{nome}</span><b>{typeof valor === "object" ? valor.valor ?? 0 : valor}</b></div>)}</div></section><section><h3>Habilidades</h3>{habilidadesFichaAberta.length ? habilidadesFichaAberta.map((item) => <article key={`${item.grupo}-${item.id}`}><strong>{item.nome}</strong><small>{item.grupo}{item.especialidade ? ` · ${item.especialidade}` : ""}</small><p>{item.descricao || item.efeito || "Sem descricao."}</p></article>) : <p>Nenhuma habilidade selecionada.</p>}</section><section><h3>Passivos</h3>{passivosFichaAberta.length ? passivosFichaAberta.map(([nome, valor]) => <div className="ficha-mesa-passivo" key={nome}><span>{nome.replace(/([A-Z])/g, " $1")}</span><b>{valor}</b></div>) : <p>Nenhum passivo adquirido.</p>}</section><section><h3>Rituais e ativos</h3>{personagemFichaAberta.rituais?.length ? personagemFichaAberta.rituais.map((item, index) => <article key={item.id || index}><strong>{item.nome || `Ritual ${index + 1}`}</strong><p>{item.descricao || item.efeito || "Sem descricao."}</p></article>) : <p>Nenhum ritual ou ativo registrado.</p>}</section></div>}</> : <p className="ficha-mesa-indisponivel">A ficha nao foi encontrada no backend.</p>}<footer><a href={`/?ficha=${encodeURIComponent(fichaAberta.membro.ficha_id)}`}><Icon path={mdiOpenInNew} size={.72} />Abrir ficha completa</a>{mestre && <button onClick={() => removerFicha(fichaAberta.membro.ficha_id)}><Icon path={mdiDeleteOutline} size={.72} />Remover da mesa</button>}</footer></section></div>}
    {!mestre && fichaAberta?.membro?.ficha_id && <div className="ficha-completa-mesa" role="dialog" aria-label={`Ficha de ${fichaAberta.personagem?.nome || fichaAberta.membro.nome}`}><header><div><span>Ficha no tabletop</span><strong>{fichaAberta.personagem?.nome || fichaAberta.membro.nome}</strong></div><button onClick={() => setFichaAberta(null)} title="Fechar ficha"><Icon path={mdiClose} size={.9} /></button></header><iframe title={`Ficha de ${fichaAberta.personagem?.nome || fichaAberta.membro.nome}`} src={`/?ficha=${encodeURIComponent(fichaAberta.personagem?.nome || fichaAberta.membro.ficha_id)}&senha=${encodeURIComponent(fichaAberta.membro.ficha_id)}&embed=mesa`} /></div>}
  </main>;
};
export default Mesa;
