import {prepareTokenImage} from '../../services/imageCompression';
import TokenAnimationPreview from './TokenAnimationPreview';
import React,{useEffect,useRef,useState} from 'react';


import {DEFAULT_TOKEN_ANIMATION,normalizeTokenAnimation,readTokenAnimations,saveTokenAnimation,animationDraftFromSheet,sheetTokenImage,sheetTokenAnimationField,fitClosedEyeImage,tokenPresentation} from '../../utils/tokenAnimation';
import '../../styles/TokenAnimationStudio.css';
function loadImage(url) {return new Promise((resolve,reject) => {const image=new Image();image.onload=() => resolve(image);image.onerror=() => reject(new Error('Não foi possível ler a imagem.'));image.src=url;});}
// Preserve the whole canvas for matching blink frames; never crop them independently.
export async function readAnimationImage(file,targetSize) {
 if(!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size>12*1024*1024) throw new Error('Use PNG, JPG ou WebP de até 12 MB.');
 const source=await new Promise((resolve,reject) => {const reader=new FileReader();reader.onload=() => resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
 const image=await loadImage(source),size=targetSize || image,ratio=Math.min(1,1024/Math.max(size.width,size.height));
 const canvas=document.createElement('canvas');canvas.width=Math.round(size.width*ratio);canvas.height=Math.round(size.height*ratio);const fitted=fitClosedEyeImage(image,canvas);canvas.getContext('2d').drawImage(image,fitted.x,fitted.y,fitted.width,fitted.height);
 const url=canvas.toDataURL('image/webp',0.9);if(url.length>700000) throw new Error('A imagem é muito detalhada. Use uma versão menor.');
 return {url,width:image.width,height:image.height};
}
export default function TokenAnimationStudio({fichas=[],onSaveSheetAnimation}) {
 const [library,setLibrary]=useState(readTokenAnimations),[draft,setDraft]=useState({name:'',image:'',animation:{...DEFAULT_TOKEN_ANIMATION}}),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[playing,setPlaying]=useState(true),[aspect,setAspect]=useState(2/3),[selecting,setSelecting]=useState(false),[aligning,setAligning]=useState(false),[previewPose,setPreviewPose]=useState("front");
 const [selectedFichaId,setSelectedFichaId]=useState(''),[tokenType,setTokenType]=useState('3d');
 const selectedFicha=fichas.find(ficha => ficha.fichaId===selectedFichaId);
 const selectedImage=sheetTokenImage(selectedFicha,tokenType);const selectedFichaRef=useRef(selectedFicha);selectedFichaRef.current=selectedFicha;
 useEffect(() => {if(!fichas.length) return;if(!fichas.some(f => f.fichaId===selectedFichaId)) {const first=fichas.find(f => sheetTokenImage(f,'3d') || sheetTokenImage(f,'2d')) || fichas[0];setSelectedFichaId(first.fichaId);setTokenType(sheetTokenImage(first,'3d') ? '3d' : '2d');}},[fichas,selectedFichaId]);
 useEffect(() => {if(!selectedFichaRef.current) return;setDraft(animationDraftFromSheet(selectedFichaRef.current,tokenType));setSelecting(false);setAligning(false);setPreviewPose("front");setPlaying(true);},[selectedFichaId,tokenType,selectedImage]); // Preserve unsaved sliders during unrelated sheet refreshes.
 const start=useRef(null),dimensions=useRef(null);
 const config=normalizeTokenAnimation(draft.animation);const posePreview=tokenPresentation(draft.image,config,{playerView:previewPose==="back" || previewPose==="combatBack",combat:previewPose==="combat" || previewPose==="combatBack"});
 useEffect(() => {let alive=true;if(!draft.image) return;loadImage(draft.image).then(img => {if(alive) {setAspect(img.width/img.height);dimensions.current={width:img.width,height:img.height};}}).catch(() => {if(alive) setStatus('Não foi possível carregar a imagem.');});return () => {alive=false;};},[draft.image]);
 const patch=p => setDraft(d => ({...d,animation:{...d.animation,...p}}));
 async function upload(event,closed=false) {
  const file=event.target.files?.[0];event.target.value='';if(!file) return;setBusy(true);
  try {const target=closed ? dimensions.current || await loadImage(draft.image) : undefined;const data=await readAnimationImage(file,target);
   if(closed) {patch({closedImage:data.url,closedTransform:{scale:1,x:0,y:0}});setAligning(true);setPreviewPose("front");setSelecting(false);setPlaying(false);}
   else {setDraft(d => ({...d,id:undefined,image:data.url,animation:{...d.animation,image:data.url,closedImage:'',region:{x:0,y:0,width:1,height:1}}}));dimensions.current=data;}
   setStatus(closed ? 'Imagem importada. Alinhe os olhos na sobreposição e depois delimite a região das piscadas.' : 'Token importado. Ajuste os movimentos e as piscadas.');
  } catch(error) {setStatus(error.message || 'Não foi possível importar.');} finally {setBusy(false);}
 }
 async function uploadPose(event,key) {
  const file=event.target.files?.[0];event.target.value='';if(!file) return;setBusy(true);
  try {const url=await prepareTokenImage(file);patch({[key]:url});setStatus('Versão do token adicionada. Salve para aplicá-la no tabletop.');}
  catch(error) {setStatus(error.message || 'Não foi possível importar essa versão.');} finally {setBusy(false);}
 } async function save() {
  if(!selectedFicha || !draft.image) {setStatus('Selecione uma ficha com a imagem deste token.');return;}
  setBusy(true);
  try {if(!draft.name.trim()) throw new Error('Dê um nome à animação.');
   const entry={...draft,id:`${selectedFichaId}:${tokenType}`,fichaId:selectedFichaId,tokenType,name:draft.name.trim(),animation:{...config,image:selectedImage}};
   if(!onSaveSheetAnimation) throw new Error('Não foi possível acessar a ficha para salvar.');
   await onSaveSheetAnimation(selectedFicha,{[sheetTokenAnimationField(tokenType)]:entry.animation});
   setLibrary(saveTokenAnimation(entry));setDraft(entry);setStatus(tokenType==='2d' ? 'Animação salva na ficha. Aplicada ao retrato e ao tabletop 2D.' : 'Animação salva na ficha. Aplicada ao token de corpo inteiro no tabletop 3D.');
  } catch(error) {setStatus(error.name==='QuotaExceededError' ? 'Não foi possível salvar a biblioteca local: armazenamento cheio.' : error.message);} finally {setBusy(false);}
 } function exportDraft() {const blob=new Blob([JSON.stringify({...draft,animation:config},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='token-animation.json';a.click();setTimeout(() => URL.revokeObjectURL(url),1000);}
 async function importDraft(event) {const file=event.target.files?.[0];event.target.value='';if(!file) return;try {if(file.size>2*1024*1024) throw new Error('Arquivo muito grande.');const entry=JSON.parse(await file.text());const valid=url => typeof url==='string' && /^(data:image\/(png|jpeg|webp);base64,|https?:\/\/|\/tabletop\/)/.test(url);if(!valid(entry.image) || (entry.animation?.closedImage && !valid(entry.animation.closedImage))) throw new Error('Arquivo de animação inválido.');setDraft({name:String(entry.name || 'Token'),image:selectedImage,animation:normalizeTokenAnimation({...entry.animation,image:selectedImage})});setStatus('Animação importada. Salve para adicioná-la à biblioteca.');} catch(error) {setStatus(error.message);}}
 function point(event) {const rect=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};}
 function finishRegion(event) {if(!start.current) return;const end=point(event),begin=start.current;start.current=null;event.currentTarget.releasePointerCapture?.(event.pointerId);patch({region:{x:Math.min(begin.x,end.x),y:Math.min(begin.y,end.y),width:Math.max(0.002,Math.abs(end.x-begin.x)),height:Math.max(0.002,Math.abs(end.y-begin.y))}});setSelecting(false);setPlaying(true);}
 const sliders=(keys) => keys.map(([key,label,min,max,step]) => <label className="tas-slider" key={key}><span>{label}<output>{key==='breathing'||key==='sway' ? `${Math.round(config[key]/max*100)}%` : key==='speed' ? `${config[key].toFixed(1)}×` : `${config[key].toFixed(2)} s`}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={config[key]} style={{'--tas-progress':`${(config[key]-min)/(max-min)*100}%`}} onChange={e => patch({[key]:Number(e.target.value)})}/></label>);
 return <><section className="tas" aria-label="Estúdio de Tokens">
 <header className="tas-heading"><div><span className="tas-eyebrow">ESTÚDIO DO MESTRE / TOKENS DAS FICHAS</span><h2>Estúdio de Tokens</h2><p>Movimentos sutis. Personagens presentes.<br/>Prepare imagens, poses e movimentos para sua mesa.</p></div><button className="tas-primary" type="button" disabled={busy || !draft.image || !selectedFicha} onClick={save}>Salvar token <span aria-hidden="true">↗</span></button></header>
 <div className="tas-layout"><div className="tas-controls">
 <section className="tas-card"><div className="tas-card-heading"><span>01</span><div><h3>O personagem</h3><p>A imagem que vai ganhar movimento.</p></div></div>
  <label className="tas-field">Ficha do personagem<select aria-label="Ficha do personagem" value={selectedFichaId} onChange={event => setSelectedFichaId(event.target.value)}><option value="" disabled>Selecione uma ficha</option>{fichas.map(ficha => <option key={ficha.fichaId} value={ficha.fichaId}>{ficha.personagem?.name || ficha.personagem?.nome || ficha.fichaId} · {ficha.fichaId.startsWith('espiral:') ? 'ESPIRAL' : 'DARKNESS'}</option>)}</select></label>
 <div className="tas-token-types" role="group" aria-label="Tipo de token"><button type="button" aria-pressed={tokenType==='3d'} onClick={() => setTokenType('3d')}>Corpo inteiro · 3D</button><button type="button" aria-pressed={tokenType==='2d'} onClick={() => setTokenType('2d')}>Retrato · 2D</button></div>
 <label className="tas-field">Nome do token<input value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})}/></label>
 <div className="tas-sheet-source">{draft.image ? <><img src={draft.image} alt="Token da ficha"/><span><strong>Imagem vinculada à ficha</strong><small>{tokenType==="3d" ? "Corpo inteiro para o tabletop 3D" : "Retrato para o perfil e o tabletop 2D"}</small></span></> : <p>{selectedFicha ? "Esta ficha ainda não tem essa imagem. Adicione-a na ficha para animar." : "Nenhuma ficha disponível. Crie ou carregue uma ficha no Dashboard."}</p>}</div></section>
 <section className="tas-card"><div className="tas-card-heading"><span>02</span><div><h3>Movimento natural</h3><p>Encontre o ritmo do personagem.</p></div></div>
 {sliders([['breathing','Respiração',0,0.03,0.001],['sway','Balanço suave',0,0.04,0.001],['speed','Velocidade dos movimentos',0.3,2,0.1]])}
 <div className="tas-presets" aria-label="Intensidade da animação">{[['Discreto',.004,.004,.8],['Natural',.008,.008,1],['Expressivo',.015,.018,1.2]].map(([label,breathing,sway,speed]) => <button type="button" key={label} onClick={() => patch({breathing,sway,speed})}>{label}</button>)}</div></section>
 <section className="tas-card"><div className="tas-card-heading"><span>03</span><div><h3>Piscadas</h3><p>Um detalhe que faz diferença.</p></div><span className={`tas-pill ${config.closedImage ? 'is-active' : ''}`}>{config.closedImage ? 'ATIVAS' : 'OPCIONAL'}</span></div>
 <label className="tas-upload tas-upload-compact"><span className="tas-upload-icon" aria-hidden="true">＋</span><span><strong>Adicionar versão com olhos fechados</strong><small>Margens diferentes são aceitas. Ajuste o alinhamento após importar.</small></span><input aria-label="Imagem de olhos fechados" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || !draft.image} onChange={e => upload(e,true)}/></label>
 {sliders([['blinkInterval','Intervalo das piscadas (segundos)',2,12,0.5],['blinkDuration','Duração da piscada (segundos)',0.08,0.5,0.01]])}
 {config.closedImage ? <div className="tas-eye-actions"><button type="button" onClick={() => {setAligning(!aligning);setPreviewPose("front");setSelecting(false);setPlaying(aligning);}}>{aligning ? "Concluir alinhamento" : "Alinhar olhos fechados"}</button><button type="button" onClick={() => {setSelecting(!selecting);setPreviewPose("front");setAligning(false);setPlaying(false);}}>{selecting ? 'Cancelar seleção' : 'Delimitar região dos olhos'}</button><button className="tas-text-button" type="button" onClick={() => patch({closedImage:''})}>Remover piscadas</button></div> : <p className="tas-hint">Respiração e balanço já funcionam com uma única imagem.</p>}
 {config.closedImage && aligning && <div className="tas-alignment-controls"><p className="tas-hint">Alinhe o rosto e os olhos das duas imagens usando a sobreposição a 50%.</p>{[['scale','Escala da imagem',.25,3,.01],['x','Deslocamento horizontal',-1,1,.005],['y','Deslocamento vertical',-1,1,.005]].map(([key,label,min,max,step]) => <label className="tas-slider" key={key}><span>{label}<output>{Math.round(config.closedTransform[key]*100)}%</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={config.closedTransform[key]} onChange={event => patch({closedTransform:{...config.closedTransform,[key]:Number(event.target.value)}})}/></label>)}<button type="button" onClick={() => patch({closedTransform:{scale:1,x:0,y:0}})}>Restaurar alinhamento</button></div>} </section> {tokenType==='3d' && <section className="tas-card"><div className="tas-card-heading"><span>04</span><div><h3>Direção e combate</h3><p>Versões do corpo inteiro para cada situação.</p></div></div><p className="tas-hint">Seu personagem aparece de costas na visão do jogador e de frente enquanto a ficha estiver aberta. Adicione as imagens correspondentes.</p>{[['backImage','Token de costas'],['combatImage','Combate de frente'],['combatBackImage','Combate de costas']].map(([key,label]) => <div key={key}><label className="tas-upload tas-upload-compact"><span className="tas-upload-icon" aria-hidden="true">＋</span><span><strong>{label}</strong><small>{config[key] ? 'Versão adicionada · substituir' : 'Adicionar imagem PNG, JPG ou WebP'}</small></span><input aria-label={label} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || !draft.image} onChange={event => uploadPose(event,key)}/></label>{config[key] && <button type="button" onClick={() => patch({[key]:''})}>Remover {label.toLowerCase()}</button>}</div>)}<label className="tas-field">Versão na prévia<select aria-label="Versão na prévia" value={previewPose} onChange={event => {setPreviewPose(event.target.value);setAligning(false);setSelecting(false);}}><option value="front">Frente</option><option value="back">Costas</option><option value="combat">Combate de frente</option><option value="combatBack">Combate de costas</option></select></label></section>}</div>
 <div className="tas-preview-column"><div className="tas-preview"><div className="tas-preview-header"><div><span className="tas-eyebrow">PALCO DE ANIMAÇÃO</span><strong>{draft.name || 'Seu personagem'}</strong></div><button className="tas-play" type="button" onClick={() => setPlaying(!playing)}><span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span>{playing ? 'Pausar' : 'Reproduzir'}</button></div>
 <div className="tas-stage"><div className="tas-stage-orbit" aria-hidden="true"/>{selecting ? <div className="tas-region-wrap"><p>Arraste um retângulo ao redor dos olhos.</p><div className="tas-region" style={{aspectRatio:aspect}} onPointerDown={e => {start.current=point(e);e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={finishRegion} onPointerCancel={() => {start.current=null;}}><img src={draft.image} alt="Delimitar olhos do token" draggable={false}/><div className="tas-region-box" style={{left:`${config.region.x*100}%`,top:`${config.region.y*100}%`,width:`${config.region.width*100}%`,height:`${config.region.height*100}%`}}/></div></div> : draft.image ? <TokenAnimationPreview image={posePreview.image} animation={{...posePreview.animation,enabled:playing}} id={draft.id || "preview"} aspect={aspect} alignmentPreview={aligning}/> : <div className="tas-no-token"><span aria-hidden="true">◇</span><p>Selecione uma ficha e um token<br/>para começar a animar.</p></div>}
 <span className="tas-stage-label">{selecting ? 'AJUSTE DOS OLHOS' : aligning ? 'ALINHAMENTO DAS IMAGENS' : playing ? 'PRÉVIA AO VIVO' : 'ANIMAÇÃO PAUSADA'}</span></div>
 <footer className="tas-preview-footer"><span><i className={playing ? 'is-playing' : ''}/>{playing ? 'Em movimento' : 'Pausado'}</span><span>{tokenType==="2d" ? "PERFIL / TABLETOP 2D" : "TABLETOP / 3D"}</span></footer></div>
 <p className="tas-preview-note">O corpo inteiro permanece no quadro.<br/>Os movimentos respeitam a preferência de movimento reduzido do dispositivo.</p>
 <div className="tas-portability"><button type="button" onClick={exportDraft}>Exportar token ↗</button><label>Importar configurações ↓<input aria-label="Importar configurações" type="file" accept="application/json,.json" onChange={importDraft}/></label></div>
 <p role="status" aria-label="Mensagem do estúdio" className={status ? 'tas-status' : 'tas-status-empty'}>{status}</p></div></div>
 <section className="tas-library"><div className="tas-library-heading"><div><span className="tas-eyebrow">PRONTAS PARA A MESA</span><h3>Biblioteca das fichas</h3><p>Salva neste navegador. Exporte para usar em outro dispositivo.</p></div><span className="tas-pill">VINCULADA ÀS FICHAS</span></div>
 <div className="tas-library-grid">
 {library.filter(entry => fichas.some(f => f.fichaId===entry.fichaId)).map(entry => <button className="tas-library-card" type="button" key={entry.id} onClick={() => {if(fichas.some(f => f.fichaId===entry.fichaId)) {setSelectedFichaId(entry.fichaId);setTokenType(entry.tokenType || '3d');setDraft({...entry,image:sheetTokenImage(fichas.find(f => f.fichaId===entry.fichaId),entry.tokenType || '3d')});setStatus('Editando animação da ficha.');} else setStatus('A ficha desta animação não está disponível.');}}><div className="tas-library-thumbnail"><img src={entry.image} alt=""/></div><span><strong>{entry.name}</strong><small>TOKEN SALVO · EDITAR</small></span><b aria-hidden="true">↗</b></button>)}</div></section>
 </section></>;
}

















