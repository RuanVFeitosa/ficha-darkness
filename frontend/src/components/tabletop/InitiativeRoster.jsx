import React, {useState} from 'react';

export function RosterCharacter({compact=false,character,entries,drafts,onAdd,onEntryChange,onEntryConfirm,onRemove}) {
 const npc=(character.tipo || character.dados?.tipo)==='npc';
 const [boss,setBoss]=useState(Boolean(character.bossIniciativa || character.dados?.bossIniciativa || character.tipo==='boss'));
 const [value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const turns=entries.filter(entry=>String(entry.inimigo?.id)===String(character.id));
 const valid=value!=='' && Number.isInteger(Number(value)) && Number(value)>=0;
 const act=async action=>{if(busy)return;setBusy(true);setError('');try{await action();}catch(e){setError(e.message || 'Não foi possível salvar a iniciativa.');}finally{setBusy(false);}};
 const add=()=>{if(!valid)return;act(async()=>{await onAdd(character,Number(value),npc?'npc':boss?'boss':'inimigo');setValue('');});};
 return <section className="initiative-roster-character" data-kind={npc?'npc':boss?'boss':'inimigo'}>
  {!compact && <header><span className="initiative-roster-photo">{character.fotoPerfil ? <img src={character.fotoPerfil} alt={character.nome}/> : (character.nome || '?').slice(0,2)}</span><div><strong>{character.nome}</strong>{npc ? <small>NPC</small> : <label><input type="checkbox" checked={boss} disabled={busy} onChange={e=>setBoss(e.target.checked)}/> Boss</label>}</div></header>}
  {compact && !npc && <label className="initiative-boss-toggle"><input type="checkbox" checked={boss} disabled={busy} onChange={e=>setBoss(e.target.checked)}/> Boss</label>}
  <div className="initiative-roster-turns">
  {turns.map((turn,index)=><div className="initiative-roster-turn" key={turn.chave}>
   <label htmlFor={'turn-'+turn.chave}>{npc?'Iniciativa':`Turno ${index+1}`}</label>
   <input id={'turn-'+turn.chave} aria-label={`Turno ${index+1} de ${character.nome}`} type="text" inputMode="numeric" pattern="[0-9]*" disabled={busy} value={Object.prototype.hasOwnProperty.call(drafts,turn.chave)?drafts[turn.chave]:(turn.valor ?? '')} onChange={e=>onEntryChange(turn.chave,e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();act(()=>onEntryConfirm(turn.chave,character.nome));}}}/>
   <button type="button" disabled={busy} aria-label={`Salvar turno ${index+1} de ${character.nome}`} onClick={()=>act(()=>onEntryConfirm(turn.chave,character.nome))}>✓</button>
   <button type="button" disabled={busy} aria-label={`Remover turno ${index+1} de ${character.nome}`} onClick={()=>act(()=>onRemove(turn.chave))}>×</button>
  </div>)}
  {(!npc || !turns.length) && <div className="initiative-roster-turn">
   <label htmlFor={'new-turn-'+character.id}>{npc?'Iniciativa':'Novo turno'}</label>
   <input id={'new-turn-'+character.id} aria-label={`Nova iniciativa de ${character.nome}`} type="number" min="0" step="1" placeholder="+" value={value} disabled={busy} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}}/>
   <button type="button" disabled={busy || !valid} aria-label={`Adicionar iniciativa de ${character.nome}`} onClick={add}>+</button>
  </div>}
  </div>
  {error && <small role="alert">{error}</small>}
 </section>;
}

export default function InitiativeRoster({candidates,...props}) {
 return <div className="initiative-add initiative-roster" role="group" aria-label="Adicionar iniciativa"><strong>Inimigos e NPCs · Iniciativas</strong><div className="initiative-roster-list">{candidates.length ? candidates.map(character=><RosterCharacter key={character.id} character={character} {...props}/>) : <small>Vincule inimigos ou NPCs à campanha para adicionar iniciativas.</small>}</div></div>;
}
