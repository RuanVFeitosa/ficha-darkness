import React,{useMemo} from 'react';
import {abilityEditChanges} from '../../utils/abilityEditDiff';
import '../../styles/AbilityEditDiff.css';
export default function AbilityEditDiff({current,proposal}){
 const groups=useMemo(()=>abilityEditChanges(current,proposal),[current,proposal]);
 return <section className="ability-edit-diff" aria-label="Alterações solicitadas"><p className="aed-summary">{groups.length?'Somente alterações · '+groups.length+' local(is) alterado(s)':'Nenhuma alteração de conteúdo encontrada.'}</p>{groups.map((group,i)=><article key={i}><h4>{group.location}{group.kind?' · '+group.kind:''}</h4><ul>{group.changes.map((change,j)=><li key={j} className={'aed-'+change.type}><div><strong>{change.type==='add'?'+ Adicionado':'− Removido'}</strong>{change.line && <small>{change.section?change.section+' · ':''}Linha {change.line}{change.type==='remove'?' da versão atual':' da proposta'}</small>}</div><pre>{change.text.trim()?change.text:'(espaçamento: '+change.text.replace(/ /g,'·').replace(/\n/g,'↵')+')'}</pre></li>)}</ul></article>)}</section>;
}
