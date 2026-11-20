import React, {useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import PavorControls from './PavorControls';

test.each([4,6,8,10,12])('permite iniciar em d%s sem gastar Esperança e mantém a escolha ao salvar cores',sides=>{
 function Sheet(){const [sheet,setSheet]=useState({hope:2,pavor:{active:false,sides:6}});return <><PavorControls sheet={sheet} setSheet={setSheet} rolling={false}/><div data-testid="state">{JSON.stringify(sheet)}</div></>;}
 render(<Sheet/>);
 fireEvent.click(screen.getByRole('button',{name:`Pavor d${sides}`,exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Salvar e ativar Pavor'}));
 expect(JSON.parse(screen.getByTestId('state').textContent)).toMatchObject({hope:2,pavor:{active:true,sides}});
 fireEvent.click(screen.getByRole('button',{name:'Encerrar efeito'}));
 fireEvent.click(screen.getByRole('button',{name:`Pavor d${sides}`,exact:true}));
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(JSON.parse(screen.getByTestId('state').textContent).pavor.sides).toBe(sides);
});

test('primeira ativação escolhe cores e as mantém ao encerrar e reativar',()=>{
  function Sheet(){const [sheet,setSheet]=useState({hope:10,pavor:{active:false,sides:6}});return <><PavorControls sheet={sheet} setSheet={setSheet} rolling={false}/><output data-testid="sheet">{JSON.stringify(sheet)}</output></>;}
  render(<Sheet/>);
  fireEvent.click(screen.getByRole('button',{name:'Receber Pavor'}));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Cor dos dados'),{target:{value:'#2266aa'}});
  fireEvent.click(screen.getByText('Salvar e ativar Pavor'));
  expect(JSON.parse(screen.getByTestId('sheet').textContent).pavor).toEqual({active:true,sides:6,colors:{primary:'#2266aa',glow:'#e14d43'}});
  fireEvent.click(screen.getByText('Encerrar efeito'));
  fireEvent.click(screen.getByRole('button',{name:'Receber Pavor'}));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(JSON.parse(screen.getByTestId('sheet').textContent).pavor.colors.primary).toBe('#2266aa');
});

test('marcas permitem controlar o dado e cobram um PE por passo',()=>{
 function Sheet(){const [sheet,setSheet]=useState({hope:3,pavor:{active:true,sides:12,colors:{primary:'#db5b52',glow:'#e14d43'}}});return <><PavorControls sheet={sheet} setSheet={setSheet} rolling={false}/><div data-testid="state">{JSON.stringify(sheet)}</div></>;}
 render(<Sheet/>);
 expect(screen.getByRole('button',{name:'Pavor d4 · controlar por 4 PE'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Pavor d8 · controlar por 2 PE'}));
 expect(JSON.parse(screen.getByTestId('state').textContent)).toMatchObject({hope:1,pavor:{sides:8}});
 fireEvent.click(screen.getByRole('button',{name:'Controlar · 1 PE'}));
 expect(JSON.parse(screen.getByTestId('state').textContent)).toMatchObject({hope:0,pavor:{sides:6}});
 expect(screen.getByRole('button',{name:'Controlar · 1 PE'})).toBeDisabled();
});
