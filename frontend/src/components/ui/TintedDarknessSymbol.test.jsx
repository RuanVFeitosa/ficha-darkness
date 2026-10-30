import React from 'react';
import { render } from '@testing-library/react';
import TintedDarknessSymbol from './TintedDarknessSymbol';

test('cada símbolo usa máscara própria e atualiza a cor diretamente', () => {
 const view = render(<><TintedDarknessSymbol cor="#002ee6"/><TintedDarknessSymbol cor="#ff0000"/></>);
 const masks = view.container.querySelectorAll('mask');
 expect(masks[0].id).not.toBe(masks[1].id);
 expect(view.container.querySelector('rect')).toHaveAttribute('fill', '#002ee6');
 expect(view.container.querySelector('rect')).toHaveAttribute('mask', `url(#${masks[0].id})`);
 view.rerender(<TintedDarknessSymbol cor="#00aa00"/>);
 expect(view.container.querySelector('rect')).toHaveAttribute('fill', '#00aa00');
});
