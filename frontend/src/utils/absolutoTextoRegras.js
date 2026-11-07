import {ABSOLUTAS_BALANCEADAS,balancearAbsoluta} from '../data/absolutasBalanceamento';
const DOMINIOS_ANTIGOS = [
 [/\bConhecimento M[ée]dico\b/g,'Razão'],[/\bInvestiga[çc][aã]o\b/g,'Razão'],
 [/\bCrime\b/g,'Mobilidade'],[/\bInstinto\b/g,'Intuição'],[/\bFurtividade\b/g,'Mobilidade'],
 [/\bDiplomacia\b/g,'Influência'],[/\bIntimida[çc][aã]o\b/g,'Influência'],[/\bEngana[çc][aã]o\b/g,'Influência'],
 [/\bAtletismo\b/g,'Vigor'],[/\bAcrobacia\b/g,'Mobilidade'],[/\bSobreviv[êe]ncia\b/g,'Intuição'],
 [/\bDestreza\b/g,'Reflexos'],[/\bConstitui[çc][aã]o\b/g,'Fortitude'],[/\bCarisma\b/g,'Influência'],
 [/\bPersist[êe]ncia\b/g,'Determinação'],[/\bFirmeza\b/g,'Mobilidade'],
];

export function adaptarTextoRegras(texto) {
 for(const [padrao,atual] of DOMINIOS_ANTIGOS) texto=texto.replace(padrao,atual);
 texto=texto.replace(/\bCD\s*(?:=|baseada?\s+(?:em|no|na))\s*[^.;)]+/gi,'DT definida pelo mestre, entre 1 e 5');
 texto=texto.replace(/\bCD\s*\d+\s*\+\s*[^.;)]+/gi,'DT definida pelo mestre, entre 1 e 5');
 texto=texto.replace(/\bCD\s*(\d+)\b/gi,(_,n)=>`DT ${Number(n)<=10?1:Number(n)<=15?2:Number(n)<=18?3:Number(n)<=22?4:5}`);
 texto=texto.replace(/\b(?:modificador|mod\.)\s+(?:de\s+)?(?:Reflexos|Fortitude|Força|Inteligência|Vontade|Razão|Influência)\s+(?:no lugar|em vez)\s+(?:de\s+)?(?:Força|Reflexos)(?:\s+ou\s+(?:Força|Reflexos))?/gi,'Atributo correspondente ao Domínio escolhido');
 texto=texto.replace(/vantagem dupla\s*\([^)]*\)/gi,'+1 dado').replace(/\bvantagem\s*\([+−-]?\d+(?:\s*no dado)?\)/gi,'+1 dado').replace(/\bdesvantagem\s*\([^)]*\)/gi,'−1 dado');
 texto=texto.replace(/\bvantagem\s*\(\+1 dado\)/gi,'+1 dado').replace(/\bdesvantagem\s*\(−1 dado\)/gi,'−1 dado');
 texto=texto.replace(/\b(recebe|recebem|ganha|ganham|com|tem|terá) vantagem\b/gi,'$1 +1 dado').replace(/\b(recebe|recebem|com|tem|têm) desvantagem\b/gi,'$1 −1 dado');
 texto=texto.replace(/\btestes? de perícia\b/gi,'teste de Domínio').replace(/\bteste de resist[êe]ncia f[íi]sica\b/gi,'teste de Vigor').replace(/\bteste de resist[êe]ncia mental\b/gi,'teste de Determinação');
 texto=texto.replace(/\bPV\b/g,'PI').replace(/\b0 Vida\b/g,'0 PI').replace(/\b1 Vida\b/g,'1 PI');
 return texto;
}

