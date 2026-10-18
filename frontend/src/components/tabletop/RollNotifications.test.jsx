import React from 'react';
import {render,screen,act} from '@testing-library/react';
import RollNotifications,{RollHistory} from './RollNotifications';
const roll={id:'new',autor_nome:'Victoria',expressao:'1d20',resultado:18};
test('mostra somente rolagens novas, não duplica e desaparece após sete segundos',()=>{
 jest.useFakeTimers();
 const {rerender}=render(<RollNotifications rolls={[]}/>);
 expect(screen.queryByLabelText('Rolagens recentes')).not.toBeInTheDocument();
 rerender(<RollNotifications rolls={[roll]}/>);
 expect(screen.getByText('Victoria')).toBeInTheDocument();
 rerender(<RollNotifications rolls={[{...roll}]}/>);
 expect(screen.getAllByText('18')).toHaveLength(1);
 act(()=>jest.advanceTimersByTime(7000));
 expect(screen.queryByLabelText('Rolagens recentes')).not.toBeInTheDocument();
 jest.useRealTimers();
});
test('histórico preserva autor, expressão e resultado',()=>{
 render(<RollHistory rolls={[roll]}/>);
 expect(screen.getByText('Victoria')).toBeInTheDocument();
 expect(screen.getByText('1d20')).toBeInTheDocument();
 expect(screen.getByText('18')).toBeInTheDocument();
});
test('popup do jogador oculta dificuldade, contexto e margem',()=>{
 const {rerender}=render(<RollNotifications rolls={[]}/>);
 const secret={...roll,detalhes:{difficulty:13,context:'Dificuldade secreta',margin:5,outcome:'Sucesso excepcional'}};
 rerender(<RollNotifications rolls={[secret]}/>);
 expect(screen.getByText('Sucesso excepcional')).toBeInTheDocument();
 expect(screen.queryByText(/Dificuldade secreta/)).not.toBeInTheDocument();
 expect(screen.queryByText(/13/)).not.toBeInTheDocument();
});