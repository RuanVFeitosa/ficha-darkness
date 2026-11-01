import React from 'react';
import {render,screen} from '@testing-library/react';
import AttributeDicePool from './AttributeDicePool';
test('representa cada dado de seis faces individualmente',()=>{
 const {rerender}=render(<AttributeDicePool name="Força" value={3}/>);
 expect(screen.getByRole('img',{name:'Força: 3 dados de 6 faces'}).querySelectorAll('svg')).toHaveLength(3);
 rerender(<AttributeDicePool name="Fortitude" value={2}/>);
 expect(screen.getByRole('img',{name:'Fortitude: 2 dados de 6 faces'}).querySelectorAll('svg')).toHaveLength(2);
 rerender(<AttributeDicePool name="Vontade" value={0}/>);
 expect(screen.getByRole('img',{name:'Vontade: 0 dados de 6 faces'}).querySelectorAll('svg')).toHaveLength(0);
});
