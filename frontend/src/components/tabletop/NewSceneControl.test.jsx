jest.mock('../../services/novaCena',()=>({iniciarNovaCena:jest.fn()}));
import React from 'react';
import {render,screen,fireEvent,act} from '@testing-library/react';
import NewSceneControl from './NewSceneControl';
import {iniciarNovaCena} from '../../services/novaCena';

test('aviso de falha desaparece após oito segundos',async()=>{
 jest.useFakeTimers();
 try{
  iniciarNovaCena.mockRejectedValue(Error('Falha parcial.'));
  render(<NewSceneControl members={[{ficha_id:'a'}]}/>);
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Nova Cena'}));});
  expect(screen.getByRole('alert')).toHaveTextContent('Falha parcial.');
  act(()=>jest.advanceTimersByTime(8000));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
 }finally{jest.useRealTimers();}
});
test('botão inicia nova cena nas fichas vinculadas e informa resultado',async()=>{
 const members=[{ficha_id:'a'}];iniciarNovaCena.mockResolvedValue(1);
 render(<NewSceneControl members={members}/>);
 fireEvent.click(screen.getByRole('button',{name:'Nova Cena'}));
 expect(iniciarNovaCena).toHaveBeenCalledWith(members);
 expect(await screen.findByRole('status')).toHaveTextContent('Nova cena iniciada para 1 ficha(s).');
});
test('falhas ficam visíveis e permitem tentar novamente',async()=>{
 iniciarNovaCena.mockRejectedValue(Error('Falha ao salvar ficha.'));
 render(<NewSceneControl members={[{ficha_id:'a'}]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Nova Cena'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar ficha.');
 expect(screen.getByRole('button',{name:'Nova Cena'})).toBeEnabled();
});
