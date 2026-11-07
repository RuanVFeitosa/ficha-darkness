import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import WeaponAmmoEditor from './WeaponAmmoEditor';

test('ajusta munição com botões e entrada direta sem permitir valor negativo',()=>{
 const onChange=jest.fn();
 const {rerender}=render(<WeaponAmmoEditor name="Pistola" value={7} onChange={onChange}/>);
 fireEvent.click(screen.getByRole('button',{name:'Gastar uma bala de Pistola'}));expect(onChange).toHaveBeenLastCalledWith(6);
 fireEvent.click(screen.getByRole('button',{name:'Adicionar uma bala em Pistola'}));expect(onChange).toHaveBeenLastCalledWith(8);
 fireEvent.change(screen.getByRole('spinbutton',{name:'Balas de Pistola'}),{target:{value:'-5'}});expect(onChange).toHaveBeenLastCalledWith(0);
 rerender(<WeaponAmmoEditor name="Pistola" value={0} onChange={onChange}/>);
 expect(screen.getByRole('button',{name:'Gastar uma bala de Pistola'})).toBeDisabled();expect(screen.getByText('Sem balas')).toBeInTheDocument();
});
