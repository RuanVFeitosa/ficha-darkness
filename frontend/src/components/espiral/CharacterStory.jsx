import React,{useRef,useState} from 'react';
import {importStoryPdf} from '../../services/storyPdf';
import {externalizarImagens} from '../../services/mediaStorage';
import '../../styles/CharacterStory.css';

const blankPage=()=>({id:`story-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title:'',kind:'text',text:''});
export default function CharacterStory({sheet,setSheet}) {
  const input=useRef(null);
  const [selected,setSelected]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[textMode,setTextMode]=useState(false),[deleted,setDeleted]=useState(null);
  const legacy={id:'story-original',title:'Minha história',kind:'text',text:sheet.backgroundHistory || ''};
  const pages=Array.isArray(sheet.backgroundPages)&&sheet.backgroundPages.length?sheet.backgroundPages:[legacy];
  const index=Math.min(selected,pages.length-1),page=pages[index];
  function changePages(updater){setSheet(previous=>{const current=Array.isArray(previous.backgroundPages)&&previous.backgroundPages.length?previous.backgroundPages:[{...legacy,text:previous.backgroundHistory || ''}];return {...previous,backgroundPages:updater(current)};});}
  function edit(patch){changePages(current=>current.map(item=>item.id===page.id?{...item,...patch}:item));}
  function add(){const next=blankPage();changePages(current=>[...current,next]);setSelected(pages.length);setTextMode(false);setMessage('');}
  function remove(){setDeleted({page,index});changePages(current=>current.length===1?[blankPage()]:current.filter(item=>item.id!==page.id));setSelected(Math.max(0,index-1));setMessage('Página removida.');}
  async function importPdf(event){
    const file=event.target.files?.[0];event.target.value='';if(!file||busy)return;
    setBusy(true);setMessage('Abrindo PDF…');
    try {
      let imported=await importStoryPdf(file,(number,total)=>setMessage(`Importando página ${number} de ${total}…`));
      if(!imported.length)throw new Error('O PDF não contém páginas.');
      let localOnly=false;
      setMessage('Salvando páginas da história…');
      try{const uploaded=await externalizarImagens(imported);if(!Array.isArray(uploaded))throw new Error('Falha ao salvar imagens.');imported=uploaded;}catch{localOnly=true;}
      const replaceEmpty=pages.length===1&&!pages[0].text&&!pages[0].image&&!pages[0].title?.trim();
      const replaceLegacy=pages.length===1&&page.id==='story-original'&&!page.text;
      const replace=replaceEmpty||replaceLegacy;
      changePages(current=>replace?imported:[...current,...imported]);
      setSelected(replace?0:pages.length);setTextMode(false);setMessage(`${imported.length} página(s) importada(s).${localOnly?' As imagens não foram enviadas ao armazenamento remoto. Confira o estado de salvamento da ficha antes de fechar.':''}`);
    }catch(error){setMessage(error.message || 'Não foi possível importar o PDF.');}finally{setBusy(false);}
  }
  return <section className="pd-character-story" aria-label="História do personagem">
    <header className="pd-story-heading"><div><span>ARQUIVO PESSOAL</span><h2>A história de {sheet.name || 'seu personagem'}</h2></div><div><button type="button" disabled={busy} onClick={add}>+ Página</button><button type="button" disabled={busy} onClick={()=>input.current?.click()}>{busy?'Importando…':'Importar PDF'}</button><input ref={input} type="file" accept="application/pdf,.pdf" aria-label="Importar PDF da história" hidden onChange={importPdf}/></div></header>
    <div className="pd-story-toolbar"><nav aria-label="Páginas da história"><button type="button" aria-label="Página anterior da história" disabled={!index||busy} onClick={()=>{setSelected(index-1);setTextMode(false);}}>‹</button><select aria-label="Página da história" disabled={busy} value={index} onChange={event=>{setSelected(Number(event.target.value));setTextMode(false);}}>{pages.map((item,i)=><option key={item.id} value={i}>{i+1} · {item.title || 'Sem título'}</option>)}</select><button type="button" aria-label="Próxima página da história" disabled={index===pages.length-1||busy} onClick={()=>{setSelected(index+1);setTextMode(false);}}>›</button><small>{index+1} / {pages.length}</small></nav><button type="button" disabled={busy} onClick={remove}>Remover página</button></div>
    {message&&<p className="pd-story-message" role="status">{message}{deleted&&<button type="button" disabled={busy} onClick={()=>{changePages(current=>{const next=[...current];next.splice(Math.min(deleted.index,current.length),0,deleted.page);return next;});setSelected(deleted.index);setDeleted(null);setMessage('Página restaurada.');}}>Desfazer exclusão</button>}</p>}
    <article className="pd-story-paper"><input className="pd-story-title" aria-label="Título da página" placeholder={`Página ${index+1} · título opcional`} value={page.title || ''} disabled={busy} onChange={event=>edit({title:event.target.value})}/>
      {page.kind==='pdf'&&<div className="pd-story-pdf-tools"><small>{page.source} · página {page.sourcePage}</small><button type="button" disabled={busy} aria-pressed={textMode} onClick={()=>setTextMode(!textMode)}>{textMode?'Ver página original':'Editar texto'}</button></div>}
      {page.image&&!textMode?<img className="pd-story-pdf-page" src={page.image} alt={`Página ${page.sourcePage} de ${page.source}`}/>:<label className="pd-story-writing"><span className="sr-only">Texto da história · página {index+1}</span><textarea aria-label={`Texto da história · página ${index+1}`} value={page.text || ''} disabled={busy} placeholder={page.kind==='pdf'?'Este PDF não trouxe texto editável. Escreva aqui; a página original permanece disponível.':'Escreva a história do personagem…'} onChange={event=>edit({text:event.target.value})}/></label>}
    </article>
  </section>;
}
