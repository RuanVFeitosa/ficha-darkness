import {applyMechanicAction,emptyMechanics} from './specialMechanics';
import {changeWeaponAmmo,weaponAmmo,ammoEnabled} from './optionalSystems';

test('sistemas opcionais são independentes das mecânicas de cena e preservam os contadores ao desativar',()=>{
 let state={...emptyMechanics(),activeId:'battle',events:[{id:'battle'}]};
 state=applyMechanicAction(state,{type:'optionalCreate',kind:'survival',id:'food'});
 state=applyMechanicAction(state,{type:'optionalToggle',id:'food'});
 state=applyMechanicAction(state,{type:'optionalSurvival',id:'food',playerId:'lia',key:'hunger',delta:50});
 state=applyMechanicAction(state,{type:'optionalToggle',id:'food'});
 expect(state.optionalSystems[0]).toMatchObject({enabled:false,participants:{lia:{hunger:10,thirst:0}}});
 expect(state.activeId).toBe('battle');expect(state.events).toEqual([{id:'battle'}]);expect(state.revision).toBe(4);
 expect(()=>applyMechanicAction(state,{type:'optionalCreate',kind:'survival',id:'duplicate'})).toThrow();
});
test('disparo e recarga conservam munição e respeitam os limites',()=>{
 let weapon={armaStatus:{mag:7},municaoAtual:2,municaoReserva:3};
 weapon=changeWeaponAmmo(weapon,'fire');expect(weaponAmmo(weapon)).toEqual({capacity:7,loaded:1,reserve:3});
 weapon=changeWeaponAmmo(weapon,'reload');expect(weaponAmmo(weapon)).toEqual({capacity:7,loaded:4,reserve:0});
 weapon=changeWeaponAmmo(weapon,'reserve',20);weapon=changeWeaponAmmo(weapon,'reload');expect(weaponAmmo(weapon)).toEqual({capacity:7,loaded:7,reserve:17});
 expect(()=>changeWeaponAmmo({...weapon,municaoAtual:0},'fire')).toThrow(/sem balas/);
 expect(weaponAmmo({armaStatus:{mag:7},municaoAtual:0}).loaded).toBe(0);
});
test('munição só é controlada quando explicitamente ativada na campanha',()=>{
 expect(ammoEnabled({})).toBe(false);
 expect(ammoEnabled({mecanicasEspeciais:{optionalSystems:[{kind:'ammo',enabled:true}]}})).toBe(true);
});
