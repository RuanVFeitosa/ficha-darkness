import React from 'react';
import Icon from '@mdi/react';
import {mdiDiceD6} from '@mdi/js';
export default function AttributeDicePool({value,name,title}){
 const count=Math.max(0,Math.min(20,Math.floor(Number(value)||0)));
 return <span className="abs-attribute-dice" role="img" aria-label={`${name}: ${count} ${count===1 ? 'dado' : 'dados'} de 6 faces`} title={title || `${count}d6 · Aumente pela tela de Upgrade`}>
  {count ? Array.from({length:count},(_,index)=><Icon key={index} path={mdiDiceD6} size={2} aria-hidden="true"/>) : <span aria-hidden="true">—</span>}
 </span>;
}
