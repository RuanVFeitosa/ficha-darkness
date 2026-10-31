jest.mock('three/examples/jsm/loaders/GLTFLoader.js',()=>({GLTFLoader:class {}}));
jest.mock('three',()=>({}));
import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import MapEditor3D from './MapEditor3D';

const piece={instanceId:'piece-1',asset:{name:'Parede de pedra',kind:'wall'},x:2,z:3,scale:1};
const props={open:true,items:[piece],onClose:jest.fn(),onSave:jest.fn(),onPublishScene:jest.fn(),onMapNameChange:jest.fn(),onSelectItem:jest.fn(),onUpdate:jest.fn()};
beforeEach(()=>jest.clearAllMocks());

test('lista de objetos seleciona a peça e mantém o salvamento acessível',()=>{
 render(<MapEditor3D {...props}/>);
 fireEvent.click(screen.getByRole('button',{name:'Objetos (1)'}));
 fireEvent.click(screen.getByRole('button',{name:/01 Parede de pedra/}));
 expect(props.onSelectItem).toHaveBeenCalledWith('piece-1');
 fireEvent.click(screen.getByRole('button',{name:'Salvar mapa'}));
 expect(props.onSave).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('button',{name:'Configurações'}));
 expect(screen.getByLabelText('Nome do mapa 3D')).toBeVisible();
 expect(screen.getByRole('button',{name:'Salvar e usar na cena'})).toBeVisible();
});
test('permite ajustar coordenadas da peça selecionada e evita salvar novamente durante envio',()=>{
 render(<MapEditor3D {...props} selectedId="piece-1" savingMap/>);
 fireEvent.change(screen.getByLabelText('Posição X'),{target:{value:'4.5'}});
 expect(props.onUpdate).toHaveBeenCalledWith({x:4.5});
 expect(screen.getByRole('button',{name:'Salvando…'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Salvar e usar na cena'})).toBeDisabled();
});

test('abre mapas existentes e ajusta altura, inclinação e visibilidade UV',()=>{
 const onLoadMap=jest.fn();
 render(<MapEditor3D {...props} selectedId="piece-1" savedMaps={[{id:'saved',nome:'Cidade'}]} onLoadMap={onLoadMap}/>);
 fireEvent.change(screen.getByLabelText('Abrir mapa 3D'),{target:{value:'saved'}});
 expect(onLoadMap).toHaveBeenCalledWith('saved');
 fireEvent.change(screen.getByLabelText('Altura Y'),{target:{value:'1.75'}});
 expect(props.onUpdate).toHaveBeenCalledWith({y:1.75});
 fireEvent.change(screen.getByLabelText('Inclinação do objeto'),{target:{value:'-90'}});
 expect(props.onUpdate).toHaveBeenCalledWith({tilt:-90});
 fireEvent.click(screen.getByRole('checkbox',{name:'Revelar somente com lanterna UV'}));
 expect(props.onUpdate).toHaveBeenCalledWith({uvOnly:true});
});
