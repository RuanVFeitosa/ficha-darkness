import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabaseMedia as supabase } from '../../services/supabaseMedia';
let pending;
function MediaLogin({ finish }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (result.data?.session?.access_token) finish(result.data.session);
      else { setSignup(false); setMessage('Confira o e-mail de confirmação. Depois, entre para continuar o envio.'); }
    } catch (error) { setMessage(error.message || 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  };
  return <div style={{ position:'fixed', inset:0, zIndex:20000, background:'#000c', display:'grid', placeItems:'center', padding:20 }} onKeyDown={event => { if(event.key === 'Escape' && !busy) finish(null); }}>
    <form role="dialog" aria-modal="true" aria-labelledby="media-login-title" onSubmit={submit} style={{ width:'min(420px,100%)', padding:24, border:'1px solid #555', borderRadius:12, background:'#111315', color:'#eee', fontFamily:'Arial,sans-serif', boxShadow:'0 20px 70px #000' }}>
      <h2 id="media-login-title" style={{marginTop:0,fontSize:20}}>Conta para enviar arquivos</h2>
      <p style={{fontSize:13,lineHeight:1.6,color:'#bbb'}}>A senha do personagem ou do mestre não autentica arquivos. Entre com sua conta de arquivos do site. O envio será feito ao Cloudflare R2.</p>
      <label style={{display:'grid',gap:6,margin:'14px 0'}}>E-mail<input autoFocus required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:10,background:'#202326',color:'#fff',border:'1px solid #555'}} /></label>
      <label style={{display:'grid',gap:6,margin:'14px 0'}}>Senha da conta de arquivos<input required type="password" minLength={signup?6:undefined} autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} style={{padding:10,background:'#202326',color:'#fff',border:'1px solid #555'}} /></label>
      <p role="status" style={{fontSize:12,lineHeight:1.5}}>{message}</p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button disabled={busy} type="submit" style={{padding:'10px 14px',cursor:'pointer'}}>{busy?'Aguarde…':signup?'Criar conta':'Entrar e continuar'}</button><button disabled={busy} type="button" onClick={()=>finish(null)} style={{padding:'10px 14px'}}>Cancelar</button></div>
      <button disabled={busy} type="button" onClick={()=>{setSignup(!signup);setMessage('');}} style={{marginTop:16,padding:0,border:0,background:'transparent',color:'#c8d9ed',textDecoration:'underline',cursor:'pointer'}}>{signup?'Já tenho uma conta':'Não tenho uma conta de arquivos'}</button>
    </form>
  </div>;
}
export default function authenticateMedia() {
  if (!pending) pending = new Promise((resolve, reject) => {
    const host = document.createElement('div'); document.body.appendChild(host);
    const previousFocus = document.activeElement;
    const root = createRoot(host);
    const finish = session => {
      root.unmount(); host.remove(); previousFocus?.focus?.();
      if(session) resolve(session); else reject(new Error('Envio cancelado. Entre na conta de arquivos para continuar.'));
    };
    root.render(<MediaLogin finish={finish} />);
  }).finally(()=>{pending=null;});
  return pending;
}
