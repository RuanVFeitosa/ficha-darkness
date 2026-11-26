import React, { useEffect, useState } from 'react';
import { ATTRIBUTES, integrityMax } from '../../data/espiral';
import { ATRIBUTOS_ABSOLUTO, REGIOES } from '../../data/absolutoV1';
import { listarFichasEspiralLocais } from '../../services/fichasCampanha';
import { buscarFichaEspiral } from '../../services/espiralApi';
import { buscarPersonagem } from '../../services/personagemApi';
import { attributes, readOrdemSheets, resources } from '../../services/ordemSheet';
import { readLocalCampaign } from '../../services/localCampaignStorage';

async function loadSheet(id, system, localSheets) {
  if (system === 'ordem' || id.startsWith('ordem:')) {
    const sheet = readOrdemSheets().find(item => String(item.id) === id.replace(/^ordem:/, ''));
    if (!sheet) return null;
    const portrait = await readLocalCampaign(`ordem:retrato:${sheet.id}`).catch(() => null);
    return { ...sheet, portrait: portrait || sheet.portrait };
  }
  const remote = id.startsWith('espiral:') ? buscarFichaEspiral(id.slice(8)) : buscarPersonagem(id);
  return await remote.catch(() => null) || localSheets.get(id) || null;
}

function SheetSummary({ member, sheet }) {
  const name = sheet?.nome || sheet?.name || member.nome || 'Personagem';
  const portrait = sheet?.portrait || sheet?.profileImage || sheet?.fotoPerfil;
  const role = [sheet?.classe || sheet?.occupation, sheet?.trilha].filter(Boolean).join(' · ');
  const values = sheet?.resources && sheet?.nex != null
    ? Object.entries(resources).map(([id, label]) => [label, sheet.resources[id]])
    : [
      ['Integridade', sheet?.integrity != null ? { current: sheet.integrity, max: sheet.attributes?.pulso ? integrityMax(sheet.attributes.pulso) : undefined } : sheet?.integridade || sheet?.vida],
      ['Sanidade', sheet?.sanity ?? sheet?.sanidade],
      ['Esperança', sheet?.hope ?? sheet?.esperanca],
      ...Object.entries(sheet?.membros || {}).map(([id, value]) => [REGIOES[id]?.nome || id, value]),
    ];

  return <article className="campaign-player-card">
    <header>
      {portrait ? <img src={portrait} alt="" loading="lazy" /> : <span aria-hidden="true">{name.slice(0, 1)}</span>}
      <div><h4>{name}</h4>{role && <p>{role}</p>}{(sheet?.jogador || sheet?.player) && <p>Jogador · {sheet.jogador || sheet.player}</p>}</div>
    </header>
    {sheet ? <>
      <dl>
        {sheet.nex != null && <div><dt>NEX</dt><dd>{sheet.nex}%</dd></div>}
        {Object.entries(sheet.attributes || sheet.atributos || {}).map(([id, value]) => (
          <div key={id}><dt>{attributes[id] || ATRIBUTOS_ABSOLUTO[id] || ATTRIBUTES[id]?.name || id}</dt><dd>{value?.atual ?? value?.valor ?? (typeof value === 'number' || typeof value === 'string' ? value : '—')}</dd></div>
        ))}
      </dl>
      <dl>
        {values.filter(([, value]) => value != null).map(([label, value]) => {
          const current = value.current ?? value.atual ?? value.valor ?? (typeof value === 'number' ? value : '—');
          return <div key={label}><dt>{label}</dt><dd>{current}{value.max != null && ` / ${value.max}`}</dd></div>;
        })}
      </dl>
    </> : <p>Ficha indisponível para consulta neste navegador.</p>}
  </article>;
}

export default function CampaignPlayerSummaries({ members = [], system, onManage }) {
  const [sheets, setSheets] = useState(null);
  const [revision, setRevision] = useState(0);
  const memberIds = JSON.stringify([...new Set(members.map(member => member.ficha_id).filter(Boolean).map(String))]);

  useEffect(() => {
    let active = true;
    setSheets(null);
    const localSheets = new Map(listarFichasEspiralLocais().map(item => [item.fichaId, item.personagem]));
    Promise.all(JSON.parse(memberIds).map(async id => [id, await loadSheet(id, system, localSheets).catch(() => null)]))
      .then(entries => { if (active) setSheets(new Map(entries)); });
    return () => { active = false; };
  }, [memberIds, system, revision]);

  return <section className="campaign-player-summaries" aria-label="Resumo das fichas dos jogadores">
    <div className="campaign-player-actions">
      <button type="button" className="campaign-primary" onClick={onManage}>Gerenciar fichas</button>
      {members.length > 0 && <button type="button" className="campaign-primary" disabled={!sheets} onClick={() => setRevision(value => value + 1)}>Atualizar resumos</button>}
    </div>
    {!members.length ? <p>Nenhuma ficha vinculada à campanha.</p> : !sheets ? <p role="status">Carregando fichas…</p> :
      <div className="campaign-player-grid">{members.map(member => <SheetSummary key={member.id || member.ficha_id} member={member} sheet={sheets.get(String(member.ficha_id))} />)}</div>}
  </section>;
}
