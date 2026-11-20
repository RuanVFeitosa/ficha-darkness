import React, { useState } from 'react';
import { EquipmentDialog } from '../mestre/DarknessEquipment';
import { adaptarParaDarkness } from '../../utils/adaptarParaDarkness';
import { salvarFichaEspiral } from '../../services/espiralApi';
import { ATTRIBUTES, RESOURCES, integrityMax } from '../../data/espiral';
import AdaptacaoRecursos from './AdaptacaoRecursos';
import '../../styles/AdaptacaoDarkness.css';

export default function AdaptacaoDarkness({ original, sistema, fichaId, onClose, onComplete }) {
  const [initial] = useState(() => adaptarParaDarkness(original, sistema, fichaId));
  const [draft, setDraft] = useState(initial);
  const maximum = sistema === 'absoluto' ? 4 : 5;
  const budget = Object.values(initial.attributes).reduce((sum, value) => sum + Number(value), 0);
  const spent = Object.values(draft.attributes).reduce((sum, value) => sum + Number(value), 0);
  const remaining = budget - spent;
  const resourcePlan = sistema === 'absoluto' ? initial.adaptationResources : null;
  const resourceSpent = RESOURCES.reduce((sum, name) => sum + Number(draft.resources[name] || 0), 0);
  const resourceRemaining = resourcePlan ? resourcePlan.budget - resourceSpent : 0;
  const changeStage = (key, delta) => setDraft(current => {
    const next = current.attributes[key] + delta;
    const available = budget - Object.values(current.attributes).reduce((sum, value) => sum + Number(value), 0);
    if (next < 1 || next > maximum || (delta > 0 && available < delta)) return current;
    return { ...current, attributes: { ...current.attributes, [key]: next } };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [destination] = useState(() => `darkness-${crypto.randomUUID()}`);
  const save = async event => {
    event.preventDefault();
    if (busy || remaining !== 0 || resourceRemaining !== 0) return;
    setBusy(true); setError('');
    try {
      const { espiralId, fichaId: oldId, ...data } = draft;
      if (Object.values(data.attributes).some(value => !Number.isInteger(value) || value < 1 || value > maximum) || spent !== budget) throw new Error('Redistribua os pontos sem ultrapassar o total inicial.');
      if (resourcePlan && (resourceSpent !== resourcePlan.budget || RESOURCES.some(name => !Number.isInteger(data.resources[name]) || data.resources[name] < 0 || data.resources[name] > 3))) throw new Error('Redistribua os Recursos respeitando o total e o limite de Grau III.');
      data.integrity = Math.min(Number(data.integrity) || 0, integrityMax(data.attributes.pulso, data.integrityTable));
      if (sistema === 'absoluto') {
        if (Object.values(data.attributes).some(value => !Number.isInteger(value) || value < 1 || value > 4)) throw new Error('Na adaptação do Absoluto, use estágios de 1 a 4.');
        data.integrity = integrityMax(data.attributes.pulso, data.integrityTable);
      }
      const saved = await salvarFichaEspiral(destination, data);
      if (!saved) throw new Error('Não foi possível salvar a nova ficha. Tente novamente.');
      // A cópia local é um cache; a gravação remota já foi confirmada acima.
      try { localStorage.setItem(`espiral:sheet:v1:${destination}`, JSON.stringify(data)); } catch { /* Abre pela cópia salva no servidor. */ }
      onComplete(destination);
    } catch (failure) { setError(failure.message || 'Não foi possível adaptar a ficha.'); setBusy(false); }
  };
  return <EquipmentDialog title="Adaptar ficha para Darkness" onClose={onClose} busy={busy}>
    <form className="de-form adk-form" onSubmit={save}>
      <div className="adk-intro"><span className="de-kicker">REVISE SUA NOVA IDENTIDADE</span><p>Uma nova ficha Darkness será criada. A ficha {sistema === 'absoluto' ? 'Absoluto' : 'Espiral'} e seus dados originais serão preservados.</p></div>
      <label>Nome do personagem<input required value={draft.name} disabled={busy} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label>
      <section className="adk-budget" aria-label="Pontos de atributos"><div><span>REDISTRIBUIÇÃO DE ATRIBUTOS</span><strong>{remaining === 0 ? 'Todos os pontos distribuídos' : 'Escolha onde investir os pontos'}</strong><p>Reduza um estágio para liberar 1 ponto. Use esse ponto em outro atributo.</p></div><div className="adk-balance" aria-live="polite"><b>{remaining}</b><span>pontos livres</span></div></section>
      <div className="adk-attributes">{Object.entries(ATTRIBUTES).map(([key, attribute]) => {
        const stage = draft.attributes[key];
        return <section className="adk-attribute" key={key} aria-label={attribute.name}>
          <header><div><h3>{attribute.name}</h3><span>{attribute.hint}</span></div><span className={'adk-die adk-die-' + stage} aria-label={'Dado de ' + attribute.name + ': d' + (stage * 2 + 2)}>d{stage * 2 + 2}</span></header>
          <div className="adk-stage"><strong>Estágio {stage}</strong><span>{attribute.stages[stage - 1]}</span></div>
          <div className="adk-track" aria-label={'Escala de ' + attribute.name}>{attribute.stages.map((label, index) => <span key={label} className={(index + 1 === stage ? 'current ' : '') + (index + 1 > maximum ? 'locked' : '')} title={'Estágio ' + (index + 1) + ': ' + label + (index + 1 > maximum ? ' — reservado à evolução' : '')}>d{index * 2 + 4}</span>)}</div>
          <footer><button type="button" aria-label={'Diminuir ' + attribute.name} disabled={busy || stage <= 1} onClick={() => changeStage(key, -1)}>−</button><small>{stage === initial.attributes[key] ? 'Valor da conversão' : 'Original: estágio ' + initial.attributes[key]}</small><button type="button" aria-label={'Aumentar ' + attribute.name} disabled={busy || remaining <= 0 || stage >= maximum} onClick={() => changeStage(key, 1)}>+</button></footer>
        </section>;
      })}</div>
      <div className="adk-summary"><span>{spent} / {budget} pontos distribuídos</span><button type="button" disabled={busy || Object.keys(ATTRIBUTES).every(key => draft.attributes[key] === initial.attributes[key])} onClick={() => setDraft(current => ({ ...current, attributes: { ...initial.attributes } }))}>Restaurar conversão</button></div>
      <details className="adk-reference"><summary>Como os atributos foram convertidos</summary><p>{sistema === 'absoluto' ? 'Absoluto 0 → estágio 1 (d4); 1–2 → estágio 2 (d6); 3–4 → estágio 3 (d8); 5 → estágio 4 (d10). Pulso usa o maior valor entre Força e Fortitude. O d12 fica reservado à evolução.' : 'Os estágios do Espiral são preservados como ponto de partida. A redistribuição mantém o mesmo total de estágios.'}</p></details>
      {resourcePlan && <AdaptacaoRecursos initial={initial.resources} resources={draft.resources} plan={resourcePlan} busy={busy} onChange={resources => setDraft(current => ({ ...current, resources }))}/>}
      <p className="de-help">Identidade, inventário e histórico são transportados quando há correspondência. Revise armas e habilidades antigas com o mestre.</p>
      {remaining > 0 && <p className="adk-pending" role="status">Distribua os {remaining} pontos livres para concluir a adaptação.</p>}
      {error && <p role="alert" className="de-error">{error}</p>}
      <footer className="de-dialog-actions"><button type="button" onClick={onClose} disabled={busy}>Cancelar</button><button type="submit" className="de-primary" disabled={busy || remaining !== 0 || resourceRemaining !== 0}>{busy ? 'Adaptando…' : 'Criar e abrir ficha Darkness'}</button></footer>
    </form>
  </EquipmentDialog>;
}
