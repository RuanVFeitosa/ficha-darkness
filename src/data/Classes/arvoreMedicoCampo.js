export const arvoreMedicoCampo = {
  id: "medico-de-campo",

  nome: "MÉDICO DE CAMPO",

  descricao:
    "Especialistas em manter aliados vivos mesmo nas piores condições possíveis. Médicos de Campo dominam estabilização, cirurgia improvisada e controle de danos em combate.",

  habilidadeAbsoluta: {
    nome: "A MEDICINA ABSOLUTA",

    descricao:
      "Médico de Campo possui a Maleta de Campo e acesso a técnicas médicas extremas de combate.",
  },

  habilidadesAbsolutas: [
    {
      nome: "Diagnóstico de Combate",
      custo: "3 PE",
      descricao:
        "Você identifica instantaneamente condições físicas, integridade e riscos letais de um alvo. Seu próximo teste médico contra esse alvo recebe vantagem.",
    },

    {
      nome: "Intervenção de Estabilização Rápida",
      custo: "4 PE • Reação",
      descricao:
        "Quando um aliado cair morrendo, você pode estabilizá-lo imediatamente e restaurar 1d4 + Inteligência em Vida.",
    },

    {
      nome: "Comando Médico",
      custo: "2 PE",
      descricao:
        "Enquanto concentrado, você identifica inimigos mais feridos, melhora curas e reduz dano sofrido por aliados próximos.",
    },

    {
      nome: "Cirurgia de Campo",
      custo: "4 PE",
      descricao:
        "Remove condições debilitantes e restaura Integridade em membros feridos através de procedimentos improvisados.",
    },

    {
      nome: "Soro de Adrenalina e Recuperação",
      custo: "3 PE",
      descricao:
        "Aplica compostos especiais que ignoram fadiga ou regeneram Integridade temporariamente.",
    },
  ],

  aptidoes: [
    {
      nome: "Kit de Sobrevivência Aprimorado",
      custo: "Passiva",
      descricao: "Sua Maleta de Campo concede bônus maiores em testes médicos.",
    },

    {
      nome: "Injeção de Analgesia",
      custo: "1 PE",
      descricao:
        "Remove penalidades de dor e concede vantagem contra sofrimento físico.",
    },

    {
      nome: "Diagnóstico Preventivo",
      custo: "Passiva",
      descricao: "Você percebe sinais de colapso físico antes que aconteçam.",
    },

    {
      nome: "Química de Campo",
      custo: "2 PE",
      descricao:
        "Produz antídotos, estimulantes ou compostos improvisados usando materiais básicos.",
    },

    {
      nome: "Sutura Rápida",
      custo: "1 PE • Reação",
      descricao:
        "Interrompe instantaneamente efeitos de sangramento em aliados.",
    },

    {
      nome: "Controle de Pânico",
      custo: "1 PE",
      descricao:
        "Aliados podem repetir testes contra medo, pânico ou confusão.",
    },

    {
      nome: "Membro de Reserva",
      custo: "Passiva",
      descricao:
        "Reduz penalidades permanentes relacionadas a membros perdidos ou ferimentos graves.",
    },

    {
      nome: "Inoculação de Emergência",
      custo: "3 PE",
      descricao:
        "Concede resistência contra doenças e venenos temporariamente.",
    },

    {
      nome: "Posto de Atendimento Móvel",
      custo: "Passiva",
      descricao: "Transforma locais improvisados em enfermarias eficientes.",
    },

    {
      nome: "Sinal Vital Oculto",
      custo: "1 PE",
      descricao: "Permite que aliados simulem morte ou coma perfeitamente.",
    },

    {
      nome: "Transfusão de Campo",
      custo: "4 PE",
      descricao:
        "Você sacrifica sua própria Integridade para restaurar Vida de um aliado.",
    },

    {
      nome: "Conhecimento Anatômico Aplicado",
      custo: "2 PE",
      descricao:
        "Ataques anatômicos podem atordoar ou paralisar temporariamente.",
    },

    {
      nome: "Descontaminação Rápida",
      custo: "2 PE",
      descricao:
        "Remove venenos, agentes químicos e contaminações superficiais.",
    },

    {
      nome: "Estimulante de Recuperação Mental",
      custo: "1 PE",
      descricao: "Recupera Esperança, Sanidade ou remove desorientação.",
    },

    {
      nome: "Olhar Clínico",
      custo: "Passiva",
      descricao:
        "Você detecta doenças, venenos e alterações mentais apenas observando alguém.",
    },

    {
      nome: "Protocolo de Trauma",
      custo: "10 PE • Reação",
      descricao: "Reduz drasticamente dano massivo sofrido por um aliado.",
    },

    {
      nome: "Símbolo de Esperança",
      custo: "Passiva",
      descricao:
        "Aliados próximos recebem bônus contra medo e recuperam mais Integridade.",
    },

    {
      nome: "Anestésico Local",
      custo: "1 PE",
      descricao:
        "Ignora penalidades de dor em um membro específico temporariamente.",
    },

    {
      nome: "Caderno de Campo Médico",
      custo: "Passiva",
      descricao:
        "Você registra ameaças biológicas e recebe vantagem ao lidar novamente com elas.",
    },

    {
      nome: "Último Recurso",
      custo: "5 PE",
      descricao:
        "Levanta instantaneamente um aliado à beira da morte, mas com consequências severas posteriores.",
    },
  ],
  especialidades: [
    {
      id: "medico-de-combate",
      nome: "Médico de Combate",
      descricao:
        "Especialista em manter aliados vivos no meio do combate, utilizando curas rápidas, estabilização e suporte tático.",

      habilidades: [
        {
          nome: "Pronto-Socorro",
          descricao:
            "Em combate, pode gastar um turno para cuidar de um aliado ferido, rolando 2d6 + Medicina. O resultado determina a cura restaurada.",
        },
        {
          nome: "Táticas de Campo",
          descricao:
            "Fornece instruções táticas ao grupo. Role 2d6 + Medicina para conceder bônus de Defesa até o fim do combate.",
        },
        {
          nome: "Tratamento Rápido",
          descricao:
            "Realiza tratamentos rápidos em combate, rolando 2d6 + Destreza para restaurar pontos de vida.",
        },
        {
          nome: "Cirurgia de Campo",
          descricao:
            "Realiza cirurgias em condições adversas com 2d6 + Medicina, acelerando a recuperação de aliados.",
        },
        {
          nome: "Estimulantes de Combate",
          descricao:
            "Cria substâncias que concedem bônus temporários de resistência e força. Role 2d6 + Habilidade Alquímica.",
        },
        {
          nome: "Resistência a Agentes Químicos",
          descricao:
            "Treinado para resistir e tratar exposição química. Role 2d6 + Resistência em ambientes contaminados.",
        },
        {
          nome: "Recuperação Rápida",
          descricao:
            "Uma vez por combate, restaura vida adicional a um aliado com 2d6 + Medicina.",
        },
        {
          nome: "Curativo Avançado",
          descricao:
            "Quando um aliado entra em estado crítico, pode estabilizá-lo com 2d6 + Medicina, impedindo sua morte.",
        },
        {
          nome: "Oposição a Toxinas",
          descricao:
            "Cria antídotos contra substâncias venenosas ou tóxicas encontradas em combate. Requer 2d6 + Resistência.",
        },
        {
          nome: "Ressuscitação Rápida",
          descricao:
            "Uma vez por missão, pode reviver um aliado caído, restaurando vida considerável com 2d6 + Medicina.",
        },
      ],
    },

    {
      id: "medico-de-resgate-urbano",
      nome: "Médico de Resgate Urbano",
      descricao:
        "Especialista em evacuação, triagem, resgate em áreas de risco e atendimento médico em grandes desastres.",

      habilidades: [
        {
          nome: "Resgate em Áreas de Risco",
          descricao:
            "Realiza testes de 2d6 + Destreza para resgatar e evacuar vítimas em ambientes urbanos perigosos.",
        },
        {
          nome: "Técnico em Trauma",
          descricao:
            "Realiza 2d6 + Medicina para curas eficazes e estabilização avançada.",
        },
        {
          nome: "Operações de Resgate",
          descricao:
            "Usa 2d6 + Carisma para liderar evacuações, triagem médica e equipes de resgate.",
        },
        {
          nome: "Negociação em Crises",
          descricao:
            "Usa 2d6 + Carisma para garantir acesso seguro a áreas afetadas e manter organização sob pressão.",
        },
        {
          nome: "Treinamento em Escavação",
          descricao:
            "Usa 2d6 + Força para resgatar vítimas soterradas com mais eficiência.",
        },
        {
          nome: "Logística de Emergência",
          descricao:
            "Usa 2d6 + Medicina para distribuir recursos médicos e de resgate durante emergências urbanas.",
        },
        {
          nome: "Cuidado Pós-Operatório",
          descricao:
            "Usa 2d6 + Medicina para determinar recuperação e reduzir chances de infecção.",
        },
        {
          nome: "Primeiros Socorros Avançados",
          descricao:
            "Usa 2d6 + Destreza para estabilizar vítimas antes da evacuação, reduzindo dor e hemorragias.",
        },
        {
          nome: "Assistência Psicossocial",
          descricao:
            "Usa 2d6 + Carisma para identificar trauma psicológico e oferecer alívio emocional inicial.",
        },
        {
          nome: "Intervenção Rápida e Eficaz",
          descricao:
            "Em grandes desastres, usa 2d6 + Medicina ou Destreza para salvar vidas e restaurar funções vitais.",
        },
      ],
    },

    {
      id: "cirurgiao-de-trauma",
      nome: "Cirurgião de Trauma",
      descricao:
        "Especialista em procedimentos médicos extremos, estabilização avançada e cirurgias emergenciais.",

      habilidades: [
        {
          nome: "Intervenção Rápida",
          descricao:
            "Pode realizar primeiros socorros como ação bônus. Ao estabilizar uma criatura morrendo, ela recupera 1 PV e pode agir no próximo turno.",
        },
        {
          nome: "Diagnóstico Instantâneo",
          descricao:
            "Com teste de Conhecimento Médico CD 15 como ação de movimento, identifica todas as condições médicas do paciente.",
        },
        {
          nome: "Cirurgia de Campo",
          descricao:
            "Com kit cirúrgico portátil, realiza procedimentos emergenciais e remove condições como sangramento grave com CD 15.",
        },
        {
          nome: "Transfusão de Campo",
          descricao:
            "Restaura 2d8 + Inteligência de PI a um aliado ou neutraliza efeitos de anemia e hemorragia.",
        },
        {
          nome: "Técnica de Fechamento Rápido",
          descricao:
            "Após uma batalha, trata até 6 feridos em 10 minutos. Cada um recupera PI como se tivesse descansado.",
        },
        {
          nome: "Monitoramento Vital Contínuo",
          descricao:
            "Monitora até 3 pacientes simultaneamente, sabendo seu estado exato e recebendo alertas críticos.",
        },
        {
          nome: "Procedimento de Ressuscitação",
          descricao:
            "Uma vez por missão, pode tentar reanimar alguém que morreu na última rodada com Conhecimento Médico CD 25.",
        },
        {
          nome: "Mestre do Trauma",
          descricao:
            "Uma vez por missão, uma cura recupera o valor máximo. Também pode remover duas condições com uma única ação.",
        },
      ],
    },

    {
      id: "bioquimico",
      nome: "Bioquímico",
      descricao:
        "Especialista em compostos, drogas, antídotos, estimulantes e manipulação química em campo.",

      habilidades: [
        {
          nome: "Síntese de Campo",
          descricao:
            "Cria estimulantes, analgésicos ou antídotos básicos em 10 minutos usando reagentes portáteis.",
        },
        {
          nome: "Dosagem Precisa",
          descricao:
            "Drogas administradas por você duram 50% a mais e têm 25% menos efeitos colaterais.",
        },
        {
          nome: "Cocktail de Combate",
          descricao:
            "Como ação bônus, administra coquetéis de combate, resistência ou foco em aliados.",
        },
        {
          nome: "Nano-Antídotos",
          descricao:
            "Cria antídoto universal contra venenos conhecidos por 24 horas, com 1 hora de preparação.",
        },
        {
          nome: "Modulador Metabólico",
          descricao:
            "Cria drogas que dobram cura natural ou removem venenos e doenças.",
        },
        {
          nome: "Aerossol Médico",
          descricao:
            "Prepara aerossóis que curam, estimulam iniciativa ou acalmam em área de 6m.",
        },
        {
          nome: "Mestre Farmacólogo",
          descricao:
            "Suas drogas têm efeito máximo, duram o dobro e você pode criar três compostos rapidamente.",
        },
      ],
    },

    {
      id: "psicologo-de-campo",
      nome: "Psiquiatra/Psicólogo de Campo",
      descricao:
        "Especialista em saúde mental, controle de crise, trauma psicológico e manipulação terapêutica.",

      habilidades: [
        {
          nome: "Avaliação Psicológica",
          descricao:
            "Com 5 minutos de conversa e teste de Instinto ou Conhecimento Médico, determina o estado mental de uma pessoa.",
        },
        {
          nome: "Intervenção em Crise",
          descricao:
            "Como ação, faz Diplomacia CD 15 para remover condições como amedrontado, confuso ou enlouquecendo.",
        },
        {
          nome: "Terapia de Campo",
          descricao:
            "Em 2 rodadas, remove estresse ou trauma acumulado e concede +2 em Vontade pela sessão.",
        },
        {
          nome: "Leitura Microexpressiva",
          descricao:
            "Tem vantagem em testes de Instinto para detectar mentiras e identificar emoções dominantes.",
        },
        {
          nome: "Psicoprofilaxia",
          descricao:
            "Aliados tratados por você recebem +5 contra medo, confusão, sugestão e efeitos similares.",
        },
        {
          nome: "Debriefing Pós-Traumático",
          descricao:
            "Após eventos traumáticos, aliados não acumulam estresse daquela cena e recuperam 5 de Sanidade.",
        },
        {
          nome: "Manipulação Terapêutica",
          descricao:
            "Com Diplomacia contra Vontade do alvo, pode sugerir uma ação simples.",
        },
        {
          nome: "Reconstrução de Memória",
          descricao:
            "Com 1 semana de sessões e Conhecimento Médico CD 30, remove traumas profundos. Falhas causam dano mental.",
        },
      ],
    },
  ],
};
