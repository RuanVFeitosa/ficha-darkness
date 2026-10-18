import React, { useEffect, useRef, useState } from "react";
import "./ReprodutorCassete.css";


export default function ReprodutorCassete({ documento }) {
  const audioRef = useRef(null);
  const motorRef = useRef(null);
  const timerRef = useRef(null);
  const [tocando, setTocando] = useState(false);
  const [rebobinando, setRebobinando] = useState(false);
  const [posicao, setPosicao] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [erro, setErro] = useState("");

  const desligarMotor = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (motorRef.current) {
      motorRef.current.close().catch(() => {});
      motorRef.current = null;
    }
  };
  useEffect(() => () => desligarMotor(), []);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const pararRebobinamento = () => { desligarMotor(); setRebobinando(false); };
  const pausar = () => { pararRebobinamento(); audioRef.current.pause(); };
  const reproduzir = async () => {
    pararRebobinamento();
    try { await audioRef.current.play(); setErro(""); }
    catch { setErro("Não foi possível reproduzir o áudio. Confira o arquivo e tente novamente."); }
  };
  const rebobinar = () => {
    pausar();
    if (!audioRef.current.currentTime) return;
    setRebobinando(true);
    // Motor sintético local: ruído de fita e oscilação mecânica, sem downloads.
    try {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (Contexto) {
        const ctx = new Contexto();
        motorRef.current = ctx;
        ctx.resume().catch(() => {});
        const ganho = ctx.createGain();
        ganho.gain.value = volume * 0.08;
        ganho.connect(ctx.destination);
        const motor = ctx.createOscillator();
        motor.type = "sawtooth";
        motor.frequency.value = 95;
        motor.connect(ganho);
        motor.start();
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const dados = buffer.getChannelData(0);
        for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
        const ruido = ctx.createBufferSource();
        ruido.buffer = buffer;
        ruido.loop = true;
        const filtro = ctx.createBiquadFilter();
        filtro.type = "bandpass";
        filtro.frequency.value = 1800;
        ruido.connect(filtro);
        filtro.connect(ganho);
        ruido.start();
      }
    } catch { desligarMotor(); }
    timerRef.current = setInterval(() => {
      const audio = audioRef.current;
      audio.currentTime = Math.max(0, audio.currentTime - 1.6);
      setPosicao(audio.currentTime);
      if (audio.currentTime <= 0) pararRebobinamento();
    }, 80);
  };

  return <section className={`cassete-player ${rebobinando ? "rebobinando" : tocando ? "tocando" : ""}`} aria-label="Reprodutor de fita cassete">
    <audio ref={audioRef} src={documento.url} preload="metadata"
      onLoadedMetadata={() => setDuracao(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0)}
      onTimeUpdate={() => setPosicao(audioRef.current.currentTime)}
      onPlay={() => setTocando(true)} onPause={() => setTocando(false)}
      onEnded={() => setTocando(false)} onError={() => { pausar(); setErro("Áudio indisponível. Verifique o arquivo ou sua conexão."); }} />
    <div className="gravador-corpo">
      <div className="gravador-grade" aria-hidden="true"><span>PORTABLE CASSETTE RECORDER</span></div>
      <div className="gravador-marca"><strong>DARKNESS</strong><span>DC • 60 / MONO</span></div>
      <div className="gravador-tampa">
        <div className="cassete-fita">
          <div className="cassete-etiqueta"><small>LOW NOISE · C60</small><h2>{documento.nome || "Fita cassete"}</h2></div>
          <div className="cassete-janela"><i className="cassete-carretel" /><div className="cassete-fita-centro"><span /><small>A</small></div><i className="cassete-carretel" /></div>
          <div className="cassete-base">NORMAL POSITION · TYPE I</div>
        </div>
        <span className="gravador-tampa-legenda">AUTO STOP SYSTEM</span>
      </div>
      <div className="gravador-painel">
        <div className="gravador-indicador"><i className={tocando || rebobinando ? "aceso" : ""} /><span>POWER</span></div>
        <div className="gravador-contador" aria-label="Contador da fita"><span>{String(Math.floor(posicao)).padStart(3, "0").slice(-3)}</span><small>COUNTER</small></div>
        <div className="cassete-status" role="status">{rebobinando ? "REBOBINANDO" : tocando ? "REPRODUZINDO" : "PAUSADO"}</div>
      </div>
      <div className="gravador-comandos">
        <div className="cassete-controles">
          <button type="button" aria-pressed={tocando && !rebobinando} onClick={reproduzir} disabled={!duracao}><b>▷</b><span>Play</span></button>
          <button type="button" aria-pressed={!tocando && !rebobinando} onClick={pausar} disabled={!tocando && !rebobinando}><b>Ⅱ</b><span>Pause</span></button>
          <button type="button" aria-pressed={rebobinando} onClick={rebobinar} disabled={!duracao || !posicao || rebobinando}><b>≪</b><span>Rebobinar</span></button>
          <button type="button" onClick={() => { pausar(); audioRef.current.currentTime = 0; setPosicao(0); }} disabled={!duracao}><b>□</b><span>Parar</span></button>
        </div>
        <div className="gravador-microfone" aria-hidden="true"><i /><span>MIC</span></div>
      </div>
      <label className="cassete-volume"><span>VOL</span><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { pararRebobinamento(); setVolume(Number(e.target.value)); }} /><span>{Math.round(volume * 100)}</span></label>
    </div>
    <div className="gravador-alca" aria-hidden="true" />
    {erro && <p role="alert">{erro}</p>}
  </section>;
}
