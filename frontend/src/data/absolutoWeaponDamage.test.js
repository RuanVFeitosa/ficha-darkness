import {WEAPON_DAMAGE,atualizarDanoArma,rolarDanoTabela} from './absolutoWeaponDamage';
import {normalizarConteudoAbsoluto} from '../utils/absolutoModificadores';
import {CATALOGO_COMBATE} from './Catalogo/combate';
test.each(Object.entries(WEAPON_DAMAGE))('%s uses the new damage formula %s',(nome,damage)=>{
 expect(normalizarConteudoAbsoluto({nome,armaStatus:{dmg:'1d4'}}).armaStatus.dmg).toBe(damage);
});
test('existing firearm keeps ammunition and loses obsolete attack modes',()=>{
 const item=atualizarDanoArma({nome:'Pistola Sable 9mm',categoria:'armas-fogo',municaoAtual:4,armaStatus:{tipo:'Pistola',dmg:'3d8',mag:7,hipfire:'Violência',precision:'Percepção',control:'Persistência',mobility:'Firmeza'}});
 expect(item.armaStatus).toEqual({tipo:'Pistola',dmg:'2d10+3',mag:7});expect(item.municaoAtual).toBe(4);
 expect(atualizarDanoArma(item)).toEqual(item);
});
test('flat damage is added once and critical extra dice do not change it',()=>{
 expect(rolarDanoTabela('2d10+3',[],()=>0)).toMatchObject({dados:[1,1],total:5,formula:'2d10+3'});
 expect(rolarDanoTabela('2d10+3',[1],()=>0)).toMatchObject({dados:[1,1,1],total:6,formula:'3d10+3'});
 expect(rolarDanoTabela('4d12+2',[],()=>.999).total).toBe(50);
});
test('shop catalog serves updated firearm damage and no old mode bonuses',()=>{
 expect(CATALOGO_COMBATE.find(item=>item.id==='fuzil-assalto-helena').armaStatus.dmg).toBe('3d10+3');
 for(const item of CATALOGO_COMBATE.filter(item=>item.categoria==='armas-fogo'))expect(item.armaStatus.hipfire).toBeUndefined();
});
