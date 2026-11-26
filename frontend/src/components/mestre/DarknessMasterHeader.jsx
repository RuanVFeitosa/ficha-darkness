import ProtocolLogo from '../ui/ProtocolLogo';
import MasterSystemTabs from './MasterSystemTabs';
import React from 'react';

export default function DarknessMasterHeader({ agents, pending, loading, onRefresh, onNavigate, onMenu, integrado, sistemas }) {
  if (integrado) return <header className="master-field-toolbar">
    <div className="master-field-summary">
      <button type="button" onClick={() => onNavigate('fichas')}><strong>{agents}</strong> Personagens</button>
      <button type="button" onClick={() => onNavigate('analises')}><strong>{pending}</strong> Solicitações</button>
    </div>
    <div className="master-field-actions">
      <button type="button" onClick={() => onNavigate('campanha')}>Preparar sessão</button>
      <a href="/?criar=1&sistema=darkness">Criar personagem</a>
      <button type="button" onClick={onRefresh} disabled={loading}>{loading ? 'Atualizando…' : 'Atualizar'}</button>
      <button type="button" onClick={onMenu} aria-label="Menu rápido">•••</button>
    </div>
  </header>;

  return <>
    <header className="dm-header">
      {sistemas ? <MasterSystemTabs sistema="absoluto" /> : <a className="dm-brand" href="/"><span><ProtocolLogo /><small>CENTRAL DO MESTRE</small></span></a>}
      <div className="dm-header-actions"><span className="dm-status">ARQUIVO UNIFICADO</span>{sistemas && <a href="/?mestre=1&personagens=1">Meus personagens</a>}<button type="button" onClick={onRefresh} disabled={loading}>{loading ? 'Atualizando…' : '↻ Atualizar'}</button><button type="button" onClick={onMenu} aria-label="Menu rápido">•••</button></div>
    </header>
    <section className="dm-hero" aria-labelledby="dm-title">
      <div className="dm-hero-copy"><span className="dm-kicker">01 / CONTROLE DA NARRATIVA</span><h1 id="dm-title">Conduza a história.<br/><em>Encare a escuridão.</em></h1><p>Personagens, ameaças e consequências.<br/>Tudo o que sua próxima sessão precisa, em um só lugar.</p><div className="dm-hero-actions"><button type="button" onClick={() => onNavigate('campanha')}>Preparar sessão <span>↗</span></button><a href="/?criar=1&sistema=darkness">Criar personagem +</a></div></div>
      <div className="dm-sigil" aria-hidden="true"><span>D / ARQUIVO DE CAMPO</span><img src="/simbolo-darkness.png" alt=""/><small>A HISTÓRIA ESTÁ EM SUAS MÃOS</small></div>
      <dl className="dm-metrics"><div><dt>Personagens</dt><dd>{String(agents).padStart(2, '0')}</dd><small>Todos os dossiês da mesa</small></div><div><dt>Solicitações</dt><dd>{String(pending).padStart(2, '0')}</dd><button type="button" onClick={() => onNavigate('analises')}>Revisar pendências ↗</button></div><div><dt>Sistema</dt><dd className="dm-metric-name"><ProtocolLogo /></dd><small>Um arquivo. Todas as histórias.</small></div></dl>
    </section>
  </>;
}
