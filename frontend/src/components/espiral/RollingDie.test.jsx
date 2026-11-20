import React from 'react';
import { act, render, screen } from '@testing-library/react';
import RollingDie from './RollingDie';

test.each([4,6,8,10,12,20])('d%s mostra o resultado dentro da face do dado', sides=>{
  const {container}=render(<RollingDie sides={sides} value={sides} rolling={false}/>);
  const die=screen.getByRole('img',{name:`d${sides}: ${sides}`});
  expect(die.querySelector('polygon')).not.toBeNull();
  expect(die.querySelector('text')).toHaveTextContent(String(sides));
  expect(container.querySelector('.is-settled')).not.toBeNull();
});
test('anima faces provisórias e termina no resultado calculado',()=>{
  jest.useFakeTimers();
  const {rerender}=render(<RollingDie sides={8} value={6} rolling/>);
  act(()=>jest.advanceTimersByTime(220));
  expect(screen.getByRole('img',{name:'d8: rolando'})).toBeInTheDocument();
  rerender(<RollingDie sides={8} value={6} rolling={false}/>);
  act(()=>jest.advanceTimersByTime(300));
  expect(screen.getByRole('img',{name:'d8: 6'}).querySelector('text')).toHaveTextContent('6');
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});
