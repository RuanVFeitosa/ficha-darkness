import React, {useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import DarknessColorPicker from './DarknessColorPicker';

test('seleciona cores na paleta, ajusta tom e não aplica hexadecimal incompleto',()=>{
  const changed=jest.fn();
  function Picker(){const [value,setValue]=useState('#ff0000');return <DarknessColorPicker label="Cor" value={value} onChange={hex=>{changed(hex);setValue(hex);}}/>;}
  const {container}=render(<Picker/>);
  expect(container.querySelector('input[type=color]')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Cor: #5989c7'}));
  expect(changed).toHaveBeenLastCalledWith('#5989c7');
  fireEvent.change(screen.getByLabelText('Cor'),{target:{value:'#ff0000'}});
  fireEvent.change(screen.getByLabelText('Tom: Cor'),{target:{value:'120'}});
  expect(changed).toHaveBeenLastCalledWith('#00ff00');
  changed.mockClear();
  fireEvent.change(screen.getByLabelText('Cor'),{target:{value:'#a'}});
  expect(changed).not.toHaveBeenCalled();
  fireEvent.blur(screen.getByLabelText('Cor'));
  expect(screen.getByLabelText('Cor')).toHaveValue('#00ff00');
});
