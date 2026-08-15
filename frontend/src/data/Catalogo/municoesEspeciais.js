const criarMunicao = (arma, municao) => ({
  id: `municao-${arma.id}-${municao.id}`,
  nome: `${municao.nome} — ${arma.nome}`,
  categoria: "municoes-especiais",
  tipo: `Munição Especial — ${arma.nome}`,
  tipoArma: arma.id,
  preco: municao.preco,
  detalhe: municao.detalhe,
  entrega: `${arma.quantidade} unidades | Bônus: ${municao.bonusDano}`,
  bonusDano: municao.bonusDano,
  efeito: municao.efeito,
  quantidade: arma.quantidade,
  municaoEspecial: true,
});

const MUNICOOES_BASE = [
  {
    id: "explosiva",
    nome: "Munição Explosiva",
    preco: 135,
    bonusDano: "1d6",
    detalhe: "Carga de impacto que detona ao atingir o alvo.",
    efeito: "Causa dano explosivo adicional em impacto direto.",
  },
  {
    id: "acida",
    nome: "Munição Ácida",
    preco: 145,
    bonusDano: "1d4",
    detalhe: "Cápsula corrosiva para degradar proteção e matéria orgânica.",
    efeito: "Causa dano ácido adicional e deixa marcas corrosivas.",
  },
  {
    id: "incendiaria",
    nome: "Munição Incendiária",
    preco: 140,
    bonusDano: "1d6",
    detalhe: "Composto térmico que incendeia materiais inflamáveis.",
    efeito: "Causa dano de fogo adicional.",
  },
  {
    id: "sonifera",
    nome: "Munição Sonífera",
    preco: 120,
    bonusDano: "1d4",
    detalhe: "Carga de impacto com agente sedativo de ação curta.",
    efeito: "O alvo testa Firmeza para não ficar sonolento.",
  },
];

const ARMAS = [
  {
    id: "pistola",
    nome: "Pistola",
    quantidade: 8,
    unicas: [
      { id: "perfurante", nome: "Munição Perfurante", preco: 125, bonusDano: "1d4", detalhe: "Núcleo rígido para atravessar proteção leve.", efeito: "Ignora parte da Defesa do alvo." },
      { id: "emp", nome: "Munição EMP", preco: 150, bonusDano: "1d4", detalhe: "Descarga compacta contra dispositivos eletrônicos.", efeito: "Pode desativar equipamento eletrônico simples." },
      { id: "marcadora", nome: "Munição Marcadora", preco: 110, bonusDano: "+1", detalhe: "Projétil com pigmento rastreável de alta aderência.", efeito: "Percepção +2 para rastrear o alvo marcado." },
      { id: "paralisante", nome: "Munição Paralisante", preco: 155, bonusDano: "1d4", detalhe: "Carga de choque para interromper movimentos.", efeito: "O alvo testa Firmeza para não ficar paralisado." },
    ],
  },
  {
    id: "fuzil",
    nome: "Fuzil",
    quantidade: 12,
    unicas: [
      { id: "blindada", nome: "Munição Blindada", preco: 175, bonusDano: "1d8", detalhe: "Projétil de liga densa para longas rajadas.", efeito: "Ignora parte da Defesa do alvo." },
      { id: "fragmentadora", nome: "Munição Fragmentadora", preco: 165, bonusDano: "1d6", detalhe: "Projétil que se fragmenta após o impacto.", efeito: "Pode atingir um alvo adjacente com metade do bônus." },
      { id: "rastreadora", nome: "Munição Rastreadora", preco: 145, bonusDano: "+1", detalhe: "Carga com emissor de sinal de curta duração.", efeito: "Percepção +3 para localizar o alvo por uma cena." },
      { id: "supressora", nome: "Munição Supressora", preco: 150, bonusDano: "1d4", detalhe: "Carga de alto impacto para manter inimigos em cobertura.", efeito: "O alvo sofre −2 no próximo teste de ataque." },
    ],
  },
  {
    id: "escopeta",
    nome: "Escopeta",
    quantidade: 6,
    unicas: [
      { id: "chumbo-grosso", nome: "Cartucho Chumbo Grosso", preco: 155, bonusDano: "2d6", detalhe: "Pellets largos para dano devastador em curta distância.", efeito: "O bônus só se aplica em alcance curto." },
      { id: "sal-prata", nome: "Cartucho de Sal e Prata", preco: 170, bonusDano: "1d8", detalhe: "Carga ritualizada para criaturas vulneráveis a prata.", efeito: "Dano dobrado contra alvo vulnerável à prata." },
      { id: "rede", nome: "Cartucho de Rede", preco: 140, bonusDano: "1d4", detalhe: "Rede expansiva para conter um alvo em fuga.", efeito: "O alvo testa Firmeza para não ficar imobilizado." },
      { id: "brecha", nome: "Cartucho de Brecha", preco: 180, bonusDano: "1d10", detalhe: "Carga concentrada para portas e proteções rígidas.", efeito: "Causa dano dobrado contra objetos e barreiras." },
    ],
  },
  {
    id: "rifle",
    nome: "Rifle",
    quantidade: 8,
    unicas: [
      { id: "precisao", nome: "Munição de Precisão", preco: 180, bonusDano: "1d8", detalhe: "Projétil estabilizado para tiros calculados à distância.", efeito: "Percepção +2 no próximo ataque de precisão." },
      { id: "anti-material", nome: "Munição Antimaterial", preco: 220, bonusDano: "2d6", detalhe: "Núcleo pesado para atravessar coberturas rígidas.", efeito: "Ignora cobertura leve e parte da Defesa." },
      { id: "silenciosa", nome: "Munição Silenciosa", preco: 160, bonusDano: "1d4", detalhe: "Carga sub-sônica para abates discretos.", efeito: "Furtividade +2 após um disparo bem-sucedido." },
      { id: "calibre-frio", nome: "Munição de Calibre Frio", preco: 175, bonusDano: "1d6", detalhe: "Projétil criogênico que fragiliza o ponto atingido.", efeito: "O alvo sofre −2 em Firmeza até o fim do turno." },
    ],
  },
  {
    id: "arco",
    nome: "Arco",
    quantidade: 5,
    unicas: [
      { id: "farpada", nome: "Flecha Farpada", preco: 95, bonusDano: "1d6", detalhe: "Ponta com farpas para ferimentos difíceis de tratar.", efeito: "Causa sangramento se o alvo falhar em Firmeza." },
      { id: "cabo", nome: "Flecha de Cabo", preco: 85, bonusDano: "1d4", detalhe: "Flecha ligada a cabo fino para escalada e recuperação.", efeito: "Firmeza +2 para travessia após fixar a flecha." },
      { id: "concussao", nome: "Flecha de Concussão", preco: 110, bonusDano: "1d6", detalhe: "Ponta amortecida para neutralizar sem perfurar.", efeito: "O alvo testa Firmeza para não ficar atordoado." },
      { id: "prata", nome: "Flecha de Prata", preco: 120, bonusDano: "1d8", detalhe: "Ponta de prata tratada para alvos anormais.", efeito: "Dano dobrado contra alvo vulnerável à prata." },
    ],
  },
];

export const CATALOGO_MUNICOES_ESPECIAIS = ARMAS.flatMap((arma) =>
  [...MUNICOOES_BASE, ...arma.unicas].map((municao) =>
    criarMunicao(arma, municao),
  ),
);
