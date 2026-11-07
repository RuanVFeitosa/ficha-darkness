import './ShieldInitiativeStrip.css';
import React,{useEffect,useRef,useState} from 'react';
import {atualizarModoCombate,atualizarModoInvestigacao,definirIniciativa,salvarTurnoCombate} from '../../services/mesaApi';
import {nextCombatTurn} from '../../utils/combatTurn';
import {initiativeOrder} from '../../utils/initiativeOrder';

export default function ShieldInitiativeStrip({campaign,onCampaignChange,onRefresh}) {
 const activeRef=useRef(null),lock=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[drafts,setDrafts]=useState({}),[selected,setSelected]=useState('');
 const editable=Boolean(onCampaignChange && campaign?.id);
 const run=async task=>{
  if(!editable || lock.current)return;
  lock.current=true;setBusy(true);setError('');
  try{await task();}catch(e){setError(e.message || 'Não foi possível salvar a iniciativa.');onRefresh?.();}
  finally{lock.current=false;setBusy(false);}
 };
 const changeMode=kind=>run(async()=>{
  const combat=kind==='combat',value=!(combat?campaign.combateAtivo:campaign.investigacaoAtiva);
  await (combat?atualizarModoCombate:atualizarModoInvestigacao)(campaign.id,value,false);
  onCampaignChange(current=>({...current,turnoCombate:null,...(combat?{combateAtivo:value,investigacaoAtiva:value?false:current.investigacaoAtiva}:{investigacaoAtiva:value,combateAtivo:value?false:current.combateAtivo})}));
 });
 const saveValue=entry=>{
  if(!Object.prototype.hasOwnProperty.call(drafts,entry.chave))return;
  const value=drafts[entry.chave];
  if(value==='' || !Number.isInteger(Number(value)) || Number(value)<0){setError('Informe uma iniciativa inteira maior ou igual a zero.');return;}
  return run(async()=>{
   await definirIniciativa(campaign.id,entry.chave,Number(value),entry.nome);
   onCampaignChange(current=>({...current,iniciativas:{...current.iniciativas,[entry.chave]:Number(value)}}));
   setDrafts(current=>{const next={...current};delete next[entry.chave];return next;});
  });
 };
 const active=Boolean(campaign?.combateAtivo || campaign?.investigacaoAtiva);
 const entries=active ? initiativeOrder(campaign) : [];
 const turn=campaign?.combateAtivo ? campaign.turnoCombate : null;
 const current=entries.find(entry=>entry.chave===turn?.chave);
 const target=entries.some(entry=>entry.chave===selected)?selected:(current?.chave || entries[0]?.chave || '');
 const controlTurn=(action)=>run(async()=>{
  const next=nextCombatTurn(turn,entries,action,action==='start'?target:undefined);
  const saved=await salvarTurnoCombate(campaign.id,next,turn?.revision || 0);
  onCampaignChange(previous=>(previous.turnoCombate?.revision || 0)>(saved.revision || 0)?previous:{...previous,turnoCombate:saved});
 });
 useEffect(()=>{
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  activeRef.current?.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:reduced?'auto':'smooth'});
 },[turn?.chave]);
 return <section className="shield-header-initiative" data-mode={campaign?.combateAtivo?'combat':campaign?.investigacaoAtiva?'investigation':'exploration'} aria-label="Iniciativa fixa do mestre">
  <div className="shield-initiative-caption"><strong>Iniciativa</strong><span role="status">{turn ? 'Rodada '+(turn.rodada || 1)+(turn.estado==='ativo'?' · Em andamento':' · Turno encerrado') : active ? campaign?.combateAtivo?'Combate':'Investigação' : 'Sem combate ou investigação'}</span></div>
  {entries.length ? <ol aria-label="Ordem de iniciativa">{entries.map((entry,index)=>{
   const isCurrent=entry.chave===current?.chave;
   return <li key={entry.chave} ref={isCurrent?activeRef:undefined} aria-current={isCurrent?'step':undefined} title={(index+1)+'. '+entry.nome+' · Iniciativa '+(entry.valor ?? 'não definida')+(isCurrent?' · Turno atual':'')}><span className="shield-initiative-rank">{index+1}</span><span className="shield-initiative-name">{entry.nome}</span>{editable?<input aria-label={'Iniciativa de '+entry.nome} type="number" min="0" step="1" disabled={busy} value={Object.prototype.hasOwnProperty.call(drafts,entry.chave)?drafts[entry.chave]:(entry.valor ?? '')} placeholder="—" onChange={e=>setDrafts(current=>({...current,[entry.chave]:e.target.value}))} onBlur={()=>saveValue(entry)} onKeyDown={e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}if(e.key==='Escape'){setDrafts(current=>{const next={...current};delete next[entry.chave];return next;});}}}/>:<b>{entry.valor ?? '—'}</b>}{isCurrent&&<span className="shield-initiative-current">{turn.estado==='ativo'?'Agora':'Encerrado'}</span>}</li>;
  })}</ol> : active ? <span className="shield-initiative-empty">Adicione participantes à iniciativa em Sessão.</span> : null}
  {editable&&<div className="shield-initiative-actions" role="group" aria-label="Ações da iniciativa">
   <div className="shield-initiative-modes" role="group" aria-label="Modo da sessão"><span className="shield-initiative-group-label">Sessão</span><button type="button" disabled={busy} aria-pressed={Boolean(campaign.combateAtivo)} onClick={()=>changeMode('combat')}>{campaign.combateAtivo?'Encerrar combate':'Iniciar combate'}</button><button type="button" disabled={busy} aria-pressed={Boolean(campaign.investigacaoAtiva)} onClick={()=>changeMode('investigation')}>{campaign.investigacaoAtiva?'Encerrar investigação':'Iniciar investigação'}</button></div>
   <div className="shield-initiative-turns" role="group" aria-label="Ações do turno"><span className="shield-initiative-group-label">Turno</span><select aria-label="Participante do turno no cabeçalho" disabled={busy || !campaign.combateAtivo || !entries.length} value={target} onChange={e=>setSelected(e.target.value)}>{!entries.length&&<option value="">Sem participantes</option>}{entries.map(entry=><option key={entry.chave} value={entry.chave}>{entry.nome}</option>)}</select><button type="button" disabled={busy || !campaign.combateAtivo || !target} onClick={()=>controlTurn('start')}>Iniciar turno</button><button type="button" disabled={busy || !campaign.combateAtivo || turn?.estado!=='ativo' || !current} onClick={()=>controlTurn('end')}>Encerrar turno</button><button type="button" disabled={busy || !campaign.combateAtivo || !turn || !entries.length} onClick={()=>controlTurn('next')}>{turn?.estado==='ativo'?'Encerrar e próximo':'Próximo turno'} →</button></div>
  </div>}
  {error&&<p className="shield-initiative-error" role="alert">{error}</p>}
 </section>;
}
