import React,{useEffect,useState} from 'react';
import {buscarPersonagem} from '../../services/personagemApi';
import {buscarFichaEspiral} from '../../services/espiralApi';
import {integrityMax} from '../../data/espiral';
import {protocolDefenses,isProtocolSheet} from '../../data/protocoloDarkness';
import {tabletopCharacterId} from '../../utils/tabletopCharacters';
import './PlayerSheetSummaries.css';
const attrNames={pulso:'Pulso',razao:'Razão',sentido:'Sentido',voz:'Voz'};
const value=number=>number && typeof number==='object' ? number.atual ?? number.valor ?? '—' : number ?? '—';
function Vital({label,current,max,tone}) {
 const amount=value(current),limit=current&&typeof current==='object'?current.max:max;
 return <div className="shield-player-vital" data-tone={tone} data-empty={amount===0 || undefined}><dt>{label}</dt><dd>{amount}{limit!=null&&<small> / {limit}</small>}</dd>{Number(limit)>0&&<span aria-hidden="true"><i style={{width:Math.max(0,Math.min(100,Number(amount)/Number(limit)*100))+'%'}}/></span>}</div>;
}
export default function PlayerSheetSummaries({members=[],characters={},active=true}) {
 const eligible=members.filter(member=>member.ficha_id && member.papel!=='mestre' && !/^(inimigo|npc|custom3d):/.test(member.ficha_id));
 const signature=JSON.stringify([...new Set(eligible.map(member=>String(member.ficha_id)))]);
 const [sheets,setSheets]=useState({});
 useEffect(()=>{
  if(!active)return;
  let alive=true,pending=false;
  const ids=JSON.parse(signature);
  const refresh=async()=>{
   if(pending || document.hidden)return;pending=true;
   const results=await Promise.allSettled(ids.map(async id=>{
    const canonical=tabletopCharacterId(id),plain=canonical.replace(/^(espiral|darkness):/,'');
    const sheet=canonical.startsWith('espiral:')?await buscarFichaEspiral(plain):await buscarPersonagem(plain);
    return {id,sheet};
   }));
   if(alive)setSheets(previous=>{const next={...previous};results.forEach(result=>{if(result.status==='fulfilled' && result.value.sheet)next[result.value.id]=result.value.sheet;});return next;});
   pending=false;
  };
  refresh();const timer=setInterval(refresh,30000);
  window.addEventListener('focus',refresh);window.addEventListener('storage',refresh);
  return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('storage',refresh);};
 },[signature,active]);
 if(!eligible.length)return <p className="shield-player-empty">Vincule as fichas dos jogadores à campanha para acompanhar seus resumos aqui.</p>;
 return <div className="shield-player-cards">{eligible.map(member=>{
  const id=String(member.ficha_id),sheet=sheets[id] || characters[id] || characters[tabletopCharacterId(id)];
  const name=sheet?.name || sheet?.nome || member.nome || 'Personagem';
  const photo=sheet?.profileImage || sheet?.fotoPerfil;
  const attributes=sheet?.attributes || sheet?.atributos;
  const protocol=isProtocolSheet(sheet);
  const defense=protocol ? protocolDefenses(attributes):null;
  return <article className="shield-player-card" key={member.id || id} aria-label={'Resumo de '+name}>
   <header><div className="shield-player-portrait">{photo?<img src={photo} alt="" onError={e=>{e.currentTarget.hidden=true;}}/>:<span aria-hidden="true">{name.slice(0,1)}</span>}</div><div><small>{protocol?'PROTOCOLO DARKNESS':'FICHA DO JOGADOR'}</small><h3>{name}</h3>{(sheet?.occupation || sheet?.classe)&&<p>{sheet.occupation || sheet.classe}</p>}{(sheet?.player || sheet?.jogador)&&<span>{sheet.player || sheet.jogador}</span>}</div>{sheet?.pavor?.active&&<b className="shield-player-pavor">Pavor</b>}</header>
   {attributes?<><dl className="shield-player-vitals"><Vital label="Integridade" current={sheet.integrity ?? sheet.integridade} max={sheet.integrity!=null && Number.isFinite(Number(attributes.pulso))?integrityMax(Number(attributes.pulso)):undefined} tone="integrity"/><Vital label="Sanidade" current={sheet.sanity ?? sheet.sanidade} max={sheet.sanity!=null?10:undefined} tone="sanity"/><Vital label="Esperança" current={sheet.hope ?? sheet.esperanca} max={sheet.hope!=null?10:undefined} tone="hope"/></dl>
   {defense&&<dl className="shield-player-defenses"><div><dt>Esquiva</dt><dd>{defense.dodge}</dd></div><div><dt>Defesa</dt><dd>{defense.base}</dd></div><div><dt>Bloqueio</dt><dd>{defense.block}</dd></div>{sheet.pressure!=null&&<div><dt>Pressão</dt><dd>{sheet.pressure}</dd></div>}</dl>}
   <dl className="shield-player-attributes">{Object.entries(attrNames).filter(([id])=>attributes[id]!=null).map(([id,label])=><div key={id}><dt>{label}</dt><dd title={label+' · grau '+value(attributes[id])}>{typeof attributes[id]==='number'?'d'+(attributes[id]*2+2):value(attributes[id])}</dd></div>)}</dl></>:<p className="shield-player-unavailable">Ficha indisponível no momento.</p>}
  </article>;
 })}</div>;
}
