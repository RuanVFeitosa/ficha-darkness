import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import ExplorationPanel from './ExplorationPanel';
test('reveals an object individually and saves an audio source at the selected position',async()=>{
 const save=jest.fn().mockResolvedValue();
 render(<ExplorationPanel assets={[{instanceId:'clue',asset:{name:'Carta'}}]} members={[{ficha_id:'espiral:123',nome:'Ana',papel:'jogador'}]} position={[2,3]} elevation={1} onSave={save}/>);
 fireEvent.click(screen.getByLabelText('Revelar apenas para jogadores selecionados'));
 fireEvent.click(screen.getByLabelText('Ana'));
 fireEvent.click(screen.getByRole('button',{name:'Adicionar som na posição selecionada'}));
 fireEvent.change(screen.getByLabelText('URL do áudio'),{target:{value:'https://example.com/sound.mp3'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar exploração do mapa'}));
 await waitFor(()=>expect(save).toHaveBeenCalled());
 expect(save.mock.calls[0][0].visibility.clue.audience).toEqual(['espiral:123']);
 expect(save.mock.calls[0][0].audioZones[0]).toMatchObject({x:2,y:1.5,z:3,url:'https://example.com/sound.mp3'});
});
test('save failure stays visible and permits retry',async()=>{
 const save=jest.fn().mockRejectedValue(new Error('Sem conexão'));
 render(<ExplorationPanel onSave={save}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar exploração do mapa'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
 expect(screen.getByRole('button',{name:'Salvar exploração do mapa'})).not.toBeDisabled();
});
