import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import CutscenePlayer from './CutscenePlayer';

test('player progress bar seeks within the cutscene and displays long durations readably',()=>{
 render(<CutscenePlayer autoPlay={false} project={{duration:3661,layers:[]}}/>);
 fireEvent.change(screen.getByLabelText('Posição da reprodução'),{target:{value:'65'}});
 expect(screen.getByRole('status')).toHaveTextContent('1:05 / 1:01:01');
 expect(screen.getByRole('button',{name:'Reproduzir'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Reiniciar'}));
 expect(screen.getByLabelText('Posição da reprodução')).toHaveValue('0');
 expect(screen.getByRole('button',{name:'Pausar'})).toBeInTheDocument();
});

test('viewer mode renders only the cutscene with no controls or progress UI',()=>{
 render(<CutscenePlayer controls={false} project={{duration:10,layers:[{type:'image',src:'/scene.png',name:'Cena',fadeIn:0,fadeOut:0}]}}/>);
 expect(screen.getByAltText('Cena')).toHaveAttribute('src','/scene.png');
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
 expect(screen.queryByRole('slider')).not.toBeInTheDocument();
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
