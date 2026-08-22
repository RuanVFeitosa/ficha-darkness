import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiMusicNote, mdiPause, mdiPlay, mdiPlaylistMusic, mdiSkipNext, mdiSkipPrevious, mdiVolumeHigh } from "@mdi/js";
import "../CSS/MusicaTabletop.css";

const extrairPlaylistId = (valor) => {
  try { return new URL(valor).searchParams.get("list") || ""; }
  catch { return String(valor || "").trim().match(/[?&]list=([^&]+)/)?.[1] || ""; }
};

const carregarApiYoutube = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (window.__darknessYoutubePromise) return window.__darknessYoutubePromise;
  window.__darknessYoutubePromise = new Promise((resolve, reject) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { anterior?.(); resolve(window.YT); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api"; script.onerror = () => reject(new Error("Nao foi possivel carregar a API do YouTube.")); document.head.appendChild(script);
    }
  });
  return window.__darknessYoutubePromise;
};

const buscarTitulos = async (playlistId, ids) => {
  const chave = process.env.REACT_APP_YOUTUBE_API_KEY?.trim();
  if (!chave) return ids.map((videoId, indice) => ({ videoId, titulo: `Faixa ${indice + 1}`, miniatura: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` }));
  const resposta = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(chave)}`);
  if (!resposta.ok) throw new Error("Nao foi possivel buscar os titulos da playlist.");
  const dados = await resposta.json();
  return (dados.items || []).map((item, indice) => ({ videoId: item.snippet?.resourceId?.videoId, titulo: item.snippet?.title || `Faixa ${indice + 1}`, miniatura: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url }));
};

const MusicaTabletop = ({ campanhaId }) => {
  const [link, setLink] = useState(() => localStorage.getItem(`darkness_playlist_${campanhaId}`) || "");
  const [playlistId, setPlaylistId] = useState(() => extrairPlaylistId(localStorage.getItem(`darkness_playlist_${campanhaId}`) || ""));
  const [faixas, setFaixas] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [volume, setVolume] = useState(45);
  const [erro, setErro] = useState("");
  const elementoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!playlistId || !elementoRef.current) return undefined;
    const hospedeiro = elementoRef.current;
    let cancelado = false;
    let listaCarregada = false;
    let indiceTentativa = 0;
    let temporizadorTentativa;
    hospedeiro.replaceChildren();
    const alvo = document.createElement("div");
    hospedeiro.appendChild(alvo);
    carregarApiYoutube().then((YT) => {
      if (cancelado) return;
      const sincronizarFaixas = async (player) => {
        if (cancelado || listaCarregada) return;
        const ids = player.getPlaylist?.() || [];
        if (!ids.length) return;
        listaCarregada = true;
        try { setFaixas(await buscarTitulos(playlistId, ids)); }
        catch { setFaixas(ids.map((videoId, indice) => ({ videoId, titulo: `Faixa ${indice + 1}`, miniatura: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` }))); }
      };
      const tentarCarregarLista = (player) => {
        if (cancelado || listaCarregada) return;
        sincronizarFaixas(player);
        if (player.getPlaylist?.()?.length) return;
        if (indiceTentativa >= 10) {
          setErro("O YouTube bloqueou a incorporacao das primeiras musicas desta playlist. Verifique se os videos permitem reproducao em outros sites.");
          return;
        }
        indiceTentativa += 1;
        player.cuePlaylist({ listType: "playlist", list: playlistId, index: indiceTentativa });
        clearTimeout(temporizadorTentativa);
        temporizadorTentativa = setTimeout(() => tentarCarregarLista(player), 1200);
      };
      playerRef.current = new YT.Player(alvo, {
        width: "100%", height: "100%", playerVars: {
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          widget_referrer: window.location.href,
        },
        events: {
          onReady: (event) => {
            event.target.getIframe?.().setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
            event.target.setVolume(volume); event.target.cuePlaylist({ listType: "playlist", list: playlistId, index: 0 });
            temporizadorTentativa = setTimeout(() => tentarCarregarLista(event.target), 1000);
          },
          onStateChange: (event) => { setTocando(event.data === YT.PlayerState.PLAYING); setIndiceAtual(Math.max(0, event.target.getPlaylistIndex?.() || 0)); sincronizarFaixas(event.target); },
          onError: (event) => {
            if (!listaCarregada && [100, 101, 150, 153].includes(event.data)) {
              clearTimeout(temporizadorTentativa);
              temporizadorTentativa = setTimeout(() => tentarCarregarLista(event.target), 150);
              return;
            }
            setErro(event.data === 153
              ? "O navegador ocultou a identificacao exigida pelo YouTube. Libere o YouTube no bloqueador de conteudo e recarregue a pagina."
              : "Esta musica nao permite reproducao incorporada. Pulando para a proxima faixa.");
            event.target.nextVideo?.();
          },
        },
      });
    }).catch((error) => setErro(error.message));
    return () => { cancelado = true; clearTimeout(temporizadorTentativa); playerRef.current?.destroy?.(); playerRef.current = null; hospedeiro.replaceChildren(); };
  }, [playlistId]); // O volume inicial e aplicado quando o player fica pronto.

  const carregarPlaylist = (event) => {
    event.preventDefault(); const id = extrairPlaylistId(link);
    if (!id) { setErro("Cole um link valido de uma playlist publica do YouTube."); return; }
    setErro(""); setFaixas([]); setIndiceAtual(0); localStorage.setItem(`darkness_playlist_${campanhaId}`, link); setPlaylistId(id);
  };
  const tocarFaixa = (indice) => { playerRef.current?.playVideoAt?.(indice); setIndiceAtual(indice); };

  return <section className="musica-tabletop">
    <form className="musica-vinculo" onSubmit={carregarPlaylist}><label><Icon path={mdiPlaylistMusic} size={.72} /><input value={link} onChange={(event) => setLink(event.target.value)} placeholder="Cole o link da playlist do YouTube" /></label><button type="submit">Carregar</button></form>
    {erro && <p className="musica-erro">{erro}</p>}
    <div className="musica-conteudo"><section className="musica-lista"><header><span>Musicas da playlist</span><b>{faixas.length || "..."}</b></header><div>{faixas.length ? faixas.map((faixa, indice) => <button key={`${faixa.videoId}-${indice}`} className={indice === indiceAtual ? "ativo" : ""} onClick={() => tocarFaixa(indice)}><img src={faixa.miniatura} alt="" /><span><small>{String(indice + 1).padStart(2, "0")}</small><strong>{faixa.titulo}</strong></span>{indice === indiceAtual && <Icon path={tocando ? mdiVolumeHigh : mdiMusicNote} size={.62} />}</button>) : <p>{playlistId ? "Carregando musicas..." : "Adicione uma playlist para comecar."}</p>}</div></section>
      <section className="musica-player"><header><div><span>Tocando agora</span><strong>{faixas[indiceAtual]?.titulo || "Nenhuma musica selecionada"}</strong></div><div><button onClick={() => playerRef.current?.previousVideo?.()} title="Anterior"><Icon path={mdiSkipPrevious} size={.75} /></button><button onClick={() => tocando ? playerRef.current?.pauseVideo?.() : playerRef.current?.playVideo?.()} title={tocando ? "Pausar" : "Tocar"}><Icon path={tocando ? mdiPause : mdiPlay} size={.78} /></button><button onClick={() => playerRef.current?.nextVideo?.()} title="Proxima"><Icon path={mdiSkipNext} size={.75} /></button></div></header><div className="musica-youtube-player" ref={elementoRef} /><label className="musica-volume"><Icon path={mdiVolumeHigh} size={.65} /><input type="range" min="0" max="100" value={volume} onChange={(event) => { const valor = Number(event.target.value); setVolume(valor); playerRef.current?.setVolume?.(valor); }} /><span>{volume}%</span></label></section>
    </div>
  </section>;
};

export default MusicaTabletop;
