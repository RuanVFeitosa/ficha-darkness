import React from 'react';
import {act,render} from '@testing-library/react';
import ContextTransition from './ContextTransition';
beforeEach(() => jest.useFakeTimers());
afterEach(() => {jest.runOnlyPendingTimers();jest.useRealTimers();});
test('trocar área ou cena dispara espiral e atualizações na mesma cena não reiniciam', () => {
 const {container,rerender}=render(<ContextTransition contextKey="scene"/>);
 expect(container.querySelector('.active')).toBeNull();
 rerender(<ContextTransition contextKey="map"/>);
 expect(container.querySelector('.page-transition-espiral.active')).not.toBeNull();
 act(() => jest.advanceTimersByTime(600));
 rerender(<ContextTransition contextKey="map"/>);
 act(() => jest.advanceTimersByTime(400));
 expect(container.querySelector('.active')).toBeNull();
});
test('outras áreas não recebem a animação quando ESPIRAL está desativado', () => {
 const {container,rerender}=render(<ContextTransition contextKey="a" enabled={false}/>);
 rerender(<ContextTransition contextKey="b" enabled={false}/>);
 expect(container.querySelector('.active')).toBeNull();
});