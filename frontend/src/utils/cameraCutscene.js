import {normalizeWeather} from './tabletopWeather';
export function validCameraPose(pose) {
  return ['position','target'].every(key=>Array.isArray(pose?.[key]) && pose[key].length===3 && pose[key].every(Number.isFinite)) && Number.isFinite(pose?.fov) && pose.fov>=1 && pose.fov<=179;
}
export function validCameraRecording(clip) {
  return Array.isArray(clip?.frames) && clip.frames.length>=2 && clip.frames.every((frame,index)=>validCameraPose(frame) && Number.isFinite(frame.time) && frame.time>=0 && (index===0 ? frame.time===0 : frame.time>clip.frames[index-1].time));
}
export function cameraRecordingPose(clip,seconds) {
  if(!clip?.frames?.length) return null;
  const frames=clip.frames;
  if(seconds<=0) return frames[0];
  if(seconds>=frames[frames.length-1].time) return frames[frames.length-1];
  let low=0,high=frames.length-1;
  while(high-low>1) {const mid=(low+high)>>1;if(frames[mid].time<=seconds)low=mid;else high=mid;}
  const from=frames[low],to=frames[high],t=(seconds-from.time)/(to.time-from.time);
  return {position:from.position.map((v,i)=>v+(to.position[i]-v)*t),target:from.target.map((v,i)=>v+(to.target[i]-v)*t),fov:from.fov+(to.fov-from.fov)*t};
}

export function splitCameraClip(layer,time,id) {
  if(layer.type!=='map3d' || time<=layer.start+.05 || time>=layer.end-.05)return null;
  return [{...layer,end:time,fadeOut:0},{...layer,id,name:layer.name+' (corte)',start:time,sourceIn:layer.sourceIn+(time-layer.start)*layer.playbackRate,fadeIn:0}];
}
export function cameraClipTime(layer,time) {
  return Math.min(layer.recording3D.frames.at(-1).time,layer.sourceIn+Math.max(0,time-layer.start)*layer.playbackRate);
}
export function cameraPositionedToken(id,asset,pose){
  if(!validCameraPose(pose))return null;
  return {id,name:asset.name || 'Token',image:asset.src,imagePersistida:asset.srcPersistida || asset.src,animation:asset.animation,position:[...pose.position],height:.65,scale:.35,billboard:true,rotation:0};
}
export function snapshotCutsceneMap(map,campaign={}) {
  const tokens=(campaign.tokens || []).filter(token=>!token.removido).flatMap(token=>{
    const state=token.posicoes?.[`__estado:tabletop3d:${map.id || 'default'}`];
    if(!state || !Number.isFinite(state.x) || !Number.isFinite(state.z) || state.removido || state.uvOnly)return [];
    const custom=String(token.ficha_id).startsWith('custom3d:');
    const scale=Number(state.scale) || (custom?1:.35);
    return [{id:token.id,name:state.name || token.nome || 'Personagem',image:state.image || token.imagem_url,animation:state.animation,avatar3D:state.avatar3D,position:[state.x,(Number(map.spawnPoints?.tokens?.y)||0)+(Number(state.elevation)||0),state.z],height:(custom ? .65 : 1.86)*scale,scale,billboard:state.olharCamera!==false,rotation:(Number(state.rotacao)||0)*Math.PI/180}];
  });
  const weather=normalizeWeather(campaign.clima3D);
  return {id:map.id,name:map.nome,assets:map.assets || [],spawnPoints:map.spawnPoints,doorStates:map.doorStates,weather,tokens};
}
