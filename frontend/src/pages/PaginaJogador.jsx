import {characterTemplates,PLAYER_CHARACTER_LIMIT,PLAYER_CHARACTER_PAGE_SIZE,validateCharacterLimit} from '../utils/playerCharacters';
import {fecharAnimado} from '../utils/pageMotion';
import PlayerProfile from '../components/PlayerProfile';
import EvidenceGrid from '../components/EvidenceGrid';
import PlayerAppearance from "../components/PlayerAppearance";
import { variaveisPaleta } from "../utils/playerAppearance";
import CharacterDossier from "../components/CharacterDossier";
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { entrarJogador, carregarFicha, fichaKey, fichaHref, documentoVisivel } from '../services/jogadorApi';
import { salvarJogador } from '../services/personagemApi';
import { listarCampanhasDaFicha } from '../services/mesaApi';
import { catalogoBuilds } from '../utils/buildCatalog';
import BuildCatalog from '../components/BuildCatalog';


import ComputadorModerno from '../components/ComputadorModerno';
import ReprodutorCassete from '../components/ReprodutorCassete';
import EvidenceImageViewer from '../components/EvidenceImageViewer';
import '../CSS/PaginaJogador.css';
import '../CSS/PaginaJogadorResponsive.css';
import '../CSS/PaginaJogadorMotion.css';
import '../CSS/PaginaJogadorRefined.css';
export { catalogoBuilds } from '../utils/buildCatalog';

