import React, { useState } from 'react';
import { attributes, normalizeOrdem, readOrdemSheets, writeOrdemSheets } from '../services/ordemSheet';
import { classes, createAgent, creationState, origins, paranormalPowers, skillNames } from '../services/ordemCreation';
import '../styles/CriarOrdem.css';

const steps = ['Atributos', 'Classe', 'Origem'];
const initialDraft = {
  nome: '', jogador: '', identity: '', concept: '', origem: '', classe: '', profession: '',
  attributes: { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 },
  originSkills: [], originDetail: '', power: '', element: '',
  combatSkills: ['', ''], freeSkills: [], expert: [], rituals: [],
};
const skillReset = { freeSkills: [], expert: [] };
const toggle = (items, value) => items.includes(value) ? items.filter(item => item !== value) : [...items, value];
const agentUrl = (id, jogadorOrigem) => `/?ordem=1&agente=${encodeURIComponent(id)}${jogadorOrigem ? `&jogadorOrigem=${encodeURIComponent(jogadorOrigem)}` : ''}`;

function Choices({ title, options, selected, limit, onChange }) {
  return <fieldset className="oc-choices">
    <legend>{title} · {selected.length}/{limit}</legend>
    <div>{options.map(({ value, label }) => (
      <label key={value}><input type="checkbox" checked={selected.includes(value)}
        disabled={selected.length >= limit && !selected.includes(value)}
        onChange={() => onChange(toggle(selected, value))} /><span>{label ?? value}</span></label>
    ))}</div>
  </fieldset>;
}

function Resources({ values }) {
  if (!values) return null;
  return <dl className="oc-resources">
    {Object.entries({ pv: 'Vida', san: 'Sanidade', pe: 'Esforço' }).map(([key, label]) => (
      <div key={key}><dt>{label}</dt><dd>{values[key]}</dd></div>
    ))}
  </dl>;
}

function Library({ title, options, selected, onSelect, children }) {
  const [query, setQuery] = useState('');
  const visible = options.filter(name => normalizeOrdem(name).includes(normalizeOrdem(query.trim())));
  return <div className="oc-library">
    <section className="oc-library-list" aria-label={title}>
      <label>Buscar {title.toLowerCase()}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="oc-library-options">
        {visible.map(name => <button key={name} type="button" aria-pressed={name === selected} onClick={() => onSelect(name)}>{name}</button>)}
        {!visible.length && <p>Nenhum resultado.</p>}
      </div>
    </section>
    <section className="oc-library-preview" aria-label="Detalhes da seleção">
      {selected ? children : <p>Selecione uma opção do Livro Base v1.3 para ver os detalhes.</p>}
    </section>
  </div>;
}

