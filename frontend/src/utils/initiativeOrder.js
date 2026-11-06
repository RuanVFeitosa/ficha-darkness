export function initiativeOrder(campaign,characters={}) {
 if(!campaign) return [];
 const inimigosPorId=new Map((campaign.inimigos || []).map(item=>[String(item.id),item]));
    const entradas = (campaign.membros || []).map((membro, indice) => {
      const personagem = characters[membro.ficha_id];
      return {
        chave: membro.ficha_id,
        tipo: "jogador",
        valor: campaign.iniciativas?.[membro.ficha_id],
        nome: personagem?.nome || membro.nome,
        subtitulo: personagem
          ? `Nivel ${personagem.nivel || 1} · ${personagem.classe || "Sem classe"}`
          : membro.papel,
        foto: personagem?.fotoPerfil,
        membro,
        personagem,
        ordemOriginal: indice,
      };
    });

    Object.entries(campaign.iniciativas || {}).forEach(([chave, valor]) => {
      if (chave.startsWith("npc:")) {
        const id = chave.slice(4);
        const npc = inimigosPorId.get(id);
        if (!npc) return;
        entradas.push({
          chave,
          tipo: "npc",
          valor,
          nome: npc.nome || "NPC",
          subtitulo: `Nivel ${npc.nivel || 1} · ${npc.classe || "NPC"}`,
          foto: npc.fotoPerfil,
          inimigo: npc,
          ordemOriginal: 10000,
        });
      } else if (chave.startsWith("inimigo:")) {
        const resto = chave.slice("inimigo:".length);
        const separador = resto.lastIndexOf(":");
        const id = separador >= 0 ? resto.slice(0, separador) : resto;
        const inimigo = inimigosPorId.get(id);
        if (!inimigo) return;
        entradas.push({
          chave,
          tipo: inimigo.bossIniciativa || inimigo.dados?.bossIniciativa || inimigo.tipo==='boss' ? "boss" : "inimigo",
          valor,
          nome: inimigo.nome || "Inimigo",
          subtitulo: `Nivel ${inimigo.nivel || 1} · ${inimigo.classe || "Inimigo"}`,
          foto: inimigo.fotoPerfil,
          inimigo,
          ordemOriginal: 20000,
        });
      }
    });

    return entradas.sort((a, b) => {
      const temA = a.valor != null;
      const temB = b.valor != null;
      if (temA && !temB) return -1;
      if (!temA && temB) return 1;
      if (temA && temB && Number(b.valor) !== Number(a.valor))
        return Number(b.valor) - Number(a.valor);
      return a.ordemOriginal - b.ordemOriginal;
    });

}
