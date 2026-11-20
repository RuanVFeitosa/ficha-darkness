import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import PressureDice from './PressureDice';

test('marca a quantidade de d6 e permite limpar a pressão',()=>{
  function Picker(){const [value,setValue]=useState(0);return <PressureDice value={value} onChange={setValue}/>;}
  const {container}=render(<Picker/>);
  fireEvent.click(screen.getByRole('button',{name:'Pressão: 3 dados'}));
  expect(screen.getAllByRole('button',{pressed:true})).toHaveLength(3);
  expect(container.querySelectorAll('.pd-pressure-cube i')).toHaveLength(30);
  fireEvent.click(screen.getByRole('button',{name:'Pressão: 1 dado'}));
  expect(screen.queryAllByRole('button',{pressed:true})).toHaveLength(0);
});
