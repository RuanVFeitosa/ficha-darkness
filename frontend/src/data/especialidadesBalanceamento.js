import {adaptarTextoRegras} from '../utils/absolutoTextoRegras';

export const EFEITOS_ESPECIALIDADES = {
 'corte-devastador':'Faça um ataque de Violência corpo a corpo com +1 dado. Se acertar, adicione +1 dado de dano. Não soma ou dobra Força no dano.',
 durao:'Ao receber um ataque corpo a corpo, gaste sua reação para receber +2 Proteção somente contra esse ataque. Não soma Fortitude à Defesa ou ao dano.',
 'maos-pesadas':'Quando acertar um ataque desarmado contra um alvo ao seu alcance, pode adicionar +1 dado de dano. Força não é somada ao dano; soqueiras não alteram o Atributo usado no teste.',
 'golpes-consecutivos':'Como ação completa, faça dois ataques desarmados de Violência, cada um contra a Defesa do alvo. Resolva dano separadamente. Esses ataques não podem gerar novos ataques e o custo é pago uma única vez.',
 'postura-defensiva-lutador':'Como ação de preparo, receba +1 Defesa contra o próximo ataque corpo a corpo até o início do próximo turno, máximo 5 por este efeito. Não concede contra-ataque gratuito.',
 'postura-de-duelo':'Como ação de preparo, escolha um adversário ao alcance. Até o início do próximo turno, receba +1 Defesa contra o próximo ataque corpo a corpo dele, máximo 5 por este efeito. Sair do alcance encerra a postura.',
 'postura-defensiva':'Ao usar Esquiva, pode receber +1 Defesa adicional contra um ataque até o início do próximo turno, máximo 5 por este efeito. Não acumula com outras posturas defensivas.',
 'defesa-impecavel':'Como reação antes de sofrer dano de um ataque que acertou, reduza seu dano em 1d6 após a Proteção, mínimo zero. Não transforma o ataque automaticamente em falha.',
 'fortaleza-mental':'Antes de um teste de Determinação contra medo ou influência mental, pode repetir um único dado que não contou como Êxito, aceitando o novo resultado. Não concede imunidade, reduz Medo ou libera Esperança bloqueada.',
 'dancarino-macabro':'Como ação completa, faça um ataque de Violência com cada uma de duas armas leves empunhadas. Resolva cada ataque separadamente; não recebe dados adicionais de dano e nenhum dos ataques gera ataques extras, mesmo em Crítico.',
 'formacao-tatica-contencao':'Como ação de preparo, coordene um aliado na linha de frente e um atirador que possam ouvi-lo. O atirador recebe +1 dado no próximo ataque de Precisão contra uma ameaça engajada pelo primeiro aliado até o fim do próximo turno. Não ganha dados por aliado adicional.',
 'reconhecer-terreno':'Como ação completa, examine o terreno visível com Percepção, DT 2. Se passar, você e até dois aliados recebem +1 dado no próximo teste de Mobilidade para alcançar cobertura até o fim do próximo turno. Não aumenta Defesa permanentemente.',
 'contra-terrorismo-cqb':'Ao entrar em um ambiente fechado que tenha observado antes de avançar, receba +1 dado no primeiro teste de Percepção para detectar uma ameaça. Não aumenta Defesa ou impede o primeiro turno dos inimigos.',
 'coordenacao-de-equipe':'Ao usar uma ação para ajudar um aliado que possa ouvi-lo, conceda +1 dado no próximo teste de Domínio relacionado à orientação até o fim do próximo turno. Não acumula com outra ajuda, não adiciona dano e não funciona se o Medo bloquear ajuda de aliados.',
 'coordenacao-de-ataque':'Como ação de preparo, indique um alvo visível. O próximo ataque de um aliado contra ele até o fim do próximo turno recebe +1 dado. Não aumenta o dano e não se acumula com outra coordenação.',
 'golpe-coordenado':'Após acertar uma ameaça, gaste sua reação para orientar um aliado que possa ouvi-lo. Se o próximo ataque dele contra a mesma ameaça acertar até o fim do próximo turno, adicione +1 dado de dano. Não gera ataque gratuito ou bônus cumulativo.',
 'mestre-da-batalha':'Como ação completa, oriente até dois aliados em alcance curto que possam ouvi-lo. Cada um recebe +1 dado no próximo teste de Domínio que siga a orientação até o fim do próximo turno. Não aumenta Defesa, não concede dano adicional e não acumula com outra orientação.',
 'vitoria-por-estrategia':'Antes do combate, passe um minuto planejando com até dois aliados. Cada um pode receber +1 dado no primeiro teste de Domínio que execute o plano na cena. Não gera bônus pelo combate inteiro ou dano extra.',
 'logica-imbativel':'Após um minuto examinando evidências de um problema, faça Razão com +1 dado. No sucesso, o mestre revela uma inferência útil sustentada pelas evidências. Não resolve automaticamente o mistério ou revela fatos inacessíveis.',
 'instinto-investigativo-aprimorado':'Como ação completa, examine um local acessível com Intuição ou Percepção, DT definida pelo mestre entre 1 e 5. Receba +1 dado no teste; no sucesso, identifique uma ameaça ou pista observável. Não ignora testes ou revela segredos sem evidências.',
 'taticas-de-emboscada':'Após um minuto preparando uma emboscada com um aliado, ele recebe +1 dado no primeiro ataque contra uma ameaça surpreendida. Não concede bônus a todo o grupo e não se acumula com outra preparação.',
 'calma-sob-fogo':'Como reação a um ataque à distância, receba +1 Defesa contra esse ataque, máximo 5 por este efeito. Não concede disparo de retaliação ou modifica ataques já resolvidos.',
 'cascata-de-balas':'Como ação completa, faça dois ataques de Precisão com arma de fogo contra alvos visíveis, sem dados extras. Consuma munição e resolva Defesa e dano de cada ataque separadamente. Não gera ataques adicionais.',
 'executor-noturno':'Ao acertar um ataque de Precisão a partir de uma posição oculta na penumbra, adicione +1 dado de dano. Exige visão real do alvo; não concede visão em escuridão total.',
 'ataque-furtivo':'Quando acertar um alvo surpreendido ou distraído por um aliado com Violência ou Precisão, adicione +1 dado de dano. O mesmo ataque não recebe outro bônus de dano de Ataque Furtivo ou suas evoluções.',
 'assassino-silencioso':'Ao acertar um alvo que não tenha percebido sua presença com uma arma corpo a corpo, adicione +1 dado de dano. Não acumula com Ataque Furtivo ou suas evoluções.',
 'furtivo-letal':'Ao resolver um Ataque Furtivo que acerte, pode repetir um dado de dano que tenha resultado 1, aceitando o novo resultado. Não adiciona dados e não acumula com outra evolução de Ataque Furtivo.',
 'furtivo-mortal':'Um Ataque Furtivo que acerte pode ignorar até 2 pontos de Proteção em vez de receber seu dado adicional de dano. Não ignora Defesa nem acumula com outra evolução de Ataque Furtivo.',
 'furtivo-supremo':'Ao acertar um Ataque Furtivo, escolha seu dado adicional normal ou ignorar até 3 de Proteção. Não recebe os dois benefícios e não acumula com outra evolução de Ataque Furtivo.',
 'golpe-fantasma':'Como ação completa, faça um ataque de Violência ou Precisão contra uma ameaça distraída por um aliado. Receba +1 dado no teste, sem dano extra. Não ataca fora do seu turno e não gera outro Ataque Furtivo.',
 'emboscada-precisa':'Ao iniciar uma emboscada de uma posição oculta, receba +1 dado no primeiro ataque de Violência ou Precisão. Se acertar, o alvo perde sua próxima reação. Não soma Reflexos ao dano ou impede seu turno inteiro.',
 'movimento-fantasma':'Recebe +1 dado em Mobilidade para mover-se silenciosamente quando existir cobertura acessível. Não ignora terreno difícil e não acumula dados com outras passivas.',
 'furia-do-traidor':'Quando acertar uma ameaça real da Continental em combate, pode adicionar +1 dado de dano. Não funciona contra prisioneiros ou aliados e não acumula com outro bônus passivo de dano.',
 'olho-por-olho':'Escolha um tipo de agente da Continental ao adquirir a habilidade. Ao observar seus protocolos antes de agir, receba +1 dado no primeiro ataque contra um agente desse tipo na cena. Não concede Defesa ou novos tipos automaticamente.',
 'metodos-do-abatedouro':'Após observar um adversário por um turno, faça um ataque de Violência ou Precisão com +1 dado contra ele. Se acertar, ignore até 2 de Proteção. Não ignora Defesa e Crítico exige sucesso e dois Finais.',
 'cerco-ao-coracao':'Após dez minutos examinando uma instalação acessível da Continental, teste Razão com +1 dado para identificar um ponto vulnerável plausível. O primeiro ataque que explorar esse ponto ignora até 2 de Proteção, sem multiplicar dano. Não revela estruturas inacessíveis automaticamente.',
 'sombra-rastejante':'Como ação de preparo, mova-se até metade do deslocamento entre duas coberturas acessíveis. Faça Mobilidade contra DT definida pelo mestre para manter-se oculto. Não teletransporta ou atravessa obstáculos.',
 'forca-indomita':'Após sofrer um Crítico de uma ameaça real, pode receber +1 dado no próximo teste de Vigor antes do fim do próximo turno. Não recupera Esperança.',
 'instinto-desafiador':'Quando estiver em desvantagem numérica e junto a uma cobertura acessível, pode gastar sua reação para receber +1 Defesa contra um ataque, máximo 5 por este efeito.',
 'quebrar-correntes':'Como ação completa, teste Vigor ou Mobilidade com +1 dado contra DT definida pelo mestre, entre 1 e 5, para escapar de uma restrição física. Não concede fuga automática ou rompe contenções indestrutíveis.',
 'corrupcao-estrategica':'Após sabotar com sucesso um dispositivo com Razão, indique uma ameaça distraída pela falha. Ela recebe −1 dado no próximo teste de Percepção até o fim do próximo turno. Não reduz Defesa de uma área inteira.',
 'orquestrador-invisivel':'Após criar uma distração com Influência ou Razão, pode receber +1 dado no próximo teste de Mobilidade para esconder-se até o fim do próximo turno. Não aumenta suas defesas.',
 'golpe-implacavel':'Quando obtiver um Crítico, pode repetir um dado de dano que tenha resultado 1. Deve aceitar o novo resultado. Não adiciona dados além do dado normal de Crítico.',
 'sede-de-sangue':'Após derrotar uma ameaça real em um confronto, pode recuperar 1 Esperança quando o perigo imediato terminar. Não funciona contra prisioneiros, aliados ou adversários indefesos e não funciona com Esperança bloqueada pelo Medo.',
 'desdem-pela-fraqueza':'Após derrotar uma ameaça real em um confronto, pode recuperar 1 PI em uma região ainda funcional. Não regenera regiões inutilizadas nem funciona contra prisioneiros ou aliados.',
};

