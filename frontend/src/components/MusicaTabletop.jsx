import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiMusicNote,
  mdiPause,
  mdiPlay,
  mdiPlaylistMusic,
  mdiRepeatOnce,
  mdiSkipNext,
  mdiSkipPrevious,
  mdiVolumeHigh,
} from "@mdi/js";
import "../CSS/MusicaTabletop.css";
import "../CSS/MusicaTabletopCompacto.css";

const extrairPlaylistId = (valor) => {
  try {
    return new URL(valor).searchParams.get("list") || "";
  } catch {
    return (
      String(valor || "")
        .trim()
        .match(/[?&]list=([^&]+)/)?.[1] || ""
    );
  }
};
const extrairVideoId = (valor) => {
  try {
    const url = new URL(valor);
    if (url.hostname.includes("youtu.be"))
      return url.pathname.slice(1).split("/")[0];
    if (
      url.pathname.startsWith("/shorts/") ||
      url.pathname.startsWith("/embed/")
    )
      return url.pathname.split("/")[2];
    return url.searchParams.get("v") || "";
  } catch {
    return (
      String(valor || "").match(
        /(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/,
      )?.[1] || ""
    );
  }
};

const carregarApiYoutube = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (window.__darknessYoutubePromise) return window.__darknessYoutubePromise;
  window.__darknessYoutubePromise = new Promise((resolve, reject) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      anterior?.();
      resolve(window.YT);
    };
    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () =>
        reject(new Error("Nao foi possivel carregar a API do YouTube."));
      document.head.appendChild(script);
    }
  });
  return window.__darknessYoutubePromise;
};

const buscarTitulos = async (playlistId, ids) => {
  const chave = process.env.REACT_APP_YOUTUBE_API_KEY?.trim();
  if (!chave)
    return ids.map((videoId, indice) => ({
      videoId,
      titulo: `Faixa ${indice + 1}`,
      miniatura: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    }));
  const resposta = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(chave)}`,
  );
  if (!resposta.ok)
    throw new Error("Nao foi possivel buscar os titulos da playlist.");
  const dados = await resposta.json();
  return (dados.items || []).map((item, indice) => ({
    videoId: item.snippet?.resourceId?.videoId,
    titulo: item.snippet?.title || `Faixa ${indice + 1}`,
    miniatura:
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url,
  }));
};

const buscarPlaylistDataApi = async (playlistId) => {
  const chave = process.env.REACT_APP_YOUTUBE_API_KEY?.trim();
  if (!chave) return null;
  const faixas = [];
  let pagina = "";
  do {
    const parametros = new URLSearchParams({
      part: "snippet",
      maxResults: "50",
      playlistId,
      key: chave,
      ...(pagina ? { pageToken: pagina } : {}),
    });
    const resposta = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${parametros}`,
    );
    const dados = await resposta.json();
    if (!resposta.ok)
      throw new Error(
        dados.error?.message || "A YouTube Data API recusou a playlist.",
      );
    (dados.items || []).forEach((item) => {
      const videoId = item.snippet?.resourceId?.videoId;
      const titulo = item.snippet?.title;
      if (!videoId || ["Private video", "Deleted video"].includes(titulo))
        return;
      faixas.push({
        videoId,
        titulo: titulo || `Faixa ${faixas.length + 1}`,
        miniatura:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      });
    });
    pagina = dados.nextPageToken || "";
  } while (pagina);
  return faixas;
};

