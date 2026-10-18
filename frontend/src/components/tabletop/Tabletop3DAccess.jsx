import React, { useState } from 'react';
import { SENHA_MESTRE, TABLETOP_3D_AUTH_KEY } from '../../constants/masterAccess';
import { tabletop2DUrl } from '../../utils/tabletopRenderer';
export default function Tabletop3DAccess({ onAuthorized }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  return <main style={{ minHeight:'100dvh', display:'grid', placeItems:'center', padding:24, background:'#080a0b', color:'#eee' }}>
    <form onSubmit={event=>{event.preventDefault();if(password!==SENHA_MESTRE){setError('Senha incorreta.');return;}sessionStorage.setItem(TABLETOP_3D_AUTH_KEY,'true');onAuthorized();}} style={{width:'min(420px,100%)',padding:24,border:'1px solid #555',borderRadius:12,background:'#121516'}}>
      <h1 style={{fontSize:22}}>Abrir tabletop 3D</h1>
      <p style={{fontSize:13,lineHeight:1.6}}>Esta aba ainda não tem autorização para abrir o 3D. Informe a senha de acesso experimental.</p>
      <label style={{display:'grid',gap:8}}>Senha de acesso ao 3D<input autoFocus required type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} style={{padding:12}} /></label>
      <p role="alert">{error}</p>
      <button type="submit" style={{padding:12,marginRight:14}}>Entrar no 3D</button><a href={tabletop2DUrl(window.location.search)}>Voltar ao 2D</a>
    </form>
  </main>;
}
