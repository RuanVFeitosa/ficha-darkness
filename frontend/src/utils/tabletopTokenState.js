export function tokenAppearance(sheet={},state={}) {
  return {
    image:state.image ?? sheet.tabletopTokenImage ?? '',
    portrait:state.portrait ?? sheet.profileImage ?? sheet.fotoPerfil ?? '',
    avatar3D:state.avatar3D !== undefined ? state.avatar3D : sheet.avatar3D || null,
    animation:state.animation ?? sheet.tabletopTokenAnimation,
    portraitAnimation:state.portraitAnimation ?? sheet.profileTokenAnimation,
  };
}

export function missingTokenAppearance(person,state={},scale=0.35) {
  const source={image:person.image,portrait:person.portrait,avatar3D:person.avatar3D,animation:person.animation,portraitAnimation:person.portraitAnimation,scale};
  return Object.fromEntries(Object.entries(source).filter(([key,value])=>state[key]===undefined && value!==undefined && value!==null && value!==''));
}

export function olderTokenState(incoming,current) {
  return Number(incoming?.revision || 0)<Number(current?.revision || 0);
}

export function mergeTokenUpdate(current={},incoming) {
  const posicoes={...current.posicoes};
  Object.entries(incoming.posicoes || {}).forEach(([key,state])=>{posicoes[key]={...posicoes[key],...state};});
  return {...current,...incoming,posicoes};
}

export function tokenTransformCache(transforms) {
  const fields=new Set(['x','z','elevation','scale','rotacao','olharCamera','lanterna','combat','animationEnabled','uvPermitida','hidden','audience','origin','revision']);
  return Object.fromEntries(Object.entries(transforms).map(([id,state])=>[id,Object.fromEntries(Object.entries(state).filter(([key])=>fields.has(key)))]));
}

export function mergeDoorStates(current={},incoming={}) {
  const result={...current};
  Object.entries(incoming).forEach(([key,state])=>{
    if(!result[key] || Number(state.revision || 0)>=Number(result[key].revision || 0)) result[key]=state;
  });
  return result;
}
