import {salvarEstadoToken3D,obterEstadoToken3D,salvarPorta3DCampanha} from './mesaApi';
import {supabase} from './supabase';
import {externalizarImagens} from './mediaStorage';
jest.mock('./supabase',()=>({supabaseConfigurado:true,supabase:{from:jest.fn()}}));
jest.mock('./mediaStorage',()=>({externalizarImagens:jest.fn(),mediaStorage:{}}));

test('movimento no banco não depende de reenviar imagens já salvas',async()=>{
  const mapKey='__estado:tabletop3d:map';
  const old={image:'data:image/png;base64,old',scale:0.8,elevation:4};
  let payload;
  const query={select:()=>query,eq:()=>query,update:input=>{payload=input;return query;},single:jest.fn()};
  query.single.mockResolvedValueOnce({data:{id:'token',posicoes:{[mapKey]:old}}});
  query.single.mockImplementationOnce(async()=>({data:{id:'token',...payload}}));
  supabase.from.mockReturnValue(query);
  externalizarImagens.mockImplementation(async patch=>{
    if(patch.image) throw new Error('Upload de imagem indisponível');
    return patch;
  });
  const saved=await salvarEstadoToken3D('token','map',{x:2,z:3,revision:10});
  expect(obterEstadoToken3D(saved,'map')).toEqual({...old,x:2,z:3,revision:10});
  expect(externalizarImagens).toHaveBeenCalledTimes(1);
  expect(externalizarImagens).toHaveBeenCalledWith({x:2,z:3,revision:10});
});

test('porta no banco preserva os assets e a revisão estrutural do mapa',async()=>{
  const maps=[{id:'house',atualizadoEm:'original',assets:[{asset:{fileUrl:'house.glb'}}],doorStates:{other:{open:true,revision:1}}}];
  const read={select:jest.fn(()=>read),eq:jest.fn(()=>read),single:jest.fn().mockResolvedValue({data:{mapas_3d:maps}})};
  const write={update:jest.fn(()=>write),eq:jest.fn().mockResolvedValue({error:null})};
  supabase.from.mockReturnValueOnce(read).mockReturnValueOnce(write);
  await salvarPorta3DCampanha('campaign','house','front:leaf',true);
  const updated=write.update.mock.calls[0][0].mapas_3d[0];
  expect(updated.atualizadoEm).toBe('original');
  expect(updated.assets).toEqual(maps[0].assets);
  expect(updated.doorStates.other.open).toBe(true);
  expect(updated.doorStates['front:leaf'].open).toBe(true);
});
