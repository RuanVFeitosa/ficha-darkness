export const arvoreOcultista = {
  classe: "Ocultista",

  titulo: "A INVOCAÇÃO ABSOLUTA",

  beneficio:
    "O Ocultista manipula o paranormal através de Ritos Obscuros e Poderes Absolutos. No nível 1, recebe ritos iniciais iguais ao modificador de Inteligência, mínimo 1, e escolhe seu primeiro Poder Absoluto.",

  absolutas: [
    {
      id: "canalizar-o-absoluto",
      nome: "Canalizar o Absoluto",
      custo: "Passiva",
      descricao:
        "Você pode aprender e conjurar Ritos Obscuros. Aprender novos ritos exige teste de Sanidade DT 12 + círculo do ritual.",
    },
    {
      id: "poder-absoluto-inicial",
      nome: "Poder Absoluto Inicial",
      custo: "Nível 1",
      descricao:
        "Você desperta uma manifestação paranormal inata, escolhida entre os Poderes Absolutos disponíveis para seu nível.",
    },
    {
      id: "marcas-paranormais",
      nome: "Marcas Paranormais",
      custo: "Nível 3",
      descricao:
        "A partir do nível 3, seus Poderes Absolutos podem deixar marcas físicas: cicatrizes brilhantes, olhos alterados, símbolos na pele ou deformações sutis.",
    },
    {
      id: "atencao-do-absoluto",
      nome: "Atenção do Absoluto",
      custo: "Passiva",
      descricao:
        "Quanto mais ritos e poderes você aprende, mais visível se torna para DEUS. O Mestre pode usar isso para atrair presságios, entidades e consequências narrativas.",
    },
  ],

  bases: [
    {
      id: "progressao-ocultista",
      nome: "Progressão Ocultista",
      descricao:
        "Nível 1: ritos de 1º nível. Nível 3: ritos de 2º nível. Nível 6: ritos de 3º nível. Nível 9: ritos de 4º nível. Ritos de 5º nível só podem ser obtidos por eventos raros, pactos ou sacrifícios.",
    },
  ],

  aptidoes: [
    {
      id: "aprendiz-do-impossivel",
      nome: "Aprendiz do Impossível",
      custo: "Passiva",
      descricao:
        "Você recebe +1 em testes ligados a Ocultismo, Conhecimento Oculto ou identificação de ritos.",
    },
    {
      id: "rito-extra",
      nome: "Rito Extra",
      custo: "10 PE",
      descricao:
        "Você aprende 1 Rito Obscuro adicional de um nível ao qual tenha acesso.",
    },
    {
      id: "controle-da-sanidade",
      nome: "Controle da Sanidade",
      custo: "Passiva",
      descricao:
        "Uma vez por cena, ao falhar em um teste de Sanidade para aprender ou conjurar um rito, pode repetir o teste.",
    },
    {
      id: "selo-de-contencao",
      nome: "Selo de Contenção",
      custo: "2 PE",
      descricao:
        "Você impõe um selo temporário sobre uma manifestação paranormal, reduzindo seus efeitos por 1 rodada.",
    },
    {
      id: "voz-do-outro-lado",
      nome: "Voz do Outro Lado",
      custo: "1 PE",
      descricao:
        "Você pode fazer uma pergunta simples ao paranormal. A resposta vem em símbolos, ruídos, visões ou sensações incompletas.",
    },
    {
      id: "corpo-condutor",
      nome: "Corpo Condutor",
      custo: "Passiva",
      descricao:
        "Quando conjura um rito, pode aceitar uma marca física temporária para reduzir o custo em 1 PE.",
    },
    {
      id: "sangue-como-tinta",
      nome: "Sangue como Tinta",
      custo: "Especial",
      descricao:
        "Você pode usar o próprio sangue como componente ritualístico. Sofra 1d6 de Integridade para substituir um componente simples.",
    },
    {
      id: "eco-do-absoluto",
      nome: "Eco do Absoluto",
      custo: "3 PE",
      descricao:
        "Após conjurar um rito, você pode manter um eco dele por 1 rodada, permitindo repetir um efeito menor sem pagar o custo completo.",
    },
    {
      id: "olhar-proibido",
      nome: "Olhar Proibido",
      custo: "Passiva",
      descricao:
        "Você consegue perceber rastros paranormais recentes, como resíduos de ritos, presença de entidades ou alterações na realidade.",
    },
    {
      id: "preco-aceito",
      nome: "Preço Aceito",
      custo: "Passiva",
      descricao:
        "Quando perder Sanidade por efeito paranormal, recebe +1 no próximo teste relacionado ao Absoluto nesta cena.",
    },
  ],

  especialidades: [
    {
      id: "invocador",
      nome: "Invocador",
      descricao:
        "Focado em ritos de convocação, vínculo e controle de entidades.",

      habilidades: [
        {
          id: "dt-de-invocacao",
          nome: "DT de Invocação",
          custo: "Passiva",
          descricao:
            "Você recebe +2 na DT de ritos de invocação.",
        },
        {
          id: "vinculo-duradouro",
          nome: "Vínculo Duradouro",
          custo: "Passiva",
          descricao:
            "Criaturas invocadas por você duram +2 rodadas.",
        },
        {
          id: "voz-do-mestre",
          nome: "Voz do Mestre",
          custo: "2 PE",
          descricao:
            "Uma entidade invocada por você pode agir imediatamente após sua ordem.",
        },
        {
          id: "corrente-ritual",
          nome: "Corrente Ritual",
          custo: "3 PE",
          descricao:
            "Você impõe uma corrente simbólica sobre uma criatura invocada, impedindo que ela ataque aliados por 1 rodada.",
        },
      ],
    },

    {
      id: "flagelador",
      nome: "Flagelador",
      descricao:
        "Usa dor, sangue e perda de Sanidade para potencializar seus ritos.",

      habilidades: [
        {
          id: "sacrificio-como-custo",
          nome: "Sacrifício como Custo",
          custo: "Passiva",
          descricao:
            "Pode gastar PI ou Sanidade no lugar de PE para pagar rituais. Cada 1 PI ou Sanidade equivale a 2 PE.",
        },
        {
          id: "extase-da-dor",
          nome: "Êxtase da Dor",
          custo: "Passiva",
          descricao:
            "Quando estiver abaixo de 50% de Sanidade, seus ritos causam +1d6 de dano.",
        },
        {
          id: "carne-em-selo",
          nome: "Carne em Selo",
          custo: "2 PE",
          descricao:
            "Você grava um símbolo na própria pele. O próximo rito recebe +2 no teste, mas você sofre 1d6 de dano.",
        },
        {
          id: "dor-que-responde",
          nome: "Dor que Responde",
          custo: "Reação",
          descricao:
            "Quando sofrer dano, pode canalizar a dor para fortalecer o próximo rito conjurado nesta cena.",
        },
      ],
    },

    {
      id: "estudioso",
      nome: "Estudioso",
      descricao:
        "Especialista em ritos de informação, leitura do impossível e manipulação da realidade.",

      habilidades: [
        {
          id: "mente-oculta",
          nome: "Mente Oculta",
          custo: "Passiva",
          descricao:
            "Você recebe +1 em todos os testes de Ocultismo.",
        },
        {
          id: "memoria-eidetica",
          nome: "Memória Eidética",
          custo: "Passiva",
          descricao:
            "Pode preparar 1 ritual extra por dia.",
        },
        {
          id: "leitura-do-impossivel",
          nome: "Leitura do Impossível",
          custo: "2 PE",
          descricao:
            "Você interpreta símbolos, rastros ou manifestações paranormais como se fossem linguagem escrita.",
        },
        {
          id: "teorema-proibido",
          nome: "Teorema Proibido",
          custo: "3 PE",
          descricao:
            "Ao estudar um rito por 10 minutos, descobre uma fraqueza, custo oculto ou forma alternativa de executá-lo.",
        },
      ],
    },
  ],
};