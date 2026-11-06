import {REGRAS_ABSOLUTO} from './absolutoRegras';
import {ATTRIBUTES,RESOURCES,GRADES} from './espiral';
import {ATRIBUTOS_ABSOLUTO,DOMINIOS} from './absolutoV1';
export const SHIELD_CATEGORIES=['Todas','Testes','Combate','Recursos','Condução'];
export const normalizeShieldSearch=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const espiral=[
 ['Reserva de dados','Testes','Role 1 dado + Grau do Recurso, acrescido dos modificadores e graus temporários. O tipo de dado vem do Atributo: estágios I a V usam d4, d6, d8, d10 e d12. Uma ação possível mantém pelo menos 1 dado. Use o maior resultado da reserva, incluindo Pressão e dados extras.'],
 ['Margem e resultado','Testes','Margem = maior dado − dificuldade. Margem −3 ou menor: Falha grave; −2 ou −1: Falha; 0: Sucesso com consequência; +1 ou +2: Sucesso; +3 ou maior: Sucesso excepcional. Domínio não transforma uma falha em sucesso.'],
 ['Dificuldade da cena e do combate','Combate','Separe Ambiente da cena, Ambiente do combate e Conflitos. Durante o combate, use a dificuldade de combate; quando o alvo é um inimigo selecionado, use sua Defesa. A ficha e o resultado compartilhado precisam usar a mesma dificuldade.'],
 ['Pressão, Abalo, Crise e Ruptura','Recursos','Dados de Pressão são d6 adicionais e entram na disputa pelo maior resultado. Conte os resultados 1 apenas nesses dados: nenhum = Controle; um = Abalo; dois = Crise; três ou mais = Ruptura. Em Ruptura, retire 2 de Sanidade ou Esperança e resolva a consequência com o mestre.'],
 ['Domínio','Testes','Na resolução usada pela ficha, dois ou mais resultados máximos entre dados de Atributo e de Pressão indicam Domínio. Para Pressão, o máximo é 6. Isso não converte automaticamente uma falha em sucesso.'],
 ['Impacto e gravidade das lesões','Combate','Impacto = máximo entre 0 e dano − Proteção − Redução. 0: sem lesão; 1–3: Superficial; 4–6: Moderada; 7–9: Grave; 10–12: Crítica; 13 ou mais: Catastrófica em membros, Fatal em Região Crítica. Subtraia somente o Impacto da Integridade. Remover a lesão da lista não cura os pontos perdidos.'],
 ['Efeitos dos ferimentos','Combate','Superficial: normalmente sem penalidade. Moderada: pode impor −1 dado nas ações dependentes da região. Grave: −2 dados nessas ações e algumas podem ser impossíveis. Crítica: perda de função ou risco à vida. Catastrófica não implica amputação automática: considere a arma e as circunstâncias. Fatal exige resolução imediata.'],
 ['Integridade e sobrevivência','Recursos','A tabela de criação usada pela ficha é 25 + 5 × estágio de Pulso. Ao chegar a zero, use o teste de sobrevivência Pulso + Propósito. Na ficha, falhar acrescenta uma Falha de sobrevivência e obter margem não negativa remove uma, no intervalo de 0 a 3. Resolva ferimentos incompatíveis com a vida conforme a ficção.'],
 ['Sanidade, Esperança e resistências','Recursos','Sanidade zero provoca Ruptura imediata e Controle Mental recebe +1d6 de Pressão. Controle Mental e Propósito começam em Grau I, fora dos 10 pontos de Recursos convencionais. O gasto de Esperança de cada habilidade está na própria descrição; os custos não são bônus de rolagem.'],
 ['Vertentes e habilidades','Recursos','A Vertente define uma habilidade com até três níveis. Consulte a descrição de cada nível para frequência e efeitos. Habilidades adquiridas e aprimoramentos consomem os Pontos de Evolução concedidos pelo mestre. Bônus temporários têm usos limitados e não alteram permanentemente o Grau do Recurso.'],
];
export function masterShieldEntries(system){
 const rules=system==='espiral'?espiral.map(([titulo,categoria,texto],i)=>({id:`espiral-${i}`,titulo,categoria,texto,fonte:'Regras implementadas na ficha ESPIRAL'}))
 : REGRAS_ABSOLUTO.map((rule,i)=>({...rule,id:`absoluto-${i}`,categoria:/Combate|Integridade|Finais|Equipamentos|Ritos|horror/.test(rule.titulo)?'Combate':/Sanidade|Esperança|Medo|Memento|evolução|existência/.test(rule.titulo)?'Recursos':'Testes',fonte:rule.paginas.includes('autor')?rule.paginas:`Protocolo Absoluto · ${rule.paginas}`}));
 const removed=new Set(['dominio','dificuldade da cena e do combate','integridade e sobrevivencia','vertentes e habilidades']);
 const references=system==='espiral' ? [
  {id:'espiral-atributos',titulo:'Atributos',categoria:'Testes',texto:Object.values(ATTRIBUTES).map(attribute=>`${attribute.name} — ${attribute.hint}.\n${attribute.stages.map((stage,i)=>`${i+1}: ${stage} (d${i*2+4})`).join(' · ')}`).join('\n\n'),fonte:'Atributos da ficha ESPIRAL'},
  {id:'espiral-recursos',titulo:'Recursos',categoria:'Recursos',texto:`${RESOURCES.join(' · ')}\n\n${GRADES.map((grade,i)=>`Grau ${i}: ${grade}`).join('\n')}\n\nReserva: 1 dado + Grau do Recurso. O Atributo define as faces dos dados.`,fonte:'Recursos da ficha ESPIRAL'},
 ] : [
  {id:'absoluto-atributos',titulo:'Atributos',categoria:'Testes',texto:Object.values(ATRIBUTOS_ABSOLUTO).join(' · '),fonte:'Protocolo Absoluto 1.0'},
  {id:'absoluto-dominios',titulo:'Domínios',categoria:'Recursos',texto:Object.values(DOMINIOS).map(domain=>`${domain.nome} (${ATRIBUTOS_ABSOLUTO[domain.atributo]}) — ${domain.descricao}`).join('\n\n'),fonte:'Protocolo Absoluto 1.0'},
 ];
 const removedAbsoluto=new Set(['a existencia humana','atributos e dominios','integridade regional','combate narrativo e dano','arquetipos, classes e evolucao','memento mori','equipamentos, criacao e maleta','o horror, criaturas e condicoes']);
 const selected=rules.filter(rule=>!(system==='espiral'?removed:removedAbsoluto).has(normalizeShieldSearch(rule.titulo)));
 return [...references,...selected];
}
