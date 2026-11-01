import React from 'react';
import {render} from '@testing-library/react';
import HopeVoid from './HopeVoid';
import {SanityZeroSymbol} from './SanityStatic';
test('Esperança zero mostra símbolo e esvaziamento sem exigir Sanidade zero',()=>{
 const {container,rerender}=render(<><SanityZeroSymbol resource={{atual:10}} hopeResource={{atual:0}}/><HopeVoid resource={{atual:0}}/><HopeVoid resource={{atual:0}} portrait/></>);
 expect(container.querySelector('.abs-sanity-zero-symbol.is-hopeless')).toBeInTheDocument();
 expect(document.body.querySelectorAll('.abs-hope-void')).toHaveLength(2);
 rerender(<><SanityZeroSymbol resource={{atual:10}} hopeResource={{atual:1}}/><HopeVoid resource={{atual:1}}/></>);
 expect(container.querySelector('.abs-sanity-zero-symbol')).toBeNull();
 expect(document.body.querySelector('.abs-hope-void')).toBeNull();
});
test('os dois recursos zerados compartilham um único símbolo e preservam o efeito de Sanidade',()=>{
 const {container}=render(<SanityZeroSymbol resource={{atual:0}} hopeResource={{atual:0}}/>);
 expect(container.querySelectorAll('.abs-sanity-zero-symbol')).toHaveLength(1);
 expect(container.querySelector('.is-hopeless')).toBeNull();
});

test.each([{cabeca:{atual:0},torso:{atual:10}},{cabeca:{atual:10},torso:{atual:0}},{cabeca:{atual:0},torso:{atual:0}}])('símbolo aparece em Morrendo pela cabeça ou tórax zerados: %j',membros=>{
 const {container,rerender}=render(<SanityZeroSymbol resource={{atual:10}} hopeResource={{atual:5}} membros={membros}/>);
 expect(container.querySelectorAll('.abs-sanity-zero-symbol.is-dying')).toHaveLength(1);
 rerender(<SanityZeroSymbol resource={{atual:10}} hopeResource={{atual:5}} membros={{cabeca:{atual:1},torso:{atual:1},bracoDireito:{atual:0}}}/>);
 expect(container.querySelector('.abs-sanity-zero-symbol')).toBeNull();
});
