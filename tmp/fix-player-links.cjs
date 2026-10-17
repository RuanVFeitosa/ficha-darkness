const fs=require('fs'),r='frontend/src/';
let f=r+'services/jogadorApi.js',s=fs.readFileSync(f,'utf8');s=s.replace("sessionStorage.setItem('darkness:jogador', codigo);",`for (const ref of perfil.personagens || []) {
    localStorage.setItem('darkness:ficha-jogador:' + fichaKey(ref), codigo);
  }
  sessionStorage.setItem('darkness:jogador', codigo);`);s+=`
// A sessão pode pertencer a outra ficha aberta pelo mestre nesta mesma aba.
export async function paginaJogadorDaFicha(id, sistema) {
  const ref = { id: String(id), sistema };
  const candidatos = [...new Set([
    localStorage.getItem('darkness:ficha-jogador:' + fichaKey(ref)),
    sessionStorage.getItem('darkness:jogador')
  ].filter(Boolean))];
  for (const codigo of candidatos) {
    try {
      const perfil = await buscarJogador(codigo);
      if (perfil?.personagens?.some(p => String(p.id) === ref.id && p.sistema === sistema)) {
        localStorage.setItem('darkness:ficha-jogador:' + fichaKey(ref), codigo);
        return '/?jogador=' + encodeURIComponent(codigo);
      }
    } catch { /* Nunca usar uma sessão sem confirmar o vínculo. */ }
  }
  return '/?jogador=' + encodeURIComponent(id);
}
`;fs.writeFileSync(f,s);
fs.writeFileSync(r+'components/PlayerPageLink.jsx',`import React, {useEffect,useState} from 'react';
import {paginaJogadorDaFicha} from '../services/jogadorApi';
export default function PlayerPageLink({id,sistema,className,children='Página do Jogador'}) {
 const [href,setHref]=useState(null);
 useEffect(()=>{let ativo=true;setHref(null);paginaJogadorDaFicha(id,sistema).then(url=>{if(ativo)setHref(url);});return()=>{ativo=false;};},[id,sistema]);
 return <a className={className} href={href || undefined} aria-disabled={!href} onClick={event=>{if(!href)event.preventDefault();}}>{children}</a>;
}
`);
for(const file of ['pages/fichaEspiral.jsx','pages/fichaPersonagem.jsx']){f=r+file;s=fs.readFileSync(f,'utf8');s="import PlayerPageLink from '../components/PlayerPageLink';\n"+s;
if(file.includes('Espiral'))s=s.replace('{!embedded && sessionStorage.getItem("darkness:jogador") && <a className="es-store-link" href={`?jogador=${sessionStorage.getItem("darkness:jogador")}`}>Perfil do Jogador</a>}','{!embedded && <PlayerPageLink className="es-store-link" id={id} sistema="espiral"/>}');
else{s=s.replace('<a className="abs-return" href={sessionStorage.getItem(\'darkness:jogador\') ? `?jogador=${sessionStorage.getItem(\'darkness:jogador\')}` : \'?\'}>← Universo Darkness</a>','<PlayerPageLink className="abs-return" id={fichaId} sistema="darkness">← Página do Jogador</PlayerPageLink>');s=s.replace('{sessionStorage.getItem("darkness:jogador") && <a href={`?jogador=${sessionStorage.getItem("darkness:jogador")}`}>Perfil do Jogador</a>}','<PlayerPageLink id={fichaId} sistema="darkness"/>');}fs.writeFileSync(f,s);}
