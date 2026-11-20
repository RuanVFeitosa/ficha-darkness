import React from 'react';
import '../../styles/IntegrityHeartbeat.css';

export function integrityCondition(current, maximum) {
  const ratio = maximum > 0 ? Math.max(0, Number(current) || 0) / maximum : 0;
  return ratio > .5 ? { key: 'stable', label: 'Estável' }
    : ratio > .25 ? { key: 'hurt', label: 'Machucado' }
      : { key: 'critical', label: 'Crítico' };
}

const trace = 'M0 43 H54 L64 39 L74 43 H104 L114 49 L126 17 L138 65 L151 34 L163 43 H198 L210 38 L224 43 H254 L264 49 L276 17 L288 65 L301 34 L313 43 H350 L362 39 L374 43 H400';

export default function IntegrityHeartbeat({ current, maximum }) {
  const condition = integrityCondition(current, maximum);
  return <section className={`pd-heartbeat is-${condition.key}`} aria-label={`Estado de Integridade: ${condition.label}`}>
    <div className="pd-heartbeat-screen" role="img" aria-label={`Monitor cardíaco — ${condition.label}`}>
      <span className="pd-heartbeat-title">INTEGRIDADE</span>
      <div className="pd-heartbeat-trace" aria-hidden="true">{[0,1].map(index => <svg key={index} viewBox="0 0 400 80" preserveAspectRatio="none"><path d={trace}/></svg>)}</div>
    </div>
    <div className="pd-heartbeat-summary pd-heartbeat-readout" aria-live="polite"><div className="pd-heartbeat-values" role="meter" aria-label="Integridade" aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={current} aria-valuetext={`${current} de ${maximum} · ${condition.label}`}><strong>{current}</strong><span className="pd-heartbeat-maximum">/ {maximum}</span></div><span className="pd-heartbeat-state"><i aria-hidden="true"/>{condition.label}</span></div>
  </section>;
}
