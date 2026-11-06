import React from 'react';
import {cutsceneEditorUrl} from '../../utils/cutsceneRoutes';

export default function SceneCutsceneSettings({scene,campaign,onChange}) {
 const projects=(campaign?.cenas || []).filter(item=>item.cenaEspecial?.cutscene);
 const current=scene.cenaEspecial?.cutscene;
 const sourceId=scene.cenaEspecial?.cutsceneSourceId;
 const selected=current?(projects.some(item=>item.id===sourceId)?sourceId:projects.some(item=>item.id===scene.id)?scene.id:'__current__'):'';
 const choose=id=>{
  if(!id){onChange({...scene,cenaEspecial:scene.cenaEspecial?.tipoMidia==='cutscene' || current?null:scene.cenaEspecial});return;}
  const source=projects.find(item=>item.id===id);if(!source)return;
  onChange({...scene,cenaEspecial:{...scene.cenaEspecial,ativo:true,tipoMidia:'cutscene',midiaUrl:`cutscene:${source.id}`,exibirTitulo:false,transicao:'fade',cutscene:source.cenaEspecial.cutscene,cutsceneSourceId:source.id}});
 };
 return <section className="scene-cutscene-settings" aria-label="Cutscene da cena">
  <header><div><strong><span className="scene-section-number">02</span> Cutscene</strong><p>Escolha um projeto da campanha para apresentar como cena especial no tabletop.</p></div><span className="scene-cutscene-status">{current?'Projeto adicionado':'Opcional'}</span></header>
  <label>Cutscene desta cena<select value={selected} onChange={event=>choose(event.target.value)}><option value="">Sem cutscene</option>{selected==='__current__'&&<option value="__current__">{current.name || 'Projeto desta cena'}</option>}{projects.map(item=><option key={item.id} value={item.id}>{item.nome} · {item.cenaEspecial.cutscene.duration}s</option>)}</select></label>
  {current&&<div className="scene-cutscene-summary"><strong>{current.name}</strong><span>{current.duration}s · {current.layers?.length || 0} camadas</span><button type="button" onClick={()=>choose('')}>Remover cutscene desta cena</button></div>}
  {current&&<label className="scene-cutscene-enabled"><input type="checkbox" checked={scene.cenaEspecial.ativo!==false} onChange={event=>onChange({...scene,cenaEspecial:{...scene.cenaEspecial,ativo:event.target.checked}})}/>Disponibilizar cutscene nos tabletops</label>}
  {!projects.length&&!current&&<p className="scene-cutscene-help">Nenhum projeto salvo nesta campanha. Abra o estúdio para criar a primeira cutscene.</p>}
  <div className="scene-cutscene-actions"><a href={cutsceneEditorUrl(campaign,scene.id || (current?sourceId:''))}>{current?'Editar cutscene no estúdio ↗':'Criar cutscene no estúdio ↗'}</a>{current&&<a href={cutsceneEditorUrl(campaign)}>Criar outro projeto ↗</a>}</div>
  <small>Salve as alterações da cena antes de abrir o estúdio. Ao escolher um projeto, uma cópia dele será salva nesta cena.</small>
 </section>;
}
