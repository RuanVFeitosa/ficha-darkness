const caminhos = {
  aniquilador: [
    ["carrasco", "Carrasco", "Passiva — uma vez por rodada, quando reduzir um inimigo a 0 de Integridade, recupere 2 PE e realize imediatamente um ataque corpo a corpo contra outro alvo ao seu alcance. O ataque extra não pode ativar Carrasco novamente."],
    ["baluarte", "Baluarte", "Passiva — enquanto estiver consciente, aliados a até 3 m recebem +2 de Defesa. Uma vez por rodada, use sua reação para receber metade do dano que atingiria um desses aliados; esse dano não pode ser reduzido novamente."],
    ["predador", "Predador", "Ação bônus, 1 vez por cena — marque um inimigo que possa ver. Até o fim da cena, você recebe +3 m de deslocamento ao avançar contra ele e +2 nos ataques contra o alvo quando ele estiver com metade ou menos da Integridade. A marca termina se você escolher outro alvo."],
  ],
  especialista: [
    ["analista", "Analista", "Ação bônus, 1 vez por cena — analise uma criatura, objeto ou área visível. O mestre revela uma resistência, vulnerabilidade, perigo oculto ou informação útil verdadeira; até o fim da cena, você e um aliado recebem +2 no primeiro teste que explorar essa informação."],
    ["operador", "Operador", "Passiva — escolha dois equipamentos no início da missão. Sacar, guardar ou ativar esses itens não consome ação uma vez por rodada. Uma vez por cena, um deles concede +2 em um teste ou +1 dado de dano ou cura ligado ao seu uso."],
    ["infiltrador", "Infiltrador", "Passiva — recebe +2 em Furtividade e testes para abrir, invadir ou sabotar sistemas. Após obter sucesso em um desses testes, pode mover-se até metade do deslocamento sem provocar reação nem perder a condição de oculto."],
  ],
  atiradorElite: [
    ["sentinela", "Sentinela", "Ação bônus — escolha uma área de 6 m que esteja no alcance da arma. Até o início do seu próximo turno, uma vez, use sua reação para atacar um inimigo que entrar, sair ou atacar dentro dessa área."],
    ["fantasma", "Fantasma", "Passiva — depois de realizar um ataque à distância, mova-se até metade do deslocamento como ação livre. Se terminar em cobertura, faça Furtividade com +2; inimigos atingidos pelo disparo não podem usar reação contra esse movimento."],
    ["executor", "Executor", "Ação completa, 1 vez por cena — mire e faça um único ataque à distância com +2 na jogada. Se acertar, adicione dois dados de dano da arma e ignore cobertura leve; se errar, a habilidade é consumida mesmo assim."],
  ],
  medicoDeCampo: [
    ["cirurgiao", "Cirurgião de Guerra", "Ação padrão, 2 PE — trate a si mesmo ou um aliado adjacente e restaure 2d6 + seu nível de Integridade. Cada alvo só pode receber esta cura uma vez por cena; usá-la não exige kit médico."],
    ["guardiao", "Guardião Vital", "Reação, 1 vez por cena — quando um aliado a até 6 m cairia a 0 de Integridade, ele permanece com 1. Você pode mover-se imediatamente até ele, sem provocar reações, desde que exista um caminho livre."],
    ["pesquisador", "Pesquisador do Abismo", "Ação padrão, 2 PE — toque uma criatura e suspenda uma condição física ou mental até o fim da cena. Ao término, ela retorna se sua causa não tiver sido removida. Cada alvo só pode receber este efeito uma vez por cena."],
  ],
  renegado: [
    ["insurgente", "Insurgente", "Reação, 1 vez por rodada — quando um inimigo a até 9 m usar uma habilidade ou der uma ordem, imponha -2 ao teste dele. Se a ação falhar, você ou um aliado a até 9 m pode mover-se 3 m imediatamente."],
    ["sobrevivente", "Sobrevivente", "Passiva — enquanto estiver com metade ou menos da Integridade, recebe +2 em Fortitude e Vontade. Na primeira vez em cada cena que chegar a essa condição, recupere 3 PE."],
    ["apostador", "Apostador", "Antes de um teste, 1 vez por cena — declare a aposta e role dois dados adicionais, ficando com o melhor resultado. Se ainda falhar, sofre 1d6 de dano não reduzível e perde 2 PE; se passar, recupera 2 PE."],
  ],
};

