import React from 'react';
import {tokenFlashlight} from '../../utils/flashlightAccess';
export default function PlayerUVControls({players,onChange}){
 return <section className="tt3-uv-clues"><span className="tt3-kicker">CONTROLE DO MESTRE</span><h3>UV dos jogadores</h3><p>Libere o modo UV por personagem ou ligue e apague a luz durante a sessão.</p>{players.map(player=>{
 const light=tokenFlashlight(player.state);const permitted=player.state?.uvPermitida!==false;
 const active=permitted && light.ativa && light.modo==='uv';
 return <article key={player.id}><strong>{player.name}</strong><label className="tt3-uv-permission"><input aria-label={`Permitir UV para ${player.name}`} type="checkbox" checked={permitted} onChange={event=>onChange(player.id,{uvPermitida:event.target.checked,...(!event.target.checked ? {lanterna:{...light,modo:'normal'}} : {})})}/> Modo UV disponível</label><div><button type="button" aria-label={`Ligar UV de ${player.name}`} disabled={!permitted || active} onClick={()=>onChange(player.id,{lanterna:{...light,modo:'uv',ativa:true}})}>Ligar UV</button><button type="button" aria-label={`Apagar UV de ${player.name}`} disabled={!active} onClick={()=>onChange(player.id,{lanterna:{...light,ativa:false}})}>Apagar UV</button></div><small>{!permitted ? 'UV bloqueado pelo mestre' : active ? 'UV ligada' : 'UV disponível para o jogador'}</small></article>;
 })}</section>;
}
