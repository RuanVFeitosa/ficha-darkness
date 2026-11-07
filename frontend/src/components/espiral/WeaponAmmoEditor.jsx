import React from 'react';
import WeaponAmmoVisual from '../absoluto/WeaponAmmoVisual';
import '../../styles/WeaponAmmoEditor.css';

export default function WeaponAmmoEditor({name,value,onChange}) {
 const count=Math.max(0,Math.min(9999,Math.floor(Number(value) || 0)));
 return <div className="es-weapon-ammo-editor">
  <div className="es-weapon-ammo-summary"><span>MUNIÇÃO</span><WeaponAmmoVisual value={count} showCount={false}/>{count===0 && <small>Sem balas</small>}</div>
  <div className="es-weapon-ammo-controls"><button type="button" aria-label={`Gastar uma bala de ${name}`} disabled={count===0} onClick={()=>onChange(count-1)}>−</button><label><input aria-label={`Balas de ${name}`} type="number" min="0" max="9999" step="1" value={value ?? ''} onChange={event=>onChange(event.target.value===''?'':Math.max(0,Math.min(9999,Math.floor(Number(event.target.value) || 0))))}/><span>balas</span></label><button type="button" aria-label={`Adicionar uma bala em ${name}`} disabled={count>=9999} onClick={()=>onChange(count+1)}>+</button></div>
 </div>;
}