const opcoes = (lista) => lista.map(([id, nome, descricao]) => ({ id, nome, descricao }));
export const obterClasseProgressao = (personagem = {}) => {
  const bruto = String(personagem.classeId || personagem.classeDetalhes?.id || personagem.classe || "especialista").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (bruto.includes("aniquil")) return "aniquilador";
  if (bruto.includes("atirador")) return "atiradorElite";
  if (bruto.includes("medico")) return "medicoDeCampo";
  if (bruto.includes("reneg")) return "renegado";
  return "especialista";
};

const marcosPorClasse = {
  aniquilador: {
    6: [
      ["aniq-retaliacao", "Retaliação Brutal", "Reação, 1 vez por rodada — após sofrer dano corpo a corpo, ataque imediatamente o agressor com -2 na jogada. O contra-ataque não ativa outras reações."],
      ["aniq-interposicao", "Interposição", "Reação, 1 vez por cena — mova-se até 3 m e receba o ataque destinado a um aliado. Reduza o dano recebido em 1d6 + seu nível."],
      ["aniq-furia", "Fúria Reativa", "Reação, 1 vez por cena — ao cair à metade da Integridade, recupere 3 PE e receba +2 no próximo ataque até o fim do seu turno seguinte."],
    ],
    7: [
      ["aniq-golpe-pesado", "Golpe Demolidor", "Ação padrão, 3 PE — faça um ataque corpo a corpo. Ao acertar, adicione dois dados da arma e empurre o alvo 3 m; ao errar, fique Vulnerável até o próximo turno."],
      ["aniq-avanco", "Avanço Implacável", "Ação bônus, 2 PE — mova-se até seu deslocamento em direção a um inimigo, ignorando terreno difícil e reações. Seu próximo ataque corpo a corpo nesta rodada recebe +2."],
      ["aniq-carne-aco", "Carne e Aço", "Passiva — reduza em 2 todo dano físico recebido. Uma vez por cena, ao sofrer um crítico, reduza o dano total pela metade."],
    ],
    8: [
      ["aniq-arena", "Dono da Arena", "Ação padrão, 1 vez por cena — por 3 rodadas, inimigos a até 6 m sofrem -2 ao atacar qualquer alvo que não seja você."],
      ["aniq-massacre", "Ritmo de Massacre", "1 vez por cena — ao derrubar um inimigo, realize uma ação de movimento e um ataque adicional. Esse ataque não pode reativar o efeito."],
      ["aniq-muralha", "Muralha Viva", "Ação livre, 1 vez por cena — por 2 rodadas, aliados atrás ou adjacentes a você recebem cobertura e +2 de Defesa; seu deslocamento fica reduzido à metade."],
    ],
    9: [
      ["artefato-legado", "Artefato de Legado", "Escolha uma arma ou armadura permanente. Em suas mãos ela recebe +1 nos testes ligados ao uso e não é destruída por falhas comuns. Se perdida, retorna no início da próxima missão por uma explicação definida com o mestre."],
      ["aniq-cicatrizes", "Cicatrizes de Guerra", "Passiva — para cada quarto de Integridade perdido, receba +1 no dano corpo a corpo, até +3. O bônus desaparece quando sua Integridade volta acima da faixa correspondente."],
      ["aniq-juramento", "Último a Cair", "Reação, 1 vez por missão — quando chegaria a 0 de Integridade, permaneça com 1 e ganhe uma ação padrão imediata. Depois dessa ação, fique Exausto até descansar."],
    ],
    10: [
      ["aniq-colosso", "Colosso da Ruína", "Ação bônus, 1 vez por missão — por 3 rodadas, ganhe +3 de Defesa, dobre seu limite de carga e adicione dois dados aos danos corpo a corpo. Ao terminar, caia com 1 de Integridade."],
      ["aniq-golpe-final", "Golpe do Fim", "Ação completa, 1 vez por missão — faça um ataque corpo a corpo com +5. Ao acertar, cause dano máximo da arma mais 5d6; ao errar, sofra metade desse dano, sem redução."],
      ["aniq-fortaleza", "Fortaleza Absoluta", "Ação livre, 1 vez por missão — por 3 rodadas, você não pode ser movido nem reduzido abaixo de 1 de Integridade, e aliados a até 6 m recebem metade do dano."],
    ],
  },
  especialista: {
    6: [
      ["esp-improviso", "Improviso Calculado", "Reação, 1 vez por cena — após falhar em um teste técnico ou de investigação, refaça-o usando outro atributo justificável, com +2."],
      ["esp-coordenar", "Coordenar", "Reação, 1 vez por rodada — quando um aliado a até 9 m fizer um teste que você possa orientar, gaste 1 PE para conceder +2 antes da rolagem."],
      ["esp-plano-reserva", "Plano de Reserva", "Reação, 1 vez por cena — quando um item, ferramenta ou plano falhar, declare uma preparação plausível e transforme a falha em sucesso parcial."],
    ],
    7: [
      ["esp-ferramenta", "Ferramenta Certa", "Ação bônus, 2 PE — improvise um equipamento comum necessário à situação. Ele concede +2 em um teste e deixa de funcionar ao fim da cena."],
      ["esp-ponto-fraco", "Explorar Ponto Fraco", "Ação bônus, 2 PE — analise um alvo a até 12 m. Até seu próximo turno, o primeiro aliado que o atingir ignora 3 pontos de redução e recebe +2 no dano."],
      ["esp-multitarefa", "Multitarefa", "1 vez por cena — realize duas ações de movimento ou interação diferentes como uma única ação bônus."],
    ],
    8: [
      ["esp-comando", "Sala de Comando", "Ação padrão, 1 vez por cena — por 3 rodadas, aliados a até 9 m que possam ouvi-lo recebem +2 em testes coordenados e Iniciativa."],
      ["esp-dossie", "Dossiê Completo", "1 vez por cena — faça ao mestre três perguntas objetivas sobre uma criatura, local ou sistema investigado; duas respostas devem ser verdadeiras e úteis."],
      ["esp-contingencia", "Contingência", "Reação, 1 vez por cena — quando um aliado a até 9 m sofrer uma condição, suspenda-a até o fim do próximo turno dele."],
    ],
    9: [
      ["esp-rede", "Rede de Contatos", "1 vez por missão — obtenha informação, acesso ou equipamento comum por meio de um contato. O mestre define uma dívida ou condição proporcional."],
      ["esp-metodo", "Método Infalível", "Passiva — escolha Investigação, Tecnologia ou Intuição. Resultados menores que 5 no dado dessa perícia passam a contar como 5."],
      ["esp-protocolo", "Protocolo de Continuidade", "Passiva — quando ficar incapacitado, escolha um aliado. Ele recebe suas informações e +2 nos testes ligados ao objetivo principal até o fim da cena."],
    ],
    10: [
      ["esp-xadrez", "Xadrez Absoluto", "Ação completa, 1 vez por missão — escolha até três aliados. Cada um pode mover-se e realizar uma ação padrão imediatamente, na ordem que você definir."],
      ["esp-solucao", "Solução Impossível", "1 vez por missão — declare como neutraliza um obstáculo técnico, investigativo ou logístico da cena. A solução funciona, mas o mestre estabelece um custo permanente ou nova ameaça."],
      ["esp-previsao", "Previsão Total", "Ação bônus, 1 vez por missão — por 3 rodadas, você conhece a próxima ação declarada de cada inimigo e aliados a até 9 m recebem +3 de Defesa contra essas ações."],
    ],
  },
  atiradorElite: {
    6: [
      ["atir-cobertura", "Tiro de Cobertura", "Reação, 1 vez por rodada — quando um inimigo visível se mover, faça um ataque com -2. Se acertar, o movimento termina imediatamente."],
      ["atir-evasao", "Reposicionamento", "Reação, 1 vez por cena — ao ser alvo de um ataque, mova-se 3 m até uma cobertura. Se sair da linha de visão, o ataque sofre -2."],
      ["atir-vinganca", "Alvo Prioritário", "Reação, 1 vez por cena — quando um aliado for ferido, marque o agressor. Seu próximo disparo contra ele recebe +2 e um dado adicional de dano."],
    ],
    7: [
      ["atir-perfurante", "Munição Perfurante", "Ação bônus, 2 PE — o próximo disparo desta rodada ignora cobertura leve e 5 pontos de redução de dano."],
      ["atir-ricochete", "Ricochete Calculado", "Ação padrão, 3 PE — ataque um alvo atrás de cobertura total parcial usando uma superfície rígida visível; faça a jogada com -2 e ignore a cobertura."],
      ["atir-dois-alvos", "Dois Alvos, Um Fôlego", "Ação padrão, 3 PE — faça um disparo contra dois alvos diferentes dentro do alcance, aplicando -2 a ambas as jogadas."],
    ],
    8: [
      ["atir-corredor", "Corredor de Morte", "Ação padrão, 1 vez por cena — marque uma linha de 3 m de largura até o alcance da arma por 3 rodadas. Uma vez por rodada, ataque como reação quem cruzá-la."],
      ["atir-sem-saida", "Sem Saída", "Ação bônus, 1 vez por cena — marque um alvo por 3 rodadas. Ele não recebe bônus de cobertura contra você e sofre -3 m de deslocamento após ser atingido."],
      ["atir-ninho", "Ninho de Precisão", "Ação padrão, 1 vez por cena — escolha sua posição. Enquanto não sair dela, por até 3 rodadas, receba +2 em ataques à distância e Defesa."],
    ],
    9: [
      ["atir-assinatura", "Arma de Assinatura", "Escolha uma arma de fogo. Com ela, recarregar é ação livre uma vez por rodada e você recebe +1 nas jogadas de ataque. O vínculo pode ser trocado entre missões."],
      ["atir-olho", "Olho Impossível", "Passiva — você enxerga detalhes e alvos no dobro do alcance normal, não sofre penalidade por distância e recebe +2 para detectar camuflagem."],
      ["atir-paciencia", "Paciência do Caçador", "Passiva — para cada rodada consecutiva mirando no mesmo alvo sem atacá-lo, acumule +1 no ataque e um dado de dano, até o máximo de +3 e três dados."],
    ],
    10: [
      ["atir-bala-final", "A Bala que Encontra", "Ação completa, 1 vez por missão — ataque qualquer alvo que tenha visto na cena, ignorando distância e cobertura. O disparo recebe +5 e causa dano máximo mais 4d6."],
      ["atir-chuva", "Chuva de Precisão", "Ação completa, 1 vez por missão — ataque uma vez cada inimigo visível, até seis alvos, sem penalidade por múltiplos ataques."],
      ["atir-instante", "Um Instante Antes", "Reação, 1 vez por missão — interrompa a ação de um inimigo visível com um disparo. Se acertar, a ação é perdida e o alvo não pode usar reações até o próximo turno."],
    ],
  },
  medicoDeCampo: {
    6: [
      ["med-estabilizar", "Estabilização Reflexa", "Reação, 1 vez por rodada — quando um aliado adjacente sofrer dano, gaste 1 PE para reduzir esse dano em 1d6 + seu nível."],
      ["med-triagem", "Triagem Imediata", "Reação, 1 vez por cena — quando um aliado a até 6 m cair à metade da Integridade, mova-se até ele e restaure 1d6 de Integridade."],
      ["med-antidoto", "Contramedida", "Reação, 1 vez por cena — conceda +3 ao teste de um aliado a até 6 m contra veneno, doença ou condição mental, depois da rolagem."],
    ],
    7: [
      ["med-sutura", "Sutura de Combate", "Ação padrão, 3 PE — restaure 3d6 + seu nível de Integridade de um alvo adjacente; cada alvo só pode receber esta cura uma vez por cena."],
      ["med-estimulante", "Estimulante de Emergência", "Ação bônus, 2 PE — um aliado adjacente recebe +3 m de deslocamento e ignora penalidades de uma condição física até o fim do próximo turno."],
      ["med-diagnostico", "Diagnóstico Preciso", "Ação bônus — descubra a condição, doença ou ferimento mais grave de um alvo e receba +2 em todos os testes para tratá-lo nesta cena."],
    ],
    8: [
      ["med-hospital", "Hospital de Campanha", "Ação completa, 1 vez por cena — crie uma área de 6 m por 3 rodadas. Aliados que iniciarem o turno nela recuperam 1d6 de Integridade."],
      ["med-sem-baixas", "Ninguém Morre Aqui", "Reação, 1 vez por cena — aliados a até 9 m que estejam com 0 de Integridade ficam estáveis e não podem morrer até o início do seu próximo turno."],
      ["med-purificacao", "Pulso de Purificação", "Ação padrão, 1 vez por cena — aliados a até 6 m podem repetir imediatamente um teste contra uma condição física ou mental com +2."],
    ],
    9: [
      ["med-juramento", "Juramento de Preservação", "Passiva — suas curas em alvos com metade ou menos da Integridade restauram um dado adicional. Se abandonar voluntariamente um aliado caído, perca o bônus até reparar a falha."],
      ["med-imunidade", "Memória Imunológica", "Passiva — após tratar uma doença, veneno ou efeito anômalo, você e o paciente recebem +3 para resistir ao mesmo efeito pelo restante da missão."],
      ["med-cicatriz", "Cicatriz Compartilhada", "Reação, 1 vez por cena — divida igualmente entre você e um aliado a até 6 m o dano que ele receberia, antes das reduções individuais."],
    ],
    10: [
      ["med-retorno", "Retorno Impossível", "Ação completa, 1 vez por missão — um aliado morto nesta cena retorna com metade da Integridade. Você perde permanentemente 1d6 de Integridade máxima."],
      ["med-vida", "Domínio da Vida", "Ação completa, 1 vez por missão — aliados a até 12 m recuperam 5d6 de Integridade e encerram uma condição física ou mental à escolha."],
      ["med-evolucao", "Evolução Forçada", "Ação padrão, 1 vez por missão — por 3 rodadas, um aliado recebe +3 de Defesa, +3 m de deslocamento e um dado adicional de dano; depois fica Exausto."],
    ],
  },
  renegado: {
    6: [
      ["ren-trapaca", "Trapaça Instintiva", "Reação, 1 vez por cena — após falhar em um teste, transforme o resultado em sucesso parcial e sofra uma complicação definida pelo mestre."],
      ["ren-escapar", "Sempre uma Saída", "Reação, 1 vez por cena — ao ser agarrado, cercado ou imobilizado, mova-se até metade do deslocamento ignorando bloqueios e reações."],
      ["ren-revidar", "Revide Sujo", "Reação, 1 vez por rodada — quando um inimigo errar um ataque corpo a corpo contra você, imponha a ele -2 de Defesa até o fim do seu próximo turno."],
    ],
    7: [
      ["ren-golpe-baixo", "Golpe Baixo", "Ação padrão, 2 PE — ataque com -2. Se acertar, cause o dano normal e o alvo fica Vulnerável até o fim do próximo turno."],
      ["ren-sumir", "Sumir na Confusão", "Ação bônus, 2 PE — mova-se até metade do deslocamento e faça Furtividade, mesmo sendo observado, se houver cobertura ou distração próxima."],
      ["ren-tudo-nada", "Tudo ou Nada", "Antes de um teste, 1 vez por cena — receba +5. Se falhar, perca 3 PE e sofra 1d6 de dano não reduzível."],
    ],
    8: [
      ["ren-caos", "Campo de Caos", "Ação padrão, 1 vez por cena — por 3 rodadas, inimigos a até 6 m não podem receber bônus de aliados nem realizar ações preparadas."],
      ["ren-rebeliao", "Faísca da Rebelião", "Ação bônus, 1 vez por cena — até três aliados a até 9 m movem-se 3 m e recebem +2 no próximo teste contra uma autoridade ou inimigo superior."],
      ["ren-sem-regras", "Sem Regras", "Ação livre, 1 vez por cena — por uma rodada, você ignora terreno difícil, penalidades por cobertura e reações inimigas; ao fim, fique Vulnerável."],
    ],
    9: [
      ["ren-identidades", "Mil Rostos", "Passiva — assuma uma identidade de cobertura entre missões. Testes para descobrir a fraude sofrem -5 até você agir diretamente contra o papel assumido."],
      ["ren-inimigo", "Inimigo do Sistema", "Escolha uma organização. Contra seus membros, receba +2 em Investigação, Intuição e no primeiro ataque de cada cena."],
      ["ren-divida", "Dívida de Sangue", "1 vez por missão — invoque ajuda, informação ou fuga de um contato perigoso. O mestre registra uma dívida equivalente que será cobrada em missão futura."],
    ],
    10: [
      ["ren-impossivel", "O Impossível Acontece", "1 vez por missão — após qualquer rolagem na cena, substitua o dado principal por seu valor máximo. Depois, o mestre ganha uma complicação grave para usar ainda nesta missão."],
      ["ren-revolucao", "Revolução", "Ação completa, 1 vez por missão — até cinco aliados a até 12 m realizam imediatamente uma ação de movimento ou padrão. Você fica com 0 PE após o efeito."],
      ["ren-sobrevivi", "Eu Já Sobrevivi a Pior", "Reação, 1 vez por missão — negue completamente dano ou efeito que o incapacitaria e apareça em um ponto seguro a até 9 m com 1 de Integridade."],
    ],
  },
};

const informacoesMarco = {
  6: ["Ruptura de ação", "Reação"],
  7: ["Técnica de classe", "Evolução"],
  8: ["Domínio de cena", "Domínio"],
  9: ["Legado de classe", "Legado"],
  10: ["Arquétipo absoluto", "Absoluto"],
};

export const obterMarcosProgressao = (personagem = {}) => {
  const classe = obterClasseProgressao(personagem);
  const progressao = marcosPorClasse[classe] || marcosPorClasse.especialista;
  const marcos = {
    5: { titulo: "Especialização avançada", tipo: "Especialização", opcoes: opcoes(caminhos[classe] || caminhos.especialista) },
  };

  Object.entries(informacoesMarco).forEach(([nivel, [titulo, tipo]]) => {
    marcos[nivel] = { titulo, tipo, opcoes: opcoes(progressao[nivel]) };
  });

  return marcos;
};
