import {arvoresHabilidades,obterTodasArvores,salvarArvoresCustom} from './Classes/arvoresHabilidades';
import {PASSIVAS_BALANCEADAS,balancearAptidao} from './aptidoesBalanceamento';
import {prepararUso,aplicarUso,bonusHabilidades} from '../utils/absolutoHabilidadeUso';
import {resetarEfeitosCena} from '../utils/novaCena';

const aptidoes=Object.values(arvoresHabilidades).flatMap(a=>a.aptidoes);
test('árvores salvas anteriormente exibem as descrições revisadas sem alterar Aptidões pessoais',()=>{
 const pessoal={id:'minha-aptidao',nome:'Minha Aptidão',descricao:'Efeito do jogador.',custo:'Passiva'};
 try{
  salvarArvoresCustom({especialista:{classe:'Especialista',aptidoes:[{id:'mente-analitica',nome:'Mente Analítica',custo:'Passiva',descricao:'Bônus antigo.'},pessoal]}});
  const atual=obterTodasArvores().especialista.aptidoes;
  expect(atual[0].descricao).toBe(PASSIVAS_BALANCEADAS['mente-analitica'].descricao);
  expect(atual[1]).toMatchObject(pessoal);
 }finally{salvarArvoresCustom({});}
});
test('todas as passivas das cinco classes têm uma regra explícita e mantêm custo zero',()=>{
 const passivas=aptidoes.filter(a=>a.custo.includes('Passiva'));
 expect(passivas).toHaveLength(Object.keys(PASSIVAS_BALANCEADAS).length);
 for(const a of passivas){
  expect(PASSIVAS_BALANCEADAS[a.id]).toBeDefined();
  expect(prepararUso(a).custoAtivacao).toBe(0);
  expect(a.descricao).toBe(PASSIVAS_BALANCEADAS[a.id].descricao);
  expect(balancearAptidao(a)).toEqual(a);
 }
 for(const a of aptidoes.filter(a=>!a.custo.includes('Passiva'))) expect(a.balanceamentoPassiva).toBeUndefined();
});
test('passiva forte consome uso sem PE; Nova Cena renova só seu limite e preserva Ritos e ativas',()=>{
 const a=aptidoes.find(a=>a.id==='dosagem-segura');
 const p={esperanca:{atual:0,max:8},medo:5,usosHabilidades:{'rito:r':'cena'},ritosAtivos:['r']};
 const next=aplicarUso(p,a);
 expect(next.esperanca.atual).toBe(0);
 expect(next.efeitosHabilidadesAtivos[0].pendente).toBe(true);
 expect(()=>aplicarUso(next,a)).toThrow('Limite');
 const nova=resetarEfeitosCena(next,'cena2');
 expect(nova.usosHabilidades['rito:r']).toBe('cena');
 expect(nova.ritosAtivos).toBe(next.ritosAtivos);
 expect(()=>aplicarUso(nova,a)).not.toThrow();
 const estoque=aptidoes.find(a=>a.id==='estoque-organizado');
 const usado=aplicarUso(p,estoque);
 expect(()=>aplicarUso(resetarEfeitosCena(usado,'cena2'),estoque)).toThrow('Limite');
});
test('dados de passivas acumulam no máximo um, mantendo bônus de habilidades ativas separados',()=>{
 const efeito=origemPassiva=>({origemPassiva,efeitos:[{tipo:'dados',dominio:'razao',valor:1}]});
 expect(bonusHabilidades({efeitosHabilidadesAtivos:[efeito(true),efeito(true),efeito(false)]},'razao')).toBe(2);
});
test('uma cópia salva da passiva recebe a regra atual sem converter Ritos ou Absolutas',()=>{
 const old={id:'passo-inabalavel',grupo:'Aptidão',custo:'Passiva',descricao:'Imune a tudo.'};
 expect(prepararUso(old).descricaoUso).toContain('Não concede imunidade');
 expect(prepararUso({...old,grupo:'Habilidade Absoluta'}).descricaoUso).toBe('Imune a tudo.');
});
