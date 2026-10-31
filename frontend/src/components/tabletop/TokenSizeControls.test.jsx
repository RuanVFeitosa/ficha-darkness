import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import TokenSizeControls from './TokenSizeControls';
test('aceita porcentagem decimal sem saltar durante a digitação',()=>{
 const onChange=jest.fn();
 function Demo(){const [scale,setScale]=React.useState(.1);return <TokenSizeControls scale={scale} onChange={next=>{onChange(next);setScale(next);}}/>;}
 render(<Demo/>);
 const input=screen.getByLabelText('Tamanho do token em porcentagem');
 fireEvent.focus(input);fireEvent.change(input,{target:{value:''}});
 expect(input).toHaveValue(null);
 fireEvent.change(input,{target:{value:'12.5'}});
 expect(onChange).toHaveBeenLastCalledWith(.125);
 fireEvent.blur(input);expect(input).toHaveValue(12.5);
});
test('ajustes finos respeitam os limites de escala',()=>{
 const onChange=jest.fn();const view=render(<TokenSizeControls scale={.1} onChange={onChange}/>);
 fireEvent.click(screen.getByRole('button',{name:'+1%'}));expect(onChange).toHaveBeenLastCalledWith(.11);
 view.rerender(<TokenSizeControls scale={.01} onChange={onChange}/>);
 expect(screen.getByRole('button',{name:'−1%'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Tamanho do token em porcentagem'),{target:{value:'999'}});
 fireEvent.blur(screen.getByLabelText('Tamanho do token em porcentagem'));expect(onChange).toHaveBeenLastCalledWith(3);
});
