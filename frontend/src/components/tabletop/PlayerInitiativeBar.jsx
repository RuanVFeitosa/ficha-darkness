import React,{useState} from 'react';
import InitiativeCards from './InitiativeCards';
import './PlayerInitiativeBar.css';

export default function PlayerInitiativeBar({campaign,entries,variant='2d'}) {
 const [collapsed,setCollapsed]=useState(false);
 if(!campaign?.combateAtivo && !campaign?.investigacaoAtiva) return null;
 return <section data-minimized={collapsed?'true':undefined} style={{'--initiative-system-symbol': `url("${process.env.PUBLIC_URL || ''}/simbolo-absoluto.png")`}} data-system={campaign.sistema || 'absoluto'} className={`mesa-shell player-initiative-bar player-initiative-${variant}`} aria-label={campaign.combateAtivo?'Iniciativa de combate':'Iniciativa de investigação'}>
  <button type="button" className="player-initiative-toggle" aria-label={collapsed?'Expandir iniciativas':'Recolher iniciativas'} aria-expanded={!collapsed} onClick={()=>setCollapsed(value=>!value)}><span>Iniciativa</span><small>{entries.length}</small><b aria-hidden="true">{collapsed?'⌄':'⌃'}</b></button>
  <div className="player-initiative-backdrop" aria-hidden="true">{campaign.sistema==='espiral' ? <svg viewBox="0 0 200 200" fill="none"><polyline points={Array.from({length:240},(_,i)=>{const t=i/239*Math.PI*9,r=3+i/239*93;return (100+Math.cos(t)*r)+','+(100+Math.sin(t)*r);}).join(' ')} stroke="currentColor" strokeWidth="1.5"/></svg> : <img src={(process.env.PUBLIC_URL || '')+'/simbolo-absoluto.png'} alt=""/>}</div>
  <InitiativeCards turn={campaign.combateAtivo?campaign.turnoCombate:null} entries={entries} system={campaign.sistema}/>
 </section>;
}
