import React,{useEffect,useRef,useState} from 'react';
import '../CSS/SiteBoot.css';
export const BOOT_DURATION=3200;
const linhas=[
 'DARKNESS SYSTEM BIOS · v1.0',
 'Copyright (c) Universo Darkness',
 '',
 'Verificando memória........................ OK',
 'Montando arquivos de personagens........... OK',
 'Conectando sistemas ABSOLUTO / ESPIRAL...... OK',
 'Preparando arquivos de investigação........ OK',
 'Carregando protocolo de identificação...... OK',
 '',
 'C:\\DARKNESS> iniciar acesso',
 'Sistema pronto. Aguardando identificação.'
];
export default function SiteBoot({onFinish,onReveal}) {
 const [visiveis,setVisiveis]=useState(1),[saindo,setSaindo]=useState(false);
 const concluindo=useRef(false),skipTimer=useRef(null);
 const revelar=()=>{setSaindo(true);onReveal?.();};
 const pular=()=>{if(concluindo.current)return;concluindo.current=true;revelar();skipTimer.current=setTimeout(onFinish,reduzido?0:650);};
 const reduzido=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 useEffect(()=>{
  const tempo=reduzido?600:BOOT_DURATION;
  const timers=linhas.slice(1).map((_,i)=>setTimeout(()=>setVisiveis(i+2),reduzido?0:180+i*230));
  timers.push(setTimeout(revelar,tempo-(reduzido?0:650)),setTimeout(onFinish,tempo));
  return ()=>{timers.forEach(clearTimeout);clearTimeout(skipTimer.current);};
 },[onFinish,onReveal,reduzido]);
 return <main className={`site-boot ${saindo?'site-boot-exit':''}`} aria-label="Inicialização do Universo Darkness">
  <div className="site-boot-terminal"><div className="site-boot-caption"><span>UNIVERSO DARKNESS</span><span>INICIALIZAÇÃO</span></div>
   <div className="site-boot-lines" aria-hidden="true">{linhas.slice(0,visiveis).map((linha,i)=><div key={i}>{linha || '\u00a0'}</div>)}<span className="site-boot-cursor">▌</span></div>
   <div className="site-boot-footer"><div role="progressbar" aria-label="Inicializando o site" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(visiveis/linhas.length*100)}><span style={{width:`${visiveis/linhas.length*100}%`}}/></div><span>{Math.round(visiveis/linhas.length*100)}%</span></div>
   <p role="status" className="site-boot-sr">Inicializando o Universo Darkness. A tela de identificação abrirá em instantes.</p>
   <button type="button" onClick={pular}>Pular inicialização ↗</button>
  </div>
 </main>;
}