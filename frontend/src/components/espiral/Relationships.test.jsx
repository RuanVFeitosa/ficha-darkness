import React,{useState} from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import Relationships from './Relationships';
jest.mock('../../hooks/useRelationshipMembers',()=>()=>[{id:'party:espiral:ana',name:'Ana',photo:'/ana.png'}]);
test('keeps portrait and editable relation points without invocation forms',()=>{
 function Sheet(){const [sheet,setSheet]=useState({relationships:[]});return <Relationships sheet={sheet} setSheet={setSheet}/>;}
 const {container}=render(<Sheet/>);
 expect(container.querySelector('img')).toHaveAttribute('src','/ana.png');
 fireEvent.click(screen.getByRole('button',{name:'Ana: grau 2 · Vínculo'}));
 expect(screen.getAllByRole('button',{pressed:true})).toHaveLength(2);
 fireEvent.click(screen.getByRole('button',{name:'Ana: grau 1 · Afinidade'}));
 fireEvent.click(screen.getByRole('button',{name:'Ana: grau 1 · Afinidade'}));
 expect(screen.queryAllByRole('button',{pressed:true})).toHaveLength(0);
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Invocar relação'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Nova missão'})).not.toBeInTheDocument();
});
test('reference table describes each grade using the existing relationship rules',()=>{
 render(<Relationships sheet={{relationships:[]}} setSheet={()=>{}}/>);
 const table=screen.getByRole('table',{name:'Efeitos dos pontos de Relação'});
 const rows=within(table).getAllByRole('row');
 expect(rows).toHaveLength(4);
 expect(rows[1]).toHaveTextContent('Afinidade');expect(rows[1]).toHaveTextContent('+1d6');expect(rows[1]).not.toHaveTextContent('Motivar');
 expect(rows[2]).toHaveTextContent('Vínculo');expect(rows[2]).toHaveTextContent('+1d8');expect(rows[2]).toHaveTextContent('2d4 PE');expect(rows[2]).not.toHaveTextContent('Proteger');
 expect(rows[3]).toHaveTextContent('Devoção');expect(rows[3]).toHaveTextContent('+1d12');expect(rows[3]).toHaveTextContent('2d6 PE');expect(rows[3]).toHaveTextContent('Proteger');
});
