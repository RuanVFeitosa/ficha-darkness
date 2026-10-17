import React, {useEffect,useState} from 'react';
import {paginaJogadorDaFicha} from '../services/jogadorApi';
export default function PlayerPageLink({id,sistema,className,children='Página do Jogador',...props}) {
 const [href,setHref]=useState(null);
 useEffect(()=>{let ativo=true;setHref(null);paginaJogadorDaFicha(id,sistema).then(url=>{if(ativo)setHref(url);});return()=>{ativo=false;};},[id,sistema]);
 return <a {...props} className={className} href={href || undefined} aria-disabled={!href} onClick={event=>{if(!href)event.preventDefault();}}>{children}</a>;
}
