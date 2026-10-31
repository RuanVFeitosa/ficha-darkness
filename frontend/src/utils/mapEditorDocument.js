import {activeTabletopScene} from './tabletopScene';
export function initialEditorMap(campaign,requestedId){
 const maps=campaign?.mapas3D || [];
 if(requestedId)return maps.find(map=>map.id===requestedId) || null;
 const activeId=activeTabletopScene(campaign).media?.mapa3dId;
 return maps.find(map=>map.id===activeId) || maps[0] || null;
}
