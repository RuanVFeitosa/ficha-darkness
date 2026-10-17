import {fecharAnimado} from '../utils/pageMotion';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

export default function PlayerProfile({perfil,onSave}) {
 const [aberto,setAberto]=useState(!perfil.fotoPerfil);
 const [nome,setNome]=useState(perfil.nome || '');
 const [pronome,setPronome]=useState(perfil.perfilConfigurado ? perfil.pronome || '' : '');
 const [foto,setFoto]=useState(perfil.fotoPerfil || '');
 const [erro,setErro]=useState('');
 const [ocupado,setOcupado]=useState(false);
 const dialog=useRef(null),botao=useRef(null);
 const [portalRoot,setPortalRoot]=useState(null);
 useLayoutEffect(()=>{setPortalRoot(botao.current?.closest('.pj') || document.body);},[]);
 useEffect(()=>{if(aberto) dialog.current?.querySelector('input')?.focus();},[aberto,portalRoot]);
 const fechar=()=>fecharAnimado(dialog.current,()=>{setAberto(false);botao.current?.focus();});
 async function carregarFoto(e) {
  const file=e.target.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024){setErro('Escolha uma imagem PNG, JPG ou WebP de até 5 MB.');return;}
  setOcupado(true);setErro('');
  try {
   const url=URL.createObjectURL(file);
   try {
    const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const size=Math.min(img.width,img.height);canvas.getContext('2d').drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,256,256);
    setFoto(canvas.toDataURL('image/png'));
   }finally{URL.revokeObjectURL(url);}
  }catch{setErro('Não foi possível abrir essa imagem. Escolha outra foto.');}finally{setOcupado(false);}
 }
 async function salvar(e){e.preventDefault();setErro('');setOcupado(true);try{if(await onSave({...perfil,nome:nome.trim() || perfil.nome,pronome:pronome || undefined,fotoPerfil:foto,perfilConfigurado:true}))fechar();else setErro('Não foi possível salvar o perfil. Tente novamente.');}catch{setErro('Não foi possível salvar o perfil. Tente novamente.');}finally{setOcupado(false);}}
 return <div className="pj-player-profile">
  <button ref={botao} type="button" className="pj-profile-trigger" onClick={()=>{setNome(perfil.nome);setFoto(perfil.fotoPerfil || '');setPronome(perfil.perfilConfigurado ? perfil.pronome || '' : '');setAberto(true);}} aria-label={`Editar perfil de ${perfil.nome}`}>
   {perfil.fotoPerfil ? <img src={perfil.fotoPerfil} alt="Foto do jogador"/> : <span className="pj-profile-avatar" aria-hidden="true">{perfil.nome?.slice(0,1).toUpperCase() || '?'}</span>}<span>{perfil.nome}</span>
  </button>
  {aberto && portalRoot && createPortal(<div className="pj-profile-backdrop"><section className="pj-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="pj-profile-title" ref={dialog} onKeyDown={e=>{if(e.key==='Escape'&&!ocupado)fechar();if(e.key==='Tab'){const els=[...dialog.current.querySelectorAll('button:not(:disabled),input,select')];const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
   <small>SEU PERFIL NO UNIVERSO DARKNESS</small><h2 id="pj-profile-title">Como você quer aparecer?</h2><p>Esta é a sua identidade como jogador. O nome, o pronome e as fotos dos personagens continuam nas fichas.</p>
   <form onSubmit={salvar}><label className="pj-profile-photo">{foto ? <img src={foto} alt="Prévia da foto de perfil"/> : <span className="pj-profile-preview" aria-hidden="true">{nome?.slice(0,1).toUpperCase() || '?'}</span>}Foto de perfil<input type="file" accept="image/png,image/jpeg,image/webp" onChange={carregarFoto} disabled={ocupado}/></label>
   <label>Nome do jogador<input value={nome} onChange={e=>setNome(e.target.value)} maxLength={80}/></label><label>Pronome do jogador<select value={pronome} onChange={e=>setPronome(e.target.value)}><option value="">Prefiro não informar</option><option value="Ele">Ele · bem-vindo</option><option value="Ela">Ela · bem-vinda</option><option value="Elu">Elu · bem-vinde</option></select></label>
   {erro && <p role="alert">{erro}</p>}<div className="pj-profile-actions"><button type="button" onClick={fechar} disabled={ocupado}>Agora não</button><button disabled={ocupado}>{ocupado?'Salvando…':'Salvar perfil'}</button></div></form>
  </section></div>,portalRoot)}
 </div>;
}