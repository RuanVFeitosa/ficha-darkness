import React, { useEffect, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { mdiChevronRight, mdiClose, mdiImageEditOutline, mdiShieldAlertOutline } from '@mdi/js';
import { ordemThreats } from '../../services/ordemThreats';
import threatArt from '../../data/ordemThreatArt.json';
import { normalizeOrdem } from '../../services/ordemSheet';
import { readLocalCampaign, removeLocalCampaign, writeLocalCampaign } from '../../services/localCampaignStorage';
import ElementSymbol from '../ordem/ElementSymbol';
import '../../styles/OrdemThreats.css';

const groups = [...new Set(ordemThreats.map(threat => threat.group))];
const elements = [...new Set(ordemThreats.map(threat => threat.element).filter(Boolean))];
const displayName = threat => threat.group === 'Criaturas' ? threat.name : threat.name.toLocaleLowerCase('pt-BR');
const originalArt = threat => threatArt[threat.id] ? `/ordem-ameacas/${threat.id}.webp` : null;
const elementKey = threat => normalizeOrdem(threat.element || 'mundano').toLowerCase();
const creatures = ordemThreats.filter(threat => threat.element);
const storageKey = id => `ordem:arte-ameaca:${id}`;
const allowedImages = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
const bloodTexture = { '--ot-blood-texture': 'url("/ordem-texturas/sangue.jpg")' };

async function readArtwork(file) {
  if (!allowedImages.includes(file.type)) throw new Error('Selecione uma imagem PNG, JPG, WebP ou AVIF.');
  if (file.size > 8 * 1024 * 1024) throw new Error('A imagem deve ter até 8 MB.');
  const reader = new FileReader();
  const url = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    throw new Error('Não foi possível abrir esta imagem.');
  }
  return url;
}

function ThreatCard({ threat, art, expanded, onOpen }) {
  return <button className="ot-card" type="button" data-element={elementKey(threat)} aria-expanded={expanded} aria-controls={expanded ? 'ordem-threat-detail' : undefined} onClick={onOpen}>
    <span className="ot-card-art" aria-hidden="true">
      {art ? <img src={art} alt="" loading="lazy" /> : <Icon path={mdiShieldAlertOutline} size={1.5} />}
      {threat.vd && <span className="ot-card-vd">VD {threat.vd}</span>}
    </span>
    <span className="ot-card-info"><strong>{displayName(threat)}</strong><Icon path={mdiChevronRight} size={0.78} aria-hidden="true" /></span>
    <small>{threat.element || threat.group}</small>
  </button>;
}

function AttributeRow({ entries }) {
  return <div className="ot-attributes">
    {entries.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}
  </div>;
}

function ActionList({ actions }) {
  return actions.map((action, index) => {
    const attack = action.name.startsWith('AGREDIR');
    return <div className="ot-action" key={action.name + index}>
      <h5>{action.type && <span>{action.type} {attack ? '◆' : '❖'} </span>}{action.name}</h5>
      {attack ? action.text.split('\n').map((line, lineIndex) => {
        const title = line.match(/^(.+?) ((?:Corpo a corpo|À distância|Distância)\b.*)$/i);
        return <p key={lineIndex}>{title ? <><b>{title[1]}</b> <em>{title[2]}</em></>
          : line.split(/\b(TESTE|DANO)\b/gi).map((part, partIndex) => partIndex % 2 ? <b key={partIndex}>{part}</b> : part)}</p>;
      }) : <p>{action.type ? action.text.replace(/\s+/g, ' ') : action.text}</p>}
    </div>;
  });
}

