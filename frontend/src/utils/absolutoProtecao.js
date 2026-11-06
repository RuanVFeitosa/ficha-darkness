const positivo = valor => Math.max(0, Math.trunc(Number(valor) || 0));

export function protecaoRegional(membro = {}, equipamentos = []) {
  const equipamento = equipamentos.reduce((soma, item) => soma + positivo(item.defesaBonus), 0);
  // Fichas antigas armazenavam equipamento e adicionais juntos em defesa.
  const adicionais = membro.defesaAdicional == null
    ? Math.max(0, positivo(membro.defesa) - equipamento)
    : positivo(membro.defesaAdicional);
  return { equipamento, adicionais, total: equipamento + adicionais };
}
