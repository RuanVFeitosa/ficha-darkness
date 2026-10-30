import React from 'react';
import useLoginAmbient, { TRILHAS_AMBIENTE } from '../../utils/useLoginAmbient';
import '../../styles/AmbientMusic.css';

export default function AmbientMusicControls() {
  const { ativo, alternar, trilha, trocarTrilha, volume, ajustarVolume } = useLoginAmbient();
  return <details className="ambient-music">
    <summary>Música ambiente · {ativo ? 'ON' : 'OFF'}</summary>
    <div className="ambient-music-panel">
      <strong>Trilha ambiente</strong>
      <button type="button" onClick={alternar} aria-pressed={ativo}>{ativo ? 'Pausar música' : 'Reproduzir música'}</button>
      <label>Atmosfera<select value={trilha.id} onChange={e => trocarTrilha(e.target.value)}>
        {TRILHAS_AMBIENTE.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
      </select></label>
      <label>Volume · {volume}%<input type="range" min="0" max="100" value={volume} onChange={e => ajustarVolume(e.target.value)}/></label>
      <small>Suas escolhas ficam salvas neste navegador.</small>
    </div>
  </details>;
}
