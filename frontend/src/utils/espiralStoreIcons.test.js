import { CATALOGO_ESPIRAL } from '../data/catalogoEspiral';
import { iconeLojaEspiral } from './espiralStoreIcons';

test('cada arma branca, proteção e equipamento tem seu próprio desenho',()=>{
 const itens=CATALOGO_ESPIRAL.filter(i=>i.weaponGroup!=='fogo');
 const desenhos=itens.map(item=>{
  const desenho=iconeLojaEspiral(item);
  expect({nome:item.name,iconeValido:typeof desenho==='string' && desenho.length>10}).toEqual({nome:item.name,iconeValido:true});
  return desenho;
 });
 expect(new Set(desenhos).size).toBe(itens.length);
});
