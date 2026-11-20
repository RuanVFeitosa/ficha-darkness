import React, { useEffect, useState } from 'react';
import { EquipmentDialog } from '../mestre/DarknessEquipment';
import { enviarImagemCena, salvarCapaCampanha } from '../../services/mesaApi';

export default function CampaignCoverEditor({ campaign, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(campaign.capa_url || '');
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const choose = event => {
    const value = event.target.files?.[0];
    event.target.value = '';
    if (!value) return;
    if (!['image/jpeg','image/png','image/webp','image/avif','image/gif'].includes(value.type)) { setError('Escolha uma imagem JPG, PNG, WebP, AVIF ou GIF.'); return; }
    if (value.size > 8 * 1024 * 1024) { setError('A capa deve ter até 8 MB.'); return; }
    setFile(value); setRemoved(false); setError('');
  };
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const url = removed ? '' : file ? await enviarImagemCena(campaign.id, file, 'cena') : campaign.capaPersistida || campaign.capa_url || '';
      const result = await salvarCapaCampanha(campaign.id, url);
      onSaved(result); onClose();
    } catch (failure) { setError(failure.message || 'Não foi possível salvar a capa.'); setBusy(false); }
  };
  return <EquipmentDialog title="Capa da campanha" onClose={onClose} busy={busy}><form className="de-form" onSubmit={save}><div><span className="de-kicker">{campaign.nome}</span><p className="de-help">Personalize o cartão com uma imagem da sua história. Prefira uma imagem horizontal, na proporção 16:9.</p></div><div className="campaign-cover-preview">{preview ? <img src={preview} alt="Prévia da capa"/> : <span>Escolha uma capa para esta campanha</span>}</div><label>Enviar imagem de capa<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" disabled={busy} onChange={choose}/></label><p className="de-help">Até 8 MB. A imagem será ajustada para preencher o banner.</p>{preview && <button type="button" disabled={busy} onClick={() => { setFile(null); setPreview(''); setRemoved(true); }}>Remover capa</button>}{error && <p role="alert" className="de-error">{error}</p>}<footer className="de-dialog-actions"><button type="button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="de-primary" disabled={busy || (!file && !removed)}>{busy ? 'Salvando capa…' : 'Salvar capa'}</button></footer></form></EquipmentDialog>;
}
