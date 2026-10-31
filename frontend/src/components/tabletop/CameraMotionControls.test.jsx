import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import CameraMotionControls,{normalizeCameraMotion} from './CameraMotionControls';
test('ajusta intensidade, ritmo, desliga e restaura o balanço',()=>{
 const onChange=jest.fn();
 render(<CameraMotionControls value={{intensity:1,speed:1,pitch:0,roll:0}} onChange={onChange}/>);
 fireEvent.click(screen.getByText('Balanço'));
 fireEvent.change(screen.getByLabelText('Intensidade do balanço'),{target:{value:'1.5'}});
 expect(onChange).toHaveBeenLastCalledWith({intensity:1.5,speed:1,pitch:0,roll:0});
 fireEvent.change(screen.getByLabelText('Ritmo do balanço'),{target:{value:'.5'}});
 expect(onChange).toHaveBeenLastCalledWith({intensity:1,speed:.5,pitch:0,roll:0});
 fireEvent.click(screen.getByRole('button',{name:'Desligar'}));
 expect(onChange).toHaveBeenLastCalledWith({intensity:0,speed:1,pitch:0,roll:0});
 fireEvent.click(screen.getByRole('button',{name:'Restaurar'}));
 expect(onChange).toHaveBeenLastCalledWith({intensity:1,speed:1,pitch:0,roll:0});
});
test('preferências inválidas ficam dentro dos limites',()=>{
 expect(normalizeCameraMotion(null)).toEqual({intensity:1,speed:1,pitch:0,roll:0});
 expect(normalizeCameraMotion({intensity:-10,speed:99})).toEqual({intensity:0,speed:2,pitch:0,roll:0});
 expect(normalizeCameraMotion({intensity:'inválido',speed:'inválido'})).toEqual({intensity:1,speed:1,pitch:0,roll:0});
});

test('inclinação aceita graus e pode ser nivelada sem mudar o balanço',()=>{
 const onChange=jest.fn();render(<CameraMotionControls value={{intensity:1,speed:1,pitch:5,roll:10}} onChange={onChange}/>);
 fireEvent.click(screen.getByText('Balanço'));
 fireEvent.change(screen.getByLabelText('Inclinação lateral em graus'),{target:{value:'12.5'}});
 expect(onChange).toHaveBeenLastCalledWith({intensity:1,speed:1,pitch:5,roll:12.5});
 fireEvent.click(screen.getByRole('button',{name:'Nivelar câmera · 0°'}));
 expect(onChange).toHaveBeenLastCalledWith({intensity:1,speed:1,pitch:0,roll:0});
});
