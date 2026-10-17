import EspiralDice from '../components/EspiralDice';
import {fecharAnimado} from '../utils/pageMotion';
import React, {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {ATTRIBUTES} from '../data/espiral';
import {fichaHref} from '../services/jogadorApi';
import '../CSS/DossierModal.css';
const membros=[['cabeca','Cabeça'],['torso','Torso'],['bracoDireito','Braço direito'],['bracoEsquerdo','Braço esquerdo'],['pernaDireita','Perna direita'],['pernaEsquerda','Perna esquerda']];
const nomes={forca:'Força',fonitude:'Fonitude',inteligencia:'Inteligência',reflexos:'Reflexos',vontade:'Vontade'};
function Meter({nome,atual,max,pontos=false,tom=''}){
 const pct=max>0 && Number.isFinite(Number(atual))?Math.max(0,Math.min(100,Number(atual)/max*100)):0;
 return <div className={`dm-meter dm-${tom}`}><strong>{nome}</strong>{pontos?<span className="dm-dots" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} className={i<Number(atual)?'ativo':''}/>)}</span>:<span className="dm-track"><i style={{width:`${pct}%`}}/></span>}<span>{atual ?? '—'} / {max ?? '—'}</span></div>;
}
export default function DossierModal({ficha,resumo,onClose,portalRoot}){
 const modal=useRef(null),espiral=ficha.sistema==='espiral',d=ficha.dados || {};
 const fechar=()=>fecharAnimado(modal.current,onClose);
 useEffect(()=>{const anterior=document.activeElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';modal.current?.querySelector('button')?.focus();return()=>{document.body.style.overflow=overflow;anterior?.focus();};},[]);
 return createPortal(<div className={`dossier-modal-backdrop ${espiral?'dm-espiral':'dm-absoluto'}`} onClick={e=>{if(e.target===e.currentTarget)fechar();}}><section className="dossier-modal" ref={modal} role="dialog" aria-modal="true" aria-labelledby={`dm-title-${ficha.sistema}-${ficha.id}`} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();fechar();}if(e.key==='Tab'){const els=[...modal.current.querySelectorAll('a,button')];const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
  <header className="dm-header"><div><small>ARQUIVO {espiral?'ESPIRAL // AGENTE':'ABSOLUTO // PERSONAGEM'}</small><h2 id={`dm-title-${ficha.sistema}-${ficha.id}`}>{ficha.nome}</h2><p>{resumo.categoria}{resumo.identidade ? ` · ${resumo.identidade}` : ''}</p></div>{ficha.demo?<span>Template de demonstração</span>:<a href={fichaHref(ficha)}>Abrir ficha completa ↗</a>}<button type="button" aria-label="Fechar resumo da ficha" onClick={fechar}>×</button></header>
  {espiral?<div className="dm-espiral-body"><div className="dm-portrait">{ficha.foto?<img src={ficha.foto} alt={`Retrato de ${ficha.nome}`}/>:<span>{ficha.nome?.slice(0,1)}</span>}</div><section className="dm-espiral-attributes"><h3>Atributos</h3><dl>{resumo.atributos.map(a=><div key={a.nome}><dt>{ATTRIBUTES[a.nome]?.name || a.nome}<small>{ATTRIBUTES[a.nome]?.stages[Number(d.attributes?.[a.nome])-1]}</small></dt><dd>{<EspiralDice value={a.valor}/>}</dd></div>)}</dl></section><section className="dm-status"><h3>Status atual</h3>{resumo.recursos.map((r,i)=><Meter key={r.nome} {...r} pontos={i>0} tom={['integridade','sanidade','esperanca'][i]}/>)}<p>{resumo.progresso}</p></section></div>:<div className="dm-absoluto-body"><section className="dm-panel dm-all-attributes"><h3>Atributos</h3><dl>{['forca','fonitude','inteligencia','reflexos','vontade'].map(key=><div key={key}><dt>{nomes[key]}</dt><dd>{resumo.atributos.find(a=>a.nome===key)?.valor ?? '—'}</dd></div>)}</dl></section><section className="dm-panel dm-body-integrity"><h3>Integridade corporal</h3><div>{membros.map(([key,nome])=><Meter key={key} nome={nome} atual={d.membros?.[key]?.atual} max={d.membros?.[key]?.max} tom="integridade"/>)}</div></section><div className="dm-mental">{resumo.recursos.slice(1).map((r,i)=><section className="dm-panel" key={r.nome}><h3>{r.nome}</h3><Meter {...r} tom={i===0?'sanidade':'esperanca'}/></section>)}<p>{resumo.progresso}</p></div></div>}
 </section></div>,portalRoot);
}