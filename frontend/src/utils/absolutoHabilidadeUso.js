import { converterCustoUso, custoUsoRito } from '../data/absolutoCustos';
import { rolarDadosAbsoluto } from './absolutoModificadores';
import { alterarMedo, DOMINIOS } from '../data/absolutoV1';
const plain = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function prepararUso(habilidade, tipo='habilidade') {
 const rito=tipo==='rito' || habilidade.tipo==='rito' || habilidade.categoria==='ritos';
 const grupo=['aptidao','habilidade absoluta','especialismo','especialidade'].includes(plain(habilidade.grupo)) ? habilidade.grupo : tipo==='absoluta' || habilidade.tipo==='poderAbsoluto' ? 'Habilidade Absoluta' : 'Aptidão';
 const convertida=rito ? habilidade : converterCustoUso({...habilidade,grupo});
 const custo=rito ? custoUsoRito(habilidade) : plain(grupo)==='habilidade absoluta' ? 10 : convertida.balanceamentoEspecialidade ? convertida.custoAtivacao : convertida.balanceamentoPassiva ? 0 : Number.isFinite(habilidade.custoAtivacao) ? habilidade.custoAtivacao : convertida.custoAtivacao;
 const descricao=convertida.descricao || habilidade.descricao || habilidade.detalhe || habilidade.efeito || habilidade.habilidadePrincipal || '';
 const normal=plain(descricao);
 const limite=convertida.balanceamentoEspecialidade ? convertida.balanceamentoEspecialidade.limite : plain(grupo)==='habilidade absoluta' && !rito ? 'cena' : convertida.balanceamentoPassiva?.limite || (/uma vez por sessao|1x\s*\/\s*sessao/.test(normal) ? 'sessao' : /uma vez por combate|1x\s*\/\s*combate/.test(normal) ? 'combate' : /uma vez por cena|1x\s*\/\s*cena/.test(normal) ? 'cena' : null);
 return {...habilidade,...convertida,custoAtivacao:custo,passiva:!rito && custo===0,descricaoUso:descricao,limiteUso:limite,idUso:`${rito ? 'rito' : tipo}:${habilidade.id || habilidade.nome}`};
}
export function aplicarUso(personagem, habilidade, tipo='habilidade', agora=Date.now()) {
 const uso=prepararUso(habilidade,tipo);
 if(uso.passiva && !uso.limiteUso) throw new Error('Aptidão passiva: permanece ativa sem gasto de PE.');
 if(habilidade.status && habilidade.status!=='aprovada') throw new Error('Aguarde a aprovação do mestre.');
 if(!Number.isInteger(uso.custoAtivacao) || uso.custoAtivacao<0) throw new Error('Custo de ativação inválido.');
 const saldo=Number(personagem.esperanca?.atual)||0;
 if(Number(personagem.medo)>=4 && uso.custoAtivacao>0) throw new Error('A Esperança já não consegue superar o terror.');
 if(saldo<uso.custoAtivacao) throw new Error('PE insuficientes.');
 if(uso.limiteUso && personagem.usosHabilidades?.[uso.idUso]) throw new Error(`Limite de uso por ${uso.limiteUso} atingido.`);
 const efeitos=uso.balanceamentoPassiva || uso.balanceamentoAbsoluta || uso.balanceamentoEspecialidade ? [] : habilidade.efeitosAutomaticos || extrairEfeitosDiretos(uso.descricaoUso);
 if(!Array.isArray(efeitos)) throw new Error('Efeitos automáticos inválidos.');
 let proximo={...personagem,esperanca:{...personagem.esperanca,atual:saldo-uso.custoAtivacao}};
 const aplicados=[];
 for(const efeito of efeitos) {
  if(efeito.tipo==='recurso' && ['esperanca','sanidade'].includes(efeito.recurso) && Number.isFinite(efeito.valor)) {
   const recurso=proximo[efeito.recurso];
   if(!recurso || !Number.isFinite(recurso.max)) throw new Error('Recurso indisponível na ficha.');
   proximo={...proximo,[efeito.recurso]:{...recurso,atual:Math.max(0,Math.min(recurso.max,recurso.atual+efeito.valor))}};
   aplicados.push(`${efeito.recurso}: ${efeito.valor>0?'+':''}${efeito.valor}`);
  } else if(efeito.tipo==='medo' && Number.isInteger(efeito.valor)) {
   // Importado abaixo para usar a regra de Ruptura, sem duplicar seus efeitos.
   proximo=alterarMedo(proximo,efeito.valor); aplicados.push(`Medo: ${efeito.valor>0?'+':''}${efeito.valor}`);
  } else if(efeito.tipo==='dano' && typeof efeito.formula==='string') {
   const resultado=rolarDadosAbsoluto(efeito.formula);
   aplicados.push(`Dano: ${resultado.total} (${resultado.formula}: ${resultado.dados.join(', ')}). Escolha o alvo e aplique as resistências com o mestre.`);
  } else if(efeito.tipo==='dados' && DOMINIOS[efeito.dominio] && [-1,1].includes(efeito.valor)) {
   aplicados.push(`${DOMINIOS[efeito.dominio].nome}: ${efeito.valor>0?'+':''}${efeito.valor} dado enquanto ativo`);
  } else throw new Error('Este efeito precisa ser configurado pelo mestre antes de aplicar.');
 }
 const registro={origemPassiva:uso.passiva,id:`${uso.idUso}:${agora}`,idUso:uso.idUso,nome:uso.nome,custo:uso.custoAtivacao,descricao:uso.descricaoUso,limite:uso.limiteUso,duracao:habilidade.duracao || 'Encerrar após resolver o efeito',efeitos:efeitos.filter(e=>e.tipo==='dados'),aplicados,pendente:Boolean(uso.balanceamentoPassiva) || !habilidade.efeitosAutomaticos || efeitos.some(e=>e.tipo==='dano'),criadoEm:agora};
 if(tipo==='rito') {
  registro.ritoId=habilidade.id || `${habilidade.nome}-${habilidade.index}`;
  proximo={...proximo,ritosAtivos:[...new Set([...(proximo.ritosAtivos||[]),registro.ritoId])]};
 }
 return {...proximo,
  ...(uso.passiva && uso.limiteUso ? {usosPassivas:{...personagem.usosPassivas,[uso.idUso]:uso.limiteUso}} : {}),
  ...(uso.balanceamentoEspecialidade && uso.limiteUso ? {usosEspecialidades:{...personagem.usosEspecialidades,[uso.idUso]:uso.limiteUso}} : {}),
  usosHabilidades:{...personagem.usosHabilidades,...(uso.limiteUso ? {[uso.idUso]:uso.limiteUso} : {})},efeitosHabilidadesAtivos:[...(personagem.efeitosHabilidadesAtivos||[]).filter(e=>e.idUso!==uso.idUso),registro]};
}
export function extrairEfeitosDiretos(descricao) {
 const texto=plain(descricao), efeitos=[];
 // Condições, recorrência e alvos não podem ser inferidos como efeitos próprios.
 if(/\b(se|caso|apos|quando)\b|por turno|cada turno|ao fim|ao final/.test(texto)) return efeitos;
 const dano=texto.match(/\brole\s+(\d+d(?:4|6|8|10|12|20)(?:\s*[+-]\s*\d+)?)\s+de dano/);
 if(dano) efeitos.push({tipo:'dano',formula:dano[1]});
 for(const [dominio,definicao] of Object.entries(DOMINIOS)) {
  const nome=plain(definicao.nome);
  const padrao=new RegExp(`(?:recebe|ganha)\\s+(?:\\+1\\s+dado|vantagem)\\s+em\\s+(?:testes? (?:de )?)?${nome}(?:[.,;]|$)`);
  if(padrao.test(texto)) efeitos.push({tipo:'dados',dominio,valor:1});
 }
 for(const frase of texto.split(/[.!;\n]/)) {
  const cura=frase.trim().match(/^(?:voce |o conjurador )?recupera\s+(\d+)\s+(?:pontos? de |de )?(esperanca|sanidade)$/);
  if(cura) efeitos.push({tipo:'recurso',recurso:cura[2],valor:Number(cura[1])});
 }
 return efeitos;
}
export function bonusHabilidades(personagem,dominio) {
 const registros=personagem.efeitosHabilidadesAtivos||[];
 const soma=lista=>lista.flatMap(e=>e.efeitos||[]).filter(e=>e.tipo==='dados' && e.dominio===dominio).reduce((total,e)=>total+e.valor,0);
 return soma(registros.filter(e=>!e.origemPassiva)) + Math.min(1,soma(registros.filter(e=>e.origemPassiva)));
}
export function renovarUsos(personagem,periodo) {
 const periodos=periodo==='sessao' ? ['cena','combate','sessao'] : periodo==='combate' ? ['cena','combate'] : ['cena'];
 return {...personagem,usosHabilidades:Object.fromEntries(Object.entries(personagem.usosHabilidades||{}).filter(([,limite])=>!periodos.includes(limite)))};
}
export function encerrarEfeito(personagem,id) {
 const registro=(personagem.efeitosHabilidadesAtivos||[]).find(e=>e.id===id);
 return {...personagem,efeitosHabilidadesAtivos:(personagem.efeitosHabilidadesAtivos||[]).filter(e=>e.id!==id),ritosAtivos:(personagem.ritosAtivos||[]).filter(rito=>rito!==registro?.ritoId)};
}
