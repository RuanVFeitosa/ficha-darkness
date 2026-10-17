import React from 'react';
import {render} from '@testing-library/react';
import PageTransition from './pageTransition';
test('entrada da ficha usa o símbolo de cada sistema e demais transições preservam o Universo',()=>{
 const {container,rerender}=render(<PageTransition active sistema="darkness" simboloSistema/>);
 expect(container.querySelector('img')).toHaveAttribute('src','/simbolo-absoluto.png');
 rerender(<PageTransition active sistema="espiral" simboloSistema/>);
 expect(container.querySelector('svg polyline')).toBeInTheDocument();expect(container.querySelector('img')).toBeNull();
 rerender(<PageTransition active sistema="espiral"/>);
 expect(container.querySelector('img')).toHaveAttribute('src','/simbolo-darkness.png');
});