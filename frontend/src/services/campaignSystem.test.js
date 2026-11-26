import {criarCampanhaMesa, salvarSistemaCampanha, buscarCampanhaPorCodigo, vincularFicha, desvincularFicha} from './mesaApi';
beforeEach(()=>localStorage.clear());
test('persiste o sistema e impede misturar fichas ou trocar com fichas incompatíveis',async()=>{
 const campaign=await criarCampanhaMesa('Sistema','2d','espiral');
 expect((await buscarCampanhaPorCodigo(campaign.codigo)).sistema).toBe('espiral');
 await expect(vincularFicha(campaign.id,'absoluto:ana',{})).rejects.toThrow('outro sistema');
 await vincularFicha(campaign.id,'espiral:ana',{});
 await expect(salvarSistemaCampanha(campaign.id,'absoluto')).rejects.toThrow('Desvincule');
 await desvincularFicha(campaign.id,'espiral:ana');
 const semFicha=await buscarCampanhaPorCodigo(campaign.codigo);
 expect(semFicha.membros).toEqual([]);
 expect(semFicha.tokens).toEqual([]);
 await salvarSistemaCampanha(campaign.id,'absoluto');
 expect((await buscarCampanhaPorCodigo(campaign.codigo)).sistema).toBe('absoluto');
});

test('cria e relê uma campanha vazia de Ordem Paranormal no tabletop 2D', async () => {
 const campaign = await criarCampanhaMesa('Caso de Ordem', '2d', 'ordem');
 expect(await buscarCampanhaPorCodigo(campaign.codigo)).toMatchObject({
   nome: 'Caso de Ordem', sistema: 'ordem', tabletop_tipo: '2d', membros: [], cenas: [],
 });
 await expect(vincularFicha(campaign.id, 'espiral:ana', {})).rejects.toThrow('outro sistema');
 await expect(criarCampanhaMesa('Mesa 3D', '3d', 'ordem')).rejects.toThrow('exclusivo do proprietário');
});
