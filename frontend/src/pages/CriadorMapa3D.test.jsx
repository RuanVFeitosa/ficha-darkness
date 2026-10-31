import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import CriadorMapa3D,{CameraEditor} from './CriadorMapa3D';
import {useFrame} from '@react-three/fiber';
import {buscarCampanhaPorCodigo,salvarMapas3DCampanha} from '../services/mesaApi';
let mockEditorProps,mockOrbit;
const mockCamera={position:{set:jest.fn(),toArray:()=>[1,2,3]},fov:44};
jest.mock('three',()=>({}));
jest.mock('three/examples/jsm/controls/OrbitControls.js',()=>({OrbitControls:class{target={set:jest.fn(),toArray:()=>[0,0,0]};update=jest.fn();dispose=jest.fn();constructor(){mockOrbit=this;}}}));
jest.mock('@react-three/fiber',()=>({Canvas:()=>null,useThree:()=>({camera:mockCamera,gl:{domElement:{}}}),useFrame:jest.fn()}));
jest.mock('../utils/uvLight',()=>({uvTextImage:()=>'/uv-text.png'}));
jest.mock('../components/tabletop/MapEditor3D',()=>({__esModule:true,MAP_STORAGE_KEY:'map-test',AssetModel:()=>null,PlacedAssets:()=>null,default:props=>{
 mockEditorProps=props;
 return <div><button onClick={props.onSave}>Salvar edição</button><button onClick={()=>props.onPrepareAnnotation('Código UV')}>Criar pista</button><output>{props.items.length} objetos</output></div>;
}}));
jest.mock('../services/mesaApi',()=>({buscarCampanhaPorCodigo:jest.fn(),salvarMapas3DCampanha:jest.fn(),ativarCena:jest.fn(),enviarModelo3DMapa:jest.fn(),salvarCena:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();window.history.replaceState({},'', '/?criarMapa3d=1&campanha=TEST');});
test('abre mapa existente e salva no mesmo ID preservando modelos, spawn e propriedades',async()=>{
 const map={id:'city',nome:'Cidade',customSetting:true,assets:[{instanceId:'model',asset:{fileUrl:'/city.glb'},x:0,z:0,scale:3}],spawnPoints:{tokens:{x:4,y:0,z:5}}};
 buscarCampanhaPorCodigo.mockResolvedValue({id:'campaign',nome:'Campanha',mapas3D:[map]});
 salvarMapas3DCampanha.mockResolvedValue([]);
 render(<CriadorMapa3D/>);
 await screen.findByText('1 objetos');
 expect(mockEditorProps.activeMapId).toBe('city');
 expect(mockEditorProps.mapName).toBe('Cidade');
 fireEvent.click(screen.getByRole('button',{name:'Salvar edição'}));
 await waitFor(()=>expect(salvarMapas3DCampanha).toHaveBeenCalledWith('campaign',[expect.objectContaining(map)]));
 expect(mockEditorProps.dirty).toBe(false);
});
test('câmera do editor atualiza a navegação em cada frame',()=>{
 const poseApiRef={current:null};const {unmount}=render(<CameraEditor poseApiRef={poseApiRef}/>);
 const before=mockOrbit.update.mock.calls.length;
 useFrame.mock.calls[useFrame.mock.calls.length-1][0]();
 expect(mockOrbit.update).toHaveBeenCalledTimes(before+1);
 expect(mockOrbit.maxDistance).toBe(500);
 expect(poseApiRef.current()).toMatchObject({position:[1,2,3],target:[0,0,0]});
 unmount();expect(mockOrbit.dispose).toHaveBeenCalled();
});
