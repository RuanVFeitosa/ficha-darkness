import React,{useEffect,useRef,useState} from 'react';
export default function TokenQuickActions({name,hidden,members=[],audience,onVisibility,onFocus,onEdit,onInitiative,onClose}) {
 const close=useRef();const [value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const previous=document.activeElement;close.current?.focus();return ()=>previous?.focus?.();},[]);
 return <div className="tt3-quick-backdrop" onClick={onClose}><section role="dialog" aria-modal="true" aria-label={'Ações de '+name} className="tt3-quick-actions" onClick={e=>e.stopPropagation()} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')onClose();if(e.key==='Tab'){const nodes=[...e.currentTarget.querySelectorAll('button,input')].filter(node=>!node.disabled);const index=nodes.indexOf(document.activeElement);if(e.shiftKey&&index<=0){e.preventDefault();nodes[nodes.length-1]?.focus();}else if(!e.shiftKey&&index===nodes.length-1){e.preventDefault();nodes[0]?.focus();}}}}>
 <header><strong>{name}</strong><button ref={close} type="button" aria-label="Fechar ações do token" onClick={onClose}>×</button></header>
 <button type="button" onClick={onFocus}>Focar câmera</button><button type="button" onClick={onEdit}>Editar token</button>
 <button type="button" onClick={()=>onVisibility({hidden:!hidden})}>{hidden?'Mostrar aos jogadores':'Ocultar dos jogadores'}</button>
 <details><summary>Revelar individualmente</summary><label><input type="checkbox" checked={audience==null} onChange={e=>onVisibility({audience:e.target.checked?null:[]})}/>Todos os jogadores</label>{audience!=null&&members.filter(m=>m.papel!=='mestre').map(member=>{const id=String(member.ficha_id);return <label key={id}><input type="checkbox" checked={audience.includes(id)} onChange={e=>onVisibility({audience:e.target.checked?[...audience,id]:audience.filter(value=>value!==id)})}/>{member.nome || id}</label>;})}</details>
 {onInitiative&&<form onSubmit={async e=>{e.preventDefault();if(value===''||busy)return;setBusy(true);setError('');try{await onInitiative(Number(value));onClose();}catch(error){setError(error.message || 'Não foi possível adicionar à iniciativa.');}finally{setBusy(false);}}}><label>Iniciativa<input type="number" min="0" step="1" required value={value} onChange={e=>setValue(e.target.value)}/></label><button disabled={busy || value===''}>Adicionar à iniciativa</button></form>}
 {error&&<p role="alert">{error}</p>}
 </section></div>;
}
