import React from 'react';
import {cutsceneEditorUrl} from '../../utils/cutsceneRoutes';
import '../../styles/Cutscene.css';
import '../../styles/CutsceneStudio.css';
export function cutsceneScenePayload(project,scene={}) {
 return {...scene,nome:project.name,descricao:scene.descricao || 'Cutscene criada no estúdio da campanha.',pasta:scene.pasta || 'Cutscenes',
  imagensCena:scene.imagensCena || [],mapasBatalha:scene.mapasBatalha || [],visualizarTodos:scene.visualizarTodos!==false,
  cenaEspecial:{...scene.cenaEspecial,ativo:true,midiaUrl:`cutscene:${scene.id || 'project'}`,tipoMidia:'cutscene',exibirTitulo:false,transicao:'fade',cutscene:project}};
}
export function campaignCutsceneAssets(campaign) {
 return [
  ...(campaign?.cenas || []).flatMap(scene=>(scene.imagensCena || []).map(image=>({...image,name:`${scene.nome} · ${image.nome || 'Imagem'}`,type:'image'}))),
  ...(campaign?.tokens || []).filter(token=>token.imagem_url).map(token=>({id:`member:${token.id}`,name:token.nome || 'Token da campanha',url:token.imagem_url,type:'token'})),
 ];
}
export default function CutsceneWorkspace({campaign}) {
 const scenes=campaign.cenas.filter(item=>item.cenaEspecial?.cutscene);
 return <section className="cs-project-library" aria-label="Projetos de cutscene">
  <header><div><span>ESTÚDIO DA CAMPANHA</span><h3>Suas histórias, em movimento.</h3><p>Abra um projeto no editor de tela inteira. As cutscenes salvas continuam disponíveis nos dois tabletops.</p></div><a className="cs-project-new" href={cutsceneEditorUrl(campaign)}>＋ Criar cutscene</a></header>
  {scenes.length?<div className="cs-project-grid">{scenes.map(scene=>{const project=scene.cenaEspecial.cutscene,cover=project.layers?.find(layer=>layer.type==='image'||layer.type==='token');return <a className="cs-project-card" key={scene.id} href={cutsceneEditorUrl(campaign,scene.id)}><div className="cs-project-cover">{cover?.src?<img src={cover.src} alt=""/>:<span>▶</span>}<span>{project.duration}s</span></div><div><small>PROJETO EDITÁVEL</small><h4>{scene.nome}</h4><p>{project.layers?.length || 0} camadas · Abrir no estúdio ↗</p></div></a>;})}</div>:<div className="cs-library-empty"><span>▣</span><h3>A próxima cena começa aqui.</h3><p>Combine cenários, tokens animados, câmera e trilha sonora em uma linha do tempo.</p><a href={cutsceneEditorUrl(campaign)}>Abrir criador de cutscenes ↗</a></div>}
 </section>;
}