function Simbolo({ sistema }) {
  return sistema === 'espiral' ? <svg viewBox="0 0 200 200" aria-hidden="true"><polyline fill="none" stroke="currentColor" strokeWidth="2" points={Array.from({length:300},(_,i)=>{const a=i/299*Math.PI*10,r=4+i/299*85;return `${100+Math.cos(a)*r},${100+Math.sin(a)*r}`;}).join(' ')}/></svg> : <img src="/simbolo-absoluto.png" alt="Símbolo do Sistema Absoluto"/>;
}
function Documento({ doc }) {
  const mime = doc.mimeType || doc.mime_type || '';
  if (mime.includes('modern-pc')) return <ComputadorModerno campanhaId={doc.campanhaId} documento={doc} admin={false}/>;
  if (mime.includes('cassete') || mime.startsWith('audio/')) return <ReprodutorCassete documento={doc}/>;
  if (doc.categoria === 'interativa') return <iframe title={doc.nome} sandbox="allow-scripts allow-same-origin allow-forms" src={doc.url || '/interactive/ms-dos/index.html'}/>;
  if (mime.startsWith('image/')) return <div className="pj-mesa-foto"><EvidenceImageViewer src={doc.url} alt={doc.nome}/></div>;
  if (mime.startsWith('video/')) return <video controls src={doc.url}/>;
  if (mime === 'application/pdf') return <iframe title={doc.nome} src={doc.url}/>;
  return <p>Abra o arquivo para consultar seu conteúdo.</p>;
}
export default function PaginaJogador({ codigo }) {
  const [perfil, setPerfil] = useState(null), [fichas, setFichas] = useState([]), [campanhas, setCampanhas] = useState([]);
  const [templates,setTemplates]=useState(false),[paginaPersonagens,setPaginaPersonagens]=useState(0);
  const fichasTemplates=useMemo(characterTemplates,[]);
  const listaPersonagens=templates?fichasTemplates:fichas;
  const totalPaginasPersonagens=Math.max(1,Math.ceil(listaPersonagens.length/PLAYER_CHARACTER_PAGE_SIZE));
  const paginaAtualPersonagens=Math.min(paginaPersonagens,totalPaginasPersonagens-1);
  const fichasVisiveis=listaPersonagens.slice(paginaAtualPersonagens*PLAYER_CHARACTER_PAGE_SIZE,(paginaAtualPersonagens+1)*PLAYER_CHARACTER_PAGE_SIZE);
  const [adicionando,setAdicionando]=useState(false),painelAdicionar=useRef(null),botaoAdicionar=useRef(null);
  useEffect(()=>{if(adicionando){painelAdicionar.current?.querySelector('h2')?.focus({preventScroll:true});if(window.innerWidth<=1000)painelAdicionar.current?.scrollIntoView?.({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});}},[adicionando]);
  function fecharAdicionar(){setAdicionando(false);botaoAdicionar.current?.focus();}
  const [aba, setAba] = useState('personagens'), [erro, setErro] = useState(''), [aviso, setAviso] = useState(''), [ocupado, setOcupado] = useState(false);
  const [pronome, setPronome] = useState('Elu');
  const [novoCodigo, setNovoCodigo] = useState(''), [nome, setNome] = useState(''), [sistema, setSistema] = useState('darkness'), [vinculo, setVinculo] = useState('');
  const [revelado, setRevelado] = useState(''), [doc, setDoc] = useState(null), [campanhaFiltro, setCampanhaFiltro] = useState('');
  const [busca, setBusca] = useState(''), [buildNome, setBuildNome] = useState(''), [selecionadas, setSelecionadas] = useState([]), [notas, setNotas] = useState(''), [editando, setEditando] = useState(null);
  const catalogo = useMemo(catalogoBuilds, []);
  useEffect(() => {
    document.title = 'Perfil do Jogador · Universo Darkness';
    if (codigo === 'novo') return;
    let ativo = true;
    setPerfil(null); setErro('');
    entrarJogador(codigo).then(p => { if (ativo) { setPerfil(p); setNome(p.nome); setPronome(p.pronome || 'Elu'); } }).catch(e => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [codigo]);
  useEffect(() => {
    if (!perfil) return;
    let ativo = true;
    Promise.allSettled(perfil.personagens.map(carregarFicha)).then(resultados => {
      if (!ativo) return;
      setFichas(resultados.filter(r => r.status === 'fulfilled').map(r => r.value));
      if (resultados.some(r => r.status === 'rejected')) setAviso('Algumas fichas não puderam ser carregadas. Fichas ESPIRAL precisam estar salvas neste dispositivo.');
    });
    Promise.allSettled(perfil.personagens.map(p => listarCampanhasDaFicha(p.sistema === 'espiral' ? `espiral:${p.id}` : p.id))).then(resultados => {
      if (!ativo) return;
      setCampanhas([...new Map(resultados.filter(r => r.status === 'fulfilled').flatMap(r => r.value).map(c => [c.id, c])).values()]);
      if (resultados.some(r => r.status === 'rejected')) setAviso('Não foi possível consultar todas as campanhas. Tente recarregar a página.');
    });
    return () => { ativo = false; };
  }, [perfil]);
  async function persistir(proximo) {
    setOcupado(true); setErro('');
    try { const salvo = await salvarJogador(codigo, proximo); setPerfil(salvo); return true; }
    catch (e) { setErro(e.message); return false; }
    finally { setOcupado(false); }
  }
  async function criarPerfil(e) {
    e.preventDefault(); setOcupado(true); setErro('');
    try { const p = await entrarJogador(novoCodigo, true); await salvarJogador(novoCodigo, { ...p, nome: nome.trim() || p.nome, pronome }); window.location.href = `/?jogador=${novoCodigo}`; }
    catch(e) { setErro(e.message); setOcupado(false); }
  }
  async function vincular(e) {
    e.preventDefault(); setErro(''); setOcupado(true);
    try {
      validateCharacterLimit([...perfil.personagens,{id:vinculo.trim(),sistema}]);
      const ref = { id: vinculo.trim(), sistema };
      await carregarFicha(ref);
      if (perfil.personagens.some(p => fichaKey(p) === fichaKey(ref))) throw new Error('Este personagem já está no perfil.');
      if (await persistir({ ...perfil, personagens: [...perfil.personagens, ref] })) setVinculo('');
    } catch(e) { setErro(e.message); } finally { setOcupado(false); }
  }
  async function salvarBuild(e) {
    e.preventDefault();
    const build = { id: editando || `${Date.now()}-${Math.random().toString(36).slice(2)}`, nome: buildNome.trim(), habilidades: selecionadas, notas };
    if (!build.nome || !selecionadas.length) { setErro('Dê um nome à build e selecione ao menos uma habilidade ou item.'); return; }
    const builds = editando ? perfil.builds.map(b => b.id === editando ? build : b) : [...perfil.builds, build];
    if (await persistir({ ...perfil, builds })) { setAviso('Build salva no perfil.'); setEditando(build.id); }
  }
  const ids = perfil?.personagens.map(p => p.sistema === 'espiral' ? `espiral:${p.id}` : p.id) || [];
  const documentos = campanhas.filter(c => !campanhaFiltro || c.id === campanhaFiltro).flatMap(c => (c.documentosInvestigacao || []).filter(d => documentoVisivel(d, ids)).map(d => ({ ...d, campanhaId: c.id, campanhaNome: c.nome })));
  const evidenciaInterativa = !!doc && ((doc.mimeType || doc.mime_type || '').includes('modern-pc') || doc.categoria === 'interativa');
  if (codigo === 'novo') return <main className="pj pj-escuro pj-cadastro"><a href="?">← Início</a><p className="pj-eyebrow">UNIVERSO DARKNESS / NOVO ARQUIVO</p><h1>Seu lugar<br/>neste universo.</h1><form onSubmit={criarPerfil}><label>Nome do jogador<input required value={nome} onChange={e => setNome(e.target.value)} maxLength={80}/></label><label>Pronome do jogador<select value={pronome} onChange={e=>setPronome(e.target.value)}>{["Ele","Ela","Elu"].map(p=><option key={p}>{p}</option>)}</select></label><label>Senha do Jogador<input required type="password" autoComplete="new-password" inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} value={novoCodigo} onChange={e => setNovoCodigo(e.target.value.replace(/\D/g,''))}/></label><p>Escolha uma senha numérica de 4 a 8 dígitos para entrar pelo painel. O código antigo do personagem também funciona como senha do jogador.</p><button disabled={ocupado}>Criar / acessar perfil</button>{erro && <p role="alert">{erro}</p>}</form></main>;
  if (!perfil) return <main className="pj pj-escuro"><a href="?">← Início</a><p role={erro ? 'alert' : 'status'}>{erro || 'Abrindo seu arquivo…'}</p></main>;
  return <main className={`pj pj-dashboard pj-refined ${perfil.paletaPagina ? 'pj-paleta-personalizada' : ''}`} style={variaveisPaleta(perfil.paletaPagina)}>
    <div className="pj-marca-lateral" aria-hidden="true"><img src="/simbolo-darkness.png" alt=""/></div>
    <header className="pj-topo"><a href="?" className="pj-marca">← UNIVERSO DARKNESS</a><PlayerAppearance perfil={perfil} fichas={fichas} onSavePagina={paleta=>persistir({...perfil,paletaPagina:paleta})} onFichaSalva={(ficha,dados)=>setFichas(atuais=>atuais.map(f=>fichaKey(f)===fichaKey(ficha) ? {...f,dados} : f))}/><PlayerProfile key={codigo} perfil={perfil} onSave={persistir}/></header>
    <div className="pj-file-intro"><div><span className="pj-file-eyebrow">ARQUIVO PESSOAL / JOGADOR</span><h1>Seu arquivo.</h1><p>Personagens, descobertas e os próximos passos da sua história.</p></div><span className="pj-file-index">UNIVERSO<br/>DARKNESS <i aria-hidden="true">↗</i></span></div>
    <nav className="pj-abas" aria-label="Áreas do jogador">{[['personagens','01','Personagens'],['investigacao','02','Investigação'],['livros','03','Livros de regras'],['builds','04','Builds']].map(([id,n,label]) => <button key={id} aria-current={aba === id ? 'page' : undefined} onClick={() => {setAba(id); setDoc(null);}}><small>{n}</small>{label}</button>)}</nav>
    {erro && <p className="pj-alerta" role="alert">{erro}</p>}{aviso && <p className="pj-alerta" role="status">{aviso}<button aria-label="Fechar aviso" onClick={() => setAviso('')}>×</button></p>}
    {aba === 'personagens' && <section className={`pj-area-personagens pj-character-roster ${adicionando?'pj-adding-character':''}`} aria-label="Seus personagens">
      <div className="pj-characters-main"><header className="pj-collection-header"><div><small>DOSSIÊS VINCULADOS</small><h2>{templates?'Templates de teste':'Seus personagens'}</h2></div><span>{listaPersonagens.length} / {PLAYER_CHARACTER_LIMIT} personagens</span></header>
      {templates && <p className="pj-demo-notice" role="status">Demonstração com 10 templates. Esses modelos não alteram suas fichas nem ocupam vagas no perfil.</p>}
      <div className="pj-personagens">{fichasVisiveis.map(f=><CharacterDossier key={fichaKey(f)} ficha={f} aberto={revelado===fichaKey(f)} onToggle={()=>setRevelado(revelado===fichaKey(f) ? '' : fichaKey(f))}/>)}</div>
      {listaPersonagens.length>PLAYER_CHARACTER_PAGE_SIZE && <nav className="pj-character-pagination" aria-label="Páginas de personagens"><span>Página {paginaAtualPersonagens+1} de {totalPaginasPersonagens}</span><div>{Array.from({length:totalPaginasPersonagens},(_,i)=><button type="button" key={i} aria-label={'Página '+(i+1)+' de personagens'} aria-current={paginaAtualPersonagens===i?'page':undefined} onClick={()=>{setPaginaPersonagens(i);setRevelado('');}}>{i+1}</button>)}</div></nav>}
      {!listaPersonagens.length && <p className="pj-vazio">Seu arquivo começa aqui. Crie um personagem ou vincule uma ficha existente.</p>}
      <div className="pj-gerenciar"><button disabled={perfil.personagens.length>=PLAYER_CHARACTER_LIMIT} ref={botaoAdicionar} type="button" className="pj-add-character-trigger" aria-expanded={adicionando} aria-controls="pj-add-character-panel" onClick={()=>adicionando?fecharAdicionar():setAdicionando(true)}>{perfil.personagens.length>=PLAYER_CHARACTER_LIMIT?'Limite de 10 personagens atingido':'+ Adicionar personagem'}</button><button type="button" className="pj-template-trigger" aria-pressed={templates} onClick={()=>{setTemplates(!templates);setPaginaPersonagens(0);setRevelado('');}}>{templates?'Voltar aos meus personagens':'Testar com 10 templates'}</button></div>
      </div>
      {adicionando && <aside ref={painelAdicionar} id="pj-add-character-panel" className="pj-system-picker" aria-label="Adicionar personagem" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();fecharAdicionar();}}}>
        <header><div><small>NOVO DOSSIÊ</small><h2 tabIndex={-1}>Escolha seu sistema.</h2></div><button type="button" onClick={fecharAdicionar} aria-label="Fechar seleção de sistema">×</button></header>
        <div className="pj-system-options">{[['darkness','01 / O ABSOLUTO','Absoluto','Encare a escuridão. Defina sua existência.'],['espiral','02 / A ESPIRAL','ESPIRAL','Toda escolha deixa uma marca. Comece a sua história.']].map(([id,label,title,description])=><a key={id} className={`pj-system-choice pj-system-${id}`} href={`?criar=1&sistema=${id}&jogadorOrigem=${encodeURIComponent(codigo)}`} onClick={()=>sessionStorage.setItem('darkness:jogador',codigo)}><div className="pj-system-choice-art" aria-hidden="true"><Simbolo sistema={id}/></div><small>{label}</small><h3>{title}</h3><p>{description}</p><strong>Escolher {title} <span aria-hidden="true">↗</span></strong></a>)}</div>
        <details className="pj-link-existing"><summary>Já tenho uma ficha · vincular ao perfil</summary><div className="pj-vincular"><form onSubmit={vincular}><label>Sistema<select value={sistema} onChange={e=>setSistema(e.target.value)}><option value="darkness">Sistema Absoluto</option><option value="espiral">ESPIRAL</option></select></label><label>Código do personagem<input required value={vinculo} onChange={e=>setVinculo(e.target.value)} maxLength={80}/></label><button disabled={ocupado}>Vincular ao perfil</button></form></div></details>
      </aside>}

    </section>}
    {aba === 'investigacao' && <section className={`pj-investigation-layout pj-investigation-unified ${evidenciaInterativa ? 'pj-investigacao-interativa' : ''} ${doc ? 'pj-investigacao-aberta' : ''}`} aria-label="Investigação">
      <div className="pj-investigation-list"><details className="pj-filtros"><summary>Filtrar documentos</summary><label>Campanha<select value={campanhaFiltro} onChange={e=>{setCampanhaFiltro(e.target.value);setDoc(null);}}><option value="">Todas as campanhas</option>{campanhas.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></label><button type="button" onClick={()=>{setDoc(null);setPerfil({...perfil});}}>Atualizar documentos</button></details>
        <EvidenceGrid key={campanhaFiltro} documentos={documentos} selecionado={doc} onSelect={setDoc}/>
        {!documentos.length && <p className="pj-vazio">Nenhum documento compartilhado com seus personagens nesta seleção.</p>}
      </div>
      {doc && <section key={`${doc.campanhaId}:${doc.id}`} className={`pj-documento ${evidenciaInterativa ? 'pj-documento-interativo' : ''}`} aria-label={`Evidência: ${doc.nome}`}><header><h3>{doc.nome}</h3><button aria-label="Fechar evidência" onClick={e=>fecharAnimado(e.currentTarget.closest('.pj-documento'),()=>setDoc(atual=>atual===doc ? null : atual))}>×</button></header><Documento key={`${doc.campanhaId}:${doc.id}`} doc={doc}/>{doc.descricao && <p>{doc.descricao}</p>}{doc.url && <a href={doc.url} target="_blank" rel="noreferrer">Abrir arquivo ↗</a>}</section>}
    </section>}
    {aba === 'livros' && <section><div className="pj-secao"><h2>Conheça as regras.</h2><p>Os dois sistemas. Um universo.</p></div><div className="pj-livros">{['darkness','espiral'].map(s=>{const url=s==='darkness' ? process.env.REACT_APP_LIVRO_DARKNESS_URL : process.env.REACT_APP_LIVRO_ESPIRAL_URL;return <article key={s}><Simbolo sistema={s}/><small>LIVRO DE REGRAS</small><h3>{s==='darkness' ? 'SISTEMA ABSOLUTO' : 'ESPIRAL'}</h3>{url ? <a href={url} target="_blank" rel="noreferrer">Ler livro ↗</a> : <p>O livro ainda não foi disponibilizado.</p>}<button onClick={()=>{setSistema(s);setAba('builds');}}>Consultar habilidades ↗</button></article>;})}</div></section>}
    {aba === 'builds' && <section className="pj-area-builds"><div className="pj-secao"><h2>Imagine o próximo passo.</h2><p>Explore combinações livremente e guarde seus planos para a evolução.</p></div><div className={`pj-build-layout pj-build-${sistema}`}><div><label>Sistema<select value={sistema} onChange={e=>{setSistema(e.target.value);setBusca('');}}><option value="darkness">Sistema Absoluto</option><option value="espiral">Sistema ESPIRAL</option></select></label><BuildCatalog key={sistema} sistema={sistema} entries={catalogo} selected={selecionadas} onToggle={id=>setSelecionadas(selecionadas.includes(id) ? selecionadas.filter(x=>x!==id) : [...selecionadas,id])} busca={busca} setBusca={setBusca}/></div><aside><form onSubmit={salvarBuild}><h3>{editando ? 'Editar build' : 'Sua próxima build'}</h3><label>Nome da build<input required value={buildNome} onChange={e=>setBuildNome(e.target.value)} maxLength={100}/></label><ul>{selecionadas.map(id=><li key={id}>{catalogo.find(h=>h.id===id)?.nome || id}<button type="button" aria-label={`Remover ${catalogo.find(h=>h.id===id)?.nome || id}`} onClick={()=>setSelecionadas(selecionadas.filter(h=>h!==id))}>×</button></li>)}</ul><label>Estratégia, combos e requisitos<textarea value={notas} onChange={e=>setNotas(e.target.value)} maxLength={10000}/></label><p>O plano não gasta pontos. Ao evoluir, consulte os requisitos e adquira as habilidades na ficha.</p><button disabled={ocupado}>Salvar build</button><button type="button" onClick={()=>{setEditando(null);setBuildNome('');setSelecionadas([]);setNotas('');}}>Nova build</button></form><h3>Builds salvas</h3>{perfil.builds.map(b=><article className="pj-build-salva" key={b.id}><strong>{b.nome}</strong><small>{b.habilidades.length} seleções</small><button onClick={()=>{setEditando(b.id);setBuildNome(b.nome);setSelecionadas(b.habilidades);setNotas(b.notas || '');}}>Resgatar / editar</button><button disabled={ocupado} onClick={async()=>{if(await persistir({...perfil,builds:perfil.builds.filter(x=>x.id!==b.id)})){if(editando===b.id){setEditando(null);setBuildNome('');setSelecionadas([]);setNotas('');}}}}>Excluir</button></article>)}<h3>Continuar na ficha</h3>{fichas.map(f=><a className="pj-ficha-link" key={fichaKey(f)} href={f.sistema === 'darkness' ? `${fichaHref(f)}&habilidades=1` : fichaHref(f)}>{f.nome} · {f.sistema==='darkness' ? 'Absoluto' : 'ESPIRAL'} ↗</a>)}</aside></div></section>}
    <footer className="pj-rodape">UNIVERSO DARKNESS</footer>
  </main>;
}
