import React from 'react';

// Coordinates follow the four attribute anchors, independent of the portrait size.
export default function AttributeSymbolLinks({symbol,active}) {
 if(!['absoluto','judgment'].includes(symbol))return null;
 return <svg className={'pd-attribute-symbol-links is-'+symbol} viewBox="0 0 360 360" preserveAspectRatio="none" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" strokeLinejoin="round">
 <>
  <g className="pd-symbol-link-scaffold"><path d="M15 87H345L180 345ZM22 91H338L180 336Z"/><path d="M180 5V355M7 180H353M48 180 180 44 312 180M48 180 180 318 312 180"/><circle cx="180" cy="180" r="71"/><circle cx="180" cy="180" r="78" strokeDasharray="3 9"/></g>
  <g data-active={active==='pulso'}><circle cx="180" cy="44" r="42"/><circle cx="180" cy="44" r="46" strokeDasharray="100 13 45 13 60 58"/><path d="M180 88V111M135 44H124M225 44H236"/></g>
  <g data-active={active==='voz'}><circle cx="48" cy="180" r="43"/><circle cx="48" cy="180" r="47" strokeDasharray="100 13 45 13 60 64"/><path d="M93 180H113M48 132V120M48 228V240"/></g>
  <g data-active={active==='razao'}><circle cx="312" cy="180" r="43"/><circle cx="312" cy="180" r="47" strokeDasharray="100 13 45 13 60 64"/><path d="M267 180H247M312 132V120M312 228V240"/></g>
  <g data-active={active==='sentido'}><path d="M180 269 229 317 180 355 131 317ZM180 262V250M180 355V359"/></g>
  {symbol==='judgment'&&<g className="pd-symbol-link-engraving"><circle cx="180" cy="180" r="111" strokeDasharray="1 7"/><path d="M48 180 180 318 312 180 180 44Z"/><circle cx="180" cy="180" r="118" strokeDasharray="52 16"/></g>}
 </>
 </svg>;
}
