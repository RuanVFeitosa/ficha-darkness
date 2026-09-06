import { ACEITAR_AUDIO } from "../utils/audioUpload";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiAccountMultipleOutline,
  mdiArrowLeft,
  mdiChevronDown,
  mdiChevronRight,
  mdiDeleteOutline,
  mdiDrag,
  mdiFolderOutline,
  mdiImagePlusOutline,
  mdiMapOutline,
  mdiPlaylistMusic,
  mdiPencilOutline,
  mdiPlus,
} from "@mdi/js";
import {
  buscarCampanhaPorCodigo,
  criarCampanhaMesa,
  desvincularFicha,
  enviarImagemCena,
  excluirCampanhaMesa,
  excluirCena,
  listarCampanhas,
  ordenarCenasCampanha,
  salvarCena,
  salvarMusicasCampanha,
  salvarSoundpadCampanha,
  validarArquivoImagem,
  vincularFicha,
} from "../services/mesaApi";
import { listarPersonagens } from "../services/personagemApi";
import AnotacoesCampanha from "./AnotacoesCampanha";
import { confirmarDialogo } from "./DialogoGlobal";
import "../CSS/CampanhaDashboard.css";

const cenaVazia = {
  nome: "",
  descricao: "",
  pasta: "Sem pasta",
  imagensCena: [],
  mapasBatalha: [],
  visualizarTodos: true,
  jogadoresVisiveis: [],
};
const urlCena = (cena, tipo) =>
  tipo === "mapa"
    ? cena?.mapa_url || cena?.mapaUrl
    : cena?.imagem_url || cena?.imagemUrl;

