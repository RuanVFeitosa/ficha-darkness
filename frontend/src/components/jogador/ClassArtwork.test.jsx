import React from 'react';
import {act,render} from '@testing-library/react';
import ClassArtwork from './ClassArtwork';
test('mantém a imagem anterior durante a transição e limpa após trocas rápidas',()=>{
 jest.useFakeTimers();
 const a={id:'a',imagem:'/a.webp'},b={id:'b',imagem:'/b.webp'},c={id:'c',imagem:'/c.webp'};
 const view=render(<ClassArtwork classe={a}/>);
 view.rerender(<ClassArtwork classe={b}/>);
 expect(view.container.querySelectorAll('img')).toHaveLength(2);
 expect(view.container.querySelector('.classe-imagem-saida')).toHaveAttribute('src','/a.webp');
 view.rerender(<ClassArtwork classe={c}/>);
 expect(view.container.querySelectorAll('img')).toHaveLength(2);
 expect(view.container.querySelector('.classe-imagem-entrada')).toHaveAttribute('src','/c.webp');
 act(()=>jest.advanceTimersByTime(650));
 expect(view.container.querySelectorAll('img')).toHaveLength(1);
 expect(view.container.querySelector('img')).toHaveAttribute('src','/c.webp');
 view.unmount();jest.useRealTimers();
});
