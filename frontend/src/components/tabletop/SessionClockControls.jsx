import React from 'react';
import { formatSessionTime, normalizeSessionClock } from '../../utils/tabletopClock';

export default function SessionClockControls({clock,minutes,mestre,onChange}) {
  const value = normalizeSessionClock(clock);
  return <section className="tt3-session-clock" aria-label="Tempo da sessão">
    <div className="tt3-clock-heading"><span>HORÁRIO DA CENA</span><strong>{formatSessionTime(minutes)}</strong></div>
    <p>O céu e a luz acompanham o horário. Chuva, neve e vento continuam independentes.</p>
    <fieldset disabled={!mestre}>
      <label className="tt3-clock-toggle"><input type="checkbox" checked={value.enabled} onChange={event => onChange({enabled:event.target.checked})}/>Passagem gradual do tempo</label>
      <label>Horário<input aria-label="Horário da cena" type="time" value={formatSessionTime(minutes)} onChange={event => { if (!event.target.value) return; const [hours,mins]=event.target.value.split(':').map(Number); onChange({minutes:hours*60+mins}); }}/></label>
      <label>Velocidade<select aria-label="Velocidade do tempo" value={value.rate} onChange={event => onChange({rate:Number(event.target.value)})}>{[1,5,10,30,60,120].map(rate => <option key={rate} value={rate}>{rate}× · {rate} min por minuto real</option>)}</select></label>
      <button type="button" className="tt3-primary" disabled={!value.enabled} onClick={() => onChange({running:!value.running})}>{value.running ? 'Pausar tempo' : 'Retomar tempo'}</button>
    </fieldset>
    <small>{!mestre ? 'O mestre controla o tempo da sessão.' : 'O relógio avança enquanto a sessão do mestre estiver aberta.'}</small>
  </section>;
}
