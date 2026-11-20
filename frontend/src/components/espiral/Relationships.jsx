import React from 'react';
import {RELATION_GRADES,relationshipBenefits} from '../../utils/relationships';
import useRelationshipMembers from '../../hooks/useRelationshipMembers';
import '../../styles/Relationships.css';

function RelationCard({relation,setSheet}) {
 const grade=Number(relation.grade) || 0;
 function changeGrade(value){
  setSheet(previous=>{
   const current=(previous.relationships || []).find(item=>item.id===relation.id);
   const next={...relation,...current,name:relation.name,photo:relation.photo,grade:grade===value?value-1:value};
   return {...previous,relationships:current?previous.relationships.map(item=>item.id===relation.id?next:item):[...(previous.relationships || []),next]};
  });
 }
 return <article className="pd-relation-person"><div className="pd-relation-person-row">
  <div className="pd-relation-person-identity"><span className="pd-relation-avatar">{relation.photo?<img src={relation.photo} alt="" onError={event=>{event.currentTarget.style.display='none';}}/>:<span aria-hidden="true">{relation.name.slice(0,1)}</span>}</span><span>{relation.name}</span></div>
  <div className="pd-relation-dots" role="group" aria-label={'Pontos de relação com '+relation.name}>{[1,2,3].map(value=><button type="button" key={value} className={value<=grade?'is-filled':''} aria-label={relation.name+': grau '+value+' · '+RELATION_GRADES[value].name} aria-pressed={value<=grade} title={RELATION_GRADES[value].name} onClick={()=>changeGrade(value)}/>)}</div>
 </div></article>;
}
export default function Relationships({sheet,setSheet,sheetId,campaign,originalSheetId}) {
 const members=useRelationshipMembers(sheetId,campaign,originalSheetId);
 const saved=sheet.relationships || [];
 const relations=[...members.map(member=>({...saved.find(item=>item.id===member.id),...member,grade:saved.find(item=>item.id===member.id)?.grade || 0})),...saved.filter(item=>!item.id.startsWith('party:')&&!members.some(member=>member.id===item.id))];
 return <section className="pd-relationships pd-relationships-simple" aria-label="Relacionamentos">
 <header className="pd-relationships-heading"><h2>Relacionamentos</h2></header>
 {relations.length?<div className="pd-relation-people">{relations.map(relation=><RelationCard key={relation.id} relation={relation} setSheet={setSheet}/>)}</div>:<p>Os personagens da mesa vinculada aparecerão aqui.</p>}
 <div className="pd-relation-reference"><table><caption>Efeitos dos pontos de Relação</caption><thead><tr><th scope="col">Pontos</th><th scope="col">Relação</th><th scope="col">Benefícios disponíveis</th></tr></thead><tbody>{[1,2,3].map(grade=><tr key={grade}><th scope="row">{grade}</th><td>{RELATION_GRADES[grade].name}</td><td><ul>{relationshipBenefits(grade).map(benefit=><li key={benefit.id}>{benefit.label}</li>)}</ul></td></tr>)}</tbody></table>
 <p>Uma invocação por relação a cada missão: escolha um dos benefícios do grau. Os dados adicionais respeitam o limite de 6 dados. Motivar gasta uma ação e recupera Esperança da pessoa; Proteger exige que ela esteja em perigo.</p></div>
 </section>;
}
