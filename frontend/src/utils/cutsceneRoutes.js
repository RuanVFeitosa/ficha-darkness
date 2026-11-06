export function cutsceneEditorUrl(campaign,sceneId='',returnTo='campaign') {
 const params=new URLSearchParams({cutscene:'1',campanha:campaign?.codigo || '',retorno:returnTo});
 if(sceneId)params.set('cena',sceneId);
 return `/?${params}`;
}
export function cutsceneReturnUrl(code,returnTo) {
 if(returnTo==='2d'||returnTo==='3d'){
  const params=new URLSearchParams({campanha:code,papel:'mestre'});
  if(returnTo==='3d')params.set('tabletop3d','1');
  return `/?${params}`;
 }
 return `/?${new URLSearchParams({mestre:'1',aba:'campanha',campanhaPainel:code,area:'cutscenes'})}`;
}