const plain=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const romanos={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10};
export function balancearEspecialidade(h,index=0) {
 const anterior=h.custoLegado??h.custo??'';
 const original=h.descricaoEspecialidadeOriginal??h.descricao??'';
 const nivel=h.balanceamentoEspecialidade?.nivel||Number(h.nivel)||romanos[h.nivel]||index+1;
 const passiva=plain(anterior).includes('passiva') || (!anterior && /^(recebe|ganha|sua |seus |voce ganha|o dano|enquanto)/.test(plain(original)) && !/gaste|gastar|gasta |acao completa|acao padrao|acao bonus/.test(plain(original)));
 const descricao=adaptarTextoRegras(EFEITOS_ESPECIALIDADES[h.id]||original);
 const simples=passiva && !/dano|cura|recuper|defesa|proteção|reação|repet|imun|autom[aá]tic|ataque|inutil|sangramento|atordo|[+]\d+d/i.test(descricao);
 const limite=/por sess[aã]o|por miss[aã]o|por dia|por descanso/i.test(descricao)?'sessao':simples?null:'cena';
 const custo=passiva?0:nivel<=3?1:nivel<=6?2:3;
 let efeito=descricao.replace(/\b(?:gaste|gasta|gastar|gastando|ao gastar|pode gastar)\s+\d+\s*PE\b/gi,`gaste ${custo} PE`);
 efeito=efeito.replace(/\b[+]\d+\s+(?:de |na )?Defesa\b/gi,'+1 Defesa');
 const regras='Máximo +1 dado no teste e +1 no dano, teto de oito dados por reserva; não acumula com outra habilidade desta Especialidade no mesmo teste. Defesa por este efeito não passa de 5. Não gera cadeias de ataques.';
 return {...h,custoLegado:anterior,descricaoEspecialidadeOriginal:original,custoAtivacao:custo,custo:`${custo} PE${passiva?' · Passiva':''}`,categoriaUso:passiva?'Passiva':'Especialidade',
  descricao:`${limite?`Uma vez por ${limite==='sessao'?'sessão':'cena'}. `:''}${efeito} ${regras}${simples?' Exige a situação descrita e não concede sucesso automático.':' Resolva somente a ação, alvo ou teste indicado; sem duração expressa, o efeito termina no início do próximo turno.'}`,
  balanceamentoEspecialidade:{versao:1,nivel,passiva,constante:simples,limite}};
}

export function balancearTrilhaEspecialidade(e) {
 const passiva=e.passivaEspecialidadeOriginal??e.passiva;
 return {...e,passivaEspecialidadeOriginal:passiva,passiva:passiva?`${adaptarTextoRegras(passiva)} Benefício apenas na situação descrita. Bônus de dados passivos não se acumulam: máximo +1 por teste. Benefícios de Defesa, Proteção, cura ou ações extras só podem ocorrer uma vez por cena e não se acumulam com outra Especialidade.`:passiva,
 habilidades:(e.habilidades||[]).map(balancearEspecialidade)};
}
