import React from 'react';
import { GRADES, RESOURCES } from '../../data/espiral';

const romans = ['0', 'I', 'II', 'III', 'IV'];
export default function AdaptacaoRecursos({ initial, resources, plan, busy, onChange }) {
  const spent = RESOURCES.reduce((sum, name) => sum + Number(resources[name] || 0), 0);
  const remaining = plan.budget - spent;
  const change = (name, delta) => {
    const next = Number(resources[name] || 0) + delta;
    if (next < 0 || next > 3 || (delta > 0 && remaining < delta)) return;
    onChange({ ...resources, [name]: next });
  };
  return <section className="adk-resources" aria-label="Adaptação dos Recursos">
    <div className="adk-budget"><div><span>DOMÍNIOS → RECURSOS</span><strong>Seu preparo atravessa os sistemas.</strong><p>Cada Domínio contribui uma vez: 0 → 0; 1–2 → I; 3–4 → II; 5 → III. As especialidades orientam a sugestão inicial. Redistribua sem aumentar o total.</p></div><div className="adk-balance" aria-live="polite"><b>{remaining}</b><span>pontos de Recursos</span></div></div>
    <details className="adk-reference"><summary>Consultar Domínios da ficha Absoluto</summary><dl className="adk-domain-list">{plan.domains.map(domain => <div key={domain.id}><dt>{domain.nome} <b>{domain.value}</b></dt><dd>{domain.points} {domain.points === 1 ? 'ponto' : 'pontos'} · {domain.recursos.join(' / ')}</dd></div>)}</dl><p>Um Domínio alto não concede seu grau completo a todos os Recursos relacionados. A soma de suas contribuições define os {plan.budget} pontos disponíveis.</p></details>
    {plan.missingDomains && <p className="adk-pending">Esta ficha não possui Domínios registrados. Nenhum ponto de Recursos foi atribuído automaticamente; revise os Domínios na ficha Absoluto com o mestre antes de adaptar.</p>}
    <div className="adk-attributes">{RESOURCES.map(name => {
      const grade = Number(resources[name] || 0);
      const sources = plan.domains.filter(domain => domain.recursos.includes(name));
      return <section className="adk-attribute adk-resource" aria-label={'Recurso ' + name} key={name}><header><h3>{name}</h3><span className="adk-resource-grade">{romans[grade]}</span></header><div className="adk-stage"><strong>Grau {romans[grade]}</strong><span>{GRADES[grade]}</span></div><p className="adk-resource-source">{sources.map(domain => `${domain.nome} ${domain.value}`).join(' · ')}</p><div className="adk-track" aria-label={'Escala de ' + name}>{romans.map((roman, index) => <span key={roman} className={(index === grade ? 'current ' : '') + (index === 4 ? 'locked' : '')} title={GRADES[index] + (index === 4 ? ' — reservado à evolução' : '')}>{roman}</span>)}</div><footer><button type="button" disabled={busy || grade === 0} aria-label={'Diminuir Recurso ' + name} onClick={() => change(name, -1)}>−</button><small>{grade === initial[name] ? 'Sugestão inicial' : 'Redistribuído'}</small><button type="button" disabled={busy || remaining <= 0 || grade >= 3} aria-label={'Aumentar Recurso ' + name} onClick={() => change(name, 1)}>+</button></footer></section>;
    })}</div>
    <div className="adk-summary"><span>{spent} / {plan.budget} pontos de Recursos distribuídos</span><button type="button" disabled={busy || RESOURCES.every(name => resources[name] === initial[name])} onClick={() => onChange({ ...initial })}>Restaurar Recursos sugeridos</button></div>
    <p className="de-help">O Grau IV fica reservado à evolução. Os pontos de Recursos e de atributos são separados.</p>
    {remaining > 0 && <p className="adk-pending" role="status">Distribua os {remaining} pontos de Recursos livres para concluir.</p>}
  </section>;
}
