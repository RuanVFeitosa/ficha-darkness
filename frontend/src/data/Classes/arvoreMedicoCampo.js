const habilidade = (id, nome, nivel, custo, descricao) => ({
  id,
  nome,
  nivel,
  custo,
  descricao,
});

export const arvoreMedicoCampo = {
  id: "medico-de-campo",
  classe: "Médico de Campo",
  titulo: "A MEDICINA ABSOLUTA",
  beneficio:
    "Você começa com uma Maleta de Campo. Uma vez por cena, ao usar um item medicinal da maleta, pode sacar ou guardar a maleta sem gastar ação.",

  absolutas: [
    {
      id: "triagem-de-emergencia",
      nome: "Triagem de Emergência",
      custo: "1 PE — Ação de Movimento",
      descricao:
        "Escolha até dois aliados em alcance curto. Você identifica a condição mais grave de cada um e eles recebem +2 no próximo teste para resistir a Sangramento, Veneno ou doença até o fim da rodada.",
    },
    {
      id: "janela-de-estabilizacao",
      nome: "Janela de Estabilização",
      custo: "2 PE — Reação, 1× por cena",
      descricao:
        "Quando um aliado em alcance curto cair a 0 PI ou ficar Morrendo, ele fica Estável e pode escolher permanecer consciente até o início do próximo turno. A habilidade não recupera PI e não evita dano que o ultrapasse em 20 ou mais.",
    },
    {
      id: "protocolo-de-campo",
      nome: "Protocolo de Campo",
      custo: "2 PE — Ação Padrão",
      descricao:
        "Com a Maleta de Campo em mãos, trate um aliado adjacente. Ele recupera 1d6 + seu modificador de Conhecimento Médico em PI. Cada aliado só pode receber esta cura uma vez por cena.",
    },
    {
      id: "ordem-de-sobrevivencia",
      nome: "Ordem de Sobrevivência",
      custo: "3 PE — Ação Padrão, concentração",
      descricao:
        "Escolha um aliado em alcance médio. Até o início do seu próximo turno, a primeira vez que ele sofrer dano reduz esse dano em 1d6 + seu nível. Se reduzir o dano a 0, ele também pode se mover 1,5 m sem provocar ataques de oportunidade.",
    },
  ],

  aptidoes: [
    {
      id: "maos-firmes",
      nome: "Mãos Firmes",
      custo: "Passiva",
      descricao:
        "Você ignora a penalidade por tratar alguém em combate ou sob pressão. Uma falha em Conhecimento Médico para estabilizar um aliado se torna sucesso parcial: ele continua Morrendo, mas não perde PI adicional até o próximo turno.",
    },
    {
      id: "anatomia-aplicada",
      nome: "Anatomia Aplicada",
      custo: "Passiva",
      descricao:
        "Você recebe +2 em testes de Conhecimento Médico para diagnosticar ferimentos, venenos, doenças e pontos vulneráveis. Após identificar uma lesão, a primeira cura que fizer nela recupera +2 PI.",
    },
    {
      id: "estoque-organizado",
      nome: "Estoque Organizado",
      custo: "Passiva",
      descricao:
        "No início de cada missão, escolha dois itens medicinais comuns. O primeiro uso de cada um não consome recurso. Não pode escolher explosivos, modificações ou itens vendidos como armas.",
    },
    {
      id: "analgesia-controlada",
      nome: "Analgesia Controlada",
      custo: "1 PE — Reação",
      descricao:
        "Quando um aliado em alcance curto falhar em um teste causado por dor, Sangramento ou exaustão, ele pode rerrolar um dado. Deve usar o novo resultado. Cada aliado só pode receber este benefício uma vez por cena.",
    },
    {
      id: "barreira-sanitaria",
      nome: "Barreira Sanitária",
      custo: "1 PE — Ação de Movimento",
      descricao:
        "Até o início do seu próximo turno, você e aliados adjacentes recebem +2 em testes contra Veneno, doença e efeitos de contaminação. O bônus não se acumula com outra Barreira Sanitária.",
    },
    {
      id: "recuperacao-supervisionada",
      nome: "Recuperação Supervisionada",
      custo: "Passiva",
      descricao:
        "Durante um descanso de pelo menos 10 minutos, até três aliados tratados por você recuperam +1d6 PI adicional uma vez. Um personagem só pode receber este benefício uma vez por descanso.",
    },
    {
      id: "dosagem-segura",
      nome: "Dosagem Segura",
      custo: "Passiva",
      descricao:
        "Quando usar uma habilidade sua que cure dados de PI, você pode rerrolar um dado de cura que tenha resultado 1. Pode fazer isso uma vez por rodada.",
    },
    {
      id: "segunda-opiniao",
      nome: "Segunda Opinião",
      custo: "2 PE — Reação, 1× por cena",
      descricao:
        "Depois que um aliado em alcance médio falhar em um teste de resistência contra condição física ou mental, ele rerrola o teste com +2. O novo resultado substitui o anterior.",
    },
  ],

  especialidades: [
    {
      id: "medico-de-combate",
      nome: "Médico de Combate",
      passiva:
        "Sempre que você curar um aliado em combate, ele recebe +1 de Defesa até o início do próximo turno.",
      habilidades: [
        habilidade("socorro-sob-fogo", "Socorro Sob Fogo", 1, "1 PE — Ação de Movimento", "Saque um item medicinal e mova-se até metade do deslocamento. O próximo uso desse item neste turno não provoca ataques de oportunidade."),
        habilidade("curativo-de-pressao", "Curativo de Pressão", 2, "1 PE — Ação Padrão", "Um aliado adjacente encerra Sangramento e recupera 1d4 PI. Se já não estiver Sangrando, recebe apenas a cura. Cada alvo: 1× por cena."),
        habilidade("cobertura-clinica", "Cobertura Clínica", 3, "2 PE — Reação", "Quando um aliado que você curou nesta cena for atingido em alcance curto, reduza o dano em 1d6. Após isso, ele pode se deslocar 1,5 m."),
        habilidade("injeção-de-avanço", "Injeção de Avanço", 4, "2 PE — Ação Padrão", "Um aliado adjacente recebe +2 no próximo ataque ou teste físico até o fim do próximo turno. Ao término, não pode receber outra Injeção de Avanço até o fim da cena."),
        habilidade("linha-de-extração", "Linha de Extração", 5, "3 PE — Ação Completa", "Mova um aliado adjacente até metade do deslocamento dele. Esse movimento não provoca ataques de oportunidade e o aliado recebe RD 2 até o próximo turno."),
        habilidade("protocolo-dourado", "Protocolo Dourado", 6, "4 PE — Ação Padrão, 1× por cena", "Um aliado adjacente recupera 2d6 + modificador de Conhecimento Médico em PI e encerra Sangramento ou Atordoamento. O alvo fica Vulnerável até o início do próximo turno."),
      ],
    },
    {
      id: "medico-de-resgate-urbano",
      nome: "Médico de Resgate Urbano",
      passiva:
        "Você e aliados que esteja guiando ignoram terreno difícil causado por escombros, fumaça ou multidão durante o primeiro deslocamento de cada rodada.",
      habilidades: [
        habilidade("rota-de-fuga", "Rota de Fuga", 1, "Passiva", "Após examinar uma área por 1 minuto, você identifica a saída segura mais próxima, cobertura leve e um risco estrutural evidente."),
        habilidade("arrasto-seguro", "Arrasto Seguro", 2, "1 PE — Ação de Movimento", "Você move um aliado adjacente incapacitado até 3 m. Esse deslocamento não provoca ataques de oportunidade e não agrava seus ferimentos."),
        habilidade("sinalizacao-de-perigo", "Sinalização de Perigo", 3, "1 PE — Ação Padrão", "Marque uma área pequena em alcance curto. Até o fim da cena, aliados que a atravessem recebem +2 para evitar armadilhas, queda, incêndio ou desabamento."),
        habilidade("evacuacao-coordenada", "Evacuação Coordenada", 4, "2 PE — Ação Completa", "Até três aliados que possam ouvi-lo podem usar a reação para se mover até metade do deslocamento. Nenhum deles pode terminar mais perto de um inimigo."),
        habilidade("abrigo-improvisado", "Abrigo Improvisado", 5, "2 PE — 1 minuto", "Com materiais do cenário, cria cobertura leve para até dois aliados até o fim da cena ou até ser destruída. A cobertura concede +2 de Defesa contra ataques à distância."),
        habilidade("prioridade-de-resgate", "Prioridade de Resgate", 6, "3 PE — Reação, 1× por cena", "Quando uma área causar dano a aliados em alcance médio, escolha até dois deles: cada um reduz o dano em 1d8 e pode se mover 1,5 m após o efeito."),
      ],
    },
    {
      id: "cirurgiao-de-trauma",
      nome: "Cirurgião de Trauma",
      passiva:
        "Ao tratar um aliado com metade ou menos dos PI máximos, suas curas nele recuperam +2 PI.",
      habilidades: [
        habilidade("diagnostico-de-trauma", "Diagnóstico de Trauma", 1, "Passiva", "Com um teste de Conhecimento Médico, você identifica a condição física mais grave de um alvo adjacente e sabe se ela exige estabilização, antídoto ou repouso."),
        habilidade("fechamento-rapido", "Fechamento Rápido", 2, "1 PE — Ação Padrão", "Um aliado adjacente encerra Sangramento e reduz a próxima fonte de dano físico sofrida nesta rodada em 2."),
        habilidade("redução-de-choque", "Redução de Choque", 3, "2 PE — Reação", "Quando um aliado adjacente cair a 0 PI, ele fica Estável e não ganha uma condição adicional por ter caído. Não funciona contra dano massivo."),
        habilidade("transfusao-controlada", "Transfusão Controlada", 4, "2 PE — Ação Completa", "Um aliado adjacente recupera 1d8 + modificador de Conhecimento Médico em PI. Você sofre 1d4 PI que não podem ser reduzidos."),
        habilidade("procedimento-limpo", "Procedimento Limpo", 5, "3 PE — Ação Completa", "Remova Veneno, Sangramento ou uma penalidade de fratura de um aliado adjacente. Se o efeito permitir teste, ele também recebe +2 no próximo teste contra a mesma fonte."),
        habilidade("cirurgia-de-urgencia", "Cirurgia de Urgência", 6, "4 PE — 10 minutos, 1× por descanso", "Fora de combate, um aliado recupera 3d6 + modificador de Conhecimento Médico em PI e remove uma condição física tratável. O alvo fica Exausto até completar um descanso."),
      ],
    },
    {
      id: "bioquimico",
      nome: "Bioquímico",
      passiva:
        "No início de cada missão, escolha um composto: antídoto, analgésico ou estimulante. Você prepara uma dose gratuita desse composto.",
      habilidades: [
        habilidade("sintese-de-campo", "Síntese de Campo", 1, "1 PE — Ação Completa", "Transforme um recurso medicinal comum em uma dose improvisada de antídoto ou analgésico, utilizável até o fim da cena."),
        habilidade("dosagem-precisa", "Dosagem Precisa", 2, "Passiva", "A primeira criatura que usar sua dose preparada na cena recupera +1d4 PI ou recebe +2 no teste para resistir ao Veneno, conforme o efeito da dose."),
        habilidade("coquetel-de-combate", "Coquetel de Combate", 3, "2 PE — Ação Padrão", "Um aliado adjacente escolhe: +2 no próximo teste físico ou ignora Exausto até o fim do próximo turno. Depois, ele não pode receber outro Coquetel nesta cena."),
        habilidade("antidoto-amplo", "Antídoto Amplo", 4, "2 PE — Ação Padrão", "Um aliado adjacente encerra Veneno comum ou recebe +4 no próximo teste contra toxinas. Contra toxina sobrenatural, apenas concede o bônus."),
        habilidade("aerossol-medicinal", "Aerossol Medicinal", 5, "3 PE — Ação Padrão", "Até três aliados em alcance curto recebem +2 contra Veneno e doença até o fim da cena. Um aliado que já esteja Envenenado pode repetir seu teste de resistência."),
        habilidade("metabolismo-de-emergencia", "Metabolismo de Emergência", 6, "3 PE — Reação, 1× por cena", "Quando um aliado em alcance curto falhar num teste físico, ele rerrola com +2. Se obtiver sucesso, fica Fatigado após a ação."),
      ],
    },
    {
      id: "psiquiatra",
      nome: "Psiquiatra / Psicólogo",
      passiva:
        "Aliados que concluírem um descanso de 10 minutos sob seus cuidados recebem +2 no próximo teste contra medo, pânico ou Abalo.",
      habilidades: [
        habilidade("leitura-de-crise", "Leitura de Crise", 1, "Passiva", "Após conversar ou observar alguém por 1 minuto, você identifica se ele está Abalado, Amedrontado, sob coerção ou escondendo uma emoção intensa."),
        habilidade("ancora-emocional", "Âncora Emocional", 2, "1 PE — Reação", "Quando um aliado em alcance curto receber Abalado ou Amedrontado, ele adia a condição até o fim do próximo turno e recebe +2 para resistir a ela."),
        habilidade("intervencao-em-crise", "Intervenção em Crise", 3, "2 PE — Ação Padrão", "Um aliado que possa ouvi-lo remove Abalado ou reduz Pânico para Abalado. Cada alvo: 1× por cena."),
        habilidade("comando-sereno", "Comando Sereno", 4, "1 PE — Ação de Movimento", "Escolha um aliado em alcance médio. Até o próximo turno, ele recebe +2 no próximo teste de resistência mental e não pode ser flanqueado."),
        habilidade("debriefing-de-campo", "Debriefing de Campo", 5, "2 PE — 10 minutos", "Até três aliados removem uma penalidade mental temporária e recuperam 1 ponto de Esperança, uma vez por descanso."),
        habilidade("protocolo-de-lucidez", "Protocolo de Lucidez", 6, "3 PE — Reação, 1× por cena", "Quando um aliado em alcance médio falhar em um teste mental, ele pode transformar a falha em sucesso parcial. Ainda sofre um efeito narrativo ou reduzido definido pelo mestre."),
      ],
    },
    {
      id: "pesquisador-biomedico",
      nome: "Pesquisador Biomédico",
      passiva:
        "Após examinar uma criatura, amostra ou doença por 10 minutos, você recebe +2 em testes para identificar ou criar uma contramedida contra ela nesta missão.",
      habilidades: [
        habilidade("analise-de-amostra", "Análise de Amostra", 1, "Passiva", "Com material biológico e 10 minutos, identifique uma característica útil: vetor, resistência, fraqueza fisiológica ou risco de contaminação."),
        habilidade("marcador-biologico", "Marcador Biológico", 2, "1 PE — Ação Padrão", "Marque um alvo analisado em alcance curto. O próximo aliado a acertá-lo antes do seu próximo turno causa +1d4 de dano ou recebe +2 no teste de Cura contra ele."),
        habilidade("antidoto-direcionado", "Antídoto Direcionado", 3, "2 PE — Ação Completa", "Após analisar a fonte, prepare uma dose que concede +4 no próximo teste contra uma doença, Veneno ou contaminação específica."),
        habilidade("monitoramento-vital", "Monitoramento Vital", 4, "2 PE — Ação de Movimento", "Por uma cena, acompanhe um aliado em alcance médio. Você sabe quando ele ficar com metade ou menos dos PI e pode usar Triagem de Emergência nele sem gastar PE uma vez."),
        habilidade("protocolo-de-quarentena", "Protocolo de Quarentena", 5, "2 PE — Ação Padrão", "Crie uma zona de 3 m até o fim da cena. Aliados na zona recebem +2 contra contaminação; criaturas contaminadas que entrarem nela revelam sinais visíveis."),
        habilidade("tratamento-experimental", "Tratamento Experimental", 6, "4 PE — Ação Completa, 1× por missão", "Um aliado adjacente recupera 2d6 PI e pode repetir um teste contra doença, Veneno ou condição biológica. Em caso de falha, ele recupera apenas metade dos PI e fica Fatigado."),
      ],
    },
  ],
};
