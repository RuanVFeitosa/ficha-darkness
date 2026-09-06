export const atualizarDestinoNaFicha = (marcas, anterior, atualizada) =>
  marcas.map((marca) => {
    if (marca.id !== atualizada.id) return marca;
    let habilidades = atualizada.habilidades || [];
    if (marca.aceita) {
      habilidades = (marca.habilidades || []).map((escolhida) => {
        const indice = (anterior.habilidades || []).findIndex((h) =>
          escolhida.id ? h.id === escolhida.id : h.nome === escolhida.nome,
        );
        return habilidades.find((h) => escolhida.id ? h.id === escolhida.id : h.nome === escolhida.nome)
          || habilidades[indice] || escolhida;
      });
    }
    return { ...marca, ...atualizada, aceita: marca.aceita, habilidades };
  });
