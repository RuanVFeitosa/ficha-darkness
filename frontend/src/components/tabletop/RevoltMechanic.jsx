import React, { useEffect, useState } from 'react';
import { allowedRevoltActions, breathLabel, REVOLT_ACTIONS, REVOLT_FRONTS, REVOLT_REACTIONS } from '../../utils/revoltMechanic';
import '../../styles/RevoltMechanic.css';
import '../../styles/RevoltEditor.css';
import { frontPlayers, mechanicPlayerId } from '../../utils/mechanicParticipation';
import { ATRIBUTOS_ABSOLUTO, DOMINIOS } from '../../data/absolutoV1';
import { revoltGroupSheet } from '../../utils/revoltGroupSheets';

const frontKeys = Object.keys(REVOLT_FRONTS);
const phases = { planning: 'Escolhas simultâneas', resolving: 'Resolução das frentes', reaction: 'Reação do regime', final: 'Tomada final', victory: 'A ditadura caiu' };
const namesFrom = (fronts, defaultDifficulty = 1) => Object.fromEntries(frontKeys.map(key => [key, { team: fronts?.[key]?.team || '', players: fronts?.[key]?.players || [], difficulty: fronts?.[key]?.difficulty || defaultDifficulty, sheet: revoltGroupSheet(fronts?.[key], key), route: fronts?.[key]?.route || [...REVOLT_FRONTS[key].route] }]));

function GroupSheetEditor({ frontKey, sheet, disabled, onChange }) {
  const [page, setPage] = useState('attributes');
  const update = (section, key, value) => onChange({ ...sheet, [section]: { ...sheet[section], [key]: Number(value) } });
  return <div className="rv-sheet-editor">
    <label>Nome da ficha de {REVOLT_FRONTS[frontKey].name}<input disabled={disabled} maxLength={100} value={sheet.nome} onChange={e => onChange({ ...sheet, nome: e.target.value })}/></label>
    <nav className="rv-sheet-tabs" aria-label="Seções da ficha do grupo">{[['attributes','Atributos'],['domains','Domínios'],['actions','Testes por ação']].map(([id, label]) => <button type="button" key={id} aria-pressed={page === id} onClick={() => setPage(id)}>{label}</button>)}</nav>
    <fieldset disabled={disabled} className="rv-sheet-fields"><legend>{page === 'attributes' ? 'Atributos do grupo' : page === 'domains' ? 'Domínios do grupo' : 'Teste usado em cada ação'}</legend>
      {page === 'attributes' && <div className="rv-stat-grid">{Object.entries(ATRIBUTOS_ABSOLUTO).map(([key, label]) => <label key={key}><span>{label}</span><input aria-label={`${label} · ${REVOLT_FRONTS[frontKey].name}`} type="number" min="0" max="5" value={sheet.atributos[key]} onChange={e => update('atributos', key, e.target.value)}/><small>ATRIBUTO</small></label>)}</div>}
      {page === 'domains' && <div className="rv-domain-grid">{Object.entries(DOMINIOS).map(([key, definition]) => <label key={key}><span>{definition.nome}</span><input aria-label={`${definition.nome} · ${REVOLT_FRONTS[frontKey].name}`} type="number" min="0" max="5" value={sheet.dominios[key]} onChange={e => update('dominios', key, e.target.value)}/></label>)}</div>}
      {page === 'actions' && <div className="rv-action-tests">{Object.entries(sheet.tests).map(([action, value], index) => <label key={action}><span><i>{String(index + 1).padStart(2, '0')}</i>{REVOLT_ACTIONS[action] || 'Objetivo final'}</span><select aria-label={`${REVOLT_ACTIONS[action] || 'Objetivo final'} · ${REVOLT_FRONTS[frontKey].name}`} value={value} onChange={e => onChange({ ...sheet, tests: { ...sheet.tests, [action]: e.target.value } })}><optgroup label="Domínios">{Object.entries(DOMINIOS).map(([id, d]) => <option key={id} value={`domain:${id}`}>{d.nome}</option>)}</optgroup><optgroup label="Atributos">{Object.entries(ATRIBUTOS_ABSOLUTO).map(([id, name]) => <option key={id} value={`attribute:${id}`}>{name}</option>)}</optgroup></select></label>)}</div>}
    </fieldset>
    <p className="rv-editor-note">Ficha compartilhada por todos os jogadores desta frente.</p>
  </div>;
}

