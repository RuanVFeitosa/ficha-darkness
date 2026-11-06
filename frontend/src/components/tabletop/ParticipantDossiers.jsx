import React from 'react';
import {ATRIBUTOS_ABSOLUTO,REGIOES} from '../../data/absolutoV1';
import './ParticipantDossiers.css';

const number=value=>value && typeof value==='object' ? value.atual ?? value.valor ?? '—' : value ?? '—';
function Resource({name,value,tone,onChange,disabled}) {
 const current=number(value),max=value && typeof value==='object'?value.max:undefined;
 const percent=Number(max)>0?Math.min(100,Math.max(0,Number(current)/Number(max)*100)):0;
 return <div className={`participant-dossier-resource ${tone || ''}`}><div><span>{name}</span><span>{onChange ? <input key={String(current)} aria-label={'Alterar '+name} type="number" min="0" max={max} defaultValue={current==='—'?'':current} disabled={disabled} onBlur={e=>{if(e.target.value!=='' && Number(e.target.value)!==Number(current))onChange(e.target.value);}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/> : current}{max!==undefined?` / ${max}`:''}</span></div><i><em style={{width:percent+'%'}}/></i></div>;
}
export default function ParticipantDossiers({members,characters,master=false,onOpen,onResourceChange,saving=false}) {
 return <div className="participant-dossiers">{members.map(member=>{
  const sheet=characters[member.ficha_id] || {},name=sheet.nome || sheet.name || member.nome,photo=sheet.fotoPerfil || sheet.profileImage;
  const attributes=sheet.atributos || sheet.attributes || {};
  return <article className="participant-dossier" key={member.id || member.ficha_id} draggable={master} onDragStart={event=>{event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('application/x-darkness-ficha',member.ficha_id);}}>
   <header className="participant-dossier-identity">
    {photo && <img className="participant-dossier-photo" src={photo} alt=""/>}
    <div className="participant-dossier-bio"><small>{({npc:'NPC',inimigo:'Inimigo',boss:'Boss'})[sheet.tipo] || 'Personagem'} · NV {sheet.nivel || sheet.level || 1}</small><h3>{name}</h3><p>{sheet.classe || sheet.occupation || ({npc:'NPC',inimigo:'Inimigo',boss:'Boss'})[sheet.tipo] || 'Jogador'}</p>{sheet.defesa!==undefined && <p>Defesa · {sheet.defesa}</p>}{sheet.jogador && <p>Jogador · {sheet.jogador}</p>}</div>
    {!!Object.keys(attributes).length && <dl>{Object.entries(attributes).map(([key,value])=><div key={key}><dt>{ATRIBUTOS_ABSOLUTO[key] || ({razao:'Razão',pulso:'Pulso',sentido:'Sentido',voz:'Voz'})[key] || key}</dt><dd>{number(value)}</dd></div>)}</dl>}
   </header>
   {!!Object.keys(sheet.membros || {}).length && <section className="participant-dossier-body"><h4>Integridade corporal</h4><div>{Object.entries(sheet.membros).map(([key,value])=><Resource key={key} name={REGIOES[key]?.nome || key} value={value} tone="body" disabled={saving} onChange={onResourceChange?next=>onResourceChange('membros',next,key):undefined}/>)}</div></section>}
   {sheet.integrity!==undefined && <Resource name="Integridade" value={sheet.integrity} tone="body"/>}
   <div className="participant-dossier-mental"><Resource name="Sanidade" value={sheet.sanidade ?? sheet.sanity} disabled={saving} onChange={onResourceChange?next=>onResourceChange('sanidade',next):undefined}/>{(sheet.esperanca!==undefined || sheet.hope!==undefined) && <Resource name="Esperança" value={sheet.esperanca ?? sheet.hope} tone="hope"/>}</div>
   {((sheet.ataques || []).length>0 || (sheet.habilidades || []).length>0) && <section className="participant-dossier-actions"><h4>Ataques e habilidades</h4>{[...(sheet.ataques || []),...(sheet.habilidades || [])].map((item,index)=><details key={item.id || index}><summary>{typeof item==='string'?item:item.nome || item.titulo || 'Ação '+(index+1)}</summary>{typeof item!=='string' && <p>{[item.descricao,item.efeito,item.dano && 'Dano: '+item.dano].filter(Boolean).join(' · ') || 'Sem descrição'}</p>}</details>)}</section>}
   {onOpen && <footer><button type="button" onClick={()=>onOpen(member,sheet)}>Consultar dossiê ↗</button></footer>}
  </article>;
 })}</div>;
}
