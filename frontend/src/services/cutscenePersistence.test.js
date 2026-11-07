import {criarCampanhaMesa,salvarCena,buscarCampanhaPorCodigo,ativarCena} from './mesaApi';
import {newCutsceneLayer,normalizeCutscene} from '../utils/cutscene';
import {cutsceneScenePayload} from '../components/cutscene/CutsceneWorkspace';
import {activeTabletopScene} from '../utils/tabletopScene';
test('salva, reabre e apresenta cutscene como cena especial nos tabletops',async()=>{
 localStorage.clear();
 const campaign=await criarCampanhaMesa('Cinema','3d');
 const project=normalizeCutscene({name:'A revelação',duration:12,layers:[newCutsceneLayer('token',12,{src:'/hero.png',animation:{enabled:true,closedImage:'/closed.png'}})]});
 const scene=await salvarCena(campaign.id,cutsceneScenePayload(project));
 await ativarCena(campaign.id,scene.id,'especial');
 const reopened=await buscarCampanhaPorCodigo(campaign.codigo);
 expect(reopened.cenaAtiva.cenaEspecial.cutscene).toEqual(project);
 expect(activeTabletopScene(reopened)).toMatchObject({type:'special',media:{tipoMidia:'cutscene',cutscene:project}});
 const changed={...project,name:'A nova revelação'};
 await salvarCena(campaign.id,{...cutsceneScenePayload(changed,reopened.cenaAtiva),cena_especial:{ativo:true,midiaUrl:'/old.gif'}});
 expect((await buscarCampanhaPorCodigo(campaign.codigo)).cenaAtiva.cenaEspecial.cutscene.name).toBe('A nova revelação');
});

test('reopens a 3D camera montage with its frozen scene and edited source range',async()=>{
 localStorage.clear();
 const campaign=await criarCampanhaMesa('Montagem 3D','3d');
 const recording3D={frames:[{time:0,position:[1,2,3],target:[0,1,0],fov:42},{time:5,position:[3,2,3],target:[0,1,0],fov:42}]};
 const project=normalizeCutscene({duration:5,layers:[newCutsceneLayer('map3d',5,{name:'Igreja',start:0,end:2,sourceIn:1,playbackRate:2,recording3D,map3D:{id:'church',assets:[],tokens:[{id:'threat',image:'/threat.png',position:[2,0,3]}]}})]});
 const scene=await salvarCena(campaign.id,cutsceneScenePayload(project));
 await ativarCena(campaign.id,scene.id,'especial');
 const reopened=await buscarCampanhaPorCodigo(campaign.codigo);
 expect(reopened.cenaAtiva.cenaEspecial.cutscene.layers[0]).toMatchObject({type:'map3d',sourceIn:1,playbackRate:2,recording3D,map3D:{id:'church',tokens:[{position:[2,0,3]}]}});
 expect(activeTabletopScene(reopened)).toMatchObject({type:'special'});
});
