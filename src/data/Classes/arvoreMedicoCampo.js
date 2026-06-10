export const arvoreMedicoCampo = {
  id: "medico-de-campo",
  classe: "Médico de Campo",
  titulo: "A MEDICINA ABSOLUTA",
  beneficio:
    "Médico de Campo possui acesso a técnicas médicas extremas, suporte tático e procedimentos avançados em combate.",

  absolutas: [
    {
      id: "intervencao-de-estabilizacao-rapida",
      nome: "Intervenção de Estabilização Rápida",
      custo: "4 PE",
      tipo: "Reação",
      descricao:
        "Você age no exato momento em que a vida escapa, virando o jogo contra a morte. Quando um ser à sua vista (alcance curto) é reduzido a Morte ou sofre um golpe que o faria cair morrendo, você pode usar sua reação para estabilizá-lo instantaneamente. O alvo para de sangrar e recupera 1d4 + seu modificador de Inteligência em Vida. Esta habilidade pode salvar alguém de um dano massivo fatal.",
    },

    {
      id: "comando-medico",
      nome: "Comando Médico",
      custo: "2 PE",
      tipo: "Ação Padrão",
      descricao:
        "Você avalia o campo de batalha como um verdadeiro médico general. Enquanto mantiver a concentração, gastando 1 PE no início de cada turno, você recebe benefícios estratégicos: identifica instantaneamente o inimigo mais ferido, aumenta curas realizadas em +1d4 de Integridade e pode conceder Redução de Dano 2 para um aliado próximo uma vez por rodada.",
    },

    {
      id: "cirurgia-de-campo-absoluta",
      nome: "Cirurgia de Campo",
      custo: "4 PE",
      tipo: "Ação Completa",
      descricao:
        "Você realiza uma intervenção cirúrgica crítica em um aliado incapacitado. Remove automaticamente uma condição física debilitante, como Sangramento, Envenenamento, Atordoamento ou fraturas, além de recuperar 2d8 + seu modificador de Inteligência em Integridade no membro afetado. Fora de combate, também remove doenças comuns automaticamente.",
    },

    {
      id: "soro-de-adrenalina-e-recuperacao",
      nome: "Soro de Adrenalina e Recuperação",
      custo: "3 PE",
      tipo: "Ação Padrão",
      descricao:
        "Você prepara um coquetel médico especial. Escolha um efeito ao aplicar: Adrenalina — o alvo ignora fadiga, atordoamento e penalidades leves por 1d4+1 rodadas, recebendo +2 em testes físicos; ao final, fica Fatigado por 1 rodada. Recuperação — o alvo recupera 1d6 de Integridade no membro tratado no início de cada turno por 3 rodadas, encerrando caso sofra dano cortante ou perfurante.",
    },
  ],

  aptidoes: [
    {
      id: "foco-cardiaco",
      nome: "Foco Cardíaco",
      custo: "10 PE",
      descricao:
        "Seus procedimentos médicos reduzem o risco de morte imediata.",
    },
    {
      id: "maos-firmes",
      nome: "Mãos Firmes",
      custo: "10 PE",
      descricao: "Você ignora penalidades em procedimentos sob pressão.",
    },
    {
      id: "conhecimento-anatomico",
      nome: "Conhecimento Anatômico",
      custo: "10 PE",
      descricao: "Você recebe bônus em testes envolvendo anatomia humana.",
    },
    {
      id: "resistencia-biologica",
      nome: "Resistência Biológica",
      custo: "10 PE",
      descricao: "Você possui resistência aumentada contra doenças e toxinas.",
    },
  ],

  especialidades: [
    {
      id: "medico-de-combate",
      nome: "Médico de Combate",
      passiva: "Você pode estabilizar aliados em combate sem penalidades.",

      habilidades: [
        {
          id: "pronto-socorro",
          nome: "Pronto-Socorro",
          nivel: 1,
          descricao: "Você estabiliza rapidamente um aliado caído.",
        },
        {
          id: "taticas-de-campo",
          nome: "Táticas de Campo",
          nivel: 2,
          descricao: "Aliados próximos recebem bônus defensivos após cura.",
        },
        {
          id: "tratamento-rapido",
          nome: "Tratamento Rápido",
          nivel: 3,
          descricao:
            "Você reduz drasticamente o tempo necessário para tratar ferimentos.",
        },
        {
          id: "cirurgia-de-campo",
          nome: "Cirurgia de Campo",
          nivel: 4,
          descricao:
            "Você pode realizar procedimentos críticos em ambientes hostis.",
        },
        {
          id: "estimulantes-de-combate",
          nome: "Estimulantes de Combate",
          nivel: 5,
          descricao:
            "Você injeta estimulantes que aumentam momentaneamente o desempenho físico.",
        },
        {
          id: "resistencia-a-agentes-quimicos",
          nome: "Resistência a Agentes Químicos",
          nivel: 6,
          descricao:
            "Aliados tratados por você recebem resistência temporária a toxinas.",
        },
        {
          id: "recuperacao-rapida",
          nome: "Recuperação Rápida",
          nivel: 7,
          descricao: "Ferimentos tratados cicatrizam com velocidade anormal.",
        },
        {
          id: "curativo-avancado",
          nome: "Curativo Avançado",
          nivel: 8,
          descricao: "Você reduz sangramentos críticos instantaneamente.",
        },
        {
          id: "oposicao-a-toxinas",
          nome: "Oposição a Toxinas",
          nivel: 9,
          descricao:
            "Você neutraliza parcialmente venenos e compostos químicos.",
        },
        {
          id: "ressuscitacao-rapida",
          nome: "Ressuscitação Rápida",
          nivel: 10,
          descricao:
            "Você pode trazer um aliado recém-caído de volta à consciência.",
        },
      ],
    },

    {
      id: "medico-de-resgate-urbano",
      nome: "Médico de Resgate Urbano",
      passiva:
        "Você possui treinamento para operar em áreas colapsadas e situações críticas.",

      habilidades: [
        {
          id: "resgate-em-areas-de-risco",
          nome: "Resgate em Áreas de Risco",
          nivel: 1,
          descricao: "Você ignora penalidades em ambientes perigosos.",
        },
        {
          id: "tecnico-em-trauma",
          nome: "Técnico em Trauma",
          nivel: 2,
          descricao: "Você reduz danos permanentes em aliados feridos.",
        },
        {
          id: "operacoes-de-resgate",
          nome: "Operações de Resgate",
          nivel: 3,
          descricao: "Você move aliados feridos sem penalidades.",
        },
        {
          id: "negociacao-em-crises",
          nome: "Negociação em Crises",
          nivel: 4,
          descricao:
            "Você mantém vítimas e civis calmos em situações extremas.",
        },
        {
          id: "treinamento-em-escavacao",
          nome: "Treinamento em Escavação",
          nivel: 5,
          descricao:
            "Você localiza sobreviventes soterrados com mais facilidade.",
        },
        {
          id: "logistica-de-emergencia",
          nome: "Logística de Emergência",
          nivel: 6,
          descricao: "Você organiza evacuações e suprimentos rapidamente.",
        },
        {
          id: "cuidado-pos-operatorio",
          nome: "Cuidado Pós-Operatório",
          nivel: 7,
          descricao: "Aliados tratados por você recuperam mais rapidamente.",
        },
        {
          id: "primeiros-socorros-avancados",
          nome: "Primeiros Socorros Avançados",
          nivel: 8,
          descricao: "Você remove penalidades leves de aliados tratados.",
        },
        {
          id: "assistencia-psicossocial",
          nome: "Assistência Psicossocial",
          nivel: 9,
          descricao: "Você reduz efeitos mentais causados por trauma.",
        },
        {
          id: "intervencao-rapida-e-eficaz",
          nome: "Intervenção Rápida e Eficaz",
          nivel: 10,
          descricao:
            "Você consegue agir instantaneamente em situações críticas.",
        },
      ],
    },

    {
      id: "cirurgiao-de-trauma",
      nome: "Cirurgião de Trauma",
      passiva: "Você domina procedimentos invasivos e operações de alto risco.",

      habilidades: [
        {
          id: "intervencao-rapida",
          nome: "Intervenção Rápida",
          nivel: 1,
          descricao: "Você inicia procedimentos médicos imediatamente.",
        },
        {
          id: "diagnostico-instantaneo",
          nome: "Diagnóstico Instantâneo",
          nivel: 2,
          descricao: "Você identifica danos internos rapidamente.",
        },
        {
          id: "cirurgia-de-campo-trauma",
          nome: "Cirurgia de Campo",
          nivel: 3,
          descricao: "Você realiza cirurgias improvisadas em combate.",
        },
        {
          id: "transfusao-de-campo",
          nome: "Transfusão de Campo",
          nivel: 4,
          descricao: "Você recupera rapidamente aliados debilitados.",
        },
        {
          id: "tecnica-de-fechamento-rapido",
          nome: "Técnica de Fechamento Rápido",
          nivel: 5,
          descricao: "Você fecha ferimentos graves em poucos segundos.",
        },
        {
          id: "monitoramento-vital-continuo",
          nome: "Monitoramento Vital Contínuo",
          nivel: 6,
          descricao: "Você acompanha sinais vitais em tempo real.",
        },
        {
          id: "procedimento-de-ressuscitacao",
          nome: "Procedimento de Ressuscitação",
          nivel: 7,
          descricao: "Você reduz drasticamente o risco de morte.",
        },
        {
          id: "mestre-do-trauma",
          nome: "Mestre do Trauma",
          nivel: 8,
          descricao: "Você executa procedimentos quase impossíveis.",
        },
      ],
    },

    {
      id: "bioquimico",
      nome: "Bioquímico",
      passiva: "Você domina substâncias químicas e compostos experimentais.",

      habilidades: [
        {
          id: "sintese-de-campo",
          nome: "Síntese de Campo",
          nivel: 1,
          descricao: "Você cria compostos improvisados rapidamente.",
        },
        {
          id: "dosagem-precisa",
          nome: "Dosagem Precisa",
          nivel: 2,
          descricao: "Seus compostos possuem efeitos mais eficientes.",
        },
        {
          id: "cocktail-de-combate",
          nome: "Cocktail de Combate",
          nivel: 3,
          descricao: "Você cria estimulantes de combate temporários.",
        },
        {
          id: "nano-antidotos",
          nome: "Nano-Antídotos",
          nivel: 4,
          descricao: "Você neutraliza toxinas avançadas.",
        },
        {
          id: "modulador-metabolico",
          nome: "Modulador Metabólico",
          nivel: 5,
          descricao: "Você altera temporariamente o metabolismo humano.",
        },
        {
          id: "aerossol-medico",
          nome: "Aerossol Médico",
          nivel: 6,
          descricao: "Você aplica substâncias em área.",
        },
        {
          id: "mestre-farmacologo",
          nome: "Mestre Farmacólogo",
          nivel: 7,
          descricao: "Você domina compostos médicos extremos.",
        },
      ],
    },

    {
      id: "psiquiatra",
      nome: "Psiquiatra / Psicólogo",
      passiva: "Você entende profundamente a mente humana.",

      habilidades: [
        {
          id: "avaliacao-psicologica",
          nome: "Avaliação Psicológica",
          nivel: 1,
          descricao: "Você identifica estados mentais rapidamente.",
        },
        {
          id: "intervencao-em-crise",
          nome: "Intervenção em Crise",
          nivel: 2,
          descricao: "Você reduz surtos e colapsos mentais.",
        },
        {
          id: "terapia-de-campo",
          nome: "Terapia de Campo",
          nivel: 3,
          descricao: "Você auxilia aliados a recuperar estabilidade emocional.",
        },
        {
          id: "leitura-microexpressiva",
          nome: "Leitura Microexpressiva",
          nivel: 4,
          descricao: "Você identifica emoções ocultas.",
        },
        {
          id: "psicoprofilaxia",
          nome: "Psicoprofilaxia",
          nivel: 5,
          descricao: "Você reduz traumas mentais futuros.",
        },
        {
          id: "debriefing-pos-traumatico",
          nome: "Debriefing Pós-Traumático",
          nivel: 6,
          descricao: "Você remove penalidades mentais temporárias.",
        },
        {
          id: "manipulacao-terapeutica",
          nome: "Manipulação Terapêutica",
          nivel: 7,
          descricao: "Você influencia emocionalmente pessoas vulneráveis.",
        },
        {
          id: "reconstrucao-de-memoria",
          nome: "Reconstrução de Memória",
          nivel: 8,
          descricao: "Você auxilia na recuperação de memórias fragmentadas.",
        },
      ],
    },
    {
      id: "pesquisador-biomedico",
      nome: "Pesquisador Biomédico",
      passiva:
        "Você domina diagnóstico, análise laboratorial, imunização e desenvolvimento de tratamentos experimentais.",

      habilidades: [
        {
          id: "analise-de-doencas",
          nome: "Análise de Doenças",
          nivel: 1,
          descricao:
            "O pesquisador pode diagnosticar doenças rolando 2d6 + Medicina. O resultado determina a precisão do diagnóstico, identificando com eficácia doenças em pacientes ou criaturas.",
        },
        {
          id: "desenvolvimento-de-antidotos",
          nome: "Desenvolvimento de Antídotos",
          nivel: 2,
          descricao:
            "Ao criar antídotos, o pesquisador faz um teste de 2d6 + Modificador de Química para determinar a eficácia do antídoto. Um resultado mais alto garante maior sucesso na neutralização do veneno ou doença.",
        },
        {
          id: "melhorias-biologicas",
          nome: "Melhorias Biológicas",
          nivel: 3,
          descricao:
            "Para aplicar melhorias biológicas temporárias, o pesquisador faz um teste de 2d6 + Medicina. O resultado determina a duração e os benefícios das melhorias, proporcionando vantagens temporárias em atributos físicos ou mentais.",
        },
        {
          id: "genetica-avancada",
          nome: "Genética Avançada",
          nivel: 4,
          descricao:
            "Manipulação genética para criar tratamentos personalizados. O pesquisador faz um teste de 2d6 + Modificador de Medicina para determinar a eficácia do tratamento, podendo curar doenças ou melhorar habilidades de forma adaptativa.",
        },
        {
          id: "imunizacao-rapida",
          nome: "Imunização Rápida",
          nivel: 5,
          descricao:
            "Desenvolve técnicas para acelerar a imunização. Um teste de 2d6 + Modificador de Habilidade Alquímica determina a eficácia do processo. Resultados altos geram imunização mais eficaz e rápida contra agentes patogênicos.",
        },
        {
          id: "monitoramento-biomedico",
          nome: "Monitoramento Biomédico",
          nivel: 6,
          descricao:
            "Implementa sistemas de monitoramento biomédico avançados. Um teste de 2d6 + Modificador de Medicina detecta anormalidades e fornece informações vitais em tempo real, podendo prever problemas antes de se agravarem.",
        },
      ],
    },
  ],
};