const MusicaTabletop = ({
  campanhaId,
  musicasCampanha = null,
  estadoRemoto = null,
  aoAlterarEstado = null,
  controlavel = true,
}) => {
  const musicasChave = Array.isArray(musicasCampanha)
    ? musicasCampanha
        .map(
          (musica) =>
            `${musica.id}:${musica.url}:${musica.nome}:${musica.capa}`,
        )
        .join("|")
    : "playlist-legada";
  const [link, setLink] = useState(
    () => localStorage.getItem(`darkness_playlist_${campanhaId}`) || "",
  );
  const [playlistId, setPlaylistId] = useState(() =>
    extrairPlaylistId(
      localStorage.getItem(`darkness_playlist_${campanhaId}`) || "",
    ),
  );
  const [faixas, setFaixas] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [volume, setVolume] = useState(() => {
    const salvo = Number(
      localStorage.getItem(`darkness_volume_mesa_${campanhaId}`),
    );
    return Number.isFinite(salvo) && salvo >= 0 && salvo <= 100 ? salvo : 45;
  });
  const [repetindo, setRepetindo] = useState(false);
  const [playerPronto, setPlayerPronto] = useState(false);
  const [erro, setErro] = useState("");
  const elementoRef = useRef(null);
  const playerRef = useRef(null);
  const estadoRef = useRef({
    indice: 0,
    tocando: false,
    volume: 45,
    repetindo: false,
  });
  const repetindoRef = useRef(false);
  const indiceRepeticaoRef = useRef(0);
  useEffect(() => {
    repetindoRef.current = repetindo;
    estadoRef.current = { indice: indiceAtual, tocando, volume, repetindo };
  }, [indiceAtual, tocando, volume, repetindo]);
  const publicarEstado = (mudancas = {}) => {
    if (!controlavel || !aoAlterarEstado) return;
    const atual = estadoRef.current;
    aoAlterarEstado({
      indice: Math.max(
        0,
        playerRef.current?.getPlaylistIndex?.() ?? atual.indice,
      ),
      tempo: Number(playerRef.current?.getCurrentTime?.() || 0),
      tocando: atual.tocando,
      volume: atual.volume,
      repetindo: repetindoRef.current,
      ...mudancas,
    });
  };
  useEffect(() => {
    if (controlavel || !playerPronto || !estadoRemoto || !playerRef.current)
      return;
    const player = playerRef.current;
    const indice = Math.max(0, Number(estadoRemoto.indice) || 0);
    indiceRepeticaoRef.current = indice;
    const decorrido =
      estadoRemoto.tocando && estadoRemoto.atualizadoEm
        ? Math.max(
            0,
            (Date.now() - new Date(estadoRemoto.atualizadoEm).getTime()) / 1000,
          )
        : 0;
    if (player.getPlaylistIndex?.() !== indice) player.playVideoAt?.(indice);
    player.seekTo?.((Number(estadoRemoto.tempo) || 0) + decorrido, true);
    player.setVolume?.(estadoRef.current.volume);
    repetindoRef.current = Boolean(estadoRemoto.repetindo);
    setRepetindo(repetindoRef.current);
    if (estadoRemoto.tocando) player.playVideo?.();
    else player.pauseVideo?.();
  }, [controlavel, estadoRemoto, playerPronto]);

  useEffect(() => {
    const modoCampanha = Array.isArray(musicasCampanha);
    if ((!playlistId && !modoCampanha) || !elementoRef.current)
      return undefined;
    const hospedeiro = elementoRef.current;
    let cancelado = false;
    let listaCarregada = false;
    let indiceTentativa = 0;
    let temporizadorTentativa;
    hospedeiro.replaceChildren();
    const alvo = document.createElement("div");
    hospedeiro.appendChild(alvo);
    Promise.all([
      carregarApiYoutube(),
      (modoCampanha
        ? Promise.resolve(
            musicasCampanha
              .map((musica, indice) => {
                const videoId = extrairVideoId(musica.url);
                return videoId
                  ? {
                      videoId,
                      titulo: musica.nome || `Musica ${indice + 1}`,
                      miniatura:
                        musica.capa ||
                        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                    }
                  : null;
              })
              .filter(Boolean),
          )
        : buscarPlaylistDataApi(playlistId)
      ).catch((error) => {
        setErro(
          `Data API: ${error.message} Tentando o carregamento direto do YouTube.`,
        );
        return null;
      }),
    ])
      .then(([YT, faixasApi]) => {
        if (cancelado) return;
        const idsApi = (faixasApi || []).map((faixa) => faixa.videoId);
        if (idsApi.length) {
          listaCarregada = true;
          setFaixas(faixasApi);
          setErro("");
        } else if (modoCampanha && musicasCampanha.length) {
          setErro(
            "Nenhuma URL de video valida foi encontrada na playlist da campanha.",
          );
        }
        const sincronizarFaixas = async (player) => {
          if (cancelado || listaCarregada) return;
          const ids = player.getPlaylist?.() || [];
          if (!ids.length) return;
          listaCarregada = true;
          try {
            setFaixas(await buscarTitulos(playlistId, ids));
          } catch {
            setFaixas(
              ids.map((videoId, indice) => ({
                videoId,
                titulo: `Faixa ${indice + 1}`,
                miniatura: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
              })),
            );
          }
        };
        const tentarCarregarLista = (player) => {
          if (cancelado || listaCarregada) return;
          sincronizarFaixas(player);
          if (player.getPlaylist?.()?.length) return;
          if (indiceTentativa >= 10) {
            setErro(
              "O YouTube bloqueou a incorporacao das primeiras musicas desta playlist. Verifique se os videos permitem reproducao em outros sites.",
            );
            return;
          }
          indiceTentativa += 1;
          player.cuePlaylist({
            listType: "playlist",
            list: playlistId,
            index: indiceTentativa,
          });
          clearTimeout(temporizadorTentativa);
          temporizadorTentativa = setTimeout(
            () => tentarCarregarLista(player),
            1200,
          );
        };
        playerRef.current = new YT.Player(alvo, {
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
            widget_referrer: window.location.href,
          },
          events: {
            onReady: (event) => {
              setPlayerPronto(true);
              event.target
                .getIframe?.()
                .setAttribute(
                  "referrerpolicy",
                  "strict-origin-when-cross-origin",
                );
              event.target.setVolume(volume);
              if (idsApi.length) event.target.cuePlaylist(idsApi, 0, 0);
              else {
                event.target.cuePlaylist({
                  listType: "playlist",
                  list: playlistId,
                  index: 0,
                });
                temporizadorTentativa = setTimeout(
                  () => tentarCarregarLista(event.target),
                  1000,
                );
              }
            },
            onStateChange: (event) => {
              const indice = Math.max(
                0,
                event.target.getPlaylistIndex?.() || 0,
              );
              if (
                event.data === YT.PlayerState.PLAYING &&
                repetindoRef.current &&
                indice !== indiceRepeticaoRef.current
              ) {
                event.target.playVideoAt(indiceRepeticaoRef.current);
                return;
              }
              const reiniciando =
                event.data === YT.PlayerState.ENDED && repetindoRef.current;
              setTocando(event.data === YT.PlayerState.PLAYING || reiniciando);
              const indiceEfetivo = reiniciando
                ? indiceRepeticaoRef.current
                : indice;
              setIndiceAtual(indiceEfetivo);
              if (reiniciando) {
                if (indice === indiceRepeticaoRef.current) {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                } else event.target.playVideoAt(indiceRepeticaoRef.current);
              } else if (!repetindoRef.current) {
                indiceRepeticaoRef.current = indice;
              }
              if (
                controlavel &&
                [
                  YT.PlayerState.PLAYING,
                  YT.PlayerState.PAUSED,
                  YT.PlayerState.ENDED,
                ].includes(event.data)
              )
                publicarEstado({
                  indice: indiceEfetivo,
                  tocando: event.data === YT.PlayerState.PLAYING || reiniciando,
                  tempo:
                    event.data === YT.PlayerState.ENDED
                      ? 0
                      : Number(event.target.getCurrentTime?.() || 0),
                });
              sincronizarFaixas(event.target);
            },
            onError: (event) => {
              if (
                !listaCarregada &&
                [100, 101, 150, 153].includes(event.data)
              ) {
                clearTimeout(temporizadorTentativa);
                temporizadorTentativa = setTimeout(
                  () => tentarCarregarLista(event.target),
                  150,
                );
                return;
              }
              setErro(
                event.data === 153
                  ? "O navegador ocultou a identificacao exigida pelo YouTube. Libere o YouTube no bloqueador de conteudo e recarregue a pagina."
                  : "Esta musica nao permite reproducao incorporada. Pulando para a proxima faixa.",
              );
              event.target.nextVideo?.();
            },
          },
        });
      })
      .catch((error) => setErro(error.message));
    return () => {
      cancelado = true;
      clearTimeout(temporizadorTentativa);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      hospedeiro.replaceChildren();
    };
  }, [playlistId, musicasChave]); // Recria o player somente quando a fila de musicas muda.

  const carregarPlaylist = (event) => {
    event.preventDefault();
    const id = extrairPlaylistId(link);
    if (!id) {
      setErro("Cole um link valido de uma playlist publica do YouTube.");
      return;
    }
    setErro("");
    setFaixas([]);
    setIndiceAtual(0);
    localStorage.setItem(`darkness_playlist_${campanhaId}`, link);
    setPlaylistId(id);
  };
  const tocarFaixa = (indice) => {
    if (!controlavel) return;
    indiceRepeticaoRef.current = indice;
    playerRef.current?.playVideoAt?.(indice);
    setIndiceAtual(indice);
    publicarEstado({ indice, tempo: 0, tocando: true });
  };
  const alternarReproducao = () => {
    const vaiTocar = !tocando;
    if (vaiTocar) playerRef.current?.playVideo?.();
    else playerRef.current?.pauseVideo?.();
    publicarEstado({ tocando: vaiTocar });
  };

  return (
    <section
      className={`musica-tabletop ${controlavel ? "" : "musica-ouvinte"}`}
    >
      {!Array.isArray(musicasCampanha) && (
        <form className="musica-vinculo" onSubmit={carregarPlaylist}>
          <label>
            <Icon path={mdiPlaylistMusic} size={0.72} />
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Cole o link da playlist do YouTube"
            />
          </label>
          <button type="submit">Carregar</button>
        </form>
      )}
      {erro && <p className="musica-erro">{erro}</p>}
      <div className="musica-conteudo">
        <section className="musica-lista">
          <header>
            <span>Musicas da playlist</span>
            <b>{faixas.length || "..."}</b>
          </header>
          <div>
            {faixas.length ? (
              faixas.map((faixa, indice) => (
                <button
                  key={`${faixa.videoId}-${indice}`}
                  className={indice === indiceAtual ? "ativo" : ""}
                  onClick={() => tocarFaixa(indice)}
                >
                  <img src={faixa.miniatura} alt="" />
                  <span>
                    <small>{String(indice + 1).padStart(2, "0")}</small>
                    <strong>{faixa.titulo}</strong>
                  </span>
                  {indice === indiceAtual && (
                    <Icon
                      path={tocando ? mdiVolumeHigh : mdiMusicNote}
                      size={0.62}
                    />
                  )}
                </button>
              ))
            ) : (
              <p>
                {Array.isArray(musicasCampanha)
                  ? "Adicione musicas no dashboard da campanha."
                  : playlistId
                    ? "Carregando musicas..."
                    : "Adicione uma playlist para comecar."}
              </p>
            )}
          </div>
        </section>
        <section className="musica-player">
          {!controlavel && (
            <img
              className="musica-capa-ouvinte"
              src={faixas[indiceAtual]?.miniatura}
              alt=""
            />
          )}
          <header>
            <div>
              <span>
                {controlavel ? "Tocando agora" : "Trilha da campanha"}
              </span>
              <strong>
                {faixas[indiceAtual]?.titulo || "Nenhuma musica selecionada"}
              </strong>
            </div>
            <div>
              <button
                disabled={!controlavel}
                onClick={() => {
                  indiceRepeticaoRef.current = Math.max(0, indiceAtual - 1);
                  playerRef.current?.previousVideo?.();
                  publicarEstado({
                    indice: Math.max(0, indiceAtual - 1),
                    tempo: 0,
                    tocando: true,
                  });
                }}
                title="Anterior"
              >
                <Icon path={mdiSkipPrevious} size={0.75} />
              </button>
              <button
                className="principal"
                onClick={
                  controlavel
                    ? alternarReproducao
                    : () =>
                        estadoRemoto?.tocando
                          ? playerRef.current?.playVideo?.()
                          : playerRef.current?.pauseVideo?.()
                }
                title={
                  controlavel
                    ? tocando
                      ? "Pausar"
                      : "Tocar"
                    : "Ativar audio sincronizado"
                }
              >
                <Icon path={tocando ? mdiPause : mdiPlay} size={0.78} />
              </button>
              <button
                disabled={!controlavel}
                onClick={() => {
                  indiceRepeticaoRef.current = Math.min(
                    faixas.length - 1,
                    indiceAtual + 1,
                  );
                  playerRef.current?.nextVideo?.();
                  publicarEstado({
                    indice: Math.min(faixas.length - 1, indiceAtual + 1),
                    tempo: 0,
                    tocando: true,
                  });
                }}
                title="Proxima"
              >
                <Icon path={mdiSkipNext} size={0.75} />
              </button>
              <button
                disabled={!controlavel}
                className={repetindo ? "ativo" : ""}
                onClick={() => {
                  const valor = !repetindo;
                  if (valor)
                    indiceRepeticaoRef.current = Math.max(
                      0,
                      playerRef.current?.getPlaylistIndex?.() ?? indiceAtual,
                    );
                  repetindoRef.current = valor;
                  setRepetindo(valor);
                  publicarEstado({ repetindo: valor });
                }}
                title={repetindo ? "Desativar repeticao" : "Repetir musica"}
              >
                <Icon path={mdiRepeatOnce} size={0.72} />
              </button>
            </div>
          </header>
          <div className="musica-youtube-player" ref={elementoRef} />
          <label className="musica-volume">
            <Icon path={mdiVolumeHigh} size={0.65} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              disabled={!controlavel}
              onChange={(event) => {
                const valor = Number(event.target.value);
                setVolume(valor);
                playerRef.current?.setVolume?.(valor);
                publicarEstado({ volume: valor });
              }}
            />
            <span>{volume}%</span>
          </label>
        </section>
        {!controlavel && (
          <label className="musica-volume-local" title="Meu volume">
            <Icon path={mdiVolumeHigh} size={0.55} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => {
                const valor = Number(event.target.value);
                setVolume(valor);
                playerRef.current?.setVolume?.(valor);
                localStorage.setItem(
                  `darkness_volume_mesa_${campanhaId}`,
                  String(valor),
                );
              }}
            />
          </label>
        )}
      </div>
    </section>
  );
};

export default MusicaTabletop;
