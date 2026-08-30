const revisaoPassivos = (personagem = {}) =>
  Math.max(0, Number(personagem.sincronizacaoCampos?.habilidadesPassivas) || 0);

export const marcarPassivosAtualizados = (personagem) => ({
  ...personagem,
  sincronizacaoCampos: {
    ...(personagem.sincronizacaoCampos || {}),
    habilidadesPassivas: Date.now(),
  },
});

// Mantém o personagem principal, mas recupera passivos offline quando eles
// possuem uma revisão mais nova do que a cópia recebida do servidor.
export const mesclarPassivosPorRevisao = (principal, alternativa) => {
  if (!principal) return alternativa;
  if (!alternativa) return principal;
  if (revisaoPassivos(alternativa) <= revisaoPassivos(principal)) return principal;

  return {
    ...principal,
    habilidadesPassivas: alternativa.habilidadesPassivas,
    sincronizacaoCampos: {
      ...(principal.sincronizacaoCampos || {}),
      habilidadesPassivas: revisaoPassivos(alternativa),
    },
  };
};

