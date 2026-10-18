import React, { useState } from 'react';
import { CAMPOS_PALETA, PALETA_MONO, PALETA_CLARA, salvarPaletaFicha } from '../../utils/playerAppearance';
import { fichaKey } from '../../services/jogadorApi';
import '../../styles/PlayerAppearance.css';
function Editor({perfil,fichas,onSavePagina,onFichaSalva}) {
  const [alvo,setAlvo]=useState('pagina'),[cores,setCores]=useState({...PALETA_MONO,...perfil.paletaPagina}),[ocupado,setOcupado]=useState(false),[mensagem,setMensagem]=useState(''),[erro,setErro]=useState('');
  function escolher(valor) {
    setAlvo(valor);setMensagem('');setErro('');
    setCores({...PALETA_MONO,...(valor==='pagina' ? perfil.paletaPagina : fichas.find(f=>fichaKey(f)===valor)?.dados?.temaFicha)});
  }
  async function salvar(e) {
    e.preventDefault();setOcupado(true);setErro('');setMensagem('');
    try {
      if(alvo==='pagina') {if(!await onSavePagina(cores)) return;}
      else {const ficha=fichas.find(f=>fichaKey(f)===alvo);if(!ficha)throw new Error('Selecione uma ficha disponível.');const dados=await salvarPaletaFicha(ficha,cores);onFichaSalva(ficha,dados);}
      setMensagem(alvo==='pagina' ? 'Paleta da página salva.' : 'Paleta da ficha salva. Abra a ficha para ver as novas cores.');
    } catch(e) {setErro(e.message || 'Não foi possível salvar a paleta.');} finally {setOcupado(false);}
  }
  return <form onSubmit={salvar} className="pj-paletas-form"><h2>Suas paletas</h2><p>Personalize a página ou uma ficha. Cada escolha é salva separadamente.</p><label>Onde aplicar<select value={alvo} disabled={ocupado} onChange={e=>escolher(e.target.value)}><option value="pagina">Página do Jogador</option>{['darkness','espiral'].map(s=><optgroup key={s} label={s==='darkness' ? 'Fichas do Sistema Absoluto' : 'Fichas do Sistema ESPIRAL'}>{fichas.filter(f=>f.sistema===s).map(f=><option key={fichaKey(f)} value={fichaKey(f)}>{f.nome}</option>)}</optgroup>)}</select></label><div className="pj-paletas-presets"><button type="button" disabled={ocupado} onClick={()=>{setCores({...PALETA_MONO});setMensagem('');}}>Preto e branco</button><button type="button" disabled={ocupado} onClick={()=>{setCores({...PALETA_CLARA});setMensagem('');}}>Branco e preto</button></div><div className="pj-paletas-cores">{CAMPOS_PALETA.map(([campo,nome])=><label key={campo}>{nome}<input type="color" value={cores[campo]} disabled={ocupado} onChange={e=>{setCores({...cores,[campo]:e.target.value});setMensagem('');}}/><span>{cores[campo]}</span></label>)}</div><button type="submit" disabled={ocupado}>{ocupado ? 'Salvando…' : 'Salvar paleta'}</button>{mensagem && <p role="status">{mensagem}</p>}{erro && <p role="alert">{erro}</p>}</form>;
}
export default function PlayerAppearance(props) {
 const [aberto,setAberto]=useState(false);
 return <details className="pj-paletas" onToggle={e=>setAberto(e.currentTarget.open)}><summary>Paletas de cores</summary>{aberto && <Editor {...props}/>}</details>;
}
