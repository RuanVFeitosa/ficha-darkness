import {renderHook,waitFor} from '@testing-library/react';
import useRelationshipMembers from './useRelationshipMembers';
import useSheetCampaigns from './useSheetCampaigns';
import {buscarFichaEspiral} from '../services/espiralApi';
import {buscarPersonagem} from '../services/personagemApi';
jest.mock('./useSheetCampaigns');
jest.mock('../services/espiralApi',()=>({buscarFichaEspiral:jest.fn()}));
jest.mock('../services/personagemApi',()=>({buscarPersonagem:jest.fn()}));

test('reúne personagens vinculados, carrega retratos e exclui a própria ficha e duplicatas',async()=>{
  useSheetCampaigns.mockReturnValue([{membros:[{ficha_id:'espiral:eu'},{ficha_id:'espiral:ana',nome:'Ana'},{ficha_id:'darkness:beto',nome:'Beto'},{ficha_id:'inimigo:monstro'},{ficha_id:'custom3d:figura'}]},{membros:[{ficha_id:'espiral:ana',nome:'Ana'}]}]);
  buscarFichaEspiral.mockResolvedValue({name:'Ana atual',profileImage:'/ana.png'});
  buscarPersonagem.mockResolvedValue({nome:'Beto',fotoPerfil:'/beto.png'});
  const {result}=renderHook(()=>useRelationshipMembers('espiral:eu'));
  await waitFor(()=>expect(result.current[0].photo).toBe('/ana.png'));
  expect(result.current).toHaveLength(2);
  expect(result.current[0].name).toBe('Ana atual');
  expect(result.current[1].photo).toBe('/beto.png');
  expect(buscarFichaEspiral).toHaveBeenCalledWith('ana');
});
