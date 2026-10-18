import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import AbilityPageEditor from './AbilityPageEditor';
import {carregarRascunhoHabilidade,salvarRascunhoHabilidade} from '../../services/abilitySubmission';
import '../../styles/AbilityEditDialog.css';
export default function AbilityEditDialog({habilidade,fichaId,onSubmit,onClose}){
 const key='darkness:ability-edit:'+fichaId+':'+habilidade.id;
 const [draft,setDraft]=useState(()=>carregarRascunhoHabilidade(key)||{nome:habilidade.nome,descricao:habilidade.descricao||'',...(habilidade.paginas?{paginas:habilidade.paginas}:{})}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const ref=useRef(null),lock=useRef(false);
 useEffect(()=>{const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.querySelector('input')?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus();};},[]);
 useEffect(()=>{salvarRascunhoHabilidade(key,draft);},[draft,key]);
 async function send(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await onSubmit(draft);try{localStorage.removeItem(key);sessionStorage.removeItem(key);}catch{}onClose();}catch(e){setError(e.message||'Não foi possível enviar a edição.');}finally{lock.current=false;setBusy(false);}}
 return createPortal(<div className="ability-edit-backdrop"><section ref={ref} className="ability-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="ability-edit-title" onKeyDown={e=>{if(e.key==='Escape'&&!busy){e.stopPropagation();onClose();}if(e.key==='Tab'){const fields=[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary')].filter(el=>el.getClientRects().length>0);const first=fields[0],last=fields[fields.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
 <header><div><small>ALTERAÇÃO SUJEITA À APROVAÇÃO</small><h2 id="ability-edit-title">Editar habilidade</h2><p>A versão atual continua ativa até o mestre aprovar. Custo e recurso permanecem os mesmos.</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Fechar edição da habilidade">×</button></header>
 <div className="ability-edit-body"><label>Nome da habilidade<input value={draft.nome} maxLength={80} onChange={e=>setDraft({...draft,nome:e.target.value})}/></label><AbilityPageEditor value={draft} onChange={setDraft}/></div>
 <footer>{error && <p role="alert">{error}</p>}<button type="button" disabled={busy} onClick={onClose}>Cancelar</button><button type="button" disabled={busy} onClick={send}>{busy?'Enviando…':'Enviar edição ao mestre'}</button></footer>
 </section></div>,document.body);
}
