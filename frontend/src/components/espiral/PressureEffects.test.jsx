import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import PressureEffects from './PressureEffects';
import {settlePressure} from '../../utils/pressureEffects';
function Harness({initial}){const [sheet,setSheet]=useState(initial);return <><PressureEffects sheet={sheet} setSheet={setSheet}/><output aria-label="ficha">{JSON.stringify(sheet)}</output></>;}
test('Abalo aparece na faixa sem confirmação nem painel mental',()=>{
 const initial=settlePressure({sanity:10,hope:10,pressure:1},{pressure:[1]}).sheet;
 render(<Harness initial={initial}/>);expect(screen.getByText('Abalo')).toBeInTheDocument();expect(screen.getByText(/−1 dado no próximo teste/)).toBeInTheDocument();expect(screen.queryByRole('dialog')).toBeNull();
});
test('Crise escolhe reação na própria faixa',()=>{
 const initial=settlePressure({sanity:10,hope:10,pressure:2},{pressure:[1,1]}).sheet;
 render(<Harness initial={initial}/>);
 fireEvent.click(screen.getByText('Crise · escolher reação'));
 fireEvent.change(screen.getByLabelText('Reação'),{target:{value:'overload'}});
 fireEvent.click(screen.getByRole('button',{name:'Aplicar'}));
 expect(JSON.parse(screen.getByLabelText('ficha').textContent).pressure).toBe(2);
 expect(screen.queryByText('Crise · escolher reação')).toBeNull();
});
