import SiteBoot from '../components/ui/SiteBoot';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { entrarJogador } from '../services/jogadorApi';
import { MESTRE_AUTH_KEY, SENHA_MESTRE } from '../constants/masterAccess';
import { PRONOMES_JOGADOR, saudacaoJogador } from '../utils/saudacaoJogador';
import useLoginSound from '../utils/useLoginSound';
import '../styles/TelaInicial.css';

export const LOGIN_WELCOME_DURATION = 2600;
const navegar = destino => window.location.assign(destino);
const PERFIL_MESTRE_KEY = 'darkness:mestre:perfil';
function lerMestre() {
  try { return JSON.parse(localStorage.getItem(PERFIL_MESTRE_KEY)) || {}; } catch { return {}; }
}
export default function TelaInicial({ onNavigate = navegar, inicializar = true }) {
  const [iniciando,setIniciando]=useState(inicializar);
  const [loginRevelado,setLoginRevelado]=useState(!inicializar);
  const revelarLogin=useCallback(()=>setLoginRevelado(true),[]);
  const finalizarBoot=useCallback(()=>{setLoginRevelado(true);setIniciando(false);input.current?.focus();},[]);
  const [modo, setModo] = useState('jogador');
  const [senha, setSenha] = useState('');
  const [etapa, setEtapa] = useState('senha');
  const [erro, setErro] = useState('');
  const [boasVindas, setBoasVindas] = useState('');

  const [teclado, setTeclado] = useState(false);
  const [mestreNome, setMestreNome] = useState(() => lerMestre().nome || '');
  const [mestrePronome, setMestrePronome] = useState(() => lerMestre().pronome || 'Elu');
  const input = useRef(null), timer = useRef(null), ocupado = useRef(false), montado = useRef(true);
  const { tocar, ativo: somAtivo, alternar: alternarSom } = useLoginSound();
  const mestre = modo === 'mestre';
  const tema = mestre ? 'claro' : 'escuro';
  const entrando = etapa !== 'senha';
  useEffect(() => { montado.current = true; return () => { montado.current = false; clearTimeout(timer.current); }; }, []);
  function atualizarSenha(valor) {
    if (ocupado.current) return;
    const proxima = valor.replace(/\D/g, '').slice(0, mestre ? SENHA_MESTRE.length : 8);
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
    if (!senha) { setErro('Insira sua senha.'); input.current?.focus(); return; }
    ocupado.current = true; setEtapa('validando'); setErro('');
    try {
      if (mestre) {
        if (senha !== SENHA_MESTRE) throw new Error('Senha incorreta. Tente novamente.');
        const nome = mestreNome.trim() || 'Mestre';
        localStorage.setItem(PERFIL_MESTRE_KEY, JSON.stringify({ nome, pronome: mestrePronome }));
        sessionStorage.setItem(MESTRE_AUTH_KEY, 'true');
        receber(nome, mestrePronome, '/?mestre=1');
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
      <button type="button" onClick={alternarSom} aria-pressed={somAtivo} aria-label={somAtivo ? 'Desativar sons de teclado' : 'Ativar sons de teclado'}>SOM {somAtivo ? 'ON' : 'OFF'}</button>
    </div>
    <img className="login-simbolo" src="/simbolo-darkness.png" alt="Símbolo Darkness" draggable="false"/>
    {etapa === 'boas-vindas' && <h1 className="login-boas-vindas" role="status">{boasVindas}</h1>}
    <form className="login-form" onSubmit={entrar} aria-label={mestre ? 'Entrada do mestre' : 'Entrada do jogador'} aria-hidden={etapa === 'boas-vindas' ? true : undefined}>
      <fieldset disabled={entrando}>
        <h1 className="login-prompt"><label htmlFor="login-senha">{mestre ? "ÁREA DO MESTRE" : "ÁREA DO JOGADOR"}</label></h1>
        
        <div className="login-password" onClick={() => input.current?.focus()}>
          <div className="login-slots" aria-hidden="true">{Array.from({ length: mestre ? SENHA_MESTRE.length : Math.max(6, senha.length) }, (_, i) => <span key={i} className={i < senha.length ? 'preenchido' : ''}>{i < senha.length ? '●' : ''}</span>)}</div>
          <input id="login-senha" ref={input} type="password" inputMode="numeric" autoComplete="current-password" maxLength={mestre ? SENHA_MESTRE.length : 8} value={senha} onChange={e => atualizarSenha(e.target.value)} aria-invalid={!!erro} aria-describedby={erro ? 'login-erro' : 'login-ajuda'} aria-label={mestre ? 'Senha do mestre' : 'Senha do jogador'}/>
        </div>
        <p className="login-sr-only" id="login-ajuda">Digite a senha numérica e pressione Enter ou selecione Entrar.</p>
        {mestre && <details className="login-master-identity"><summary>Identificação do mestre</summary><div><label>Seu nome<input maxLength={80} value={mestreNome} onChange={e=>setMestreNome(e.target.value)} autoComplete="nickname" placeholder="Mestre"/></label><label>Pronome<select value={mestrePronome} onChange={e=>setMestrePronome(e.target.value)}>{PRONOMES_JOGADOR.map(p=><option key={p}>{p}</option>)}</select></label></div></details>}
        <div className="login-feedback" aria-live="polite">{erro && <p id="login-erro" role="alert">{erro}</p>}{etapa === 'validando' && <p>Verificando…</p>}</div>
        <nav className="login-acoes" aria-label="Acesso ao universo Darkness">
          <a href="?jogador=novo" aria-disabled={entrando} onClick={e=>{if(entrando)e.preventDefault();}}>CADASTRAR</a>
          <button type="submit">ENTRAR</button>
          <button type="button" onClick={trocarModo}>{mestre ? 'JOGADOR' : 'MESTRE'}</button>
        </nav>
        <button className="login-abrir-teclado" type="button" aria-expanded={teclado} onClick={()=>{setTeclado(!teclado);input.current?.focus();}}>Teclado numérico</button>
        {teclado && <div className="login-teclado" aria-label="Teclado numérico">{['1','2','3','4','5','6','7','8','9'].map(n=><button type="button" key={n} onClick={()=>atualizarSenha(senha+n)}>{n}</button>)}<button type="button" aria-label="Apagar dígito" onClick={()=>atualizarSenha(senha.slice(0,-1))}>⌫</button><button type="button" onClick={()=>atualizarSenha(senha+'0')}>0</button><button type="submit">OK</button></div>}
      </fieldset>
    </form>
  </main>{iniciando && <SiteBoot onFinish={finalizarBoot} onReveal={revelarLogin}/>}</>;
}
