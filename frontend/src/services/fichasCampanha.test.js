import { listarPersonagens } from './personagemApi';
import { listarFichasEspiralLocais, listarFichasParaCampanha } from './fichasCampanha';
jest.mock('./personagemApi', () => ({listarPersonagens:jest.fn()}));
beforeEach(() => {localStorage.clear();jest.clearAllMocks();});
const sheet={version:1,name:'Ana',attributes:{pulso:1},vertente:'Investigadora',profileImage:'portrait',tabletopTokenImage:'body'};
test('combina Darkness e ESPIRAL preservando os IDs usados para vincular a campanha', async () => {
 listarPersonagens.mockResolvedValue([{fichaId:'123',personagem:{nome:'Bruno'}}]);
 localStorage.setItem('espiral:sheet:v1:ana',JSON.stringify(sheet));
 const fichas=await listarFichasParaCampanha();
 expect(fichas.map(f => f.fichaId)).toEqual(['espiral:ana','123']);
 expect(fichas[0]).toMatchObject({sistema:'espiral',personagem:{nome:'Ana',fotoPerfil:'portrait',tabletopTokenImage:'body'}});
});
test('inclui fichas sem imagem para o mestre vincular e ignora fichas corrompidas', () => {
 localStorage.setItem('espiral:sheet:v1:ana',JSON.stringify({...sheet,tabletopTokenImage:''}));
 localStorage.setItem('espiral:sheet:v1:ruim','invalid');
 expect(listarFichasEspiralLocais()).toHaveLength(1);
});
test('adaptação antiga usa o mesmo ID da ficha atual sem duplicar', () => {
 localStorage.setItem('espiral:sheet:v1:darkness-123',JSON.stringify(sheet));
 expect(listarFichasEspiralLocais()[0].fichaId).toBe('espiral:123');
 localStorage.setItem('espiral:sheet:v1:123',JSON.stringify({...sheet,name:'Ana atual'}));
 expect(listarFichasEspiralLocais()).toHaveLength(1);
 expect(listarFichasEspiralLocais()[0].personagem.nome).toBe('Ana atual');
});test('a whole-body image never replaces a missing 2D portrait',() => {localStorage.setItem('espiral:sheet:v1:ana',JSON.stringify({...sheet,profileImage:''}));expect(listarFichasEspiralLocais()[0].personagem.fotoPerfil).toBe('');expect(listarFichasEspiralLocais()[0].personagem.tabletopTokenImage).toBe('body');});
