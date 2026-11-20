import React from 'react';
import '../../styles/ProtocolMindEffects.css';
import HopeWhispers from '../absoluto/HopeWhispers';
const spiralPoints=Array.from({length:400},(_,i)=>{const t=i/399*Math.PI*9,r=3+i/399*84;return `${100+Math.cos(t)*r},${100+Math.sin(t)*r}`;}).join(' ');

export function protocolMindState(sanity, hope) {
  const safe = value => Math.max(0, Math.min(10, Number.isFinite(Number(value)) ? Number(value) : 10));
  const current = safe(sanity), remaining = safe(hope);
  return { sanity: current, hope: remaining, saturation: remaining / 10,
    perception: current === 0 ? 'rupture' : current <= 3 ? 'fragmented' : current <= 6 ? 'uncertain' : 'clear' };
}

export default function ProtocolMindEffects({ sanity, hope, messages, symbol='darkness' }) {
  const state = protocolMindState(sanity, hope);
  const loss=(10-state.sanity)/10, fading=(10-state.hope)/10;
  const darkness=!['espiral','absoluto'].includes(symbol);
  return <>
    {darkness && (loss>0 || fading>0) && <div className={`pd-darkness-resonance pd-perception-field is-${state.perception}`} style={{'--mind-fracture':loss,'--mind-fading':fading,'--mind-echo-opacity':loss*.65,'--mind-cycle':`${8-loss*5}s`}} aria-hidden="true"><span className="pd-darkness-fracture is-upper"/><span className="pd-darkness-fracture is-lower"/><span className="pd-darkness-afterimage"/></div>}
    {symbol==='absoluto' && (state.sanity < 10 || state.hope < 10) && <div className={`pd-perception-field pd-absoluto-echo is-${state.perception}`} style={{'--pd-absoluto-opacity':.22+Math.max(loss,fading)*.68,'--pd-glitch-cycle':`${4+state.sanity*.6}s`}} aria-hidden="true"><img src="/simbolo-absoluto.png" alt=""/><img className="pd-absoluto-fragment" src="/simbolo-absoluto.png" alt=""/></div>}
    {symbol==='espiral' && (state.hope < 10 || state.sanity < 10) && <div className="pd-hope-orbit" style={{opacity:.28+Math.max(loss,fading)*.62,'--pd-orbit-speed':`${12+state.hope*1.5}s`}} aria-hidden="true"><svg viewBox="0 0 200 200" fill="none"><polyline points={spiralPoints} stroke="currentColor" strokeWidth="1.5"/></svg></div>}
    {state.hope > 0 && state.hope <= 3 && <span className="pd-hope-fragment" aria-hidden="true">{state.hope <= 1 ? 'Até a luz parece distante.' : 'O caminho parece não ter fim.'}</span>}
    <HopeWhispers resource={{ atual: state.hope }} messages={messages}/>
  </>;
}
