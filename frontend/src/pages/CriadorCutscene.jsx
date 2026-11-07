import React,{useEffect,useState} from 'react';
import CutsceneEditor from '../components/cutscene/CutsceneEditor';
import {campaignCutsceneAssets,cutsceneScenePayload} from '../components/cutscene/CutsceneWorkspace';
import {buscarCampanhaPorCodigo,enviarMidiaCutscene,resolverProjetoCutscene,salvarCena} from '../services/mesaApi';
import {cutsceneEditorUrl,cutsceneReturnUrl} from '../utils/cutsceneRoutes';
import '../styles/CutsceneStudio.css';

export default function CriadorCutscene() {
 const params=new URLSearchParams(window.location.search),code=params.get('campanha') || '',returnTo=params.get('retorno') || 'campaign';
 const [campaign,setCampaign]=useState(null),[sceneId,setSceneId]=useState(()=>params.get('cena') || ''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  const load=async()=>{try{
   if(!code)throw new Error('Abra o criador de cutscenes a partir de uma campanha.');
   const result=await buscarCampanhaPorCodigo(code);
   if(!result)throw new Error('Campanha não encontrada.');
   const requested=new URLSearchParams(window.location.search).get('cena');
   if(requested&&!result.cenas.some(scene=>scene.id===requested))throw new Error('A cena solicitada não está nesta campanha.');
   if(active)setCampaign(result);
  }catch(err){if(active)setError(err.message);}finally{if(active)setLoading(false);}};
  load();return()=>{active=false;};
 },[code]);
 const back=cutsceneReturnUrl(code,returnTo);
 if(loading||error)return <main className="cutscene-page cs-page-state"><span>ESTÚDIO DE CUTSCENES</span><h1>{loading?'Preparando o estúdio…':'Não foi possível abrir o projeto'}</h1>{error&&<p role="alert">{error}</p>}<a href={back}>Voltar</a></main>;
 const scene=campaign.cenas.find(item=>item.id===sceneId);
 return <main className="cutscene-page" aria-label="Estúdio de cutscenes">
  <CutsceneEditor key={sceneId || 'new'} standalone draftKey={`cutscene:draft:${campaign.id}:${sceneId || 'new'}:0`}
   navigation={<><a className="cs-studio-back" href={back} aria-label="Voltar à campanha ou tabletop">←</a><span className="cs-studio-brand">CUTSCENES<small>{campaign.nome}</small></span></>}
   initialValue={scene?.cenaEspecial?.cutscene || {name:scene?.nome || 'Nova cutscene'}} assets={campaignCutsceneAssets(campaign)} maps3D={campaign.mapas3D || []} campaign={campaign} sceneId={sceneId}
   onResolveProject={resolverProjetoCutscene} onUpload={(file,type)=>enviarMidiaCutscene(campaign.id,file,type)} busy={busy} applyLabel="Salvar na campanha"
   onApply={async project=>{setBusy(true);try{
    const saved=await salvarCena(campaign.id,cutsceneScenePayload(project,scene));
    const resolved={...saved,cenaEspecial:{...saved.cenaEspecial,cutscene:project}};
    setCampaign(current=>({...current,cenas:current.cenas.some(item=>item.id===saved.id)?current.cenas.map(item=>item.id===saved.id?resolved:item):[...current.cenas,resolved]}));
    if(!sceneId){window.history.replaceState({},'',cutsceneEditorUrl(campaign,saved.id,returnTo));setSceneId(saved.id);}
   }finally{setBusy(false);}}}/>
 </main>;
}
