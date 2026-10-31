import React from 'react';
export default function RefazerFicha({sistema,id,sheet}){
 return <div className="refazer-ficha" style={{fontSize:12,padding:'12px 0'}}>{sheet?.recriacaoPendente ? <span role="status">Recriação enviada · aguardando aprovação do mestre.</span> : <a href={`/?criar=1&sistema=${sistema}&refazer=${encodeURIComponent(id)}`} style={{color:'inherit'}}>Refazer ficha ↗</a>}<small style={{display:'block',opacity:.65,marginTop:6}}>Revise os dados na criação. A ficha atual só muda após aprovação do mestre.</small></div>;
}
