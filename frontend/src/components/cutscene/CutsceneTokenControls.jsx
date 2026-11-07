import React,{useEffect,useState} from 'react';
import {normalizeTokenAnimation,readTokenAnimations} from '../../utils/tokenAnimation';

export default function CutsceneTokenControls({tokens=[],onChange,selectedTokenId,onSelectToken}) {
 const [selected,setSelected]=useState('');
 const newest=tokens.at(-1)?.id;
 useEffect(()=>{setSelected(newest || '');},[newest]);
 useEffect(()=>{if(selectedTokenId)setSelected(selectedTokenId);},[selectedTokenId]);
 const token=tokens.find(item=>item.id===selected) || tokens.at(-1);
 if(!token)return null;
 const patch=change=>onChange(tokens.map(item=>item.id===token.id?{...item,...change}:item));
 const animation=normalizeTokenAnimation(token.animation || {enabled:false});
 const profiles=readTokenAnimations();
 const patchAnimation=change=>patch({animation:normalizeTokenAnimation({...animation,...change})});
 const height=Number(token.height)||.65;
 const resize=value=>{
  if(!Number.isFinite(value) || value<=0)return;
  const next=Math.max(.01,value);
  patch({height:next,scale:(Number(token.scale)||.35)*next/height});
 };
 const position=token.position || [0,0,0];
 const move=(axis,value)=>{if(Number.isFinite(value))patch({position:position.map((current,index)=>index===axis?value:current)});};
 return <section className="cs-token-controls" aria-label="Ajustes dos tokens 3D"><h4>Tokens 3D</h4>
  <label>Token no mapa<select value={token.id} onChange={event=>{setSelected(event.target.value);onSelectToken?.(event.target.value);}}>{tokens.map(item=><option key={item.id} value={item.id}>{item.name || 'Token'}</option>)}</select></label>
  {!token.avatar3D?.modelUrl&&<details className="cs-token-animation" open><summary>Animação do token</summary>
   <label>Animação salva<select aria-label="Animação salva do token" value={profiles.some(profile=>profile.id===token.animationPresetId)?token.animationPresetId:''} onChange={event=>{const profile=profiles.find(item=>item.id===event.target.value);if(profile)patch({animationPresetId:profile.id,image:profile.image,imagePersistida:profile.image,animationPersistida:undefined,animation:{...profile.animation,image:profile.image,enabled:true}});}}><option value="">{token.animation?'Personalizada / salva no token':'Escolha uma animação'}</option>{profiles.map(profile=><option key={profile.id} value={profile.id}>{profile.name || 'Animação'}</option>)}</select></label>
   <label className="cs-check"><input type="checkbox" checked={animation.enabled} onChange={event=>patchAnimation({enabled:event.target.checked})}/>Animar token</label>
   {[['breathing','Respiração do token',0,.03,.001],['sway','Balanço do token',0,.04,.001],['speed','Velocidade da animação',.3,2,.05]].map(([key,label,min,max,step])=><label key={key}>{label}<input aria-label={label} type="range" min={min} max={max} step={step} value={animation[key]} onChange={event=>patchAnimation({[key]:Number(event.target.value)})}/></label>)}
   {animation.closedImage?<label>Intervalo das piscadas (s)<input type="number" min="2" max="12" step="0.1" value={animation.blinkInterval} onChange={event=>{if(event.target.value!=='')patchAnimation({blinkInterval:Number(event.target.value)});}}/></label>:<p className="cs-help">Para piscar, escolha uma animação com a imagem de olhos fechados configurada.</p>}
   <a href="/?mestre=1&amp;aba=animacoes" target="_blank" rel="noreferrer">Abrir Estúdio de Tokens ↗</a>
  </details>}
  <label>Altura do token (m)<input aria-label="Altura do token (m)" type="number" min="0.01" step="0.01" value={Number(height.toFixed(4))} onChange={event=>{if(event.target.value!=='')resize(Number(event.target.value));}}/></label>
  <div className="cs-field-grid"><button type="button" onClick={()=>resize(height*.8)}>− Diminuir token</button><button type="button" onClick={()=>resize(height*1.25)}>＋ Aumentar token</button></div>
  {['Posição X','Altura Y','Posição Z'].map((label,index)=><div className="cs-token-axis" key={label}><label>{label}<input aria-label={label+' do token'} type="number" step="0.01" value={position[index]} onChange={event=>{if(event.target.value!=='')move(index,Number(event.target.value));}}/></label><div><button type="button" aria-label={`Diminuir ${label.toLowerCase()} do token`} onClick={()=>move(index,Number((position[index]-.1).toFixed(6)))}>− 0,1</button><button type="button" aria-label={`Aumentar ${label.toLowerCase()} do token`} onClick={()=>move(index,Number((position[index]+.1).toFixed(6)))}>＋ 0,1</button></div></div>)}
  <label className="cs-check"><input type="checkbox" checked={token.billboard!==false} onChange={event=>patch({billboard:event.target.checked})}/>Virar para a câmera</label>
  {token.billboard===false&&<label>Rotação do token (graus)<input type="number" step="1" value={Number(((Number(token.rotation)||0)*180/Math.PI).toFixed(2))} onChange={event=>{if(event.target.value!==''&&Number.isFinite(Number(event.target.value)))patch({rotation:Number(event.target.value)*Math.PI/180});}}/></label>}
  <p className="cs-help">X e Z movem pelo mapa; Y ajusta a altura. As mudanças aparecem no palco e ficam salvas neste plano.</p>
 </section>;
}
