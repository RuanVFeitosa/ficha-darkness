import CutsceneTokenControls from './CutsceneTokenControls';
import CutsceneWeatherControls from './CutsceneWeatherControls';
import React,{lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import CameraMotionControls,{normalizeCameraMotion} from '../tabletop/CameraMotionControls';
import CameraSpeedControls from '../tabletop/CameraSpeedControls';
import useCameraSpeedShortcut from '../tabletop/useCameraSpeedShortcut';
import {CAMERA_SPEED_KEY,normalizeCameraSpeed} from '../../utils/cameraSpeed';
import {snapshotCutsceneMap,splitCameraClip,validCameraPose,validCameraRecording,cameraPositionedToken,cameraRecordingPose,cameraClipTime} from '../../utils/cameraCutscene';
import {cutsceneId,emptyCutscene,limit,moveCutsceneClip,newCutsceneLayer,normalizeCutscene,parseCutsceneProject,persistCutsceneSources} from '../../utils/cutscene';
import {readTokenAnimations} from '../../utils/tokenAnimation';
import {SPECIAL_SCENE_ACCEPT,specialSceneMime} from '../../utils/specialSceneMedia';
import {ACEITAR_AUDIO} from '../../utils/audioUpload';
import CutsceneStage from './CutsceneStage';
import useCutsceneClock from './useCutsceneClock';
import '../../styles/Cutscene.css';
const CutsceneMap3D=lazy(()=>import('./CutsceneMap3D'));

export default function CutsceneEditor({initialValue,assets=[],maps3D=[],campaign={},sceneId,onApply,onUpload,busy=false,applyLabel='Aplicar à cena',draftKey,onDraftChange,onResolveProject,standalone=false,navigation}) {
 const [history,setHistory]=useState(()=>{
  const initial=normalizeCutscene(initialValue || emptyCutscene());
  let present=initial;
  try {const draft=JSON.parse(localStorage.getItem(draftKey));if(draft?.base===JSON.stringify(persistCutsceneSources(initial)))present=normalizeCutscene(draft.project);}catch{}
  return {past:[],present,future:[]};
 });
 const project=history.present;
 const [captureScene,setCaptureScene]=useState(null),[recording3D,setRecording3D]=useState(false),[recordedSeconds,setRecordedSeconds]=useState(0),[mapId,setMapId]=useState(maps3D[0]?.id || '');
 const [cameraView,setCameraView]=useState('room'),[captureTarget,setCaptureTarget]=useState(''),[captureFocusRequest,setCaptureFocusRequest]=useState(0),[captureShoulder,setCaptureShoulder]=useState(1);
 useEffect(()=>{
  if(!captureScene || !captureTarget)return;
  const switchShoulder=event=>{if(event.key.toLowerCase()==='v' && event.target?.matches?.('.cs-map-capture canvas')){event.preventDefault();setCaptureShoulder(value=>-value);}};
  window.addEventListener('keydown',switchShoulder);return()=>window.removeEventListener('keydown',switchShoulder);
 },[captureScene,captureTarget]);
 const [captureSpeed,setCaptureSpeed]=useState(()=>{try{return normalizeCameraSpeed(localStorage.getItem(CAMERA_SPEED_KEY) ?? 1);}catch{return 1;}});
 const [captureMotion,setCaptureMotion]=useState(()=>{try{return normalizeCameraMotion(JSON.parse(localStorage.getItem('darkness:cutscene:camera-motion') || 'null'));}catch{return normalizeCameraMotion();}});
 useCameraSpeedShortcut(setCaptureSpeed,setCaptureMotion,Boolean(captureScene),'.cs-map-capture canvas');
 useEffect(()=>{try{localStorage.setItem(CAMERA_SPEED_KEY,String(captureSpeed));localStorage.setItem('darkness:cutscene:camera-motion',JSON.stringify(captureMotion));}catch{}},[captureSpeed,captureMotion]);
 const capturePose=useRef(null),recordBuffer=useRef(null),recordFinished=useRef(null);
 const [selectedTokenId,setSelectedTokenId]=useState('');
 const [selected,setSelected]=useState(''),[pose,setPose]=useState('from'),[error,setError]=useState(''),[uploading,setUploading]=useState(false),[muted,setMuted]=useState(true);
 const [notice,setNotice]=useState(''),[assetId,setAssetId]=useState(''),[saveVersion,setSaveVersion]=useState(0);
 const [assetTab,setAssetTab]=useState('media'),[assetSearch,setAssetSearch]=useState(''),[timelineZoom,setTimelineZoom]=useState(1),[timelineHeight,setTimelineHeight]=useState(34),[previewZoom,setPreviewZoom]=useState(1);
 const previewRef=useRef(null),resizeStart=useRef(null);
 const clock=useCutsceneClock(project.duration,project.loop);
 const inputRef=useRef(null),importRef=useRef(null),audioRef=useRef(null),clipDrag=useRef(null);
 const saved=useRef(JSON.stringify(persistCutsceneSources(normalizeCutscene(initialValue || emptyCutscene())))),draftChange=useRef(onDraftChange);
 const projectDirty=useMemo(()=>JSON.stringify(persistCutsceneSources(project))!==saved.current,[project,saveVersion]);
 const initialProject=useRef(project),resolveProject=useRef(onResolveProject);
 useEffect(()=>{let active=true;if(resolveProject.current)resolveProject.current(initialProject.current).then(resolved=>{if(active)setHistory(current=>current.past.length?current:{...current,present:normalizeCutscene(resolved)});}).catch(err=>setError(err.message));return()=>{active=false;};},[]);
 draftChange.current=onDraftChange;
 useEffect(()=>{
  const content=JSON.stringify(persistCutsceneSources(project));
  if(content===saved.current)return;
  draftChange.current?.(project);
  if(draftKey)try{localStorage.setItem(draftKey,JSON.stringify({base:saved.current,project:persistCutsceneSources(project)}));}catch{setError('Não foi possível guardar o rascunho neste navegador. Salve na campanha ou exporte o projeto.');}
  const leave=event=>{event.preventDefault();event.returnValue='';};
  window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);
 },[project,draftKey,saveVersion]);
 const library=useMemo(()=>[...assets,...readTokenAnimations().map(token=>({id:`token:${token.id}`,name:token.name || 'Token animado',url:token.image,animation:token.animation,type:'token'})),...project.layers.filter(item=>item.src).map(item=>({id:item.id,name:item.name,url:item.src,urlPersistida:item.srcPersistida,type:item.type,animation:item.animation}))].filter(asset=>asset.url).filter((asset,index,list)=>list.findIndex(item=>item.url===asset.url)===index),[assets,project.layers]);
 const layer=project.layers.find(item=>item.id===selected);
 const commit=next=>{setHistory(current=>({past:[...current.past,current.present].slice(-40),present:normalizeCutscene(typeof next==='function'?next(current.present):next),future:[]}));setNotice('');};
 const patchLayer=patch=>commit(current=>({...current,layers:current.layers.map(item=>item.id===selected?{...item,...patch}:item)}));
 const addLayer=(type,patch={})=>{
  if(type==='token'){
   const mapLayer=project.layers.filter(item=>item.type==='map3d' && !item.hidden && clock.time>=item.start && clock.time<=item.end && item.recording3D && item.map3D).at(-1);
   const scene=captureScene || mapLayer?.map3D;
   if(scene){
    const pose=captureScene?capturePose.current:cameraRecordingPose(mapLayer.recording3D,cameraClipTime(mapLayer,clock.time));
    const token=cameraPositionedToken(cutsceneId(),patch,pose);
    if(!token){setError('Aguarde o carregamento da câmera antes de posicionar o token.');return;}
    const nextScene={...scene,tokens:[...(scene.tokens || []),token]};
    setSelectedTokenId(token.id);
    if(captureScene){setCaptureScene(nextScene);if(recordBuffer.current)recordBuffer.current.scene=nextScene;}
    else {commit(current=>({...current,layers:current.layers.map(item=>item.id===mapLayer.id?{...item,map3D:nextScene}:item)}));setSelected(mapLayer.id);}
    setNotice('Token posicionado onde a câmera está. Afaste a câmera para vê-lo no mapa.');
    clock.setPlaying(false);return;
   }
  }
  const item=newCutsceneLayer(type,project.duration,patch);commit(current=>({...current,layers:[...current.layers,item]}));setSelected(item.id);clock.setTime(item.start+.6);clock.setPlaying(false);};
 const addRecording=(scene,recording,name)=>{

  const length=recording.frames.at(-1).time,start=clock.time,duration=Math.max(project.duration,start+length);
  const item=newCutsceneLayer('map3d',duration,{name:name || scene.name || 'Percurso 3D',map3D:scene,recording3D:recording,cameraMotion3D:captureMotion,navigationSpeed3D:captureSpeed,sourceIn:0,playbackRate:1,start,end:start+length,fadeIn:0,fadeOut:0});
  commit({...project,duration,layers:[...project.layers,item]});setSelected(item.id);clock.setTime(start);clock.setPlaying(false);setCaptureScene(null);
 };
 const finishRecording=()=>{
  const buffer=recordBuffer.current;if(!buffer)return;
  const time=(performance.now()-buffer.startedAt)/1000;
  if(validCameraPose(capturePose.current) && time>buffer.frames.at(-1).time)buffer.frames.push({...capturePose.current,time});
  recordBuffer.current=null;setRecording3D(false);
  const recording={frames:buffer.frames};
  if(validCameraRecording(recording))addRecording(buffer.scene,recording);
  else setError('Grave um percurso antes de encerrar.');
 };
 recordFinished.current=finishRecording;
 useEffect(()=>{
  if(!recording3D)return;
  const timer=setInterval(()=>{
   const buffer=recordBuffer.current;if(!buffer)return;
   const time=(performance.now()-buffer.startedAt)/1000;
   if(validCameraPose(capturePose.current) && time>buffer.frames.at(-1).time)buffer.frames.push({...capturePose.current,time});
   setRecordedSeconds(time);
  },100);
  const key=event=>{if(event.key==='Escape')recordFinished.current();};
  window.addEventListener('keydown',key);
  return()=>{clearInterval(timer);window.removeEventListener('keydown',key);};
 },[recording3D]);
 const startRecording=()=>{
  if(!captureScene || !validCameraPose(capturePose.current)){setError('Abra um mapa 3D e aguarde o carregamento da câmera.');return;}
  clock.setPlaying(false);setRecordedSeconds(0);setRecording3D(true);
  recordBuffer.current={startedAt:performance.now(),scene:captureScene,frames:[{...capturePose.current,time:0}]};
 };
 const changeSource=(sourceIn,sourceOut,playbackRate=layer.playbackRate)=>{
  const length=layer.recording3D.frames.at(-1).time;
  const from=limit(sourceIn,0,length-.1),to=limit(sourceOut,from+.1,length);
  const end=layer.start+(to-from)/playbackRate;
  commit({...project,duration:Math.max(project.duration,end),layers:project.layers.map(item=>item.id===layer.id?{...item,sourceIn:from,playbackRate,end}:item)});
 };
 const undo=()=>{clock.setPlaying(false);setHistory(current=>!current.past.length?current:{past:current.past.slice(0,-1),present:current.past[current.past.length-1],future:[current.present,...current.future]});};
 const redo=()=>{clock.setPlaying(false);setHistory(current=>!current.future.length?current:{past:[...current.past,current.present],present:current.future[0],future:current.future.slice(1)});};
 const upload=async(file,type)=>{
  if(!file)return;
  setError('');setUploading(true);
  try{
   if(type!=='audio'&&!specialSceneMime(file).startsWith('image/'))throw new Error('Para esta camada, escolha uma imagem ou GIF.');
   if(!onUpload)throw new Error('Salve a campanha antes de importar arquivos.');
   const asset=await onUpload(file,type==='audio'?'audio':'especial');
   addLayer(type,{name:file.name.replace(/\.[^.]+$/,''),...(typeof asset==='string'?{src:asset}:asset)});
  }catch(err){setError(err.message || 'Não foi possível importar o arquivo.');}finally{setUploading(false);}
 };
 const number=(label,value,change,min,max,step=.1)=><label>{label}<input type="number" min={min} max={max} step={step} value={value} onChange={event=>change(Number(event.target.value))}/></label>;
 const save=async()=>{setError('');try{if(!project.layers.length)throw new Error('Adicione pelo menos uma camada antes de salvar.');await onApply?.(project);saved.current=JSON.stringify(persistCutsceneSources(project));setSaveVersion(value=>value+1);if(draftKey)try{localStorage.removeItem(draftKey);}catch{}setNotice('Cutscene aplicada.');}catch(err){setError(err.message || 'Não foi possível salvar a cutscene.');}};
 const moveOrder=delta=>{const index=project.layers.findIndex(item=>item.id===selected),next=index+delta;if(next<0||next>=project.layers.length)return;const layers=[...project.layers];[layers[index],layers[next]]=[layers[next],layers[index]];commit({...project,layers});};
 const exportProject=()=>{const blob=new Blob([JSON.stringify(persistCutsceneSources(project),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${project.name.replace(/[^\w-]/g,'_')}.cutscene.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const projectControls=<div className="cs-project-bar">{!standalone&&<label>Nome da cutscene<input maxLength={120} value={project.name} onChange={event=>commit({...project,name:event.target.value})}/></label>}{number('Duração (s)',project.duration,value=>commit({...project,duration:limit(value,1,Number.MAX_VALUE,20)}),1,undefined,1)}<label>Fundo<input type="color" value={project.background} onChange={event=>commit({...project,background:event.target.value})}/></label><label className="cs-check"><input type="checkbox" checked={project.letterbox} onChange={event=>commit({...project,letterbox:event.target.checked})}/>Barras de cinema</label><label className="cs-check"><input type="checkbox" checked={project.loop} onChange={event=>commit({...project,loop:event.target.checked})}/>Repetir</label></div>;
 return <section className={`cs-editor ${standalone?'cs-editor-studio':''}`} style={{'--cs-timeline-height':`${timelineHeight}dvh`}} aria-label="Criador de cutscenes" onKeyDown={event=>{
  if(/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
  if(event.code==='Space'&&event.target===event.currentTarget){event.preventDefault();clock.toggle();}
 }} tabIndex={0}>
  <header className="cs-header"><div className="cs-studio-project">{standalone?<>{navigation}<label className="cs-studio-name">Nome da cutscene<input maxLength={120} value={project.name} onChange={event=>commit({...project,name:event.target.value})}/></label><span className="cs-studio-save-state">{!projectDirty?'Salvo':'Rascunho'}</span></>:<><span>ESTÚDIO / CUTSCENES</span><h3>Dê movimento à sua história.</h3><p>Monte imagens e tokens em camadas, marque os tempos e apresente a cena na mesa.</p></>}</div><div className="cs-actions"><button type="button" onClick={undo} disabled={!history.past.length}>Desfazer</button><button type="button" onClick={redo} disabled={!history.future.length}>Refazer</button><button type="button" onClick={()=>importRef.current?.click()}>Importar projeto</button><button type="button" onClick={exportProject}>Exportar projeto</button><button type="button" className="cs-primary" disabled={busy||uploading||recording3D} onClick={save}>{busy?'Salvando…':applyLabel}</button></div></header>
  <input ref={importRef} hidden type="file" accept=".json,application/json" aria-label="Importar projeto de cutscene" onChange={async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;try{const text=await file.text();const imported=parseCutsceneProject(text);commit(onResolveProject?await onResolveProject(imported):imported);setSelected('');clock.setTime(0);clock.setPlaying(false);}catch(err){setError(err.message);}}}/>
  {!standalone&&projectControls}
  {error&&<p className="cs-error" role="alert">{error}</p>}{notice&&<p className="cs-notice" role="status">{notice}</p>}
  <div className="cs-layout">
   <aside className="cs-assets">{standalone&&<nav className="cs-tool-rail" aria-label="Ferramentas do estúdio">{[['media','▧','Mídia'],['text','T','Texto'],['audio','♫','Áudio'],['map3d','▧','Mapas 3D'],['camera','◎','Câmera'],['project','⚙','Projeto']].map(([id,icon,label])=><button type="button" key={id} aria-label={label} title={label} aria-pressed={assetTab===id} onClick={()=>setAssetTab(id)}><span aria-hidden="true">{icon}</span><small>{label}</small></button>)}</nav>}<div className="cs-assets-content"><section hidden={standalone&&assetTab!=='media'}><h4>Arquivos e tokens</h4><div className="cs-add-grid"><button type="button" disabled={uploading} onClick={()=>inputRef.current?.click()}>＋ Imagem / GIF</button></div>
    <input ref={inputRef} hidden type="file" accept={SPECIAL_SCENE_ACCEPT.replace(/video\/[^,]+,?/g,'').replace(/\.mp4,?|\.webm,?/g,'')} aria-label="Adicionar imagem à cutscene" onChange={event=>{upload(event.target.files?.[0],'image');event.target.value='';}}/>
    <input ref={audioRef} hidden type="file" accept={ACEITAR_AUDIO} aria-label="Adicionar áudio à cutscene" onChange={event=>{upload(event.target.files?.[0],'audio');event.target.value='';}}/>
    {uploading&&<p role="status">Importando arquivo…</p>}
    <label className="cs-asset-search">Buscar arquivos<input type="search" value={assetSearch} onChange={event=>setAssetSearch(event.target.value)} placeholder="Imagem, cenário, token…"/></label>
    <div className="cs-asset-grid">{library.filter(asset=>asset.type!=='audio'&&(asset.name || asset.nome || '').toLowerCase().includes(assetSearch.toLowerCase())).map((asset,index)=><button type="button" key={`${asset.id}:${index}`} title={asset.name || asset.nome} aria-label={`Adicionar ${asset.name || asset.nome || 'imagem'} à cena`} onClick={()=>addLayer(asset.type || 'image',{name:asset.name || asset.nome,src:asset.url,srcPersistida:asset.urlPersistida,animation:asset.animation})}><div><img src={asset.url} alt="" loading="lazy"/></div><span>{asset.name || asset.nome || 'Imagem'}</span><small>{asset.type==='token'?'TOKEN ANIMADO':'IMAGEM'}</small></button>)}</div>
    {!library.length&&<p className="cs-library-hint">Importe uma imagem ou use os tokens e cenários salvos na campanha. Os arquivos aparecem aqui.</p>}
    <details className="cs-library-select" open={!standalone || undefined}><summary>Selecionar na biblioteca</summary><label>Biblioteca da campanha<select value={assetId} onChange={event=>setAssetId(event.target.value)}><option value="">Escolha uma imagem ou token</option>{library.map((asset,index)=><option value={index} key={`${asset.id}:${index}`}>{asset.name || asset.nome || 'Imagem'}</option>)}</select></label><button type="button" disabled={assetId===''} onClick={()=>{const asset=library[Number(assetId)];if(asset)addLayer(asset.type || 'image',{name:asset.name || asset.nome,src:asset.url,srcPersistida:asset.urlPersistida,animation:asset.animation});}}>Adicionar da biblioteca</button></details>
    <p className="cs-help">Use PNG ou WebP transparente para tokens recortados. As animações do Estúdio de tokens são incluídas na biblioteca.</p>
    </section><section hidden={standalone&&assetTab!=='text'}><h4>Texto e legendas</h4><p className="cs-help">Títulos de abertura, falas e legendas com entrada e saída na linha do tempo.</p><button type="button" onClick={()=>addLayer('text')}>＋ Texto / legenda</button><button type="button" onClick={()=>addLayer('text',{text:'Uma nova história começa…',name:'Título de abertura',fontSize:7,from:{x:50,y:50},to:{x:50,y:50}})}>＋ Título de abertura</button></section>
    <section hidden={standalone&&assetTab!=='audio'}><h4>Áudio da cutscene</h4><p className="cs-help">Importe trilhas e efeitos. Ajuste volume, entrada, saída e fades nas propriedades.</p><button type="button" disabled={uploading} onClick={()=>audioRef.current?.click()}>＋ Áudio</button>{library.filter(asset=>asset.type==='audio').map(asset=><button type="button" key={asset.id} onClick={()=>addLayer('audio',{name:asset.name,src:asset.url,srcPersistida:asset.urlPersistida})}>♫ {asset.name}</button>)}</section>
    <section hidden={standalone&&assetTab!=='map3d'}><h4>Mapa e câmera 3D</h4><p className="cs-help">Grave um passeio no mapa. Depois apare, divida e combine os planos na linha do tempo. O cenário e as posições dos tokens ficam guardados no clipe.</p>
     <label>Mapa da campanha<select value={mapId} disabled={recording3D} onChange={event=>setMapId(event.target.value)}><option value="">Selecione um mapa 3D</option>{maps3D.map(map=><option key={map.id} value={map.id}>{map.nome}</option>)}</select></label>
     <button type="button" disabled={recording3D || !mapId} onClick={()=>{const map=maps3D.find(item=>item.id===mapId);if(map){clock.setPlaying(false);capturePose.current=null;setCaptureTarget('');setCaptureFocusRequest(0);setCaptureScene(snapshotCutsceneMap(map,campaign));}}}>Abrir mapa no palco</button>
     {captureScene&&<><CutsceneWeatherControls value={captureScene.weather} disabled={recording3D} onChange={weather=>setCaptureScene(current=>({...current,weather}))}/><label>Modo de câmera<select value={cameraView} onChange={event=>setCameraView(event.target.value)}>{[['room','Cena'],['cinema','Cinema'],['panorama','Panorâmica'],['detail','Detalhe'],['firstPerson','Primeira pessoa / olhar fixo']].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>Alvo da câmera<select value={captureTarget} onChange={event=>{setCaptureTarget(event.target.value);setCaptureFocusRequest(value=>value+1);}}><option value="">Câmera livre</option>{captureScene.tokens.map(token=><option key={token.id} value={token.id}>{token.name}</option>)}</select></label>{captureTarget&&<><button type="button" onClick={()=>setCaptureFocusRequest(value=>value+1)}>Reenquadrar alvo</button><button type="button" onClick={()=>setCaptureShoulder(value=>-value)}>Ombro {captureShoulder===1?'direito':'esquerdo'} · V</button></>}<CameraSpeedControls value={captureSpeed} onChange={setCaptureSpeed}/><CameraMotionControls cinematic value={captureMotion} onChange={setCaptureMotion}/><p className="cs-help">Ctrl + roda: velocidade · Shift + roda: inclinação lateral.</p><p className="cs-help">Direito + arrastar: olhar sem sair do lugar. Esquerdo: orbitar (em primeira pessoa, olhar fixo). Shift + arrastar: deslocar. Roda: zoom. WASD / setas: mover. Q/E: descer/subir. Velocidade mínima: 0,01×.</p><button type="button" disabled={recording3D} onClick={startRecording}>● Gravar câmera 3D</button><button type="button" disabled={!recording3D} onClick={finishRecording}>Encerrar e adicionar à timeline</button><button type="button" disabled={recording3D} onClick={()=>setCaptureScene(null)}>Voltar à montagem</button></>}
     {recording3D&&<output>Gravando · {recordedSeconds.toFixed(1)} s · Sem limite de duração · Esc encerra</output>}
     {!maps3D.length&&<p className="cs-help">Salve um mapa 3D nesta campanha para gravar uma cinemática.</p>}
     {(maps3D.find(map=>map.id===mapId)?.cameraCutscenes || []).filter(clip=>validCameraRecording(clip) && (!clip.sceneId || clip.sceneId===sceneId)).map(clip=><button type="button" key={clip.id} disabled={recording3D} onClick={()=>addRecording(snapshotCutsceneMap(maps3D.find(map=>map.id===mapId),campaign),clip,clip.name)}>Importar percurso: {clip.name}</button>)}
    </section>
    <section hidden={standalone&&assetTab!=='camera'}><details open={standalone || undefined}><summary>Câmera da cena</summary><p className="cs-help">Enquadramento de toda a composição, do início ao fim.</p>{['from','to'].map((key,index)=><div className="cs-camera-fields" key={key}><strong>{index?'Final':'Inicial'}</strong>{[['x','Centro X',0,100],['y','Centro Y',0,100],['scale','Zoom',.2,4]].map(([field,label,min,max])=><React.Fragment key={field}>{number(`${label} da câmera ${index?'final':'inicial'}`,project.camera[key][field],value=>commit({...project,camera:{...project.camera,[key]:{...project.camera[key],[field]:value}}}),min,max)}</React.Fragment>)}</div>)}</details></section>
    {standalone&&<section hidden={assetTab!=='project'}><h4>Configurações do projeto</h4>{projectControls}<p className="cs-help">O projeto fica salvo na campanha e pode ser apresentado nos dois tabletops.</p></section>}
   </div></aside>
   <div className="cs-preview"><div className="cs-preview-canvas" ref={previewRef}><div className="cs-preview-fit" style={{transform:`scale(${previewZoom})`}}>{captureScene ? <div className="cs-stage cs-map-capture"><Suspense fallback={<span>Carregando mapa 3D…</span>}><CutsceneMap3D scene={captureScene} time={recording3D?recordedSeconds:0} interactive poseRef={capturePose} cameraSpeed={captureSpeed} cameraMotion={captureMotion} cameraView={cameraView} focusToken={captureScene.tokens.find(token=>token.id===captureTarget) || null} focusRequest={captureFocusRequest} shoulderSide={captureShoulder} onSelectToken={setSelectedTokenId}/></Suspense></div> : <CutsceneStage project={project} time={clock.time} playing={clock.playing} muted={muted} selected={selected} onSelectToken={id=>{clock.setPlaying(false);setSelectedTokenId(id);}} onSelect={setSelected} onDrag={(id,position)=>{clock.setPlaying(false);commit(current=>({...current,layers:current.layers.map(item=>item.id===id?{...item,[pose]:{...item[pose],...position}}:item)}));}}/>}</div></div>
    <div className="cs-transport"><button type="button" onClick={()=>{clock.setTime(0);clock.setPlaying(false);}}>↤ Início</button><button type="button" className="cs-primary" onClick={()=>{setCaptureScene(null);clock.toggle();}} disabled={recording3D}>{clock.playing?'Pausar':'Reproduzir'}</button><button type="button" onClick={()=>setMuted(value=>!value)}>{muted?'Ouvir áudio':'Silenciar'}</button><output>{clock.time.toFixed(1)}s / {project.duration}s</output><label className="cs-preview-zoom">Prévia<select value={previewZoom} onChange={event=>setPreviewZoom(Number(event.target.value))}><option value={.5}>50%</option><option value={1}>Ajustar</option><option value={1.5}>150%</option><option value={2}>200%</option></select></label><button type="button" onClick={()=>previewRef.current?.requestFullscreen?.()}>Tela cheia</button></div>
    <label className="cs-scrubber">Posição na linha do tempo<input aria-label="Posição na linha do tempo" type="range" min={0} max={project.duration} step={.05} value={clock.time} onChange={event=>{clock.setPlaying(false);clock.setTime(Number(event.target.value));}}/></label>
    {!project.layers.length&&<div className="cs-empty"><strong>Uma tela em branco. Uma história inteira.</strong><p>Adicione um cenário da biblioteca, um token e uma legenda para começar.</p><button type="button" onClick={()=>addLayer('text',{text:'Uma nova história começa…',name:'Título de abertura'})}>Criar título de abertura</button></div>}
   </div>
   <aside className="cs-inspector">{captureScene&&<CutsceneTokenControls key={'capture:'+captureScene.id} tokens={captureScene.tokens} selectedTokenId={selectedTokenId} onSelectToken={setSelectedTokenId} onChange={tokens=>{const nextScene={...captureScene,tokens};setCaptureScene(nextScene);if(recordBuffer.current)recordBuffer.current.scene=nextScene;clock.setPlaying(false);}}/>}<h4>{layer?'Propriedades da camada':'Selecione uma camada'}</h4>{layer?<>
    <label>Nome da camada<input value={layer.name} onChange={event=>patchLayer({name:event.target.value})}/></label>
    <div className="cs-field-grid">{number('Entrada (s)',layer.start,value=>patchLayer({start:limit(value,0,layer.end-.1)}),0,project.duration)}{number('Saída (s)',layer.end,value=>patchLayer({end:limit(value,layer.start+.1,project.duration)}),0,project.duration)}</div>
    {layer.type==='map3d'&&layer.recording3D&&<>{!captureScene&&<CutsceneTokenControls key={layer.id} tokens={layer.map3D?.tokens} selectedTokenId={selectedTokenId} onSelectToken={setSelectedTokenId} onChange={tokens=>{clock.setPlaying(false);patchLayer({map3D:{...layer.map3D,tokens}});}}/>}<CutsceneWeatherControls value={layer.map3D?.weather} onChange={weather=>patchLayer({map3D:{...layer.map3D,weather}})}/><CameraMotionControls cinematic value={layer.cameraMotion3D} onChange={cameraMotion3D=>patchLayer({cameraMotion3D})}/><p className="cs-help">Apare a gravação original ou divida o plano na posição do cursor. Arraste os clipes para montar os cortes.</p><div className="cs-field-grid">{number('Início na gravação (s)',layer.sourceIn,value=>changeSource(value,Math.min(layer.recording3D.frames.at(-1).time,layer.sourceIn+(layer.end-layer.start)*layer.playbackRate)),0,layer.recording3D.frames.at(-1).time-.1)}{number('Fim na gravação (s)',Math.min(layer.recording3D.frames.at(-1).time,layer.sourceIn+(layer.end-layer.start)*layer.playbackRate),value=>changeSource(layer.sourceIn,value),layer.sourceIn+.1,layer.recording3D.frames.at(-1).time)}</div>{number('Velocidade do percurso',layer.playbackRate,value=>changeSource(layer.sourceIn,Math.min(layer.recording3D.frames.at(-1).time,layer.sourceIn+(layer.end-layer.start)*layer.playbackRate),limit(value,.1,4,1)),.1,4,.1)}<button type="button" disabled={clock.time<=layer.start+.05 || clock.time>=layer.end-.05} onClick={()=>{const split=splitCameraClip(layer,clock.time,cutsceneId());if(split){commit({...project,layers:project.layers.flatMap(item=>item.id===layer.id?split:[item])});setSelected(split[1].id);}}}>Dividir no cursor</button></>}
    {layer.type==='text'&&<><label>Texto da legenda<textarea rows={3} value={layer.text} onChange={event=>patchLayer({text:event.target.value})}/></label><div className="cs-field-grid"><label>Cor do texto<input type="color" value={layer.color} onChange={event=>patchLayer({color:event.target.value})}/></label>{number('Tamanho do texto',layer.fontSize,value=>patchLayer({fontSize:value}),1,18)}</div><label className="cs-check"><input type="checkbox" checked={layer.typewriter} onChange={event=>patchLayer({typewriter:event.target.checked})}/>Revelar texto aos poucos</label></>}
    {layer.type!=='audio'&&layer.type!=='map3d'&&<><div className="cs-pose-tabs">{[['from','Posição inicial'],['to','Posição final']].map(([key,label])=><button type="button" key={key} aria-pressed={pose===key} onClick={()=>{setPose(key);clock.setPlaying(false);clock.setTime(key==='from'?Math.min(layer.end,layer.start+.1):Math.max(layer.start,layer.end-.1));}}>{label}</button>)}</div>
     <p className="cs-help">Arraste a camada no palco ou ajuste os valores abaixo.</p><div className="cs-field-grid">{[['x','Posição X',-100,200],['y','Posição Y',-100,200],['scale','Escala',.05,6],['rotation','Rotação',-360,360]].map(([key,label,min,max])=><React.Fragment key={key}>{number(label,layer[pose][key],value=>patchLayer({[pose]:{...layer[pose],[key]:value}}),min,max)}</React.Fragment>)}</div>
     <button type="button" onClick={()=>patchLayer({to:{...layer.from}})}>Manter posição do início ao fim</button>{number('Largura (%)',layer.width,value=>patchLayer({width:value}),2,200)}
     <label>Movimento<select value={layer.easing} onChange={event=>patchLayer({easing:event.target.value})}><option value="smooth">Suave</option><option value="linear">Constante</option><option value="in">Acelerar</option><option value="out">Desacelerar</option></select></label>
     <div className="cs-presets"><button type="button" onClick={()=>patchLayer({from:{...layer.from,x:-20},to:{...layer.to,x:50}})}>Entrar pela esquerda</button><button type="button" onClick={()=>patchLayer({to:{...layer.from,scale:Math.min(6,layer.from.scale*1.2)}})}>Aproximar</button><button type="button" onClick={()=>patchLayer({animation:{...layer.animation,enabled:!layer.animation?.enabled}})} aria-pressed={Boolean(layer.animation?.enabled)}>Respiração e balanço</button></div>
    </>}
    <div className="cs-field-grid">{number('Fade de entrada (s)',layer.fadeIn,value=>patchLayer({fadeIn:value}),0,20)}{number('Fade de saída (s)',layer.fadeOut,value=>patchLayer({fadeOut:value}),0,20)}</div>
    <label>{layer.type==='audio'?'Volume':'Opacidade'}<input type="range" min={0} max={1} step={.05} value={layer.type==='audio'?layer.volume:layer.opacity} onChange={event=>patchLayer({[layer.type==='audio'?'volume':'opacity']:Number(event.target.value)})}/></label>
    <div className="cs-field-grid"><label className="cs-check"><input type="checkbox" checked={layer.hidden} onChange={event=>patchLayer({hidden:event.target.checked})}/>Ocultar</label><label className="cs-check"><input type="checkbox" checked={layer.locked} onChange={event=>patchLayer({locked:event.target.checked})}/>Travar posição</label></div>
    <div className="cs-actions"><button type="button" onClick={()=>moveOrder(1)}>Trazer à frente</button><button type="button" onClick={()=>moveOrder(-1)}>Enviar para trás</button><button type="button" onClick={()=>{const copy={...layer,id:cutsceneId(),name:`${layer.name} (cópia)`};commit({...project,layers:[...project.layers,copy]});setSelected(copy.id);}}>Duplicar</button><button type="button" className="cs-danger" onClick={()=>{commit({...project,layers:project.layers.filter(item=>item.id!==selected)});setSelected('');}}>Remover camada</button></div>
   </>:<p className="cs-help">Clique em um elemento no palco ou na linha do tempo. A última camada da lista aparece à frente das outras.</p>}</aside>
  </div>
  <section className="cs-timeline" aria-label="Camadas da linha do tempo">{standalone&&<div className="cs-timeline-resize" role="separator" tabIndex={0} aria-label="Altura da linha do tempo" aria-orientation="horizontal" aria-valuemin={24} aria-valuemax={58} aria-valuenow={timelineHeight} onKeyDown={event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();setTimelineHeight(value=>limit(value+(event.key==='ArrowUp'?3:-3),24,58));}}} onPointerDown={event=>{resizeStart.current={y:event.clientY,height:timelineHeight};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(resizeStart.current)setTimelineHeight(limit(resizeStart.current.height+(resizeStart.current.y-event.clientY)/window.innerHeight*100,24,58));}} onPointerUp={()=>{resizeStart.current=null;}} onPointerCancel={()=>{resizeStart.current=null;}}/>}<header><h4>Linha do tempo <small>{project.layers.length} camadas</small></h4><span>Arraste os clipes para alterar a entrada. Ajuste a duração nas propriedades.</span><label className="cs-timeline-zoom">Zoom<input aria-label="Zoom da linha do tempo" type="range" min={1} max={4} step={.25} value={timelineZoom} onChange={event=>setTimelineZoom(Number(event.target.value))}/></label></header><div className="cs-timeline-scroll"><div className="cs-timeline-body" style={{width:`${timelineZoom*100}%`}}><div className="cs-ruler"><span>CAMADAS</span><div>{[0,.25,.5,.75,1].map(fraction=><span key={fraction} style={{left:`${fraction*100}%`}}>{(fraction*project.duration).toFixed(1)}s</span>)}</div></div>
   {[...project.layers].reverse().map(item=><div className={`cs-track ${selected===item.id?'is-selected':''}`} key={item.id}><button type="button" className="cs-track-name" onClick={()=>{setSelected(item.id);clock.setTime(Math.min(item.end,item.start+.6));clock.setPlaying(false);}}><span>{({image:'IMG',token:'TOKEN',text:'TXT',audio:'AUDIO',map3d:'3D'})[item.type]}</span>{item.name}</button><div className="cs-track-lane" onPointerDown={event=>{if(event.target!==event.currentTarget)return;const bounds=event.currentTarget.getBoundingClientRect();clock.setPlaying(false);clock.setTime(limit((event.clientX-bounds.left)/bounds.width*project.duration,0,project.duration));}}><button type="button" aria-label={`Selecionar clipe ${item.name}`} className={`cs-clip cs-clip-${item.type}`} style={{left:`${item.start/project.duration*100}%`,width:`${(item.end-item.start)/project.duration*100}%`}} onClick={()=>setSelected(item.id)} onPointerDown={event=>{if(item.locked)return;setSelected(item.id);clock.setPlaying(false);clipDrag.current={x:event.clientX,width:event.currentTarget.parentElement.getBoundingClientRect().width,layer:item};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerUp={event=>{const drag=clipDrag.current;clipDrag.current=null;if(!drag)return;const next=moveCutsceneClip(drag.layer,drag.layer.start+(event.clientX-drag.x)/drag.width*project.duration,project.duration);commit({...project,layers:project.layers.map(layer=>layer.id===next.id?next:layer)});}} onPointerCancel={()=>{clipDrag.current=null;}}>{item.name}</button><i className="cs-playhead" style={{left:`${clock.time/project.duration*100}%`}}/></div></div>)}
   {!project.layers.length&&<p className="cs-help">Suas imagens, tokens, legendas e áudios aparecerão aqui.</p>}</div></div>
  </section>
  <p className="cs-help">O projeto é editável; a apresentação é reproduzida na mesa. A exportação salva o projeto JSON, não um vídeo. Salve antes de sair desta área.</p>
 </section>;
}
