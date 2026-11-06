import React,{useState} from 'react';

export default function CombatTurnControls({entries,turn,busy,onAction}) {
 const [selected,setSelected]=useState('');
 const current=entries.find(entry=>entry.chave===turn?.chave);
 const target=entries.some(entry=>entry.chave===selected)?selected:(current?.chave || entries[0]?.chave || '');
 return <div className="combat-turn-controls" role="group" aria-label="Controle dos turnos de combate">
  <p role="status"><strong>Rodada {turn?.rodada || 1}</strong><span>{current ? `${current.nome} · ${turn.estado==='ativo'?'Jogando agora':'Turno encerrado'}` : 'Aguardando início do turno'}</span></p>
  <label>Iniciar turno de<select aria-label="Participante do turno" disabled={busy} value={target} onChange={event=>setSelected(event.target.value)}>{entries.map((entry,index)=><option key={entry.chave} value={entry.chave}>{index+1}. {entry.nome} · {entry.valor ?? '—'}</option>)}</select></label>
  <button type="button" disabled={busy || !target} onClick={()=>onAction('start',target)}>Iniciar turno</button>
  <button type="button" disabled={busy || turn?.estado!=='ativo' || !current} onClick={()=>onAction('end')}>Encerrar turno</button>
  <button type="button" disabled={busy || !entries.length || !turn} onClick={()=>onAction('next')}>{turn?.estado==='ativo'?'Encerrar e próximo':'Próximo turno'} →</button>
 </div>;
}
