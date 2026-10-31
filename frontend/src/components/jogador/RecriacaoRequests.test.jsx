import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import RecriacaoRequests from './RecriacaoRequests';
import {decidirRecriacao} from '../../services/personagemApi';
jest.mock('../../services/personagemApi',()=>({decidirRecriacao:jest.fn()}));
test('mestre compara proposta e aprova a ficha correta de ESPIRAL',async()=>{
 const ficha={fichaId:'espiral:1234',espiralId:'1234',personagem:{name:'Maya',recriacaoPendente:{id:'request',sistema:'espiral',criadoEm:'2026-10-30T12:00:00Z',alteracoes:{name:{antes:'Maya',depois:'Maya Dias'}}}}};
 const saved={name:'Maya Dias',attributes:{pulso:2},recriacaoPendente:null};
 decidirRecriacao.mockResolvedValue(saved);const onSaved=jest.fn();
 render(<RecriacaoRequests fichas={[ficha]} onSaved={onSaved}/>);
 fireEvent.click(screen.getByText('Comparar 1 alterações'));
 expect(screen.getByText('Maya Dias')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Aprovar e aplicar'}));
 await waitFor(()=>expect(onSaved).toHaveBeenCalledWith(ficha,saved));
 expect(decidirRecriacao).toHaveBeenCalledWith('espiral_1234','request','aprovar',expect.any(String));
});