function StatRow({ label, text }) {
  const senses = label === 'SENTIDOS' && text.match(/^PERCEPÇÃO\nINICIATIVA\n([^\n]+)\n([^\n]+)(?:\n([\s\S]+))?$/);
  const defense = label === 'DEFESA' && text.match(/^(\d+|—) FORTITUDE\nREFLEXOS\nVONTADE\n([^\n]+)\n([^\n]+)\n([^\n]+)$/);
  const secondary = ['IMUNIDADES', 'RESISTÊNCIAS', 'VULNERABILIDADES'].includes(label);
  return <div className={`ot-stat${label === 'PRESENÇA PERTURBADORA' ? ' ot-stat-stacked' : ''}${secondary ? ' ot-stat-secondary' : ''}`}><dt>{label}</dt><dd>
    {senses ? <div className="ot-senses"><span><strong>Percepção</strong> {senses[1]}</span><span><strong>Iniciativa</strong> {senses[2]}</span>{senses[3] && <span className="ot-sense-note">{senses[3]}</span>}</div>
      : defense ? <div className="ot-defense"><b>{defense[1]}</b><div><strong>Fortitude</strong> {defense[2]}<br /><strong>Reflexos</strong> {defense[3]}<br /><strong>Vontade</strong> {defense[4]}</div></div>
      : text}
  </dd></div>;
}

function StatBlock({ threat }) {
  const attackActions = threat.abilities?.filter(action => action.name.startsWith('AGREDIR'));
  const otherActions = threat.abilities?.filter(action => !action.name.startsWith('AGREDIR'));
  const attributesIndex = threat.stats?.findIndex(([label]) => ['PERÍCIAS', 'DESLOCAMENTO'].includes(label)) ?? -1;
  const statsBeforeAttributes = attributesIndex < 0 ? threat.stats : threat.stats.slice(0, attributesIndex);
  const heading = <header className="ot-sheet-heading">
      <div className="ot-title-banner">
        <div className="ot-title-name">
          {threat.element && <span className="ot-title-symbol" aria-hidden="true"><ElementSymbol element={threat.element} /></span>}
          <div>
            <h3 id="ordem-threat-name">{displayName(threat)}</h3>
            {threat.element && <p>{threat.element}</p>}
          </div>
        </div>
        {threat.vd && <div className="ot-vd"><span>VD</span><strong>{threat.vd}</strong></div>}
      </div>
      <p className="ot-sheet-type">{[threat.type, threat.size].filter(Boolean).join(' · ')}</p>
    </header>;
  return <article className="ot-sheet" data-element={elementKey(threat)} style={threat.element === 'Sangue' ? bloodTexture : undefined} aria-labelledby="ordem-threat-name">
    {threat.text ? <>{heading}<section className="ot-hazard"><h4>Regras do perigo</h4><p>{threat.text}</p></section></> :
      <div className="ot-sheet-columns">
        <div>
          {heading}
          <dl aria-label="Estatísticas" className="ot-stats">
            {statsBeforeAttributes.map(([label, text], index) => <StatRow key={label + index} label={label} text={text} />)}
            {threat.attributes.length > 0 && <div className="ot-stat ot-stat-stacked"><dt>Atributos</dt><dd><dl><AttributeRow entries={threat.attributes} /></dl></dd></div>}
            {attributesIndex >= 0 && threat.stats.slice(attributesIndex).map(([label, text], index) => <StatRow key={label + index} label={label} text={text} />)}
          </dl>
          {attackActions.length > 0 && <section className="ot-actions ot-attacks" aria-label="Ataques"><h4>Ações</h4><ActionList actions={attackActions} /></section>}
        </div>
        <section className="ot-actions" aria-label="Ações e habilidades">
          {otherActions.length ? <ActionList actions={otherActions} /> : <p>Consulte os ataques e efeitos descritos na ficha.</p>}
        </section>
      </div>}
    <footer>Livro de regras v1.3 · pág. {threat.page}{threat.group === 'Criaturas' && !threat.vd && ' · VD ilegível na extração'}</footer>
  </article>;
}

