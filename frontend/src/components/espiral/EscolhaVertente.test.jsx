import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EscolhaVertente from './EscolhaVertente';
function Selection(){const [value,setValue]=useState('Metódica');return <EscolhaVertente value={value} onChange={setValue}/>;}
test('navegação seleciona a vertente e atualiza arte, descrição e habilidade',()=>{
 const {container}=render(<Selection/>);
 expect(screen.getByRole('heading',{name:'Metódica'})).toBeInTheDocument();
 expect(container.querySelector('img')).toHaveAttribute('src','/espiral/vertentes/metodica.png');
 fireEvent.click(screen.getByRole('button',{name:'Próxima →'}));
 expect(screen.getByRole('heading',{name:'Adaptável'})).toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'Improviso'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Adaptável'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'Vigilante'}));
 expect(container.querySelector('img')).toHaveAttribute('src','/espiral/vertentes/vigilante.png');
 expect(screen.getByRole('heading',{name:'Prontidão'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'← Anterior'}));
 expect(screen.getByRole('heading',{name:'Obstinada'})).toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'Recusa'})).toBeInTheDocument();
});
