import { espiralDie } from '../utils/espiralDice';
import React from 'react';

export function EspiralSigil({ className = '' }) {
  const points = Array.from({ length: 260 }, (_, i) => {
    const angle = i / 259 * Math.PI * 8;
    const radius = 3 + i / 259 * 43;
    return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
  }).join(' ');
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true"><polyline points={points} stroke="currentColor" strokeWidth="1.3" /></svg>;
}

export function EspiralDashboardHeader({ agents, pending, loading, onRefresh, onSystemChange, onHome }) {
  return <>
    <header className="ed-header">
      <div className="ed-brand"><EspiralSigil /><span>ESPIRAL<small>ARQUIVO DO MESTRE</small></span></div>
      <div className="ed-header-actions"><span className="ed-session"><i /> MESA DE CONTROLE</span><button type="button" onClick={onRefresh} disabled={loading} className="ed-refresh">{loading ? 'Atualizando…' : '↻ Atualizar'}</button><button type="button" onClick={onHome} className="ed-home">Início ↗</button></div>
    </header>
    <section className="ed-intro" aria-labelledby="ed-title">
      <div className="ed-intro-copy"><span className="ed-eyebrow">NARRATIVA / PERSONAGENS / CONSEQUÊNCIAS</span><h1 id="ed-title">Toda escolha<br />deixa uma <em>marca.</em></h1><p>Organize sua mesa. Acompanhe quem atravessa a história.<br />Prepare o que vem depois.</p><div className="ed-system-switch" role="group" aria-label="Sistema do dashboard"><button type="button" aria-pressed="false" onClick={() => onSystemChange('darkness')}>DARKNESS</button><button type="button" aria-pressed="true" onClick={() => onSystemChange('espiral')}>ESPIRAL <span>↗</span></button></div></div>
      <div className="ed-intro-art" aria-hidden="true"><span className="ed-orbit-label">CADA VOLTA, UMA NOVA HISTÓRIA.</span><EspiralSigil /><span className="ed-orbit-index">ES / 01</span></div>
      <dl className="ed-summary"><div><dt>Agentes no arquivo</dt><dd>{String(agents).padStart(2, '0')}<span>Fichas ESPIRAL neste dispositivo</span></dd></div><div><dt>Triagens pendentes</dt><dd>{String(pending).padStart(2, '0')}<span>Solicitações aguardando análise</span></dd></div><div className="ed-summary-note"><dt>Princípio da mesa</dt><dd>A intenção vem<br />antes dos dados.<span>O resto é consequência.</span></dd></div></dl>
    </section>
  </>;
}

function Meter({ label, value, max, tone = '' }) {
  const current = Math.max(0, Number(value) || 0);
  const maximum = Math.max(1, Number(max) || 1);
  return <div className={`ed-meter ${tone}`}><div><span>{label}</span><b>{current}<small> / {maximum}</small></b></div><progress aria-label={label} value={Math.min(current, maximum)} max={maximum} /></div>;
}

export function EspiralAgentCard({ ficha, attributes, integrityMaximum, onOpen }) {
  const sheet = ficha.personagem || ficha;
  return <button type="button" className="ed-agent" onClick={() => onOpen(ficha, 'jogador')} aria-label={`Abrir ficha de ${sheet.name || 'Personagem'}`}>
    <div className="ed-agent-photo">{sheet.profileImage ? <img src={sheet.profileImage} alt="" loading="lazy" /> : <div className="ed-agent-placeholder"><EspiralSigil /><span>{(sheet.name || '?').slice(0, 1)}</span></div>}<span className="ed-agent-code">DOSSIÊ / {ficha.espiralId || ficha.fichaId?.replace('espiral:', '') || 'SEM CÓDIGO'}</span><span className="ed-agent-open" aria-hidden="true">↗</span></div>
    <div className="ed-agent-body"><div className="ed-agent-identity"><span>{sheet.vertente || 'Sem vertente'}</span><h3>{sheet.name || 'Personagem sem nome'}</h3><p>{sheet.player || 'Jogador não informado'}<span> · {sheet.occupation || 'Ocupação não informada'}</span></p></div><dl className="ed-agent-attributes">{attributes.slice(0, 4).map(([name, die]) => <div key={name}><dt>{name}</dt><dd>{espiralDie(die)}</dd></div>)}</dl><div className="ed-agent-resources"><Meter label="Integridade" value={sheet.integrity} max={integrityMaximum} /><div><Meter label="Sanidade" value={sheet.sanity} max={10} tone="sanity" /><Meter label="Esperança" value={sheet.hope} max={10} tone="hope" /></div></div><div className="ed-agent-footer"><span>{sheet.pressure || 0} dados de pressão</span><span>Consultar arquivo <b aria-hidden="true">→</b></span></div></div>
  </button>;
}

