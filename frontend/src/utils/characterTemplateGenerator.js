import { dominiosIniciais } from '../data/absolutoV1';
import { freshSheet, creationWarnings, integrityMax, VERTENTE_HABILIDADES } from '../data/espiral';
import { CATALOGO_ESPIRAL } from '../data/catalogoEspiral';
import { grantEspiralCatalogEntry } from './espiralCatalogGrant';

export const IDEIAS_PERSONAGEM = [
  { id:'combate', nome:'Forte e combatente', descricao:'Presença física, resistência e confronto direto.', classes:['aniquilador','renegado'], arquetipos:['lutador','soldado','sobrevivente'], ordem:['forca','fonitude','reflexos','vontade','inteligencia'], espiral:['pulso','sentido','razao','voz'], recursos:['Armas','Atletismo','Sobrevivência','Pontaria'], vertentes:['Agressiva','Resiliente'], kit:'sobrevivencia' },
  { id:'investigacao', nome:'Investigador e ágil', descricao:'Pistas, percepção e rapidez para agir.', classes:['especialista','atiradorElite'], arquetipos:['investigador','detetive-caido','cacador-urbano'], ordem:['inteligencia','reflexos','vontade','fonitude','forca'], espiral:['razao','sentido','pulso','voz'], recursos:['Investigação','Subterfúgio','Atletismo','Tecnologia'], vertentes:['Metódica','Vigilante'], kit:'investigacao' },
  { id:'suporte', nome:'Curador e protetor', descricao:'Medicina, cuidado e sobrevivência em equipe.', classes:['medicoDeCampo'], arquetipos:['medico','cientista','sobrevivente'], ordem:['inteligencia','vontade','fonitude','reflexos','forca'], espiral:['razao','voz','pulso','sentido'], recursos:['Medicina','Sobrevivência','Técnica','Influência'], vertentes:['Resiliente','Adaptável'], kit:'medicina' },
  { id:'furtivo', nome:'Furtivo e preciso', descricao:'Infiltração, dissimulação e ataques calculados.', classes:['renegado','atiradorElite'], arquetipos:['fantasma','cacador-urbano','mercenario'], ordem:['reflexos','inteligencia','forca','fonitude','vontade'], espiral:['sentido','pulso','razao','voz'], recursos:['Subterfúgio','Dissimulação','Pontaria','Atletismo'], vertentes:['Vigilante','Adaptável'], kit:'infiltracao' },
  { id:'social', nome:'Carismático e estrategista', descricao:'Influência, leitura social e planejamento.', classes:['especialista'], arquetipos:['orador','manipulador','estrategista'], ordem:['vontade','inteligencia','reflexos','fonitude','forca'], espiral:['voz','razao','sentido','pulso'], recursos:['Influência','Dissimulação','Investigação','Condução'], vertentes:['Influente','Metódica'], kit:'comunicacao' },
  { id:'aleatorio', nome:'Surpreenda-me', descricao:'Uma combinação aleatória das opções do sistema.' },
];
const escolher = (lista, random) => lista[Math.min(lista.length - 1, Math.floor(random() * lista.length))];
const copiar = valor => JSON.parse(JSON.stringify(valor));

