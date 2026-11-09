export function isSpecialSceneAvailable(scene) {
 const special=scene?.cenaEspecial || scene?.cena_especial;
 return Boolean(special && special.ativo !== false && (special.cutscene || special.midiaUrl));
}

export function newSpecialPresentationId() {
 return `especial:${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}

export function activeTabletopScene(campaign) {
 const scene=campaign?.cenaAtiva;
 if(!scene) return {type:'empty'};
 const special=scene.cenaEspecial || scene.cena_especial;
 if(campaign.modo==='especial' && isSpecialSceneAvailable(scene)) return {type:'special',media:special};
 const images=scene.imagensCena || scene.imagens_cena || [];
 const maps=(scene.mapasBatalha || scene.mapas_batalha || []).filter(m => m.origem==='tabletop3d' || m.mapa3dId);
 const id=campaign.midiaAtivaId;
 const image=images.find(m => m.id===id);
 const map=maps.find(m => m.id===id);
 if(map) return {type:'map',media:map};
 if(image) return {type:'static',media:image};
 if(campaign.modo==='mapa' && maps.length) return {type:'map',media:maps[0]};
 const fallback=images[0] || (scene.imagemUrl || scene.imagem_url ? {id:`image-${scene.id}`,url:scene.imagemUrl || scene.imagem_url,nome:scene.nome} : null);
 if(fallback) return {type:'static',media:fallback};
 return maps.length ? {type:'map',media:maps[0]} : {type:'empty'};
}

export function specialSceneDestinations(campaign){
 const maps=[],images=[];
 const scene=campaign?.cenaAtiva;
 if(!scene)return {maps,images};
  for(const mapLink of scene.mapasBatalha || scene.mapas_batalha || []){
   const map=(campaign.mapas3D || []).find(item=>item.id===mapLink.mapa3dId);
   if(map)maps.push({id:`${scene.id}:${mapLink.id}`,label:map.nome || mapLink.nome || 'Mapa 3D',scene,mapLink});
  }
  const media=scene.imagensCena || scene.imagens_cena || [];
  for(const imageLink of media)images.push({id:`${scene.id}:${imageLink.id}`,label:imageLink.nome || 'Cena estática',scene,imageLink});
  if(!media.length && (scene.imagemUrl || scene.imagem_url))images.push({id:`${scene.id}:static`,label:'Cena estática',scene});
 return {maps,images};
}
