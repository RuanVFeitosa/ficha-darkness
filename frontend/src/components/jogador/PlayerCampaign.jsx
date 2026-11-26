import React, { useEffect, useState } from 'react';
import { fichaHref, fichaKey } from '../../services/jogadorApi';
import { buscarCampanhaPorCodigo, resolverCapaCampanha, vincularFicha } from '../../services/mesaApi';
import { campaignSystem, sheetSystem, systemLabel } from '../../utils/campaignSystem';
import '../../styles/PlayerCampaign.css';

export const campaignMemberId = sheet => {
  const system = sheetSystem(sheet);
  return system === 'absoluto' ? sheet.id : `${system}:${sheet.id}`;
};

export const playerTabletopHref = (code, system, member) =>
  `/?${new URLSearchParams({ campanha: code, sistema: system, papel: 'jogador', vinculo: member })}`;

export function CampaignCards({ campaigns, count, onJoin, busy, onOpen, selectedCode, children }) {
  return <section aria-label="Minhas campanhas" className="pj-campaigns pj-campaign-list">
    <header className="pj-campaign-list-header">
      <h2>Minhas campanhas <small>{count} / 6</small></h2>
      <form className="pj-campaign-code" onSubmit={onJoin}>
        <label>Código da campanha<input name="codigoCampanha" required maxLength={24} autoComplete="off" /></label>
        <button type="submit" disabled={busy}>Entrar na campanha</button>
      </form>
    </header>
    {!campaigns.length && <p>{busy ? 'Carregando campanhas…' : 'Você ainda não tem campanhas disponíveis.'}</p>}
    <div className="pj-campaign-grid">
      {campaigns.map(campaign => <article key={campaign.id} className="pj-campaign-card">
        {campaign.capa_url && <img src={campaign.capa_url} alt="" />}
        <div>
          <small>{systemLabel(campaignSystem(campaign))} · {campaign.membros?.length ?? 0} personagens</small>
          <h3>{campaign.nome}</h3>
          <button type="button" aria-expanded={selectedCode === campaign.codigo}
            onClick={() => onOpen(selectedCode === campaign.codigo ? null : campaign.codigo)}>Acessar campanha</button>
        </div>
      </article>)}
    </div>
    {children}
  </section>;
}

export default function PlayerCampaign({ code, invite, enrolled, sheets, playerCode, onOpen, onBack }) {
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    buscarCampanhaPorCodigo(code).then(result => result && resolverCapaCampanha(result)).then(result => {
      if (!active) return;
      if (result) setCampaign(result);
      else setError('Campanha não encontrada.');
    }).catch(() => { if (active) setError('Não foi possível carregar a campanha.'); });
    return () => { active = false; };
  }, [code]);

  const system = campaignSystem(campaign);
  const compatible = sheets.filter(sheet => sheetSystem(sheet) === system);
  const members = campaign?.membros ?? [];
  const ownSheets = new Map(compatible.map(sheet => [String(campaignMemberId(sheet)), sheet]));
  const linked = members.filter(member => ownSheets.has(String(member.ficha_id)));
  const canView = enrolled || linked.length > 0;

  async function accept(event) {
    event.preventDefault();
    if (busy) return;
    const selected = new FormData(event.currentTarget).get('ficha');
    const sheet = compatible.find(item => fichaKey(item) === selected);
    if (!sheet) return;
    setBusy(true);
    setError('');
    try {
      const member = await vincularFicha(campaign.id, campaignMemberId(sheet), { nome: sheet.nome });
      if (invite) onOpen(campaign.codigo);
      else setCampaign(previous => ({ ...previous, membros: [...(previous.membros ?? []), member] }));
    } catch (failure) {
      setError(failure.message || 'Não foi possível entrar na campanha.');
    } finally {
      setBusy(false);
    }
  }

  return <section className={`pj-campaigns pj-campaign-view${invite ? '' : ' pj-campaign-inline'}`} aria-label={invite ? 'Convite de campanha' : 'Campanha'}>
    {(invite || !campaign) && <button type="button" onClick={onBack}>{invite ? '← Minhas campanhas' : 'Fechar detalhes'}</button>}
    {error && <p role="alert">{error}</p>}
    {!campaign && !error && <p role="status">Abrindo campanha…</p>}
    {campaign && <div className="pj-campaign-hero">
      {campaign.capa_url && <img src={campaign.capa_url} alt="" />}
      <div>
      <header className="pj-campaign-detail-heading">
        <div><small>{systemLabel(system)}</small><h2>{campaign.nome}</h2></div>
        {!invite && <button type="button" onClick={onBack}>Fechar detalhes</button>}
      </header>
      {invite ? <>
        <p>Deseja entrar nesta campanha?</p>
        {linked.length ? <button type="button" onClick={() => onOpen(campaign.codigo)}>Acessar campanha</button>
          : compatible.length ? <form onSubmit={accept}>
            <label>Personagem<select name="ficha" required>{compatible.map(sheet => <option key={fichaKey(sheet)} value={fichaKey(sheet)}>{sheet.nome}</option>)}</select></label>
            <button disabled={busy}>{busy ? 'Entrando…' : 'Entrar na campanha'}</button>
          </form> : <p>Crie ou vincule uma ficha de {systemLabel(system)} no perfil para entrar.</p>}
      </> : canView ? <>
        {(campaign.descricao || campaign.sinopse) && <p>{campaign.descricao || campaign.sinopse}</p>}
        {!linked.length && (compatible.length ? <form onSubmit={accept}>
          <label>Personagem<select name="ficha" required>{compatible.map(sheet => <option key={fichaKey(sheet)} value={fichaKey(sheet)}>{sheet.nome}</option>)}</select></label>
          <button disabled={busy}>{busy ? 'Vinculando…' : 'Vincular ficha para jogar'}</button>
        </form> : <p>Para jogar no Tabletop, crie uma ficha de {systemLabel(system)} no perfil.</p>)}
      </> : <p>Use o código na aba Campanhas para entrar.</p>}
      </div>
    </div>}
    {campaign && !invite && canView && <>
      <h3>Personagens da campanha</h3>
      <div className="pj-campaign-grid">{members.map(member => {
        const sheet = ownSheets.get(String(member.ficha_id));
        const href = sheet && fichaHref({ ...sheet, jogadorOrigem: playerCode });
        const name = member.nome || sheet?.nome || 'Personagem';
        return <article key={member.id ?? member.ficha_id} className="pj-campaign-member">
          {sheet?.foto ? <img src={sheet.foto} alt="" />
            : <span className="pj-campaign-avatar" aria-hidden="true">{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>}
          <div><h4>{name}</h4>
          {sheet && <div className="pj-campaign-actions">
            <a href={system === 'ordem' ? `${href}&mesa=${encodeURIComponent(campaign.codigo)}` : href}>Acessar ficha</a>
            <a href={playerTabletopHref(campaign.codigo, system, String(member.ficha_id))}>Entrar no Tabletop</a>
          </div>}</div>
        </article>;
      })}</div>
    </>}
  </section>;
}