export function RevoltSetup({ value, onChange, members = [], defaultDifficulty = 1, assignmentLocked = false }) {
  const [activeFront, setActiveFront] = useState('popular');
  const [section, setSection] = useState('players');
  const [search, setSearch] = useState('');
  const fronts = namesFrom(value, defaultDifficulty);
  const change = (key, patch) => onChange({ ...fronts, [key]: { ...fronts[key], ...patch } });
  const front = fronts[activeFront], definition = REVOLT_FRONTS[activeFront];
  const filtered = members.filter(member => String(member.nome || '').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <div className={`rv-editor rv-editor--${activeFront}`}>
    <nav className="rv-front-picker" aria-label="Configurar frente">{frontKeys.map((key, index) => <button type="button" key={key} aria-pressed={activeFront === key} onClick={() => { setActiveFront(key); setSearch(''); }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{REVOLT_FRONTS[key].name}</strong><small>{fronts[key].players.length} {fronts[key].players.length === 1 ? 'jogador' : 'jogadores'} · DT {fronts[key].difficulty}</small></button>)}</nav>
    <fieldset className="rv-front-workspace"><legend className="rv-sr-only">{definition.name}</legend>
      <header className="rv-workspace-heading"><div><span>CONFIGURAÇÃO DA FRENTE</span><h4>{definition.name}</h4></div><div className="rv-dt-badge">DT <b>{front.difficulty}</b></div></header>
      <nav className="rv-section-tabs" aria-label="Configuração da frente selecionada">{[['players','Equipe'],['route','Percurso'],['sheet','Ficha do grupo']].map(([key, label]) => <button type="button" key={key} aria-pressed={section === key} onClick={() => setSection(key)}>{label}</button>)}</nav>
      {section === 'players' && <div className="rv-team-page"><div className="rv-identity-fields"><label>Grupo / integrantes de {definition.name}<input maxLength={200} value={front.team} onChange={event => change(activeFront, { team: event.target.value })} placeholder="Nome do grupo"/></label><label>DT de {definition.name} · ABSOLUTO<input type="number" min="1" max="5" disabled={assignmentLocked} value={front.difficulty} onChange={e => change(activeFront, { difficulty: Number(e.target.value) })}/></label></div>
        <div className="rv-roster-heading"><div><strong>Jogadores designados</strong><small>{front.players.length} de {members.length} fichas da campanha</small></div><input type="search" aria-label={`Buscar jogadores para ${definition.name}`} placeholder="Buscar jogador…" value={search} onChange={e => setSearch(e.target.value)}/></div>
        <div className="rv-roster">{filtered.map(member => { const id = mechanicPlayerId(member.ficha_id), checked = front.players.includes(id), other = frontKeys.find(key => key !== activeFront && fronts[key].players.includes(id)); return <label key={id} className={`${checked ? 'is-assigned' : ''}${other ? ' is-unavailable' : ''}`}><input aria-label={member.nome || 'Personagem'} type="checkbox" checked={checked} disabled={Boolean(other) || assignmentLocked} onChange={e => change(activeFront, { players: e.target.checked ? [...front.players, id] : front.players.filter(value => value !== id) })}/><span className="rv-member-avatar" aria-hidden="true">{String(member.nome || '?').slice(0, 1).toUpperCase()}</span><span className="rv-member-name">{member.nome || 'Personagem'}<small>{other ? REVOLT_FRONTS[other].name : checked ? 'Nesta frente' : 'Disponível'}</small></span><span className="rv-member-indicator" aria-hidden="true">{checked ? '✓' : '+'}</span></label>; })}{!filtered.length && <p className="rv-editor-note">{members.length ? 'Nenhum jogador encontrado.' : 'Vincule fichas à campanha para formar a equipe.'}</p>}</div>
        <p className="rv-editor-note">Cada jogador participa de uma frente. A DT pertence à mecânica e é independente da cena.</p>
      </div>}
      {section === 'route' && <div className="rv-route-page"><p>Quatro conquistas até a sede do governo.</p><div className="rv-route-fields">{front.route.map((place, index) => <label key={index}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{index === 1 ? 'CONQUISTA COM BENEFÍCIO' : index === 3 ? 'ACESSO À SEDE' : 'POSIÇÃO DA FRENTE'}</small><input aria-label={`${definition.name} · posição ${index + 1}`} required maxLength={100} value={place} onChange={event => change(activeFront, { route: front.route.map((item, i) => i === index ? event.target.value : item) })}/></div></label>)}</div><p className="rv-route-benefit">{definition.benefit}</p></div>}
      {section === 'sheet' && <GroupSheetEditor key={activeFront} frontKey={activeFront} sheet={front.sheet} disabled={assignmentLocked} onChange={sheet => change(activeFront, { sheet })}/>}
    </fieldset>
  </div>;
}

function NamesEditor({ fronts, busy, send, members, assignmentLocked }) {
  const [draft, setDraft] = useState(() => namesFrom(fronts));
  const signature = JSON.stringify(namesFrom(fronts));
  useEffect(() => { setDraft(JSON.parse(signature)); }, [signature]);
  return <details className="revolt-edit"><summary>Designar jogadores, DTs e locais</summary><form onSubmit={event => { event.preventDefault(); send('revoltRename', { fronts: draft }); }}><RevoltSetup value={draft} onChange={setDraft} members={members} assignmentLocked={assignmentLocked}/><button disabled={busy}>Salvar designações e DTs</button></form></details>;
}

function GroupRoll({ front, name, dt, groupSheet, busy, send, final = false }) {
  const [choice, setChoice] = useState('domain:razao');
  return <div className="revolt-personal-test"><p><strong>DT {dt} · Revolta</strong> · ficha pronta: {groupSheet.nome}.</p><label>Teste de {name}<select value={choice} onChange={e => setChoice(e.target.value)}><optgroup label="Domínios">{Object.entries(DOMINIOS).map(([key, definition]) => <option key={key} value={`domain:${key}`}>{definition.nome}</option>)}</optgroup><optgroup label="Atributos">{Object.entries(ATRIBUTOS_ABSOLUTO).map(([key, label]) => <option key={key} value={`attribute:${key}`}>{label}</option>)}</optgroup></select></label><button disabled={busy} onClick={() => { const [testKind, testKey] = choice.split(':'); send(final ? 'revoltFinalTest' : 'revoltTest', { front, testKind, testKey }); }}>Rolar teste de ABSOLUTO · {name}</button></div>;
}
function TestResult({ result }) {
  if (!result?.test) return null;
  return <div className="revolt-test-result"><strong>{result.author} · {result.test.titulo}</strong><p>DT {result.test.dt} da Revolta · {result.test.exitos} êxito(s) · {result.test.sucesso ? 'Sucesso' : 'Falha'}</p><div aria-label="Dados do teste">{result.test.dados.map((value, index) => <span key={index} className={result.test.dadosExitos[index] ? 'is-success' : ''}>{value}</span>)}</div></div>;
}

function FrontCard({ id, event, master, busy, send, focused, playerId, members }) {
  const r = event.revolt, front = r.fronts[id], definition = REVOLT_FRONTS[id];
  const choices = allowedRevoltActions(r, id);
  const [draft, setDraft] = useState({ type: choices.includes('advance') ? 'advance' : choices[0], mode: 'lead', target: frontKeys.find(key => key !== id) });
  const [die, setDie] = useState('');
  const plan = r.plans[id], result = r.results[id];
  const assigned = frontPlayers(front);
  const groupSheet = revoltGroupSheet(front, id);
  const participant = !master && assigned.includes(mechanicPlayerId(playerId));
  const legacyMaster = master && assigned.length === 0;
  const canControl = participant || legacyMaster;
  const canAct = canControl && event.status === 'active' && !busy;
  const planning = r.phase === 'planning';
  const snapshot = r.snapshot?.[id];
  const fortified = front.fortified.includes(front.position + 1);
  const communicationBlocked = r.reaction?.type === 'blackout' && r.reaction.front === id;
  return <article className={`revolt-front revolt-front--${id}${focused ? ' is-focused' : ''}`} aria-label={`Frente ${definition.name}`}>
    <header><span>FRENTE {String(frontKeys.indexOf(id) + 1).padStart(2, '0')}</span><h5>{definition.name}</h5><p>{front.team || 'Grupo a definir'}</p></header>
    <p className="revolt-assigned">{assigned.length ? assigned.map(player => members.find(member => mechanicPlayerId(member.ficha_id) === player)?.nome || 'Jogador vinculado').join(' · ') : 'Nenhum jogador designado'}{participant ? ' · Sua frente' : ''}</p>
    <p className="revolt-difficulty">DT de ABSOLUTO: {snapshot?.difficulty || front.difficulty || event.difficulty || 1} · independente da cena</p>
    <div className="revolt-readout"><div><span>POSIÇÃO</span><strong>{front.position}<small> / 4</small></strong></div><div className={`revolt-breath is-${front.breath === 0 ? 'stalled' : front.breath <= 1 ? 'critical' : front.breath < 4 ? 'worn' : 'ready'}`}><span>FÔLEGO</span><strong>{front.breath}<small> / 6</small></strong><small>{breathLabel(front.breath)}</small></div></div>
    <ol className="revolt-route">{front.route.map((place, index) => <li key={index} className={index < front.position ? 'is-conquered' : index === front.position ? 'is-next' : ''}><span aria-hidden="true">{index < front.position ? '✓' : index + 1}</span><div>{place}{index + 1 === 2 && <small>Benefício de frente{front.milestoneClaimed ? ' · conquistado' : ''}</small>}</div></li>)}</ol>
    <p className="revolt-benefit">{definition.benefit}</p>
    {front.position === 4 && <p className="revolt-arrived">Na sede: mantém o acesso aberto e pode apoiar as outras frentes.</p>}
    {front.bonus > 0 && <p className="revolt-radio">{front.bonus} bônus de +1 reservado(s). Máximo +1 de apoio por teste.</p>}
    {fortified && front.position < 4 && <p className="revolt-warning">Próxima posição fortificada · −1 ao liderar.</p>}
    {communicationBlocked && <p className="revolt-warning">Sem oferecer ou receber Apoio nesta rodada.</p>}
    {r.reaction?.type === 'counterattack' && r.reaction.front === id && <p className="revolt-warning">Contra-ataque: defender em cena ou recuar uma posição.</p>}
    {master && planning && event.status === 'active' && front.position < 4 && <button className="revolt-fortify" disabled={busy || Object.keys(r.plans).length > 0} onClick={() => send('revoltFortify', { front: id })}>{fortified ? 'Retirar fortificação' : 'Informar posição fortificada'} · {definition.name}</button>}
    {master && assigned.length > 0 && planning && <p className="revolt-radio">{plan ? 'Escolha recebida do grupo.' : 'Aguardando a escolha dos jogadores desta frente.'}</p>}
    {canControl && event.status === 'active' && planning && <div className="revolt-plan">
      {plan ? <><p className="revolt-choice">Escolha registrada: <strong>{REVOLT_ACTIONS[plan.type]}</strong>{plan.groupTest ? ' · teste da ficha do grupo realizado' : plan.type === 'advance' ? ` · ${plan.mode === 'lead' ? 'Liderar' : 'Intervir pessoalmente'}` : plan.type === 'support' ? ` ${REVOLT_FRONTS[plan.target].name}` : ''}</p>{!plan.groupTest && <button disabled={busy} onClick={() => send('revoltPlan', { front: id, clear: true })}>Alterar escolha de {definition.name}</button>}</> : <form onSubmit={e => { e.preventDefault(); participant ? send('revoltGroupAction', { front: id, choice: draft.type, target: draft.target }) : send('revoltPlan', { front: id, plan: draft }); }}>
        <label>Ação de {definition.name}<select value={draft.type} onChange={e => setDraft(current => ({ ...current, type: e.target.value }))}>{choices.map(type => <option key={type} value={type}>{REVOLT_ACTIONS[type]}</option>)}</select></label>
        {!participant && draft.type === 'advance' && <label>Como avançar · {definition.name}<select value={draft.mode} onChange={e => setDraft(current => ({ ...current, mode: e.target.value }))}><option value="lead">Liderar a revolta · 1d6</option><option value="personal">Intervir pessoalmente · cena ABSOLUTO</option></select></label>}
        {draft.type === 'support' && <label>Frente apoiada por {definition.name}<select value={draft.target} onChange={e => setDraft(current => ({ ...current, target: e.target.value }))}>{frontKeys.filter(key => key !== id).map(key => <option key={key} value={key} disabled={r.reaction?.type === 'blackout' && r.reaction.front === key}>{REVOLT_FRONTS[key].name}</option>)}</select></label>}
        <button disabled={!canAct}>{participant ? 'Escolher e rolar' : 'Registrar escolha de'} {participant ? '· ' : ''}{definition.name}</button>
      </form>}
    </div>}
    {r.phase === 'resolving' && !result && plan && <div className="revolt-resolution"><strong>{REVOLT_ACTIONS[plan.type]} · {definition.name}</strong>
      {plan.type === 'advance' && plan.mode === 'lead' ? <>
        {assigned.length ? <p>Teste da ficha pronta {groupSheet.nome} · DT {snapshot.difficulty || front.difficulty || event.difficulty || 1}.</p> : <><p>1d6 {snapshot.breath >= 4 ? '+1 organização ' : ''}{(snapshot.supported || (snapshot.bonus > 0 && !snapshot.blocked)) ? '+1 apoio ' : ''}{snapshot.fortified ? '−1 fortificação' : ''}</p><p>5+: conquista sem desgaste · 3–4: conquista, −1 Fôlego · 2−: sem avanço, −1 Fôlego.</p></>}
        {participant ? <button disabled={!canAct} onClick={() => send('revoltResolve', { front: id })}>Rolar ficha do grupo · {definition.name}</button> : legacyMaster ? <><button disabled={!canAct} onClick={() => send('revoltResolve', { front: id })}>Rolar 1d6 · {definition.name}</button><form onSubmit={e => { e.preventDefault(); send('revoltResolve', { front: id, die: Number(die) }); }}><label>Dado do jogador · {definition.name}<input type="number" min="1" max="6" step="1" required value={die} onChange={e => setDie(e.target.value)}/></label><button disabled={!canAct}>Registrar dado · {definition.name}</button></form></> : <p>Aguardando a rolagem de um jogador designado a esta frente.</p>}
      </> : <><p>{plan.type === 'defend' ? 'Resolva a defesa com os testes normais de ABSOLUTO. Se não segurarem a posição, a frente recua um local.' : 'Resolva o teste usando a ficha pronta do grupo. O resultado determina o avanço e o desgaste da frente.'}</p>{participant && <GroupRoll front={id} name={definition.name} dt={snapshot.difficulty || front.difficulty || event.difficulty || 1} groupSheet={groupSheet} busy={!canAct} send={send}/>} {legacyMaster && <div className="sm-actions"><button disabled={!canAct} onClick={() => send('revoltResolve', { front: id, success: true })}>Objetivo cumprido · {definition.name}</button><button disabled={!canAct} onClick={() => send('revoltResolve', { front: id, success: false })}>{plan.type === 'defend' ? 'Defesa falhou' : 'Precisaram recuar'} · {definition.name}</button></div>}{!canControl && <p>Aguardando o teste dos jogadores desta frente.</p>}</>}
    </div>}
    {result && <p className="revolt-result">{result.summary}</p>}
    <TestResult result={result || (plan?.groupTest ? { test: plan.groupTest, author: plan.groupTest.autor } : null)}/>
    {['final', 'victory'].includes(r.phase) && <div className="revolt-final"><span>OBJETIVO FINAL</span><p>{definition.objective}</p><strong>{front.finalDone ? '✓ Objetivo cumprido' : 'Aguardando a cena do grupo'}</strong>{participant && !front.finalDone && event.status === 'active' && <GroupRoll front={id} name={definition.name} dt={front.difficulty || event.difficulty || 1} groupSheet={groupSheet} busy={!canAct} send={send} final/>}{legacyMaster && !front.finalDone && event.status === 'active' && <div className="sm-actions"><button disabled={busy} onClick={() => send('revoltFinal', { front: id, success: true })}>Concluir objetivo final · {definition.name}</button><button disabled={busy} onClick={() => send('revoltFinal', { front: id, success: false })}>Ainda não conseguiram · {definition.name}</button></div>}<TestResult result={front.finalTest}/></div>}
  </article>;
}

function Reward({ reward, event, busy, master, send }) {
  const eligible = frontKeys.filter(key => key !== reward.source && (reward.type === 'breath' || event.revolt.fronts[key].position < 4));
  const [target, setTarget] = useState(eligible[0] || '');
  const effectiveTarget = eligible.includes(target) ? target : eligible[0] || '';
  const resolved = frontKeys.every(key => event.revolt.results[key]);
  return <div className="revolt-reward"><strong>Benefício conquistado · {REVOLT_FRONTS[reward.source].name}</strong><p>{REVOLT_FRONTS[reward.source].benefit} A escolha é feita após resolver as três frentes.</p>{master && (eligible.length ? <form onSubmit={e => { e.preventDefault(); send('revoltReward', { reward: reward.id, target: effectiveTarget }); }}><label>Destino do benefício de {REVOLT_FRONTS[reward.source].name}<select value={effectiveTarget} onChange={e => setTarget(e.target.value)}>{eligible.map(key => <option key={key} value={key}>{REVOLT_FRONTS[key].name} · Fôlego {event.revolt.fronts[key].breath}/6</option>)}</select></label><button disabled={busy || !resolved || event.status !== 'active'}>Entregar benefício de {REVOLT_FRONTS[reward.source].name}</button></form> : <button disabled={busy || !resolved || event.status !== 'active'} onClick={() => send('revoltReward', { reward: reward.id, skip: true })}>Encerrar benefício sem alvo · todas as outras chegaram</button>)}</div>;
}

export default function RevoltMechanic({ event, master, busy, send, playerId = '', members = [] }) {
  const r = event.revolt;
  const [focusedFront, setFocusedFront] = useState(() => frontKeys.find(key => frontPlayers(r.fronts[key]).includes(mechanicPlayerId(playerId))) || 'popular');
  const participantFront = frontKeys.find(key => frontPlayers(r.fronts[key]).includes(mechanicPlayerId(playerId)));
  useEffect(() => { if (!master && participantFront) setFocusedFront(participantFront); }, [master, participantFront]);
  const [reaction, setReaction] = useState('reinforcements');
  const [target, setTarget] = useState(frontKeys.find(key => r.fronts[key].position < 4) || 'popular');
  const reactionTarget = reaction === 'reinforcements' && r.fronts[target].position === 4 ? frontKeys.find(key => r.fronts[key].position < 4) || target : target;
  const canAct = master && event.status === 'active' && !busy;
  const complete = frontKeys.every(key => r.results[key]);
  return <div className="revolt-board">
    <header className="revolt-round"><div><span>OPERAÇÃO SIMULTÂNEA / BRASÍLIA</span><h4>{r.phase === 'victory' ? 'A ditadura caiu.' : r.phase === 'final' ? 'Tomada da sede' : `Rodada ${r.round}`}</h4><p>{phases[r.phase]}</p></div><span className="revolt-arrival-count">{frontKeys.filter(key => r.fronts[key].position === 4).length}/3 <small>frentes na sede</small></span></header>
    {!master && playerId && !participantFront && <p className="revolt-radio">Você acompanha a operação. Aguarde o mestre designar sua ficha a uma frente para escolher ações e rolar.</p>}
    {master && !['victory', 'defeat', 'ended'].includes(event.status) && <NamesEditor fronts={r.fronts} busy={busy} send={send} members={members} assignmentLocked={r.phase !== "planning" || Object.keys(r.plans).length > 0}/>}
    <nav className="revolt-front-tabs" aria-label="Frentes da Revolta">{frontKeys.map(key => <button type="button" key={key} aria-pressed={focusedFront === key} onClick={() => setFocusedFront(key)}><span>{REVOLT_FRONTS[key].name}</span><strong>{r.fronts[key].position}/4 <small>· Fôlego {r.fronts[key].breath}</small></strong><small>{r.results[key] ? '✓ Resolvida' : r.plans[key] ? 'Escolha registrada' : 'Aguardando escolha'}</small></button>)}</nav>
    <details className="revolt-help"><summary>Regras e orientações da rodada</summary><p>Fôlego mede organização e capacidade de avançar. A Integridade, os ferimentos e os gastos dos personagens continuam nas fichas.</p>{r.phase === 'planning' && <p>Informe as posições fortificadas antes das escolhas. Registre uma ação por frente e trave as três para começar a resolução.</p>}</details>
    {r.reaction && !['final', 'victory'].includes(r.phase) && <p className="revolt-warning"><strong>Reação anunciada: {REVOLT_REACTIONS[r.reaction.type].name} → {REVOLT_FRONTS[r.reaction.front].name}.</strong> {REVOLT_REACTIONS[r.reaction.type].description}</p>}
    {event.status === 'prepared' && <p className="revolt-radio">Operação preparada. Inicie a mecânica para registrar as escolhas das três frentes.</p>}
    <div className="revolt-fronts">{frontKeys.map(key => <FrontCard key={`${event.id}-${r.round}-${key}`} id={key} event={event} master={master} busy={busy} send={send} focused={focusedFront === key} playerId={playerId} members={members}/>)}</div>
    {master && r.phase === 'planning' && <button className="revolt-primary" disabled={!canAct || Object.keys(r.plans).length !== 3} onClick={() => send('revoltLock')}>Travar escolhas e resolver rodada</button>}
    {r.phase === 'resolving' && <><div className="revolt-rewards">{r.rewards.filter(reward => !reward.used).map(reward => <Reward key={reward.id} reward={reward} event={event} master={master} busy={busy} send={send}/>)}</div>{master && <button className="revolt-primary" disabled={!canAct || !complete || r.rewards.some(reward => !reward.used)} onClick={() => send('revoltRoundEnd')}>Encerrar rodada {r.round}</button>}</>}
    {r.phase === 'reaction' && <section className="revolt-reaction"><h5>Reação para a rodada {r.round + 1}</h5><p>Anuncie uma única reação e a frente afetada antes das próximas decisões.</p>{master && <form onSubmit={e => { e.preventDefault(); send('revoltReaction', { reaction, front: reactionTarget }); }}><label>Reação militar<select value={reaction} onChange={e => setReaction(e.target.value)}>{Object.entries(REVOLT_REACTIONS).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label><p>{REVOLT_REACTIONS[reaction].description}</p><label>Frente afetada<select value={reactionTarget} onChange={e => setTarget(e.target.value)}>{frontKeys.map(key => <option key={key} value={key} disabled={reaction === 'reinforcements' && r.fronts[key].position === 4}>{REVOLT_FRONTS[key].name}</option>)}</select></label><button disabled={!canAct}>Anunciar reação e iniciar próxima rodada</button></form>}</section>}
    {r.phase === 'final' && <p className="revolt-radio">Os três acessos estão abertos. Alterne os grupos e registre o cumprimento de cada objetivo em sua cena de ABSOLUTO. A vitória exige os três.</p>}
    {r.phase === 'victory' && <p className="revolt-victory">Os portões estão abertos, a transmissão foi tomada e a fuga da cúpula foi bloqueada. O ditador pode estar na garagem, jurando que é só um funcionário.</p>}
    <details className="sm-history"><summary>Rodadas concluídas · {r.history.length}</summary>{r.history.map(round => <div key={round.round}><h5>Rodada {round.round}</h5>{frontKeys.map(key => <p key={key}><strong>{REVOLT_FRONTS[key].name}:</strong> {round.results[key].summary}</p>)}</div>)}</details>
  </div>;
}