// Efeitos que dependiam de d20, margem ou soma de pontos exigem adaptação própria.
export const HABILIDADES_ADAPTADAS = {
 'paciencia-de-predador':'Após um turno inteiro imóvel observando um alvo visível, seu próximo ataque de Precisão contra ele recebe +1 dado. Reflexos define a reserva e Precisão define as faces de Êxito. O Crítico exige sucesso e pelo menos dois Finais.',
 'zero-absoluto':'Como ação completa, faça um ataque de Precisão contra um alvo visível dentro do alcance máximo da arma, com +1 dado e ignorando cobertura parcial. O ataque exige os Êxitos da Defesa do alvo; não acerta automaticamente.',
 'franco-atirador':'Ao atacar com arma de fogo após mirar, recebe +1 dado em Precisão e ignora cobertura parcial. O Crítico exige sucesso e pelo menos dois Finais.',
 'agressao-continua':'Enquanto estiver machucado, seu primeiro ataque de Violência ou Precisão em cada cena recebe +1 dado. Não altera as faces de Êxito ou a exigência de dois Finais para Crítico.',
 'arsenal-destruidor':'Ataques com armas de alto calibre causam +1 dado de dano. Pode gastar 4 PE antes de atacar para receber +1 dado em Precisão. O teto é oito dados por rolagem; o Crítico segue a regra de sucesso e dois Finais.',
 'fogo-concentrado':'Gaste uma ação de preparo para mirar em um ponto visível. Seu próximo ataque de Precisão recebe +1 dado. Se obtiver sucesso e dois Finais, o Crítico adiciona um dado de dano, até oito. Se errar, não causa dano.',
 'pericia-avancada':'Escolha um Domínio ao adquirir esta Aptidão. Uma vez por cena, quando tiver tempo e ferramentas adequadas para uma tarefa desse Domínio, receba +1 dado no teste. Não altera o nível do Domínio. A partir do NV5, pode adquirir novamente para outro Domínio; os benefícios não se acumulam no mesmo teste.',
 'ritmo-do-combate':'No início do seu turno, gaste 1 PE e escolha um aliado que possa ouvi-lo. No próximo teste de Domínio dele neste turno, ele recebe +1 dado, até oito. Não rola a reserva inteira duas vezes.',
 'foco-de-precisao':'Como ação completa, faça um único ataque de Violência ou Precisão com +1 dado e ignorando cobertura parcial. A Defesa do alvo define os Êxitos necessários; o Crítico exige sucesso e dois Finais.',
 'calculo-de-probabilidades':'Antes de você ou um aliado visível realizar um teste de Domínio, gaste 1 PE como ação livre para conceder +1 dado à reserva, até oito. Não soma resultados ao teste, não gera dados explosivos e não altera as faces de Êxito do Domínio.',
 'golpe-sombrio':'Ao atacar um inimigo enquanto estiver escondido, recebe +1 dado em Violência ou Precisão. O Crítico exige sucesso e dois Finais; uma falha não causa dano.',
 'analise-rapida-estrategista':'Como ação de preparo, analise uma ameaça visível com Razão (Inteligência), DT 2. Se obtiver sucesso, você ou um aliado recebe +1 dado no próximo teste de Domínio que explorar a informação até o fim da cena.',
 'golpe-baixo':'Ao atacar corpo a corpo um alvo surpreendido ou distraído, faça um teste de Violência com +1 dado. Se acertar, o alvo faz um teste de Vigor contra DT definida pelo mestre, entre 1 e 5; se falhar, fica Incapacitado até o fim do próximo turno. Crítico exige sucesso e dois Finais.',
 'golpe-relampago':'Uma vez por rodada, após realizar um ataque desarmado, pode gastar 1 PE para fazer outro ataque desarmado de Violência. Cada ataque é um teste separado e exige a Defesa do alvo; Crítico exige sucesso e dois Finais.',
 'fisico-sublime':'Seus ataques desarmados causam +1 dado de dano, até oito. Violência define as faces de Êxito; Crítico exige sucesso e pelo menos dois Finais e adiciona um dado de dano, sem multiplicar o resultado.',
 'aperfeicoamento-maximo':'Recebe +1 dado nos testes de Violência com ataques desarmados, até oito. O custo de Golpes Consecutivos diminui em 1 PE, mínimo 1 PE. Não altera as faces de Êxito nem a exigência de dois Finais para Crítico.',
 'grande-desafio':'Gaste 3 PE para observar os pontos vitais de um alvo visível. Até o fim do próximo turno, recebe +3 m ao avançar contra ele e +1 dado no próximo ataque de Violência. Crítico exige sucesso e dois Finais.',
 'golpe-destruidor':'Uma vez por uso de Ataque Especial corpo a corpo, pode trocar o dado adicional do teste por +1 dado de dano caso acerte. Não altera a Defesa do alvo nem as faces de Êxito do Domínio. Cada reserva permanece limitada a oito dados.',
 'mestre-artes-marciais':'Recebe +1 dado em Violência para atacar com armas ágeis e +1 dado no dano desses ataques, respeitando oito dados por rolagem. Força define a reserva e Violência define as faces de Êxito. Crítico exige sucesso e dois Finais.',
 'execucao-final':'Uma vez por combate, declare uma execução contra um alvo comum já incapacitado. Faça um ataque de Violência contra a Defesa dele; se acertar, o alvo faz Vigor, DT definida pelo mestre entre 1 e 5. Se falhar, fica Morrendo. Não elimina automaticamente chefes ou criaturas excepcionais.',
 'o-preco-do-sangue':'Uma vez por cena, ao derrotar um agente da Continental ainda consciente, pode tentar obter uma informação com Influência, DT definida pelo mestre entre 1 e 5. Após a cena, sofre −1 dado em Determinação por uma hora. Não permite conversar com mortos ou garante informação verdadeira.',
 'legado-de-cinzas':'Após destruir uma operação importante da Continental, pode invocar sua reputação em um teste de Influência com +1 dado contra agentes que conheçam o feito. Eles podem resistir com Determinação, DT 3. Não impõe penalidades permanentes ou cumulativas.',
 'cicatrizes-que-sangram':'Recebe +1 dado em Intuição ou Razão ao examinar protocolos ou operações da Continental com evidências pertinentes. Identificar um ex-colega exige Intuição contra DT definida pelo mestre entre 1 e 5; não usa uma perícia de Lealdade.',
 'despertar-forcado':'Gaste 5 PE e uma ação completa para conversar com um agente da Continental que possa ouvi-lo. Faça Influência, DT 5. O sucesso abre uma oportunidade de questionar o condicionamento; não transforma o agente automaticamente em aliado. Na falha, ele percebe a tentativa e pode reagir.',
};

export function adaptarHabilidadeRegras(valor) {
 if(valor.editadoPeloMestre===true)return valor;
 if(ABSOLUTAS_BALANCEADAS[valor.id]) return balancearAbsoluta(valor);
 const descricao=HABILIDADES_ADAPTADAS[valor.id];
 return descricao && typeof valor.descricao==='string' ? {...valor,descricao} : valor;
}
