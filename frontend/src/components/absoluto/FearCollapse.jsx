import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import './FearCollapse.css';

export default function FearCollapse({hope,protectionUsed=false,onChoose,onClose}) {
 const dialog=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  dialog.current?.querySelector('button:not(:disabled)')?.focus();
  return ()=>{document.body.style.overflow=overflow;previous?.focus?.();};
 },[]);
 const keyboard=e=>{
  if(e.key==='Escape'){e.stopPropagation();onClose();}
  if(e.key==='Tab'){
   const buttons=[...dialog.current.querySelectorAll('button:not(:disabled)')];
   const first=buttons[0],last=buttons[buttons.length-1];
   if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  }
 };
 return createPortal(<div className="fear-collapse-screen" role="dialog" aria-modal="true" aria-labelledby="fear-collapse-title" ref={dialog} onKeyDown={keyboard}>
  <svg className="fear-collapse-cracks" viewBox="0 0 1440 1000" preserveAspectRatio="none" aria-hidden="true">
   <g className="fear-crack-main"><path d="M0 110 110 160 155 145 237 252 274 268 339 390 415 438 482 542M1440 75 1340 183 1284 194 1220 312 1158 331 1083 467 1008 498M0 904 137 814 188 818 270 719 343 704 425 603M1440 912 1318 841 1262 760 1200 749 1133 631 1057 594M470 0 497 103 478 142 531 221M993 1000 953 907 968 864 922 782"/></g>
   <g className="fear-crack-branches"><path d="M155 145 181 83 173 20M237 252 165 287 125 276 65 312M339 390 368 304 350 273M415 438 348 458 318 496M1340 183 1287 118 1302 43M1220 312 1301 347 1344 328 1410 366M1158 331 1132 256 1101 228M1083 467 1158 484 1186 530M137 814 111 737 57 700M270 719 258 794 292 845M343 704 334 632 302 606M1318 841 1342 768 1407 728M1200 749 1174 819 1194 866M1133 631 1175 591 1224 598M497 103 565 93 604 54M953 907 877 922 843 968"/></g>
  </svg>
  <header><span>MEDO VI / COLAPSO</span><h2 id="fear-collapse-title">O medo exige uma escolha.</h2></header>
  <button className="fear-collapse-close" aria-label="Fechar escolhas de Colapso" onClick={onClose}>×</button>
  <div className="fear-collapse-constellation">
   <img src="/simbolo-absoluto.png" alt="" aria-hidden="true"/>
   <button className="fear-choice fear-choice-face" disabled={hope<5} onClick={()=>onChoose('enfrentar')}><span>Enfrentar o Medo</span><small>−5 Esperança · Medo volta a II</small>{hope<5 && <small>Esperança insuficiente</small>}</button>
   <button className="fear-choice fear-choice-flee" onClick={()=>onChoose('fugir')}><span>Fugir</span><small>Afaste-se da fonte</small></button>
   <button className="fear-choice fear-choice-shelter" onClick={()=>onChoose('abrigo')}><span>Buscar abrigo</span><small>Encontre um lugar seguro</small></button>
   <button className="fear-choice fear-choice-protect" disabled={protectionUsed} onClick={()=>onChoose('proteger')}><span>Proteger-se</span><small>{protectionUsed ? 'Proteção já utilizada' : '+3 Êxitos na Esquiva · Medo volta a V'}</small></button>
  </div>
  <footer>Escolha como seu personagem reage. As consequências do Medo continuam ativas.</footer>
 </div>,document.body);
}
