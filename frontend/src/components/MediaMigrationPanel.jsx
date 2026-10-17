import React, { useState } from "react";
import { r2Configurado } from "../services/mediaStorage";
import { migrarImagensExistentes, verificarConfiguracaoMidia } from "../services/mediaMigration";
export default function MediaMigrationPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(null);
  const check = async () => {
    try { await verificarConfiguracaoMidia(); setMessage("R2 configurado e conta autenticada. O envio será validado durante a importação."); }
    catch (error) { setMessage(error.message); }
  };
  const migrate = async () => {
    setBusy(true); setReport(null);
    try {
      const result = await migrarImagensExistentes(setMessage);
      setReport(result); setMessage(result.updated + " registros atualizados. " + result.images + " referências de imagem transferidas. Recarregue a página para usar as novas URLs.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <section className="tt3-media-migration" aria-label="Arquivos no R2">
    <h3>Arquivos no R2</h3>
    <p>{r2Configurado ? "R2 configurado neste frontend." : "R2 inativo neste frontend."}</p>
    <button type="button" onClick={check} disabled={busy}>Verificar configuração</button>
    <p>Migra imagens do Supabase acessíveis à sua conta e fichas/tokens deste navegador. Baixa um backup antes de atualizar as referências e preserva os arquivos originais. Evite editar fichas e campanhas durante a migração.</p>
    <button type="button" onClick={migrate} disabled={busy}>{busy ? "Migrando…" : "Migrar imagens existentes"}</button>
    <p role="status">{message}</p>
    {report?.errors.length > 0 && <details><summary>{report.errors.length} pendências</summary>{report.errors.map((error,index) => <p key={index}>{error}</p>)}</details>}
  </section>;
}
