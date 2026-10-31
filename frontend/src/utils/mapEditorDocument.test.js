import {initialEditorMap} from './mapEditorDocument';
const maps=[{id:'first',assets:[{instanceId:'a'}]},{id:'active',assets:[{instanceId:'b'}]}];
const campaign={mapas3D:maps,midiaAtivaId:'media',cenaAtiva:{mapasBatalha:[{id:'media',mapa3dId:'active',origem:'tabletop3d'}]}};
test('abre o mapa explícito ou o mapa ativo em vez de limpar o editor',()=>{
 expect(initialEditorMap(campaign,'first')).toBe(maps[0]);
 expect(initialEditorMap(campaign,'')).toBe(maps[1]);
 expect(initialEditorMap({mapas3D:maps},'')).toBe(maps[0]);
 expect(initialEditorMap(campaign,'missing')).toBeNull();
 expect(initialEditorMap({},'')).toBeNull();
});
