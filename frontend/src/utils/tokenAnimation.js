export const TOKEN_ANIMATIONS_KEY = 'tabletop_token_animations_v1';
export const DEFAULT_TOKEN_ANIMATION = { enabled:true, breathing:0.008, sway:0.008, speed:1, blinkInterval:5, blinkDuration:0.18, closedImage:'', region:{x:0,y:0,width:1,height:1} };
const clamp = (v,min,max,fallback) => Number.isFinite(Number(v)) ? Math.min(max,Math.max(min,Number(v))) : fallback;
export function normalizeTokenAnimation(value={}) {
 const t=value.closedTransform || {};const r=value.region || {},x=clamp(r.x,0,0.999,0),y=clamp(r.y,0,0.999,0);
 return {...DEFAULT_TOKEN_ANIMATION,cropTransparent:value.cropTransparent===true,enabled:value.enabled!==false,
 breathing:clamp(value.breathing,0,0.03,0.008),sway:clamp(value.sway,0,0.04,0.008),speed:clamp(value.speed,0.3,2,1),blinkInterval:clamp(value.blinkInterval,2,12,5),blinkDuration:clamp(value.blinkDuration,0.08,0.5,0.18),
 backImage:typeof value.backImage==='string' ? value.backImage : '',combatImage:typeof value.combatImage==='string' ? value.combatImage : '',combatBackImage:typeof value.combatBackImage==='string' ? value.combatBackImage : '',image:typeof value.image==='string' ? value.image : '',closedImage:typeof value.closedImage==='string' ? value.closedImage : '',
 closedTransform:{scale:clamp(t.scale,.25,3,1),x:clamp(t.x,-1,1,0),y:clamp(t.y,-1,1,0)},region:{x,y,width:clamp(r.width,0.001,1-x,1-x),height:clamp(r.height,0.001,1-y,1-y)}};
}
export function tokenAnimationFrame(time,c,id='',reduced=false) {
 if(!c?.enabled || reduced) return {scaleX:1,scaleY:1,rotation:0,blink:0};
 let hash=0;for(const char of String(id)) hash=(hash*31+char.charCodeAt(0))>>>0;
 const phase=hash%1000/1000*Math.PI*2,breath=Math.sin(time*c.speed*1.7+phase);
 const interval=c.blinkInterval+(hash%7)*0.11,cycle=((time+phase)%interval+interval)%interval;
 const blink=cycle<c.blinkDuration ? Math.sin(Math.PI*cycle/c.blinkDuration)**2 : 0;
 return {scaleX:1+breath*c.breathing*0.35,scaleY:1+breath*c.breathing,rotation:Math.sin(time*c.speed*0.7+phase)*c.sway,blink:c.closedImage ? blink : 0};
}
export function readTokenAnimations() {
 try {const list=JSON.parse(localStorage.getItem(TOKEN_ANIMATIONS_KEY)||'[]');return Array.isArray(list) ? list.filter(e => e?.id && e?.image).map(e => ({...e,animation:normalizeTokenAnimation(e.animation)})) : [];} catch {return [];}
}
export function saveTokenAnimation(entry) {
 const next=[entry,...readTokenAnimations().filter(e => e.id!==entry.id)];localStorage.setItem(TOKEN_ANIMATIONS_KEY,JSON.stringify(next));return next;
}
export const sheetTokenAnimationField = type => type==='2d' ? 'profileTokenAnimation' : 'tabletopTokenAnimation';
export function sheetTokenImage(ficha,type) {
 const sheet=ficha?.personagem || ficha || {};
 return type==='2d' ? sheet.profileImage || sheet.fotoPerfil || '' : sheet.tabletopTokenImage || '';
}
export function animationDraftFromSheet(ficha,type) {
 const sheet=ficha?.personagem || ficha || {},image=sheetTokenImage(ficha,type),stored=sheet[sheetTokenAnimationField(type)];
 const animation=normalizeTokenAnimation(stored && (!stored.image || stored.image===image) ? stored : {});
 return {id:`${ficha?.fichaId}:${type}`,fichaId:ficha?.fichaId,tokenType:type,name:`${sheet.name || sheet.nome || 'Personagem'} · ${type==='2d' ? 'Retrato 2D' : 'Corpo inteiro 3D'}`,image,animation:{...animation,image}};
}

export function fitClosedEyeImage(source,target) {
 const ratio=Math.min(target.width/source.width,target.height/source.height);
 const width=source.width*ratio,height=source.height*ratio;
 return {x:(target.width-width)/2,y:(target.height-height)/2,width,height};
}

export function tokenPresentation(image,animation,options={}) {
 const c=normalizeTokenAnimation(animation || {enabled:false});
 const back=Boolean(options.playerView && !options.sheetOpen);
 const selected=back ? (options.combat ? c.combatBackImage || c.combatImage || c.backImage : c.backImage) : (options.combat ? c.combatImage : '');
 const shown=selected || image;
 return {image:shown,back,animation:{...c,cropTransparent:shown!==image,image:shown,closedImage:shown===image ? c.closedImage : ''}};
}