export async function gerarPersonagemTemplate(sistema, ideiaId, perfil, random = Math.random) {
  if (!['darkness','espiral'].includes(sistema)) throw new Error('Escolha um sistema válido.');
  const aleatorio = ideiaId === 'aleatorio';
  const ideia = aleatorio ? escolher(IDEIAS_PERSONAGEM.slice(0,-1),random) : IDEIAS_PERSONAGEM.find(i => i.id === ideiaId);
  if (!ideia) throw new Error('Escolha uma ideia para o personagem.');
  const nome = `${escolher(['Lia','Caio','Helena','Dante','Íris','Noah','Maya','Raul'],random)} ${escolher(['Vale','Moura','Torres','Reis','Nunes','Vilar','Costa','Dias'],random)}`;
  if (sistema === 'espiral') {
    let sheet = freshSheet();
    sheet.name = nome; sheet.player = perfil.nome; sheet.pronoun = perfil.pronome || '';
    sheet.occupation = ideia.nome; sheet.purpose = `Usar seus talentos para proteger o grupo. ${ideia.descricao}`;
    const estagios = random() < .5 ? [4,4,2,2] : [4,3,3,3];
    sheet.attributes = Object.fromEntries(ideia.espiral.map((chave,i) => [chave,estagios[i]]));
    sheet.resources = { ...freshSheet().resources };
    ideia.recursos.forEach((r,i) => { sheet.resources[r] = [2,2,2,1][i]; });
    sheet.vertente = escolher(aleatorio ? Object.keys(VERTENTE_HABILIDADES) : ideia.vertentes,random);
    sheet.integrity = integrityMax(sheet.attributes.pulso);
    // Kit de teste usa as mesmas entradas e conversões da loja.
    const kit = CATALOGO_ESPIRAL.filter(e => e.category === ideia.kit && e.type === 'item');
    for (const entry of kit.slice(0,2)) sheet = { ...sheet, ...grantEspiralCatalogEntry(sheet,entry,`template-${entry.id}`) };
    const warnings = creationWarnings(sheet).messages;
    if (warnings.length) throw new Error(warnings.join(' '));
    sheet.notes = 'Personagem de teste gerado por template. Kit inicial de teste; revise com o mestre antes de uma campanha.';
    return sheet;
  }
  const { classesPersonagem, arquetiposPersonagem, calcularRecursosClasse, criarFichaInicial } = await import('../pages/criarPersonagem');
  const classe = escolher(aleatorio ? classesPersonagem : classesPersonagem.filter(c => ideia.classes.includes(c.id)),random);
  const arquetipo = escolher(aleatorio ? arquetiposPersonagem : arquetiposPersonagem.filter(a => ideia.arquetipos.includes(a.id)),random);
  const atributos = Object.fromEntries(ideia.ordem.map((chave, i) => [chave, [3,2,2,1,1][i]]));
  const dominios = dominiosIniciais();
  const prioridade = { combate:['violencia','vigor','mobilidade'], investigacao:['razao','percepcao','mobilidade'], suporte:['razao','intuicao','vigor'], furtivo:['mobilidade','precisao','percepcao'], social:['influencia','intuicao','determinacao'] }[ideia.id];
  prioridade.forEach((k,i) => { dominios[k] = i < 2 ? 2 : 1; });
  const recursos = calcularRecursosClasse(classe,atributos);
  const personagem = copiar(criarFichaInicial({nome,nomeJogador:perfil.nome,pronome:perfil.pronome || '',classe:classe.nome,classeId:classe.id,classeDetalhes:classe,arquetipo,arquetipoId:arquetipo.id,fotoPerfil:'',existenciaPontos:100,atributos,dominios,integridade:{},custoDominios:null,sanidadeInicial:Math.max(0,recursos.sanidade),esperancaInicial:Math.max(0,recursos.esperanca)}));
  personagem.criacaoPendenteV1 = false;
  personagem.anotacao = 'Modelo de teste Absoluto 1.0. Atributos e Domínios dentro do orçamento de 100 EX. Revise a identidade e os equipamentos com o Narrador.';
  return personagem;
}

export function clonarModeloPersonagem(modelo, perfil) {
  const dados = copiar(modelo.dados);
  for (const chave of ['id','codigo','codigoFicha','fichaId','tipo']) delete dados[chave];
  if (modelo.sistema === 'espiral') {
    dados.name = `${dados.name || modelo.nome} · cópia`; dados.player = perfil.nome;
    dados.tabletopTokenImage = '';
  } else { dados.nome = `${dados.nome || modelo.nome} · cópia`; dados.nomeJogador = perfil.nome; }
  return dados;
}
