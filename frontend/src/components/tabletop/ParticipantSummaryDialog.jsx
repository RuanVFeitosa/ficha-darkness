import React,{useState} from 'react';
import ParticipantDossiers from './ParticipantDossiers';

export default function ParticipantSummaryDialog({entry,onClose,onSave}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const enemy=entry.inimigo;
 const sheet=entry.personagem || (enemy ? {...(enemy.dados || {}),...enemy,tipo:entry.tipo} : {nome:entry.nome,fotoPerfil:entry.foto});
 const save=enemy && onSave ? async (field,value,region)=>{
  if(busy) return;
  setBusy(true);setError('');
  const resource=region?sheet.membros?.[region]:sheet[field];
  const current=Math.max(0,Math.min(Number(resource?.max) || Infinity,Number(value)||0));
  const updated={...(resource || {}),atual:current};
  try {await onSave({...enemy,...(region?{membros:{...(sheet.membros || {}),[region]:updated}}:{[field]:updated})});}
  catch(e){setError(e.message || 'Não foi possível salvar o recurso.');}
  finally {setBusy(false);}
 } : undefined;
 const member=entry.membro || {ficha_id:entry.chave,nome:entry.nome};
 return <section className="participant-summary-inline" aria-label={`Resumo da ficha de ${entry.nome}`}>
  <div className="participant-summary-content"><button type="button" className="participant-summary-close" onClick={onClose} aria-label="Fechar resumo">×</button>
   <ParticipantDossiers members={[member]} characters={{[member.ficha_id]:sheet}} onResourceChange={save} saving={busy}/>
   {error && <p role="alert">{error}</p>}
  </div>
 </section>;
}
