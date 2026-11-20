import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import EspiralDamage from './EspiralDamage';

test('mostra a perda de Integridade antes de confirmar e mantém o dano ao trocar região',()=>{
  const apply=jest.fn();
  function Form(){const [region,setRegion]=useState('Torso');return <EspiralDamage region={region} onRegionChange={setRegion} regions={['Torso','Braço esquerdo']} integrity={35} onApply={apply}/>;}
  render(<Form/>);
  expect(screen.getByRole('button',{name:'Aplicar dano e registrar lesão'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Dano rolado'),{target:{value:'10'}});
  fireEvent.change(screen.getByLabelText('Proteção aplicada'),{target:{value:'3'}});
  expect(screen.getByText('35 → 28')).toBeInTheDocument();
  expect(screen.getByText('Lesão grave')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Parte do corpo'),{target:{value:'Braço esquerdo'}});
  expect(screen.getByLabelText('Dano rolado')).toHaveValue(10);
  expect(screen.getByLabelText('Região Crítica neste ferimento')).not.toBeChecked();
  fireEvent.click(screen.getByRole('button',{name:'Aplicar dano e registrar lesão'}));
  expect(apply).toHaveBeenCalledWith(expect.objectContaining({region:'Braço esquerdo',impact:7,severity:'Grave'}));
  expect(screen.getByRole('status')).toHaveTextContent('Integridade reduzida em 7');
});

test('dano totalmente bloqueado informa que não há perda nem lesão',()=>{
  const apply=jest.fn();
  render(<EspiralDamage region="Torso" integrity={35} onApply={apply}/>);
  fireEvent.change(screen.getByLabelText('Dano rolado'),{target:{value:'3'}});
  fireEvent.change(screen.getByLabelText('Proteção aplicada'),{target:{value:'5'}});
  expect(screen.getByText('35 → 35')).toBeInTheDocument();
  expect(screen.getByText('Dano bloqueado')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Aplicar dano e registrar lesão'}));
  expect(apply).toHaveBeenCalledWith(expect.objectContaining({impact:0,severity:null}));
  expect(screen.getByRole('status')).toHaveTextContent('Sem lesão e sem perda de Integridade');
});
