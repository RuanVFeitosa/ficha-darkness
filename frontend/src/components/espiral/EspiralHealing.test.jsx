import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import EspiralHealing from './EspiralHealing';

test('prévia da cura coincide com o resultado aplicado e remove lesões zeradas',()=>{
 function Form(){const [sheet,setSheet]=useState({integrity:25,injuries:[{id:'a',region:'Torso',impact:5,severity:'Moderada'}]});return <><EspiralHealing sheet={sheet} setSheet={setSheet} region="Torso" regions={['Torso']} maximum={35} onRegionChange={()=>{}}/><div data-testid="sheet">{JSON.stringify(sheet)}</div></>;}
 render(<Form/>);
 expect(screen.getByRole('button',{name:'Aplicar cura'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Pontos de cura'),{target:{value:'5'}});
 expect(screen.getByText('25 → 30')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Aplicar cura'}));
 expect(JSON.parse(screen.getByTestId('sheet').textContent)).toEqual({integrity:30,injuries:[]});
 expect(screen.getByRole('status')).toHaveTextContent('1 lesão(ões) removida(s)');
});
