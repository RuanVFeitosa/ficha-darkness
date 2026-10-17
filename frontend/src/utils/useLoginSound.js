import { useEffect, useRef, useState } from 'react';

// Som mecânico curto, sintetizado localmente e iniciado pelo gesto de digitar.
export default function useLoginSound() {
  const audio = useRef(null);
  const [ativo, setAtivo] = useState(() => localStorage.getItem('darkness:login:som') !== 'off');
  useEffect(() => () => { audio.current?.close().catch(() => {}); }, []);
  function tocar(apagar = false) {
    if (!ativo) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = audio.current || (audio.current = new AudioContext());
      if (context.state === 'suspended') context.resume().catch(() => {});
      const start = context.currentTime;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .045), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * .006));
      const noise = context.createBufferSource(); noise.buffer = buffer;
      const filter = context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = apagar ? 900 : 1900; filter.Q.value = .65;
      const gain = context.createGain(); gain.gain.setValueAtTime(.22, start); gain.gain.exponentialRampToValueAtTime(.001, start + .045);
      noise.connect(filter); filter.connect(gain); gain.connect(context.destination);
      noise.start(start); noise.stop(start + .045);
    } catch { /* O acesso continua disponível se o navegador bloquear áudio. */ }
  }
  function alternar() {
    const proximo = !ativo;
    setAtivo(proximo);
    localStorage.setItem('darkness:login:som', proximo ? 'on' : 'off');
  }
  return { tocar, ativo, alternar };
}
