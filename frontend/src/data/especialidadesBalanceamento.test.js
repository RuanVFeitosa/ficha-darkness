import {arvoresHabilidades} from './Classes/arvoresHabilidades';
import {balancearEspecialidade,balancearTrilhaEspecialidade} from './especialidadesBalanceamento';
import {prepararUso,aplicarUso} from '../utils/absolutoHabilidadeUso';
import {resetarEfeitosCena} from '../utils/novaCena';
const trilhas=Object.values(arvoresHabilidades).flatMap(a=>a.especialidades);
const habilidades=trilhas.flatMap(t=>t.habilidades);
test('todas as 30 Especialidades e 260 habilidades têm custos e limites definidos',()=>{
 expect(trilhas).toHaveLength(30);expect(habilidades).toHaveLength(260);
 for(const t of trilhas) expect(balancearTrilhaEspecialidade(t)).toEqual(t);
 for(const h of habilidades){
  const m=h.balanceamentoEspecialidade;
  expect(m).toBeDefined();expect(balancearEspecialidade(h)).toEqual(h);
  expect(h.custoAtivacao).toBe(m.passiva?0:m.nivel<=3?1:m.nivel<=6?2:3);
  const uso=prepararUso({...h,grupo:'Especialismo'});
  expect(uso.custoAtivacao).toBe(h.custoAtivacao);expect(uso.limiteUso).toBe(m.limite);
 }
});
test('reduz ataques infinitos, imunidade e regeneração repetida de PE',()=>{
 const find=id=>habilidades.find(h=>h.id===id);
 expect(find('golpes-consecutivos').descricao).toContain('dois ataques');
 expect(find('fortaleza-mental').descricao).toContain('Não concede imunidade');
 expect(find('sede-de-sangue').descricao).toContain('1 Esperança');
 expect(find('sede-de-sangue').balanceamentoEspecialidade.limite).toBe('cena');
 expect(find('durao').descricao).toContain('Não soma Fortitude à Defesa');
});
test('nova cena renova uso da Especialidade sem encerrar efeitos e sem alterar o custo das Absolutas',()=>{
 const h={...habilidades.find(h=>h.id==='golpes-consecutivos'),grupo:'Especialismo'};
 const p={medo:0,esperanca:{atual:20,max:20}};
 const next=aplicarUso(p,h);
 expect(next.esperanca.atual).toBe(17);
 expect(()=>aplicarUso(next,h)).toThrow('Limite');
 const nova=resetarEfeitosCena(next,'nova');
 expect(nova.efeitosHabilidadesAtivos).toBe(next.efeitosHabilidadesAtivos);
 expect(aplicarUso(nova,h).esperanca.atual).toBe(14);
 expect(prepararUso({nome:'Absoluta',grupo:'Habilidade Absoluta',custo:'1 PE'}).custoAtivacao).toBe(10);
});

