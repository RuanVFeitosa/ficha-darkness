import {expandAbilityTable} from './abilityTables';
const table='| Resultado | Efeito |\n| --- | --- |\n| 1–5 | Texto |';
test('adiciona colunas em cabeçalho, separador e todas as linhas',()=>{
 const result=expandAbilityTable(table,0,'column');
 expect(result).toBe('| Resultado | Efeito | Nova coluna |\n| --- | --- | --- |\n| 1–5 | Texto |  |');
 expect(expandAbilityTable(result,0,'column').split('\n')[0]).toBe('| Resultado | Efeito | Nova coluna | Nova coluna |');
});
test('adiciona linha com a quantidade correta de colunas',()=>{expect(expandAbilityTable(table,0,'row')).toBe(table+'\n|  |  |');});
test('edita apenas a tabela escolhida pelo cursor',()=>{const content=table+'\n\nOutra tabela\n\n'+table;const result=expandAbilityTable(content,content.length,'column');expect(result.startsWith(table+'\n\nOutra tabela')).toBe(true);expect(result.match(/Nova coluna/g)).toHaveLength(1);});
test('não edita tabelas dentro de código e preserva pipes escapados',()=>{expect(expandAbilityTable('```\n'+table+'\n```',0,'column')).toBeNull();const escaped=table.replace('Texto','Texto \\| extra');expect(expandAbilityTable(escaped,0,'column')).toContain('Texto \\| extra |  |');});
