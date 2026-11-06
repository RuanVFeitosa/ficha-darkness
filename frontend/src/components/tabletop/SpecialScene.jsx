import CutscenePlayer from '../cutscene/CutscenePlayer';
import React,{useEffect,useState} from 'react';
import {specialSceneMediaType} from '../../utils/specialSceneMedia';
import '../../styles/SpecialScene.css';

export function SpecialSceneMedia({special,name}) {
 if(special.cutscene)return <CutscenePlayer project={special.cutscene}/>;
 return specialSceneMediaType({url:special.midiaUrl,fallback:special.tipoMidia})==='video'
  ? <video src={special.midiaUrl} autoPlay loop={special.loop!==false} muted playsInline/>
  : <img src={special.midiaUrl} alt={name}/>;
}
export default function SpecialScene({scene,onClose}) {
 const special=scene.cenaEspecial || scene.cena_especial;
 const [audioReady,setAudioReady]=useState(false);
 useEffect(()=>{
  setAudioReady(false);
  const timer=setTimeout(()=>setAudioReady(true),Math.max(0,Number(special.atrasoAudio)||0));
  return ()=>clearTimeout(timer);
 },[special.audioUrl,special.atrasoAudio]);
 const youtube=String(special.audioUrl || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
 return <section className={`cena-especial cena-especial-${special.transicao || 'cinema'}`} aria-label={`Cena especial: ${scene.nome}`}>
  <SpecialSceneMedia special={special} name={scene.nome}/>
  <div className="cena-especial-vinheta"/>
  {!special.cutscene&&special.exibirTitulo!==false&&<div className="cena-especial-titulo"><span>{scene.descricao}</span><strong>{scene.nome}</strong></div>}
  {!special.cutscene&&audioReady&&special.audioUrl&&(youtube
   ? <iframe className="cena-especial-youtube" title="Musica da cena especial" src={`https://www.youtube.com/embed/${youtube}?autoplay=1&controls=0&loop=${special.loopAudio!==false?1:0}&playlist=${youtube}&playsinline=1&rel=0`} allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin"/>
   : <audio src={special.audioUrl} autoPlay loop={special.loopAudio!==false}/>)}
  {onClose&&<button type="button" className="cena-especial-sair" onClick={onClose}>Encerrar cena especial</button>}
 </section>;
}
