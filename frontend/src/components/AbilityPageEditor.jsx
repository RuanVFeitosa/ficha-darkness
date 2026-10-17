import AbilityFormattingToolbar from './AbilityFormattingToolbar';
import {formatAbilitySelection,abilityPageStyle} from '../utils/abilityFormatting';
import AbilityTableEditor from './AbilityTableEditor';
import {expandAbilityTable} from '../utils/abilityTables';
import React,{useRef,useState} from 'react';
import AbilityDocument from './AbilityDocument';
import {paginasHabilidade,descricaoDasPaginas,ABILITY_PAGE_LIMIT,ABILITY_MAX_PAGES,ABILITY_TOTAL_LIMIT} from '../utils/abilityPages';
export default function AbilityPageEditor({value,onChange}) {
 const paginas=paginasHabilidade(value),[indice,setIndice]=useState(0),[modo,setModo]=useState('dividido'),[aviso,setAviso]=useState(''),input=useRef(null);
 const [importRequest,setImportRequest]=useState(0);
 const [zoom,setZoom]=useState(100),[tabelas,setTabelas]=useState(false),[past,setPast]=useState([]),[future,setFuture]=useState([]);
 const atual=Math.min(indice,paginas.length-1),pagina=paginas[atual];
 const total=paginas.reduce((n,p)=>n+p.conteudo.length,0);
 function atualizar(proximas){setPast(previous=>[...previous.slice(-49),value]);setFuture([]);onChange({...value,paginas:proximas,descricao:descricaoDasPaginas(proximas)});}
 function editar(changes){atualizar(paginas.map((p,i)=>i===atual?{...p,...changes}:p));}
 function inserir(texto){const el=input.current,pos=el?.selectionStart ?? pagina.conteudo.length,end=el?.selectionEnd ?? pos;const novo=pagina.conteudo.slice(0,pos)+texto+pagina.conteudo.slice(end);if(novo.length<=ABILITY_PAGE_LIMIT && total-pagina.conteudo.length+novo.length<=ABILITY_TOTAL_LIMIT){editar({conteudo:novo});requestAnimationFrame(()=>{input.current?.focus();input.current?.setSelectionRange(pos+texto.length,pos+texto.length);});}}
 function comando(tipo){const el=input.current;if(!el){setModo('dividido');return;}const resultado=formatAbilitySelection(pagina.conteudo,el.selectionStart,el.selectionEnd,tipo);if(resultado.text.length>ABILITY_PAGE_LIMIT || total-pagina.conteudo.length+resultado.text.length>ABILITY_TOTAL_LIMIT){setAviso('Limite de caracteres atingido.');return;}editar({conteudo:resultado.text});requestAnimationFrame(()=>{input.current?.focus();input.current?.setSelectionRange(resultado.start,resultado.end);});}
 function desfazer(){if(!past.length)return;setFuture(previous=>[value,...previous]);onChange(past[past.length-1]);setPast(past.slice(0,-1));}
 function refazer(){if(!future.length)return;setPast(previous=>[...previous,value]);onChange(future[0]);setFuture(future.slice(1));}
 function expandirTabela(tipo){
  const novo=expandAbilityTable(pagina.conteudo,input.current?.selectionStart ?? pagina.conteudo.length,tipo);
  if(novo===null){setAviso('Insira uma tabela primeiro. Para escolher entre tabelas, posicione o cursor dentro dela.');return;}
  if(novo.length>ABILITY_PAGE_LIMIT || total-pagina.conteudo.length+novo.length>ABILITY_TOTAL_LIMIT){setAviso('Limite de caracteres atingido. Crie uma nova página para continuar.');return;}
  setAviso('');editar({conteudo:novo});
 }
 return <section className="ability-editor" aria-label="Editor da habilidade">
  <div className="ability-editor-pages"><nav aria-label="Editar páginas">{paginas.map((p,i)=><button type="button" key={i} aria-current={i===atual?'page':undefined} onClick={()=>setIndice(i)}>{i+1}. {p.titulo || 'Sem título'}</button>)}</nav><button type="button" disabled={paginas.length>=ABILITY_MAX_PAGES} onClick={()=>{atualizar([...paginas,{titulo:`Página ${paginas.length+1}`,conteudo:''}]);setIndice(paginas.length);}}>+ Nova página</button></div>
  <AbilityFormattingToolbar importTable={()=>{setModo('dividido');setTabelas(true);setImportRequest(n=>n+1);}} command={comando} undo={desfazer} redo={refazer} canUndo={past.length>0} canRedo={future.length>0} zoom={zoom} setZoom={setZoom} appearance={pagina.aparencia||{}} setAppearance={changes=>editar({aparencia:{...pagina.aparencia,...changes}})} mode={modo} setMode={setModo} tableOpen={tabelas} setTableOpen={setTabelas} insertTable={()=>{inserir('\n| Resultado | Efeito |\n| --- | --- |\n| 1–5 | Descreva o efeito |\n| 6–10 | Descreva o efeito |\n');setTabelas(true);}} expandTable={expandirTabela}/>
  {aviso && <p role="status">{aviso}</p>}
  <label>Título da página<input maxLength={100} value={pagina.titulo} onChange={e=>editar({titulo:e.target.value})}/></label>
  {modo!=="visualizar" && tabelas && <AbilityTableEditor key={atual} importRequest={importRequest} content={pagina.conteudo} onChange={novo=>{if(novo.length>ABILITY_PAGE_LIMIT || total-pagina.conteudo.length+novo.length>ABILITY_TOTAL_LIMIT){setAviso("Limite de caracteres atingido. Crie uma nova página para continuar.");return false;}setAviso("");editar({conteudo:novo});return true;}}/>}
  <div className={`ability-editor-workspace mode-${modo}`}>
   {modo!=='visualizar' && <div><label htmlFor="ability-page-content">Conteúdo da página</label><textarea id="ability-page-content" ref={input} style={{...abilityPageStyle(pagina),fontSize:(Number(pagina.aparencia?.tamanho)||13)*zoom/100+'px'}} onKeyDown={e=>{if(e.ctrlKey||e.metaKey){const key=e.key.toLowerCase();if(['b','i','u'].includes(key)){e.preventDefault();comando({b:'bold',i:'italic',u:'underline'}[key]);}if(key==='z'){e.preventDefault();e.shiftKey?refazer():desfazer();}if(key==='y'){e.preventDefault();refazer();}}}} value={pagina.conteudo} maxLength={Math.min(ABILITY_PAGE_LIMIT,ABILITY_TOTAL_LIMIT-total+pagina.conteudo.length)} onChange={e=>editar({conteudo:e.target.value})} placeholder="Escreva sua habilidade. Selecione um trecho e use a barra para formatar."/><small>{pagina.conteudo.length.toLocaleString('pt-BR')} / 12.000 caracteres nesta página · {total.toLocaleString('pt-BR')} / 100.000 no total</small></div>}
   {modo!=='editar' && <div className="ability-editor-preview"><span>PRÉVIA DO CARD · {value.nome || 'Sua habilidade'}</span><AbilityDocument key={atual} habilidade={{paginas:[pagina]}}/></div>}
  </div>
  <div className="ability-editor-page-actions"><span>Selecione um trecho para formatar · Ctrl+B / Ctrl+I / Ctrl+U</span><button type="button" disabled={paginas.length===1} onClick={()=>{if(pagina.conteudo.trim() && !window.confirm('Remover esta página e seu conteúdo?'))return;atualizar(paginas.filter((_,i)=>i!==atual));setIndice(Math.max(0,atual-1));}}>Remover página</button></div>
 </section>;
}