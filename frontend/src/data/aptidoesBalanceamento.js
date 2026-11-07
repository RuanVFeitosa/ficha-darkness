import {balancearAbsoluta} from './absolutasBalanceamento';
import {balancearTrilhaEspecialidade} from './especialidadesBalanceamento';
// Passivas oficiais: a condição deve ser verificada na mesa antes de usar.
const constante = descricao => ({modo:'constante',limite:null,descricao});
const cena = descricao => ({modo:'gatilho',limite:'cena',descricao:`Uma vez por cena, ${descricao}`});
const sessao = descricao => ({modo:'gatilho',limite:'sessao',descricao:`Uma vez por sessão, ${descricao}`});
export const PASSIVAS_BALANCEADAS = {
 'tanque-apocalipse':cena('quando uma região não vital seria reduzida a 0 PI por um ataque, pode mantê-la com 1 PI. Deve gastar sua reação e fica sem deslocamento até o próximo turno. Não impede morte por lesão em região vital.'),
 indomavel:cena('ao receber dano de um tipo escolhido no início da cena, pode gastar sua reação para receber +2 Proteção somente contra esse ataque. Não aumenta a Defesa. O tipo só pode ser trocado em interlúdio.'),
 'recuperacao-rapida':cena('quando sua Sanidade cair abaixo da metade, pode recuperar 1d6 PI em uma região ainda funcional como ação de preparo. Não regenera regiões inutilizadas e não restaura Sanidade.'),
 'passo-inabalavel':constante('Recebe +1 dado em testes para resistir a empurrões, puxões ou quedas enquanto estiver apoiado em solo firme. Não concede imunidade a agarramentos nem ignora terreno difícil. Não acumula dados com outras Aptidões passivas.'),
 'vigor-batalha':cena('a partir do terceiro turno consecutivo em combate, pode receber +1 dado em um ataque corpo a corpo. Deve permanecer engajado com o alvo até resolver o ataque. Não aumenta o dano nem acumula dados com outras Aptidões passivas.'),
 'furia-contida':cena('após acertar dois ataques corpo a corpo sem gastar Esperança na cena, pode consumir essa preparação para causar +1 dado de dano em um ataque corpo a corpo que acerte. Não gera Crítico automático e não acumula dados de dano com outras Aptidões passivas.'),
 'olho-de-aguia':constante('Recebe +1 dado em Percepção para observar um alvo distante e visível quando puder parar para examiná-lo. Não atravessa escuridão, obstáculos ou cobertura e não aumenta o alcance da arma. Não acumula dados com outras Aptidões passivas.'),
 'pronuncia-instintiva':constante('Após ouvir pelo menos um minuto de conversa em uma língua, pode comunicar cumprimentos, pedidos simples e avisos nessa língua. Não permite ler, traduzir conceitos complexos ou dispensar testes sociais.'),
 'kit-de-sobrevivencia-urbana':cena('após um minuto examinando um ambiente urbano, pode testar Razão para localizar uma saída, um esconderijo ou um contato plausível. O sucesso revela uma possibilidade, sem garantir segurança, acesso ou cooperação.'),
 'mente-analitica':constante('Recebe +1 dado em Razão para analisar mecanismos, padrões ou códigos quando dispõe de ferramentas ou evidências relevantes e de pelo menos um minuto de observação. Não reduz o tempo de análise nem acumula dados com outras Aptidões passivas.'),
 'negociador-nato':constante('Recebe +1 dado em Influência durante uma negociação em que ofereça algo concreto de interesse da outra parte. Não concede desconto automático nem bônus de Intimidação. Não acumula dados com outras Aptidões passivas.'),
 'mapa-mental':constante('Pode recordar rotas que percorreu conscientemente e reconhecer pontos de referência já observados. Não revela caminhos desconhecidos e não substitui testes em locais alterados ou sem referências.'),
 'palavra-chave':cena('após um minuto de conversa, pode gastar sua ação para sugerir uma tarefa simples e inofensiva por uma palavra combinada. Resolva um teste de Influência contra a resistência definida pelo mestre. A sugestão não força violência, autoagressão ou abandono de convicções; uma recusa encerra a tentativa.'),
 'arquivo-vivo':cena('ao investigar um assunto que estudou de forma confiável, pode pedir ao mestre uma informação factual pertinente que seu personagem já conhecia. Não revela segredos nunca aprendidos nem garante uma pista decisiva ou sucesso automático na investigação.'),
 'maos-firmes':cena('quando falhar em um teste de estabilização com ferramentas médicas, pode gastar sua reação para impedir a perda adicional de PI do paciente até o próximo turno. O paciente continua em risco e precisa de novo atendimento; a falha não vira sucesso.'),
 'anatomia-aplicada':constante('Recebe +1 dado em Razão para diagnosticar ferimentos, doenças ou venenos após examinar o paciente com material médico. Não concede bônus de ataque ou cura. Não acumula dados com outras Aptidões passivas.'),
 'estoque-organizado':sessao('antes de sair para a missão, pode reservar uma dose extra de um consumível médico comum que já possua. O mestre verifica o estoque; a dose só pode ser usada no atendimento e não pode ser vendida, guardada para outra sessão ou multiplicada.'),
 'recuperacao-supervisionada':cena('durante dez minutos de repouso seguro e com material médico consumido, pode tratar um aliado para recuperar +1d6 PI em uma região funcional. O mesmo paciente só recebe uma Recuperação Supervisionada por cena, independentemente do número de médicos.'),
 'dosagem-segura':cena('ao curar PI com material ou habilidade médica, pode repetir um único dado de cura que tenha resultado 1. Deve aceitar o novo resultado; não repete a rolagem inteira nem se aplica a dano.'),
 'olhos-nos-omens':constante('Recebe +1 dado em Percepção para notar uma emboscada enquanto estiver consciente e ativamente vigiando. Não impede surpresa automaticamente nem detecta intenções ocultas. Não acumula dados com outras Aptidões passivas.'),
 'estilo-de-combate-sujo':cena('ao acertar um ataque corpo a corpo contra um alvo distraído por um aliado, pode abrir mão de qualquer dado de vantagem nesse ataque para causar +1 dado de dano. A distração precisa existir antes do teste; não acumula dados de dano com outras Aptidões passivas.'),
 'sussurros-da-continental':cena('em interlúdio, pode consultar um contato acessível e fazer um teste de Influência para obter um rumor sobre a Continental. Exige tempo e exposição da sua identidade ao contato. A informação pode ser incompleta e não é automaticamente verdadeira.'),
 'sem-marcas-sem-rastros':constante('Recebe +1 dado em Mobilidade para esconder seus rastros em ambiente urbano, desde que disponha de um minuto e uma rota de saída. Não impõe desvantagem permanente aos perseguidores. Não acumula dados com outras Aptidões passivas.'),
 'kit-de-sobrevivencia-urbana-extrema':cena('após dez minutos explorando uma área urbana degradada, pode testar Razão para encontrar um abrigo ou acesso de manutenção plausível. Deve se expor à exploração; não garante que o local esteja vazio ou seguro.'),
 'resistencia-ao-interrogatorio':constante('Recebe +1 dado em Determinação para resistir a um interrogatório enquanto mantiver consciência e puder se concentrar em uma convicção. Não concede imunidade a drogas ou tortura nem torna mentiras indetectáveis. Não acumula dados com outras Aptidões passivas.'),
 'sem-patria-sem-lei':cena('quando sofrer dano mental diretamente ligado a culpa, lealdade ou remorso, pode gastar sua reação para receber +2 Proteção somente contra esse dano. Não concede imunidade a efeitos sociais e não altera sua Defesa.'),
 'face-do-inimigo':cena('ao derrotar uma ameaça real da Continental em um confronto, pode recuperar 1 Esperança após o perigo imediato terminar. Não funciona com aliados, prisioneiros ou inimigos indefesos e não permite ultrapassar o máximo. Não recupera Esperança enquanto o Medo a bloquear.'),
 'cicatrizes-que-ensinam':cena('no primeiro turno de um combate em que possa ver a ameaça, pode gastar sua ação de preparo para observar um inimigo. Se seu próximo ataque contra ele acertar antes do fim do turno seguinte, o alvo perde uma reação. Não concede bônus permanente à iniciativa.'),
};

export function balancearAptidao(aptidao) {
 const regra=PASSIVAS_BALANCEADAS[aptidao.id];
 if(!regra) return aptidao;
 return {...aptidao,descricao:regra.descricao,custo:'0 PE · Passiva',custoLegado:'Passiva',custoAtivacao:0,categoriaUso:'Passiva',
  balanceamentoPassiva:{versao:1,modo:regra.modo,limite:regra.limite}};
}

export const balancearArvore = arvore => ({...arvore,aptidoes:(arvore.aptidoes||[]).map(balancearAptidao),absolutas:(arvore.absolutas||[]).map(balancearAbsoluta),especialidades:(arvore.especialidades||[]).map(balancearTrilhaEspecialidade)});
