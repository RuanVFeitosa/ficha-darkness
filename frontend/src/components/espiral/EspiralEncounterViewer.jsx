import React, { useState } from 'react';
import { ATTRIBUTES, integrityMax } from '../../data/espiral';
import { normalizeEspiralEncounter } from '../../utils/espiralEncounters';
import EspiralDice from './EspiralDice';
import { INJURY_EFFECTS } from '../../utils/espiralInjuries';
import '../../styles/EspiralEncounterViewer.css';

export default function EspiralEncounterViewer({ record, onChange }) {
  const [region, setRegion] = useState('Torso');
  const [severity, setSeverity] = useState('Moderada');
  const [note, setNote] = useState('');
  const sheet = normalizeEspiralEncounter({ ...record.dados, ...record });
  const update = (key, value) => onChange({ ...record, [key]: value,
    ...(key === 'sanity' ? { sanidade: { atual: value, max: 10 } } : {}),
    ...(key === 'integrity' ? { integridade: { atual: value, max: integrityMax(sheet.attributes.pulso) } } : {}),
  });
  const vitals = [['integrity', 'Integridade', integrityMax(sheet.attributes.pulso)], ['sanity', 'Sanidade', 10], ['hope', 'Esperança', 10]];
  return <div className="ee-viewer">
    <div className="ee-viewer-hero">
      {sheet.profileImage ? <img src={sheet.profileImage} alt={`Retrato de ${sheet.name}`} /> : <div className="ee-viewer-initial">{sheet.name.slice(0, 1)}</div>}
      <div><span className="ee-viewer-kicker">ESPIRAL / {sheet.tipo === 'npc' ? 'NPC' : 'INIMIGO'}</span><h2>{sheet.name}</h2><p>{sheet.occupation || sheet.vertente}</p>{sheet.folder && <small>{sheet.folder}</small>}</div>
    </div>
    <div className="ee-viewer-summary"><span>Vertente <b>{sheet.vertente}</b></span><span>Defesa <b>{sheet.attributes.sentido + 2}</b></span></div>
    <section aria-label="Estado atual"><h3>Estado atual</h3><div className="ee-viewer-vitals">{vitals.map(([key, label, max]) => <label key={key}><span>{label}<small>/ {max}</small></span><input aria-label={label} type="number" min="0" max={max} value={sheet[key]} onChange={event => { if (event.target.value !== '') update(key, Math.min(max, Math.max(0, Number(event.target.value)))); }} /><progress aria-label={`${label} atual`} max={max} value={sheet[key]} /></label>)}</div>
      <div className="ee-viewer-counters">{[['pressure', 'Pressão', 20], ['failures', 'Fracassos', 3]].map(([key, label, max]) => <label key={key}>{label}<input aria-label={label} type="number" min="0" max={max} value={sheet[key]} onChange={event => update(key, Math.min(max, Math.max(0, Math.round(Number(event.target.value)))))} /></label>)}</div>
    </section>
    <section><h3>Atributos</h3><div className="ee-viewer-attributes">{Object.entries(ATTRIBUTES).map(([key, entry]) => <div key={key}><span>{entry.name}</span><b><EspiralDice value={`1d${sheet.attributes[key] * 2 + 2}`} /></b><small>{entry.stages[sheet.attributes[key] - 1]}</small></div>)}</div></section>
    <section><h3>Armas e ataques</h3>{sheet.weapons.length ? sheet.weapons.map((weapon, index) => <article key={weapon.id || index}><header><b>{weapon.name}</b><EspiralDice value={weapon.damage || '—'} /></header>{weapon.detail && <p>{weapon.detail}</p>}</article>) : <p>Nenhum ataque registrado.</p>}</section>
    <section><h3>Recursos</h3>{Object.values(sheet.resources).some(grade => grade > 0) ? <dl>{Object.entries(sheet.resources).filter(([, grade]) => grade > 0).map(([name, grade]) => <div key={name}><dt>{name}</dt><dd>Grau {grade}</dd></div>)}</dl> : <p>Nenhum recurso com pontos.</p>}</section>
    <details><summary>Habilidades e proteções</summary>{(sheet.evolution?.abilities || []).map((entry, index) => <article key={entry.id || index}><b>{entry.name}</b><small>Nível {entry.level}</small></article>)}{sheet.abilities && <p>{sheet.abilities}</p>}{sheet.protections.map((entry, index) => <article key={entry.id || index}><b>{entry.name} · Proteção {entry.value}</b><p>{entry.region} · {entry.detail}</p></article>)}{!sheet.abilities && !sheet.evolution?.abilities?.length && !sheet.protections.length && <p>Nenhuma habilidade ou proteção registrada.</p>}</details>
    <section aria-label="Membros e lesões"><h3>Membros e lesões</h3>
      <div className="ee-viewer-members">{['Cabeça', 'Torso', 'Braço direito', 'Braço esquerdo', 'Perna direita', 'Perna esquerda'].map(name => {
        const injuries = sheet.injuries.filter(entry => entry.region === name);
        return <button type="button" key={name} aria-pressed={region === name} onClick={() => setRegion(name)}><b>{name}</b><small>{injuries.length ? `${injuries.length} lesão(ões)` : 'Sem lesões'}</small></button>;
      })}</div>
      <div className="ee-viewer-injury-form"><strong>Registrar lesão · {region}</strong>
        <label>Gravidade<select value={severity} onChange={event => setSeverity(event.target.value)}>{Object.keys(INJURY_EFFECTS).map(name => <option key={name}>{name}</option>)}</select></label>
        <p>{INJURY_EFFECTS[severity]}</p>
        <label>Nota da lesão<input value={note} onChange={event => setNote(event.target.value)} placeholder="Causa, efeito ou observação" /></label>
        <button type="button" onClick={() => { update('injuries', [...sheet.injuries, { id: crypto.randomUUID(), region, severity, note: note.trim() }]); setNote(''); }}>Registrar lesão</button>
      </div>
      {sheet.injuries.length ? sheet.injuries.map((entry, index) => <article key={entry.id || index}><b>{entry.region} · {entry.severity}</b>{entry.note && <p>{entry.note}</p>}{INJURY_EFFECTS[entry.severity] && <p>{INJURY_EFFECTS[entry.severity]}</p>}<button type="button" aria-label={`Remover lesão ${entry.region} ${entry.severity}`} onClick={() => update('injuries', sheet.injuries.filter((_, entryIndex) => entryIndex !== index))}>Remover lesão</button></article>) : <p>Nenhuma lesão registrada.</p>}
    </section>
    <details><summary>História e notas</summary>{[['Descrição', sheet.backgroundDescription], ['Propósito', sheet.purpose], ['Notas do Mestre', sheet.notes], ['Inventário', sheet.inventory]].map(([label, value]) => value ? <article key={label}><b>{label}</b><p>{value}</p></article> : null)}</details>
  </div>;
}
