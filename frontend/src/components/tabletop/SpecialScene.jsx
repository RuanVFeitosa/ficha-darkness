import CutscenePlayer from '../cutscene/CutscenePlayer';
import React,{useEffect,useState} from 'react';
import {specialSceneMediaType} from '../../utils/specialSceneMedia';
import '../../styles/SpecialScene.css';

function DestinationAction({title,items,selected,onChoose,onGo,disabled,kind}){
 return <div className="cena-especial-destination">
  {items.length>1&&<select aria-label={`${title} de destino`} value={selected?.id || ''} disabled={disabled} onChange={event=>onChoose(event.target.value)}>{items.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select>}
  <button className="cena-especial-destination-button" type="button" aria-label={kind==='map'?'Ir para o mapa de batalha':'Ir para a cena estática'} disabled={disabled || !selected} onClick={()=>onGo(selected)}><span className="cena-especial-destination-icon" aria-hidden="true">{kind==='map'?'◇':'▧'}</span><span><strong>{title}</strong><small>{selected?.label || 'Nenhum destino nesta cena'}</small></span><span aria-hidden="true">→</span></button>
 </div>;
}

export function SpecialSceneMedia({special,name,controls=true}) {
 if(special.cutscene)return <CutscenePlayer project={special.cutscene} controls={controls}/>;
 return specialSceneMediaType({url:special.midiaUrl,fallback:special.tipoMidia})==='video'
  ? <video src={special.midiaUrl} autoPlay loop={special.loop!==false} muted playsInline/>
  : <img src={special.midiaUrl} alt={name}/>;
}
export default function SpecialScene({scene,onClose,destinations={maps:[],images:[]},onNavigate,busy=false}) {
 const special=scene.cenaEspecial || scene.cena_especial;
 const [audioReady,setAudioReady]=useState(false);
 const [mapId,setMapId]=useState(''),[imageId,setImageId]=useState(''),[navigating,setNavigating]=useState(false),[error,setError]=useState('');
 const maps=destinations.maps.filter(item=>item.scene.id===scene.id),images=destinations.images.filter(item=>item.scene.id===scene.id);
 const chosen=(items,id)=>items.find(item=>item.id===id) || items[0];
 const map=chosen(maps,mapId),image=chosen(images,imageId);
 const navigate=async target=>{
  if(!target || busy || navigating)return;
  setNavigating(true);setError('');
  try {if(await onNavigate(target)===false)setError('Não foi possível trocar a cena. Tente novamente.');}
  catch(err){setError(err.message || 'Não foi possível trocar a cena. Tente novamente.');}
  finally{setNavigating(false);}
 };
 useEffect(()=>{
  setAudioReady(false);
  const timer=setTimeout(()=>setAudioReady(true),Math.max(0,Number(special.atrasoAudio)||0));
  return ()=>clearTimeout(timer);
 },[special.audioUrl,special.atrasoAudio]);
 const youtube=String(special.audioUrl || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
 return <section className={`cena-especial cena-especial-${special.transicao || 'cinema'}`} aria-label={`Cena especial: ${scene.nome}`}>
  <SpecialSceneMedia special={special} name={scene.nome} controls={Boolean(onClose || onNavigate)}/>
  <div className="cena-especial-vinheta"/>
  {!special.cutscene&&special.exibirTitulo!==false&&<div className="cena-especial-titulo"><span>{scene.descricao}</span><strong>{scene.nome}</strong></div>}
  {!special.cutscene&&audioReady&&special.audioUrl&&(youtube
   ? <iframe className="cena-especial-youtube" title="Musica da cena especial" src={`https://www.youtube.com/embed/${youtube}?autoplay=1&controls=0&loop=${special.loopAudio!==false?1:0}&playlist=${youtube}&playsinline=1&rel=0`} allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin"/>
   : <audio src={special.audioUrl} autoPlay loop={special.loopAudio!==false}/>)}
  {(onClose || onNavigate)&&<nav className="cena-especial-actions" aria-label="Destinos após a cutscene">
   <div className="cena-especial-identity"><span>{special.cutscene?'CUTSCENE':'APRESENTAÇÃO'}<i>•</i> CENA ATUAL</span><strong>{special.cutscene?scene.nome:'Continuar a cena'}</strong></div>
   {onNavigate&&<>
    <DestinationAction title="Mapa de batalha" kind="map" items={maps} selected={map} onChoose={setMapId} onGo={navigate} disabled={busy || navigating}/>
    <DestinationAction title="Cena estática" kind="image" items={images} selected={image} onChoose={setImageId} onGo={navigate} disabled={busy || navigating}/>
   </>}
   {onClose&&<button type="button" className="cena-especial-sair" aria-label="Encerrar cena especial" title="Encerrar cena especial" disabled={busy || navigating} onClick={onClose}>×</button>}
   {error&&<p role="alert">{error}</p>}
  </nav>}
 </section>;
}
