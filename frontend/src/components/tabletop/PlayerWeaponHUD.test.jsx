import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import WeaponHUD,{shortcutWeapons} from './PlayerWeaponHUD';

const activeCampaign={mecanicasEspeciais:{optionalSystems:[{kind:'ammo',enabled:true}]}};
const PlayerWeaponHUD=props=><WeaponHUD campaign={activeCampaign} {...props}/>;

test('HUD acompanha a ativação da contagem sem perder as balas da arma',()=>{
 const sheet={weapons:[{id:'a',name:'Pistola',ammo:3,acessoRapidoCombate:1}]};
 const {rerender}=render(<WeaponHUD sheet={sheet} campaign={activeCampaign}/>);
 expect(screen.getByRole('button',{name:'Pistola · 3 balas'})).toBeInTheDocument();
 rerender(<WeaponHUD sheet={sheet} campaign={{mecanicasEspeciais:{optionalSystems:[{kind:'ammo',enabled:false}]}}}/>);
 expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
 rerender(<WeaponHUD sheet={sheet} campaign={activeCampaign}/>);
 expect(screen.getByRole('button',{name:'Pistola · 3 balas'})).toBeInTheDocument();
 rerender(<WeaponHUD sheet={sheet}/>);
 expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
});

test('atalhos seguem a ordem dos slots e ignoram armas não selecionadas',()=>{
 const sheet={weapons:[{id:'a',name:'Rifle',acessoRapidoCombate:2},{id:'b',name:'Faca'},{id:'c',name:'Revólver',acessoRapidoCombate:1}]};
 expect(shortcutWeapons(sheet).map(w=>w.name)).toEqual(['Revólver','Rifle']);
});
test('mostra munição zero e atualiza o HUD quando a ficha muda',()=>{
 const onOpen=jest.fn();
 const {rerender}=render(<PlayerWeaponHUD onOpen={onOpen} sheet={{weapons:[{id:'a',name:'Revólver',ammo:6,acessoRapidoCombate:1}]}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Revólver · 6 balas'}));expect(onOpen).toHaveBeenCalled();
 rerender(<PlayerWeaponHUD sheet={{weapons:[{id:'a',name:'Revólver',ammo:0,acessoRapidoCombate:1}]}}/>);
 expect(screen.getByRole('button',{name:'Revólver · 0 balas'})).toBeInTheDocument();
});
test('Absoluto lê carregador do inventário e não exibe HUD sem atalhos',()=>{
 const {rerender}=render(<PlayerWeaponHUD sheet={{inventario:[{nome:'Pistola',acessoRapidoCombate:1,armaStatus:{dmg:'1d6',mag:7},municaoAtual:3}]}}/>);
 expect(screen.getByRole('button',{name:'Pistola · 3 balas'})).toBeInTheDocument();
 expect(screen.getByText('/ 7')).toBeInTheDocument();
 rerender(<PlayerWeaponHUD sheet={{weapons:[]}}/>);expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
});
