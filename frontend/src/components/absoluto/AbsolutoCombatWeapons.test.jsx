import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import AbsolutoCombatWeapons,{combatWeapons} from './AbsolutoCombatWeapons';
test('armas usam o inventário original e preservam índice e status personalizados',()=>{
 const inventory=[{nome:'Lanterna'},{nome:'Pistola',armaStatus:{dmg:'1d6'}},{nome:'Faca',armaStatus:{dmg:'2d6'},statusPersonalizado:true}];
 const weapons=combatWeapons(inventory,[{nome:'Pistola',categoria:'armas-fogo',armaStatus:{dmg:'3d6'}},{nome:'Faca',categoria:'armas-corpo',armaStatus:{dmg:'1d6'}}]);
 expect(weapons.map(item=>[item.nome,item.index,item.armaStatus.dmg])).toEqual([['Pistola',1,'3d6'],['Faca',2,'2d6']]);
 expect(inventory[1].armaStatus.dmg).toBe('1d6');
});
test('ações de combate usam a arma selecionada e liberam dano após acerto',()=>{
 const weapon={nome:'Pistola',index:1,armaStatus:{dmg:'3d6',tipo:'Pistola'}};
 const onAttack=jest.fn(),onDamage=jest.fn(),onManage=jest.fn();
 const props={weapons:[weapon],onAttack,onDamage,onManage};
 const {rerender}=render(<AbsolutoCombatWeapons {...props} ready={false}/>);
 expect(screen.getByRole('button',{name:'Rolar dano de Pistola'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Atacar com Pistola'}));expect(onAttack).toHaveBeenCalledWith(weapon);
 rerender(<AbsolutoCombatWeapons {...props} ready/>);
 fireEvent.click(screen.getByRole('button',{name:'Rolar dano de Pistola'}));expect(onDamage).toHaveBeenCalledWith(weapon);
 fireEvent.click(screen.getByRole('button',{name:/Gerenciar no inventário/}));expect(onManage).toHaveBeenCalled();
});

test('acesso rápido exibe só as duas escolhas e permite trocar ou limpar',()=>{
 const weapons=[{nome:'Pistola',index:0,acessoRapidoCombate:1,armaStatus:{dmg:'1d6'}},{nome:'Faca',index:1,acessoRapidoCombate:2,armaStatus:{dmg:'2d6'}},{nome:'Rifle',index:2,armaStatus:{dmg:'3d6'}}];
 const onQuickChange=jest.fn();
 render(<AbsolutoCombatWeapons weapons={weapons} onQuickChange={onQuickChange}/>);
 expect(screen.getAllByRole('article')).toHaveLength(2);
 expect(screen.queryByRole('button',{name:'Atacar com Rifle'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Arma de acesso rápido 1'),{target:{value:'2'}});
 expect(onQuickChange).toHaveBeenCalledWith(1,2);
 fireEvent.change(screen.getByLabelText('Arma de acesso rápido 2'),{target:{value:''}});
 expect(onQuickChange).toHaveBeenCalledWith(2,null);
 expect(screen.getByLabelText('Arma de acesso rápido 1').querySelector('option[value="1"]')).toBeNull();
});
