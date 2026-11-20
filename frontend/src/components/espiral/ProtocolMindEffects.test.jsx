import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtocolMindEffects, { protocolMindState } from './ProtocolMindEffects';

test.each([[10,'clear'],[7,'clear'],[6,'uncertain'],[4,'uncertain'],[3,'fragmented'],[1,'fragmented'],[0,'rupture']])('Sanidade %s usa percepção %s', (value, stage) => {
  expect(protocolMindState(value,10).perception).toBe(stage);
});
test('Esperança controla a saturação sem alterar Sanidade',()=>{
  expect(protocolMindState(10,5)).toMatchObject({perception:'clear',saturation:.5});
  expect(protocolMindState(0,10)).toMatchObject({perception:'rupture',saturation:1});
  expect(protocolMindState(10,-2).saturation).toBe(0);
});
test('efeitos desaparecem ao recuperar os recursos e frases personalizadas surgem com Esperança zero',()=>{
  const {container,rerender}=render(<ProtocolMindEffects sanity={0} hope={0} messages={['Ainda existe um caminho.']}/>);
  expect(container.querySelector('.is-rupture')).toBeInTheDocument();
  expect(screen.getByText('Ainda existe um caminho.')).toBeInTheDocument();
  rerender(<ProtocolMindEffects sanity={10} hope={10}/>);
  expect(container.querySelector('.pd-perception-field')).toBeNull();
  expect(container.querySelector('.abs-hope-whispers')).toBeNull();
});


test('Darkness usa um único efeito para as duas reservas, sem símbolos dos outros temas',()=>{
 const {container,rerender}=render(<ProtocolMindEffects sanity={9} hope={10}/>);
 expect(container.querySelectorAll('.pd-darkness-resonance')).toHaveLength(1);
 expect(container.querySelector('.pd-absoluto-echo')).toBeNull();expect(container.querySelector('.pd-hope-orbit')).toBeNull();
 expect(container.querySelector('.pd-darkness-resonance').style.getPropertyValue('--mind-fracture')).toBe('0.1');
 rerender(<ProtocolMindEffects sanity={0} hope={2}/>);
 expect(container.querySelectorAll('.pd-darkness-resonance')).toHaveLength(1);
 expect(container.querySelector('.pd-darkness-resonance').style.getPropertyValue('--mind-fading')).toBe('0.8');
 rerender(<ProtocolMindEffects sanity={10} hope={10}/>);
 expect(container.querySelector('.pd-darkness-resonance')).toBeNull();
});
test.each(['espiral','absoluto'])('tema %s mantém só o próprio símbolo nas perdas',symbol=>{
 const {container,rerender}=render(<ProtocolMindEffects symbol={symbol} sanity={0} hope={0}/>);
 expect(container.querySelector('.pd-darkness-resonance')).toBeNull();
 expect(Boolean(container.querySelector('.pd-absoluto-echo'))).toBe(symbol==='absoluto');
 expect(Boolean(container.querySelector('.pd-hope-orbit'))).toBe(symbol==='espiral');
 rerender(<ProtocolMindEffects symbol={symbol} sanity={10} hope={9}/>);
 expect(container.querySelector(symbol==='absoluto'?'.pd-absoluto-echo':'.pd-hope-orbit')).toBeInTheDocument();
});
