import EspiralDice from '../espiral/EspiralDice';
import { espiralDie } from '../../utils/espiralDice';


import React, {useRef} from 'react';
import DossierModal from './DossierModal';
import { fichaHref } from '../../services/jogadorApi';
import { integrityMax } from '../../data/espiral';
const numero = value => Number.isFinite(Number(value)) ? Number(value) : null;
const valor = value => value && typeof value === 'object' ? value.atual ?? value.valor ?? null : value;
export function resumoFicha(ficha) {
  const d = ficha.dados || {}, espiral = ficha.sistema === 'espiral';
  const membros = Object.values(d.membros || {});
  const integridade = espiral ? { atual: d.integrity, max: d.attributes?.pulso ? integrityMax(d.attributes.pulso) : undefined } : d.vida?.max > 0 ? d.vida : membros.length ? { atual: membros.reduce((n,m)=>n+(numero(m.atual)||0),0), max: membros.reduce((n,m)=>n+(numero(m.max)||0),0) } : d.integridade;
  return {
    identidade: [espiral ? d.pronoun : d.pronome, espiral ? d.occupation : d.ocupacao || d.especialidade].filter(Boolean).join(' · '),
    categoria: ficha.detalhe || (espiral ? d.vertente : d.classe) || (ficha.sistema === 'darkness' ? 'ABSOLUTO' : 'ESPIRAL'),
    atributos: Object.entries((espiral ? d.attributes : d.atributos) || {}).map(([nome,v]) => ({ nome, valor: espiral ? ([4,6,8,10,12][Number(v)-1] ? espiralDie([4,6,8,10,12][Number(v)-1]) : '—') : valor(v) ?? '—' })),
    recursos: [['Integridade',integridade],['Sanidade',espiral ? d.sanity : d.sanidade],['Esperança',espiral ? d.hope : d.esperanca]].map(([nome,v])=>({ nome, atual: valor(v), max: v && typeof v === 'object' ? v.max : espiral && nome !== 'Integridade' ? 10 : undefined })),
    progresso: espiral ? `${d.pressure ?? 0} dados de pressão` : d.nivel !== undefined ? `Nível ${d.nivel}` : (ficha.sistema === 'darkness' ? 'ABSOLUTO' : 'ESPIRAL'),
  };
}
const espiralPontos = Array.from({length:400},(_,i)=>{
  const t=i/399, angulo=t*Math.PI*12, raio=3+t*94;
  return `${100+Math.cos(angulo)*raio},${100+Math.sin(angulo)*raio}`;
}).join(' ');
export default function CharacterDossier({ ficha, aberto, onToggle }) {
  const article = useRef(null);
  const resumo = resumoFicha(ficha), id = `resumo-${ficha.sistema}-${ficha.id}`;
  return <article ref={article} className={`pj-dossie ${aberto ? 'pj-dossie-aberto' : ''}`}>
    <a href={ficha.demo?'#':fichaHref(ficha)} className="pj-retrato" aria-label={`Abrir ficha de ${ficha.nome}`} onClick={e=>{if(ficha.demo || window.matchMedia?.('(hover: none), (pointer: coarse)')?.matches){e.preventDefault();onToggle();}}}>
      {ficha.foto ? <img src={ficha.foto} alt={ficha.nome} onError={e=>{e.currentTarget.style.visibility='hidden';}}/> : <span className="pj-sem-retrato">{ficha.nome?.slice(0,1) || '?'}</span>}
      <span className="pj-sistema-marca" role="img" aria-label={ficha.sistema==='espiral' ? 'Símbolo do Sistema ESPIRAL' : 'Símbolo do Sistema Absoluto'}>
        {ficha.sistema==='espiral' ? <svg viewBox="0 0 200 200" fill="none" aria-hidden="true"><polyline points={espiralPontos} stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> : <img src="/simbolo-absoluto.png" alt=""/>}
      </span>
      <span className="pj-retrato-seta" aria-hidden="true">↗</span><small>DOSSIÊ</small>
    </a>
    <section id={id} className="pj-resumo pj-resumo-editorial" aria-label={`Resumo da ficha de ${ficha.nome}`}>
      <div className="pj-dossier-kicker"><span>{ficha.sistema==='espiral'?'ESPIRAL':'ABSOLUTO'}</span><small className="pj-resumo-categoria">{resumo.categoria}</small></div><h2>{ficha.nome}</h2><p>{resumo.identidade || 'Identidade não informada'}</p>
      {!!resumo.atributos.length && <dl className="pj-resumo-atributos">{resumo.atributos.map(a=><div key={a.nome}><dt>{({razao:'Razão',forca:'Força',inteligencia:'Inteligência'})[a.nome] || a.nome}</dt><dd>{ficha.sistema==='espiral'?<EspiralDice value={a.valor}/>:String(a.valor)}</dd></div>)}</dl>}
      <div className="pj-resumo-recursos">{resumo.recursos.map(r=><div key={r.nome}><div><span>{r.nome}</span><span>{r.atual ?? '—'}{r.max !== undefined ? ` / ${r.max}` : ''}</span></div><span className="pj-recurso-trilho"><span style={{width:r.max > 0 && numero(r.atual)!==null ? `${Math.min(100,Math.max(0,r.atual/r.max*100))}%` : '0%'}}/></span></div>)}</div>
      <footer><small>{resumo.progresso}</small>{ficha.demo?<button type="button" onClick={onToggle}>Ver template ↗</button>:<a href={fichaHref(ficha)}>Consultar arquivo ↗</a>}</footer>
    </section>
    <div className="pj-card-caption"><div><small>{ficha.sistema==='espiral'?'ESPIRAL':'ABSOLUTO'} · {resumo.categoria}</small><h3>{ficha.nome}</h3><p>{resumo.identidade || 'Identidade não informada'}</p></div><button type="button" onClick={onToggle} aria-label={'Ver resumo de '+ficha.nome}>Resumo ↗</button></div>
    {aberto && <DossierModal ficha={ficha} resumo={resumo} onClose={onToggle} portalRoot={article.current?.closest('.pj') || document.body}/>}
  </article>;
}
