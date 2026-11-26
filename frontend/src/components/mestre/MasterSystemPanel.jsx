import React from 'react';
import Icon from '@mdi/react';
import '../../styles/MasterAccounts.css';
import '../../styles/PainelMestreOrdem.css';

export default function MasterSystemPanel({ theme, style, usuario, onSair, seletor, navLabel, areas, area, onAreaChange, action, children }) {
  return <main className={`master-accounts master-system-panel ${theme}`} style={style}>
    <div className="master-system-inner">
      <header className="master-system-bar">
        {seletor}
        <div className="master-system-controls">
          <a href="/?mestre=1&personagens=1">Meus personagens</a>
          <button type="button" onClick={onSair}>Sair da conta</button>
        </div>
      </header>
      <section className="master-system-hero">
        <p>{usuario.nome}</p>
        <h1>Painel do Mestre</h1>
        {action}
      </section>
      <nav className="master-areas master-system-nav" aria-label={navLabel}>
        {areas.map(({ id, label, icon }) => <button key={id} type="button" aria-current={area === id ? 'page' : undefined} onClick={() => onAreaChange(id)}>
          <Icon path={icon} size={0.8} />{label}
        </button>)}
      </nav>
      {children}
    </div>
  </main>;
}
