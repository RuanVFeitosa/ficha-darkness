import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MECHANIC_STATUS, MECHANIC_TYPES, normalizeMechanics } from '../../utils/specialMechanics';
import { buscarCampanhaPorCodigo } from '../../services/mesaApi';
import '../../styles/SpecialMechanics.css';
import RevoltMechanic, { RevoltSetup } from './RevoltMechanic';
import { REVOLT_FRONTS } from '../../utils/revoltMechanic';
import { mechanicPlayerId } from '../../utils/mechanicParticipation';
import { commitMechanicAction } from '../../services/mechanicActions';

export function SpecialMechanicsDialog({ onClose, ...props }) {
  const panel = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector('button')?.focus();
    const element = panel.current;
    return () => { if ((element?.contains(document.activeElement) || document.activeElement === document.body) && previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(<div className="mesa-mechanics-overlay"><div ref={panel} role="dialog" aria-label="Mecânicas especiais da campanha" className={`mesa-mechanics-dialog${minimized ? ' is-minimized' : ''}${expanded ? ' is-expanded' : ''}`} onKeyUp={event => event.stopPropagation()} onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape') onClose();
  }}>
    <header className="sm-window-header"><div><span>FERRAMENTAS DA SESSÃO</span><strong>Mecânicas especiais</strong></div><nav aria-label="Janela de mecânicas">
      <button type="button" aria-expanded={!minimized} title={minimized ? 'Restaurar painel' : 'Recolher painel'} onClick={() => setMinimized(value => !value)}>{minimized ? 'Restaurar' : 'Recolher'}</button>
      <button type="button" disabled={minimized} aria-pressed={expanded} title={expanded ? 'Usar painel compacto' : 'Ampliar painel'} onClick={() => setExpanded(value => !value)}>{expanded ? 'Compactar' : 'Ampliar'}</button>
      <button type="button" aria-label="Fechar mecânicas especiais" title="Fechar painel" onClick={onClose}>×</button>
    </nav></header>
    <div className="sm-window-content" hidden={minimized}><SpecialMechanics {...props}/></div>
  </div></div>, document.body);
}

export function SpecialMechanicsBanner({ state, onOpen }) {
  const normalized = normalizeMechanics(state);
  const event = normalized.events.find(item => item.id === normalized.activeId);
  if (!event) return null;
  const summary = event.revolt ? `Rodada ${event.revolt.round} · ${Object.entries(event.revolt.fronts).map(([key, front]) => `${REVOLT_FRONTS[key].name}: ${front.position}/4, Fôlego ${front.breath}`).join(' · ')}` : event.tower ? `Base ${event.tower.health}/${event.tower.maxHealth} · Onda ${event.tower.wave}/${event.tower.waves.length}` : event.counters?.map(counter => `${counter.label} ${counter.value}/${counter.max}`).join(' · ');
  return <button type="button" className="special-mechanics-banner" onClick={onOpen}><span>MECÂNICA ESPECIAL · {MECHANIC_STATUS[event.status]}</span><strong>{event.name}</strong><small>{summary} ↗</small></button>;
}

