import React, { useRef, useState } from 'react';
import { normalizeMechanics } from '../../utils/specialMechanics';
import { allowedRevoltActions, REVOLT_ACTIONS, REVOLT_FRONTS } from '../../utils/revoltMechanic';
import { frontPlayers, mechanicPlayerId } from '../../utils/mechanicParticipation';
import { groupActionTest, revoltGroupSheet } from '../../utils/revoltGroupSheets';
import { commitMechanicAction } from '../../services/mechanicActions';
import '../../styles/RevoltPlayerHUD.css';
import { ATRIBUTOS_ABSOLUTO, DOMINIOS } from '../../data/absolutoV1';
export const hasActiveRevolt = state => Boolean(state?.events?.some(event => event.id === state.activeId && event.revolt));

export default function RevoltPlayerHUD({ campaign, playerId, onState, onOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const state = normalizeMechanics(campaign?.mecanicasEspeciais);
  const event = state.events.find(item => item.id === state.activeId);
  if (!event?.revolt) return null;
  const revolt = event.revolt;
  const key = Object.keys(REVOLT_FRONTS).find(id => frontPlayers(revolt.fronts[id]).includes(mechanicPlayerId(playerId)));
  const front = revolt.fronts[key];
  const plan = revolt.plans[key], result = revolt.results[key];
  const sheet = front ? revoltGroupSheet(front, key) : null;
  const canAct = event.status === 'active' && !busy;
  const roll = async (type, extra = {}) => {
    if (pending.current || !key || !campaign?.id) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const next = await commitMechanicAction(campaign, state, { id: event.id, type, front: key, ...extra }, { playerId });
      onState(next); setSupporting(false);
    } catch (err) { setError(err.message || 'Não foi possível realizar o teste do grupo.'); }
    finally { pending.current = false; setBusy(false); }
  };
  const actionInfo = choice => {
    const info = groupActionTest(front, key, choice);
    const advance = choice === 'advance';
    const blocked = revolt.reaction?.type === 'blackout' && revolt.reaction.front === key;
    const dice = info.dice === 0 ? 0 : Math.max(1, Math.min(8, info.dice + (advance ? (front.breath >= 4 ? 1 : 0) + (front.bonus > 0 && !blocked ? 1 : 0) - (front.fortified.includes(front.position + 1) ? 1 : 0) : 0)));
    return `${info.label} · ${dice}d6 · DT ${front.difficulty || event.difficulty || 1}`;
  };
  const test = ['final', 'victory'].includes(revolt.phase) ? front?.finalTest?.test || result?.test : plan?.groupTest || result?.test;
  return <section className={`revolt-player-hud${collapsed ? ' is-collapsed' : ''}`} aria-label="Ações da sua frente" onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()}>
    <header><div><span>REVOLTA · RODADA {revolt.round}</span><strong>{key ? REVOLT_FRONTS[key].name : event.name}</strong></div><div><button type="button" onClick={onOpen}>Quadro</button><button type="button" aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? 'Mostrar ações' : 'Recolher'}</button></div></header>
    {!collapsed && <div className="rph-body">
      {!front ? <p>Aguarde o mestre designar sua ficha a uma frente.</p> : <>
        <div className="rph-status"><span>Posição <b>{front.position}/4</b></span><span>Fôlego <b>{front.breath}/6</b></span><span>DT <b>{front.difficulty || event.difficulty || 1}</b></span></div>
        <p className="rph-sheet">Ficha do grupo: <strong>{sheet.nome}</strong></p>
        <details className="rph-sheet-details"><summary>Ver ficha pronta do grupo</summary><div>{Object.entries(sheet.atributos).map(([id, value]) => <span key={id}>{ATRIBUTOS_ABSOLUTO[id]} <b>{value}</b></span>)}{Object.entries(sheet.dominios).map(([id, value]) => <span key={id}>{DOMINIOS[id].nome} <b>{value}</b></span>)}</div></details>
        {event.status === 'paused' ? <p>Operação pausada pelo mestre.</p> : event.status !== 'active' ? <p>{event.status === 'victory' ? 'A ditadura caiu. Operação concluída!' : 'Operação encerrada.'}</p> : revolt.phase === 'planning' && !plan ? <>
          <p>Escolha a ação da frente. O teste usa os dados do grupo.</p>
          <div className="rph-actions">{['advance', 'regroup', 'support', 'defend', 'retreat'].filter(choice => allowedRevoltActions(revolt, key).includes(choice)).map(choice => <button key={choice} type="button" disabled={!canAct || groupActionTest(front, key, choice).dice === 0} onClick={() => choice === 'support' ? setSupporting(value => !value) : roll('revoltGroupAction', { choice })}><strong>{REVOLT_ACTIONS[choice]}</strong><small>{actionInfo(choice)}</small><span>Escolher e rolar ↗</span></button>)}</div>
          <p>Avanço: organização e bônus de apoio acrescentam dados; fortificações retiram um dado. Apoios bem-sucedidos ficam reservados para um avanço ainda não rolado.</p>
          {supporting && <div className="rph-support"><strong>Qual frente receberá o apoio?</strong>{Object.keys(REVOLT_FRONTS).filter(id => id !== key).map(target => <button type="button" key={target} disabled={!canAct || (revolt.reaction?.type === 'blackout' && revolt.reaction.front === target) || Object.values(revolt.plans).some(plan => plan.type === 'support' && plan.target === target)} onClick={() => roll('revoltGroupAction', { choice: 'support', target })}>Apoiar {REVOLT_FRONTS[target].name} · rolar</button>)}</div>}
        </> : revolt.phase === 'planning' ? <p><strong>{REVOLT_ACTIONS[plan.type]} escolhido.</strong> {plan.groupTest ? 'Teste realizado. Aguarde o mestre fechar as três escolhas para aplicar os efeitos.' : 'Aguardando o fechamento das três escolhas.'}</p> : revolt.phase === 'resolving' && !result ? <button className="rph-roll" type="button" disabled={!canAct} onClick={() => roll('revoltResolve')}>Rolar ação pendente com a ficha do grupo</button> : revolt.phase === 'final' && !front.finalDone ? <button className="rph-roll" type="button" disabled={!canAct} onClick={() => roll('revoltFinalTest')}>Rolar objetivo final · {actionInfo('final')}</button> : <p>{result?.summary || 'Aguarde o mestre iniciar a próxima rodada.'}</p>}
        {test && <div className="rph-result" role="status"><strong>{test.titulo} · {test.exitos} êxito(s) / DT {test.dt}</strong><div aria-label="Dados da ficha do grupo">{test.dados.map((die, index) => <span key={index} className={test.dadosExitos[index] ? 'is-success' : ''}>{die}</span>)}</div><small>{test.sucesso ? 'Sucesso' : 'Falha'} · {test.groupName || sheet.nome}</small></div>}
      </>}
      {busy && <p role="status">Rolando e sincronizando…</p>}{error && <p className="rph-error" role="alert">{error}</p>}
    </div>}
  </section>;
}
