import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { mdiAccountGroupOutline, mdiArrowTopRight, mdiChevronLeft, mdiChevronRight, mdiDoor, mdiLogout, mdiShieldAccountOutline } from '@mdi/js';
import { listarUsuarios } from '../../services/masterAccounts';
import { masterSections, ordemSections, rollSection } from '../../constants/masterSections';
import ProtocolLogo from '../ui/ProtocolLogo';
import '../../styles/MasterAccounts.css';

const grupos = [
  { id: 'jogadores', nome: 'Jogadores', icone: mdiAccountGroupOutline },
  { id: 'mestres', nome: 'Mestres', icone: mdiShieldAccountOutline },
];
const papeis = { jogador: 'Jogador', mestre: 'Mestre', proprietario: 'Proprietário' };
const DashboardMestre = lazy(() => import('../../pages/dashboardMestre'));
const OrdemMasterTools = lazy(() => import('./OrdemMasterTools'));
const sistemas = [
  { id: 'darkness', nome: 'Darkness', areas: [...masterSections.filter(item => item.id !== 'ordem'), rollSection], component: DashboardMestre },
  { id: 'ordem', nome: 'Ordem Paranormal', areas: ordemSections, component: OrdemMasterTools },
];

export default function MasterAccounts({ usuarioMestre, onSair }) {
  const [secao, setSecao] = useState(null);
  const [imagemFundo, setImagemFundo] = useState(null);
  const [sistemaId, setSistemaId] = useState('darkness');
  const sistema = sistemas.find(item => item.id === sistemaId);
  const Ferramentas = sistema.component;
  const inicio = useRef(null);
  const [consulta, setConsulta] = useState({ grupo: 'jogadores', pagina: 1 });
  const [resultado, setResultado] = useState(null);
  const [erroLista, setErroLista] = useState('');
  const { grupo, pagina } = consulta;

  useEffect(() => {
    const controller = new AbortController();
    listarUsuarios(consulta.grupo, consulta.pagina, controller.signal).then(dados => {
      if (!controller.signal.aborted) setResultado(dados);
    }).catch(error => {
      if (!controller.signal.aborted) setErroLista(error.message);
    });
    return () => controller.abort();
  }, [consulta]);

  function navegar(secao) {
    setSecao(secao);
    inicio.current?.scrollIntoView?.({ block: 'start' });
  }

  function trocarSistema(proximo) {
    setSistemaId(proximo.id);
    navegar(proximo.areas[0].id);
  }

  function consultar(grupo, pagina = 1) {
    setResultado(null);
    setErroLista('');
    setConsulta({ grupo, pagina });
  }

  return <div className={`master-accounts${imagemFundo ? ' master-accounts-with-art' : ''}`}>
    {imagemFundo && <div className="master-dashboard-art" aria-hidden="true"><img src={imagemFundo} alt="" /></div>}
    <aside className="master-sidebar">
      <div className="master-brand"><ProtocolLogo /></div>
      <nav aria-label="Navegação do proprietário">
        <button type="button" aria-current={!secao ? 'page' : undefined} onClick={() => navegar(null)}><Icon path={mdiShieldAccountOutline} size={0.85} /> Dashboard Master</button>
        <button type="button" aria-current={secao ? 'page' : undefined} onClick={() => navegar(secao || sistema.areas[0].id)}><Icon path={mdiDoor} size={0.85} /> Painel do Mestre</button>
      </nav>
      <div className="master-sidebar-footer">
        <div className="master-owner"><span className="master-avatar"><Icon path={mdiShieldAccountOutline} size={0.85} /></span><strong>{usuarioMestre.nome}</strong></div>
        <button type="button" onClick={onSair} aria-label="Sair da conta" title="Sair da conta"><Icon path={mdiLogout} size={0.9} /></button>
      </div>
    </aside>
    <main className="master-main" ref={inicio}>
      {secao ? <>
        <header className="master-section-heading">
          <h1>Painel do Mestre</h1>
          <a href="/?mestre=1">Abrir painel dos mestres <Icon path={mdiArrowTopRight} size={0.65} /></a>
        </header>
        <nav className="master-systems" aria-label="Sistemas de RPG">
          {sistemas.map(item => <button key={item.id} type="button" aria-pressed={sistemaId === item.id} onClick={() => trocarSistema(item)}>{item.nome}</button>)}
        </nav>
        <nav className="master-areas" aria-label={`Ferramentas de ${sistema.nome}`}>
          {sistema.areas.map(item => <button key={item.id} type="button" aria-current={secao === item.id ? 'page' : undefined} onClick={() => navegar(item.id)}><Icon path={item.icon} size={0.75} />{item.label}</button>)}
        </nav>
        <Suspense fallback={<p role="status">Carregando ferramentas…</p>}>
          <Ferramentas abaIntegrada={secao} onNavegar={navegar} onImagemFundo={setImagemFundo} />
        </Suspense>
      </> : <>
      <header className="master-hero">
        <img src="/simbolo-darkness.png" alt="" />
        <div>
          <span className="master-role"><Icon path={mdiShieldAccountOutline} size={0.65} /> Área do proprietário</span>
          <h1>Dashboard Master</h1>
          <p>Gerencie acessos, campanhas e personagens em um só painel.</p>
        </div>
      </header>
      <div className="master-content master-content-directory">
        <section className="master-directory" aria-labelledby="master-users-title">
          <div className="master-card-heading"><span className="master-avatar"><Icon path={mdiAccountGroupOutline} size={0.95} /></span><h2 id="master-users-title">Usuários cadastrados</h2></div>
          <div className="master-filters" role="group" aria-label="Tipo de usuário">
            {grupos.map(item => <button key={item.id} type="button" aria-pressed={grupo === item.id} onClick={() => consultar(item.id)}><Icon path={item.icone} size={0.72} />{item.nome}</button>)}
          </div>
          {erroLista ? <div className="master-list-message"><p role="alert">{erroLista}</p><button type="button" onClick={() => consultar(grupo, pagina)}>Tentar novamente</button></div>
            : !resultado ? <p className="master-list-message" role="status">Carregando usuários…</p>
            : resultado.usuarios.length ? <ul className="master-users">
              {resultado.usuarios.map(usuario => <li key={usuario.id}>
                <span className="master-avatar master-user-initial" aria-hidden="true">{usuario.nome.trim().charAt(0).toLocaleUpperCase('pt-BR')}</span>
                <div className="master-user-name"><strong>{usuario.nome}</strong>
                  {usuario.atualizadoEm && <small>Atualizado em {new Date(usuario.atualizadoEm).toLocaleDateString('pt-BR')}</small>}
                </div>
                <span className="master-user-role" data-role={usuario.papel}>{papeis[usuario.papel]}</span>
              </li>)}
            </ul> : <p className="master-list-message">Nenhum perfil nesta página.</p>}
          {resultado && (pagina > 1 || resultado.mais) && <div className="master-pagination">
            <button type="button" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => consultar(grupo, pagina - 1)}><Icon path={mdiChevronLeft} size={0.9} /></button>
            <span>Página {pagina}</span>
            <button type="button" aria-label="Próxima página" disabled={!resultado.mais} onClick={() => consultar(grupo, pagina + 1)}><Icon path={mdiChevronRight} size={0.9} /></button>
          </div>}
        </section>

      </div>
      </>}
    </main>
  </div>;
}
