import React from 'react';
import '../../styles/WeaponAmmoVisual.css';

export default function WeaponAmmoVisual({value,capacity,showCount=true}) {
 if(value==null || value==='' || !Number.isFinite(Number(value)))return null;
 const count=Math.max(0,Math.floor(Number(value)));
 const total=Math.max(count,Math.floor(Number(capacity) || 0));
 return <span className="weapon-ammo-visual" aria-label={`${count} balas`}>
  <span className="weapon-ammo-visual-bars" aria-hidden="true">{Array.from({length:Math.min(total,60)},(_,i)=><i key={i} className={i<count?'is-loaded':''}/>)}</span>
  {showCount && <output>{count}{capacity>0 && <small> / {capacity}</small>}</output>}
 </span>;
}
