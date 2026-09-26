export const PASSIVOS_INCREMENTO = 5;
export const PASSIVOS_MAXIMO = 15;

const revisaoPassivos = (personagem = {}) =>
  Math.max(0, Number(personagem.sincronizacaoCampos?.habilidadesPassivas) || 0);

// Converte fichas antigas (que aceitavam valores unitários) para os patamares
// atuais de +5, +10 e +15. A operação é idempotente e preserva valores já válidos.
export const normalizarPassivosParaNovaEscala = (personagem = {}) => {
  const passivos = personagem.habilidadesPassivas;
  if (!passivos || typeof passivos !== "object") return personagem;

  let mudou = false;
  const normalizados = Object.fromEntries(
    Object.entries(passivos).map(([chave, valor]) => {
      const numero = Math.max(0, Number.parseInt(valor, 10) || 0);
      const normalizado = numero === 0
        ? 0
        : Math.min(PASSIVOS_MAXIMO, Math.ceil(numero / PASSIVOS_INCREMENTO) * PASSIVOS_INCREMENTO);
      if (normalizado !== valor) mudou = true;
      return [chave, normalizado];
    }),
  );

  return mudou ? { ...personagem, habilidadesPassivas: normalizados } : personagem;
};

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
  const principalNormalizado = normalizarPassivosParaNovaEscala(principal);
  const alternativaNormalizada = normalizarPassivosParaNovaEscala(alternativa);

  if (!principalNormalizado) return alternativaNormalizada;
  if (!alternativaNormalizada) return principalNormalizado;
  if (revisaoPassivos(alternativaNormalizada) <= revisaoPassivos(principalNormalizado)) return principalNormalizado;

  return {
    ...principalNormalizado,
    habilidadesPassivas: alternativaNormalizada.habilidadesPassivas,
    sincronizacaoCampos: {
      ...(principalNormalizado.sincronizacaoCampos || {}),
      habilidadesPassivas: revisaoPassivos(alternativaNormalizada),
    },
  };
};
