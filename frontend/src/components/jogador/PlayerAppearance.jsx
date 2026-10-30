import React, { useState } from 'react';
import { CAMPOS_PALETA, PALETA_MONO, PALETA_CLARA, salvarPaletaFicha, variaveisEmblema } from '../../utils/playerAppearance';
import { fichaKey } from '../../services/jogadorApi';
import HaloEclipse from '../ui/HaloEclipse';
import TintedDarknessSymbol from '../ui/TintedDarknessSymbol';
import '../../styles/PlayerAppearance.css';

function Editor({ perfil, fichas, onSavePagina, onSavePaletas, onFichaSalva }) {
  const [biblioteca, setBiblioteca] = useState(perfil.paletasPersonalizadas || []);
  const [selecionada, setSelecionada] = useState('');
  const [nome, setNome] = useState('');
  const [cores, setCores] = useState({ ...PALETA_MONO, ...perfil.paletaPagina });
  const [alvo, setAlvo] = useState('pagina');
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const salva = biblioteca.find(p => p.id === selecionada);
  function escolher(id) {
    setSelecionada(id); setMensagem(''); setErro('');
    const paleta = biblioteca.find(p => p.id === id);
    setNome(paleta?.nome || '');
    if (paleta) setCores({ ...paleta.cores });
  }
  async function salvar(e) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Dê um nome à sua paleta.'); return; }
    if (!selecionada && biblioteca.length >= 30) { setErro('Você pode salvar até 30 paletas.'); return; }
    setOcupado(true); setErro(''); setMensagem('');
    const paleta = { id: selecionada || `paleta-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, nome: nome.trim(), cores: { ...cores } };
    const proximas = selecionada ? biblioteca.map(p => p.id === selecionada ? paleta : p) : [...biblioteca, paleta];
    try {
      if (!await onSavePaletas(proximas)) throw new Error('Não foi possível salvar a paleta. Tente novamente.');
      setBiblioteca(proximas); setSelecionada(paleta.id);
      setMensagem('Paleta salva na sua biblioteca. Escolha onde aplicar.');
    } catch (e) { setErro(e.message); } finally { setOcupado(false); }
  }
  async function aplicar() {
    if (!salva) return;
    setOcupado(true); setErro(''); setMensagem('');
    try {
      if (alvo === 'pagina') {
        if (!await onSavePagina(salva.cores)) throw new Error('Não foi possível aplicar a paleta.');
      } else {
        const ficha = fichas.find(f => fichaKey(f) === alvo);
        if (!ficha) throw new Error('Selecione uma ficha disponível.');
        const dados = await salvarPaletaFicha(ficha, salva.cores);
        onFichaSalva(ficha, dados);
      }
      setMensagem(alvo === 'pagina' ? 'Paleta aplicada à página.' : 'Paleta aplicada à ficha. Abra a ficha para ver as novas cores.');
    } catch (e) { setErro(e.message || 'Não foi possível aplicar a paleta.'); } finally { setOcupado(false); }
  }
  return <form onSubmit={salvar} className="pj-paletas-form">
    <h2>Suas paletas</h2><p>Crie combinações e guarde na sua biblioteca para usar na página e nas fichas.</p>
    <fieldset disabled={ocupado} className="pj-palette-library">
      <label>Paletas salvas<select value={selecionada} onChange={e => escolher(e.target.value)}><option value="">Nova paleta</option>{biblioteca.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
      <label>Nome da paleta<input value={nome} maxLength={60} onChange={e => setNome(e.target.value)} placeholder="Ex.: Eclipse dourado" /></label>
      <div className="pj-paletas-presets"><button type="button" onClick={() => { setCores({ ...PALETA_MONO }); setMensagem(''); }}>Preto e branco</button><button type="button" onClick={() => { setCores({ ...PALETA_CLARA }); setMensagem(''); }}>Branco e preto</button></div>
      <div className="pj-paletas-cores">{CAMPOS_PALETA.map(([campo, label]) => <label key={campo}>{label}<input aria-label={label} type="color" value={cores[campo]} onChange={e => { setCores({ ...cores, [campo]: e.target.value }); setMensagem(''); }} /><span>{cores[campo]}</span></label>)}</div>
      <fieldset className="pj-emblema-editor"><legend>Halo e símbolo</legend>
        <div className="pj-paletas-cores">{[['halo', 'Cor do halo', '#b9a0f3'], ['simbolo', 'Cor do símbolo', '#ffffff']].map(([campo, label, padrao]) => <label key={campo}>{label}<input type="color" aria-label={label} value={cores[campo] || padrao} onChange={e => { setCores({ ...cores, [campo]: e.target.value }); setMensagem(''); }} /><span>{cores[campo] || padrao}</span></label>)}</div>
        <div className="pj-emblema-preview" style={variaveisEmblema(cores)} aria-label="Prévia do halo e símbolo"><HaloEclipse /><TintedDarknessSymbol cor={cores.simbolo} /></div>
      </fieldset>
      <button type="submit">{selecionada ? 'Salvar alterações da paleta' : 'Salvar nova paleta'}</button>
      {selecionada && <button type="button" onClick={() => escolher('')}>Criar outra paleta</button>}
    </fieldset>
    {salva && <fieldset disabled={ocupado} className="pj-palette-apply"><legend>Aplicar paleta salva: {salva.nome}</legend>
      <label>Onde aplicar<select value={alvo} onChange={e => setAlvo(e.target.value)}><option value="pagina">Página do Jogador</option>{['darkness', 'espiral'].map(s => <optgroup key={s} label={s === 'darkness' ? 'Fichas do Sistema Absoluto' : 'Fichas do Sistema ESPIRAL'}>{fichas.filter(f => f.sistema === s).map(f => <option key={fichaKey(f)} value={fichaKey(f)}>{f.nome}</option>)}</optgroup>)}</select></label>
      <p>Aplica a versão salva. Salve suas alterações antes de aplicar.</p><button type="button" onClick={aplicar}>Aplicar paleta</button>
    </fieldset>}
    {mensagem && <p role="status">{mensagem}</p>}{erro && <p role="alert">{erro}</p>}
  </form>;
}
export default function PlayerAppearance(props) {
  const [aberto, setAberto] = useState(false);
  return <details className="pj-paletas" onToggle={e => setAberto(e.currentTarget.open)}><summary>Paletas de cores</summary>{aberto && <Editor {...props} />}</details>;
}
