import React, { useState } from 'react';
import HaloEclipse from '../components/ui/HaloEclipse';
import { registrarMestre } from '../services/masterAccounts';
import '../styles/PaginaJogador.css';
import '../styles/CadastroJogador.css';

export default function CadastroMestre({ onNavigate }) {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function cadastrar(event) {
    event.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErro('');
    try {
      await registrarMestre(nome, codigo);
      onNavigate('/?mestre=1');
    } catch (error) {
      setErro(error.message);
      setSalvando(false);
    }
  }

  return <main className="pj pj-escuro pj-cadastro">
    <div className="pj-cadastro-arte" aria-hidden="true"><div className="pj-cadastro-emblema"><HaloEclipse /><img src="/simbolo-darkness.png" alt="" draggable="false" /></div></div>
    <a href="/">← Início</a>
    <h1>Cadastro de mestre</h1>
    <p><a href="/?jogador=novo">Cadastro de jogador ↗</a></p>
    <form className="pj-cadastro-form" onSubmit={cadastrar}>
      <label>Nome do mestre<input required autoComplete="nickname" value={nome} maxLength={80} onChange={event => setNome(event.target.value)} /></label>
      <label>Código de mestre<input required type="password" autoComplete="new-password" inputMode="numeric" pattern="[0-9]{4,16}"
        minLength={4} maxLength={16} aria-describedby="master-code-help" value={codigo} onChange={event => setCodigo(event.target.value.replace(/\D/g, ''))} /></label>
      <p id="master-code-help">Escolha um código de 4 a 16 dígitos para entrar no Painel do Mestre.</p>
      <button disabled={salvando}>{salvando ? 'Cadastrando…' : 'Criar conta de mestre'}</button>
      {erro && <p role="alert">{erro}</p>}
    </form>
  </main>;
}
