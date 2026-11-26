import ProtocolLogo from '../components/ui/ProtocolLogo';
import HaloEclipse from '../components/ui/HaloEclipse';
import SiteBoot from '../components/ui/SiteBoot';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { entrarJogador } from '../services/jogadorApi';
import { entrarMestre } from '../services/masterAccounts';
import { saudacaoJogador } from '../utils/saudacaoJogador';
import useLoginSound from '../utils/useLoginSound';
import useLoginAmbient from '../utils/useLoginAmbient';
import '../styles/TelaInicial.css';

export const LOGIN_WELCOME_DURATION = 2600;
const navegar = destino => window.location.assign(destino);
export default function TelaInicial({ onNavigate = navegar, inicializar = true, modoInicial = 'jogador', destinoMestre }) {
  const [iniciando,setIniciando]=useState(inicializar);
  const [loginRevelado,setLoginRevelado]=useState(!inicializar);
  const revelarLogin=useCallback(()=>setLoginRevelado(true),[]);
  const finalizarBoot=useCallback(()=>{setLoginRevelado(true);setIniciando(false);input.current?.focus();},[]);
  const [modo, setModo] = useState(modoInicial);
  const [senha, setSenha] = useState('');
  const [etapa, setEtapa] = useState('senha');
  const [erro, setErro] = useState('');
  const [boasVindas, setBoasVindas] = useState('');

  const [teclado, setTeclado] = useState(false);
  const input = useRef(null), timer = useRef(null), ocupado = useRef(false), montado = useRef(true);
  const { tocar, ativo: somAtivo, alternar: alternarSom } = useLoginSound();
  const { ativo: musicaAtiva, alternar: alternarMusica } = useLoginAmbient();
  const mestre = modo === 'mestre';
  const tema = mestre ? 'claro' : 'escuro';
  const entrando = etapa !== 'senha';
  useEffect(() => { montado.current = true; return () => { montado.current = false; clearTimeout(timer.current); }; }, []);
  function atualizarSenha(valor) {
    if (ocupado.current) return;
    const proxima = valor.replace(/\D/g, '').slice(0, mestre ? 16 : 8);
    if (proxima !== senha) tocar(proxima.length < senha.length);
    setSenha(proxima); setErro('');
  }
  function trocarModo() {
    if (ocupado.current) return;
    setModo(mestre ? 'jogador' : 'mestre'); setSenha(''); setErro(''); setTeclado(false);
    input.current?.focus();
  }
  function receber(nome, pronome, destino) {
    setBoasVindas(saudacaoJogador(pronome, nome));
    setTeclado(false); setSenha(''); setEtapa('boas-vindas');
    timer.current = setTimeout(() => onNavigate(destino), LOGIN_WELCOME_DURATION);
  }
  async function entrar(event) {
    event.preventDefault();
    if (ocupado.current) return;
    if (!senha) { setErro(mestre ? 'Insira seu código de mestre.' : 'Insira sua senha.'); input.current?.focus(); return; }
    ocupado.current = true; setEtapa('validando'); setErro('');
    try {
      if (mestre) {
        const perfil = await entrarMestre(senha);
        if (!montado.current) return;
        receber(perfil.nome, undefined, destinoMestre || (perfil.papel === 'proprietario' ? '/?master=1' : '/?mestre=1'));
      } else {
        const perfil = await entrarJogador(senha);
        if (!montado.current) return;
        receber(perfil.nome?.trim().toLowerCase() === 'jogador' ? '' : (perfil.nome || ''), perfil.perfilConfigurado ? perfil.pronome : undefined, `/?jogador=${encodeURIComponent(senha)}`);
      }
    } catch (error) {
      if (!montado.current) return;
      ocupado.current = false; setEtapa('senha');
      setErro(error.message || 'Não foi possível entrar. Tente novamente.');
    }
  }

  return <><main aria-hidden={iniciando ? true : undefined} inert={iniciando ? "" : undefined} className={`login-screen login-boot-stage ${loginRevelado ? "" : "login-boot-hidden"} login-${tema} ${mestre ? 'login-is-master' : ''} ${etapa === 'boas-vindas' ? 'login-welcome' : ''}`}>
    <div className="login-preferencias" aria-label="Preferências da tela de login">
      <span className="login-papel">{mestre ? 'MESTRE' : 'JOGADOR'}</span>
      <button type="button" onClick={alternarMusica} aria-pressed={musicaAtiva} aria-label={musicaAtiva ? 'Desativar música ambiente' : 'Ativar música ambiente'}>MÚSICA {musicaAtiva ? 'ON' : 'OFF'}</button>
      <button type="button" onClick={alternarSom} aria-pressed={somAtivo} aria-label={somAtivo ? 'Desativar sons de teclado' : 'Ativar sons de teclado'}>SOM {somAtivo ? 'ON' : 'OFF'}</button>
    </div>
    <div className="login-atmosfera" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ '--i': i }} />)}</div>
    <div className="login-marca" aria-hidden="true"><ProtocolLogo /><span>O desconhecido espera por você</span></div>
    <div className="login-simbolo"><HaloEclipse /><img className="login-glyph" src="/simbolo-darkness.png" alt="Símbolo Darkness" draggable="false"/></div>
    {etapa === 'boas-vindas' && <h1 className="login-boas-vindas" role="status">{boasVindas}</h1>}
    <form className="login-form" onSubmit={entrar} aria-label={mestre ? 'Entrada do mestre' : 'Entrada do jogador'} aria-hidden={etapa === 'boas-vindas' ? true : undefined}>
      <fieldset disabled={entrando}>
        <h1 className="login-prompt">{mestre ? "ÁREA DO MESTRE" : "ÁREA DO JOGADOR"}</h1>
        
        <p className="login-instrucao">{mestre ? 'Toda história começa com quem a conduz.' : 'Sua próxima história começa aqui.'}</p>
        <div className="login-password" onClick={() => input.current?.focus()}>
          <div className="login-slots" aria-hidden="true">{Array.from({ length: Math.max(mestre ? 8 : 6, senha.length) }, (_, i) => <span key={i} className={i < senha.length ? 'preenchido' : ''}>{i < senha.length ? '●' : ''}</span>)}</div>
          <input id="login-senha" ref={input} type="password" inputMode="numeric" autoComplete="current-password" maxLength={mestre ? 16 : 8} value={senha} onChange={e => atualizarSenha(e.target.value)} aria-invalid={!!erro} aria-describedby={erro ? 'login-erro' : mestre ? undefined : 'login-ajuda'} aria-label={mestre ? 'Código de mestre' : 'Senha do jogador'}/>
        </div>
        {!mestre && <p className="login-sr-only" id="login-ajuda">Digite a senha numérica e pressione Enter ou selecione Entrar.</p>}
        <div className="login-feedback" aria-live="polite">{erro && <p id="login-erro" role="alert">{erro}</p>}{etapa === 'validando' && <p>Verificando…</p>}</div>
        <nav className="login-acoes" aria-label="Acesso ao universo Darkness">
          <a href={mestre ? '?mestre=novo' : '?jogador=novo'} aria-disabled={entrando} onClick={e=>{if(entrando)e.preventDefault();}}>CADASTRAR</a>
          <button type="submit">ENTRAR</button>
          <button type="button" onClick={trocarModo}>{mestre ? 'JOGADOR' : 'MESTRE'}</button>
        </nav>
        <a className="login-abrir-teclado" href="?ordem=1" onClick={event => { if (entrando) event.preventDefault(); }}>Ficha de Ordem Paranormal</a>
        <button className="login-abrir-teclado" type="button" aria-expanded={teclado} onClick={()=>{setTeclado(!teclado);input.current?.focus();}}>Teclado numérico</button>
        {teclado && <div className="login-teclado" aria-label="Teclado numérico">{['1','2','3','4','5','6','7','8','9'].map(n=><button type="button" key={n} onClick={()=>atualizarSenha(senha+n)}>{n}</button>)}<button type="button" aria-label="Apagar dígito" onClick={()=>atualizarSenha(senha.slice(0,-1))}>⌫</button><button type="button" onClick={()=>atualizarSenha(senha+'0')}>0</button><button type="submit">OK</button></div>}
      </fieldset>
    </form>
  </main>{iniciando && <SiteBoot onFinish={finalizarBoot} onReveal={revelarLogin}/>}</>;
}
