import React, { useRef, useState } from 'react';
import { IDEIAS_PERSONAGEM, gerarPersonagemTemplate, clonarModeloPersonagem } from '../../utils/characterTemplateGenerator';
import { salvarFichaTemplate } from '../../services/characterTemplates';
import { fichaKey } from '../../services/jogadorApi';
import { PLAYER_CHARACTER_LIMIT } from '../../utils/playerCharacters';
import '../../styles/CharacterTemplateCreator.css';

export default function CharacterTemplateCreator({perfil,fichas,onSaveModelos,onCreated,onClose}) {
  const [sistema,setSistema] = useState('darkness');
  const [ideia,setIdeia] = useState('combate');
  const [modelo,setModelo] = useState('');
  const [rascunho,setRascunho] = useState(null);
  const [ocupado,setOcupado] = useState(false);
  const [erro,setErro] = useState('');
  const [mensagem,setMensagem] = useState('');
  const [origem,setOrigem] = useState('');
  const [nomeModelo,setNomeModelo] = useState('');
  const criada = useRef(null), trava = useRef(false);
  const modelos = perfil.templatesPersonagem || [];
  async function gerar() {
    setOcupado(true);setErro('');setMensagem('');
    try {
      const escolhido = modelos.find(m=>m.id===modelo && m.sistema===sistema);
      setRascunho(escolhido ? clonarModeloPersonagem(escolhido,perfil) : await gerarPersonagemTemplate(sistema,ideia,perfil));
    } catch(e) {setErro(e.message);} finally {setOcupado(false);}
  }
  async function criar() {
    if(trava.current)return;
    trava.current=true;setOcupado(true);setErro('');
    try {
      if(!criada.current) criada.current = await salvarFichaTemplate(sistema,rascunho,perfil);
      if(!await onCreated(criada.current)) throw new Error(`Ficha criada com código ${criada.current.id}, mas o vínculo falhou. Clique novamente para vincular sem criar outra ficha.`);
      onClose();
    } catch(e){setErro(e.message);}finally{trava.current=false;setOcupado(false);}
  }
  async function guardarModelo(e) {
    e.preventDefault();setErro('');setMensagem('');
    const ficha = fichas.find(f=>fichaKey(f)===origem);
    if(!ficha || !nomeModelo.trim()){setErro('Escolha uma ficha e dê um nome ao modelo.');return;}
    setOcupado(true);
    try {
      const novo = {id:`modelo-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,nome:nomeModelo.trim(),sistema:ficha.sistema,dados:JSON.parse(JSON.stringify(ficha.dados))};
      if(!await onSaveModelos([...modelos,novo])) throw new Error('Não foi possível salvar o modelo.');
      setNomeModelo('');setMensagem('Modelo salvo. Escolha o sistema dele para criar uma cópia.');
    } catch(e){setErro(e.message);}finally{setOcupado(false);}
  }
  const nome = rascunho && (sistema==='espiral' ? rascunho.name : rascunho.nome);
  return <section className="pj-template-creator" aria-label="Criar personagem template">
    <header><div><small>LABORATÓRIO DE PERSONAGENS</small><h2>Criar personagem template</h2></div><button type="button" onClick={onClose} disabled={ocupado} aria-label="Fechar criador de templates">×</button></header>
    <p>Crie uma ficha de teste completa a partir de uma ideia ou de um personagem seu. Ela ocupará uma das suas 10 vagas.</p>
    <fieldset disabled={ocupado || !!criada.current}>
      <label>Sistema do template<select value={sistema} onChange={e=>{setSistema(e.target.value);setModelo('');setRascunho(null);}}><option value="darkness">Sistema Absoluto</option><option value="espiral">ESPIRAL</option></select></label>
      <label>Usar modelo<select value={modelo} onChange={e=>{setModelo(e.target.value);setRascunho(null);}}><option value="">Gerar a partir de uma ideia</option>{modelos.filter(m=>m.sistema===sistema).map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
      {!modelo && <><h3>O que você imagina para esse ser?</h3><div className="pj-template-ideas">{IDEIAS_PERSONAGEM.map(i=><button type="button" key={i.id} aria-pressed={ideia===i.id} onClick={()=>{setIdeia(i.id);setRascunho(null);}}><strong>{i.nome}</strong><small>{i.descricao}</small></button>)}</div></>}
      <button type="button" onClick={gerar}>{rascunho?'Gerar outra versão':'Gerar personagem'}</button>
      {rascunho && <div className="pj-template-review"><label>Nome do personagem template<input maxLength={80} value={nome} onChange={e=>setRascunho({...rascunho,[sistema==='espiral'?'name':'nome']:e.target.value})}/></label><p>{sistema==='espiral'?`${rascunho.occupation} · ${rascunho.vertente}`:`${rascunho.classe} · ${rascunho.arquetipo}`}</p><dl>{Object.entries(sistema==='espiral'?rascunho.attributes:rascunho.atributos).map(([chave,valor])=><div key={chave}><dt>{chave}</dt><dd>{valor}</dd></div>)}</dl><p>{sistema==='espiral'?'Atributos e recursos respeitam os orçamentos iniciais. Inclui kit de equipamentos de teste.':'Existência, classe, arquétipo e integridade calculados pelo fluxo do Absoluto.'}</p><small>Revise os equipamentos e escolhas na ficha antes de usar em uma campanha.</small></div>}
    </fieldset>
    {rascunho && <button type="button" onClick={criar} disabled={ocupado || !nome?.trim() || (!criada.current && perfil.personagens.length>=PLAYER_CHARACTER_LIMIT)}>{criada.current?'Vincular ficha criada':'Criar e adicionar aos meus personagens'}</button>}
    <details><summary>Adicionar um personagem meu aos modelos</summary><form onSubmit={guardarModelo}><label>Ficha de origem<select value={origem} onChange={e=>setOrigem(e.target.value)} disabled={ocupado}><option value="">Selecione uma ficha sua</option>{fichas.map(f=><option key={fichaKey(f)} value={fichaKey(f)}>{f.nome} · {f.sistema==='espiral'?'ESPIRAL':'Absoluto'}</option>)}</select></label><label>Nome do modelo<input maxLength={60} value={nomeModelo} onChange={e=>setNomeModelo(e.target.value)} disabled={ocupado}/></label><button disabled={ocupado || modelos.length>=20}>Salvar personagem como modelo</button><p>Guarda uma cópia no perfil. A ficha original não é alterada. Até 20 modelos.</p></form></details>
    {erro && <p role="alert">{erro}</p>}{mensagem && <p role="status">{mensagem}</p>}
  </section>;
}
