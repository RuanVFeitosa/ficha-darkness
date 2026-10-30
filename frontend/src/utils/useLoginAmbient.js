import { useEffect, useRef, useSyncExternalStore } from 'react';

const MUSIC_KEY = 'darkness:login:musica';
const TRACK_KEY = 'darkness:ambiente:trilha';
const VOLUME_KEY = 'darkness:ambiente:volume';
const EVENT = 'darkness:ambiente:alterado';
export const TRILHAS_AMBIENTE = [
  { id: 'veu', nome: 'Véu da noite', notas: [73.416, 110, 146.832, 174.614, 220, 329.628], filtro: 850 },
  { id: 'santuario', nome: 'Santuário', notas: [65.406, 98, 130.813, 164.814, 196, 293.665], filtro: 1200 },
  { id: 'abismo', nome: 'Abismo', notas: [55, 82.407, 110, 130.813, 164.814, 233.082], filtro: 520 },
];
function snapshot() {
  return `${localStorage.getItem(MUSIC_KEY) !== 'off'}|${localStorage.getItem(TRACK_KEY) || 'veu'}|${localStorage.getItem(VOLUME_KEY) ?? '35'}`;
}
function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); };
}
function salvar(chave, valor) {
  localStorage.setItem(chave, String(valor));
  window.dispatchEvent(new Event(EVENT));
}

export default function useLoginAmbient() {
  const [ligado, id, nivel] = useSyncExternalStore(subscribe, snapshot).split('|');
  const ativo = ligado === 'true';
  const trilha = TRILHAS_AMBIENTE.find(t => t.id === id) || TRILHAS_AMBIENTE[0];
  const volume = Number.isFinite(Number(nivel)) ? Math.max(0, Math.min(100, Number(nivel))) : 35;
  return { ativo, trilha, volume,
    alternar: () => salvar(MUSIC_KEY, ativo ? 'off' : 'on'),
    trocarTrilha: id => { if (TRILHAS_AMBIENTE.some(t => t.id === id)) salvar(TRACK_KEY, id); },
    ajustarVolume: valor => { if (Number.isFinite(Number(valor))) salvar(VOLUME_KEY, Math.max(0, Math.min(100, Number(valor)))); },
  };
}

// Acorde ambiente original, sintetizado sem arquivos ou serviços externos.
export function useAmbientPlayback() {
  const { ativo, trilha, volume } = useLoginAmbient();
  const audio = useRef(null);
  const masterRef = useRef(null);
  const volumeRef = useRef(volume);
  const iniciado = useRef(false);

  useEffect(() => {
    volumeRef.current = volume;
    if (audio.current && masterRef.current) {
      masterRef.current.gain.setTargetAtTime(.065 * volume / 35, audio.current.currentTime, .3);
    }
  }, [volume]);

  useEffect(() => {
    if (!ativo) return;
    function iniciar() {
      iniciado.current = true;
      if (audio.current) {
        audio.current.resume().catch(() => {});
        return;
      }
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      let context;
      try {
        context = new Context();
        audio.current = context;
        const master = context.createGain();
        masterRef.current = master;
        master.gain.setValueAtTime(0, context.currentTime);
        master.gain.linearRampToValueAtTime(.065 * volumeRef.current / 35, context.currentTime + 4);
        const filtro = context.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = trilha.filtro;
        filtro.connect(master);
        master.connect(context.destination);

        // Ré menor com nona: camadas lentas, sem batida e sem cortes de loop.
        trilha.notas.forEach((frequencia, i) => {
          const voz = context.createOscillator();
          voz.type = i < 2 ? 'sine' : 'triangle';
          voz.frequency.value = frequencia;
          voz.detune.value = i % 2 ? 4 : -4;
          const volume = context.createGain();
          volume.gain.value = i < 2 ? .3 : .1;
          const movimento = context.createOscillator();
          movimento.frequency.value = .035 + i * .013;
          const profundidade = context.createGain();
          profundidade.gain.value = i < 2 ? .06 : .035;
          movimento.connect(profundidade);
          profundidade.connect(volume.gain);
          voz.connect(volume);
          volume.connect(filtro);
          voz.start();
          movimento.start();
        });
        context.resume().catch(() => {});
      } catch {
        audio.current = null;
        context?.close().catch(() => {});
      }
    }
    function visibilidade() {
      if (document.hidden) audio.current?.suspend().catch(() => {});
      else audio.current?.resume().catch(() => {});
    }
    window.addEventListener('pointerdown', iniciar);
    window.addEventListener('keydown', iniciar);
    document.addEventListener('visibilitychange', visibilidade);
    if (iniciado.current || navigator.userActivation?.hasBeenActive) iniciar();
    return () => {
      window.removeEventListener('pointerdown', iniciar);
      window.removeEventListener('keydown', iniciar);
      document.removeEventListener('visibilitychange', visibilidade);
      const context = audio.current;
      audio.current = null;
      masterRef.current = null;
      context?.close().catch(() => {});
    };
  }, [ativo, trilha]);
}
