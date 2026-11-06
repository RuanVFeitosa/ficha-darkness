import React,{useState} from 'react';
import ParticipantSummaryDialog from './ParticipantSummaryDialog';
import InitiativeRoster from './InitiativeRoster';
import './InitiativeCards.css';

export default function InitiativeCards({entries, turn, master=false, drafts={}, onChange, onConfirm, onEntryChange, onEntryConfirm, onRemove, onSaveEnemy, onOpen, candidates=[], onAdd, system='absoluto'}) {
 const [summaryKey,setSummaryKey]=useState(null);
 const summary=entries.find(entry=>entry.chave===summaryKey);
 const open=entry=>setSummaryKey(entry.chave);
 return <div className="initiative-cards" aria-label="Ordem de iniciativa">
  <div className="initiative-primary">
  <div className="initiative-order-track">
  {entries.length ? entries.map(entry => <article className={`initiative-card ${turn?.chave===entry.chave && turn.estado==='ativo'?'is-current-turn':''}`} aria-current={turn?.chave===entry.chave && turn.estado==='ativo'?'step':undefined} data-kind={entry.tipo} key={entry.chave}>
   <button type="button" className="initiative-card-portrait" aria-label={'Ver resumo de '+entry.nome} onClick={()=>open(entry)}>{entry.foto ? <img src={entry.foto} alt=""/> : (entry.nome || '?').slice(0,2)}</button>
   {entry.tipo==='boss' && <span className="initiative-boss-symbol" aria-hidden="true">{system==='espiral' ? <svg viewBox="0 0 100 100" fill="none"><polyline points={Array.from({length:180},(_,i)=>{const t=i/179*Math.PI*7,r=2+i/179*44;return `${50+Math.cos(t)*r},${50+Math.sin(t)*r}`;}).join(' ')} stroke="currentColor" strokeWidth="3"/></svg> : <img src="/simbolo-absoluto.png" alt=""/>}</span>}
   <strong className="initiative-card-name" title={entry.nome}>{<button type="button" onClick={()=>open(entry)}>{entry.nome}</button>}</strong>
   {master ? <input className="initiative-card-value" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="—" aria-label={`Iniciativa de ${entry.nome}`} value={Object.prototype.hasOwnProperty.call(drafts,entry.chave) ? drafts[entry.chave] : (entry.valor ?? '')} onChange={event=>entry.tipo==='jogador' ? onChange(entry.membro,event.target.value) : onEntryChange(entry.chave,event.target.value)} onBlur={()=>entry.tipo==='jogador' ? onConfirm(entry.membro) : onEntryConfirm(entry.chave,entry.nome)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}}/> : <span className="initiative-card-value" aria-label={`Iniciativa de ${entry.nome}`}>{entry.valor ?? '—'}</span>}
  </article>) : <p>Nenhuma iniciativa definida.</p>}
  </div>
  {summary && <ParticipantSummaryDialog onSave={master?onSaveEnemy:undefined} entry={summary} onClose={()=>setSummaryKey(null)}/>}
  </div>
  {master && onAdd && <InitiativeRoster candidates={candidates} entries={entries} drafts={drafts} onAdd={onAdd} onEntryChange={onEntryChange} onEntryConfirm={onEntryConfirm} onRemove={onRemove}/>}
 </div>;
}
