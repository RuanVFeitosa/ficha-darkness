import { aplicarUso, prepararUso, bonusHabilidades, renovarUsos, extrairEfeitosDiretos } from './absolutoHabilidadeUso';
import { executarTesteDominio } from './absolutoRolagem';
const base=()=>({esperanca:{atual:8,max:10},sanidade:{atual:9,max:12},atributos:{inteligencia:2},dominios:{razao:1},medo:0});
test('uso desconta PE, aplica recursos com teto e preserva o original',()=>{
 const original=base();
 const next=aplicarUso(original,{id:'cura',nome:'Cura',grupo:'Aptidão',custo:'4 PE',efeitosAutomaticos:[{tipo:'recurso',recurso:'sanidade',valor:10}]});
 expect(next.esperanca.atual).toBe(6);expect(next.sanidade.atual).toBe(12);expect(original.sanidade.atual).toBe(9);expect(next.efeitosHabilidadesAtivos[0].aplicados).toHaveLength(1);
});
test('saldo insuficiente, passiva e efeito inválido não debitam recursos',()=>{
 const p=base();
 expect(()=>aplicarUso({...p,esperanca:{atual:0,max:10}},{nome:'Rito',nivelRito:'absoluto'},'rito')).toThrow('PE insuficientes');
 expect(()=>aplicarUso(p,{nome:'Passiva',custo:'Passiva'})).toThrow('passiva');
 expect(()=>aplicarUso(p,{nome:'Inválida',efeitosAutomaticos:[{tipo:'inventado'}]})).toThrow('configurado');
 expect(p.esperanca.atual).toBe(8);
});
test('condições narrativas ficam pendentes e limite de cena é respeitado',()=>{
 const habilidade={nome:'Execução',custo:'10 PE',descricao:'Uma vez por cena, caso o alvo esteja ferido, execute-o.'};
 const next=aplicarUso(base(),habilidade);
 expect(next.efeitosHabilidadesAtivos[0].pendente).toBe(true);
 expect(()=>aplicarUso(next,habilidade)).toThrow('Limite');
 expect(()=>aplicarUso(renovarUsos(next,'cena'),habilidade)).not.toThrow();
});
test('bônus explícito participa da reserva e desaparece ao encerrar',()=>{
 const next=aplicarUso(base(),{nome:'Foco',efeitosAutomaticos:[{tipo:'dados',dominio:'razao',valor:1}]});
 expect(bonusHabilidades(next,'razao')).toBe(1);
 expect(executarTesteDominio(next,'razao',{},()=>.8).rolagem.dados).toHaveLength(3);
 expect(executarTesteDominio({...next,efeitosHabilidadesAtivos:[]},'razao',{},()=>.8).rolagem.dados).toHaveLength(2);
});
test('ritos têm custo por círculo e efeitos diretos não inventam alvos',()=>{
 expect(prepararUso({nome:'Rito',nivelRito:'avançado'},'rito').custoAtivacao).toBe(4);
 expect(extrairEfeitosDiretos('Você recupera 2 de Sanidade.')).toEqual([{tipo:'recurso',recurso:'sanidade',valor:2}]);
 expect(extrairEfeitosDiretos('Se falhar, você recupera 2 de Sanidade.')).toEqual([]);
 const next=aplicarUso(base(),{nome:'Sangue',nivelRito:'intermediario',detalhe:'Role 3d6 de dano direto ignorando armadura.'},'rito');
 expect(next.esperanca.atual).toBe(5);expect(next.efeitosHabilidadesAtivos[0].aplicados[0]).toContain('Dano:');expect(next.efeitosHabilidadesAtivos[0].pendente).toBe(true);
});
