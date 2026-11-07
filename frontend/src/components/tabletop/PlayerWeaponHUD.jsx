import React from 'react';
import Icon from '@mdi/react';
import {obterIconeItem} from '../../utils/itemIcons';
import {ammoEnabled,weaponAmmo} from '../../utils/optionalSystems';
import {combatWeapons} from '../absoluto/AbsolutoCombatWeapons';
import {CATALOGO_COMBATE} from '../../data/Catalogo/combate';
import '../../styles/PlayerWeaponHUD.css';

export function shortcutWeapons(sheet) {
 const weapons=Array.isArray(sheet?.weapons) ? sheet.weapons : combatWeapons(sheet?.inventario, CATALOGO_COMBATE);
 return [1,2].map(slot=>weapons.find(item=>Number(item.acessoRapidoCombate)===slot)).filter(Boolean);
}
export default function PlayerWeaponHUD({sheet,onOpen,campaign,enabled=ammoEnabled(campaign)}) {
 const weapons=shortcutWeapons(sheet);
 if(!enabled || !weapons.length)return null;
 return <aside className="player-weapon-hud" aria-label="Armas de acesso rápido">{weapons.map((weapon,index)=>{
  const name=weapon.nome || weapon.name || 'Arma';
  const icon=obterIconeItem({...weapon,nome:({Carabina:'Fuzil',Rifle:'Fuzil'})[name] || name});
  const image=typeof icon==='string' && (icon.includes('.svg') || icon.startsWith('data:image'));
  const capacity=weaponAmmo(weapon).capacity;
  const raw=capacity ? weaponAmmo(weapon).loaded : weapon.municaoAtual ?? weapon.ammo;
  const loaded=raw!=='' && raw!=null && Number.isFinite(Number(raw)) ? Math.max(0,Math.floor(Number(raw))) : null;
  return <button type="button" className="player-weapon-hud-slot" key={weapon.id || index} onClick={()=>onOpen?.(weapon)} title={name} aria-label={`${name}${loaded===null?'':` · ${loaded} balas`}`}>
   <span className="player-weapon-hud-icon">{image?<img src={icon} alt=""/>:<Icon path={icon} size={2.4}/>}</span>
   {loaded!==null && <span className="player-weapon-hud-ammo"><span className="player-weapon-hud-bullets" aria-hidden="true">{Array.from({length:Math.min(capacity || loaded,30)},(_,i)=><i className={i<loaded?'is-loaded':''} key={i}/>)}</span><span>{loaded}{capacity>0 && <small> / {capacity}</small>}</span></span>}
  </button>;
 })}</aside>;
}
