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
