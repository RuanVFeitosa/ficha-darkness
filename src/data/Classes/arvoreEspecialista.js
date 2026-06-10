export const arvoreEspecialista = {
  classe: "Especialista",
  titulo: "A ESPECIALIZAÇÃO ABSOLUTA",
  beneficio:
    "Especialista começa com +3 em Investigação, Diplomacia e Enganação.",
  absolutas: [
    {
      id: "analise",
      nome: "Análise",
      descricao:
        "Ao observar atentamente um alvo, você é capaz de descobrir suas falhas. Ao gastar uma ação de movimento, você analisa um inimigo em alcance médio. Escolha entre gastar 2 PE e diminuir a Defesa do alvo em 2 contra você, ou gastar 5 PE e receber +2 em testes contra ele até o fim da cena.",
    },
    {
      id: "eficiencia-calibrada",
      nome: "Eficiência Calibrada",
      descricao:
        "Ao preparar uma ação com tempo para analisar o ambiente ou o alvo, pelo menos 1 minuto, pode substituir o atributo normal do teste por Inteligência, desde que justifique via conhecimento técnico, tático ou científico. Além disso, em ataques à distância ou ações de precisão, ignora coberturas leves se passar no teste.",
    },
    {
      id: "desmonte-metodico",
      nome: "Desmonte Metódico",
      descricao:
        "Quando analisa uma tecnologia, criatura ou sistema organizacional hostil, pode fazer um teste de Inteligência para identificar uma vulnerabilidade crítica. Se passar, recebe +1D6 em seu próximo teste para explorá-la. Além disso, pode usar Intelecto em vez de Percepção para detectar detalhes técnicos ou falhas estruturais.",
    },
    {
      id: "fachada-convincente",
      nome: "Fachada Convincente",
      descricao:
        "Ao criar uma identidade falsa ou sustentar um disfarce, recebe +1D em testes de Enganação ou Presença. Além disso, pode usar Enganação no lugar de Diplomacia para obter informações, desde que mantenha a persona ativa.",
    },
  ],
  bases: [],
  aptidoes: [
    {
      id: "pericia-avancada",
      nome: "Perícia Avançada",
      custo: "10 Pontos",
      descricao:
        "Você se torna absoluto em 1 passiva (+10). Você pode pegar este poder uma segunda vez caso possua NV5 ou superior.",
    },
    {
      id: "analise-de-fraqueza",
      nome: "Análise de Fraqueza",
      custo: "1 PE",
      descricao:
        "Como uma ação de movimento, você analisa um alvo à sua frente. Até o final do combate, o primeiro ataque corpo a corpo ou à distância de um aliado, incluindo você, contra esse alvo em cada rodada recebe +1d4 no dano. Você pode manter essa análise ativa em apenas um alvo por vez.",
    },
    {
      id: "fuga-improvisada",
      nome: "Fuga Improvisada",
      custo: "1 PE - Reação",
      descricao:
        "Ao ser emboscado, surpreendido ou quando falha em um teste para evitar uma área de efeito, você pode usar sua reação para se mover instantaneamente 1,5m em qualquer direção, potencialmente saindo da área de perigo. Este movimento não provoca ataques de oportunidade.",
    },
    {
      id: "pronuncia-instintiva",
      nome: "Pronúncia Instintiva",
      custo: "Passiva",
      descricao:
        "Você pode se comunicar de forma básica, como cumprimentos, pedidos simples e avisos, em qualquer língua, desde que tenha ouvido pelo menos 1 minuto de conversa nela.",
    },
    {
      id: "kit-de-sobrevivencia-urbana",
      nome: "Kit de Sobrevivência Urbana",
      custo: "Passiva",
      descricao:
        "Em ambientes urbanos, você sempre sabe onde encontrar um esconderijo seguro, uma saída secreta, um ponto fraco na segurança ou um informante em potencial com um teste de Investigação ou Crime de 1 minuto.",
    },
    {
      id: "ritmo-do-combate",
      nome: "Ritmo do Combate",
      custo: "1 PE",
      descricao:
        "No início do seu turno, você pode gastar 1 PE. Escolha um aliado que possa ouvi-lo. Na próxima vez que esse aliado realizar um teste de ataque, perícia ou resistência neste turno, ele pode rolar o dado duas vezes e usar o melhor resultado.",
    },
    {
      id: "mente-analitica",
      nome: "Mente Analítica",
      custo: "Passiva",
      descricao:
        "Você ganha vantagem (+2) em testes de Inteligência para deduzir funcionalidades de mecanismos desconhecidos, analisar padrões de comportamento ou decifrar códigos simples. Além disso, o tempo para realizar análises complexas é reduzido pela metade.",
    },
    {
      id: "presenca-irrelevante",
      nome: "Presença Irrelevante",
      custo: "1 PE - Ação de Movimento",
      descricao:
        "Ao ficar parado e não realizar ações hostis, você pode gastar 1 PE. Até o seu próximo turno, seres que não estejam especificamente à sua procura devem fazer um teste de Percepção contra um teste furtivo seu com vantagem (+2) para notá-lo, mesmo que você esteja à plena vista em um ambiente movimentado ou cheio de detalhes.",
    },
    {
      id: "ponto-de-pressao-nao-letal",
      nome: "Ponto de Pressão Não-Letal",
      custo: "1 PE",
      descricao:
        "Ao realizar um ataque bem-sucedido com uma arma corpo a corpo leve ou desarmado, você pode gastar 1 PE para transformar todo o dano em dano não-letal. Além disso, o alvo deve fazer um teste de Fortitude ou ficará Atordoado por 1 rodada.",
    },
    {
      id: "negociador-nato",
      nome: "Negociador Nato",
      custo: "Passiva",
      descricao:
        "Você ganha +2 em testes de Diplomacia e Intimidação. Quando obtém sucesso em uma negociação, compra, venda ou troca de informações, pode rolar 1d4. O resultado concede um desconto percentual extra de 1d4 x 5% no custo, ou um acréscimo percentual no valor obtido.",
    },
    {
      id: "mestre-dos-disfarces",
      nome: "Mestre dos Disfarces",
      custo: "1 PE",
      descricao:
        "Com duas rodadas e acesso a itens comuns, como roupas, maquiagem e acessórios, você pode criar um disfarce que permite se passar por um tipo genérico de pessoa. Testes de Percepção para ver através do disfarce são feitos com desvantagem (-2), a menos que o observador o conheça pessoalmente.",
    },
    {
      id: "foco-de-precisao",
      nome: "Foco de Precisão",
      custo: "2 PE",
      descricao:
        "Como uma ação completa, você concentra-se em um único ataque à distância ou corpo a corpo. Este ataque é feito com vantagem dupla (+4 no dado) e ignora cobertura parcial. Se acertar, é um acerto crítico automaticamente.",
    },
    {
      id: "intervencao-tatica",
      nome: "Intervenção Tática",
      custo: "1 PE - Reação",
      descricao:
        "Quando um aliado dentro do seu campo de visão falha em um teste de perícia, você pode usar sua reação para gritar uma instrução rápida. O aliado pode rerrolar o teste, mas deve aceitar o novo resultado.",
    },
    {
      id: "desmontar-rapido",
      nome: "Desmontar Rápido",
      custo: "1 PE",
      descricao:
        "Com uma ação de movimento, você pode desmontar um mecanismo portátil, como uma fechadura, uma arma de disparo simples ou uma armadilha pequena, em seus componentes básicos, tornando-o inutilizável.",
    },
    {
      id: "mapa-mental",
      nome: "Mapa Mental",
      custo: "Passiva",
      descricao:
        "Você tem um senso de direção impecável. Pode refazer qualquer rota que tenha percorrido, mesmo inconsciente, uma vez. Além disso, sempre sabe a direção cardinal aproximada e pode estimar distâncias percorridas com precisão de 95%.",
    },
    {
      id: "calculo-de-probabilidades",
      nome: "Cálculo de Probabilidades",
      custo: "1 PE",
      descricao:
        "Quando você ou um aliado dentro do seu campo de visão faz um teste de ataque ou perícia, você pode gastar 1 PE como ação livre, antes do dado ser rolado. Role 1d6 e some o resultado ao teste. Se o d6 mostrar 6, ele é rerrolado e somado novamente.",
    },
    {
      id: "palavra-chave",
      nome: "Palavra-Chave",
      custo: "Passiva",
      descricao:
        "Após pelo menos 1 minuto de conversa com uma pessoa, escolha uma palavra-chave comum. Nas próximas 24 horas, sempre que você pronunciar essa palavra diretamente para ela, pode ditar uma sugestão simples como ação livre. O alvo faz um teste de Vontade, com CD baseada em sua Inteligência, para resistir. Usos bem-sucedidos consecutivos contra a mesma pessoa têm desvantagem.",
    },
    {
      id: "logistica-improvisada",
      nome: "Logística Improvisada",
      custo: "1 PE - Ação Completa",
      descricao:
        "Com 10 minutos de trabalho e acesso a qualquer ambiente não estéril, você pode criar um item improvisado de categoria comum que funcione por uma cena. A qualidade é frágil, mas suficiente para a tarefa. Em cenas de Interlúdio, esta habilidade pode gerar um Equipamento Temporário útil para a próxima missão.",
    },
    {
      id: "espelho-tatico",
      nome: "Espelho Tático",
      custo: "2 PE - Reação",
      descricao:
        "Quando um inimigo dentro do seu alcance faz um teste de ataque corpo a corpo contra você e erra, você pode usar sua reação para gastar 2 PE. Você realiza imediatamente um ataque corpo a corpo contra esse inimigo, usando a própria arma, estilo de luta ou momentum dele. Este ataque usa seu modificador de Inteligência no lugar de Força ou Destreza para a rolagem de ataque e dano.",
    },
    {
      id: "arquivo-vivo",
      nome: "Arquivo Vivo",
      custo: "Passiva",
      descricao:
        "Você nunca precisa fazer testes para lembrar de uma informação factual que já tenha aprendido de forma confiável. Para informações escondidas, o Mestre pode pedir um teste, mas você terá vantagem (+2). Em cenas de Interlúdio, você pode pesquisar em sua memória para obter uma pista crucial sobre um assunto que já estudou, contando como uma ação de Investigação bem-sucedida automaticamente.",
    },
  ],
  especialidades: [
    {
      id: "furtivo",
      nome: "Furtivo",
      descricao:
        "Especialistas em infiltração, assassinato silencioso e emboscadas letais.",

      habilidades: [
        {
          id: "ataque-furtivo",
          nome: "Ataque Furtivo",
          custo: "1 PE",
          descricao:
            "Quando atinge um inimigo desprevenido ou flanqueado com um ataque corpo a corpo ou de alcance curto, pode gastar 1 PE para causar +2d6 de dano adicional do mesmo tipo da arma.",
        },

        {
          id: "assassino-silencioso",
          nome: "Assassino Silencioso",
          custo: "Passiva",
          descricao:
            "Ao realizar um ataque furtivo com uma arma corpo a corpo, causa 1d6 de dano adicional. Se o alvo não perceber sua presença, o dano adicional aumenta para 2d6.",
        },

        {
          id: "movimento-fantasma",
          nome: "Movimento Fantasma",
          custo: "Passiva",
          descricao:
            "Ganha vantagem em testes de Furtividade ao mover-se silenciosamente e pode ignorar terreno difícil ao se mover furtivamente.",
        },

        {
          id: "furtivo-letal",
          nome: "Furtivo Letal",
          custo: "Passiva",
          descricao: "O dano adicional do Ataque Furtivo aumenta para +3d6.",
        },

        {
          id: "golpe-sombrio",
          nome: "Golpe Sombrio",
          custo: "2 PE",
          descricao:
            "Se você atacar um inimigo enquanto estiver escondido, ganha vantagem no teste de ataque e causa dano crítico automaticamente. Se errar, ainda causa metade do dano normal.",
        },

        {
          id: "emboscada-precisa",
          nome: "Emboscada Precisa",
          custo: "Passiva",
          descricao:
            "Quando emboscar um inimigo, ganha vantagem no teste de ataque e pode adicionar seu modificador de Destreza ao dano. Além disso, inimigos emboscados ficam atordoados até o final do próximo turno.",
        },

        {
          id: "mestre-da-camuflagem",
          nome: "Mestre da Camuflagem",
          custo: "Passiva",
          descricao:
            "Ganha vantagem em testes de Furtividade em ambientes com cobertura ou escuridão. Pode usar uma ação bônus para se esconder, mesmo quando levemente obscurecido.",
        },

        {
          id: "furtivo-mortal",
          nome: "Furtivo Mortal",
          custo: "Passiva",
          descricao: "O dano adicional do Ataque Furtivo aumenta para +4d6.",
        },

        {
          id: "golpe-fantasma",
          nome: "Golpe Fantasma",
          custo: "3 PE",
          descricao:
            "Você pode gastar 3 PE para realizar um ataque furtivo em qualquer momento durante o combate, independentemente das condições de flanco ou distração, causando +5d6 de dano adicional.",
        },

        {
          id: "furtivo-supremo",
          nome: "Furtivo Supremo",
          custo: "Passiva",
          descricao:
            "O dano adicional do Ataque Furtivo aumenta para +6d6, tornando seus ataques furtivos extremamente letais.",
        },
      ],
    },
    {
      id: "examinador",
      nome: "Examinador",
      descricao:
        "Especialistas em investigação, análise forense, percepção de detalhes e resolução de códigos.",

      habilidades: [
        {
          id: "olhos-de-aguia",
          nome: "Olhos de Águia",
          custo: "2 PE",
          descricao:
            "Uma vez por sessão, pode gastar 2 PE em um teste de Investigação para reduzir a DT do teste e garantir sucesso.",
        },
        {
          id: "percepcao-agucada",
          nome: "Percepção Aguçada",
          custo: "Passiva",
          descricao:
            "Ganha vantagem em testes de Percepção para encontrar pistas, documentos escondidos e sinais de atividade suspeita. Além disso, pode usar uma ação bônus para examinar rapidamente um ambiente em busca de detalhes importantes.",
        },
        {
          id: "analista-forense",
          nome: "Analista Forense",
          custo: "Passiva",
          descricao:
            "Ganha +2 em testes de Investigação relacionados à análise de cenas de crime, corpos e objetos. Pode identificar causa da morte, tempo dos eventos e outras informações cruciais com maior precisão.",
        },
        {
          id: "intuicao-apurada",
          nome: "Intuição Apurada",
          custo: "Passiva",
          descricao:
            "Ganha vantagem em testes de Intuição para detectar mentiras, reconhecer comportamentos suspeitos e entender motivações ocultas. Pode usar uma ação bônus para fazer um teste de Intuição contra um alvo.",
        },
        {
          id: "especialista-em-codificacao",
          nome: "Especialista em Codificação",
          custo: "Passiva",
          descricao:
            "Ganha vantagem em testes de Inteligência ou Investigação para decifrar códigos, quebra-cabeças e mensagens criptografadas. Pode gastar 1 minuto analisando uma mensagem criptografada para realizar um teste adicional.",
        },
        {
          id: "investigador-implacavel",
          nome: "Investigador Implacável",
          custo: "3 PE",
          descricao:
            "Pode gastar 3 PE para realizar um teste de Investigação ou Percepção com vantagem, representando foco superior para detectar padrões e pistas que outros poderiam perder.",
        },
        {
          id: "mestre-forense",
          nome: "Mestre Forense",
          custo: "Passiva",
          descricao:
            "Em cenas de crime, ganha +2 em testes de Investigação para encontrar vestígios quase imperceptíveis, como impressões digitais, rastros de sangue e detalhes pequenos.",
        },
        {
          id: "instinto-investigativo",
          nome: "Instinto Investigativo",
          custo: "Passiva",
          descricao:
            "Pode realizar um teste de Investigação ou Percepção sem ter uma pista clara ou guia, com vantagem, como se tivesse um instinto natural de onde procurar.",
        },
        {
          id: "mestre-da-codificacao",
          nome: "Mestre da Codificação",
          custo: "4 PE",
          descricao:
            "Ao analisar códigos ou criptografias, você pode gastar 4 PE para realizar um teste de Investigação com sucesso garantido, sem precisar de rolagem.",
        },
        {
          id: "visao-total",
          nome: "Visão Total",
          custo: "5 PE",
          descricao:
            "Você pode gastar 5 PE para garantir sucesso em qualquer teste de Investigação ou Percepção, ignorando qualquer penalidade ou dificuldade, representando uma habilidade quase sobrenatural de perceber tudo ao seu redor.",
        },
      ],
    },
    {
      id: "investigacao",
      nome: "Investigação",
      descricao:
        "Especialistas em dedução lógica, análise de pistas e compreensão profunda de mistérios complexos.",

      habilidades: [
        {
          id: "descoberta-motivadora",
          nome: "Descoberta Motivadora",
          custo: "Passiva",
          descricao:
            "Ao encontrar uma pista, você recebe 1 PE temporário. Este bônus aumenta em +1 nos NV 40, 65 e 99. Os PE temporários são removidos ao entrar em uma cena de combate.",
        },

        {
          id: "analise-investigativa",
          nome: "Análise Investigativa",
          custo: "3 PE",
          descricao:
            "Ao gastar 3 PE, você pode utilizar Investigação em qualquer teste para obter informações específicas, como analisar a causa da morte de um corpo ou questionar alguém sobre eventos detalhados.",
        },

        {
          id: "identificar-ameaca",
          nome: "Identificar Ameaça",
          custo: "4 PE",
          descricao:
            "Ao encontrar-se com um inimigo, você pode gastar 4 PE e uma ação completa para analisar o alvo em busca de uma vulnerabilidade. O próximo ataque contra essa fraqueza sofre -5 no acerto para ignorar todas as resistências físicas.",
        },

        {
          id: "raciocinio-dedutivo",
          nome: "Raciocínio Dedutivo",
          custo: "Passiva",
          descricao:
            "Sua mente lógica e analítica é afiada como uma lâmina. Recebe +2 em testes de Investigação e, uma vez por cena, pode realizar uma dedução rápida que fornece uma pista crucial ou revelação sobre o mistério em questão.",
        },

        {
          id: "leitura-de-padroes",
          nome: "Leitura de Padrões",
          custo: "Passiva",
          descricao:
            "Você pode identificar padrões em dados, comportamento humano ou acontecimentos passados. Ganha +2 em testes de Investigação relacionados a seguir pistas em situações complexas.",
        },

        {
          id: "analise-profunda",
          nome: "Análise Profunda",
          custo: "2 PE",
          descricao:
            "Quando encontra uma pista importante, pode gastar 2 PE para obter informações mais detalhadas sobre ela, revelando detalhes escondidos ou conexões mais profundas.",
        },

        {
          id: "logica-imbativel",
          nome: "Lógica Imbatível",
          custo: "4 PE",
          descricao:
            "Uma vez por sessão, ao gastar 4 PE, você consegue resolver uma questão complexa instantaneamente, como descobrir a verdadeira causa de um crime ou compreender completamente uma situação, sem necessidade de testes adicionais.",
        },

        {
          id: "analise-rapida",
          nome: "Análise Rápida",
          custo: "3 PE",
          descricao:
            "Ao gastar 3 PE, você pode realizar um teste de Investigação como uma ação bônus, com vantagem, para obter informações essenciais durante uma conversa ou análise de ambiente.",
        },

        {
          id: "instinto-investigativo-aprimorado",
          nome: "Instinto Investigativo Aprimorado",
          custo: "4 PE",
          descricao:
            "Sua percepção de ameaças e pistas se torna quase sobrenatural. Ao gastar 4 PE, você identifica automaticamente uma ameaça ou pista importante, ignorando testes de Investigação ou Percepção.",
        },

        {
          id: "percepcao-extrema",
          nome: "Percepção Extrema",
          custo: "5 PE",
          descricao:
            "Ao encontrar uma pista crucial, você pode gastar 5 PE para compreender totalmente sua importância e antecipar o impacto dela no futuro, garantindo vantagem estratégica nas próximas cenas.",
        },
      ],
    },
    {
      id: "estrategia",
      nome: "Estratégia",
      descricao:
        "Especialistas em liderança tática, controle de combate e coordenação de equipes em situações extremas.",

      habilidades: [
        {
          id: "reconhecer-terreno",
          nome: "Reconhecer Terreno",
          custo: "2 PE",
          descricao:
            "Você gasta 2 PE e uma ação padrão para avaliar o cenário de combate e recomendar vantagens geográficas. Todos os seus aliados recebem +2 em Defesa até o final da cena.",
        },

        {
          id: "formacao-tatica-contencao",
          nome: "Formação Tática — Contenção",
          custo: "3 PE",
          descricao:
            "Você cria uma formação focada em contenção. Para cada aliado corpo a corpo presente na linha de frente, aliados que realizarem ataques à distância recebem +1d20 em testes de ataque.",
        },

        {
          id: "formacao-tatica-suporte",
          nome: "Formação Tática — Suporte",
          custo: "3 PE",
          descricao:
            "Você organiza uma formação defensiva de suporte. Inimigos sofrem -3 em testes de ataque à distância contra seus aliados.",
        },

        {
          id: "plano-de-ataque",
          nome: "Plano de Ataque",
          custo: "2 PE",
          descricao:
            "Antes do início do combate, você pode gastar 2 PE para elaborar um plano rápido. Você e todos os aliados recebem uma ação padrão adicional na primeira rodada.",
        },

        {
          id: "formacoes-avancadas",
          nome: "Formações Avançadas",
          custo: "5 PE",
          descricao:
            "Você cria formações complexas que proporcionam vantagens táticas adicionais, como bônus de dano, cobertura superior ou penalidades específicas aos inimigos.",
        },

        {
          id: "reconhecimento-superior",
          nome: "Reconhecimento Superior",
          custo: "3 PE",
          descricao:
            "Você obtém informações detalhadas sobre o terreno, permitindo que você e seus aliados recebam vantagens em movimentação, cobertura ou posicionamento estratégico.",
        },

        {
          id: "lideranca-tatica",
          nome: "Liderança Tática",
          custo: "4 PE",
          descricao:
            "Você coordena sua equipe durante o combate. Todos os aliados recebem vantagem em testes de ataque ou Defesa até o início do seu próximo turno.",
        },

        {
          id: "instrucao-rapida",
          nome: "Instrução Rápida",
          custo: "3 PE",
          descricao:
            "Você transmite instruções táticas em segundos. Um aliado recebe vantagem na próxima ação realizada durante esta rodada.",
        },

        {
          id: "comando-supremo",
          nome: "Comando Supremo",
          custo: "5 PE",
          descricao:
            "Você reorganiza completamente as forças aliadas em combate, concedendo uma vantagem estratégica imediata. Todos os aliados recebem uma ação bônus para atacar ou se defender.",
        },

        {
          id: "genio-tatico",
          nome: "Gênio Tático",
          custo: "6 PE",
          descricao:
            "Uma vez por combate, você pode alterar drasticamente o rumo da batalha. Isso pode modificar posicionamentos, criar vantagens de terreno ou desorganizar os inimigos, garantindo uma vantagem decisiva para sua equipe.",
        },
      ],
    },
    {
      id: "operacoes-especiais",
      nome: "Operações Especiais",
      descricao:
        "Especialidade voltada para combate tático, sobrevivência, coordenação de equipe e atuação em ambientes hostis.",

      habilidades: [
        {
          id: "treinamento-tatico",
          nome: "Treinamento Tático",
          nivel: "I",
          descricao:
            "Ganha +2 em testes de Pontaria. Pode usar uma ação de movimento para analisar o campo de batalha e identificar 1 ponto estratégico, como cobertura, rota de fuga ou terreno elevado.",
        },
        {
          id: "comunicacao-eficaz",
          nome: "Comunicação Eficaz",
          nivel: "II",
          descricao:
            "Você coordena aliados em combate. Aliados a até 30m que possam vê-lo ou ouvi-lo ganham +2 em Iniciativa e não sofrem penalidades por atacar em alcance amigo.",
        },
        {
          id: "primeiros-socorros-avancados-operacoes",
          nome: "Primeiros Socorros Avançados",
          nivel: "III",
          descricao:
            "Com um kit médico, pode estabilizar um ser morrendo como ação padrão em vez de ação completa. Além disso, pode restaurar 1d8 + modificador de Inteligência de PI uma vez por aliado.",
        },
        {
          id: "posicao-de-tiro-operacoes",
          nome: "Posição de Tiro",
          nivel: "IV",
          descricao:
            "Ao se preparar com uma ação completa, escolha uma área de 3m de raio. Enquanto permanecer nela, atira com vantagem e causa +1d6 de dano com armas de fogo.",
        },
        {
          id: "analise-de-ameaca",
          nome: "Análise de Ameaça",
          nivel: "V",
          descricao:
            "Com uma ação de movimento, estuda um inimigo visível e identifica um ponto fraco. Seu próximo ataque contra esse alvo ignora 5 pontos de Redução de Dano e recebe +2 no acerto.",
        },
        {
          id: "treinamento-de-resistencia",
          nome: "Treinamento de Resistência",
          nivel: "VI",
          descricao:
            "Você ganha vantagem em testes de Fortitude contra fadiga, ambiente hostil e efeitos químicos não letais, como gás lacrimogêneo.",
        },
        {
          id: "coordenacao-de-ataque",
          nome: "Coordenação de Ataque",
          nivel: "VII",
          descricao:
            "Gaste uma ação padrão para designar um alvo. Todos os aliados que atacarem esse alvo até seu próximo turno ganham +1d4 no dano. Pode ser usado 3x por cena.",
        },
        {
          id: "mestre-de-sobrevivencia",
          nome: "Mestre de Sobrevivência",
          nivel: "VIII",
          descricao:
            "Você pode encontrar ou criar abrigo, água potável e alimento em qualquer ambiente natural em 1d4 horas. Testes de Sobrevivência são feitos com vantagem.",
        },
        {
          id: "contra-terrorismo-cqb",
          nome: "Contra-Terrorismo/CQB",
          nivel: "IX",
          descricao:
            "Em ambientes fechados, ganha +2 na Defesa e em testes de Reflexos. Inimigos surpreendidos por você em ambientes internos não agem no primeiro round de combate.",
        },
        {
          id: "comandante-tatico",
          nome: "Comandante Tático",
          nivel: "X",
          descricao:
            "Uma vez por cena, pode gastar uma ação completa para dar ordens táticas. Escolha até três aliados. Cada um pode fazer uma reação imediata: mover metade do deslocamento, atacar ou usar uma habilidade de classe que normalmente exija ação padrão.",
        },
      ],
    },

    {
      id: "estrategista-tatico",
      nome: "Estrategista Tático",
      descricao:
        "Especialidade focada em leitura de campo, planejamento, coordenação de aliados e manipulação estratégica do combate.",

      habilidades: [
        {
          id: "analise-rapida-estrategista",
          nome: "Análise Rápida",
          nivel: "I",
          descricao:
            "Como ação bônus, analisa um inimigo ou situação. Faça um teste de Inteligência CD 15. Se passar, você ou um aliado ganha +2 no próximo teste relacionado ao alvo.",
        },
        {
          id: "coordenacao-de-equipe",
          nome: "Coordenação de Equipe",
          nivel: "II",
          descricao:
            "Quando usa a ação Ajudar, concede +4 ao aliado em vez de +2. Se o aliado acertar, causa +1d4 de dano adicional.",
        },
        {
          id: "plano-b",
          nome: "Plano B",
          nivel: "III",
          descricao:
            "1x por cena, quando você ou um aliado dentro de 9m falha em um teste, pode gastar sua reação para permitir um rerrol.",
        },
        {
          id: "posicionamento-tatico-estrategista",
          nome: "Posicionamento Tático",
          nivel: "IV",
          descricao:
            "Pode gastar uma ação de movimento para reposicionar aliados. Até 3 aliados dentro de 9m podem se mover até metade do deslocamento sem provocar ataques de oportunidade.",
        },
        {
          id: "golpe-coordenado",
          nome: "Golpe Coordenado",
          nivel: "V",
          descricao:
            "Ao acertar um ataque, pode sinalizar um aliado. O próximo ataque desse aliado contra o mesmo alvo causa +2d6 de dano. Pode ser usado 3x por dia.",
        },
        {
          id: "mente-estrategica",
          nome: "Mente Estratégica",
          nivel: "VI",
          descricao:
            "Você possui um mapa mental do campo de batalha. Não fica desprevenido e inimigos não ganham bônus de flanquear você. Aliados adjacentes também recebem esse benefício.",
        },
        {
          id: "explorar-fraqueza",
          nome: "Explorar Fraqueza",
          nivel: "VII",
          descricao:
            "Após observar um inimigo por 1 rodada com uma ação padrão, identifica uma fraqueza. Seus ataques e os de aliados ignoram 5 pontos de Redução de Dano desse inimigo pelo resto do combate.",
        },
        {
          id: "contingencia",
          nome: "Contingência",
          nivel: "VIII",
          descricao:
            "1x por dia, quando uma situação inesperada ocorre, como emboscada, armadilha ou reviravolta, pode declarar que já previa isso e ganhar uma ação completa extra nesse turno.",
        },
        {
          id: "mestre-da-batalha",
          nome: "Mestre da Batalha",
          nivel: "IX",
          descricao:
            "Como ação completa, dá ordens táticas. Todos os aliados em 18m ganham +1 em acerto, dano e Defesa por 3 rodadas. Pode ser usado 1x por cena.",
        },
        {
          id: "vitoria-por-estrategia",
          nome: "Vitória por Estratégia",
          nivel: "X",
          descricao:
            "No início de um combate importante, pode gastar um turno elaborando um plano. Todos os aliados começam com vantagem em Iniciativa e +1d6 de dano no primeiro turno. Se o plano for seguido, os efeitos duram toda a cena.",
        },
      ],
    },
  ],
};
