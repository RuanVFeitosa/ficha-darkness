import ProtocolLogo from '../components/ui/ProtocolLogo';
import { consolidarIdsBuildOfensivos } from '../data/ofensivasConsolidadas';
import HaloEclipse from '../components/ui/HaloEclipse';
import TintedDarknessSymbol from '../components/ui/TintedDarknessSymbol';
import CharacterTemplateCreator from '../components/jogador/CharacterTemplateCreator';
import { confirmarDialogo } from '../components/ui/DialogoGlobal';
import { excluirFichaJogador } from '../services/excluirFichaJogador';
import { prepararFotoPerfil } from '../utils/playerProfilePhoto';
import {characterTemplates,PLAYER_CHARACTER_LIMIT,PLAYER_CHARACTER_PAGE_SIZE,validateCharacterLimit} from '../utils/playerCharacters';
import {fecharAnimado} from '../utils/pageMotion';
import PlayerProfile from '../components/jogador/PlayerProfile';
import EvidenceGrid from '../components/campanha/EvidenceGrid';
import MuralInvestigacao from '../components/campanha/MuralInvestigacao';
import PlayerAppearance from "../components/jogador/PlayerAppearance";
import { variaveisPaleta, variaveisEmblema } from "../utils/playerAppearance";
import CharacterDossier from "../components/jogador/CharacterDossier";
import PlayerCampaign, { CampaignCards, campaignMemberId } from '../components/jogador/PlayerCampaign';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { entrarJogador, carregarFicha, fichaKey, fichaHref, documentoVisivel } from '../services/jogadorApi';
import { buscarJogador, salvarJogador } from '../services/personagemApi';
import { buscarCampanhaPorCodigo, listarCampanhasDaFicha, resolverCapaCampanha } from '../services/mesaApi';
import { vincularJogadorAoMestre } from '../services/masterAccounts';
import { campaignSystem, sheetSystem, systemLabel } from '../utils/campaignSystem';
import { readLocalCampaign } from '../services/localCampaignStorage';
import { catalogoBuilds } from '../utils/buildCatalog';
import BuildCatalog from '../components/jogador/BuildCatalog';


import ComputadorModerno from '../components/ui/ComputadorModerno';
import ReprodutorCassete from '../components/midia/ReprodutorCassete';
import EvidenceImageViewer from '../components/campanha/EvidenceImageViewer';
import '../styles/PaginaJogador.css';
import '../styles/PaginaJogadorResponsive.css';
import '../styles/PaginaJogadorMotion.css';
import '../styles/PaginaJogadorRefined.css';
import '../styles/PaginaJogadorAtmosphere.css';
import '../styles/CadastroJogador.css';
export { catalogoBuilds } from '../utils/buildCatalog';

