import {validCameraRecording} from './cameraCutscene';
import {normalizeCameraMotion} from './cameraMotion';
import {normalizeCameraSpeed} from './cameraSpeed';
export const CUTSCENE_VERSION=1;
export const limit=(value,min,max,fallback=min)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export const cutsceneId=()=>window.crypto?.randomUUID?.() || `clip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const pose=value=>({x:limit(value?.x,-100,200,50),y:limit(value?.y,-100,200,50),scale:limit(value?.scale,.05,6,1),rotation:limit(value?.rotation,-360,360,0)});
const safeSource=value=>typeof value==='string' && /^(https?:\/\/|data:(image|audio)\/|blob:|local-image:\/\/|\/(?!\/))/i.test(value)?value:'';
export function normalizeCutscene(value={}) {
 const duration=limit(value.duration,1,Number.MAX_VALUE,20);
 return {version:CUTSCENE_VERSION,name:String(value.name || 'Nova cutscene').slice(0,120),duration,
  background:/^#[\da-f]{6}$/i.test(value.background)?value.background:'#000000',letterbox:value.letterbox!==false,loop:value.loop===true,
  camera:{from:pose(value.camera?.from),to:pose(value.camera?.to)},
  layers:(Array.isArray(value.layers)?value.layers:[]).map((layer,index)=>{
   const start=limit(layer.start,0,duration-.1,0);
   const recording3D=layer.type==='map3d' && validCameraRecording(layer.recording3D)?layer.recording3D:null;
   return {id:String(layer.id || `layer-${index}`),name:String(layer.name || 'Camada').slice(0,100),type:['image','token','text','audio','map3d'].includes(layer.type)?layer.type:'image',
    ...(layer.type==='map3d' ? {map3D:layer.map3D,recording3D,sourceIn:limit(layer.sourceIn,0,Math.max(0,(recording3D?.frames.at(-1).time || 0)-.1)),playbackRate:limit(layer.playbackRate,.1,4,1),cameraMotion3D:normalizeCameraMotion(layer.cameraMotion3D || {intensity:0}),navigationSpeed3D:normalizeCameraSpeed(layer.navigationSpeed3D ?? 1)} : {}),
    src:safeSource(layer.src),srcPersistida:safeSource(layer.srcPersistida) || (String(layer.src).startsWith('blob:')?'':safeSource(layer.src)),text:String(layer.text || '').slice(0,3000),
    start,end:limit(layer.end,start+.1,duration,duration),width:limit(layer.width,2,200,30),from:pose(layer.from),to:pose(layer.to),
    easing:['linear','smooth','in','out'].includes(layer.easing)?layer.easing:'smooth',fadeIn:limit(layer.fadeIn,0,20,.5),fadeOut:limit(layer.fadeOut,0,20,.5),
    opacity:limit(layer.opacity,0,1,1),volume:limit(layer.volume,0,1,.7),hidden:layer.hidden===true,locked:layer.locked===true,
    color:/^#[\da-f]{6}$/i.test(layer.color)?layer.color:'#ffffff',fontSize:limit(layer.fontSize,1,18,5),typewriter:layer.typewriter===true,
    animation:layer.animation && typeof layer.animation==='object'?layer.animation:undefined};
  })};
}
export const emptyCutscene=()=>normalizeCutscene();
export function newCutsceneLayer(type,duration,patch={}) {
 return normalizeCutscene({duration,layers:[{id:cutsceneId(),type,name:({image:'Imagem',token:'Token',text:'Legenda',audio:'Trilha sonora'})[type],start:0,end:duration,
  from:{x:50,y:type==='text'?82:50},to:{x:50,y:type==='text'?82:50},width:type==='image'?100:type==='text'?80:28,
  text:type==='text'?'Escreva sua história…':'',...patch}]}).layers[0];
}
const ease=(t,type)=>type==='linear'?t:type==='in'?t*t:type==='out'?1-(1-t)**2:t*t*(3-2*t);
export function interpolatePose(from,to,progress,easing='smooth') {
 const t=ease(limit(progress,0,1),easing);
 return Object.fromEntries(['x','y','scale','rotation'].map(key=>[key,from[key]+(to[key]-from[key])*t]));
}
export function cutsceneLayerFrame(layer,time) {
 if(layer.hidden || time<layer.start || time>layer.end) return null;
 const elapsed=time-layer.start,remaining=layer.end-time;
 const opacity=layer.opacity*Math.min(1,layer.fadeIn?elapsed/layer.fadeIn:1,layer.fadeOut?remaining/layer.fadeOut:1);
 return {...interpolatePose(layer.from,layer.to,(time-layer.start)/(layer.end-layer.start),layer.easing),opacity,
  text:layer.typewriter?layer.text.slice(0,Math.floor(elapsed*28)):layer.text};
}
export function moveCutsceneClip(layer,start,duration) {
 const length=layer.end-layer.start,next=limit(start,0,Math.max(0,duration-length));
 return {...layer,start:next,end:next+length};
}
export function parseCutsceneProject(text) {
 const data=JSON.parse(text);
 if(data.version!==CUTSCENE_VERSION || !Array.isArray(data.layers) || !Number.isFinite(data.duration)) throw new Error('Este arquivo não é um projeto de cutscene compatível.');
 return normalizeCutscene(data);
}
export async function mapCutsceneSources(project,mapper) {
 if(!project) return project;
 const layers=await Promise.all((project.layers || []).map(async layer=>{
  const original=layer.srcPersistida || layer.src;
  const src=original?await mapper(original):'';
  const animation=layer.animation?{...layer.animation}:undefined;
  if(animation)for(const key of ['image','closedImage','backImage','combatImage','combatBackImage'])if(animation[key]) animation[key]=await mapper(animation[key]);
  const map3D=layer.map3D ? await mapScene3DSources(layer.map3D,mapper) : undefined;
  return {...layer,src,srcPersistida:original,animation,...(map3D?{map3D}:{})};
 }));
 return {...project,layers};
}
export function persistCutsceneSources(project) {
 if(!project) return project;
 return {...project,layers:(project.layers || []).map(layer=>({...layer,src:String(layer.src).startsWith('blob:')?layer.srcPersistida || layer.src:layer.src,...(layer.map3D?{map3D:persistScene3DSources(layer.map3D)}:{})}))};
}

async function mapScene3DSources(scene,mapper) {
 const assets=await Promise.all((scene.assets || []).map(async item=>{
  if(!item.asset)return item;
  const asset=item.asset,fileUrlPersistida=asset.fileUrlPersistida || asset.fileUrl;
  const dependenciesPersistidas=asset.dependenciesPersistidas || asset.dependencies || {};
  const dependencies=Object.fromEntries(await Promise.all(Object.entries(dependenciesPersistidas).map(async([key,url])=>[key,await mapper(url)])));
  return {...item,asset:{...asset,fileUrlPersistida,fileUrl:fileUrlPersistida?await mapper(fileUrlPersistida):fileUrlPersistida,dependenciesPersistidas,dependencies}};
 }));
 const tokens=await Promise.all((scene.tokens || []).map(async token=>{
  const imagePersistida=token.imagePersistida || token.image;
  const animationPersistida=persistMapTokenAnimation(token);
  const animation=animationPersistida?{...animationPersistida}:undefined;
  if(animation)for(const key of ['image','closedImage','backImage','combatImage','combatBackImage'])if(animation[key])animation[key]=await mapper(animation[key]);
  const avatar3D=token.avatar3D?{...token.avatar3D,modelUrlPersistida:token.avatar3D.modelUrlPersistida || token.avatar3D.modelUrl}:null;
  if(avatar3D?.modelUrlPersistida)avatar3D.modelUrl=await mapper(avatar3D.modelUrlPersistida);
  return {...token,imagePersistida,image:imagePersistida?await mapper(imagePersistida):'',avatar3D,animation,animationPersistida};
 }));
 return {...scene,assets,tokens};
}
function persistScene3DSources(scene) {
 return {...scene,assets:(scene.assets || []).map(item=>!item.asset?item:{...item,asset:{...item.asset,fileUrl:item.asset.fileUrlPersistida || item.asset.fileUrl,dependencies:item.asset.dependenciesPersistidas || item.asset.dependencies}}),
  tokens:(scene.tokens || []).map(token=>({...token,image:token.imagePersistida || token.image,...(token.animation?{animation:persistMapTokenAnimation(token)}:{}),...(token.avatar3D?{avatar3D:{...token.avatar3D,modelUrl:token.avatar3D.modelUrlPersistida || token.avatar3D.modelUrl}}:{})}))};
}
function persistMapTokenAnimation(token){
 if(!token.animation)return undefined;
 const animation={...token.animation};
 for(const key of ['image','closedImage','backImage','combatImage','combatBackImage'])if(String(animation[key]).startsWith('blob:') && token.animationPersistida?.[key])animation[key]=token.animationPersistida[key];
 return animation;
}
