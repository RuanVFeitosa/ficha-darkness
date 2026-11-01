import React, { useId, useState } from 'react';
import '../../styles/HopeWhispers.css';

export default function HopeWhispersEditor({ messages = [], onSave }) {
  const inputId = useId();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const lines = draft.split('\n').map(line => line.trim()).filter(Boolean);
  const longest = Math.max(0, ...lines.map(line => line.length));
  const invalid = lines.length > 7 || longest > 120;
  const save = async () => {
    if (invalid) return;
    setSaving(true);
    setStatus('');
    try {
      await onSave(lines);
      setStatus('Mensagens salvas para este personagem.');
    } catch {
      setStatus('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };
  return <details className="abs-whispers-editor" onToggle={event => {
    if (event.currentTarget.open) {
      setDraft(Array.isArray(messages) ? messages.join('\n') : '');
      setStatus('');
    }
  }}>
    <summary>
      <span className="abs-whispers-heading"><small>CONTROLE DO MESTRE</small><strong>Mensagens de Esperança</strong></span>
      <span className="abs-whispers-trigger" aria-hidden="true">⌄</span>
    </summary>
    <div className="abs-whispers-content">
      <p className="abs-whispers-description">Sussurros que aparecem ao redor do retrato quando a Esperança chega a zero. Personalize o que assombra este personagem.</p>
      <div className="abs-whispers-field-heading">
        <label htmlFor={inputId}>Mensagens deste personagem</label>
        <span className={invalid ? 'abs-whispers-limit is-invalid' : 'abs-whispers-limit'}>{lines.length} / 7 mensagens</span>
      </div>
      <textarea id={inputId} value={draft} maxLength={2000} rows={7} disabled={saving} aria-invalid={invalid} aria-describedby={`${inputId}-help`} onChange={event => { setDraft(event.target.value); setStatus(''); }} placeholder={'O silêncio não traz respostas.\nAté a luz parece distante.'}/>
      <div className="abs-whispers-help" id={`${inputId}-help`}>
        <span>Uma mensagem por linha · até 120 caracteres por mensagem.</span>
        <span className={longest > 120 ? 'is-invalid' : ''}>Maior mensagem: {longest} / 120</span>
      </div>
      {invalid && <p className="abs-whispers-error" role="alert">Revise as mensagens: use até 7 linhas, com no máximo 120 caracteres em cada uma.</p>}
      <div className="abs-whispers-footer">
        <span>Deixe o campo vazio para usar as frases padrão.</span>
        <button type="button" disabled={saving || invalid} onClick={save}>{saving ? 'Salvando…' : 'Salvar mensagens'}</button>
      </div>
      {status && <span role="status">{status}</span>}
    </div>
  </details>;
}
