export const arvoreRenegado = {
  classe: "Renegado",
  titulo: "A RENEGAÇÃO ABSOLUTA",
  beneficio:
    "Escolha um Atributo. O Renegado aumenta o modificador desse atributo em +1.",

  absolutas: [
    {
      id: "golpe-de-desilusao",
      nome: "Golpe de Desilusão",
      custo: "3 PE • Ação Padrão",
      descricao:
        "Você desfere um ataque corpo a corpo com vantagem (+2). Se acertar, além do dano normal, escolha: Traição Internalizada — o alvo faz teste de Vontade ou fica Confuso por 1 rodada; ou Fúria Autodestrutiva — o ataque causa +1d10 de dano, mas você sofre 1d4 de dano de concussão não-reduzível.",
    },
    {
      id: "conhecimento-do-inimigo",
      nome: "Conhecimento do Inimigo",
      custo: "2 PE • Ação de Movimento",
      descricao:
        "Você conhece protocolos e fraquezas da Continental. Até o final do combate, você e seus aliados recebem +1d4 em ataques contra forças da Continental. A primeira vez que um aliado causar crítico contra esses alvos, pode causar dano extra ou forçar uma informação tática breve.",
    },
    {
      id: "mente-fragmentada",
      nome: "Mente Fragmentada",
      custo: "1 PE • Passiva sob Condição",
      descricao:
        "Você pode ativar esta habilidade como ação livre para obter vantagem em um teste de Vontade contra medo por 1 cena, mas fica Aflito pela mesma duração. Além disso, quando falha contra um efeito mental, pode aceitar a falha para ganhar resistência contra efeitos mentais similares na próxima rodada.",
    },
    {
      id: "cicatrizes-que-advertem",
      nome: "Cicatrizes que Advertem",
      custo: "2 PE • Reação",
      descricao:
        "Quando sofre dano de uma fonte identificável, você ganha Resistência contra o mesmo tipo de dano até o fim do combate. Além disso, pode alertar um aliado que possa ouvi-lo, concedendo +2 na Defesa contra o próximo ataque da mesma fonte ou inimigo.",
    },
    {
      id: "sacrificio-da-ultima-resistencia",
      nome: "Sacrifício da Última Resistência",
      custo: "5 PE + 3d20 de Vida Permanente • Ação Completa",
      descricao:
        "Você se move em linha reta até seu deslocamento total, ignorando ataques de oportunidade, e realiza um ataque contra até 3 inimigos da Continental no caminho. Esses ataques têm vantagem (+10) e causam dano máximo +1d12. Depois, você perde 3d20 de Integridade, fica Exausto e Vulnerável até o fim do combate, caindo morrendo após o último ataque.",
    },
  ],
  aptidoes: [
    {
      id: "olhos-nos-omens",
      nome: "Olhos nos Omens",
      custo: "Passiva",
      descricao:
        "Você não pode ser surpreendido enquanto estiver consciente. Além disso, recebe vantagem (+2) em Percepção para notar emboscadas, armadilhas ou intenções hostis disfarçadas.",
    },
    {
      id: "marcha-forcada",
      nome: "Marcha Forçada",
      custo: "1 PE",
      descricao:
        "Como ação bônus, dobra seu deslocamento nesta rodada. No final do próximo turno, fica Lento por 1 rodada.",
    },
    {
      id: "estilo-de-combate-sujo",
      nome: "Estilo de Combate Sujo",
      custo: "Passiva",
      descricao:
        "Quando faz um ataque corpo a corpo com vantagem, pode escolher não rolar dois dados e, em vez disso, adicionar +1d4 ao dano.",
    },
    {
      id: "sussurros-da-continental",
      nome: "Sussurros da Continental",
      custo: "Passiva",
      descricao:
        "Em cenas de Interlúdio, pode fazer um teste de Crime ou Instinto para obter informação confidencial sobre planos, movimentos ou fraquezas logísticas da Continental.",
    },
    {
      id: "punho-de-aco",
      nome: "Punho de Aço",
      custo: "2 PE",
      descricao:
        "Seu próximo ataque desarmado nesta rodada conta como uma arma simples de 1d6. Se acertar, o alvo faz teste de Fortitude ou fica Atordoado por 1 rodada.",
    },
    {
      id: "sangue-frio",
      nome: "Sangue Frio",
      custo: "1 PE • Reação",
      descricao:
        "Quando um inimigo erra um ataque corpo a corpo contra você, ganha +2 no próximo ataque contra esse inimigo até o fim do seu próximo turno.",
    },
    {
      id: "sem-marcas-sem-rastros",
      nome: "Sem Marcas, Sem Rastros",
      custo: "Passiva",
      descricao:
        "Recebe vantagem (+2) em Furtividade para se esconder após combate ou em áreas urbanas. Testes convencionais para rastrear você têm desvantagem.",
    },
    {
      id: "provocacao-calculada",
      nome: "Provocação Calculada",
      custo: "1 PE • Ação Bônus",
      descricao:
        "Você provoca um inimigo à vista. No próximo turno dele, ataques contra outros alvos que não sejam você têm desvantagem. Se ele atacar você, seu primeiro ataque contra ele na rodada seguinte tem vantagem.",
    },
    {
      id: "kit-de-sobrevivencia-urbana-extrema",
      nome: "Kit de Sobrevivência Urbana Extrema",
      custo: "Passiva",
      descricao:
        "Em ambientes urbanos degradados, você sabe localizar esconderijos seguros, comerciantes ilegais ou acessos a sistemas como esgoto e ventilação.",
    },
    {
      id: "golpe-baixo",
      nome: "Golpe Baixo",
      custo: "3 PE",
      descricao:
        "Ao atacar corpo a corpo de surpresa ou contra inimigo distraído, o dano é crítico automaticamente. Humanoides médios ou menores fazem Fortitude ou ficam Incapacitados por 1d4 rodadas.",
    },
    {
      id: "resistencia-ao-interrogatorio",
      nome: "Resistência ao Interrogatório",
      custo: "Passiva",
      descricao:
        "Recebe vantagem em Vontade e Fortitude contra tortura, drogas da verdade, privação sensorial e interrogatórios. Uma vez por cena, pode dar informações falsas sem que percebam.",
    },
    {
      id: "tiro-de-pressao",
      nome: "Tiro de Pressão",
      custo: "2 PE",
      descricao:
        "Ao acertar um ataque à distância, pode desarmar o alvo, inutilizar um item não vestido por 1d4 rodadas ou forçá-lo a fazer Constituição ou ficar Lento.",
    },
    {
      id: "sem-patria-sem-lei",
      nome: "Sem Pátria, Sem Lei",
      custo: "Passiva",
      descricao:
        "Você é imune a efeitos sociais que tentem detectar lealdade ou alinhamento. Também recebe resistência a dano mental causado por culpa, remorso ou crise de identidade.",
    },
    {
      id: "face-do-inimigo",
      nome: "Face do Inimigo",
      custo: "Passiva",
      descricao:
        "Quando reduz um inimigo da Continental à Morte, recupera 1d4 de Integridade temporária ou 1 PE. Não pode ganhar mais bônus do que seu nível por combate.",
    },
    {
      id: "tatica-de-distracao-brutal",
      nome: "Tática de Distração Brutal",
      custo: "1 PE",
      descricao:
        "Como ação bônus, distrai um inimigo a até 9m. O próximo aliado a atacá-lo antes do fim do seu próximo turno tem vantagem. Se usar uma ação de ataque para a distração, o aliado também recebe +1d4 no dano.",
    },
    {
      id: "cicatrizes-que-ensinam",
      nome: "Cicatrizes que Ensinam",
      custo: "Passiva",
      descricao:
        "Recebe vantagem (+2) em Iniciativa. No primeiro turno de combate, pode declarar um Ataque de Aviso; se acertar, o alvo não pode usar reações até seu próximo turno.",
    },
    {
      id: "ultimo-suspiro-de-desafio",
      nome: "Último Suspiro de Desafio",
      custo: "5 PE • Ação Livre",
      descricao:
        "Quando seria reduzido a 0 Vida, fica com 1 Vida e realiza imediatamente uma ação padrão. Após isso, cai Inconsciente e começa a morrer no início do próximo turno, a menos que seja estabilizado. Só pode ser usado uma vez por missão.",
    },
  ],

  especialidades: [
    {
      id: "punho-da-redencao",
      nome: "Punho da Redenção",
      descricao:
        "Renegados que transformaram a dor causada pela Continental em uma guerra pessoal. Cada golpe é uma resposta, cada cicatriz é uma promessa.",

      habilidades: [
        {
          id: "furia-do-traidor",
          nome: "Fúria do Traidor",
          custo: "Passiva",
          descricao:
            "Ao enfrentar agentes ou recursos da Continental, seus ataques causam +1d6 de dano adicional.",
        },
        {
          id: "taticas-do-inimigo",
          nome: "Táticas do Inimigo",
          custo: "Passiva",
          descricao:
            "Você pode replicar manobras táticas padrão da Continental, como formações, sinais e protocolos de ataque. Aliados que seguirem suas ordens recebem +2 em Iniciativa contra forças da Continental.",
        },
        {
          id: "olho-por-olho",
          nome: "Olho por Olho",
          custo: "Passiva",
          descricao:
            "Escolha um tipo de agente da Continental, como Exterminadores, Silenciadores ou Auditores. Contra esse tipo, você tem vantagem (+2) em ataques e +2 na Defesa. A cada 3 níveis, escolha outro tipo.",
        },
        {
          id: "ferramentas-da-traicao",
          nome: "Ferramentas da Traição",
          custo: "Passiva",
          descricao:
            "Você possui 3 dispositivos da Continental modificados, como drones de vigilância hackeados, armas não rastreáveis ou comunicadores criptografados. Pode reabastecer em esconderijos preparados.",
        },
        {
          id: "o-preco-do-sangue",
          nome: "O Preço do Sangue",
          custo: "Passiva",
          descricao:
            "Quando reduz um agente da Continental à Morte, pode interrogá-lo em seus últimos segundos. Com um teste de Intimidação, CD 10 + nível do agente, extrai uma informação crítica antes que ele morra. Após a cena, sofre -2 em testes de Vontade por 1 hora.",
        },
        {
          id: "metodos-do-abatedouro",
          nome: "Métodos do Abatedouro",
          custo: "Passiva",
          descricao:
            "Após observar um caçador de renegados por 1 rodada, você pode prever seu próximo movimento tático. Seu próximo ataque contra ele ignora sua Defesa e causa dano crítico nos maiores resultados possíveis do dado de ataque, como 5 e 6 em d6 ou 9 e 10 em d10.",
        },
        {
          id: "cerco-ao-coracao",
          nome: "Cerco ao Coração",
          custo: "Passiva",
          descricao:
            "Em missões contra instalações da Continental, você localiza automaticamente seu núcleo crítico, como gerador, servidor central ou sala de comando. Ataques contra esse núcleo causam dano triplicado e têm vantagem.",
        },
        {
          id: "legado-de-cinzas",
          nome: "Legado de Cinzas",
          custo: "Passiva",
          descricao:
            "Quando destrói uma base ou operação importante da Continental, seu nome passa a assombrar a organização por 1 ano. Agentes que ouvirem seu nome devem fazer um teste de Vontade CD 18 ou sofrem -1d4 em testes contra você.",
        },
      ],
    },
    {
      id: "fantasma-do-passado",
      nome: "Fantasma do Passado",
      descricao:
        "Ex-agentes esquecidos pela Continental. Pessoas apagadas dos registros, mas não da memória da organização.",

      habilidades: [
        {
          id: "cicatrizes-que-sangram",
          nome: "Cicatrizes que Sangram",
          custo: "Passiva",
          descricao:
            "Você conhece os protocolos da Continental. Testes de Instinto e Investigação contra agentes, instalações ou operações da Continental são feitos com vantagem (+5). Além disso, pode identificar um ex-colega com um teste de Lealdade (CD 10 + anos desde o último contato).",
        },

        {
          id: "rosto-apagado",
          nome: "Rosto Apagado",
          custo: "Passiva",
          descricao:
            "Você morreu tantas vezes que criou múltiplas camadas de identidade. Pode assumir uma identidade de cobertura. Testes para verificar sua identidade real sofrem desvantagem (-5).",
        },

        {
          id: "aranha-na-teia",
          nome: "Aranha na Teia",
          custo: "2 PE",
          descricao:
            "Com acesso físico a um terminal da Continental, pode inserir códigos-fantasma que criam missões falsas, redirecionam recursos ou apagam registros. O sistema leva 2d6 horas para detectar a intrusão.",
        },

        {
          id: "assombracao",
          nome: "Assombração",
          custo: "4 PE",
          descricao:
            "Uma vez por missão, pode surgir em uma localização segura da Continental que conhecia anteriormente. Você chega ao local em 1d4 horas, mas deve lidar com a segurança interna.",
        },

        {
          id: "memoria-inimiga",
          nome: "Memória-Inimiga",
          custo: "2 PE",
          descricao:
            "Faça um teste de Intimidação ou Presença com vantagem (+5). Se passar, o alvo revela involuntariamente um segredo importante.",
        },

        {
          id: "despertar-forcado",
          nome: "Despertar Forçado",
          custo: "5 PE",
          descricao:
            "Pode tentar quebrar a lavagem cerebral de um agente ativo da Continental. Faça um teste de Diplomacia (CD 25). Em caso de sucesso, o agente se torna um aliado instável. Em falha, ele entra em colapso mental ou tenta matá-lo.",
        },

        {
          id: "falsa-operacao-spectre",
          nome: "Falsa Operação Spectre",
          custo: "Especial",
          descricao:
            "Com 1 semana de preparação, você faz a Continental acreditar em uma ameaça inexistente, drenando 25% dos recursos locais da organização por 1d4 semanas.",
        },

        {
          id: "ultimo-suspiro-da-continental",
          nome: "Último Suspiro da Continental",
          custo: "Especial",
          descricao:
            "Ao derrubar um líder ou instalação-chave da Continental, pode apagar permanentemente todos os registros de um tipo específico, como recrutas, pesquisas ou operações de um país inteiro. A informação é perdida para sempre.",
        },
      ],
    },

    {
      id: "cacador-de-sombras",
      nome: "O Caçador de Sombras",
      descricao:
        "Especialistas em infiltração, assassinato silencioso e perseguição invisível.",

      habilidades: [
        {
          id: "golpe-da-sombra",
          nome: "Golpe da Sombra",
          descricao:
            "Seus ataques contra inimigos desprevenidos causam +1d8 de dano extra.",
        },

        {
          id: "olhos-do-vazio",
          nome: "Olhos do Vazio",
          descricao:
            "Você pode detectar inimigos escondidos ou invisíveis até alcance curto por 1 minuto.",
        },

        {
          id: "passo-silente",
          nome: "Passo Silente",
          descricao:
            "Seus movimentos não fazem som e você ignora sensores e armadilhas básicas por 1 turno.",
        },

        {
          id: "mestre-do-veu",
          nome: "Mestre do Véu",
          descricao:
            "Você fica invisível até o início do próximo turno ou até atacar.",
        },

        {
          id: "terror-silencioso",
          nome: "Terror Silencioso",
          descricao:
            "Ao eliminar um inimigo sem ser visto, inimigos próximos devem testar Sanidade ou ficam amedrontados.",
        },

        {
          id: "sombra-rastejante",
          nome: "Sombra Rastejante",
          descricao:
            "Você se funde às sombras e se move instantaneamente até alcance médio ignorando obstáculos não mágicos.",
        },

        {
          id: "cicatriz-na-alma",
          nome: "Cicatriz na Alma",
          descricao:
            "Após acertar um ataque furtivo, o alvo sofre -1 em testes de Vontade e Percepção até o fim da cena.",
        },

        {
          id: "lamina-do-silencio",
          nome: "Lâmina do Silêncio",
          descricao:
            "Seu próximo ataque não produz som e não quebra invisibilidade.",
        },

        {
          id: "marca-das-sombras",
          nome: "Marca das Sombras",
          descricao:
            "Uma vez por descanso, você marca um inimigo e sempre sabe sua direção geral.",
        },

        {
          id: "danca-macabra",
          nome: "Dança Macabra",
          descricao:
            "Após eliminar um inimigo, pode atacar imediatamente outro inimigo adjacente.",
        },
      ],
    },

    {
      id: "desafiador",
      nome: "O Desafiador",
      descricao:
        "Sobreviveu à dor, à tortura e à destruição. Agora enfrenta qualquer coisa de frente.",

      habilidades: [
        {
          id: "desprezo-pela-dor",
          nome: "Desprezo pela Dor",
          descricao: "Reduz o dano sofrido em 1d12.",
        },

        {
          id: "forca-indomita",
          nome: "Força Indômita",
          descricao: "Sempre que sofrer dano crítico, ganha +2 PE.",
        },

        {
          id: "instinto-desafiador",
          nome: "Instinto Desafiador",
          descricao:
            "Recebe +1 na Defesa quando estiver em desvantagem numérica.",
        },

        {
          id: "rugido-de-rebeldia",
          nome: "Rugido de Rebeldia",
          descricao:
            "Inimigos próximos devem focar ataques em você até o próximo turno.",
        },

        {
          id: "ultimo-suspiro",
          nome: "Último Suspiro",
          descricao:
            "Ao chegar a 0 PV, luta por 1 turno extra antes de cair inconsciente.",
        },

        {
          id: "marca-do-indomavel",
          nome: "Marca do Indomável",
          descricao: "Ignora uma condição negativa por 3 turnos.",
        },

        {
          id: "desafio-brutal",
          nome: "Desafio Brutal",
          descricao:
            "Escolha um inimigo. Você causa +1d6 nele, mas sofre -1 Defesa contra outros.",
        },

        {
          id: "quebrar-correntes",
          nome: "Quebrar Correntes",
          descricao: "Escapa automaticamente de imobilizações ou restrições.",
        },

        {
          id: "sangue-no-olhar",
          nome: "Sangue no Olhar",
          descricao:
            "Com menos da metade da vida, seus ataques causam +1d4 de dano psicológico.",
        },

        {
          id: "legado-da-ruina",
          nome: "Legado da Ruína",
          descricao:
            "Ao cair em combate, aliados próximos ganham bônus de dano e resistência contra medo.",
        },
      ],
    },
    {
      id: "arquiteto-da-queda",
      nome: "O Arquiteto da Queda",
      descricao: "O poder que eles construíram será sua própria ruína.",

      habilidades: [
        {
          id: "saboteador-nato",
          nome: "Sabotador Nato",
          descricao:
            "Você pode gastar 2 PE para causar falha automática em dispositivos, máquinas ou armadilhas.",
        },
        {
          id: "virus-mental",
          nome: "Vírus Mental",
          descricao:
            "Uma vez por combate, um inimigo sofre -2 nas ações por 1 turno. O alvo pode realizar um teste de POD para resistir.",
        },
        {
          id: "corrupcao-estrategica",
          nome: "Corrupção Estratégica",
          descricao:
            "Sempre que um dispositivo explode ou falha próximo, inimigos próximos sofrem -1 em Defesa por 1 turno.",
        },
        {
          id: "distorcer-lealdades",
          nome: "Distorcer Lealdades",
          descricao:
            "Gaste 4 PE para fazer um inimigo comum hesitar. O alvo realiza um teste contra seu POD.",
        },
        {
          id: "orquestrador-invisivel",
          nome: "Orquestrador Invisível",
          descricao:
            "Ao criar uma distração, você ganha +2 em todas as defesas até o final da cena.",
        },
      ],
    },

    {
      id: "carrasco-dos-deuses",
      nome: "O Carrasco dos Deuses",
      descricao: "Eles se chamam de Senhores. Eu serei sua sentença.",

      habilidades: [
        {
          id: "golpe-implacavel",
          nome: "Golpe Implacável",
          descricao: "Seus ataques críticos causam +2d6 de dano adicional.",
        },
        {
          id: "cacador-de-chefes",
          nome: "Caçador de Chefes",
          descricao:
            "Você causa +1d8 de dano extra contra inimigos de nível superior ao seu.",
        },
        {
          id: "desdem-pela-fraqueza",
          nome: "Desdém pela Fraqueza",
          descricao: "Sempre que derrotar um inimigo, recupera 1 PV.",
        },
        {
          id: "sede-de-sangue",
          nome: "Sede de Sangue",
          descricao: "Sempre que eliminar um inimigo, recupere 5 PE.",
        },
        {
          id: "execucao-final",
          nome: "Execução Final",
          descricao:
            "Uma vez por combate, declare um ataque de execução. Se acertar, o alvo deve resistir ou morrer instantaneamente. A CD é baseada no seu POD.",
        },
      ],
    }, 
  ],
};
