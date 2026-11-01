import React from 'react';
import {render,screen,act} from '@testing-library/react';
import RollNotifications,{RollHistory,notificationDice,notificationTitle} from './RollNotifications';
const roll={id:'new',autor_nome:'Victoria',expressao:'1d20',resultado:18};

test('teste da Revolta aparece sobre a cena e não repete ao resolver a rodada',()=>{
 jest.useFakeTimers();
 const state={events:[{id:'revolta',revolt:{round:1,plans:{},fronts:{}}}]};
 const {rerender}=render(<RollNotifications mechanics={state}/>);
 const test={autor:'Lia',titulo:'Influência',dados:[6,2,6],exitos:2,sucesso:true};
 const next={events:[{id:'revolta',revolt:{round:1,plans:{popular:{groupTest:test}},fronts:{}}}]};
 rerender(<RollNotifications mechanics={next}/>);
 expect(screen.getAllByLabelText('Dado rolando')).toHaveLength(3);
 act(()=>jest.advanceTimersByTime(1200));
 expect(screen.getByRole('heading',{name:'Sucesso'})).toBeInTheDocument();
 rerender(<RollNotifications mechanics={{events:[{...next.events[0],revolt:{...next.events[0].revolt,results:{popular:{test}}}}]}}/>);
 expect(screen.getAllByLabelText('Rolagem de Lia')).toHaveLength(1);
 act(()=>jest.advanceTimersByTime(5800));
 expect(screen.queryByLabelText('Rolagens recentes')).not.toBeInTheDocument();
 jest.useRealTimers();
});

test.each([[0,'Sem lesão'],[3,'Lesão Superficial'],[6,'Lesão Moderada'],[9,'Lesão Grave'],[12,'Lesão Crítica'],[13,'Lesão Catastrófica / Fatal']])('dano %s mostra a lesão em vez de sucesso', (total,title)=>{
 expect(notificationTitle({...roll,resultado:total,detalhes:{tipo:'dano',sistema:'espiral',total,outcome:'Sucesso'}})).toBe(title);
});
test('mostra somente rolagens novas, não duplica e desaparece após sete segundos',()=>{
 jest.useFakeTimers();
 const {rerender}=render(<RollNotifications rolls={[]}/>);
 expect(screen.queryByLabelText('Rolagens recentes')).not.toBeInTheDocument();
 rerender(<RollNotifications rolls={[roll]}/>);
 expect(screen.getByLabelText('Rolagem de Victoria')).toBeInTheDocument();
 rerender(<RollNotifications rolls={[{...roll}]}/>);
 expect(screen.getAllByLabelText('Dado rolando')).toHaveLength(1);
 act(()=>jest.advanceTimersByTime(1200));
 expect(screen.getAllByText('18')).toHaveLength(1);
 act(()=>jest.advanceTimersByTime(5800));
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
 jest.useFakeTimers();
 const {rerender}=render(<RollNotifications rolls={[]}/>);
 const secret={...roll,detalhes:{difficulty:13,context:'Dificuldade secreta',margin:5,outcome:'Sucesso excepcional'}};
 rerender(<RollNotifications rolls={[secret]}/>);
 expect(screen.queryByText('Sucesso excepcional')).not.toBeInTheDocument();
 act(()=>jest.advanceTimersByTime(1200));
 expect(screen.getByRole('heading',{name:'Sucesso excepcional'})).toBeInTheDocument();
 expect(screen.queryByText(/Dificuldade secreta/)).not.toBeInTheDocument();
 expect(screen.queryByText(/13/)).not.toBeInTheDocument();
 jest.useRealTimers();
});
test('exibe cada dado da reserva, incluindo os dados de Pressão',()=>{
 expect(notificationDice({detalhes:{dice:[4,8],sides:8,pressure:[2]}})).toEqual([{value:4,sides:8},{value:8,sides:8},{value:2,sides:6,pressure:true}]);
 expect(notificationDice({detalhes:{dadosDetalhados:[{valor:5,faces:6}]}})).toEqual([{value:5,sides:6}]);
});
