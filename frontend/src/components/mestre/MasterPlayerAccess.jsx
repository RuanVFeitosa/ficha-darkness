import React, { useState } from 'react';
import { entrarJogador } from '../../services/jogadorApi';
import { codigoJogadorDoMestre, desvincularJogadorDoMestre, vincularJogadorAoMestre } from '../../services/masterAccounts';
import '../../styles/PaginaJogador.css';
import '../../styles/CadastroJogador.css';

export default function MasterPlayerAccess({ mestreId, onNavigate }) {
  const [vinculado, setVinculado] = useState(() => codigoJogadorDoMestre(mestreId));
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function abrirPerfil(event) {
    event.preventDefault();
    if (carregando) return;
    const codigoEscolhido = vinculado || codigo;
    setCarregando(true);
    setErro('');
    try {
      await entrarJogador(codigoEscolhido);
      vincularJogadorAoMestre(mestreId, codigoEscolhido);
      onNavigate(`/?jogador=${encodeURIComponent(codigoEscolhido)}&origem=mestre`);
    } catch (error) {
      setErro(error.message);
      setCarregando(false);
    }
  }

  return <main className="pj pj-escuro pj-cadastro">
    <a href="/?mestre=1">← Painel do Mestre</a>
    <h1>Meus personagens</h1>
    <form className="pj-cadastro-form" onSubmit={abrirPerfil}>
      <p>Use seu perfil de jogador para consultar fichas, criar personagens e entrar em outras mesas.</p>
      {!vinculado && <label>Código de jogador<input required type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8}
        value={codigo} onChange={event => setCodigo(event.target.value.replace(/\D/g, ''))} /></label>}
      <button type="submit" disabled={carregando}>{carregando ? 'Abrindo perfil…' : vinculado ? 'Abrir meus personagens' : 'Vincular perfil e abrir'}</button>
      {vinculado ? <button type="button" disabled={carregando} onClick={() => { desvincularJogadorDoMestre(mestreId); setVinculado(null); setErro(''); }}>Trocar perfil de jogador</button>
        : <a href="/?jogador=novo&origem=mestre">Criar perfil de jogador</a>}
      {erro && <p role="alert">{erro}</p>}
    </form>
  </main>;
}
