import React from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import SessionReferenceTabs from './SessionReferenceTabs';

test.each([['Crise','1d6',6,'Sobrecarga'],['Ruptura','1d6',6,'Fixação'],['Lesão','1d20',13,'Morte Súbita'],['Trauma','1d20',9,'Colapso Total']])('consulta %s mostra todos os resultados e o dado correto',(label,dice,count,name)=>{
 render(<SessionReferenceTabs><p>Controles de dificuldade</p></SessionReferenceTabs>);
 fireEvent.click(screen.getByRole('tab',{name:label}));
 if(label==='Lesão'||label==='Trauma') {
  const options=screen.getByRole('group',{name:'Resultados de '+label});
  expect(within(options).getAllByRole('button')).toHaveLength(count);
  fireEvent.click(within(options).getAllByRole('button')[count-1]);
  expect(screen.getByRole('heading',{name:label==='Lesão'?'Surto de Adrenalina':'Injeção de Ânimo'})).toBeInTheDocument();
  expect(screen.getByRole('heading',{name:label+' · '+dice})).toBeInTheDocument();
  return;
 }
 const table=screen.getByRole('table',{name:`${label} · ${dice}`});
 expect(within(table).getAllByRole('row')).toHaveLength(count+1);
 expect(within(table).getByRole('rowheader',{name:new RegExp(name)})).toBeInTheDocument();
 expect(screen.queryByText('Controles de dificuldade')).not.toBeVisible();
});

test('trocar a consulta mantém os valores de dificuldade e permite navegar pelo teclado',()=>{
 render(<SessionReferenceTabs><input aria-label="Dificuldade do ambiente" defaultValue="4"/></SessionReferenceTabs>);
 fireEvent.change(screen.getByLabelText('Dificuldade do ambiente'),{target:{value:'6'}});
 fireEvent.keyDown(screen.getByRole('tab',{name:'Dificuldade'}),{key:'End'});
 expect(screen.getByRole('tab',{name:'Ruptura'})).toHaveFocus();
 expect(screen.getByRole('tab',{name:'Ruptura'})).toHaveAttribute('aria-selected','true');
 expect(screen.getByRole('rowheader',{name:'2 — Fuga'})).toBeInTheDocument();
 fireEvent.keyDown(screen.getByRole('tab',{name:'Ruptura'}),{key:'Home'});
 expect(screen.getByLabelText('Dificuldade do ambiente')).toHaveValue('6');
});
