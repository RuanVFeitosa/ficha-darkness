import React from 'react';
import {render,screen} from '@testing-library/react';
import BodyProtectionSummary from './BodyProtectionSummary';

test('ícones exibem equipamento mais adicionais em vez da resistência por tipo de dano',()=>{
 const {container,rerender}=render(<BodyProtectionSummary members={{cabeca:{defesa:1},torso:{defesaAdicional:2}}} defensesFor={key=>key==='cabeca'?[{defesaBonus:1,resistenciasDano:[{tipo:'estilhaco',reducao:5}]}]:key==='torso'?[{defesaBonus:3,resistenciasDano:[{tipo:'projetil',reducao:10}]}]:[]}/>);
 expect(screen.getByRole('img',{name:'Cabeça: 1 de Defesa Total'})).toHaveTextContent('1');
 expect(screen.getByRole('img',{name:'Tórax: 5 de Defesa Total'})).toHaveTextContent('5');
 expect(container.querySelectorAll('svg')).toHaveLength(2);
 expect(screen.queryByText(/estilhaco|projetil/)).not.toBeInTheDocument();
 rerender(<BodyProtectionSummary members={{torso:{defesaAdicional:2}}}/>);
 expect(screen.getByRole('img',{name:'Tórax: 2 de Defesa Total'})).toBeInTheDocument();
 expect(screen.queryByRole('img',{name:/Cabeça/})).not.toBeInTheDocument();
});
