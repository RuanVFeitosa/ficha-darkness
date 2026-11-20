import React from 'react';
import NumberInput from '../ui/NumberInput';
import { ATTRIBUTES, GRADES, RESOURCES } from '../../data/espiral';

export function EncounterPortrait({ draft, defenses, maximum }) {
  return <div className="dn-dossier-hero"><div className="dn-dossier-photo">{draft.profileImage ? <img src={draft.profileImage} alt=""/> : <img className="dn-dossier-sigil" src="/simbolo-darkness.png" alt=""/>}<span>{draft.tipo === 'npc' ? 'ALIADO / NPC' : 'AMEAÇA / INIMIGO'}</span></div><div className="dn-dossier-identity"><span className="ed-eyebrow">DOSSIÊ DO MESTRE / {draft.folder || 'SEM PASTA'}</span><h3>{draft.name || 'Nome do encontro'}</h3><p>{draft.occupation || 'Defina a função deste personagem na história.'}</p><div className="dn-dossier-tags"><span>{draft.vertente || 'Sem vertente'}</span><span>{draft.injuries.length} lesões</span><span>{draft.weapons.length} armas e ataques</span></div><dl className="dn-defenses">{[['Defesa', defenses.base], ['Esquiva', defenses.dodge], ['Bloqueio', defenses.block], ['Integridade máx.', maximum]].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></div></div>;
}

export function EncounterAttributes({ attributes, onChange }) {
  return <div className="dn-attribute-cards">{Object.entries(ATTRIBUTES).map(([key, entry]) => {
    const stage = Number(attributes[key]);
    const sides = stage * 2 + 2;
    const polygon = stage === 1 ? '50,5 95,90 5,90' : stage === 3 ? '50,2 98,50 50,98 2,50' : stage === 4 ? '50,2 98,38 80,95 20,95 2,38' : '50,2 94,26 94,74 50,98 6,74 6,26';
    return <div className="dn-attribute" key={key}><div className="dn-attribute-heading"><div><label htmlFor={'dn-attribute-' + key}>{entry.name}</label><p>{entry.hint}</p></div><svg className="dn-attribute-die" viewBox="0 0 100 100" role="img" aria-label={`${entry.name}: d${sides}`}><polygon points={polygon} fill="none" stroke="currentColor" strokeWidth="2"/><text x="50" y="56" textAnchor="middle">d{sides}</text></svg></div><div className="dn-stage-dots" aria-hidden="true">{[1,2,3,4,5].map(value => <i key={value} className={value <= stage ? 'filled' : ''}/>)}</div><select id={'dn-attribute-' + key} value={stage} onChange={event => onChange(key, Number(event.target.value))}>{entry.stages.map((name, index) => <option key={name} value={index + 1}>{index + 1} · {name} · d{index * 2 + 4}</option>)}</select></div>;
  })}</div>;
}

export function EncounterVitals({ draft, maximum, onChange }) {
  return <div className="dn-vitals">{[['integrity','Integridade',maximum],['sanity','Sanidade',10],['hope','Esperança',10],['pressure','Dados de Pressão',5],['failures','Fracassos',3]].map(([key,label,max]) => <div className="dn-vital" key={key}><label htmlFor={'dn-vital-' + key}>{label}</label><div className="dn-vital-value"><strong>{draft[key]}</strong><span>/ {max}</span></div><progress aria-label={'Medidor de ' + label} max={max} value={draft[key]}/><NumberInput id={'dn-vital-' + key} type="number" min="0" max={max} value={draft[key]} onChange={event => onChange(key, Number(event.target.value))}/></div>)}</div>;
}

export function EncounterResources({ resources, onChange }) {
  return <div className="dn-resource-list">{RESOURCES.map((name, index) => <div className="dn-resource" key={name}><div><label htmlFor={'dn-resource-' + index}>{name}</label><div className="dn-resource-dots" aria-hidden="true">{[1,2,3,4].map(grade => <i key={grade} className={grade <= resources[name] ? 'filled' : ''}/>)}</div></div><select id={'dn-resource-' + index} value={resources[name]} onChange={event => onChange(name, Number(event.target.value))}>{GRADES.map((grade, i) => <option key={grade} value={i}>{['0','I','II','III','IV'][i]} · {grade}</option>)}</select></div>)}</div>;
}