export default function SpecialMechanics({ campaign, master = false, playerId = '', onState }) {
  const state = normalizeMechanics(campaign?.mecanicasEspeciais);
  const [selection, setSelection] = useState(null);
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState('towerDefense');
  const [config, setConfig] = useState({});
  const [defenseName, setDefenseName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const identity = mechanicPlayerId(playerId);
  const visible = master ? state.events : state.events.filter(event => event.status !== 'prepared');
  const selected = visible.find(event => event.id === selection) || visible.find(event => event.id === state.activeId) || visible[visible.length - 1];
  const act = async action => {
    if (pending.current || !campaign?.id) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const saved = await commitMechanicAction(campaign, state, action, { master, playerId: identity });
      onState(saved);
      if (action.type === 'create') { setSelection(saved.events[saved.events.length - 1].id); setCreating(false); setConfig({}); }
      if (action.type === 'build') setDefenseName('');
    } catch (err) {
      setError(err.message || 'Não foi possível salvar a mecânica.');
      if (err.code === 'MECHANIC_CONFLICT') {
        try { const fresh = await buscarCampanhaPorCodigo(campaign.codigo); if (fresh) onState(fresh.mecanicasEspeciais); } catch { /* Keep the failed action unapplied. */ }
      }
    }
    finally { pending.current = false; setBusy(false); }
  };
  const send = (type, extra = {}) => act({ type, id: selected.id, ...extra });
  const field = (key, label, fallback, min = 0, max = 9999) => <label key={key}>{label}<input type="number" min={min} max={max} value={config[key] ?? fallback} onChange={event => setConfig(current => ({ ...current, [key]: event.target.value }))}/></label>;
  const controls = master && selected?.status === 'active';
  return <section className="special-mechanics" aria-label="Mecânicas especiais">
    <header className="sm-heading"><span>REGRAS DA CENA / SESSÃO</span><h3>Mecânicas especiais</h3><p>Eventos compartilhados para mudar o ritmo da campanha.</p>{master && <button type="button" disabled={busy} onClick={() => setCreating(value => !value)}>{creating ? 'Cancelar preparação' : '+ Preparar mecânica'}</button>}</header>
    {error && <p role="alert" className="sm-error">{error}</p>}
    {creating && master && <form className="sm-setup" onSubmit={event => { event.preventDefault(); act({ type: 'create', kind, config }); }}>
      <div className="sm-setup-intro"><span>PREPARAÇÃO DE EVENTO</span><h4>Defina o próximo desafio.</h4><p>Escolha a mecânica e prepare as regras para a mesa.</p></div>
      <fieldset className="sm-setup-section sm-template"><legend><span>01</span> Modelo da operação</legend>
      <div className="sm-template-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M20 3 35 12v16L20 37 5 28V12Z M20 3v34 M5 12l30 16 M35 12 5 28"/></svg></div>
      <div className="sm-template-content">
      <label>Modelo<select value={kind} onChange={event => setKind(event.target.value)}>{Object.entries(MECHANIC_TYPES).map(([id, type]) => <option key={id} value={id}>{type.name}</option>)}</select></label>
      <p>{MECHANIC_TYPES[kind].description}</p>
      </div></fieldset>
      <fieldset className="sm-setup-section"><legend><span>02</span> Contexto da sessão</legend>
      <div className="sm-setup-identity">
      <label>Nome<input required maxLength={100} value={config.name || ''} placeholder={MECHANIC_TYPES[kind].name} onChange={event => setConfig(current => ({ ...current, name: event.target.value }))}/></label>
      <label>Cena de referência<select value={config.sceneId || ''} onChange={event => setConfig(current => ({ ...current, sceneId: event.target.value }))}><option value="">Toda a sessão</option>{(campaign.cenas || []).map(scene => <option key={scene.id} value={scene.id}>{scene.nome}</option>)}</select></label>
      </div>
      {field('difficulty', 'DT de teste da mecânica · independente da cena', 1, 1, 5)}
      <label>Regras para os jogadores<textarea maxLength={2000} rows={3} value={config.rules || ''} placeholder="Explique as ações permitidas e como resolver este evento." onChange={event => setConfig(current => ({ ...current, rules: event.target.value }))}/></label>
      <label>Objetivos (um por linha)<textarea maxLength={2000} rows={3} value={config.objectives || ''} placeholder={'Proteger o portão\nManter os civis a salvo'} onChange={event => setConfig(current => ({ ...current, objectives: event.target.value }))}/></label>
      </fieldset>
      <fieldset className="sm-setup-section"><legend><span>03</span> {kind === 'revolt' ? 'Frentes e percursos' : 'Parâmetros da mecânica'}</legend>
      {kind === 'revolt' ? <RevoltSetup members={campaign.membros || []} defaultDifficulty={config.difficulty || 1} value={config.fronts} onChange={fronts => setConfig(current => ({ ...current, fronts }))}/> : <div className="sm-fields">{kind === 'towerDefense' ? <>{field('health', 'Integridade da base', 20, 1)}{field('resources', 'Recursos iniciais', 10)}{field('waves', 'Total de ondas', 3, 1, 30)}{field('enemies', 'Inimigos na primeira onda', 5, 1, 100)}{field('growth', 'Inimigos extras por onda', 2, 0, 20)}{field('reward', 'Recompensa por onda', 5)}{field('breachDamage', 'Dano por invasor', 1, 1)}{field('defenseCost', 'Custo de uma defesa', 5, 1)}</> : kind === 'challenge' ? <>{field('target', 'Meta de progresso', 6, 1)}{field('danger', 'Limite de perigo', 4, 1)}</> : <label>Contadores (Nome:limite, um por linha)<textarea maxLength={2000} rows={3} value={config.counters ?? 'Progresso:6'} onChange={event => setConfig(current => ({ ...current, counters: event.target.value }))}/></label>}</div>}
      </fieldset>
      <footer className="sm-setup-footer">
      <p>A cena é uma referência: a mecânica só começa quando o mestre iniciar. Preparações não aparecem no painel dos jogadores.</p>
      <button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar preparação'}</button>
      </footer>
    </form>}
    {visible.length > 0 && <label className="sm-event-picker">Eventos da campanha<select value={selected?.id || ''} onChange={event => setSelection(event.target.value)}>{visible.map(event => <option key={event.id} value={event.id}>{event.name} · {MECHANIC_STATUS[event.status]}</option>)}</select></label>}
    {!selected ? <div className="sm-empty"><strong>Nenhuma mecânica {master ? 'preparada' : 'iniciada'}</strong><p>{master ? 'Prepare um Tower Defense, um desafio de progresso ou suas próprias regras.' : 'Quando o mestre iniciar um evento, os objetivos e contadores aparecerão aqui.'}</p></div> : <div className="sm-event">
      <header><span className={`sm-status sm-status-${selected.status}`}>{MECHANIC_STATUS[selected.status]}</span><h4>{selected.name}</h4><small>{MECHANIC_TYPES[selected.type]?.name}{selected.sceneId && ` · ${campaign.cenas?.find(scene => scene.id === selected.sceneId)?.nome || 'Cena de referência'}`}</small></header>
      {selected.rules && <p className="sm-rules">{selected.rules}</p>}
      {!selected.revolt && <div className="sm-mechanic-difficulty">{master ? <label>DT própria da mecânica<input key={`${selected.id}-${selected.difficulty || 1}`} type="number" min="1" max="5" defaultValue={selected.difficulty || 1} disabled={busy || ['victory', 'defeat', 'ended'].includes(selected.status)} onBlur={event => { if (Number(event.target.value) !== (selected.difficulty || 1)) send('difficulty', { value: event.target.value }); }}/></label> : <span>DT própria da mecânica: {selected.difficulty || 1}</span>}<small>Independente das dificuldades da cena.</small></div>}
      {master && <div className="sm-actions">
        {selected.status === 'prepared' && <button disabled={busy} onClick={() => send('start')}>Iniciar mecânica</button>}
        {selected.status === 'active' && <button disabled={busy} onClick={() => send('pause')}>Pausar</button>}
        {selected.status === 'paused' && <button disabled={busy} onClick={() => send('resume')}>Retomar</button>}
        {['active', 'paused'].includes(selected.status) && <>
          {selected.type !== 'revolt' && <button disabled={busy} onClick={() => send('finish', { outcome: 'victory' })}>Declarar vitória</button>}
          <button disabled={busy} onClick={() => send('finish', { outcome: 'defeat' })}>Declarar derrota</button>
          <button disabled={busy} onClick={() => send('finish', { outcome: 'ended' })}>Encerrar evento</button>
        </>}
        {!['active', 'paused'].includes(selected.status) && <button disabled={busy} onClick={() => { if (window.confirm('Remover esta mecânica e seu histórico?')) send('remove'); }}>Remover</button>}
      </div>}
      {selected.revolt ? <RevoltMechanic key={selected.id} event={selected} master={master} playerId={identity} members={campaign.membros || []} busy={busy} send={send}/> : selected.tower ? <>
        <div className="sm-stats"><div><span>BASE</span><strong>{selected.tower.health}<small> / {selected.tower.maxHealth}</small></strong><progress aria-label="Integridade da base" value={selected.tower.health} max={selected.tower.maxHealth}/></div><div><span>RECURSOS</span><strong>{selected.tower.resources}</strong></div><div><span>ONDA</span><strong>{selected.tower.wave}<small> / {selected.tower.waves.length}</small></strong></div><div><span>INIMIGOS RESTANTES</span><strong>{selected.tower.remaining}</strong></div></div>
        <p>O mestre resolve movimentos e ataques no mapa e registra os resultados aqui. Cada invasor causa {selected.tower.breachDamage} de dano à base.</p>
        <div className="sm-wave-list">{selected.tower.waves.map((wave, index) => <span key={wave.name} className={index + 1 === selected.tower.wave ? 'is-current' : ''}>{wave.name} · {wave.enemies} inimigos</span>)}</div>
        {controls && <div className="sm-actions"><button disabled={busy || selected.tower.waveActive} onClick={() => send('wave')}>Iniciar próxima onda</button><button disabled={busy || !selected.tower.waveActive || !selected.tower.remaining} onClick={() => send('kill')}>Inimigo derrotado</button><button disabled={busy || !selected.tower.waveActive || !selected.tower.remaining} onClick={() => send('breach')}>Invasor atingiu a base</button><button disabled={busy || !selected.tower.waveActive || selected.tower.remaining > 0} onClick={() => send('completeWave')}>Concluir onda · +{selected.tower.reward} recursos</button><button disabled={busy} onClick={() => send('resource', { delta: -1 })}>−1 recurso</button><button disabled={busy} onClick={() => send('resource', { delta: 1 })}>+1 recurso</button></div>}
        <h5>Defesas construídas · {selected.tower.defenses.length}</h5>
        {controls && <form className="sm-build" onSubmit={event => { event.preventDefault(); send('build', { name: defenseName }); }}><label>Nome da defesa<input maxLength={80} placeholder="Barricada no portão" value={defenseName} onChange={event => setDefenseName(event.target.value)}/></label><button disabled={busy || selected.tower.resources < selected.tower.defenseCost}>Construir · {selected.tower.defenseCost} recursos</button></form>}
        <ul className="sm-defenses">{selected.tower.defenses.map(defense => <li key={defense.id}><span>{defense.name}</span>{controls && <button disabled={busy} aria-label={`Destruir ${defense.name}`} onClick={() => send('destroyDefense', { key: defense.id })}>Destruída ×</button>}</li>)}</ul>
      </> : <div className="sm-counters">{selected.counters?.map(counter => <article key={counter.id}><span>{counter.label}</span><strong>{counter.value}<small> / {counter.max}</small></strong><progress aria-label={counter.label} value={counter.value} max={counter.max}/>{controls && <div className="sm-actions"><button disabled={busy || counter.value <= 0} aria-label={`Diminuir ${counter.label}`} onClick={() => send('counter', { key: counter.id, delta: -1 })}>−</button><button disabled={busy || counter.value >= counter.max} aria-label={`Aumentar ${counter.label}`} onClick={() => send('counter', { key: counter.id, delta: 1 })}>+</button></div>}</article>)}</div>}
      {selected.objectives.length > 0 && <div className="sm-objectives"><h5>Objetivos</h5>{selected.objectives.map(objective => <label key={objective.id}><input type="checkbox" checked={objective.done} disabled={!controls || busy} onChange={() => send('objective', { key: objective.id })}/><span>{objective.label}</span></label>)}</div>}
      <details className="sm-history"><summary>Registro do evento · {selected.log.length}</summary><ol>{selected.log.map((entry, index) => <li key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time> {entry.message}</li>)}</ol></details>
    </div>}
    {busy && <p role="status">Sincronizando mecânica…</p>}
  </section>;
}