function Simbolo({ sistema }) {
  return <img src="/simbolo-darkness.png" alt="Símbolo Darkness"/>;
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
export default function PaginaJogador({ codigo, mestreId, conviteCampanha, campanhaJogador, abrirCampanhas, onNavigate = destino => window.location.assign(destino) }) {
  const [muralSelecionado,setMuralSelecionado]=useState('pessoal');
  const [perfil, setPerfil] = useState(null), [fichas, setFichas] = useState([]), [campanhas, setCampanhas] = useState([]);
  const [fichasOrdem, setFichasOrdem] = useState([]);
  const [ordemCarregada, setOrdemCarregada] = useState(false);
  const [campanhasCarregadas, setCampanhasCarregadas] = useState(false);
  const [erroOrdem, setErroOrdem] = useState('');
  const [templates,setTemplates]=useState(false),[paginaPersonagens,setPaginaPersonagens]=useState(0);
  const [criandoTemplate,setCriandoTemplate]=useState(false);
  const fichasTemplates=useMemo(characterTemplates,[]);
  const listaPersonagens=templates?fichasTemplates:[...fichas,...fichasOrdem];
  const totalPaginasPersonagens=Math.max(1,Math.ceil(listaPersonagens.length/PLAYER_CHARACTER_PAGE_SIZE));
  const paginaAtualPersonagens=Math.min(paginaPersonagens,totalPaginasPersonagens-1);
  const fichasVisiveis=listaPersonagens.slice(paginaAtualPersonagens*PLAYER_CHARACTER_PAGE_SIZE,(paginaAtualPersonagens+1)*PLAYER_CHARACTER_PAGE_SIZE);
  const [adicionando,setAdicionando]=useState(false),painelAdicionar=useRef(null),botaoAdicionar=useRef(null);
  useEffect(()=>{if(adicionando){painelAdicionar.current?.querySelector('h2')?.focus({preventScroll:true});if(window.innerWidth<=1000)painelAdicionar.current?.scrollIntoView?.({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});}},[adicionando]);
  function fecharAdicionar(){setAdicionando(false);botaoAdicionar.current?.focus();}
  const [aba, setAba] = useState(abrirCampanhas || campanhaJogador ? 'campanhas' : 'personagens'), [erro, setErro] = useState(''), [aviso, setAviso] = useState(''), [ocupado, setOcupado] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(campanhaJogador || null);
  const [pronome, setPronome] = useState('Elu');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [processandoFoto, setProcessandoFoto] = useState(false);
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
    async function carregarOrdem() {
      try {
        const { readOrdemSheets } = await import('../services/ordemSheet');
        const agentes = readOrdemSheets().filter(dados => dados.jogadorOrigem === codigo);
        const fichasLocais = await Promise.all(agentes.map(async dados => ({
          id: dados.id,
          sistema: 'ordem',
          jogadorOrigem: codigo,
          nome: dados.nome?.trim() || 'Novo agente',
          foto: await readLocalCampaign(`ordem:retrato:${dados.id}`).catch(() => null) || dados.portrait,
          dados,
        })));
        if (ativo) setFichasOrdem(previous => previous.length || fichasLocais.length ? fichasLocais : previous);
      } catch {
        if (ativo) setErroOrdem('Não foi possível ler as fichas de Ordem Paranormal salvas neste navegador.');
      } finally {
        if (ativo) setOrdemCarregada(true);
      }
    }
    carregarOrdem();
    return () => { ativo = false; };
  }, [perfil, codigo, mestreId]);
  useEffect(() => {
    if (!perfil) return;
    let ativo = true;
    Promise.allSettled(perfil.personagens.map(carregarFicha)).then(resultados => {
      if (!ativo) return;
      setFichas(resultados.filter(r => r.status === 'fulfilled').map(r => r.value));
      if (resultados.some(r => r.status === 'rejected')) setAviso('Algumas fichas não puderam ser carregadas. Fichas ESPIRAL precisam estar salvas neste dispositivo.');
    });
    return () => { ativo = false; };
  }, [perfil]);
  useEffect(() => {
    if (!perfil || !ordemCarregada) return;
    let ativo = true;
    const ids = new Set([...perfil.personagens, ...fichasOrdem].map(campaignMemberId));
    setCampanhasCarregadas(false);
    const consultas = [
      ...[...ids].map(listarCampanhasDaFicha),
      ...(perfil.campanhas || []).map(buscarCampanhaPorCodigo),
    ];
    Promise.allSettled(consultas).then(async resultados => {
      if (!ativo) return;
      const unique = new Map(resultados.filter(r => r.status === 'fulfilled').flatMap(r => r.value).filter(Boolean).map(c => [c.id, c]));
      const withCovers = await Promise.all([...unique.values()].map(c => resolverCapaCampanha(c).catch(() => c)));
      if (!ativo) return;
      setCampanhas(withCovers);
      setCampanhasCarregadas(true);
      if (resultados.some(r => r.status === 'rejected')) setAviso('Não foi possível consultar todas as campanhas. Tente recarregar a página.');
    });
    return () => { ativo = false; };
  }, [perfil, fichasOrdem, ordemCarregada]);
  async function persistir(proximo) {
    setOcupado(true); setErro('');
    try { const salvo = await salvarJogador(codigo, proximo); setPerfil(salvo); return true; }
    catch (e) { setErro(e.message); return false; }
    finally { setOcupado(false); }
  }
  const excluindo = useRef(false);
  async function excluirFicha(ficha) {
    if (ocupado || excluindo.current) return;
    excluindo.current = true;
    try {
      const confirmado = await confirmarDialogo(`Excluir permanentemente a ficha de ${ficha.nome}? ${ficha.sistema === 'espiral' ? 'A ficha ESPIRAL será apagada deste dispositivo.' : 'A ficha do Absoluto será apagada do servidor e ficará indisponível para quem usa seu código.'} O vínculo com seu perfil será removido. Essa ação não pode ser desfeita.`, {titulo:'Excluir ficha',confirmarTexto:'Excluir ficha',cancelarTexto:'Cancelar'});
      if (!confirmado) return;
      setOcupado(true);setErro('');
      const salvo = await excluirFichaJogador(codigo,perfil,ficha);
      setPerfil(salvo);setFichas(atuais=>atuais.filter(f=>fichaKey(f)!==fichaKey(ficha)));
      setRevelado('');setAviso(`Ficha de ${ficha.nome} excluída.`);
    } catch(e) {setErro(e.message || 'Não foi possível excluir a ficha.');}
    finally {excluindo.current=false;setOcupado(false);}
  }
  async function criarPerfil(e) {
    e.preventDefault();
    if (ocupado || processandoFoto) return;
    setOcupado(true); setErro('');
    try {
      if (mestreId && await buscarJogador(novoCodigo)) throw new Error('Esse código já tem um perfil. Volte a Meus personagens para vinculá-lo.');
      const p = await entrarJogador(novoCodigo, true);
      await salvarJogador(novoCodigo, { ...p, nome: nome.trim() || p.nome, pronome: pronome || undefined, fotoPerfil: fotoPerfil || p.fotoPerfil || '', perfilConfigurado: true });
      if (mestreId) vincularJogadorAoMestre(mestreId, novoCodigo);
      onNavigate(`/?jogador=${novoCodigo}${mestreId ? '&origem=mestre' : ''}`);
    }
    catch(e) { setErro(e.message); setOcupado(false); }
  }
  async function entrarEmMesa(event) {
    event.preventDefault();
    if (ocupado) return;
    const form = new FormData(event.currentTarget);
    const ficha = [...fichas, ...fichasOrdem].find(item => fichaKey(item) === form.get('ficha'));
    if (!ficha) return;
    setOcupado(true);
    setErro('');
    try {
      const campanha = await buscarCampanhaPorCodigo(form.get('campanha').trim());
      if (!campanha) throw new Error('Campanha não encontrada. Confira o código da mesa.');
      const sistemaMesa = campaignSystem(campanha);
      if (sheetSystem(ficha) !== sistemaMesa) throw new Error(`Esta campanha usa ${systemLabel(sistemaMesa)}. Escolha uma ficha desse sistema.`);
      const vinculo = ['espiral', 'ordem'].includes(sistemaMesa) ? `${sistemaMesa}:${ficha.id}` : ficha.id;
      onNavigate(`/?${new URLSearchParams({ campanha: campanha.codigo, papel: 'jogador', sistema: sistemaMesa, vinculo, origem: 'mestre' })}`);
    } catch (error) {
      setErro(error.message);
    } finally {
      setOcupado(false);
    }
  }
  async function carregarFotoCadastro(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProcessandoFoto(true); setErro('');
    try { const foto = await prepararFotoPerfil(file); if (foto) setFotoPerfil(foto); }
    catch (error) { setErro(error.message); }
    finally { setProcessandoFoto(false); }
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
  if (codigo === 'novo') return <main className="pj pj-escuro pj-cadastro"><div className="pj-cadastro-arte" aria-hidden="true"><div className="pj-cadastro-emblema"><HaloEclipse /><img src="/simbolo-darkness.png" alt="" draggable="false"/></div></div><a href={mestreId ? "/?mestre=1&personagens=1" : "?"}>{mestreId ? "← Meus personagens" : "← Início"}</a>{!mestreId && <p><a href="/?mestre=novo">Cadastro de mestre</a></p>}<p className="pj-eyebrow">UNIVERSO DARKNESS / NOVO ARQUIVO</p><h1>Seu lugar<br/>neste universo.</h1><form className="pj-cadastro-form" onSubmit={criarPerfil}><div className="pj-cadastro-form-heading"><span>01 / IDENTIDADE</span><span>PERFIL DO JOGADOR</span></div><label className="pj-cadastro-foto">{fotoPerfil ? <img src={fotoPerfil} alt="Prévia da foto de perfil"/> : <span className="pj-cadastro-avatar" aria-hidden="true">{nome.trim().slice(0,1).toUpperCase() || '?'}</span>}<span className="pj-cadastro-photo-title">Foto de perfil (opcional)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={carregarFotoCadastro} disabled={ocupado || processandoFoto}/></label><label>Nome do jogador<input required autoComplete="nickname" placeholder="Como você quer ser chamado?" value={nome} onChange={e => setNome(e.target.value)} maxLength={80}/></label><label>Pronome do jogador<select value={pronome} onChange={e=>setPronome(e.target.value)}><option value="">Prefiro não informar</option>{["Ele","Ela","Elu"].map(p=><option key={p}>{p}</option>)}</select></label><label>Senha do Jogador<input required type="password" autoComplete="new-password" inputMode="numeric" placeholder="Sua chave de acesso" pattern="[0-9]{4,8}" minLength={4} maxLength={8} value={novoCodigo} onChange={e => setNovoCodigo(e.target.value.replace(/\D/g,''))}/></label><p>Escolha uma senha numérica de 4 a 8 dígitos para entrar pelo painel. O código antigo do personagem também funciona como senha do jogador.</p><button disabled={ocupado || processandoFoto}>{processandoFoto ? 'Preparando foto…' : ocupado ? 'Salvando…' : 'Criar / acessar perfil'}</button>{erro && <p role="alert">{erro}</p>}</form></main>;
  if (!perfil) return <main className="pj pj-escuro"><a href="?">← Início</a><p role={erro ? 'alert' : 'status'}>{erro || 'Abrindo seu arquivo…'}</p></main>;
  const openCampaign = code => setSelectedCampaign(code);
  const campaignCodes = new Set([...(perfil.campanhas || []), ...campanhas.map(item => item.codigo).filter(Boolean)]);
  async function joinByCode(event) {
    event.preventDefault();
    if (ocupado || !campanhasCarregadas) return;
    const code = String(new FormData(event.currentTarget).get('codigoCampanha') || '').trim().toUpperCase();
    if (!code) return;
    if (campaignCodes.has(code)) { openCampaign(code); return; }
    if (campaignCodes.size >= 6) { setErro('Você já está em 6 campanhas.'); return; }
    setOcupado(true);
    setErro('');
    try {
      const campaign = await buscarCampanhaPorCodigo(code);
      if (!campaign) throw new Error('Campanha não encontrada. Confira o código.');
      const saved = await salvarJogador(codigo, { ...perfil, campanhas: [...campaignCodes, campaign.codigo] });
      setPerfil(saved);
      openCampaign(campaign.codigo);
    } catch (failure) {
      setErro(failure.message || 'Não foi possível entrar na campanha.');
    } finally {
      setOcupado(false);
    }
  }
  if (conviteCampanha) return <main className="pj pj-dashboard pj-refined pj-campaign-page">
    <PlayerCampaign key={conviteCampanha}
      code={conviteCampanha} invite playerCode={codigo}
      sheets={[...fichas, ...fichasOrdem]}
      onOpen={code => onNavigate(`/?${new URLSearchParams({ jogador: codigo, campanhaJogador: code })}`)}
      onBack={() => onNavigate(`/?${new URLSearchParams({ jogador: codigo, aba: 'campanhas' })}`)} />
  </main>;
  return <main className={`pj pj-dashboard pj-refined ${perfil.paletaPagina ? 'pj-paleta-personalizada' : ''}`} style={{...variaveisPaleta(perfil.paletaPagina),...variaveisEmblema(perfil.paletaPagina)}}>
    <div className="pj-marca-lateral pj-cadastro-arte pj-dashboard-arte" aria-hidden="true"><div className="pj-cadastro-emblema"><HaloEclipse /><TintedDarknessSymbol cor={perfil.paletaPagina?.simbolo} /></div></div>
    <header className="pj-topo"><a href={mestreId ? '/?mestre=1' : '?'} className="pj-marca">{mestreId ? '← Painel do Mestre' : '← UNIVERSO DARKNESS'}</a><PlayerAppearance perfil={perfil} fichas={fichas} onSavePagina={paleta=>persistir({...perfil,paletaPagina:paleta})} onSavePaletas={paletas=>persistir({...perfil,paletasPersonalizadas:paletas})} onFichaSalva={(ficha,dados)=>setFichas(atuais=>atuais.map(f=>fichaKey(f)===fichaKey(ficha) ? {...f,dados} : f))}/><PlayerProfile key={codigo} perfil={perfil} onSave={persistir}/></header>
    <div className="pj-file-intro"><div><span className="pj-file-eyebrow">ARQUIVO PESSOAL / JOGADOR</span><h1>Seu arquivo.</h1><p>Personagens, descobertas e os próximos passos da sua história.</p></div><span className="pj-file-index">UNIVERSO<br/><ProtocolLogo /> <i aria-hidden="true">↗</i></span></div>
    <nav className="pj-abas" aria-label="Áreas do jogador">{[['personagens','01','Personagens'],['campanhas','02','Campanhas'],['investigacao','03','Investigação'],['livros','04','Livros de regras'],['builds','05','Builds']].map(([id,n,label]) => <button key={id} aria-current={aba === id ? 'page' : undefined} onClick={() => {setAba(id); setDoc(null);}}><small>{n}</small>{label}</button>)}</nav>
    {erro && <p className="pj-alerta" role="alert">{erro}</p>}{aviso && <p className="pj-alerta" role="status">{aviso}<button aria-label="Fechar aviso" onClick={() => setAviso('')}>×</button></p>}
    {aba === 'campanhas' && <CampaignCards campaigns={campanhas} count={campaignCodes.size}
      onJoin={joinByCode} busy={ocupado || !campanhasCarregadas} onOpen={openCampaign} selectedCode={selectedCampaign}>
      {selectedCampaign && <PlayerCampaign key={selectedCampaign} code={selectedCampaign} playerCode={codigo}
        enrolled={Boolean(perfil.campanhas?.includes(selectedCampaign.toUpperCase()))}
        sheets={[...fichas, ...fichasOrdem]} onBack={() => setSelectedCampaign(null)} />}
    </CampaignCards>}
    {aba === 'personagens' && <section className={`pj-area-personagens pj-character-roster ${adicionando?'pj-adding-character':''}`} aria-label="Seus personagens">
      <div className="pj-characters-main"><header className="pj-collection-header"><div><small>ARQUIVO DE PERSONAGENS</small><h2>{templates?'Templates de teste':'Seus personagens'}</h2></div><span>{templates ? fichasTemplates.length : perfil.personagens.length} / {PLAYER_CHARACTER_LIMIT} personagens{!templates && fichasOrdem.length > 0 && ` · ${fichasOrdem.length} de Ordem neste navegador`}</span></header>
      {templates && <p className="pj-demo-notice" role="status">Demonstração com 10 templates. Esses modelos não alteram suas fichas nem ocupam vagas no perfil.</p>}
      {!templates && erroOrdem && <p role="status">{erroOrdem}</p>}
      {mestreId && !templates && (fichas.length > 0 || fichasOrdem.length > 0) && <form className="pj-join-table" onSubmit={entrarEmMesa}>
        <label>Código da campanha<input name="campanha" required maxLength={24} /></label>
        <label>Personagem<select name="ficha" required>
          {[...fichas, ...fichasOrdem].map(ficha => <option key={fichaKey(ficha)} value={fichaKey(ficha)}>{ficha.nome} · {systemLabel(sheetSystem(ficha))}</option>)}
        </select></label>
        <button type="submit" disabled={ocupado}>Entrar como jogador</button>
      </form>}
      <div className="pj-personagens">{fichasVisiveis.map(f=><CharacterDossier key={fichaKey(f)} ficha={f} onDelete={f.sistema === 'ordem' ? undefined : excluirFicha} disabled={ocupado} aberto={revelado===fichaKey(f)} onToggle={()=>setRevelado(revelado===fichaKey(f) ? '' : fichaKey(f))}/>)}</div>
      {listaPersonagens.length>PLAYER_CHARACTER_PAGE_SIZE && <nav className="pj-character-pagination" aria-label="Páginas de personagens"><span>Página {paginaAtualPersonagens+1} de {totalPaginasPersonagens}</span><div>{Array.from({length:totalPaginasPersonagens},(_,i)=><button type="button" key={i} aria-label={'Página '+(i+1)+' de personagens'} aria-current={paginaAtualPersonagens===i?'page':undefined} onClick={()=>{setPaginaPersonagens(i);setRevelado('');}}>{i+1}</button>)}</div></nav>}
      {!listaPersonagens.length && <p className="pj-vazio">Seu arquivo começa aqui. Crie um personagem ou vincule uma ficha existente.</p>}
      <div className="pj-gerenciar"><button type="button" className="pj-template-trigger" aria-expanded={criandoTemplate} onClick={()=>{setCriandoTemplate(!criandoTemplate);setAdicionando(false);}}>Criar personagem Template</button><button disabled={perfil.personagens.length>=PLAYER_CHARACTER_LIMIT} ref={botaoAdicionar} type="button" className="pj-add-character-trigger" aria-expanded={adicionando} aria-controls="pj-add-character-panel" onClick={()=>adicionando?fecharAdicionar():setAdicionando(true)}>{perfil.personagens.length>=PLAYER_CHARACTER_LIMIT?'Limite de 10 personagens atingido':'+ Adicionar personagem'}</button><button type="button" className="pj-template-trigger" aria-pressed={templates} onClick={()=>{setTemplates(!templates);setPaginaPersonagens(0);setRevelado('');}}>{templates?'Voltar aos meus personagens':'Testar com 10 templates'}</button></div>
      </div>
      {criandoTemplate && <CharacterTemplateCreator perfil={perfil} fichas={fichas} onClose={()=>setCriandoTemplate(false)} onSaveModelos={modelos=>persistir({...perfil,templatesPersonagem:modelos})} onCreated={async ref=>{
        const personagens=[...new Map([...perfil.personagens,ref].map(p=>[fichaKey(p),p])).values()];
        validateCharacterLimit(personagens);
        const salvo=await persistir({...perfil,personagens});
        if(salvo){setTemplates(false);setPaginaPersonagens(0);setAviso(`Personagem template criado. Código: ${ref.id}.`);}
        return salvo;
      }}/>}
      {adicionando && <aside ref={painelAdicionar} id="pj-add-character-panel" className="pj-system-picker" aria-label="Adicionar personagem" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();fecharAdicionar();}}}>
        <header><div><small>NOVO DOSSIÊ</small><h2 tabIndex={-1}>Abra um novo dossiê.</h2></div><button type="button" onClick={fecharAdicionar} aria-label="Fechar seleção de sistema">×</button></header>
        <div className="pj-system-options"><a className="pj-system-choice pj-system-darkness" href={`?criar=1&sistema=espiral&jogadorOrigem=${encodeURIComponent(codigo)}`} onClick={()=>sessionStorage.setItem('darkness:jogador',codigo)}><div className="pj-system-choice-art" aria-hidden="true"><Simbolo sistema="darkness"/></div><small><ProtocolLogo /></small><h3>Novo investigador</h3><p>Uma ocupação. Uma vertente. Sua maneira de buscar a verdade.</p><strong>Criar personagem <span aria-hidden="true">↗</span></strong></a></div>
        <a className="pj-ordem-creator-link" href={`?ordem=1&criar=1&jogadorOrigem=${encodeURIComponent(codigo)}`}>Novo agente de Ordem Paranormal ↗</a>
        <details className="pj-link-existing"><summary>Já tenho uma ficha · vincular ao perfil</summary><div className="pj-vincular"><form onSubmit={vincular}><label>Sistema<select value={sistema} onChange={e=>setSistema(e.target.value)}><option value="darkness">Sistema Absoluto</option><option value="espiral">ESPIRAL</option></select></label><label>Código do personagem<input required value={vinculo} onChange={e=>setVinculo(e.target.value)} maxLength={80}/></label><button disabled={ocupado}>Vincular ao perfil</button></form></div></details>
      </aside>}

    </section>}
    {aba === 'investigacao' && <section className={`pj-investigation-layout pj-investigation-unified ${evidenciaInterativa ? 'pj-investigacao-interativa' : ''} ${doc ? 'pj-investigacao-aberta' : ''}`} aria-label="Investigação">
      <div className="mi-investigation-panel"><div className="mi-scope"><label>Espaço de investigação<select value={muralSelecionado} onChange={e=>setMuralSelecionado(e.target.value)}><option value="pessoal">Meu mural pessoal</option>{campanhas.map(c=><option key={c.id} value={c.id}>Campanha · {c.nome}</option>)}</select></label></div><MuralInvestigacao key={`${codigo}:${muralSelecionado}`} codigo={codigo} scope={muralSelecionado==='pessoal'?'pessoal':'campanha'} id={muralSelecionado==='pessoal'?codigo:muralSelecionado} nome={muralSelecionado==='pessoal'?'Meu mural de investigação':`Mural · ${campanhas.find(c=>c.id===muralSelecionado)?.nome || 'Campanha'}`}/><h2 className="mi-evidence-title">Documentos e evidências compartilhados</h2></div>
      <div className="pj-investigation-list"><details className="pj-filtros"><summary>Filtrar documentos</summary><label>Campanha<select value={campanhaFiltro} onChange={e=>{setCampanhaFiltro(e.target.value);setDoc(null);}}><option value="">Todas as campanhas</option>{campanhas.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></label><button type="button" onClick={()=>{setDoc(null);setPerfil({...perfil});}}>Atualizar documentos</button></details>
        <EvidenceGrid key={campanhaFiltro} documentos={documentos} selecionado={doc} onSelect={setDoc}/>
        {!documentos.length && <p className="pj-vazio">Nenhum documento compartilhado com seus personagens nesta seleção.</p>}
      </div>
      {doc && <section key={`${doc.campanhaId}:${doc.id}`} className={`pj-documento ${evidenciaInterativa ? 'pj-documento-interativo' : ''}`} aria-label={`Evidência: ${doc.nome}`}><header><h3>{doc.nome}</h3><button aria-label="Fechar evidência" onClick={e=>fecharAnimado(e.currentTarget.closest('.pj-documento'),()=>setDoc(atual=>atual===doc ? null : atual))}>×</button></header><Documento key={`${doc.campanhaId}:${doc.id}`} doc={doc}/>{doc.descricao && <p>{doc.descricao}</p>}{doc.url && <a href={doc.url} target="_blank" rel="noreferrer">Abrir arquivo ↗</a>}</section>}
    </section>}
    {aba === 'livros' && <section><div className="pj-secao"><h2>Conheça as regras.</h2><p>Os dois sistemas. Um universo.</p></div><div className="pj-livros">{['darkness','espiral'].map(s=>{const url=s==='darkness' ? process.env.REACT_APP_LIVRO_DARKNESS_URL : process.env.REACT_APP_LIVRO_ESPIRAL_URL;return <article key={s}><Simbolo sistema={s}/><small>LIVRO DE REGRAS</small><h3>{s==='darkness' ? 'SISTEMA ABSOLUTO' : 'ESPIRAL'}</h3>{url ? <a href={url} target="_blank" rel="noreferrer">Ler livro ↗</a> : <p>O livro ainda não foi disponibilizado.</p>}<button onClick={()=>{setSistema(s);setAba('builds');}}>Consultar habilidades ↗</button></article>;})}</div></section>}
    {aba === 'builds' && <section className="pj-area-builds"><div className="pj-secao"><h2>Imagine o próximo passo.</h2><p>Explore combinações livremente e guarde seus planos para a evolução.</p></div><div className={`pj-build-layout pj-build-${sistema}`}><div><label>Sistema<select value={sistema} onChange={e=>{setSistema(e.target.value);setBusca('');}}><option value="darkness">Sistema Absoluto</option><option value="espiral">Sistema ESPIRAL</option></select></label><BuildCatalog key={sistema} sistema={sistema} entries={catalogo} selected={selecionadas} onToggle={id=>setSelecionadas(selecionadas.includes(id) ? selecionadas.filter(x=>x!==id) : [...selecionadas,id])} busca={busca} setBusca={setBusca}/></div><aside><form onSubmit={salvarBuild}><h3>{editando ? 'Editar build' : 'Sua próxima build'}</h3><label>Nome da build<input required value={buildNome} onChange={e=>setBuildNome(e.target.value)} maxLength={100}/></label><ul>{selecionadas.map(id=><li key={id}>{catalogo.find(h=>h.id===id)?.nome || id}<button type="button" aria-label={`Remover ${catalogo.find(h=>h.id===id)?.nome || id}`} onClick={()=>setSelecionadas(selecionadas.filter(h=>h!==id))}>×</button></li>)}</ul><label>Estratégia, combos e requisitos<textarea value={notas} onChange={e=>setNotas(e.target.value)} maxLength={10000}/></label><p>O plano não gasta pontos. Ao evoluir, consulte os requisitos e adquira as habilidades na ficha.</p><button disabled={ocupado}>Salvar build</button><button type="button" onClick={()=>{setEditando(null);setBuildNome('');setSelecionadas([]);setNotas('');}}>Nova build</button></form><h3>Builds salvas</h3>{perfil.builds.map(b=><article className="pj-build-salva" key={b.id}><strong>{b.nome}</strong><small>{b.habilidades.length} seleções</small><button onClick={()=>{setEditando(b.id);setBuildNome(b.nome);setSelecionadas(consolidarIdsBuildOfensivos(b.habilidades));setNotas(b.notas || '');}}>Resgatar / editar</button><button disabled={ocupado} onClick={async()=>{if(await persistir({...perfil,builds:perfil.builds.filter(x=>x.id!==b.id)})){if(editando===b.id){setEditando(null);setBuildNome('');setSelecionadas([]);setNotas('');}}}}>Excluir</button></article>)}<h3>Continuar na ficha</h3>{fichas.map(f=><a className="pj-ficha-link" key={fichaKey(f)} href={f.sistema === 'darkness' ? `${fichaHref(f)}&habilidades=1` : fichaHref(f)}>{f.nome} · {f.sistema==='darkness' ? 'Absoluto' : 'ESPIRAL'} ↗</a>)}</aside></div></section>}
    <footer className="pj-rodape">UNIVERSO DARKNESS</footer>
  </main>;
}
