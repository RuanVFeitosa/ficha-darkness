import React from 'react';
import {render} from '@testing-library/react';
import PageTransition from './pageTransition';
test('transições dos dois sistemas usam o símbolo Darkness',()=>{
 const {container,rerender}=render(<PageTransition active sistema="darkness" simboloSistema/>);
 expect(container.querySelector('img')).toHaveAttribute('src','/simbolo-darkness.png');
 rerender(<PageTransition active sistema="espiral" simboloSistema/>);
 expect(container.querySelector('svg')).toBeNull();expect(container.querySelector('img')).toHaveAttribute('src','/simbolo-darkness.png');
 rerender(<PageTransition active sistema="espiral"/>);
 expect(container.querySelector('img')).toHaveAttribute('src','/simbolo-darkness.png');
});