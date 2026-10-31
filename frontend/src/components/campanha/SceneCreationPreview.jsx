import React, {useState} from 'react';
import Icon from '@mdi/react';
import {mdiImagePlusOutline,mdiMapOutline} from '@mdi/js';

export default function SceneCreationPreview({scene}) {
 const [selected,setSelected]=useState('');
 const images=scene.imagensCena || [], maps=scene.mapasBatalha || [];
 const media=[...images.map(item=>({...item,kind:'Imagem da cena'})),...maps.map(item=>({...item,kind:item.origem==='tabletop3d' ? 'Mapa 3D' : 'Mapa de batalha'}))];
 const active=media.find(item=>item.id===selected) || media[0];
 const source=active?.previewUrl || active?.url;
 return <aside className="scene-composer-preview" aria-label="Prévia da cena">
   <div className="scene-preview-heading"><span>PRÉVIA AO VIVO</span><span className="scene-preview-dot">Rascunho</span></div>
   <div className={`scene-preview-stage${!source ? ' is-empty' : ''}`}>
     {source ? <img src={source} alt={active.nome || active.kind}/> : <div><Icon path={active?.kind.includes('Mapa') ? mdiMapOutline : mdiImagePlusOutline} size={2}/><strong>{active?.kind==='Mapa 3D' ? 'Mapa 3D vinculado' : 'Prepare o próximo capítulo'}</strong><p>{active?.kind==='Mapa 3D' ? 'O cenário será exibido no tabletop.' : 'Adicione uma imagem ou mapa para visualizar sua cena aqui.'}</p></div>}
     {active && <span className="scene-preview-caption">{active.kind} · {active.nome || 'Sem nome'}</span>}
   </div>
   {media.length>1 && <div className="scene-preview-thumbnails" aria-label="Mídias da prévia">{media.map(item=><button type="button" key={item.id} aria-label={`Visualizar ${item.nome || item.kind}`} aria-pressed={active?.id===item.id} onClick={()=>setSelected(item.id)}>{item.previewUrl || item.url ? <img src={item.previewUrl || item.url} alt=""/> : <Icon path={mdiMapOutline} size={1}/>}</button>)}</div>}
   <div className="scene-preview-copy"><span>{scene.pasta || 'Sem pasta'}</span><h4>{scene.nome || 'Sua próxima cena'}</h4><p>{scene.descricao || 'Uma nova atmosfera, um lugar para explorar ou o início de algo inesperado.'}</p></div>
   <dl className="scene-preview-facts"><div><dt>Imagens</dt><dd>{images.length}</dd></div><div><dt>Mapas</dt><dd>{maps.length}</dd></div><div><dt>Público</dt><dd>{scene.visualizarTodos!==false ? 'Todos' : `${scene.jogadoresVisiveis?.length || 0} jogadores`}</dd></div></dl>
   <p className="scene-preview-note">Organize os materiais agora. A apresentação da cena é controlada pelo mestre no tabletop.</p>
 </aside>;
}