const CampanhaDashboard = () => {
  const [campanha, setCampanha] = useState(null);
  const [campanhas, setCampanhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editorAberto, setEditorAberto] = useState(false);
  const [editando, setEditando] = useState(cenaVazia);
  const [salvando, setSalvando] = useState(false);
  const [pastasFechadas, setPastasFechadas] = useState({});
  const [criandoCampanha, setCriandoCampanha] = useState(false);
  const [nomeNovaCampanha, setNomeNovaCampanha] = useState("");
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [fichasNovaCampanha, setFichasNovaCampanha] = useState([]);
  const [carregandoFichas, setCarregandoFichas] = useState(false);
  const [gerenciandoFichas, setGerenciandoFichas] = useState(false);
  const [fichasVinculadas, setFichasVinculadas] = useState([]);
  const [abaCampanha, setAbaCampanha] = useState("cenas");
  const [musicas, setMusicas] = useState([]);
  const [sonsSoundpad, setSonsSoundpad] = useState([]);
  const [arrastando, setArrastando] = useState(null);
  const [indicadorDrop, setIndicadorDrop] = useState(null);
  useEffect(() => {
    setMusicas(campanha?.musicas || []);
  }, [campanha?.musicas]);
  useEffect(() => {
    setSonsSoundpad(campanha?.soundpad || []);
  }, [campanha?.soundpad]);

  const carregarCampanhas = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setCampanhas(await listarCampanhas());
    } catch (error) {
      setErro(error.message || "Nao foi possivel carregar as campanhas.");
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    carregarCampanhas();
  }, [carregarCampanhas]);

  const abrirCriacaoCampanha = async () => {
    setCriandoCampanha(true);
    setNomeNovaCampanha("");
    setFichasNovaCampanha([]);
    setCarregandoFichas(true);
    setErro("");
    try {
      setFichasDisponiveis(await listarPersonagens());
    } catch (error) {
      setErro(error.message || "Nao foi possivel carregar as fichas.");
    } finally {
      setCarregandoFichas(false);
    }
  };

  const alternarFichaNovaCampanha = (fichaId) => {
    setFichasNovaCampanha((atuais) =>
      atuais.includes(fichaId)
        ? atuais.filter((id) => id !== fichaId)
        : [...atuais, fichaId],
    );
  };

  const abrirGerenciadorFichas = async () => {
    setGerenciandoFichas(true);
    setCarregandoFichas(true);
    setErro("");
    setFichasVinculadas(
      (campanha?.membros || [])
        .map((membro) => membro.ficha_id)
        .filter(Boolean),
    );
    try {
      setFichasDisponiveis(await listarPersonagens());
    } catch (error) {
      setErro(error.message || "Nao foi possivel carregar as fichas.");
    } finally {
      setCarregandoFichas(false);
    }
  };

  const alternarFichaVinculada = (fichaId) => {
    setFichasVinculadas((atuais) =>
      atuais.includes(fichaId)
        ? atuais.filter((id) => id !== fichaId)
        : [...atuais, fichaId],
    );
  };

  const salvarFichasDaCampanha = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const idsConhecidos = fichasDisponiveis.map((ficha) => ficha.fichaId);
      const idsAtuais = (campanha.membros || []).map(
        (membro) => membro.ficha_id,
      );
      const remover = idsAtuais.filter(
        (id) => idsConhecidos.includes(id) && !fichasVinculadas.includes(id),
      );
      await Promise.all([
        ...fichasVinculadas.map((fichaId) => {
          const ficha = fichasDisponiveis.find(
            (item) => item.fichaId === fichaId,
          );
          return vincularFicha(campanha.id, fichaId, ficha?.personagem);
        }),
        ...remover.map((fichaId) => desvincularFicha(campanha.id, fichaId)),
      ]);
      await recarregarCampanha();
      setGerenciandoFichas(false);
    } catch (error) {
      setErro(
        error.message || "Nao foi possivel atualizar as fichas da campanha.",
      );
    } finally {
      setSalvando(false);
    }
  };

  const abrirCampanha = async (codigo) => {
    setCarregando(true);
    setErro("");
    try {
      setCampanha(await buscarCampanhaPorCodigo(codigo));
    } catch (error) {
      setErro(error.message || "Nao foi possivel abrir a campanha.");
    } finally {
      setCarregando(false);
    }
  };
  const recarregarCampanha = async () =>
    campanha?.codigo && abrirCampanha(campanha.codigo);
  const confirmarNovaCampanha = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const nova = await criarCampanhaMesa(nomeNovaCampanha);
      await Promise.all(
        fichasNovaCampanha.map((fichaId) => {
          const ficha = fichasDisponiveis.find(
            (item) => item.fichaId === fichaId,
          );
          return vincularFicha(nova.id, fichaId, ficha?.personagem);
        }),
      );
      await carregarCampanhas();
      setCriandoCampanha(false);
      setNomeNovaCampanha("");
      setFichasNovaCampanha([]);
      await abrirCampanha(nova.codigo);
    } catch (error) {
      setErro(error.message || "Nao foi possivel criar a campanha.");
    } finally {
      setSalvando(false);
    }
  };
  const removerCampanha = async (item) => {
    if (
      !(await confirmarDialogo(
        `Excluir a campanha "${item.nome}" e todas as suas cenas?`,
        { titulo: "Excluir campanha", confirmarTexto: "Excluir", perigo: true },
      ))
    )
      return;
    await excluirCampanhaMesa(item.id);
    await carregarCampanhas();
  };

  const grupos = useMemo(() => {
    const resultado = {};
    (campanha?.cenas || []).forEach((cena) => {
      const pasta = String(cena.pasta || "Sem pasta").trim() || "Sem pasta";
      if (!resultado[pasta]) resultado[pasta] = [];
      resultado[pasta].push(cena);
    });
    return Object.entries(resultado).sort(
      ([, cenasA], [, cenasB]) =>
        Math.min(...cenasA.map((cena) => Number(cena.ordem) || 0)) -
        Math.min(...cenasB.map((cena) => Number(cena.ordem) || 0)),
    );
  }, [campanha?.cenas]);

  const pastas = useMemo(() => grupos.map(([nome]) => nome), [grupos]);
  const abrirEditor = (cena = null) => {
    setEditando(
      cena
        ? {
            ...cena,
            pasta: cena.pasta || "Sem pasta",
            imagensCena: cena.imagensCena || [],
            mapasBatalha: cena.mapasBatalha || [],
          }
        : { ...cenaVazia, ordem: campanha?.cenas?.length || 0 },
    );
    setEditorAberto(true);
    setErro("");
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
  const adicionarMidia = (tipo) => {
    const chave = tipo === "cena" ? "imagensCena" : "mapasBatalha";
    const prefixo = tipo === "cena" ? "Imagem" : "Mapa";
    const item = {
      id: `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: `${prefixo} ${(editando[chave] || []).length + 1}`,
      url: "",
      arquivo: null,
      ...(tipo === "mapa"
        ? { larguraGrade: 12, alturaGrade: 8, exibirGrade: true }
        : {}),
    };
    setEditando((atual) => ({
      ...atual,
      [chave]: [...(atual[chave] || []), item],
    }));
  };
  const atualizarMidia = (chave, id, mudanca) =>
    setEditando((atual) => ({
      ...atual,
      [chave]: atual[chave].map((item) => {
        if (item.id !== id) return item;
        if (!mudanca.arquivo) return { ...item, ...mudanca };
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        return {
          ...item,
          ...mudanca,
          previewUrl: URL.createObjectURL(mudanca.arquivo),
          urlPersistida: undefined,
        };
      }),
    }));
  const removerMidia = (chave, id) => {
    const item = editando[chave]?.find((midia) => midia.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setEditando((atual) => ({
      ...atual,
      [chave]: atual[chave].filter((midia) => midia.id !== id),
    }));
  };
  const selecionarArquivoMidia = (chave, id, tipo, arquivo, input) => {
    try {
      validarArquivoImagem(arquivo, tipo);
      setErro("");
      atualizarMidia(chave, id, { arquivo });
    } catch (error) {
      setErro(error.message);
      if (input) input.value = "";
    }
  };
  const confirmar = async (event) => {
    event.preventDefault();
    if (editando.visualizarTodos === false && !editando.jogadoresVisiveis?.length) {
      setErro("Selecione pelo menos um jogador para visualizar esta cena.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const processar = (itens, tipo) =>
        Promise.all(
          itens.map(async (item) => {
            const { arquivo, previewUrl, ...dados } = item;
            return {
              ...dados,
              url: arquivo
                ? await enviarImagemCena(campanha.id, arquivo, tipo)
                : item.url,
              arquivo: undefined,
              previewUrl: undefined,
              urlPersistida: arquivo ? undefined : item.urlPersistida,
            };
          }),
        );
      const [imagensCena, mapasBatalha] = await Promise.all([
        processar(editando.imagensCena || [], "cena"),
        processar(editando.mapasBatalha || [], "mapa"),
      ]);
      await salvarCena(campanha.id, {
        ...editando,
        pasta: editando.pasta.trim() || "Sem pasta",
        imagensCena,
        mapasBatalha,
        imagemUrl: imagensCena[0]?.url || null,
        mapaUrl: mapasBatalha[0]?.url || null,
      });
      await recarregarCampanha();
      setEditorAberto(false);
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a cena.");
    } finally {
      setSalvando(false);
    }
  };
  const remover = async (cena) => {
    if (
      !(await confirmarDialogo(`Excluir "${cena.nome}"?`, {
        titulo: "Excluir cena",
        confirmarTexto: "Excluir",
        perigo: true,
      }))
    )
      return;
    await excluirCena(campanha.id, cena.id);
    await recarregarCampanha();
  };
  const adicionarMusica = () =>
    setMusicas((atuais) => [
      ...atuais,
      {
        id: `musica-${Date.now()}`,
        nome: `Musica ${atuais.length + 1}`,
        url: "",
        capa: "",
      },
    ]);
  const atualizarMusica = (id, mudanca) =>
    setMusicas((atuais) =>
      atuais.map((musica) =>
        musica.id === id ? { ...musica, ...mudanca } : musica,
      ),
    );
  const removerMusica = (id) =>
    setMusicas((atuais) => atuais.filter((musica) => musica.id !== id));
  const posicaoDrop = (event) =>
    event.clientY >=
    event.currentTarget.getBoundingClientRect().top +
      event.currentTarget.getBoundingClientRect().height / 2
      ? "abaixo"
      : "acima";
  const moverItem = (itens, origemId, destinoId, posicao = "acima") => {
    const origem = itens.findIndex((item) => item.id === origemId);
    const destino = itens.findIndex((item) => item.id === destinoId);
    if (origem < 0 || destino < 0 || origem === destino) return itens;
    const novos = [...itens];
    const [movido] = novos.splice(origem, 1);
    const destinoDepoisDaRemocao = novos.findIndex(
      (item) => item.id === destinoId,
    );
    novos.splice(
      destinoDepoisDaRemocao + (posicao === "abaixo" ? 1 : 0),
      0,
      movido,
    );
    return novos;
  };
  const soltarCena = async (destino) => {
    if (
      arrastando?.tipo !== "cena" ||
      arrastando.id === destino.id ||
      arrastando.pasta !== (destino.pasta || "Sem pasta")
    ) {
      setArrastando(null);
      return;
    }
    const cenas = moverItem(
      campanha.cenas,
      arrastando.id,
      destino.id,
      indicadorDrop?.posicao,
    ).map((cena, ordem) => ({ ...cena, ordem }));
    setCampanha((atual) => ({ ...atual, cenas }));
    setArrastando(null);
    setIndicadorDrop(null);
    try {
      await ordenarCenasCampanha(campanha.id, cenas);
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a ordem das cenas.");
      await recarregarCampanha();
    }
  };
  const soltarMusica = (destinoId) => {
    if (arrastando?.tipo === "musica")
      setMusicas((atuais) =>
        moverItem(atuais, arrastando.id, destinoId, indicadorDrop?.posicao),
      );
    setArrastando(null);
    setIndicadorDrop(null);
  };
  const soltarPasta = async (pastaDestino) => {
    if (arrastando?.tipo !== "pasta" || arrastando.id === pastaDestino) {
      setArrastando(null);
      setIndicadorDrop(null);
      return;
    }
    const pastasOrdenadas = grupos.map(([pasta]) => ({ id: pasta }));
    const novaOrdemPastas = moverItem(
      pastasOrdenadas,
      arrastando.id,
      pastaDestino,
      indicadorDrop?.posicao,
    ).map((item) => item.id);
    const cenas = novaOrdemPastas
      .flatMap((pasta) =>
        (campanha.cenas || []).filter(
          (cena) =>
            (String(cena.pasta || "Sem pasta").trim() || "Sem pasta") === pasta,
        ),
      )
      .map((cena, ordem) => ({ ...cena, ordem }));
    setCampanha((atual) => ({ ...atual, cenas }));
    setArrastando(null);
    setIndicadorDrop(null);
    try {
      await ordenarCenasCampanha(campanha.id, cenas);
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a ordem das pastas.");
      await recarregarCampanha();
    }
  };
  const confirmarMusicas = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await salvarMusicasCampanha(campanha.id, musicas);
      await recarregarCampanha();
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar a playlist.");
    } finally {
      setSalvando(false);
    }
  };
  const adicionarSom = () =>
    setSonsSoundpad((atuais) => [
      ...atuais,
      {
        id: `som-${Date.now()}`,
        nome: `Efeito ${atuais.length + 1}`,
        categoria: "Efeito",
        url: "",
        volume: 70,
        loop: false,
        sobrepor: true,
        fadeIn: 0.4,
        fadeOut: 0.7,
      },
    ]);
  const atualizarSom = (id, mudanca) =>
    setSonsSoundpad((atuais) =>
      atuais.map((som) => (som.id === id ? { ...som, ...mudanca } : som)),
    );
  const removerSom = (id) =>
    setSonsSoundpad((atuais) => atuais.filter((som) => som.id !== id));
  const selecionarAudioSom = (id, arquivo, input) => {
    try {
      validarArquivoImagem(arquivo, "audio");
      setErro("");
      atualizarSom(id, { arquivo, arquivoNome: arquivo.name });
    } catch (error) {
      setErro(error.message);
      if (input) input.value = "";
    }
  };
  const confirmarSoundpad = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const sons = await Promise.all(
        sonsSoundpad.map(async ({ arquivo, ...som }) => ({
          ...som,
          url: arquivo
            ? await enviarImagemCena(campanha.id, arquivo, "audio")
            : som.url,
          urlPersistida: arquivo ? undefined : som.urlPersistida,
        })),
      );
      await salvarSoundpadCampanha(campanha.id, sons);
      await recarregarCampanha();
    } catch (error) {
      setErro(error.message || "Nao foi possivel salvar o soundpad.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando)
    return (
      <section className="campanha-dashboard-estado">
        Carregando campanha...
      </section>
    );
  if (!campanha)
    return (
      <section className="campanhas-catalogo">
        <header className="campanha-dashboard-topo">
          <div>
            <span>Universos do mestre</span>
            <h2>Campanhas</h2>
            <p>{campanhas.length} campanhas criadas</p>
          </div>
          <button onClick={abrirCriacaoCampanha}>
            <Icon path={mdiPlus} size={0.78} />
            Nova campanha
          </button>
        </header>
        {erro && <p className="campanha-dashboard-erro">{erro}</p>}
        <div className="campanhas-grade">
          {campanhas.map((item) => (
            <article key={item.id}>
              <button
                className="campanha-cartao-abrir"
                onClick={() => abrirCampanha(item.codigo)}
              >
                <span>Campanha</span>
                <h3>{item.nome}</h3>
                <p>Código {item.codigo}</p>
              </button>
              <div>
                <a
                  href={`/?campanha=${encodeURIComponent(item.codigo)}&papel=mestre`}
                >
                  Abrir tabletop
                </a>
                <button
                  onClick={() => removerCampanha(item)}
                  title="Excluir campanha"
                >
                  <Icon path={mdiDeleteOutline} size={0.72} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {campanhas.length === 0 && (
          <div className="campanha-sem-cenas">
            <strong>Nenhuma campanha criada</strong>
            <button onClick={abrirCriacaoCampanha}>Criar campanha</button>
          </div>
        )}
        {criandoCampanha && (
          <div
            className="campanha-editor-fundo"
            onMouseDown={(e) =>
              e.target === e.currentTarget && setCriandoCampanha(false)
            }
          >
            <form
              className="campanha-editor campanha-editor-nova"
              onSubmit={confirmarNovaCampanha}
            >
              <header>
                <div>
                  <span>Novo universo</span>
                  <h3>Criar campanha</h3>
                </div>
                <button type="button" onClick={() => setCriandoCampanha(false)}>
                  Fechar
                </button>
              </header>
              <label>
                Nome da campanha
                <input
                  autoFocus
                  required
                  value={nomeNovaCampanha}
                  onChange={(e) => setNomeNovaCampanha(e.target.value)}
                  placeholder="Ex.: Prisao Blackgate"
                />
              </label>
              <section className="campanha-fichas-vinculo">
                <header>
                  <div>
                    <strong>Fichas da campanha</strong>
                    <span>{fichasNovaCampanha.length} selecionadas</span>
                  </div>
                </header>
                {carregandoFichas ? (
                  <p>Carregando fichas...</p>
                ) : fichasDisponiveis.length ? (
                  <div>
                    {fichasDisponiveis.map((ficha) => (
                      <label
                        key={ficha.fichaId}
                        className={
                          fichasNovaCampanha.includes(ficha.fichaId)
                            ? "selecionada"
                            : ""
                        }
                      >
                        <input
                          type="checkbox"
                          checked={fichasNovaCampanha.includes(ficha.fichaId)}
                          onChange={() =>
                            alternarFichaNovaCampanha(ficha.fichaId)
                          }
                        />
                        {ficha.personagem?.fotoPerfil ? (
                          <img src={ficha.personagem.fotoPerfil} alt="" />
                        ) : (
                          <span className="campanha-ficha-iniciais">
                            {ficha.personagem?.nome?.slice(0, 2) || "?"}
                          </span>
                        )}
                        <span>
                          <strong>
                            {ficha.personagem?.nome || ficha.fichaId}
                          </strong>
                          <small>
                            Nivel {ficha.personagem?.nivel || 1} ·{" "}
                            {ficha.personagem?.classe || "Sem classe"}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p>Nenhuma ficha cadastrada.</p>
                )}
              </section>
              {erro && <p className="campanha-dashboard-erro">{erro}</p>}
              <footer>
                <button type="button" onClick={() => setCriandoCampanha(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}>
                  {salvando ? "Criando..." : "Criar campanha"}
                </button>
              </footer>
            </form>
          </div>
        )}
      </section>
    );

  return (
    <section className="campanha-dashboard">
      <button
        className="campanha-voltar-lista"
        onClick={() => {
          setCampanha(null);
          setAbaCampanha("cenas");
          carregarCampanhas();
        }}
      >
        <Icon path={mdiArrowLeft} size={0.72} />
        Todas as campanhas
      </button>
      <header className="campanha-dashboard-topo">
        <div>
          <span>Campanha {campanha.codigo}</span>
          <h2>{campanha.nome}</h2>
          <p>
            {campanha.cenas.length} cenas · {campanha.membros?.length || 0}{" "}
            fichas
          </p>
        </div>
        <div>
          <a
            href={`/?campanha=${encodeURIComponent(campanha.codigo)}&papel=mestre`}
          >
            Abrir tabletop
          </a>
          <button onClick={abrirGerenciadorFichas}>
            <Icon path={mdiAccountMultipleOutline} size={0.78} />
            Fichas
          </button>
          {abaCampanha === "cenas" && (
            <button onClick={() => abrirEditor()}>
              <Icon path={mdiPlus} size={0.78} />
              Nova cena
            </button>
          )}
        </div>
      </header>
      {erro && <p className="campanha-dashboard-erro">{erro}</p>}
      <nav className="campanha-conteudo-abas">
        <button
          className={abaCampanha === "cenas" ? "ativo" : ""}
          onClick={() => setAbaCampanha("cenas")}
        >
          Cenas e mapas
        </button>
        <button
          className={abaCampanha === "musicas" ? "ativo" : ""}
          onClick={() => setAbaCampanha("musicas")}
        >
          Playlist
        </button>
        <button
          className={abaCampanha === "soundpad" ? "ativo" : ""}
          onClick={() => setAbaCampanha("soundpad")}
        >
          Soundpad
        </button>
        <button
          className={abaCampanha === "anotacoes" ? "ativo" : ""}
          onClick={() => setAbaCampanha("anotacoes")}
        >
          Anotacoes do mestre
        </button>
      </nav>
      {abaCampanha === "cenas" ? (
        <div className="campanha-pastas">
          {grupos.length ? (
            grupos.map(([pasta, cenas]) => (
              <section
                className={`campanha-pasta ${indicadorDrop?.tipo === "pasta" && indicadorDrop.id === pasta ? `drop-${indicadorDrop.posicao}` : ""}`}
                key={pasta}
                onDragOver={(event) => {
                  if (arrastando?.tipo === "pasta") {
                    event.preventDefault();
                    setIndicadorDrop({
                      tipo: "pasta",
                      id: pasta,
                      posicao: posicaoDrop(event),
                    });
                  }
                }}
                onDrop={() => soltarPasta(pasta)}
              >
                <button
                  className="campanha-pasta-titulo"
                  draggable
                  onDragStart={() =>
                    setArrastando({ tipo: "pasta", id: pasta })
                  }
                  onDragEnd={() => {
                    setArrastando(null);
                    setIndicadorDrop(null);
                  }}
                  onClick={() =>
                    setPastasFechadas((estado) => ({
                      ...estado,
                      [pasta]: !estado[pasta],
                    }))
                  }
                >
                  <Icon
                    path={
                      pastasFechadas[pasta] ? mdiChevronRight : mdiChevronDown
                    }
                    size={0.72}
                  />
                  <Icon path={mdiFolderOutline} size={0.78} />
                  <strong>{pasta}</strong>
                  <span>{cenas.length}</span>
                </button>
                {!pastasFechadas[pasta] && (
                  <div className="campanha-cenas">
                    {cenas.map((cena) => (
                      <article
                        key={cena.id}
                        className={`${arrastando?.tipo === "cena" && arrastando.id === cena.id ? "arrastando" : ""} ${indicadorDrop?.tipo === "cena" && indicadorDrop.id === cena.id ? `drop-${indicadorDrop.posicao}` : ""}`}
                        onDragOver={(event) => {
                          if (
                            arrastando?.tipo === "cena" &&
                            arrastando.pasta === (cena.pasta || "Sem pasta")
                          ) {
                            event.preventDefault();
                            setIndicadorDrop({
                              tipo: "cena",
                              id: cena.id,
                              posicao: posicaoDrop(event),
                            });
                          }
                        }}
                        onDrop={() => soltarCena(cena)}
                      >
                        <button
                          type="button"
                          className="campanha-arrastar"
                          draggable
                          onDragStart={() =>
                            setArrastando({
                              tipo: "cena",
                              id: cena.id,
                              pasta: cena.pasta || "Sem pasta",
                            })
                          }
                          onDragEnd={() => {
                            setArrastando(null);
                            setIndicadorDrop(null);
                          }}
                          title="Arrastar para ordenar"
                        >
                          <Icon path={mdiDrag} size={0.72} />
                        </button>
                        <div
                          className="campanha-cena-miniatura"
                          style={{
                            backgroundImage: `url(${cena.imagensCena?.[0]?.url || cena.mapasBatalha?.[0]?.url || urlCena(cena, "cena") || urlCena(cena, "mapa")})`,
                          }}
                        >
                          {cena.mapasBatalha?.length > 0 && (
                            <span>
                              <Icon path={mdiMapOutline} size={0.62} />
                              {cena.mapasBatalha.length} mapa(s)
                            </span>
                          )}
                        </div>
                        <div className="campanha-cena-info">
                          <strong>{cena.nome}</strong>
                          <p>{cena.descricao || "Sem descricao"}</p>
                          <small>
                            {cena.imagensCena?.length || 0} cenas estaticas ·{" "}
                            {cena.mapasBatalha?.length || 0} mapas ·{" "}
                            {cena.visualizarTodos === false
                              ? `${cena.jogadoresVisiveis?.length || 0} jogador(es)`
                              : "todos os jogadores"}
                          </small>
                        </div>
                        <div className="campanha-cena-acoes">
                          <button
                            onClick={() => abrirEditor(cena)}
                            title="Editar"
                          >
                            <Icon path={mdiPencilOutline} size={0.72} />
                          </button>
                          <button onClick={() => remover(cena)} title="Excluir">
                            <Icon path={mdiDeleteOutline} size={0.72} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))
          ) : (
            <div className="campanha-sem-cenas">
              <Icon path={mdiImagePlusOutline} size={1.3} />
              <strong>Nenhuma cena salva</strong>
              <button onClick={() => abrirEditor()}>Criar primeira cena</button>
            </div>
          )}
        </div>
      ) : abaCampanha === "musicas" ? (
        <form className="campanha-playlist-editor" onSubmit={confirmarMusicas}>
          <header>
            <div>
              <span>Trilha da campanha</span>
              <h3>Playlist</h3>
              <p>
                Adicione links individuais do YouTube e personalize como
                aparecem na mesa.
              </p>
            </div>
            <button type="button" onClick={adicionarMusica}>
              <Icon path={mdiPlaylistMusic} size={0.75} />
              Adicionar musica
            </button>
          </header>
          <div>
            {musicas.map((musica, indice) => (
              <article
                key={musica.id}
                className={`${arrastando?.tipo === "musica" && arrastando.id === musica.id ? "arrastando" : ""} ${indicadorDrop?.tipo === "musica" && indicadorDrop.id === musica.id ? `drop-${indicadorDrop.posicao}` : ""}`}
                onDragOver={(event) => {
                  if (arrastando?.tipo === "musica") {
                    event.preventDefault();
                    setIndicadorDrop({
                      tipo: "musica",
                      id: musica.id,
                      posicao: posicaoDrop(event),
                    });
                  }
                }}
                onDrop={() => soltarMusica(musica.id)}
              >
                <button
                  type="button"
                  className="campanha-arrastar"
                  draggable
                  onDragStart={() =>
                    setArrastando({ tipo: "musica", id: musica.id })
                  }
                  onDragEnd={() => {
                    setArrastando(null);
                    setIndicadorDrop(null);
                  }}
                  title="Arrastar para ordenar"
                >
                  <Icon path={mdiDrag} size={0.72} />
                </button>
                <div className="campanha-musica-capa">
                  {musica.capa ? (
                    <img src={musica.capa} alt="" />
                  ) : (
                    <Icon path={mdiPlaylistMusic} size={1.1} />
                  )}
                </div>
                <div className="campanha-musica-campos">
                  <label>
                    Nome
                    <input
                      required
                      value={musica.nome}
                      onChange={(event) =>
                        atualizarMusica(musica.id, { nome: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    URL da musica
                    <input
                      required
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={musica.url}
                      onChange={(event) =>
                        atualizarMusica(musica.id, { url: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    URL da capa
                    <input
                      type="url"
                      placeholder="Opcional: usa a miniatura do YouTube"
                      value={musica.capa}
                      onChange={(event) =>
                        atualizarMusica(musica.id, { capa: event.target.value })
                      }
                    />
                  </label>
                </div>
                <span>{String(indice + 1).padStart(2, "0")}</span>
                <button
                  type="button"
                  onClick={() => removerMusica(musica.id)}
                  title="Remover musica"
                >
                  <Icon path={mdiDeleteOutline} size={0.72} />
                </button>
              </article>
            ))}
            {!musicas.length && (
              <div className="campanha-playlist-vazia">
                <Icon path={mdiPlaylistMusic} size={1.3} />
                <strong>Nenhuma musica adicionada</strong>
                <button type="button" onClick={adicionarMusica}>
                  Adicionar primeira musica
                </button>
              </div>
            )}
          </div>
          <footer>
            <span>{musicas.length} musica(s)</span>
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar playlist"}
            </button>
          </footer>
        </form>
      ) : abaCampanha === "soundpad" ? (
        <form className="campanha-soundpad-editor" onSubmit={confirmarSoundpad}>
          <header>
            <div>
              <span>Mixer da campanha</span>
              <h3>Soundpad</h3>
              <p>Efeitos curtos e ambientes para disparar durante a sessao.</p>
            </div>
            <button type="button" onClick={adicionarSom}>
              <Icon path={mdiPlus} size={0.72} />
              Adicionar som
            </button>
          </header>
          <div className="campanha-soundpad-grade">
            {sonsSoundpad.map((som) => (
              <article key={som.id}>
                <header>
                  <span>{som.categoria || "Efeito"}</span>
                  <button
                    type="button"
                    onClick={() => removerSom(som.id)}
                    title="Remover som"
                  >
                    <Icon path={mdiDeleteOutline} size={0.65} />
                  </button>
                </header>
                <label>
                  Nome
                  <input
                    required
                    value={som.nome}
                    onChange={(e) =>
                      atualizarSom(som.id, { nome: e.target.value })
                    }
                  />
                </label>
                <label>
                  Categoria
                  <input
                    value={som.categoria || ""}
                    onChange={(e) =>
                      atualizarSom(som.id, { categoria: e.target.value })
                    }
                    placeholder="Ambiente, combate..."
                  />
                </label>
                <label>
                  Arquivo de audio
                  <input
                    type="file"
                    accept={ACEITAR_AUDIO}
                    onChange={(e) =>
                      selecionarAudioSom(som.id, e.target.files[0], e.target)
                    }
                  />
                  <small>{som.arquivoNome || "Max. 20 MB"}</small>
                </label>
                <label>
                  ou URL direta
                  <input
                    type="url"
                    value={som.url || ""}
                    onChange={(e) =>
                      atualizarSom(som.id, {
                        url: e.target.value,
                        arquivo: null,
                      })
                    }
                    placeholder="https://.../efeito.mp3"
                  />
                </label>
                <div className="soundpad-config-linha">
                  <label>
                    Volume <b>{som.volume ?? 70}%</b>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={som.volume ?? 70}
                      onChange={(e) =>
                        atualizarSom(som.id, { volume: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Fade in (s)
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step=".1"
                      value={som.fadeIn ?? 0.4}
                      onChange={(e) =>
                        atualizarSom(som.id, { fadeIn: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Fade out (s)
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step=".1"
                      value={som.fadeOut ?? 0.7}
                      onChange={(e) =>
                        atualizarSom(som.id, {
                          fadeOut: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="soundpad-opcoes">
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(som.loop)}
                      onChange={(e) =>
                        atualizarSom(som.id, { loop: e.target.checked })
                      }
                    />
                    Loop contínuo
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={som.sobrepor !== false}
                      onChange={(e) =>
                        atualizarSom(som.id, { sobrepor: e.target.checked })
                      }
                    />
                    Permitir sobreposição
                  </label>
                </div>
              </article>
            ))}
            {!sonsSoundpad.length && (
              <div className="campanha-playlist-vazia">
                <Icon path={mdiPlaylistMusic} size={1.3} />
                <strong>Nenhum efeito cadastrado</strong>
                <button type="button" onClick={adicionarSom}>
                  Adicionar primeiro som
                </button>
              </div>
            )}
          </div>
          <footer>
            <span>{sonsSoundpad.length} som(ns)</span>
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar soundpad"}
            </button>
          </footer>
        </form>
      ) : (
        <AnotacoesCampanha campanhaId={campanha.id} />
      )}

      {gerenciandoFichas && (
        <div
          className="campanha-editor-fundo"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setGerenciandoFichas(false)
          }
        >
          <form
            className="campanha-editor campanha-editor-nova"
            onSubmit={salvarFichasDaCampanha}
          >
            <header>
              <div>
                <span>{campanha.nome}</span>
                <h3>Fichas da campanha</h3>
              </div>
              <button type="button" onClick={() => setGerenciandoFichas(false)}>
                Fechar
              </button>
            </header>
            <section className="campanha-fichas-vinculo">
              <header>
                <div>
                  <strong>Jogadores com acesso</strong>
                  <span>{fichasVinculadas.length} selecionadas</span>
                </div>
              </header>
              {carregandoFichas ? (
                <p>Carregando fichas...</p>
              ) : fichasDisponiveis.length ? (
                <div>
                  {fichasDisponiveis.map((ficha) => (
                    <label
                      key={ficha.fichaId}
                      className={
                        fichasVinculadas.includes(ficha.fichaId)
                          ? "selecionada"
                          : ""
                      }
                    >
                      <input
                        type="checkbox"
                        checked={fichasVinculadas.includes(ficha.fichaId)}
                        onChange={() => alternarFichaVinculada(ficha.fichaId)}
                      />
                      {ficha.personagem?.fotoPerfil ? (
                        <img src={ficha.personagem.fotoPerfil} alt="" />
                      ) : (
                        <span className="campanha-ficha-iniciais">
                          {ficha.personagem?.nome?.slice(0, 2) || "?"}
                        </span>
                      )}
                      <span>
                        <strong>
                          {ficha.personagem?.nome || ficha.fichaId}
                        </strong>
                        <small>
                          Nivel {ficha.personagem?.nivel || 1} ·{" "}
                          {ficha.personagem?.classe || "Sem classe"}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p>Nenhuma ficha cadastrada.</p>
              )}
            </section>
            {erro && <p className="campanha-dashboard-erro">{erro}</p>}
            <footer>
              <button type="button" onClick={() => setGerenciandoFichas(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando || carregandoFichas}>
                {salvando ? "Salvando..." : "Salvar fichas"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {editorAberto && (
        <div
          className="campanha-editor-fundo"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setEditorAberto(false)
          }
        >
          <form className="campanha-editor" onSubmit={confirmar}>
            <header>
              <div>
                <span>Campanha</span>
                <h3>{editando.id ? "Editar cena" : "Nova cena"}</h3>
              </div>
              <button type="button" onClick={() => setEditorAberto(false)}>
                Fechar
              </button>
            </header>
            <div className="campanha-editor-linha">
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
                Pasta
                <input
                  required
                  list="pastas-campanha"
                  value={editando.pasta || ""}
                  onChange={(e) =>
                    setEditando({ ...editando, pasta: e.target.value })
                  }
                  placeholder="Ex.: Prisao Blackgate"
                />
                <datalist id="pastas-campanha">
                  {pastas.map((pasta) => (
                    <option key={pasta} value={pasta} />
                  ))}
                </datalist>
              </label>
            </div>
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
            <section className="campanha-cena-visibilidade">
              <div>
                <strong>Visibilidade da cena</strong>
                <small>
                  {editando.visualizarTodos !== false
                    ? "Todos os jogadores verão esta cena quando ela estiver ativa."
                    : "Apenas as fichas selecionadas verão a cena."}
                </small>
              </div>
              <button
                type="button"
                className={editando.visualizarTodos !== false ? "ativo" : ""}
                onClick={() => setEditando((atual) => ({
                  ...atual,
                  visualizarTodos: atual.visualizarTodos === false,
                }))}
              >
                {editando.visualizarTodos !== false ? "Todos" : "Específicos"}
              </button>
              {editando.visualizarTodos === false && (
                <div className="campanha-cena-jogadores">
                  {(campanha.membros || []).map((membro) => {
                    const fichaId = String(membro.ficha_id || "");
                    const selecionado = (editando.jogadoresVisiveis || [])
                      .map(String)
                      .includes(fichaId);
                    return (
                      <label key={membro.id || fichaId} className={selecionado ? "selecionado" : ""}>
                        <input type="checkbox" checked={selecionado} onChange={() => alternarJogadorCena(fichaId)} />
                        <span>{membro.nome || fichaId}</span>
                      </label>
                    );
                  })}
                  {!campanha.membros?.length && <small>Vincule fichas à campanha antes de restringir a cena.</small>}
                </div>
              )}
            </section>
            <section className="campanha-midias-editor">
              <header>
                <div>
                  <strong>Cenas estaticas</strong>
                  <span>
                    {editando.imagensCena?.length || 0} arquivos · max. 2 MB
                  </span>
                </div>
                <button type="button" onClick={() => adicionarMidia("cena")}>
                  <Icon path={mdiPlus} size={0.68} />
                  Adicionar
                </button>
              </header>
              {editando.imagensCena?.map((item) => (
                <div className="campanha-midia-linha" key={item.id}>
                  <input
                    aria-label="Nome da cena estatica"
                    value={item.nome}
                    onChange={(e) =>
                      atualizarMidia("imagensCena", item.id, {
                        nome: e.target.value,
                      })
                    }
                  />
                  <label>
                    <input
                      type="file"
                      accept="image/webp,image/jpeg,image/png,image/avif"
                      onChange={(e) =>
                        selecionarArquivoMidia(
                          "imagensCena",
                          item.id,
                          "cena",
                          e.target.files[0],
                          e.target,
                        )
                      }
                    />
                    <span>
                      {item.arquivo?.name || item.url || "Escolher imagem"}
                    </span>
                  </label>
                  <input
                    aria-label="URL da cena estatica"
                    placeholder="ou URL da imagem"
                    value={item.url || ""}
                    onChange={(e) =>
                      atualizarMidia("imagensCena", item.id, {
                        url: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removerMidia("imagensCena", item.id)}
                    title="Remover"
                  >
                    <Icon path={mdiDeleteOutline} size={0.68} />
                  </button>
                </div>
              ))}
            </section>
            <section className="campanha-midias-editor">
              <header>
                <div>
                  <strong>Mapas de batalha</strong>
                  <span>
                    {editando.mapasBatalha?.length || 0} arquivos · max. 5 MB
                  </span>
                </div>
                <button type="button" onClick={() => adicionarMidia("mapa")}>
                  <Icon path={mdiPlus} size={0.68} />
                  Adicionar
                </button>
              </header>
              {editando.mapasBatalha?.map((item) => (
                <div className="campanha-midia-linha mapa" key={item.id}>
                  <input
                    aria-label="Nome do mapa"
                    value={item.nome}
                    onChange={(e) =>
                      atualizarMidia("mapasBatalha", item.id, {
                        nome: e.target.value,
                      })
                    }
                  />
                  <label>
                    <input
                      type="file"
                      accept="image/webp,image/jpeg,image/png,image/avif"
                      onChange={(e) =>
                        selecionarArquivoMidia(
                          "mapasBatalha",
                          item.id,
                          "mapa",
                          e.target.files[0],
                          e.target,
                        )
                      }
                    />
                    <span>
                      {item.arquivo?.name || item.url || "Escolher mapa"}
                    </span>
                  </label>
                  <input
                    aria-label="URL do mapa"
                    placeholder="ou URL do mapa"
                    value={item.url || ""}
                    onChange={(e) =>
                      atualizarMidia("mapasBatalha", item.id, {
                        url: e.target.value,
                      })
                    }
                  />
                  <input
                    aria-label="Colunas"
                    type="number"
                    min="1"
                    max="100"
                    value={item.larguraGrade || 12}
                    onChange={(e) =>
                      atualizarMidia("mapasBatalha", item.id, {
                        larguraGrade: Number(e.target.value),
                      })
                    }
                  />
                  <input
                    aria-label="Linhas"
                    type="number"
                    min="1"
                    max="100"
                    value={item.alturaGrade || 8}
                    onChange={(e) =>
                      atualizarMidia("mapasBatalha", item.id, {
                        alturaGrade: Number(e.target.value),
                      })
                    }
                  />
                  <label className="campanha-grade-toggle">
                    <input
                      type="checkbox"
                      checked={item.exibirGrade !== false}
                      onChange={(e) =>
                        atualizarMidia("mapasBatalha", item.id, {
                          exibirGrade: e.target.checked,
                        })
                      }
                    />
                    <span>Grade</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removerMidia("mapasBatalha", item.id)}
                    title="Remover"
                  >
                    <Icon path={mdiDeleteOutline} size={0.68} />
                  </button>
                </div>
              ))}
            </section>
            {erro && <p className="campanha-dashboard-erro">{erro}</p>}
            <footer>
              <button type="button" onClick={() => setEditorAberto(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar cena"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {editorAberto && (
        <aside
          className="campanha-previas-editor"
          aria-label="Previa das cenas e mapas"
        >
          <header>
            <span>Previa da cena</span>
            <strong>{editando.nome || "Nova cena"}</strong>
          </header>
          <div>
            {[
              ...(editando.imagensCena || []).map((item) => ({
                ...item,
                tipo: "Cena estatica",
                chave: "imagensCena",
              })),
              ...(editando.mapasBatalha || []).map((item) => ({
                ...item,
                tipo: "Mapa de batalha",
                chave: "mapasBatalha",
              })),
            ].map((item) => (
              <article key={item.id}>
                <div className="campanha-previa-imagem">
                  {item.previewUrl || item.url ? (
                    <img src={item.previewUrl || item.url} alt="" />
                  ) : (
                    <Icon
                      path={
                        item.chave === "mapasBatalha"
                          ? mdiMapOutline
                          : mdiImagePlusOutline
                      }
                      size={1.2}
                    />
                  )}
                </div>
                <label>
                  <span>{item.tipo}</span>
                  <input
                    required
                    value={item.nome || ""}
                    onChange={(event) =>
                      atualizarMidia(item.chave, item.id, {
                        nome: event.target.value,
                      })
                    }
                    placeholder={
                      item.chave === "mapasBatalha"
                        ? "Nome do mapa"
                        : "Nome da cena"
                    }
                  />
                </label>
                {item.chave === "mapasBatalha" && (
                  <small>
                    {item.larguraGrade || 12} × {item.alturaGrade || 8}{" "}
                    quadrados
                  </small>
                )}
              </article>
            ))}
          </div>
          {!(editando.imagensCena?.length || editando.mapasBatalha?.length) && (
            <p>Adicione uma cena estatica ou mapa para visualizar.</p>
          )}
        </aside>
      )}
    </section>
  );
};
export default CampanhaDashboard;