export default function OrdemThreats({ onImagemFundo, podeEditarImagem = true }) {
  const [group, setGroup] = useState('Criaturas');
  const [element, setElement] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [customArt, setCustomArt] = useState({});
  const [loadingArt, setLoadingArt] = useState(true);
  const [savingArt, setSavingArt] = useState(false);
  const [artFeedback, setArtFeedback] = useState(null);
  const detail = useRef(null);
  const selectedCard = useRef(null);
  const fileInput = useRef(null);
  const search = normalizeOrdem(query.trim()).toLowerCase();
  const matches = ordemThreats.filter(threat => threat.group === group && (!element || threat.element === element) &&
    normalizeOrdem(threat.name).toLowerCase().includes(search));
  const active = matches.find(threat => threat.id === selected);
  const activeArt = active ? customArt[active.id] || originalArt(active) : null;

  useEffect(() => {
    if (!podeEditarImagem) return undefined;
    let mounted = true;
    Promise.all(creatures.map(async threat => {
      const art = await readLocalCampaign(storageKey(threat.id)).catch(() => null);
      return [threat.id, art];
    })).then(entries => {
      if (!mounted) return;
      setCustomArt(Object.fromEntries(entries.filter(([, art]) => typeof art === 'string' && art.startsWith('data:image/'))));
      setLoadingArt(false);
    });
    return () => { mounted = false; };
  }, [podeEditarImagem]);

  useEffect(() => {
    onImagemFundo?.(activeArt);
    return () => onImagemFundo?.(null);
  }, [activeArt, onImagemFundo]);

  async function updateArt(id, file) {
    if (savingArt) return;
    setSavingArt(true);
    setArtFeedback(null);
    try {
      const art = file ? await readArtwork(file) : null;
      if (art) await writeLocalCampaign(storageKey(id), art);
      else await removeLocalCampaign(storageKey(id));
      setCustomArt(current => ({ ...current, [id]: art }));
      setArtFeedback({ id, message: art ? 'Imagem atualizada neste navegador.' : 'Imagem original restaurada.' });
    } catch (error) {
      setArtFeedback({ id, message: error.message || 'Não foi possível salvar a imagem.', error: true });
    } finally {
      setSavingArt(false);
    }
  }

  function openThreat(id, event) {
    selectedCard.current = event.currentTarget;
    setSelected(id);
    requestAnimationFrame(() => {
      if (detail.current) detail.current.scrollTop = 0;
      detail.current?.focus({ preventScroll: true });
      detail.current?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  function closeThreat() {
    setSelected(null);
    selectedCard.current?.focus();
  }

  return <section className="master-order-panel ot-panel" aria-labelledby="ordem-threats-title">
    <h2 id="ordem-threats-title">Ameaças de Ordem Paranormal</h2>
    <div className="master-areas ot-groups" role="group" aria-label="Tipos de ameaça">
      {groups.map(name => <button key={name} type="button" aria-pressed={group === name} onClick={() => { setGroup(name); setElement(''); setQuery(''); setSelected(null); }}>{name}</button>)}
    </div>
    <div className={`ot-layout${active ? ' ot-layout-open' : ''}`}>
      <div className="ot-directory">
        <label>Buscar ameaça<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
        {group === 'Criaturas' && <label>Elemento<select value={element} onChange={event => setElement(event.target.value)}>
          <option value="">Todos</option>{elements.map(name => <option key={name}>{name}</option>)}
        </select></label>}
        {matches.length ? <ul aria-label="Fichas de ameaças">
          {matches.map(threat => <li key={threat.id}>
            <ThreatCard threat={threat} art={customArt[threat.id] || originalArt(threat)} expanded={active?.id === threat.id} onOpen={event => openThreat(threat.id, event)} />
          </li>)}
        </ul> : <p role="status">Nenhuma ameaça encontrada.</p>}
      </div>
      {active && <section id="ordem-threat-detail" className="ot-detail" aria-label="Detalhes da ameaça" ref={detail} tabIndex={-1} onKeyDown={event => { if (event.key === 'Escape') closeThreat(); }}>
        <div className="ot-detail-toolbar">
          {active.element && podeEditarImagem && <>
            <input ref={fileInput} type="file" hidden accept={allowedImages.join(',')} onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) updateArt(active.id, file);
            }} />
            <button type="button" disabled={loadingArt || savingArt} onClick={() => fileInput.current?.click()}><Icon path={mdiImageEditOutline} size={0.75} /> Trocar imagem</button>
            {customArt[active.id] && <button type="button" disabled={savingArt} onClick={() => updateArt(active.id)}>Restaurar original</button>}
          </>}
          <button type="button" className="ot-close" onClick={closeThreat}><Icon path={mdiClose} size={0.75} /> Fechar ficha</button>
        </div>
        {artFeedback?.id === active.id && <p className="ot-art-feedback" role={artFeedback.error ? 'alert' : 'status'}>{artFeedback.message}</p>}
        <StatBlock key={active.id} threat={active} />
      </section>}
    </div>
  </section>;
}
