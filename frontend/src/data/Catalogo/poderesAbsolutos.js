const criarPoderAbsoluto = (id, nome, preco, detalhe, absolutismo) => ({
  id,
  nome,
  categoria: "poderes",
  preco,
  detalhe,
  entrega: absolutismo,
});

export const CATALOGO_PODERES_ABSOLUTOS = [
  criarPoderAbsoluto(
    "poder-passos-cacador-noturno",
    "Passos do Caçador Noturno",
    5,
    "Recebe +2 em Furtividade e pode usar Furtividade no lugar de Velocidade para escalar superfícies em ritmo lento e controlado.",
    "Absolutismo: O bônus aumenta para +4. Além disso, você pode passar por espaços ocupados por criaturas de uma categoria de tamanho menor ou igual à sua sem provocar ataques de oportunidade, desde que faça um teste de Furtividade CD 15.",
  ),

  criarPoderAbsoluto(
    "poder-reflexos-presa-consciente",
    "Reflexos da Presa Consciente",
    5,
    "Quando é alvo de ataque surpresa ou armadilha que permita teste de Velocidade para reduzir dano pela metade, você pode rolar com vantagem.",
    "Absolutismo: Se passar no teste de Velocidade com sucesso total, você não sofre dano algum. Além disso, você nunca fica Desprevenido contra ataques à distância.",
  ),

  criarPoderAbsoluto(
    "poder-ritmo-martelo-bigorna",
    "Ritmo do Martelo e da Bigorna",
    5,
    "Quando usa Ataque Total, você não sofre a penalidade padrão na Defesa. Alternativamente, quando usa Bloquear, pode fazer um único ataque como ação livre no seu turno.",
    "Absolutismo: Ao usar Bloquear, você concede cobertura +2 na Defesa a um aliado adjacente.",
  ),

  criarPoderAbsoluto(
    "poder-empuxo-telecinetico-latente",
    "Empuxo Telecinético Latente",
    5,
    "Como ação de movimento, você pode empurrar um objeto ou criatura de até 50kg em alcance curto até 1,5m. Criaturas podem fazer teste de Força CD 12 para resistir.",
    "Absolutismo: O peso máximo dobra para 100kg, a distância aumenta para 3m e a CD aumenta para 15. Você também pode puxar objetos leves para sua mão.",
  ),

  criarPoderAbsoluto(
    "poder-absolutismo-substancia",
    "Absolutismo com a Substância",
    5,
    "Quando tenta perceber a fraqueza de um objeto inanimado ou identificar a composição básica de uma substância, você rola com vantagem.",
    "Absolutismo: Suas armas corpo a corpo causam +1 de dano contra objetos e construções. Você também sabe a CD exata para arrombar portas ou quebrar objetos apenas olhando para eles.",
  ),

  criarPoderAbsoluto(
    "poder-sutura-vontade",
    "Sutura da Vontade",
    5,
    "Uma vez por cena, quando seria reduzido a 0 PV ou menos, você pode gastar 2 PE para ficar com 1 PV em vez disso.",
    "Absolutismo: Quando usar esta habilidade, você também ganha Resistência 5 a um tipo de dano entre Cortante, Perfurante ou Impactante até o final da cena.",
  ),

  criarPoderAbsoluto(
    "poder-mente-analitica",
    "Mente Analítica",
    5,
    "Em cenas de investigação, você pode fazer uma pergunta extra ao Mestre por sucesso obtido em Investigação ou Percepção relevante.",
    "Absolutismo: Você nunca sofre penalidade por distração ou pressão de tempo em testes de Inteligência fora de combate. Além disso, tem vantagem para perceber detalhes escondidos ou falsificações.",
  ),

  criarPoderAbsoluto(
    "poder-eco-ameaca",
    "Eco de Ameaça",
    5,
    "Criaturas hostis em alcance curto que tenham menos PV máximos que você sofrem -1 em seus testes de ataque contra você.",
    "Absolutismo: A penalidade aumenta para -2 e a área aumenta para alcance médio. Aliados em alcance curto de você ganham +1 em testes de resistência contra medo.",
  ),

  criarPoderAbsoluto(
    "poder-troca-sorte",
    "Troca de Sorte",
    5,
    "Quando um aliado em alcance médio obtém sucesso crítico, você pode, como reação, armazenar essa sorte. Pode gastar essa carga para rolar um dado do mesmo tipo em seu próximo teste e usar o melhor resultado.",
    "Absolutismo: Você pode armazenar até duas cargas de sorte ao mesmo tempo.",
  ),

  criarPoderAbsoluto(
    "poder-calculo-trajetoria",
    "Cálculo da Trajetória",
    5,
    "Você recebe +2 em testes de ataque à distância contra alvos em posição elevada ou em movimento complexo, como em um veículo.",
    "Absolutismo: O bônus aumenta para +4. Além disso, você ignora cobertura parcial em ataques à distância.",
  ),

  criarPoderAbsoluto(
    "poder-silencio-sentidos",
    "Silêncio dos Sentidos",
    5,
    "Ao se esconder, testes de Percepção para encontrá-lo através da audição ou olfato sofrem desvantagem.",
    "Absolutismo: Criaturas que usem sentidos especiais, como visão no escuro ou ecolocalização, também sofrem desvantagem em Percepção para encontrá-lo.",
  ),

  criarPoderAbsoluto(
    "poder-alquimia-corporal-basica",
    "Alquimia Corporal Básica",
    5,
    "Como ação completa, você pode conceder a si mesmo por 1 minuto uma das seguintes condições: vantagem em Força, vantagem em Fortitude ou resistência a Fogo, Frio, Elétrico ou Ácido. Usar causa 1d8 de dano de Sanidade.",
    "Absolutismo: Escolha duas condições em vez de uma. O dano de Sanidade é reduzido para 1d4.",
  ),

  criarPoderAbsoluto(
    "poder-marca-fraqueza",
    "Marca da Fraqueza",
    5,
    "Como ação de movimento, escolha uma criatura em alcance curto. A próxima vez que você ou um aliado acertar um ataque nessa criatura antes do final do seu próximo turno, causa +1d4 de dano.",
    "Absolutismo: O bônus aumenta para +1d6 e a marca dura até ser consumida.",
  ),

  criarPoderAbsoluto(
    "poder-economia-movimento",
    "Economia de Movimento",
    5,
    "Se você se mover pelo menos metade do seu deslocamento em um turno, ganha +1 na Defesa até o início do próximo turno.",
    "Absolutismo: Se usar toda a ação de movimento para se deslocar, também ganha +2 em testes de Velocidade até o início do próximo turno.",
  ),

  criarPoderAbsoluto(
    "poder-pulsar-energetico",
    "Pulsar Energético",
    5,
    "Como ação padrão, todas as criaturas em alcance curto devem fazer teste de Fortitude CD 12. Em falha, são empurradas 1,5m para longe de você e ficam Abaladas por uma rodada.",
    "Absolutismo: A CD aumenta para 15, o empurrão para 3m, e você pode escolher até três criaturas na área para não serem afetadas.",
  ),

  criarPoderAbsoluto(
    "poder-foco-adrenalina",
    "Foco de Adrenalina",
    5,
    "Quando sofre dano, recebe +1 em ataques e testes de perícia baseados em Força, Reflexos ou Fortitude até o final do próximo turno. Acumula até +3.",
    "Absolutismo: O bônus máximo aumenta para +5. Além disso, quando este efeito estiver ativo, você ignora os efeitos da condição Incapacitado.",
  ),

  criarPoderAbsoluto(
    "poder-ancoragem-temporal",
    "Ancoragem Temporal",
    5,
    "Você tem vantagem em testes de resistência contra efeitos que causem lentidão, paralisia temporal ou envelhecimento acelerado.",
    "Absolutismo: Uma vez por dia, quando um aliado adjacente for alvo de um efeito que você resistir com esta habilidade, pode estender a resistência a ele.",
  ),

  criarPoderAbsoluto(
    "poder-transfusao-esforco",
    "Transfusão de Esforço",
    5,
    "Como ação padrão e tocando um aliado, você pode transferir até metade dos seus PI atuais para ele. Você sofre esse dano, que não pode ser reduzido, e o aliado cura a mesma quantidade.",
    "Absolutismo: O dano que você sofre é reduzido pela metade. Além disso, pode fazer a transferência como ação de movimento, mas o custo em PI dobra para você.",
  ),

  criarPoderAbsoluto(
    "poder-sussurro-dispersao",
    "Sussurro da Dispersão",
    5,
    "Quando sofre dano de ataque corpo a corpo, pode usar sua reação para reduzir esse dano em 1d6 + seu modificador de Reflexos.",
    "Absolutismo: A redução aumenta para 1d8 + Reflexos, e você pode usar esta reação também contra ataques à distância de projéteis físicos.",
  ),

  criarPoderAbsoluto(
    "poder-intuicao-campo-batalha",
    "Intuição do Campo de Batalha",
    5,
    "Você não pode ser flanqueado. Além disso, uma vez por rodada, quando um inimigo se mover para sair de um quadrado adjacente a você, pode fazer um ataque de oportunidade mesmo se já tiver usado sua reação.",
    "Absolutismo: Seu ataque de oportunidade causa +1d6 de dano extra.",
  ),

  criarPoderAbsoluto(
    "poder-reflexo-escudo",
    "Reflexo de Escudo",
    5,
    "Enquanto estiver usando um escudo ou empunhando uma arma com qualidade Defensiva, você pode usar sua reação para impor desvantagem em um ataque direcionado a um aliado adjacente.",
    "Absolutismo: Se o ataque contra o aliado errar devido a esta desvantagem, você pode fazer um ataque de oportunidade imediato contra o agressor.",
  ),

  criarPoderAbsoluto(
    "poder-alquimia-mental",
    "Alquimia Mental",
    5,
    "Quando fica Abalado, Amedrontado ou Enfraquecido, pode, como ação livre no início do seu turno, remover essa condição. Se fizer isso, ganha 2 PE temporários até o final da cena.",
    "Absolutismo: Você também pode usar esta habilidade quando um aliado adjacente sofrer uma dessas condições, removendo-a dele e ganhando os PE temporários.",
  ),
];