// Exponential easing keeps the same response across refresh rates.
export function normalizeCameraMotion(value){
 const bounded=(number,min,max,fallback)=>Number.isFinite(Number(number)) ? Math.max(min,Math.min(max,Number(number))) : fallback;
 return {intensity:bounded(value?.intensity??1,0,3,1),speed:bounded(value?.speed??1,.25,2,1),pitch:bounded(value?.pitch??0,-45,45,0),roll:bounded(value?.roll??0,-45,45,0)};
}
export function easeCameraAngle(current,target,delta,reduced=false){
 if(reduced || Math.abs(target-current)<.001) return target;
 return current+(target-current)*(1-Math.exp(-9*Math.max(0,Math.min(delta,.05))));
}
export function cameraDamping(delta){
 return 1-Math.pow(1-.045,Math.max(0,Math.min(delta,.05))*60);
}

export function smoothCameraTranslation(previous,target,delta,response=.18){
 const dt=Math.max(0,Math.min(delta,.05)),decay=Math.exp(-dt/response);
 return {velocity:target.map((value,index)=>value+(previous[index]-value)*decay),offset:target.map((value,index)=>value*dt+(previous[index]-value)*response*(1-decay))};
}

export function walkingCameraMotion(previous,position,delta,enabled=true,intensity=1) {
 const dt=Math.max(0,Math.min(delta,.05));
 const last=previous?.position;
 const distance=last && position ? Math.hypot(position[0]-last[0],position[1]-last[1]) : 0;
 const active=enabled && position && distance<.25;
 const speed=active && dt>0 ? Math.min(1,distance/dt/.65) : 0;
 const strength=active ? (previous?.strength || 0)+(speed-(previous?.strength || 0))*(1-Math.exp(-12*dt)) : 0;
 // Limit cadence at high token speeds and keep walking subtler than idle sway.
 const phase=(previous?.phase || 0)+(active ? Math.min(distance,dt*.85)/.6*Math.PI*2 : 0);
 const amount=Math.max(0,Math.min(1,Number(intensity)||0));
 return {position:position ? [...position] : null,phase,strength,
  pitch:Math.sin(phase*2)*.0015*strength*amount,
  yaw:Math.sin(phase)*.0005*strength*amount,
  roll:Math.sin(phase)*.001*strength*amount};
}

// The master's framing angles are local; only sway is shared with players.
export function cameraMotionForViewer(motion,master=false) {
 return {...motion,pitch:master ? (motion?.pitch || 0) : 0,roll:master ? (motion?.roll || 0) : 0};
}