export default function CriarOrdem({ jogadorOrigem, onCreated = id => window.location.assign(agentUrl(id, jogadorOrigem)), backHref = '/?ordem=1' }) {
  const [draft, setDraft] = useState(initialDraft);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState('');
  const state = creationState(draft);
  const ready = [state.points === 0, Boolean(state.role)];
  const hints = ['Distribua todos os pontos.', 'Escolha a classe.'];
  const update = changes => setDraft(current => ({ ...current, ...changes }));
  const changeStep = index => { setMessage(''); setStep(index); };

  function changeAttribute(key, amount) {
    update({ attributes: { ...draft.attributes, [key]: draft.attributes[key] + amount }, ...skillReset });
  }

  function submit(event) {
    event.preventDefault();
    if (step < 2) {
      if (ready[step]) changeStep(step + 1);
      else setMessage(hints[step]);
      return;
    }
    if (created) return;
    if (!state.originReady) {
      setMessage('Conclua as escolhas da origem.');
      return;
    }
    try {
      const agent = createAgent(draft, { deferTraining: true });
      writeOrdemSheets([...readOrdemSheets(), jogadorOrigem ? { ...agent, jogadorOrigem } : agent]);
      setCreated(agent.id);
      onCreated(agent.id);
    } catch {
      setMessage('Não foi possível salvar a ficha neste navegador. Tente novamente.');
    }
  }

  return <main className="ordem-creator">
    <img className="oc-watermark" src="/ordem-simbolo-criacao.png" alt="" />
    <div className="oc-shell">
      <header className="oc-header">
        <a className="oc-back" href={backHref}>← Voltar</a>
        <p>Ordem Paranormal RPG · NEX 5% · Etapa {step + 1} de 3</p>
      </header>
      <nav className="oc-steps" aria-label="Etapas de criação">
        {steps.map((label, index) => <button key={label} type="button" aria-current={index === step ? 'step' : undefined}
          data-complete={index < step} disabled={index > step && !ready.slice(0, index).every(Boolean)} onClick={() => changeStep(index)}>{label}</button>)}
      </nav>
      <form className="oc-panel" onSubmit={submit}>
        {step === 0 && <div className="oc-attribute-stage">
          <div><h1>Atributos</h1>
            <p className="oc-help">Todos os atributos começam em 1. Distribua 4 pontos, até 3 por atributo. Você pode reduzir um a 0 para ganhar mais um ponto.</p>
            <p className="oc-budget" aria-live="polite">{state.points} pontos disponíveis</p>
            </div>
            <div className="oc-attributes" role="group" aria-label="Distribuição de atributos">
              <img src="/ordem-simbolo-criacao.png" alt="" />
              <span className="oc-sigil-title" aria-hidden="true">Atributos</span>
              {Object.entries(attributes).map(([key, name]) => {
                const value = draft.attributes[key];
                return <div key={key} className="oc-attribute" data-attribute={key}><strong>{key}</strong><div className="oc-attribute-controls">
                  <button type="button" aria-label={`Reduzir ${name}`} disabled={value === 0 || (value === 1 && Object.values(draft.attributes).includes(0))} onClick={() => changeAttribute(key, -1)}>−</button><output aria-label={name}>{value}</output>
                    <button type="button" aria-label={`Aumentar ${name}`} disabled={value === 3 || !state.points} onClick={() => changeAttribute(key, 1)}>+</button></div>
                </div>;
              })}
            </div>

        </div>}
        {step === 1 && <>
          <h1>Classe</h1>
          <Library key="classes" title="Classes" options={Object.keys(classes)} selected={draft.classe}
            onSelect={classe => { if (classe !== draft.classe) update({ classe, combatSkills: ['', ''], rituals: [], ...skillReset }); }}>
            {state.role && <>
              <h2>{draft.classe}</h2>
              <Resources values={state.resources} />
              <article className="oc-detail"><h3>Habilidades de classe</h3>
                {state.role.abilities.map(([name, detail]) => <p key={name}><strong>{name}</strong> · {detail}</p>)}
                <p><strong>Proficiências</strong> · {state.role.proficiencies}</p>
              </article>
            </>}
          </Library>
        </>}
        {step === 2 && <>
          <h1>Origem</h1>
          <Library key="origens" title="Origens" options={Object.keys(origins)} selected={draft.origem}
            onSelect={origem => { if (origem !== draft.origem) update({ origem, originSkills: [], originDetail: '', power: '', element: '', rituals: [], ...skillReset }); }}>
            {state.origin && <>
              <h2>{draft.origem}</h2>
              <article className="oc-detail"><h3>{state.origin[1]}</h3><p>{state.origin[2]}</p>
                {!!state.origin[0].length && <p><strong>Perícias treinadas</strong> · {state.origin[0].join(', ')}</p>}
              </article>
            {draft.origem === 'Amnésico' && <Choices title="Perícias escolhidas com o mestre" options={skillNames.map(value => ({ value }))} selected={draft.originSkills} limit={2}
              onChange={originSkills => update({ originSkills, ...skillReset })} />}
            {['Engenheiro', 'Operário'].includes(draft.origem) && <label>{draft.origem === 'Engenheiro' ? 'Item favorito' : 'Arma escolhida'}<input value={draft.originDetail} maxLength={100} onChange={event => update({ originDetail: event.target.value })} /></label>}
            {draft.origem === 'Cultista Arrependido' && <>
              <label>Poder paranormal<select value={draft.power} onChange={event => update({ power: event.target.value, element: '', rituals: [] })}>
                <option value="">Selecione um poder</option>{Object.keys(paranormalPowers).map(name => <option key={name}>{name}</option>)}
              </select></label>
              {draft.power && <p>{paranormalPowers[draft.power]}</p>}
              {draft.power === 'Resistir a um Elemento' && <label>Elemento<select value={draft.element} onChange={event => update({ element: event.target.value })}>
                <option value="">Selecione o elemento</option>{['Conhecimento', 'Energia', 'Morte', 'Sangue'].map(value => <option key={value}>{value}</option>)}
              </select></label>}
            </>}

            </>}
          </Library>
        </>}
          {message && <p className="oc-message" role="alert">{message}</p>}
          <footer className="oc-actions">
            {step > 0 && <button type="button" onClick={() => changeStep(step - 1)}>Etapa anterior</button>}
            {created ? <a href={agentUrl(created, jogadorOrigem)}>Abrir ficha</a> : <button className="oc-primary" type="submit">{step === 2 ? 'Criar ficha' : 'Continuar'}</button>}
          </footer>
      </form>
    </div>
  </main>;
}
