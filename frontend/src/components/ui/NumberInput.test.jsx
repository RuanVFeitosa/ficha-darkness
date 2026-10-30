import React, {useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import NumberInput from './NumberInput';
function Exemplo(){const [valor,setValor]=useState(2);return <NumberInput aria-label="Quantidade" min={1} max={3} step={1} value={valor} onChange={e=>setValor(Number(e.target.value))}/>;}
test('setas atualizam o campo controlado e respeitam mínimo e máximo',()=>{
 render(<Exemplo/>);
 const input=screen.getByRole('spinbutton',{name:'Quantidade'});
 fireEvent.click(screen.getByRole('button',{name:'Aumentar valor'}));expect(input.value).toBe('3');
 fireEvent.click(screen.getByRole('button',{name:'Aumentar valor'}));expect(input.value).toBe('3');
 fireEvent.click(screen.getByRole('button',{name:'Diminuir valor'}));expect(input.value).toBe('2');
 fireEvent.click(screen.getByRole('button',{name:'Diminuir valor'}));
 fireEvent.click(screen.getByRole('button',{name:'Diminuir valor'}));expect(input.value).toBe('1');
 fireEvent.change(input,{target:{value:'2'}});expect(input.value).toBe('2');
});
test('campos desativados mantêm as setas desativadas',()=>{
 render(<NumberInput disabled value={1} readOnly/>);
 expect(screen.getByRole('button',{name:'Aumentar valor'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Diminuir valor'})).toBeDisabled();
});
