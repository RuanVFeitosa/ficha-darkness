import React, { useState } from 'react';
import { damageImpact, injurySeverity, INJURY_EFFECTS } from '../../utils/espiralInjuries';

export default function EspiralDamage({ region, onApply }) {
  const [damage, setDamage] = useState('');
  const [protection, setProtection] = useState('0');
  const [reduction, setReduction] = useState('0');
  const [note, setNote] = useState('');
  const [bleeding, setBleeding] = useState(false);
  const [critical, setCritical] = useState(null);
  const [message, setMessage] = useState('');
  const isLimb = /^(Braço|Perna)/.test(region);
  const criticalRegion = critical ?? !isLimb;
  const impact = damageImpact(damage, protection, reduction);
  const severity = injurySeverity(impact, criticalRegion);
  const valid = [damage, protection, reduction].every(value => value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0);
  return <section className="es-rule-card es-damage" aria-label="Aplicar dano">
    <header className="es-damage-heading"><span className="es-eyebrow">APLICAR FERIMENTO</span><h3>Dano recebido</h3><span className="es-damage-region">{region}</span></header>
    <p>Dano − Proteção − outros efeitos = Impacto.</p>
    <div className="es-damage-fields">
      {[["Dano rolado", damage, setDamage], ["Proteção aplicada", protection, setProtection], ["Redução por outros efeitos", reduction, setReduction]].map(([label, value, setter]) => <label className="es-field" key={label}><span>{label}</span><input type="number" min="0" step="1" value={value} onChange={event => { setter(event.target.value); setMessage(''); }} /></label>)}
    </div>
    <label className="es-damage-check"><input type="checkbox" checked={criticalRegion} onChange={event => setCritical(event.target.checked)} /> Região Crítica neste ferimento</label>
    <div className="es-damage-impact"><div><span>IMPACTO</span><strong>{impact}</strong></div><div><b>{severity || 'Sem lesão'}</b><p>{severity ? INJURY_EFFECTS[severity] : 'Sem perda de Integridade e sem lesão.'}</p></div></div>
    <label className="es-field"><span>Descrição do ataque e ferimento</span><input value={note} onChange={event => setNote(event.target.value)} /></label>
    <label className="es-damage-check"><input type="checkbox" checked={bleeding} disabled={!impact} onChange={event => setBleeding(event.target.checked)} /> Sangramento confirmado neste ferimento</label>
    <details className="es-damage-guidance"><summary>Como aplicar o dano</summary><p>Use a proteção efetiva para esta região e ataque. Efeitos que aumentam o dano entram no Dano rolado. O Impacto desconta automaticamente a Integridade.</p><p>Cabeça e torso vêm marcados como Região Crítica; confirme conforme o ferimento. Sangramento e consequências dependem das circunstâncias. Penalidades afetam apenas ações que dependem da região.</p></details>
    <button className="es-primary" disabled={!valid} onClick={() => {
      onApply({ region, severity, impact, damage: Number(damage), protection: Number(protection), reduction: Number(reduction), criticalRegion, bleeding: impact > 0 && bleeding, note });
      setMessage(impact ? `Impacto ${impact} aplicado à Integridade. Lesão ${severity} registrada.` : 'Impacto zero: nenhuma lesão ou perda de Integridade.');
      setDamage(''); setNote(''); setBleeding(false);
    }}>Aplicar dano e registrar lesão</button>
    <p role="status">{message}</p>
  </section>;
}
