export function activeTabletopScene(campaign) {
 const scene=campaign?.cenaAtiva;
 if(!scene) return {type:'empty'};
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