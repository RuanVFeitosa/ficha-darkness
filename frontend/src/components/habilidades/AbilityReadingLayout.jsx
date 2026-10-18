import React,{createContext,useContext,useLayoutEffect,useRef,useState} from 'react';
import AbilityDocument from './AbilityDocument';
import '../../styles/AbilityReading.css';
const ReadingContext=createContext(null);
export const useAbilityReading=()=>useContext(ReadingContext);
export default function AbilityReadingLayout({children}){
 const [selected,setSelected]=useState(null),sheet=useRef(null),panel=useRef(null),trigger=useRef(null),savedScroll=useRef(0);
 const open=Boolean(selected);
 function close(){setSelected(null);requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}));}
 useLayoutEffect(()=>{
  if(!open)return;
  savedScroll.current=window.scrollY;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  if(sheet.current)sheet.current.scrollTop=savedScroll.current;
  window.scrollTo?.(0,0);
  return()=>{document.body.style.overflow=previous;window.scrollTo?.(0,savedScroll.current);};
 },[open]);
 useLayoutEffect(()=>{if(selected)panel.current?.querySelector('button')?.focus({preventScroll:true});},[selected]);
 useLayoutEffect(()=>{if(!open)return;const handle=e=>{if(e.key==='Escape' && !e.defaultPrevented){e.preventDefault();close();}};document.addEventListener('keydown',handle);return()=>document.removeEventListener('keydown',handle);},[open]);
 return <ReadingContext.Provider value={{open:(ability,type,seal)=>{trigger.current=document.activeElement;setSelected({ability,type,seal});}}}><div className={'ability-reading-layout'+(open?' is-reading':'')}>
 <div className="ability-sheet-pane" ref={sheet} onScroll={()=>{if(open && sheet.current)savedScroll.current=sheet.current.scrollTop;}}>{children}</div>
 {selected && <aside className="ability-reading-pane" ref={panel} role="region" aria-label={'Leitura da habilidade '+selected.ability.nome}>
 <header className="ability-reading-header"><div><small>CONSULTA DE HABILIDADE</small><span>{selected.type}{selected.seal?' · '+selected.seal:''}</span></div><button type="button" onClick={close} aria-label="Fechar leitura da habilidade" title="Fechar · Esc">×</button></header>
 <div className="ability-reading-content"><h2>{selected.ability.nome}</h2><AbilityDocument key={selected.ability.id || selected.ability.nome} habilidade={selected.ability}/></div>
 <footer className="ability-reading-footer"><span>A ficha continua disponível ao lado.</span><button type="button" onClick={close}>Voltar à ficha</button></footer>
 </aside>}
 </div></ReadingContext.Provider>;
}
