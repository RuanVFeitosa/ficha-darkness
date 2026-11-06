import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import PlayerCameraDistance,{normalizePlayerDistance,minimumPlayerDistance} from './PlayerCameraDistance';

test('limite de aproximação acompanha a altura do personagem e aparece no controle',()=>{
 const minimum=minimumPlayerDistance(.651),change=jest.fn();
 expect(minimum).toBe(.6);
 expect(normalizePlayerDistance(.2,minimum)).toBe(.6);
 render(<PlayerCameraDistance minimum={minimum} value={.6} onChange={change}/>);
 const slider=screen.getByLabelText('Ajustar distância da câmera');
 expect(slider).toHaveAttribute('min','0.6');
 fireEvent.change(slider,{target:{value:'0.8'}});
 expect(change).toHaveBeenCalledWith(.8);
});

test('preferência vazia não aproxima a câmera do corpo por acidente',()=>{
 expect(normalizePlayerDistance(null)).toBe(1.5);
 expect(normalizePlayerDistance('')).toBe(1.5);
});
