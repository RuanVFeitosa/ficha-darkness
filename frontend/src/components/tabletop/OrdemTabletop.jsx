import React, { lazy, Suspense, useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose, mdiDiceD20Outline, mdiFileDocumentMultipleOutline, mdiFolderAccountOutline } from '@mdi/js';
import { rollOrdemTest } from '../../services/ordemSheet';
import ShieldInitiativeStrip from './ShieldInitiativeStrip';
import '../../styles/OrdemTabletop.css';

const OrdemMasterTools = lazy(() => import('../mestre/OrdemMasterTools'));
const shieldTools = [
  ['session', 'Operação'],
  ['scenes', 'Cenas e mapas'],
  ['documents', 'Evidências'],
  ['inimigos', 'Ameaças'],
  ['paranormal', 'Rituais e poderes'],
  ['regras', 'Livro de regras'],
  ['notes', 'Anotações'],
  ['audio', 'Trilha sonora'],
  ['soundpad', 'Efeitos sonoros'],
  ['lighting', 'Iluminação'],
];
const catalogTools = ['inimigos', 'paranormal', 'regras'];

export function OrdemShield({ campaign, onCampaignChange, onRefresh, onClose, renderTool }) {
  const [tool, setTool] = useState('session');
  const [visitedTools, setVisitedTools] = useState(['session']);
  const [roll, setRoll] = useState(null);

  function chooseTool(id) {
    setTool(id);
    setVisitedTools(current => current.includes(id) ? current : [...current, id]);
  }

  function rollTest(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = rollOrdemTest(Number(data.get('attribute')), 0, Number(data.get('bonus')));
    setRoll({ ...result, passed: result.total >= Number(data.get('difficulty')) });
  }

  return <aside className="ordem-shield" aria-label="Escudo do mestre de Ordem"
    onKeyDown={event => {
      if (event.key === 'Escape' && !event.defaultPrevented && !event.target.closest('dialog[open]')) onClose();
    }}>
    <header>
      <div className="ordem-operation-mark">
        <img src="/ordem-ordo-realitas.png" alt="" />
        <div><small>ORDO REALITAS</small><strong>Escudo do mestre</strong></div>
      </div>
      <button type="button" onClick={onClose} aria-label="Fechar escudo do mestre"><Icon path={mdiClose} size={0.85} /></button>
    </header>
    <nav className="ordem-shield-nav" aria-label="Ferramentas do mestre">
      {shieldTools.map(([id, label]) => <button key={id} type="button" aria-pressed={tool === id} onClick={() => chooseTool(id)}>{label}</button>)}
    </nav>
    <div className="ordem-shield-content">
      <div hidden={tool !== 'session'}>
        <section className="ordem-shield-card ordem-operations">
          <div><small>CENA ATIVA</small><h2>{campaign.cenaAtiva?.nome || 'Nenhuma cena ativa'}</h2></div>
          <ShieldInitiativeStrip campaign={campaign} onCampaignChange={onCampaignChange} onRefresh={onRefresh} />
        </section>
        <div className="ordem-shield-columns">
          <section className="ordem-shield-card">
            <h3>Agentes vinculados</h3>
            {campaign.membros.length ? <ul>{campaign.membros.map(member => <li key={member.id || member.ficha_id}>{member.nome || 'Agente'}</li>)}</ul> : <p>Nenhum agente vinculado.</p>}
          </section>
          <section className="ordem-shield-card">
            <h3><Icon path={mdiDiceD20Outline} size={0.9} /> Teste privado</h3>
            <form className="ordem-shield-dice" onSubmit={rollTest}>
              <label>Atributo <input name="attribute" type="number" min="0" max="20" defaultValue="1" required /></label>
              <label>Bônus <input name="bonus" type="number" defaultValue="0" required /></label>
              <label>DT <input name="difficulty" type="number" min="1" defaultValue="15" required /></label>
              <button type="submit">Rolar</button>
            </form>
            {roll && <output aria-label="Resultado do teste privado">{roll.passed ? 'Sucesso' : 'Falha'} · {roll.total} · Dados {roll.dice.join(', ')} ({roll.lowest ? 'menor' : 'maior'} {roll.chosen})</output>}
          </section>
        </div>
      </div>
      {visitedTools.filter(id => id !== 'session').map(id => <div key={id} hidden={tool !== id}>
        {catalogTools.includes(id) ? <Suspense fallback={<p role="status">Abrindo consulta…</p>}>
          <OrdemMasterTools abaIntegrada={id} podeEditarImagem={false} />
        </Suspense> : renderTool(id)}
      </div>)}
    </div>
  </aside>;
}

export function OrdemPlayerDock({ active, onToggle, documentsVisible, evidenceCount }) {
  return <nav className="ordem-player-dock" aria-label="Operação do jogador">
    <button type="button" aria-pressed={active === 'ficha'} onClick={() => onToggle('ficha')}>
      <Icon path={mdiFolderAccountOutline} size={0.9} /> Minha ficha
    </button>
    {documentsVisible && <button type="button" aria-pressed={active === 'documentos'} onClick={() => onToggle('documentos')}>
      <Icon path={mdiFileDocumentMultipleOutline} size={0.85} /> Evidências <b>{evidenceCount}</b>
    </button>}
  </nav>;
}

export function OrdemPlayerSheet({ members, selectedId, onSelect, onClose }) {
  const agents = members.filter(member => member.ficha_id?.startsWith('ordem:'));
  const agent = agents.find(member => member.ficha_id === selectedId);
  const params = agent && new URLSearchParams({ ordem: '1', agente: agent.ficha_id.slice('ordem:'.length), embed: 'mesa' });

  return <section className="ordem-player-sheet" role="region" aria-label="Ficha do agente"
    onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
    <header>
      <div><small>ORDO REALITAS</small><strong>Dossiê do agente</strong></div>
      {agents.length > 0 && <select aria-label="Ficha vinculada" value={agent?.ficha_id || ''} onChange={event => onSelect(event.target.value)}>
        <option value="">Selecionar agente</option>
        {agents.map(member => <option key={member.id || member.ficha_id} value={member.ficha_id}>{member.nome || 'Agente'}</option>)}
      </select>}
      <button type="button" aria-label="Fechar ficha" onClick={onClose}><Icon path={mdiClose} size={0.85} /></button>
    </header>
    {agent ? <iframe key={agent.ficha_id} title={`Ficha de ${agent.nome || 'agente'}`} src={`/?${params}`} /> :
      <div className="ordem-sheet-empty"><p>{agents.length ? 'Selecione seu agente para abrir a ficha.' : 'Nenhum agente vinculado a esta operação.'}</p>
        {!agents.length && <a href="/?ordem=1">Abrir fichas de Ordem</a>}
      </div>}
  </section>;
}
