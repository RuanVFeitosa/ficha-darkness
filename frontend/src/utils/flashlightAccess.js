export function tokenFlashlight(state={}){
 return {...(state.lanterna || {}),...(state.uvPermitida===false ? {modo:'normal'} : {})};
}
export function flashlightModeActive(light,mode){
 return Boolean(light?.ativa && (light.modo==='uv' ? 'uv' : 'normal')===mode);
}
export function toggleFlashlightMode(light,mode){
 return {...light,modo:mode,ativa:!flashlightModeActive(light,mode)};
}
export function playerFlashlightPatch(state,patch){
 const allowed={...patch};
 delete allowed.uvPermitida;
 if(allowed.lanterna && state?.uvPermitida===false)allowed.lanterna={...allowed.lanterna,modo:'normal'};
 return allowed;
}
