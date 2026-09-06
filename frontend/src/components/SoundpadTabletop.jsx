import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiClose, mdiMusicNotePlus, mdiRepeat, mdiStop, mdiVolumeHigh } from "@mdi/js";
import "../CSS/SoundpadTabletop.css";

const animarVolume = (audio, destino, segundos, aoTerminar) => {
  const inicio = audio.volume;
  const comeco = performance.now();
  const duracao = Math.max(0, Number(segundos) || 0) * 1000;
  if (!duracao) { audio.volume = destino; aoTerminar?.(); return () => {}; }
  let quadro;
  const passo = (agora) => {
    const progresso = Math.min(1, (agora - comeco) / duracao);
    audio.volume = Math.max(0, Math.min(1, inicio + (destino - inicio) * progresso));
    if (progresso < 1) quadro = requestAnimationFrame(passo); else aoTerminar?.();
  };
  quadro = requestAnimationFrame(passo);
  return () => cancelAnimationFrame(quadro);
};

const SoundpadTabletop = ({ sons = [], estadoRemoto, controlavel = true, aoAlterarEstado }) => {
  const [estado, setEstado] = useState(estadoRemoto || { ativos: {} });
  const [erroAudio, setErroAudio] = useState("");
  const [sonsProntos, setSonsProntos] = useState({});
  const audiosRef = useRef(new Map());
  const animacoesRef = useRef(new Map());
  const reproducoesEncerradasRef = useRef(new Map());
  const estadoAtualRef = useRef(estado);
  estadoAtualRef.current = estado;
  useEffect(() => { setEstado(estadoRemoto || { ativos: {} }); }, [estadoRemoto]);

  useEffect(() => {
    const idsAtuais = new Set(sons.map((som) => som.id));
    sons.forEach((som) => {
      if (!som.url) return;
      const url = new URL(som.url, window.location.href).href;
      let audio = audiosRef.current.get(som.id);
      if (audio && audio.src !== url) { audio.pause(); audiosRef.current.delete(som.id); audio = null; }
      if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
        audio.src = som.url;
        audio.volume = 0;
        const marcarPronto = () => setSonsProntos((atuais) => ({ ...atuais, [som.id]: true }));
        audio.addEventListener("canplay", marcarPronto, { once: true });
        audio.addEventListener("canplaythrough", marcarPronto, { once: true });
        audio.load();
        audiosRef.current.set(som.id, audio);
      } else if (audio.readyState >= 3) {
        setSonsProntos((atuais) => atuais[som.id] ? atuais : ({ ...atuais, [som.id]: true }));
      }
    });
    audiosRef.current.forEach((audio, id) => {
      if (!idsAtuais.has(id)) { audio.pause(); audiosRef.current.delete(id); }
    });
  }, [sons]);

  useEffect(() => {
    const ativos = estado?.ativos || {};
    sons.forEach((som) => {
      const ajustes = estado?.ajustes?.[som.id] || {};
      const configurado = { ...som, ...ajustes };
      const ativo = Boolean(ativos[som.id]);
      const reproducao = JSON.stringify(ativos[som.id]);
      let audio = audiosRef.current.get(som.id);
      if (audio && audio.src !== new URL(som.url, window.location.href).href) {
        audio.pause();
        audiosRef.current.delete(som.id);
        audio = null;
      }
      animacoesRef.current.get(som.id)?.();
      if (ativo && reproducoesEncerradasRef.current.get(som.id) === reproducao) return;
      if (ativo) {
        if (!audio) {
          audio = new Audio(som.url);
          audio.preload = "auto";
          audio.loop = Boolean(configurado.loop);
          audio.volume = 0;
          audiosRef.current.set(som.id, audio);
        }
        audio.loop = Boolean(configurado.loop);
        audio.onended = () => {
          if (audio.loop || audiosRef.current.get(som.id) !== audio) return;
          const atual = estadoAtualRef.current;
          if (JSON.stringify(atual?.ativos?.[som.id]) !== reproducao) return;
          animacoesRef.current.get(som.id)?.();
          animacoesRef.current.delete(som.id);
          reproducoesEncerradasRef.current.set(som.id, reproducao);
          audio.pause();
          const restantes = { ...atual.ativos };
          delete restantes[som.id];
          const novo = { ...atual, ativos: restantes, atualizadoEm: new Date().toISOString() };
          estadoAtualRef.current = novo;
          setEstado(novo);
          if (controlavel) aoAlterarEstado?.(novo);
        };
        const destino = Math.max(0, Math.min(1, ((Number(configurado.volume) || 70) / 100) * ((Number(estado?.volumeGeral) || 100) / 100)));
        const aplicarFadeIn = () => {
          setErroAudio("");
          animacoesRef.current.get(som.id)?.();
          animacoesRef.current.set(som.id, animarVolume(audio, destino, configurado.fadeIn ?? 0.6));
        };
        if (audio.paused) audio.play().then(aplicarFadeIn).catch(() => setErroAudio("O navegador bloqueou o audio ou a URL nao pode ser reproduzida."));
        else aplicarFadeIn();
      } else if (audio) {
        audio.onended = null;
        animacoesRef.current.set(som.id, animarVolume(audio, 0, configurado.fadeOut ?? 0.8, () => {
          audio.pause(); audio.currentTime = 0;
        }));
      }
    });
  }, [estado, sons, controlavel, aoAlterarEstado]);

  useEffect(() => () => {
    animacoesRef.current.forEach((cancelar) => cancelar?.());
    audiosRef.current.forEach((audio) => { audio.onended = null; audio.pause(); audio.currentTime = 0; });
  }, []);

  const publicar = (ativos) => {
    const novo = { ...estado, ativos, atualizadoEm: new Date().toISOString() };
    setEstado(novo);
    aoAlterarEstado?.(novo);
  };
  const alternar = (som) => {
    if (!controlavel || !som.url) return;
    const atuais = { ...(estado?.ativos || {}) };
    if (atuais[som.id]) delete atuais[som.id];
    else {
      let audio = audiosRef.current.get(som.id);
      if (audio && audio.src !== new URL(som.url, window.location.href).href) {
        audio.pause(); audiosRef.current.delete(som.id); audio = null;
      }
      if (!audio) {
        audio = new Audio(som.url);
        audio.preload = "auto";
      audio.loop = Boolean(estado?.ajustes?.[som.id]?.loop ?? som.loop);
        audio.volume = 0;
        audiosRef.current.set(som.id, audio);
      }
      audio.play().then(() => setErroAudio("")).catch(() => setErroAudio("Nao foi possivel tocar este som. Verifique se a URL aponta diretamente para um arquivo de audio."));
      if (!som.sobrepor) Object.keys(atuais).forEach((id) => delete atuais[id]);
      atuais[som.id] = { iniciadoEm: new Date().toISOString() };
    }
    publicar(atuais);
  };
  const ajustarSom = (somId, mudanca) => {
    if (!controlavel) return;
    const novo = { ...estado, ajustes: { ...(estado?.ajustes || {}), [somId]: { ...(estado?.ajustes?.[somId] || {}), ...mudanca } }, atualizadoEm: new Date().toISOString() };
    setEstado(novo); aoAlterarEstado?.(novo);
  };
  const pararTudo = () => controlavel && publicar({});

  return <section className={`soundpad ${controlavel ? "controlavel" : "ouvinte"}`}>
    {controlavel && <header><div><span>Mixer de atmosfera</span><strong>Soundpad</strong></div><label><Icon path={mdiVolumeHigh} size={.55} /><input type="range" min="0" max="100" value={estado?.volumeGeral ?? 100} onChange={(e) => { const novo = { ...estado, volumeGeral: Number(e.target.value) }; setEstado(novo); aoAlterarEstado?.(novo); }} /><b>{estado?.volumeGeral ?? 100}%</b></label><button onClick={pararTudo} disabled={!Object.keys(estado?.ativos || {}).length}><Icon path={mdiStop} size={.7} />Parar tudo</button></header>}
    {erroAudio && controlavel && <p className="soundpad-erro">{erroAudio}</p>}
    <div className="soundpad-grade">
      {sons.map((som, indice) => {
        const ativo = Boolean(estado?.ativos?.[som.id]);
        const ajustes = estado?.ajustes?.[som.id] || {};
        const volume = ajustes.volume ?? som.volume ?? 70;
        const loop = ajustes.loop ?? som.loop ?? false;
        const fadeIn = ajustes.fadeIn ?? som.fadeIn ?? .4;
        const fadeOut = ajustes.fadeOut ?? som.fadeOut ?? .7;
        return <article key={som.id} className={ativo ? "ativo" : ""}>
          <button className="soundpad-disparo" onClick={() => alternar(som)} disabled={!controlavel || !som.url || (!ativo && !sonsProntos[som.id])} title={`${ativo ? "Parar" : sonsProntos[som.id] ? "Tocar" : "Carregando"} ${som.nome}`}><i>{String(indice + 1).padStart(2, "0")}</i><Icon path={ativo ? mdiClose : mdiMusicNotePlus} size={.72} /><span><strong>{som.nome}</strong><small>{sonsProntos[som.id] ? (som.categoria || "Efeito") : "Carregando audio..."}</small></span></button>
          <label className="soundpad-volume-individual"><Icon path={mdiVolumeHigh} size={.48} /><input type="range" min="0" max="100" value={volume} onChange={(e) => ajustarSom(som.id, { volume: Number(e.target.value) })} /><b>{volume}%</b></label>
          <div className="soundpad-ajustes"><label className={loop ? "ligado" : ""}><input type="checkbox" checked={Boolean(loop)} onChange={(e) => ajustarSom(som.id, { loop: e.target.checked })} /><Icon path={mdiRepeat} size={.5} />Loop</label><label>IN <input type="number" min="0" max="20" step=".1" value={fadeIn} onChange={(e) => ajustarSom(som.id, { fadeIn: Number(e.target.value) })} />s</label><label>OUT <input type="number" min="0" max="20" step=".1" value={fadeOut} onChange={(e) => ajustarSom(som.id, { fadeOut: Number(e.target.value) })} />s</label></div>
        </article>;
      })}
      {!sons.length && <p>Nenhum som cadastrado para esta campanha.</p>}
    </div>
  </section>;
};

export default SoundpadTabletop;
